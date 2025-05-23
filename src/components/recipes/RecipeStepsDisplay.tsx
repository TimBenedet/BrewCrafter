
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
  if (!markdown || !markdown.trim()) {
    console.log("RecipeStepsDisplay: Markdown input is empty or only whitespace.");
    return [];
  }

  const lines = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const sections: Section[] = [];
  let currentSection: Section | null = null;

  console.log("RecipeStepsDisplay: parseMarkdownToSections - Total lines in markdown:", lines.length);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLineForHeaderCheck = line.trim();

    if (trimmedLineForHeaderCheck.startsWith('## ')) {
      if (currentSection) {
        currentSection.contentLines = currentSection.contentLines.filter(cl => cl.trim() !== '');
        if (currentSection.title && currentSection.contentLines.length > 0) {
          sections.push(currentSection);
          console.log(`RecipeStepsDisplay: Finalized section "${currentSection.title}" with ${currentSection.contentLines.length} content lines. Content:`, JSON.stringify(currentSection.contentLines));
        } else if (currentSection.title) {
           console.log(`RecipeStepsDisplay: Section "${currentSection.title}" has a title but no content lines after filter, not adding.`);
        }
      }
      
      const title = trimmedLineForHeaderCheck.substring(3).trim();
      if (title) {
        currentSection = {
          title: title,
          icon: getIconForSection(title),
          contentLines: [],
        };
        console.log(`RecipeStepsDisplay: Started new section "${title}"`);
      } else {
        currentSection = null; 
        console.log("RecipeStepsDisplay: Encountered '## ' without a valid title, ignoring subsequent lines until next valid header.");
      }
    } else if (currentSection) {
        // Add line to current section's content, preserving original form (trimming happens at render)
        currentSection.contentLines.push(line);
    } else {
        // console.log("RecipeStepsDisplay: Line before first valid header or after invalid header, skipping:", line);
    }
  }

  if (currentSection && currentSection.title) {
    currentSection.contentLines = currentSection.contentLines.filter(cl => cl.trim() !== '');
    if (currentSection.contentLines.length > 0) {
      sections.push(currentSection);
      console.log(`RecipeStepsDisplay: Finalized last section "${currentSection.title}" with ${currentSection.contentLines.length} content lines. Content:`, JSON.stringify(currentSection.contentLines));
    } else {
       console.log(`RecipeStepsDisplay: Discarding last section "${currentSection.title}" because it has no content lines after final filter.`);
    }
  }

  if (sections.length === 0 && lines.some(l => l.trim().startsWith("## "))) {
    console.warn("RecipeStepsDisplay: Markdown seemed to contain headers but no sections were parsed successfully. Review parsing logic and input.");
  } else if (sections.length === 0 && lines.length > 0) {
    console.warn("RecipeStepsDisplay: No sections parsed from markdown. Input was not empty but contained no valid '## ' headers.");
  }
  
  console.log("RecipeStepsDisplay: Total sections parsed:", sections.length, sections.map(s => ({title: s.title, numLines: s.contentLines.length })));
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
  console.log("RecipeStepsDisplay: Rendering with markdown length:", stepsMarkdown?.length);
  const sections = parseMarkdownToSections(stepsMarkdown);

  if (sections.length === 0) {
    return <Card><CardContent className="pt-6"><p className="text-muted-foreground">Recipe steps content is empty or not in the expected H2 section format.</p></CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      {sections.map((section, sectionIndex) => {
        if (!section.title) { // Should not happen with new parser if title is required
          console.warn("RecipeStepsDisplay: Skipping section with no title", section);
          return null;
        }
        if (section.contentLines.length === 0) {
          console.log(`RecipeStepsDisplay: Section "${section.title}" has no content lines to render.`);
          // Optionally render the card with a message, or skip it
          // return (
          //   <Card key={sectionIndex}>
          //     <CardHeader>
          //       <CardTitle className="flex items-center text-xl font-semibold">
          //         <section.icon className="mr-3 h-6 w-6 text-primary" />
          //         {section.title}
          //       </CardTitle>
          //     </CardHeader>
          //     <CardContent><p className="text-sm text-muted-foreground">No content for this section.</p></CardContent>
          //   </Card>
          // );
          // For now, let's render the card header even if content is empty, as per previous behavior.
        }
        
        const renderableBlocks: Array<JSX.Element> = [];
        let currentListItems: string[] = [];

        section.contentLines.forEach((line, lineIdx) => {
          const trimmedLineForDecision = line.trim();
          const isListItem = trimmedLineForDecision.startsWith('* ') || trimmedLineForDecision.startsWith('- ');

          if (isListItem) {
            currentListItems.push(trimmedLineForDecision.substring(2)); 
          } else {
            if (currentListItems.length > 0) {
              renderableBlocks.push(
                <ul key={`ul-${sectionIndex}-${renderableBlocks.length}`} className="list-disc space-y-1 pl-5 text-sm">
                  {currentListItems.map((item, itemIndex) => (
                    <li key={`li-${sectionIndex}-${renderableBlocks.length}-${itemIndex}`}>{renderContentLine(item, itemIndex)}</li>
                  ))}
                </ul>
              );
              currentListItems = []; 
            }
            // Only render a paragraph if the line (after trimming for display) is not empty
            if (line.trim()) { 
              renderableBlocks.push(
                <p key={`p-${sectionIndex}-${renderableBlocks.length}`} className="text-sm">
                  {renderContentLine(line, lineIdx)}
                </p>
              );
            }
          }
        });

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
            {renderableBlocks.length > 0 ? (
              <CardContent>
                <div className="space-y-2">
                  {renderableBlocks}
                </div>
              </CardContent>
            ) : (
              <CardContent>
                 <p className="text-sm text-muted-foreground Italic">Pas de contenu détaillé pour cette section.</p>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
};

