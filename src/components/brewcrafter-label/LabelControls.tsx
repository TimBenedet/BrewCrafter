
'use client';

import type { UseFormReturn } from 'react-hook-form';
import { LabelFormValues } from '@/types/label';
import type { RecipeSummary } from '@/types/recipe';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { UploadCloud, Image as ImageIcon, Palette, TextIcon, Trash2, Info, Tag, Settings, CalendarDays, MapPin, Building, Type, Percent, Hop } from 'lucide-react';
import React, { useState } from 'react';

interface LabelControlsProps {
  form: UseFormReturn<LabelFormValues>;
  recipes: RecipeSummary[];
  onRecipeSelect: (slug?: string) => void;
  selectedRecipeSlug?: string;
}

export function LabelControls({ form, recipes, onRecipeSelect, selectedRecipeSlug }: LabelControlsProps) {
  const { toast } = useToast();
  const [backgroundImagePreview, setBackgroundImagePreview] = useState<string | null>(null);

  const handleBackgroundImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // Max 2MB
        toast({ title: "Image too large", description: "Please select an image smaller than 2MB.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        form.setValue('backgroundImage', dataUrl, { shouldValidate: true });
        setBackgroundImagePreview(dataUrl);
        toast({ title: "Background Image Uploaded" });
      };
      reader.readAsDataURL(file);
    }
  };

  const clearBackgroundImage = () => {
    form.setValue('backgroundImage', undefined);
    setBackgroundImagePreview(null);
    const fileInput = document.getElementById('backgroundImageInput') as HTMLInputElement;
    if (fileInput) fileInput.value = ''; // Reset file input
    toast({ title: "Background Image Cleared" });
  };
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-semibold uppercase tracking-wide text-foreground">Label Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-220px)] pr-4"> {/* Adjust height as needed */}
          <Form {...form}>
            <form className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center"><Info className="mr-2 h-5 w-5 text-primary" />Recipe Source</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="selectedRecipeSlug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Load Info from My Recipes</FormLabel>
                        <Select onValueChange={(value) => { field.onChange(value); onRecipeSelect(value === 'none' ? undefined : value); }} value={field.value || 'none'}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a recipe" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None (Manual Entry)</SelectItem>
                            {recipes.map((recipe) => (
                              <SelectItem key={recipe.slug} value={recipe.slug}>
                                {recipe.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                 <CardHeader>
                  <CardTitle className="text-lg flex items-center"><Tag className="mr-2 h-5 w-5 text-primary" />Front Label</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="beerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Beer Name</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="ibuForLabel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center"><Hop className="mr-2 h-4 w-4"/>IBU (for label)</FormLabel>
                        <FormControl><Input {...field} placeholder="e.g., 45" /></FormControl>
                        <FormDescription>Editable. Pre-filled from recipe if selected.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="abvForLabel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center"><Percent className="mr-2 h-4 w-4"/>Alcohol % (for label)</FormLabel>
                        <FormControl><Input {...field} placeholder="e.g., 5.2" /></FormControl>
                        <FormDescription>Editable. Pre-filled from recipe if selected.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="volume"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Volume</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex space-x-2"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl><RadioGroupItem value="33CL" /></FormControl>
                              <FormLabel className="font-normal">33CL</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl><RadioGroupItem value="75CL" /></FormControl>
                              <FormLabel className="font-normal">75CL</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormDescription>
                    SRM color is pre-filled from the selected recipe if available and affects the Beer Icon on the label.
                  </FormDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center"><Info className="mr-2 h-5 w-5 text-primary" />Back Label</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description / Notes</FormLabel>
                        <FormControl><Textarea className="h-24" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="ingredients"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ingredients Text</FormLabel>
                        <FormControl><Textarea className="h-20" {...field} /></FormControl>
                         <FormDescription>Summarized ingredients are pre-filled from recipe. Edit as needed.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="brewingDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brewing Date</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="brewingLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brewing Location</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center"><Settings className="mr-2 h-5 w-5 text-primary" />Common Design</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="breweryName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center"><Building className="mr-2 h-4 w-4"/>Brewery Name</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tagline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center"><Type className="mr-2 h-4 w-4"/>Tagline / Short Description (for label)</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Separator />

                  <FormItem>
                    <FormLabel className="flex items-center"><ImageIcon className="mr-2 h-4 w-4"/>Background Image</FormLabel>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('backgroundImageInput')?.click()}>
                        <UploadCloud className="mr-2 h-4 w-4" /> Upload
                      </Button>
                      <Input id="backgroundImageInput" type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={handleBackgroundImageChange} />
                      {backgroundImagePreview && (
                        <Button type="button" variant="ghost" size="icon" onClick={clearBackgroundImage} className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {backgroundImagePreview && (
                      <div className="mt-2 w-full aspect-video max-w-[200px] relative border rounded-md overflow-hidden">
                        <Image src={backgroundImagePreview} alt="Background preview" layout="fill" objectFit="cover" />
                      </div>
                    )}
                    <FormDescription>Optional. If provided, this will override the background color.</FormDescription>
                  </FormItem>
                  
                  <Separator />

                  <FormField
                    control={form.control}
                    name="backgroundColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center"><Palette className="mr-2 h-4 w-4"/>Background Color (Hex)</FormLabel>
                        <div className="flex items-center gap-2">
                          <FormControl><Input type="color" {...field} className="p-0 h-10 w-12 rounded-md border-0 cursor-pointer" /></FormControl>
                          <FormControl><Input type="text" {...field} placeholder="#333333" className="max-w-[100px]" /></FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="textColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center"><TextIcon className="mr-2 h-4 w-4"/>Text Color (Hex)</FormLabel>
                         <div className="flex items-center gap-2">
                           <FormControl><Input type="color" {...field} className="p-0 h-10 w-12 rounded-md border-0 cursor-pointer" /></FormControl>
                           <FormControl><Input type="text" {...field} placeholder="#FFFFFF" className="max-w-[100px]" /></FormControl>
                         </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </form>
          </Form>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
