
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { InfoIcon, Thermometer, TrendingDown, Loader2 } from 'lucide-react';
import { getRaptFermentationData } from '@/ai/flows/getRaptFermentationDataFlow';
import type { RaptFermentationDataInput, RaptFermentationDataOutput, FermentationDataPoint } from '@/types/rapt-flow-types';

interface RecipeGraphsTabProps {
  recipeSlug: string;
}

export const RecipeGraphsTab: React.FC<RecipeGraphsTabProps> = ({ recipeSlug }) => {
  const [fermentationData, setFermentationData] = useState<FermentationDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flowErrorMessage, setFlowErrorMessage] = useState<string | null>(null);

  // IMPORTANT: Replace this placeholder with your actual RAPT Pill Telemetry ID to test.
  const actualRaptPillId = "YOUR_ACTUAL_RAPT_PILL_TELEMETRY_ID_HERE";

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setFlowErrorMessage(null);
      try {
        if (actualRaptPillId === "YOUR_ACTUAL_RAPT_PILL_TELEMETRY_ID_HERE") {
          console.warn(`RecipeGraphsTab: Using placeholder RAPT Pill ID. Replace "YOUR_ACTUAL_RAPT_PILL_TELEMETRY_ID_HERE" in the code with a real ID to fetch data.`);
          setError("Placeholder RAPT Pill ID is being used. Update the code with a real ID.");
          setFermentationData([]);
          setIsLoading(false);
          return;
        }
        
        const input: RaptFermentationDataInput = { raptPillId: actualRaptPillId };
        
        console.log(`RecipeGraphsTab: Calling getRaptFermentationData for RAPT Pill ID: ${input.raptPillId}`);
        const result: RaptFermentationDataOutput = await getRaptFermentationData(input);
        
        if (result) {
          if (result.error) {
            console.error('RecipeGraphsTab: Error from RAPT flow:', result.error);
            setFlowErrorMessage(result.error);
            setFermentationData([]);
          } else if (result.data) {
            console.log(`RecipeGraphsTab: Received ${result.data.length} data points from flow.`);
            setFermentationData(result.data);
          } else {
             console.error('RecipeGraphsTab: No data or error received from flow, result is:', result);
             setError('Failed to load fermentation data: Unexpected response from the backend.');
             setFermentationData([]);
          }
        } else {
          console.error('RecipeGraphsTab: Undefined result from getRaptFermentationData flow.');
          setError('Failed to load fermentation data: No response from the backend.');
          setFermentationData([]);
        }
      } catch (e) {
        console.error('RecipeGraphsTab: Exception while fetching fermentation data:', e);
        setError(e instanceof Error ? e.message : 'An unknown error occurred while fetching data.');
        setFermentationData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [recipeSlug, actualRaptPillId]); // actualRaptPillId added to dependency array

  let alertMessage = "This section attempts to display fermentation data from a RAPT Pill by calling a Genkit flow. Ensure RAPTPILLMAIL and RAPTPillPassword environment variables are set on Vercel for the RAPT API integration to work.";
  if (actualRaptPillId === "YOUR_ACTUAL_RAPT_PILL_TELEMETRY_ID_HERE") {
    alertMessage = `To fetch real data, please edit the file src/components/recipes/RecipeGraphsTab.tsx and replace "YOUR_ACTUAL_RAPT_PILL_TELEMETRY_ID_HERE" with your actual RAPT Pill telemetry ID. Also, ensure RAPTPILLMAIL and RAPTPillPassword environment variables are correctly set.`;
  } else if (flowErrorMessage) {
    alertMessage = `Error fetching RAPT data: ${flowErrorMessage}. Please check server logs, environment variables (RAPTPILLMAIL, RAPTPillPassword), and ensure the RAPT Pill ID ("${actualRaptPillId}") is correct.`;
  } else if (error && !flowErrorMessage) { // Display general error only if no specific flow error
     alertMessage = `Could not load fermentation data: ${error}. This might be a client-side issue or a problem reaching the backend flow.`;
  }


  return (
    <div className="space-y-6">
      <Alert variant={error || flowErrorMessage || actualRaptPillId === "YOUR_ACTUAL_RAPT_PILL_TELEMETRY_ID_HERE" ? "destructive" : "default"}>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>{error || flowErrorMessage ? "Data Fetch Error" : "Fermentation Data"}</AlertTitle>
        <AlertDescription>
          {alertMessage}
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Thermometer className="mr-2 h-5 w-5 text-primary" />
            Temperature Over Time
          </CardTitle>
          <CardDescription>Fermentation temperature from RAPT Pill.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading temperature data...</p>
            </div>
          ) : fermentationData.length > 0 ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={fermentationData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false}/>
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    domain={['dataMin - 1', 'dataMax + 1']}
                    tickFormatter={(value) => `${value}°C`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend wrapperStyle={{color: 'hsl(var(--muted-foreground))'}}/>
                  <Line type="monotone" dataKey="temperature" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Temp (°C)" connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-10">No temperature data available. Ensure your RAPT Pill ID is correct and has recent data, or check error messages above.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingDown className="mr-2 h-5 w-5 text-primary" />
            Gravity Over Time (SG)
          </CardTitle>
          <CardDescription>Specific gravity during fermentation from RAPT Pill.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading gravity data...</p>
            </div>
          ) : fermentationData.length > 0 ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={fermentationData} margin={{ top: 5, right: 20, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    domain={['dataMin - 0.002', 'dataMax + 0.002']}
                    tickFormatter={(value) => value.toFixed(3)}
                    allowDataOverflow={true}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => typeof value === 'number' ? value.toFixed(3) : value}
                  />
                  <Legend wrapperStyle={{color: 'hsl(var(--muted-foreground))'}} />
                  <Line type="monotone" dataKey="gravity" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} name="SG" connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-10">No gravity data available. Ensure your RAPT Pill ID is correct and has recent data, or check error messages above.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
