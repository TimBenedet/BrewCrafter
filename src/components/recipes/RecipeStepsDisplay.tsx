
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BookOpen, // Brewer's Notes / Detailed Procedure
  Blend, // Mashing (Changed from Blender as Blend is more suitable for mixing)
  Flame, // Boil
  Wind, // Whirlpool / Aroma Additions
  ThermometerSnowflake, // Cooling
  FlaskConical, // Fermentation
  Archive, // Bottling/Kegging (Changed from Package to Archive as it's more about storage/final product)
  HelpCircle // Default
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
  if (lowerTitle.includes('brewer') || lowerTitle.includes('procedure')) return BookOpen;
  if (lowerTitle.includes('mashing')) return Blend;
  if (lowerTitle.includes('boil')) return Flame;
  if (lowerTitle.includes('whirlpool') || lowerTitle.includes('aroma')) return Wind;
  if (lowerTitle.includes('cooling')) return ThermometerSnowflake;
  if (lowerTitle.includes('fermentation')) return FlaskConical;
  if (lowerTitle.includes('bottling') || lowerTitle.includes('kegging')) return Archive;
  return HelpCircle; // Default icon
};

const parseMarkdownToSections = (markdown: string): Section[] => {
  if (!markdown) return [];
  const sections: Section[] = [];
  
  // Regex explanation:
  // ^##\s*        : Matches "## " at the start of a line (with optional spaces after ##).
  // (.+?)         : Group 1 (Title): Captures one or more characters, non-greedily. Ensures title is not empty.
  // \s*\n         : Matches optional whitespace then a newline after the title.
  // ([\s\S]*?)    : Group 2 (Content): Captures any characters (including newlines), non-greedily.
  // (?=\n^##\s*|$) : Positive lookahead: asserts that the match is followed by:
  //                 - \n^##\s* : A newline, then "## " at the start of a new line (next section).
  //                 - |$       : OR the end of the string.
  // gm flags      : g (global, find all matches), m (multiline, ^ and $ match start/end of lines).
  const sectionRegex = /^##\s*(.+?)\s*\n([\s\S]*?)(?=\n^##\s*|$)/gm;

  let match;
  while ((match = sectionRegex.exec(markdown)) !== null) {
    const title = match[1].trim(); // Title from Group 1
    const contentBlock = match[2].trim(); // Content from Group 2
    
    const contentLines = contentBlock.split('\n')
      .map(line => line.trim()) // Trim each line of content
      .filter(Boolean); // Remove any empty lines that result from trimming

    sections.push({
      title,
      icon: getIconForSection(title),
      contentLines,
    });
  }
  return sections;
};

const renderContentLine = (line: string, index: number) => {
  // Simple bold parsing for '**text**:' or '**text**'
  const boldMatch = line.match(/^\*\*(.*?)\*\*(.*)/);
  if (boldMatch) {
    return (
      <React.Fragment key={index}>
        <span className="font-semibold">{boldMatch[1]}</span>
        {boldMatch[2]}
      </React.Fragment>
    );
  }
  return <React.Fragment key={index}>{line}</React.Fragment>;
};


export const RecipeStepsDisplay: React.FC<RecipeStepsDisplayProps> = ({ stepsMarkdown }) => {
  const sections = parseMarkdownToSections(stepsMarkdown);

  if (sections.length === 0) {
    return <p className="text-muted-foreground">Recipe steps content is empty or not in the expected format.</p>;
  }

  return (
    <div className="space-y-6">
      {sections.map((section, sectionIndex) => (
        <Card key={sectionIndex}>
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-semibold">
              <section.icon className="mr-3 h-6 w-6 text-primary" />
              {section.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {section.contentLines.every(line => line.startsWith('* ') || line.startsWith('- ')) ? (
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {section.contentLines.map((line, lineIndex) => (
                  <li key={lineIndex}>{renderContentLine(line.substring(2))}</li>
                ))}
              </ul>
            ) : (
              <div className="space-y-2 text-sm">
                {section.contentLines.map((line, lineIndex) => (
                   line.startsWith('* ') || line.startsWith('- ') ? (
                     <ul key={lineIndex} className="list-disc space-y-1 pl-5"><li>{renderContentLine(line.substring(2))}</li></ul>
                   ) : (
                     <p key={lineIndex}>{renderContentLine(line)}</p>
                   )
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
