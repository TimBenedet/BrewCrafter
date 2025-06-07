
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
    console.log('getRaptFermentationDataFlow: Flow started with input:', JSON.stringify(input));

    const raptMail = process.env.RAPTPILLMAIL;
    const raptPassword = process.env.RAPTPillPassword;

    if (!raptMail || !raptPassword) {
      console.error('getRaptFermentationDataFlow: RAPTPILLMAIL or RAPTPillPassword environment variables are NOT SET.');
      // Consider throwing an error here or returning a specific error structure if appropriate for UI
      return { data: [] , error: 'RAPT API credentials are not configured in server environment variables.' } as any; 
    }
    console.log('getRaptFermentationDataFlow: RAPTPILLMAIL and RAPTPillPassword environment variables found.');

    let accessToken = '';

    // 1. Fetch Access Token
    try {
      const tokenUrl = 'https://id.rapt.io/connect/token';
      const tokenParams = new URLSearchParams();
      tokenParams.append('client_id', 'rapt-user');
      tokenParams.append('grant_type', 'password');
      tokenParams.append('username', raptMail);
      tokenParams.append('password', raptPassword);

      console.log(`getRaptFermentationDataFlow: Attempting to fetch RAPT access token from URL: ${tokenUrl}`);
      console.log(`getRaptFermentationDataFlow: Token request body: client_id=rapt-user, grant_type=password, username=${raptMail}, password=[REDACTED]`);
      
      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: tokenParams.toString(),
      });

      console.log(`getRaptFermentationDataFlow: RAPT token API response status: ${tokenResponse.status}`);

      if (!tokenResponse.ok) {
        const errorBody = await tokenResponse.text();
        console.error(`getRaptFermentationDataFlow: Error fetching RAPT token. Status: ${tokenResponse.status} ${tokenResponse.statusText}. Response Body:`, errorBody);
        // Return empty data on token fetch error to prevent UI crash, error is logged.
        return { data: [], error: `Failed to authenticate with RAPT API: ${tokenResponse.statusText}. Details: ${errorBody}` } as any;
      }

      const tokenData = await tokenResponse.json();
      if (!tokenData.access_token) {
        console.error('getRaptFermentationDataFlow: access_token NOT FOUND in RAPT API response. Response data:', JSON.stringify(tokenData));
        // Return empty data if token is missing.
        return { data: [], error: 'Failed to retrieve access_token from RAPT API.' } as any;
      }
      accessToken = tokenData.access_token;
      console.log('getRaptFermentationDataFlow: RAPT access token obtained successfully.');

    } catch (error: any) {
      console.error('getRaptFermentationDataFlow: Exception during RAPT token fetch:', error.message, error.stack);
      return { data: [], error: `Exception during RAPT token fetch: ${error.message}` } as any;
    }

    // 2. Fetch Telemetry Data
    try {
      const apiRaptPillId = input.raptPillId;
      const range = '7d'; // Default range, can be made configurable later
      const telemetryUrl = `https://api.rapt.io/v1/hydrometer/${apiRaptPillId}/telemetry?duration=${range}`;
      
      console.log(`getRaptFermentationDataFlow: Attempting to fetch telemetry for Pill ID ${apiRaptPillId} with range ${range}. URL: ${telemetryUrl}`);
      console.log(`getRaptFermentationDataFlow: Using Access Token: ${accessToken.substring(0, 20)}...[REDACTED]`);

      const telemetryResponse = await fetch(telemetryUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });
      
      console.log(`getRaptFermentationDataFlow: RAPT telemetry API response status: ${telemetryResponse.status}`);

      if (!telemetryResponse.ok) {
        const errorBody = await telemetryResponse.text();
        console.error(`getRaptFermentationDataFlow: Error fetching RAPT telemetry. Status: ${telemetryResponse.status} ${telemetryResponse.statusText}. Response Body:`, errorBody);
        return { data: [], error: `Failed to fetch data from RAPT API for Pill ID ${apiRaptPillId}: ${telemetryResponse.statusText}. Details: ${errorBody}` } as any;
      }

      const rawData: any[] = await telemetryResponse.json(); // Expecting an array of telemetry objects
      console.log(`getRaptFermentationDataFlow: Received ${rawData.length} raw telemetry data points.`);
      if (rawData.length > 0) {
        console.log(`getRaptFermentationDataFlow: First raw data point:`, JSON.stringify(rawData[0]));
      }


      // 3. Transform Data
      if (!Array.isArray(rawData)) {
          console.warn('getRaptFermentationDataFlow: RAPT telemetry data is not an array. Unable to process.');
          return { data: [] };
      }
      if (rawData.length === 0) {
        console.log('getRaptFermentationDataFlow: RAPT telemetry data array is empty. No data to transform.');
        return { data: [] };
      }

      // Use the timestamp of the first valid data point as the baseline
      let firstValidTimestampMillis: number | null = null;
      for (const item of rawData) {
        if (item && typeof item.timestamp === 'string') {
          const ts = new Date(item.timestamp).getTime();
          if (!isNaN(ts)) {
            firstValidTimestampMillis = ts;
            break;
          }
        }
      }
      
      if (firstValidTimestampMillis === null) {
        console.warn('getRaptFermentationDataFlow: No valid timestamps found in raw data to use as a baseline. Formatting time as 0d 0h for all points.');
      } else {
        console.log(`getRaptFermentationDataFlow: Using first valid timestamp as baseline: ${new Date(firstValidTimestampMillis).toISOString()}`);
      }


      const formattedData: FermentationDataPoint[] = rawData.map((item: any, index: number) => {
        if (!item || typeof item.timestamp !== 'string' ) {
          console.warn(`getRaptFermentationDataFlow: Skipping malformed data point at index ${index} due to missing or invalid timestamp:`, item);
          return null; 
        }

        const currentTimestampMillis = new Date(item.timestamp).getTime();
        let displayTime: string;

        if (isNaN(currentTimestampMillis)) {
            console.warn(`getRaptFermentationDataFlow: Invalid timestamp for item at index ${index}: ${item.timestamp}. Defaulting display time.`);
            displayTime = "Invalid Time";
        } else if (firstValidTimestampMillis === null) {
            displayTime = "0d 0h"; // Fallback if no valid baseline
        } else {
            const diffMillis = currentTimestampMillis - firstValidTimestampMillis;
            const diffHoursTotal = Math.floor(diffMillis / (1000 * 60 * 60));
            const diffDays = Math.floor(diffHoursTotal / 24);
            const hourInDay = diffHoursTotal % 24;
            displayTime = `${diffDays}d ${hourInDay}h`;
        }
        
        const tempValue = typeof item.temperature === 'number' ? parseFloat(item.temperature.toFixed(1)) : (typeof item.temperature === 'string' ? parseFloat(parseFloat(item.temperature).toFixed(1)) : undefined);
        const gravValue = typeof item.gravity === 'number' ? parseFloat(item.gravity.toFixed(3)) : (typeof item.gravity === 'string' ? parseFloat(parseFloat(item.gravity).toFixed(3)) : undefined);

        if (tempValue === undefined && gravValue === undefined) {
            console.warn(`getRaptFermentationDataFlow: Data point at index ${index} has no valid temperature or gravity. Timestamp: ${item.timestamp}. Skipping point.`);
            return null;
        }

        return {
          time: displayTime,
          temperature: !isNaN(tempValue!) ? tempValue : undefined,
          gravity: !isNaN(gravValue!) ? gravValue : undefined,
        };
      }).filter(Boolean) as FermentationDataPoint[]; // Filter out nulls

      console.log(`getRaptFermentationDataFlow: Transformed ${formattedData.length} valid data points.`);
      if (formattedData.length > 0) {
        console.log(`getRaptFermentationDataFlow: First formatted data point:`, JSON.stringify(formattedData[0]));
      }
      return { data: formattedData };

    } catch (error: any) {
      console.error('getRaptFermentationDataFlow: Exception during RAPT telemetry fetch or data transformation:', error.message, error.stack);
      return { data: [], error: `Exception during RAPT telemetry fetch or transformation: ${error.message}` } as any; 
    }
  }
);

