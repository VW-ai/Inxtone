/**
 * DocxFormatter - Export chapters as DOCX
 *
 * Uses the `docx` package to generate Word documents with:
 * - Chapter headings (H2)
 * - Page breaks between chapters
 * - Volume headings (H1) with spacing
 * - Optional metadata and outline
 */

import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer } from 'docx';
import type { Chapter, Volume, ExportOptions, ExportResult } from '../../types/index.js';
import type { ChapterFormatter } from './types.js';
import { groupChaptersByVolume } from './types.js';

export class DocxFormatter implements ChapterFormatter {
  async formatChapters(
    chapters: Chapter[],
    volumes: Volume[],
    options: ExportOptions
  ): Promise<ExportResult> {
    const groups = groupChaptersByVolume(chapters, volumes);
    const children: Paragraph[] = [];

    // Title
    children.push(
      new Paragraph({
        text: 'Export',
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );

    let isFirstChapter = true;

    for (const group of groups) {
      // Volume heading
      if (group.volume) {
        children.push(
          new Paragraph({
            text: group.volume.name ?? `Volume ${group.volume.id}`,
            heading: HeadingLevel.HEADING_1,
            pageBreakBefore: !isFirstChapter,
            spacing: { before: 400, after: 200 },
          })
        );
        isFirstChapter = false;
      } else if (groups.length > 1) {
        children.push(
          new Paragraph({
            text: 'Unassigned Chapters',
            heading: HeadingLevel.HEADING_1,
            pageBreakBefore: !isFirstChapter,
            spacing: { before: 400, after: 200 },
          })
        );
        isFirstChapter = false;
      }

      for (const ch of group.chapters) {
        const title = ch.title ?? `Chapter ${ch.sortOrder}`;

        // Chapter heading with page break (except first)
        children.push(
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_2,
            pageBreakBefore: !isFirstChapter,
            spacing: { before: 300, after: 200 },
          })
        );
        isFirstChapter = false;

        // Metadata
        if (options.includeMetadata) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `Words: ${ch.wordCount} | Status: ${ch.status}`,
                  italics: true,
                  color: '888888',
                  size: 20,
                }),
              ],
              spacing: { after: 100 },
            })
          );
        }

        // Outline
        if (options.includeOutline && ch.outline) {
          const outlineParts: string[] = [];
          if (ch.outline.goal) outlineParts.push(`Goal: ${ch.outline.goal}`);
          if (ch.outline.scenes && ch.outline.scenes.length > 0) {
            outlineParts.push(`Scenes: ${ch.outline.scenes.join(', ')}`);
          }
          if (ch.outline.hookEnding) outlineParts.push(`Hook: ${ch.outline.hookEnding}`);

          if (outlineParts.length > 0) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: outlineParts.join(' | '),
                    italics: true,
                    color: '666666',
                    size: 20,
                  }),
                ],
                spacing: { after: 200 },
              })
            );
          }
        }

        // Content paragraphs
        if (ch.content) {
          const paragraphs = ch.content.split(/\n\n+/);
          for (const para of paragraphs) {
            const trimmed = para.trim();
            if (trimmed) {
              children.push(
                new Paragraph({
                  children: [new TextRun({ text: trimmed, size: 24 })],
                  spacing: { after: 200 },
                })
              );
            }
          }
        } else {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: '(No content yet)',
                  italics: true,
                  color: '999999',
                }),
              ],
              spacing: { after: 200 },
            })
          );
        }
      }
    }

    // Handle empty export
    if (chapters.length === 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'No chapters to export.',
              italics: true,
              color: '999999',
            }),
          ],
        })
      );
    }

    const doc = new Document({
      sections: [{ children }],
    });

    const buffer = await Packer.toBuffer(doc);

    return {
      data: Buffer.from(buffer),
      filename: 'export.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
  }
}
