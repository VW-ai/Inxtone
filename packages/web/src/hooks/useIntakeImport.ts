/**
 * Chapter Import SSE Streaming Hook
 *
 * Uses fetch + ReadableStream to consume POST /api/intake/import-chapters.
 * Parses IntakeProgressEvent SSE messages and updates intake store.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useIntakeStore } from '../stores/useIntakeStore';
import type { IntakeProgressEvent, DecomposeResult } from '@inxtone/core';

interface ChapterInput {
  title: string;
  content: string;
  sortOrder: number;
}

interface UseIntakeImportReturn {
  startImport: (chapters: ChapterInput[]) => void;
  cancel: () => void;
  isImporting: boolean;
  currentStep: string | null;
  currentPass: number;
  progress: number;
  error: string | null;
}

export function useIntakeImport(): UseIntakeImportReturn {
  const [isImporting, setIsImporting] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [currentPass, setCurrentPass] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { setResult } = useIntakeStore();

  // Abort on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setIsImporting(false);
  }, []);

  const startImport = useCallback(
    (chapters: ChapterInput[]) => {
      // Abort any existing import
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsImporting(true);
      setError(null);
      setCurrentStep(null);
      setCurrentPass(0);
      setProgress(0);

      const geminiKey = localStorage.getItem('gemini-api-key');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (geminiKey) headers['X-Gemini-Key'] = geminiKey;

      const init: RequestInit = {
        method: 'POST',
        headers,
        body: JSON.stringify({ chapters }),
      };
      if (controller.signal) init.signal = controller.signal;

      void (async () => {
        try {
          const res = await fetch('/api/intake/import-chapters', init);

          if (!res.ok) {
            const text = await res.text();
            setError(`HTTP ${res.status}: ${text}`);
            setIsImporting(false);
            return;
          }

          if (!res.body) {
            setError('No response body');
            setIsImporting(false);
            return;
          }

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          // Accumulate entity results across passes
          let accumulated: Partial<DecomposeResult> = {};

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });

              // Parse SSE data lines
              const lines = buffer.split('\n\n');
              buffer = lines.pop() ?? '';

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith('data: ')) continue;

                const jsonStr = trimmed.slice(6);
                try {
                  const event = JSON.parse(jsonStr) as IntakeProgressEvent;

                  if (event.type === 'progress') {
                    if (event.step) setCurrentStep(event.step);
                    if (event.pass !== undefined) setCurrentPass(event.pass);
                    if (event.progress !== undefined) setProgress(event.progress);
                  } else if (event.type === 'pass_complete') {
                    if (event.entities) {
                      accumulated = { ...accumulated, ...event.entities };
                    }
                    if (event.pass !== undefined) setCurrentPass(event.pass);
                    if (event.progress !== undefined) setProgress(event.progress);
                  } else if (event.type === 'done') {
                    // Merge final entities
                    if (event.entities) {
                      accumulated = { ...accumulated, ...event.entities };
                    }
                    // Build complete result with defaults
                    const fullResult: DecomposeResult = {
                      characters: [],
                      relationships: [],
                      locations: [],
                      factions: [],
                      foreshadowing: [],
                      arcs: [],
                      hooks: [],
                      timeline: [],
                      warnings: [],
                      ...accumulated,
                    };
                    setResult(fullResult);
                    setProgress(100);
                  } else if (event.type === 'error') {
                    setError(event.error ?? 'Import failed');
                  }
                } catch {
                  // Skip malformed chunks
                }
              }
            }

            // Process remaining buffer
            if (buffer.trim()) {
              const trimmed = buffer.trim();
              if (trimmed.startsWith('data: ')) {
                try {
                  const event = JSON.parse(trimmed.slice(6)) as IntakeProgressEvent;
                  if (event.type === 'error') {
                    setError(event.error ?? 'Import failed');
                  }
                } catch {
                  // Skip
                }
              }
            }
          } finally {
            reader.releaseLock();
          }
        } catch (err: unknown) {
          if (err instanceof Error && err.name === 'AbortError') {
            // Cancelled by user — no error
          } else {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            setError(msg);
          }
        } finally {
          setIsImporting(false);
        }
      })();
    },
    [setResult]
  );

  return { startImport, cancel, isImporting, currentStep, currentPass, progress, error };
}
