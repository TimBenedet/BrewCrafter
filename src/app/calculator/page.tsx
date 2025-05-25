
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calculator, Percent, Hop, Thermometer, PlusCircle, XCircle } from 'lucide-react';

// ABV Calculator
function AbvCalculator() {
  const [og, setOg] = useState('');
  const [fg, setFg] = useState('');
  const [abv, setAbv] = useState('N/A');

  useEffect(() => {
    const numOg = parseFloat(og);
    const numFg = parseFloat(fg);
    if (!isNaN(numOg) && !isNaN(numFg) && numOg > numFg && numOg > 0 && numFg > 0) {
      setAbv(((numOg - numFg) * 131.25).toFixed(2) + ' %');
    } else {
      setAbv('N/A');
    }
  }, [og, fg]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Percent className="mr-2 h-5 w-5 text-primary" />
          ABV Calculator
        </CardTitle>
        <CardDescription>Calculates Alcohol By Volume from Original and Final Gravity.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="og-abv">Original Gravity (OG)</Label>
          <Input
            id="og-abv"
            type="number"
            value={og}
            onChange={(e) => setOg(e.target.value)}
            placeholder="e.g., 1.050"
            step="0.001"
          />
        </div>
        <div>
          <Label htmlFor="fg-abv">Final Gravity (FG)</Label>
          <Input
            id="fg-abv"
            type="number"
            value={fg}
            onChange={(e) => setFg(e.target.value)}
            placeholder="e.g., 1.010"
            step="0.001"
          />
        </div>
        <Separator />
        <div className="mt-4 text-center">
          <Label className="text-sm font-medium text-muted-foreground">Calculated ABV</Label>
          <p className="text-3xl font-bold text-primary">{abv}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// IBU Calculator
type HopAddition = { id: number; amount: string; alpha: string; time: string };

function IbuCalculator() {
  const [ogIbu, setOgIbu] = useState('');
  const [boilVolume, setBoilVolume] = useState('');
  const [hops, setHops] = useState<HopAddition[]>([{ id: 1, amount: '', alpha: '', time: '' }]); // Changed Date.now() to 1 for initial ID
  const [ibu, setIbu] = useState('N/A');

  const handleHopChange = (id: number, field: keyof Omit<HopAddition, 'id'>, value: string) => {
    setHops(prevHops => prevHops.map(h => h.id === id ? { ...h, [field]: value } : h));
  };

  const addHop = () => {
    setHops(prevHops => [...prevHops, { id: Date.now(), amount: '', alpha: '', time: '' }]);
  };

  const removeHop = (id: number) => {
    setHops(prevHops => prevHops.filter(h => h.id !== id));
  };

  useEffect(() => {
    const numOg = parseFloat(ogIbu);
    const numBoilVolume = parseFloat(boilVolume);

    if (isNaN(numOg) || numOg <= 0 || isNaN(numBoilVolume) || numBoilVolume <= 0) {
      setIbu('N/A');
      return;
    }

    let totalIbus = 0;
    const bignessFactor = 1.65 * Math.pow(0.000125, numOg - 1.0);

    hops.forEach(hop => {
      const amountGrams = parseFloat(hop.amount);
      const alphaDecimal = parseFloat(hop.alpha) / 100.0;
      const boilTimeMinutes = parseFloat(hop.time);

      if (isNaN(amountGrams) || amountGrams <= 0 || isNaN(alphaDecimal) || alphaDecimal <= 0 || isNaN(boilTimeMinutes) || boilTimeMinutes < 0) {
        return; // Skip this hop if invalid
      }

      const boilTimeFactor = (1.0 - Math.exp(-0.04 * boilTimeMinutes)) / 4.15;
      const utilization = bignessFactor * boilTimeFactor;
      
      if (numBoilVolume > 0) {
        const ibusForHop = (alphaDecimal * amountGrams * utilization * 1000) / numBoilVolume;
        totalIbus += ibusForHop;
      }
    });
    
    const hasPotentiallyValidHops = hops.some(h => parseFloat(h.amount) > 0 && parseFloat(h.alpha) > 0 && parseFloat(h.time) >= 0);

    if (totalIbus > 0 && !isNaN(totalIbus)) {
        setIbu(totalIbus.toFixed(1) + ' IBU');
    } else if (hasPotentiallyValidHops) { 
        setIbu('N/A'); 
    } else {
        setIbu('0.0 IBU'); 
    }

  }, [ogIbu, boilVolume, hops]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Hop className="mr-2 h-5 w-5 text-primary" />
          IBU Calculator (Tinseth)
        </CardTitle>
        <CardDescription>Estimates International Bitterness Units for boil hop additions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="og-ibu">Original Gravity (OG)</Label>
          <Input
            id="og-ibu"
            type="number"
            value={ogIbu}
            onChange={(e) => setOgIbu(e.target.value)}
            placeholder="e.g., 1.050"
            step="0.001"
          />
        </div>
        <div>
          <Label htmlFor="boil-volume-ibu">Boil Volume (Liters)</Label>
          <Input
            id="boil-volume-ibu"
            type="number"
            value={boilVolume}
            onChange={(e) => setBoilVolume(e.target.value)}
            placeholder="e.g., 25"
            step="0.1"
          />
        </div>
        <Separator />
        <Label>Hop Additions (Boil)</Label>
        {hops.map((hop, index) => (
          <div key={hop.id} className="space-y-2 p-3 border rounded-md relative">
            {hops.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 text-destructive hover:bg-destructive/10"
                onClick={() => removeHop(hop.id)}
                aria-label="Remove hop"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <Label htmlFor={`hop-amount-${hop.id}`} className="text-xs">Amount (g)</Label>
                <Input
                  id={`hop-amount-${hop.id}`}
                  type="number"
                  value={hop.amount}
                  onChange={(e) => handleHopChange(hop.id, 'amount', e.target.value)}
                  placeholder="e.g., 30"
                />
              </div>
              <div>
                <Label htmlFor={`hop-alpha-${hop.id}`} className="text-xs">Alpha Acid (%)</Label>
                <Input
                  id={`hop-alpha-${hop.id}`}
                  type="number"
                  value={hop.alpha}
                  onChange={(e) => handleHopChange(hop.id, 'alpha', e.target.value)}
                  placeholder="e.g., 5.5"
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor={`hop-time-${hop.id}`} className="text-xs">Boil Time (min)</Label>
                <Input
                  id={`hop-time-${hop.id}`}
                  type="number"
                  value={hop.time}
                  onChange={(e) => handleHopChange(hop.id, 'time', e.target.value)}
                  placeholder="e.g., 60"
                />
              </div>
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addHop} className="mt-2">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Hop Addition
        </Button>
        <Separator />
        <div className="mt-4 text-center">
          <Label className="text-sm font-medium text-muted-foreground">Calculated IBU (Tinseth)</Label>
          <p className="text-3xl font-bold text-primary">{ibu}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// SG Correction Calculator
function SgCorrectionCalculator() {
  const [measuredSg, setMeasuredSg] = useState('');
  const [measuredTemp, setMeasuredTemp] = useState('');
  const [calibTemp, setCalibTemp] = useState('20'); 
  const [correctedSg, setCorrectedSg] = useState('N/A');

  useEffect(() => {
    const numMeasuredSg = parseFloat(measuredSg);
    const numMeasuredTemp = parseFloat(measuredTemp);
    const numCalibTemp = parseFloat(calibTemp);

    if (isNaN(numMeasuredSg) || numMeasuredSg <=0 || isNaN(numMeasuredTemp) || isNaN(numCalibTemp)) {
      setCorrectedSg('N/A');
      return;
    }
    
    const calculateCorrectionFactor = (tempC: number) => {
      return 1.00130346 - 
             (0.000134722124 * tempC) + 
             (0.00000204052596 * Math.pow(tempC, 2)) - 
             (0.00000000232820948 * Math.pow(tempC, 3));
    };

    const cfMeasured = calculateCorrectionFactor(numMeasuredTemp);
    const cfCalib = calculateCorrectionFactor(numCalibTemp);

    if (cfCalib === 0 || isNaN(cfMeasured) || isNaN(cfCalib)) { 
        setCorrectedSg('N/A');
        return;
    }

    const finalSg = numMeasuredSg * (cfMeasured / cfCalib);
    setCorrectedSg(finalSg.toFixed(3));

  }, [measuredSg, measuredTemp, calibTemp]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Thermometer className="mr-2 h-5 w-5 text-primary" />
          SG Temperature Correction
        </CardTitle>
        <CardDescription>Corrects Specific Gravity readings for temperature (Celsius).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="measured-sg">Measured Specific Gravity (SG)</Label>
          <Input
            id="measured-sg"
            type="number"
            value={measuredSg}
            onChange={(e) => setMeasuredSg(e.target.value)}
            placeholder="e.g., 1.052"
            step="0.001"
          />
        </div>
        <div>
          <Label htmlFor="measured-temp">Measured Temperature (°C)</Label>
          <Input
            id="measured-temp"
            type="number"
            value={measuredTemp}
            onChange={(e) => setMeasuredTemp(e.target.value)}
            placeholder="e.g., 25"
          />
        </div>
        <div>
          <Label htmlFor="calib-temp">Hydrometer Calibration Temperature (°C)</Label>
          <Input
            id="calib-temp"
            type="number"
            value={calibTemp}
            onChange={(e) => setCalibTemp(e.target.value)}
            placeholder="Usually 15.56°C (60°F) or 20°C (68°F)"
          />
        </div>
        <Separator />
        <div className="mt-4 text-center">
          <Label className="text-sm font-medium text-muted-foreground">Corrected Specific Gravity</Label>
          <p className="text-3xl font-bold text-primary">{correctedSg}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Main Page
export default function CalculatorPage() {
  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-primary flex items-center">
            <Calculator className="mr-3 h-8 w-8" />
            BrewCrafter Calculators
        </h1>
        <p className="text-muted-foreground">
            Handy client-side calculators for your brewing needs.
        </p>
      </header>
      
      <AbvCalculator />
      <IbuCalculator />
      <SgCorrectionCalculator />
    </div>
  );
}
