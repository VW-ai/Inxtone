/**
 * PromptAssembler - Template loading and variable substitution
 *
 * Loads prompt templates with YAML-like front-matter metadata,
 * and substitutes {{variable}} placeholders with actual values.
 */

import {
  CONTINUE_TEMPLATE,
  DIALOGUE_TEMPLATE,
  DESCRIBE_TEMPLATE,
  BRAINSTORM_TEMPLATE,
  ASK_BIBLE_TEMPLATE,
  ENTITY_EXTRACTION_TEMPLATE,
} from './templates.js';

export interface PromptTemplate {
  name: string;
  description: string;
  variables: string[];
  body: string;
}

/**
 * Parse a template string with YAML-like front-matter.
 *
 * Front-matter is delimited by --- lines at the start of the string.
 * Supports: name, description, variables (as a YAML list).
 */
function parseTemplate(raw: string): PromptTemplate {
  const frontMatterMatch = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
  if (!frontMatterMatch) {
    return { name: 'unknown', description: '', variables: [], body: raw.trim() };
  }

  const frontMatter = frontMatterMatch[1]!;
  const body = frontMatterMatch[2]!;
  const lines = frontMatter.split('\n');

  let name = 'unknown';
  let description = '';
  const variables: string[] = [];

  for (const line of lines) {
    const nameMatch = /^name:\s*(.+)/.exec(line);
    if (nameMatch) {
      name = nameMatch[1]!.trim();
      continue;
    }

    const descMatch = /^description:\s*(.+)/.exec(line);
    if (descMatch) {
      description = descMatch[1]!.trim();
      continue;
    }

    // Variable list items: "  - variableName"
    const varMatch = /^\s+-\s+(.+)/.exec(line);
    if (varMatch) {
      variables.push(varMatch[1]!.trim());
    }
  }

  return { name, description, variables, body: body.trim() };
}

export class PromptAssembler {
  private templates = new Map<string, PromptTemplate>();

  constructor() {
    // Load built-in templates
    this.registerTemplate('continue', CONTINUE_TEMPLATE);
    this.registerTemplate('dialogue', DIALOGUE_TEMPLATE);
    this.registerTemplate('describe', DESCRIBE_TEMPLATE);
    this.registerTemplate('brainstorm', BRAINSTORM_TEMPLATE);
    this.registerTemplate('ask_bible', ASK_BIBLE_TEMPLATE);
    this.registerTemplate('extract_entities', ENTITY_EXTRACTION_TEMPLATE);
  }

  /**
   * Register a template from raw string content.
   * Can be used to override built-in templates or add new ones (e.g., for testing).
   */
  registerTemplate(name: string, rawContent: string): void {
    const template = parseTemplate(rawContent);
    template.name = name; // Override parsed name with the registration name
    this.templates.set(name, template);
  }

  /**
   * Get a parsed template by name.
   *
   * @throws Error if template not found
   */
  getTemplate(name: string): PromptTemplate {
    const template = this.templates.get(name);
    if (!template) {
      throw new Error(`Prompt template not found: ${name}`);
    }
    return template;
  }

  /**
   * Assemble a prompt by substituting variables into a template.
   *
   * @param templateName - Name of the template to use
   * @param variables - Key-value pairs for variable substitution
   * @returns The assembled prompt string
   * @throws Error if template not found
   */
  assemble(templateName: string, variables: Record<string, string>): string {
    const template = this.getTemplate(templateName);
    let result = template.body;

    // Replace all {{variable}} occurrences
    result = result.replace(/\{\{(\w+)\}\}/g, (_match, varName: string) => {
      return variables[varName] ?? '';
    });

    return result;
  }

  /**
   * List all registered template names.
   */
  listTemplates(): string[] {
    return Array.from(this.templates.keys());
  }
}
