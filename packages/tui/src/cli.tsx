/**
 * Inxtone CLI
 *
 * AI-Native Storytelling Framework
 *
 * Usage:
 *   inxtone                    # Start TUI mode
 *   inxtone serve              # Start HTTP server + TUI
 *   inxtone serve --no-tui     # Start HTTP server only (headless)
 *   inxtone init [name]        # Create a new project
 *   inxtone bible list [type]  # List Story Bible entities
 *   inxtone bible show <type> <id>  # Show entity details
 *   inxtone bible search <query>    # Search Story Bible
 *   inxtone export md|txt|docx     # Export chapters
 *   inxtone export bible           # Export Story Bible
 *   inxtone --version          # Show version
 *   inxtone --help             # Show help
 */

import { Command } from 'commander';
import { render } from 'ink';
import { VERSION } from '@inxtone/core';
import { App } from './app.js';
import {
  initProject,
  serve,
  bibleList,
  bibleShow,
  bibleSearch,
  exportChapters,
  exportBible,
  type ExportCommandOptions,
} from './commands/index.js';

const program = new Command();

program
  .name('inxtone')
  .description(
    'AI-Native Storytelling Framework - Local-first CLI + Web UI for serial fiction writers'
  )
  .version(VERSION, '-v, --version', 'Output the current version');

// Serve command
program
  .command('serve')
  .description('Start HTTP server for Web GUI')
  .option('-p, --port <port>', 'Port number', '3456')
  .option('--no-tui', 'Run in headless mode (no TUI)')
  .action(async (options: { port: string; tui: boolean }) => {
    await serve(options);
  });

// Init command
program
  .command('init [name]')
  .description('Create a new Inxtone project')
  .option('-t, --template <template>', 'Use a project template (e.g., xiuxian)')
  .action(async (name: string | undefined, options: { template?: string }) => {
    await initProject(name ?? 'my-novel', options);
  });

// Bible command
const bible = program.command('bible').description('Browse and search Story Bible content');

bible
  .command('list [type]')
  .description('List Story Bible entities (characters, locations, factions, etc.)')
  .action(async (type?: string) => {
    await bibleList(type);
  });

bible
  .command('show <type> <id>')
  .description('Show detailed information about an entity')
  .action(async (type: string, id: string) => {
    await bibleShow(type, id);
  });

bible
  .command('search <query>')
  .description('Search Story Bible content')
  .action(async (query: string) => {
    await bibleSearch(query);
  });

// Export command
const exportCmd = program.command('export').description('Export chapters or Story Bible to file');

exportCmd
  .command('md')
  .description('Export chapters as Markdown')
  .option('-o, --output <path>', 'Output file path')
  .option('--volume <id>', 'Export a specific volume')
  .option('--chapters <ids>', 'Export specific chapter IDs (comma-separated)')
  .option('--outline', 'Include chapter outlines')
  .option('--metadata', 'Include word counts and status')
  .action(async (options: ExportCommandOptions) => {
    await exportChapters('md', options);
  });

exportCmd
  .command('txt')
  .description('Export chapters as plain text')
  .option('-o, --output <path>', 'Output file path')
  .option('--volume <id>', 'Export a specific volume')
  .option('--chapters <ids>', 'Export specific chapter IDs (comma-separated)')
  .option('--outline', 'Include chapter outlines')
  .option('--metadata', 'Include word counts and status')
  .action(async (options: ExportCommandOptions) => {
    await exportChapters('txt', options);
  });

exportCmd
  .command('docx')
  .description('Export chapters as DOCX')
  .option('-o, --output <path>', 'Output file path')
  .option('--volume <id>', 'Export a specific volume')
  .option('--chapters <ids>', 'Export specific chapter IDs (comma-separated)')
  .option('--outline', 'Include chapter outlines')
  .option('--metadata', 'Include word counts and status')
  .action(async (options: ExportCommandOptions) => {
    await exportChapters('docx', options);
  });

exportCmd
  .command('bible')
  .description('Export Story Bible as Markdown')
  .option('-o, --output <path>', 'Output file path')
  .action(async (options: { output?: string }) => {
    await exportBible(options);
  });

// Default action: start TUI mode
program.action(() => {
  render(<App />);
});

// Parse and run
program.parse();
