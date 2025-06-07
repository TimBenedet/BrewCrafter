
'use server';
/**
 * @fileOverview A Genkit flow to fetch fermentation data from RAPT Cloud API.
 *
 * - getRaptFermentationData - A function that fetches fermentation data.
 * - RaptFermentationDataInput - The input type.
 * - RaptFermentationDataOutput - The return type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Data structure for fermentation points used by the UI
interface FermentationDataPoint {
  time: string; // Formatted time string for X-axis display
  temperature?: number; // Celsius
  gravity?: number; // SG
}

export const RaptFermentationDataInputSchema = z.object({
  raptPillId: z.string().describe('The ID of the RAPT Pill device (telemetry ID).'),
  // Potentially add dateRange or other query parameters here in the future
});
export type RaptFermentationDataInput = z.infer<typeof RaptFermentationDataInputSchema>;

const FermentationDataPointSchema = z.object({
  time: z.string(),
  temperature: z.number().optional(),
  gravity: z.number().optional(),
});

export const RaptFermentationDataOutputSchema = z.object({
  data: z.array(FermentationDataPointSchema).describe('Array of fermentation data points.'),
});
export type RaptFermentationDataOutput = z.infer<typeof RaptFermentationDataOutputSchema>;

export async function getRaptFermentationData(input: RaptFermentationDataInput): Promise<RaptFermentationDataOutput> {
  return getRaptFermentationDataFlow(input);
}

const getRaptFermentationDataFlow = ai.defineFlow(
  {
    name: 'getRaptFermentationDataFlow',
    inputSchema: RaptFermentationDataInputSchema,
    outputSchema: RaptFermentationDataOutputSchema,
  },
  async (input) => {
    console.log('getRaptFermentationDataFlow called with input:', input);

    const raptMail = process.env.RAPTPILLMAIL;
    const raptPassword = process.env.RAPTPillPassword;

    if (!raptMail || !raptPassword) {
      console.error('getRaptFermentationDataFlow: RAPTPILLMAIL or RAPTPillPassword environment variables are not set.');
      throw new Error('RAPT API credentials are not configured in environment variables.');
    }

    let accessToken = '';

    // 1. Fetch Access Token
    try {
      const tokenUrl = 'https://id.rapt.io/connect/token';
      const tokenParams = new URLSearchParams();
      tokenParams.append('client_id', 'rapt-user');
      tokenParams.append('grant_type', 'password');
      tokenParams.append('username', raptMail);
      tokenParams.append('password', raptPassword);

      console.log('getRaptFermentationDataFlow: Attempting to fetch RAPT access token...');
      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: tokenParams.toString(),
      });

      if (!tokenResponse.ok) {
        const errorBody = await tokenResponse.text();
        console.error(`getRaptFermentationDataFlow: Error fetching RAPT token: ${tokenResponse.status} ${tokenResponse.statusText}`, errorBody);
        throw new Error(`Failed to authenticate with RAPT API: ${tokenResponse.statusText}. Details: ${errorBody}`);
      }

      const tokenData = await tokenResponse.json();
      if (!tokenData.access_token) {
        console.error('getRaptFermentationDataFlow: access_token not found in RAPT response', tokenData);
        throw new Error('Failed to retrieve access token from RAPT API.');
      }
      accessToken = tokenData.access_token;
      console.log('getRaptFermentationDataFlow: RAPT access token obtained successfully.');

    } catch (error) {
      console.error('getRaptFermentationDataFlow: Exception during RAPT token fetch:', error);
      // Return empty data on token fetch error to prevent UI crash, error is logged.
      return { data: [] };
    }

    // 2. Fetch Telemetry Data
    try {
      const apiRaptPillId = input.raptPillId;
      const range = '7d'; // Default range, can be made configurable
      const telemetryUrl = `https://api.rapt.io/v1/hydrometer/${apiRaptPillId}/telemetry?duration=${range}`;
      
      console.log(`getRaptFermentationDataFlow: Attempting to fetch telemetry for Pill ID ${apiRaptPillId} with range ${range} using URL: ${telemetryUrl}`);
      const telemetryResponse = await fetch(telemetryUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (!telemetryResponse.ok) {
        const errorBody = await telemetryResponse.text();
        console.error(`getRaptFermentationDataFlow: Error fetching RAPT telemetry: ${telemetryResponse.status} ${telemetryResponse.statusText}`, errorBody);
        throw new Error(`Failed to fetch data from RAPT API for Pill ID ${apiRaptPillId}: ${telemetryResponse.statusText}. Details: ${errorBody}`);
      }

      const rawData: any[] = await telemetryResponse.json(); // Expecting an array of telemetry objects
      console.log(`getRaptFermentationDataFlow: Received ${rawData.length} raw telemetry data points. First item if array:`, rawData.length > 0 ? rawData[0] : 'empty array');

      // 3. Transform Data
      if (!Array.isArray(rawData)) {
          console.warn('getRaptFermentationDataFlow: RAPT telemetry data is not an array. Unable to process.');
          return { data: [] };
      }
      if (rawData.length === 0) {
        console.log('getRaptFermentationDataFlow: RAPT telemetry data array is empty.');
        return { data: [] };
      }

      const firstTimestampMillis = new Date(rawData[0].timestamp).getTime();

      const formattedData: FermentationDataPoint[] = rawData.map((item: any, index: number) => {
        if (!item || typeof item.timestamp !== 'string' ) {
          console.warn(`getRaptFermentationDataFlow: Skipping malformed data point at index ${index}:`, item);
          return null; 
        }

        const currentTimestampMillis = new Date(item.timestamp).getTime();
        let displayTime: string;

        if (index === 0 || isNaN(firstTimestampMillis) || isNaN(currentTimestampMillis)) {
            displayTime = "0d 0h";
        } else {
            const diffMillis = currentTimestampMillis - firstTimestampMillis;
            const diffHoursTotal = Math.floor(diffMillis / (1000 * 60 * 60));
            const diffDays = Math.floor(diffHoursTotal / 24);
            const hourInDay = diffHoursTotal % 24;
            displayTime = `${diffDays}d ${hourInDay}h`;
        }

        return {
          time: displayTime,
          temperature: typeof item.temperature === 'number' ? parseFloat(item.temperature.toFixed(1)) : undefined,
          gravity: typeof item.gravity === 'number' ? parseFloat(item.gravity.toFixed(3)) : undefined,
        };
      }).filter(Boolean) as FermentationDataPoint[];

      console.log(`getRaptFermentationDataFlow: Returning ${formattedData.length} formatted data points.`);
      return { data: formattedData };

    } catch (error) {
      console.error('getRaptFermentationDataFlow: Exception during RAPT telemetry fetch or data transformation:', error);
      return { data: [] }; // Return empty data on error
    }
  }
);
