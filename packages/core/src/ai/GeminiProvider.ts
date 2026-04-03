/**
 * GeminiProvider - Wraps @google/genai SDK for Gemini 2.5 Pro
 *
 * Handles:
 * - Streaming generation via generateContentStream()
 * - Retry with exponential backoff (3 attempts)
 * - Error mapping to AIStreamChunk error format
 * - Token estimation via tokenCounter
 *
 * MVP: Single provider (Gemini 2.5 Pro), no fallback chain.
 * Provider abstraction preserved in IAIService interface for M4+ expansion.
 *
 * @see spec/Modules/03_ai_service.md §2.3 Gemini Provider 调用
 */

import { GoogleGenAI } from '@google/genai';
import type { AIGenerationOptions, AIStreamChunk } from '../types/services.js';
import { countTokens } from './tokenCounter.js';

export interface GeminiProviderOptions {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  retryCount?: number;
  retryDelayMs?: number;
}

const DEFAULT_OPTIONS: Required<GeminiProviderOptions> = {
  model: 'gemini-3-flash-preview',
  temperature: 0.7,
  maxOutputTokens: 4000,
  retryCount: 3,
  retryDelayMs: 1000,
};

export class GeminiProvider {
  private client: GoogleGenAI | null = null;
  private readonly options: Required<GeminiProviderOptions>;
  private currentApiKey: string | undefined;

