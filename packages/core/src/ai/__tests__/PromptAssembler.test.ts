import { describe, it, expect } from 'vitest';
import { PromptAssembler } from '../PromptAssembler.js';

describe('PromptAssembler', () => {
  describe('constructor', () => {
    it('loads all built-in templates', () => {
      const assembler = new PromptAssembler();
      const templates = assembler.listTemplates();
      expect(templates).toContain('continue');
      expect(templates).toContain('dialogue');
      expect(templates).toContain('describe');
      expect(templates).toContain('brainstorm');
      expect(templates).toContain('ask_bible');
    });
  });

  describe('getTemplate', () => {
    it('returns parsed template with metadata', () => {
      const assembler = new PromptAssembler();
      const template = assembler.getTemplate('continue');
      expect(template.name).toBe('continue');
      expect(template.description).toBe('Continue the current chapter content');
      expect(template.variables).toContain('context');
      expect(template.variables).toContain('current_content');
      expect(template.variables).toContain('user_instruction');
      expect(template.body).toContain('Continue');
    });

    it('throws for unknown template', () => {
      const assembler = new PromptAssembler();
      expect(() => assembler.getTemplate('nonexistent')).toThrow(
        'Prompt template not found: nonexistent'
      );
    });
  });

  describe('registerTemplate', () => {
    it('registers a custom template', () => {
      const assembler = new PromptAssembler();
      assembler.registerTemplate(
        'custom',
        `---
name: custom
description: A custom template
variables:
  - foo
  - bar
---

Hello {{foo}}, welcome to {{bar}}.`
      );

      const template = assembler.getTemplate('custom');
      expect(template.name).toBe('custom');
      expect(template.description).toBe('A custom template');
      expect(template.variables).toEqual(['foo', 'bar']);
    });

    it('can override built-in templates', () => {
      const assembler = new PromptAssembler();
      assembler.registerTemplate(
        'continue',
        `---
name: continue_override
description: Override
variables:
  - text
---

Custom: {{text}}`
      );

      const result = assembler.assemble('continue', { text: 'hello' });
      expect(result).toBe('Custom: hello');
    });
  });

  describe('assemble', () => {
    it('substitutes all variables', () => {
      const assembler = new PromptAssembler();
      assembler.registerTemplate(
        'test',
        `---
name: test
description: test
variables:
  - name
  - greeting
---

{{greeting}}, {{name}}! Welcome.`
      );

      const result = assembler.assemble('test', { name: 'Alice', greeting: 'Hello' });
      expect(result).toBe('Hello, Alice! Welcome.');
    });

    it('replaces missing variables with empty string', () => {
      const assembler = new PromptAssembler();
      assembler.registerTemplate(
        'test',
        `---
name: test
description: test
variables:
  - name
  - title
---

{{title}} {{name}}`
      );

      const result = assembler.assemble('test', { name: 'Bob' });
      expect(result).toBe(' Bob');
    });

    it('handles template with no front-matter', () => {
      const assembler = new PromptAssembler();
      assembler.registerTemplate('plain', 'Just plain text with {{var}}.');

      const result = assembler.assemble('plain', { var: 'value' });
      expect(result).toBe('Just plain text with value.');
    });

    it('handles multiple occurrences of the same variable', () => {
      const assembler = new PromptAssembler();
      assembler.registerTemplate(
        'test',
        `---
name: test
description: test
variables:
  - word
---

{{word}} and {{word}} again.`
      );

      const result = assembler.assemble('test', { word: 'hello' });
      expect(result).toBe('hello and hello again.');
    });

    it('throws for unknown template name', () => {
      const assembler = new PromptAssembler();
      expect(() => assembler.assemble('nonexistent', {})).toThrow('Prompt template not found');
    });

    it('works with built-in continue template', () => {
      const assembler = new PromptAssembler();
      const result = assembler.assemble('continue', {
        context: '## 角色\n林逸：主角',
        current_content: '林逸走进了大殿...',
        user_instruction: '请描写战斗场景',
      });
      expect(result).toContain('## 角色');
      expect(result).toContain('林逸走进了大殿...');
      expect(result).toContain('请描写战斗场景');
    });

    it('works with built-in dialogue template', () => {
      const assembler = new PromptAssembler();
      const result = assembler.assemble('dialogue', {
        context: '故事背景',
        characters: '林逸、陈浩',
        scene_description: '两人在擂台对峙',
        user_instruction: '',
      });
      expect(result).toContain('林逸、陈浩');
      expect(result).toContain('两人在擂台对峙');
    });
  });

  describe('listTemplates', () => {
    it('returns all template names', () => {
      const assembler = new PromptAssembler();
      const names = assembler.listTemplates();
      expect(names.length).toBe(6);
    });

    it('includes newly registered templates', () => {
      const assembler = new PromptAssembler();
      assembler.registerTemplate('custom', 'Content');
      expect(assembler.listTemplates()).toContain('custom');
      expect(assembler.listTemplates().length).toBe(7);
    });
  });
});
