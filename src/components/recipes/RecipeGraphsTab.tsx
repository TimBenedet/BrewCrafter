
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { InfoIcon, Thermometer, TrendingDown } from 'lucide-react';

interface RecipeGraphsTabProps {
  recipeSlug: string;
}

// Sample data structure for fermentation
interface FermentationDataPoint {
  time: string; // Could be hours, days, or a timestamp
  temperature?: number; // Celsius
  gravity?: number; // SG
}

// Generate some placeholder data for demonstration
const generatePlaceholderData = (): FermentationDataPoint[] => {
  const data: FermentationDataPoint[] = [];
  const startTime = new Date();
  startTime.setDate(startTime.getDate() - 7); // Start 7 days ago

  for (let i = 0; i < 168; i++) { // 7 days, hourly data
    const currentTime = new Date(startTime.getTime() + i * 60 * 60 * 1000);
    const day = Math.floor(i / 24);
    const hourOfDay = i % 24;

    // Simulate temperature drop and then slight rise
    let temp = 20 - (day * 0.5) + Math.random() * 0.5;
    if (day > 4) temp += (day-4) * 0.2; // slight rise after day 4

    // Simulate gravity drop
    let grav = 1.050 - (day * 0.007) - (hourOfDay * 0.0001) - (Math.random() * 0.001);
    grav = Math.max(1.008, grav); // Floor gravity

    data.push({
      time: `${day}d ${hourOfDay}h`,
      temperature: parseFloat(temp.toFixed(1)),
      gravity: parseFloat(grav.toFixed(3)),
    });
  }
  return data;
};


export const RecipeGraphsTab: React.FC<RecipeGraphsTabProps> = ({ recipeSlug }) => {
  const [fermentationData, setFermentationData] = useState<FermentationDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true); // For future API calls

  useEffect(() => {
    // In a real scenario, you'd fetch data for recipeSlug here.
    // For now, we use placeholder data.
    setFermentationData(generatePlaceholderData());
    setIsLoading(false);
  }, [recipeSlug]);

  return (
    <div className="space-y-6">
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Live Fermentation Data (Placeholder)</AlertTitle>
        <AlertDescription>
          This section is intended to display live fermentation data from your RAPT Pill or similar monitoring device.
          Currently, it shows placeholder data. Real integration is a future enhancement.
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
            <p className="text-muted-foreground">Loading temperature data...</p>
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
            <p className="text-muted-foreground">No temperature data available.</p>
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
            <p className="text-muted-foreground">Loading gravity data...</p>
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
            <p className="text-muted-foreground">No gravity data available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
