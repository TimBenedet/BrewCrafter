
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { InfoIcon, Thermometer, TrendingDown, Loader2 } from 'lucide-react';
import { getRaptFermentationData, type RaptFermentationDataInput, type RaptFermentationDataOutput } from '@/ai/flows/getRaptFermentationDataFlow';

interface RecipeGraphsTabProps {
  recipeSlug: string;
}

interface FermentationDataPoint {
  time: string;
  temperature?: number;
  gravity?: number;
}

export const RecipeGraphsTab: React.FC<RecipeGraphsTabProps> = ({ recipeSlug }) => {
  const [fermentationData, setFermentationData] = useState<FermentationDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // For now, using a placeholder RAPT Pill ID.
        // In a real app, this ID might be stored with the recipe or configured by the user.
        const placeholderRaptPillId = `RAPT_PILL_FOR_${recipeSlug.toUpperCase()}`;
        const input: RaptFermentationDataInput = { raptPillId: placeholderRaptPillId };
        
        console.log(`RecipeGraphsTab: Fetching data for RAPT Pill ID: ${input.raptPillId}`);
        const result: RaptFermentationDataOutput = await getRaptFermentationData(input);
        
        if (result && result.data) {
          console.log(`RecipeGraphsTab: Received ${result.data.length} data points from flow.`);
          setFermentationData(result.data);
        } else {
          console.error('RecipeGraphsTab: No data received from flow or data is malformed.');
          setError('Failed to load fermentation data from the backend.');
          setFermentationData([]);
        }
      } catch (e) {
        console.error('RecipeGraphsTab: Error fetching fermentation data:', e);
        setError(e instanceof Error ? e.message : 'An unknown error occurred while fetching data.');
        setFermentationData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [recipeSlug]);

  return (
    <div className="space-y-6">
      <Alert variant={error ? "destructive" : "default"}>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>{error ? "Data Fetch Error" : "Fermentation Data (Simulated)"}</AlertTitle>
        <AlertDescription>
          {error 
            ? `Could not load fermentation data: ${error}. This currently uses a placeholder flow.`
            : "This section displays simulated fermentation data. For real data, the Genkit flow 'getRaptFermentationDataFlow.ts' needs to be updated with your RAPT Cloud API details."}
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Thermometer className="mr-2 h-5 w-5 text-primary" />
            Temperature Over Time
          </CardTitle>
          <CardDescription>Simulated fermentation temperature.</CardDescription>
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
                  <Line type="monotone" dataKey="temperature" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Temp (°C)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-10">No temperature data available.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingDown className="mr-2 h-5 w-5 text-primary" />
            Gravity Over Time (SG)
          </CardTitle>
          <CardDescription>Simulated specific gravity during fermentation.</CardDescription>
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
                    formatter={(value: number) => value.toFixed(3)}
                  />
                  <Legend wrapperStyle={{color: 'hsl(var(--muted-foreground))'}} />
                  <Line type="monotone" dataKey="gravity" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} name="SG" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-10">No gravity data available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
