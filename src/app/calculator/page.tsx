
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalculatorIcon } from "lucide-react";

export default function CalculatorPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalculatorIcon className="mr-2 h-6 w-6 text-primary" />
            GitBrew Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Les calculateurs de brassage GitBrew seront disponibles ici prochainement.
          </p>
          <div className="mt-6 flex items-center justify-center">
            <img 
              src="https://placehold.co/600x400.png?text=Calculator+Interface" 
              alt="Calculator Interface Placeholder" 
              className="rounded-lg shadow-md border"
              data-ai-hint="calculator interface"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
