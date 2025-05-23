
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BookOpen,
  Blend,
  Flame,
  Wind,
  ThermometerSnowflake,
  FlaskConical,
  Archive,
  HelpCircle
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface RecipeStepsDisplayProps {
  stepsMarkdown: string;
}

interface Section {
  title: string;
  icon: LucideIcon;
  contentLines: string[];
}

const getIconForSection = (title: string): LucideIcon => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('brewer') || lowerTitle.includes('procedure') || lowerTitle.includes('notes')) return BookOpen;
  if (lowerTitle.includes('mashing')) return Blend;
  if (lowerTitle.includes('boil')) return Flame;
  if (lowerTitle.includes('whirlpool') || lowerTitle.includes('aroma')) return Wind;
  if (lowerTitle.includes('cooling')) return ThermometerSnowflake;
  if (lowerTitle.includes('fermentation')) return FlaskConical;
  if (lowerTitle.includes('bottling') || lowerTitle.includes('kegging')) return Archive;
  return HelpCircle;
};

const parseMarkdownToSections = (markdown: string): Section[] => {
  if (!markdown) return [];
  const sections: Section[] = [];
  
  const sectionRegex = /^##\s*(.+?)\s*\n([\s\S]*?)(?=\n^##\s*|$)/gm;

  let match;
  while ((match = sectionRegex.exec(markdown)) !== null) {
    const title = match[1].trim(); 
    const contentBlock = match[2].trim(); 
    
    const contentLines = contentBlock.split('\n')
      .map(line => line.trim()) 
      .filter(Boolean); 

    sections.push({
      title,
      icon: getIconForSection(title),
      contentLines,
    });
  }
  return sections;
};

const renderContentLine = (lineContent: string, key: string | number) => {
  const RENDER_LINE = lineContent.trim();
  const boldMatch = RENDER_LINE.match(/^\*\*(.*?)\*\*(.*)/);
  if (boldMatch) {
    return (
      <React.Fragment key={key}>
        <span className="font-semibold">{boldMatch[1]}</span>
        {boldMatch[2]}
      </React.Fragment>
    );
  }
  return <React.Fragment key={key}>{RENDER_LINE}</React.Fragment>;
};


export const RecipeStepsDisplay: React.FC<RecipeStepsDisplayProps> = ({ stepsMarkdown }) => {
  const sections = parseMarkdownToSections(stepsMarkdown);

  if (sections.length === 0) {
    return <p className="text-muted-foreground">Recipe steps content is empty or not in the expected format.</p>;
  }

  return (
    <div className="space-y-6">
      {sections.map((section, sectionIndex) => {
        const renderableBlocks: Array<JSX.Element> = [];
        let currentListItems: string[] = [];

        section.contentLines.forEach((line, lineIndex) => {
          const isListItem = line.startsWith('* ') || line.startsWith('- ');

          if (isListItem) {
            currentListItems.push(line.substring(2)); // Store without the bullet
          } else {
            // If we were building a list, finalize it and add it to blocks
            if (currentListItems.length > 0) {
              renderableBlocks.push(
                <ul key={`ul-${sectionIndex}-${renderableBlocks.length}`} className="list-disc space-y-1 pl-5 text-sm">
                  {currentListItems.map((item, itemIndex) => (
                    <li key={`li-${sectionIndex}-${renderableBlocks.length}-${itemIndex}`}>{renderContentLine(item, itemIndex)}</li>
                  ))}
                </ul>
              );
              currentListItems = []; // Reset for the next list
            }
            // Add the paragraph
            renderableBlocks.push(
              <p key={`p-${sectionIndex}-${renderableBlocks.length}`} className="text-sm">
                {renderContentLine(line, lineIndex)}
              </p>
            );
          }
        });

        // If there are any remaining list items after the loop, add them
        if (currentListItems.length > 0) {
          renderableBlocks.push(
            <ul key={`ul-${sectionIndex}-last`} className="list-disc space-y-1 pl-5 text-sm">
              {currentListItems.map((item, itemIndex) => (
                <li key={`li-${sectionIndex}-last-${itemIndex}`}>{renderContentLine(item, itemIndex)}</li>
              ))}
            </ul>
          );
        }
        
        return (
          <Card key={sectionIndex}>
            <CardHeader>
              <CardTitle className="flex items-center text-xl font-semibold">
                <section.icon className="mr-3 h-6 w-6 text-primary" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {renderableBlocks}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

