/**
 * Export Command
 *
 * Export chapters and Story Bible via CLI
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import chalk from 'chalk';
import { Database } from '@inxtone/core/db';
import {
  CharacterRepository,
  RelationshipRepository,
  WorldRepository,
  LocationRepository,
  FactionRepository,
  ArcRepository,
  ForeshadowingRepository,
  HookRepository,
  WritingRepository,
} from '@inxtone/core/db';
import { ExportService } from '@inxtone/core/services';
import type { ExportFormat, ExportRange } from '@inxtone/core';

/**
 * Initialize ExportService from current project
 */
function initService(): ExportService {
  const dbPath = path.join(process.cwd(), 'inxtone.db');

  if (!fs.existsSync(dbPath)) {
    console.error(chalk.red('Error: Not an Inxtone project directory'));
    console.error(chalk.gray('Run this command from a project directory containing inxtone.db'));
    process.exit(1);
  }

  const db = new Database({ path: dbPath, migrate: false });
  db.connect();

  return new ExportService({
    writingRepo: new WritingRepository(db),
    characterRepo: new CharacterRepository(db),
    relationshipRepo: new RelationshipRepository(db),
    worldRepo: new WorldRepository(db),
    locationRepo: new LocationRepository(db),
    factionRepo: new FactionRepository(db),
    arcRepo: new ArcRepository(db),
    foreshadowingRepo: new ForeshadowingRepository(db),
    hookRepo: new HookRepository(db),
  });
}

export interface ExportCommandOptions {
  output?: string;
  volume?: string;
  chapters?: string;
  outline?: boolean;
  metadata?: boolean;
}

/**
 * Export chapters in the specified format
 */
export async function exportChapters(format: string, options: ExportCommandOptions): Promise<void> {
  // Validate format
  const validFormats = ['md', 'txt', 'docx'];
  if (!validFormats.includes(format)) {
    console.error(chalk.red(`Error: Unknown format "${format}"`));
    console.error(chalk.gray(`Valid formats: ${validFormats.join(', ')}`));
    process.exit(1);
  }

  const service = initService();

  // Build range
  const range: ExportRange = { type: 'all' };
  if (options.volume) {
    range.type = 'volume';
    range.volumeId = Number(options.volume);
  } else if (options.chapters) {
    range.type = 'chapters';
    range.chapterIds = options.chapters.split(',').map(Number);
  }

  const exportOptions: Parameters<typeof service.exportChapters>[0] = {
    format: format as ExportFormat,
    range,
  };
  if (options.outline) exportOptions.includeOutline = options.outline;
  if (options.metadata) exportOptions.includeMetadata = options.metadata;

  const result = await service.exportChapters(exportOptions);

  // Determine output path
  const outputPath = options.output ?? result.filename;

  // Write file
  if (result.data instanceof Buffer) {
    fs.writeFileSync(outputPath, result.data);
  } else {
    fs.writeFileSync(outputPath, result.data, 'utf-8');
  }

  console.log(chalk.green(`Exported to ${chalk.bold(outputPath)}`));
}

/**
 * Export Story Bible as Markdown
 */
export async function exportBible(options: { output?: string }): Promise<void> {
  const service = initService();

  const result = await service.exportStoryBible();

  const outputPath = options.output ?? result.filename;
  fs.writeFileSync(outputPath, result.data as string, 'utf-8');

  console.log(chalk.green(`Story Bible exported to ${chalk.bold(outputPath)}`));
}