  constructor(apiKey: string | undefined, options?: GeminiProviderOptions) {
    this.currentApiKey = apiKey;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Check if the provider is configured (API key is set).
   */
  isConfigured(): boolean {
    return !!this.currentApiKey;
  }

  /**
   * Update the API key at runtime (e.g., from per-request header).
   * Clears the cached client so a new one is created with the new key.
   */
  updateApiKey(key: string): void {
    if (key !== this.currentApiKey) {
      this.currentApiKey = key;
      this.client = null;
    }
  }

  /**
   * Stream a generation request.
   * Returns an async generator of AIStreamChunk.
   * Retries on retriable errors (rate limit, network) with exponential backoff.
   */
  async *stream(prompt: string, options?: AIGenerationOptions): AsyncGenerator<AIStreamChunk> {
    if (!this.isConfigured()) {
      yield {
        type: 'error',
        error:
          'AI_PROVIDER_ERROR: Gemini API key not configured. Set GEMINI_API_KEY environment variable.',
      };
      return;
    }

    const model = options?.model ?? this.options.model;
    const temperature = options?.temperature ?? this.options.temperature;
    const maxOutputTokens = options?.maxTokens ?? this.options.maxOutputTokens;

    for (let attempt = 1; attempt <= this.options.retryCount; attempt++) {
      try {
        const client = this.getClient();
        const response = await client.models.generateContentStream({
          model,
          contents: prompt,
          config: {
            temperature,
            maxOutputTokens,
          },
        });

        let promptTokens = 0;
        let completionTokens = 0;

        for await (const chunk of response) {
          if (chunk.text) {
            yield { type: 'content', content: chunk.text };
          }
          // Extract token usage from usageMetadata (last chunk typically has final counts)
          if (chunk.usageMetadata) {
            promptTokens = chunk.usageMetadata.promptTokenCount ?? promptTokens;
            completionTokens = chunk.usageMetadata.candidatesTokenCount ?? completionTokens;
          }
        }

        const doneChunk: AIStreamChunk = { type: 'done' };
        if (promptTokens > 0 || completionTokens > 0) {
          doneChunk.usage = { promptTokens, completionTokens };
        }
        yield doneChunk;
        return; // Success — exit retry loop
      } catch (err: unknown) {
        if (this.isRetriable(err) && attempt < this.options.retryCount) {
          await this.sleep(this.options.retryDelayMs * Math.pow(2, attempt - 1));
          continue;
        }

        yield this.mapError(err);
        return;
      }
    }
  }

  /**
   * Non-streaming JSON generation.
   * Uses responseMimeType: 'application/json' for structured output.
   * Retries on retriable errors with exponential backoff.
   */
  async generateJSON<T>(prompt: string, options?: AIGenerationOptions): Promise<T> {
    if (!this.isConfigured()) {
      throw new Error('AI_PROVIDER_ERROR: Gemini API key not configured.');
    }

    const model = options?.model ?? this.options.model;
    const temperature = options?.temperature ?? 0.3;
    const maxOutputTokens = options?.maxTokens ?? this.options.maxOutputTokens;
    const fullPrompt = `${prompt}\n\nRespond with valid JSON only. No markdown, no explanation, no code fences.`;

    for (let attempt = 1; attempt <= this.options.retryCount; attempt++) {
      try {
        const client = this.getClient();
        const response = await client.models.generateContent({
          model,
          contents: fullPrompt,
          config: {
            temperature,
            maxOutputTokens,
            responseMimeType: 'application/json',
          },
        });

        const text = response.text ?? '';
        const parsed: unknown = JSON.parse(text);

        // Basic validation: ensure result is not null/undefined
        if (parsed == null) {
          throw new Error('AI_PROVIDER_ERROR: AI returned null/empty JSON response.');
        }

        return parsed as T;
      } catch (err: unknown) {
        if (this.isRetriable(err) && attempt < this.options.retryCount) {
          await this.sleep(this.options.retryDelayMs * Math.pow(2, attempt - 1));
          continue;
        }
        throw err;
      }
    }

    throw new Error('AI_PROVIDER_ERROR: Max retries exceeded.');
  }

  /**
   * Estimate token count for text using the estimation-based counter.
   */
  countTokens(text: string): number {
    return countTokens(text);
  }

  /**
   * Verify an API key by making a lightweight Gemini call.
   * Returns { valid: true } on success or { valid: false, error: string } on failure.
   */
  static async verifyApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const client = new GoogleGenAI({ apiKey });
      await client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: 'Hi',
        config: { maxOutputTokens: 5 },
      });
      return { valid: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return { valid: false, error: msg };
    }
  }

  // ===================================
  // Private Helpers
  // ===================================

  /**
   * Lazily initialize the GoogleGenAI client.
   */
  private getClient(): GoogleGenAI {
    this.client ??= new GoogleGenAI({ apiKey: this.currentApiKey! });
    return this.client;
  }

  /**
   * Check if an error is retriable (rate limit, network).
   */
  private isRetriable(err: unknown): boolean {
    if (err instanceof Error) {
      const message = err.message.toLowerCase();
      // Rate limit (429)
      if (
        message.includes('429') ||
        message.includes('rate limit') ||
        message.includes('resource_exhausted')
      ) {
        return true;
      }
      // Network errors
      if (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('econnrefused') ||
        message.includes('enotfound')
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Map an SDK error to an AIStreamChunk error.
   */
  private mapError(err: unknown): AIStreamChunk {
    if (!(err instanceof Error)) {
      return { type: 'error', error: 'AI_PROVIDER_ERROR: Unknown error occurred.' };
    }

    const message = err.message.toLowerCase();

    // Auth errors (401/403)
    if (
      message.includes('401') ||
      message.includes('403') ||
      message.includes('api_key') ||
      message.includes('unauthorized') ||
      message.includes('permission')
    ) {
      return {
        type: 'error',
        error: 'AI_PROVIDER_ERROR: Invalid API key. Check your GEMINI_API_KEY.',
      };
    }

    // Rate limit (429)
    if (
      message.includes('429') ||
      message.includes('rate limit') ||
      message.includes('resource_exhausted')
    ) {
      return {
        type: 'error',
        error: 'AI_RATE_LIMITED: Rate limit exceeded. Please wait and try again.',
      };
    }

    // Content filter
    if (
      message.includes('safety') ||
      message.includes('block') ||
      message.includes('content_filter') ||
      message.includes('recitation')
    ) {
      return {
        type: 'error',
        error:
          'AI_CONTENT_FILTERED: Content was filtered by safety settings. Try modifying your input.',
      };
    }

    // Context too large
    if (message.includes('token') && (message.includes('limit') || message.includes('exceed'))) {
      return {
        type: 'error',
        error: 'AI_CONTEXT_TOO_LARGE: Input exceeds token limit. Try reducing the context.',
      };
    }

    // Generic provider error
    return {
      type: 'error',
      error: `AI_PROVIDER_ERROR: ${err.message}`,
    };
  }

  /**
   * Sleep for a given number of milliseconds.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
