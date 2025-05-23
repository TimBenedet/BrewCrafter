
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
  if (!markdown?.trim()) return [];
  
  // Normalize line endings to \n first
  const normalizedMarkdown = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const sections: Section[] = [];
  // Regex explanation:
  // ^##\s*         : Matches "## " at the start of a line.
  // ([^\n\r]+)     : Group 1 (Title): Captures one or more characters that are NOT newlines (for the title).
  // \n             : Matches the newline character immediately after the title line.
  // ([\s\S]*?)     : Group 2 (Content): Captures any characters (including newlines), non-greedily.
  // (?=\n##\s|$)   : Positive lookahead: asserts that the match is followed by:
  //                  - \n##\s : A newline, then "## " (start of the next section).
  //                  - |$     : OR the end of the string.
  // gm flags       : g (global, find all matches), m (multiline, ^ and $ match start/end of lines).
  const sectionRegex = /^##\s*([^\n\r]+)\n([\s\S]*?)(?=\n##\s|$)/gm;

  let match;
  while ((match = sectionRegex.exec(normalizedMarkdown)) !== null) {
    const title = match[1].trim();
    const contentBlock = match[2].trim(); // Trim trailing newlines from the block itself
    
    const contentLines = contentBlock.split('\n')
      .map(line => line.trim()) // Trim each individual line
      .filter(Boolean); // Remove any empty lines that result from trimming

    if (title) { // Ensure title is not empty after trimming
      sections.push({
        title,
        icon: getIconForSection(title),
        contentLines,
      });
    }
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

        section.contentLines.forEach((line, lineIdx) => {
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
                {renderContentLine(line, lineIdx)}
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
