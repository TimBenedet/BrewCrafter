
import { z } from 'zod';

// Data structure for fermentation points used by the UI and flow output
export const FermentationDataPointSchema = z.object({
  time: z.string().describe("Formatted time string for X-axis display, e.g., '0d 0h'"),
  temperature: z.number().optional().describe("Temperature in Celsius"),
  gravity: z.number().optional().describe("Specific Gravity (SG)"),
});
export type FermentationDataPoint = z.infer<typeof FermentationDataPointSchema>;

export const RaptFermentationDataInputSchema = z.object({
  raptPillId: z.string().describe('The ID of the RAPT Pill device (telemetry ID).'),
});
export type RaptFermentationDataInput = z.infer<typeof RaptFermentationDataInputSchema>;

export const RaptFermentationDataOutputSchema = z.object({
  data: z.array(FermentationDataPointSchema).describe('Array of fermentation data points.'),
  error: z.string().optional().describe('Optional error message if data fetching failed.'),
});
export type RaptFermentationDataOutput = z.infer<typeof RaptFermentationDataOutputSchema>;
