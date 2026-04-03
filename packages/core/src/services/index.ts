/**
 * Services Layer Exports
 *
 * All service implementations for business logic.
 */

export { EventBus } from './EventBus.js';
export { StoryBibleService } from './StoryBibleService.js';
export type { StoryBibleServiceDeps } from './StoryBibleService.js';
export { WritingService } from './WritingService.js';
export type { WritingServiceDeps } from './WritingService.js';
export { ExportService } from './ExportService.js';
export type { ExportServiceDeps } from './ExportService.js';
export { SearchService } from './SearchService.js';
export { ChapterSetupAssist } from './ChapterSetupAssist.js';
export type { SetupSuggestion, ChapterSetupAssistDeps } from './ChapterSetupAssist.js';
export { AIService } from '../ai/AIService.js';
export type { AIServiceDeps, AIServiceOptions } from '../ai/AIService.js';
export { BaseContextBuilder } from '../ai/BaseContextBuilder.js';
export type { ContextBuilderDeps } from '../ai/BaseContextBuilder.js';
export { ChapterContextBuilder } from '../ai/ChapterContextBuilder.js';
export { GlobalContextBuilder } from '../ai/GlobalContextBuilder.js';
export { PromptAssembler } from '../ai/PromptAssembler.js';
export { GeminiProvider } from '../ai/GeminiProvider.js';
export type { GeminiProviderOptions } from '../ai/GeminiProvider.js';
export { IntakeService } from '../ai/IntakeService.js';
export type { IntakeServiceDeps, IntakeServiceOptions } from '../ai/IntakeService.js';

// Re-export errors for convenience
export * from '../errors/index.js';
