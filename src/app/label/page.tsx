
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TagIcon } from "lucide-react";

export default function LabelPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TagIcon className="mr-2 h-6 w-6 text-primary" />
            GitBrew Label
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            La fonctionnalité de génération d'étiquettes GitBrew sera disponible ici prochainement.
          </p>
          <div className="mt-6 flex items-center justify-center">
            <img 
              src="https://placehold.co/600x400.png?text=Label+Preview+Area" 
              alt="Label Preview Area" 
              className="rounded-lg shadow-md border"
              data-ai-hint="label design"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
