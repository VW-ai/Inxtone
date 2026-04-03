/**
 * useKeyboardShortcuts — global keyboard shortcut registry
 *
 * Registers a single global keydown listener. Components register/unregister
 * shortcuts via useShortcut(). getShortcutDefinitions() provides data for
 * the reference modal.
 */

import { useEffect, useRef } from 'react';

export interface ShortcutDef {
  id: string;
  key: string;
  meta?: boolean;
  shift?: boolean;
  description: string;
  category: 'navigation' | 'editing' | 'ai' | 'general';
}

interface RegisteredShortcut extends ShortcutDef {
  handler: () => void;
  when?: () => boolean;
}

// Global shortcut registry (module-level singleton)
const registry: RegisteredShortcut[] = [];

/**
 * Register a keyboard shortcut. Call from a useEffect cleanup to unregister.
 */
function registerShortcut(shortcut: RegisteredShortcut): () => void {
  registry.push(shortcut);
  return () => {
    const idx = registry.indexOf(shortcut);
    if (idx !== -1) registry.splice(idx, 1);
  };
}

/**
 * Global keydown handler — matches against all registered shortcuts.
 */
function handleGlobalKeydown(e: KeyboardEvent): void {
  // Don't intercept when typing in inputs (unless meta/ctrl is held)
  const target = e.target as HTMLElement;
  const isInput =
    target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

  for (const shortcut of registry) {
    const metaMatch = shortcut.meta ? e.metaKey || e.ctrlKey : !(e.metaKey || e.ctrlKey);
    const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
    const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

    if (metaMatch && shiftMatch && keyMatch) {
      // Skip non-meta shortcuts when in input
      if (isInput && !shortcut.meta) continue;
      // Check conditional activation
      if (shortcut.when && !shortcut.when()) continue;

      e.preventDefault();
      shortcut.handler();
      return;
    }
  }
}

// Install global listener once
let installed = false;
function ensureGlobalListener(): void {
  if (installed) return;
  installed = true;
  window.addEventListener('keydown', handleGlobalKeydown);
}

// HMR cleanup: remove stale listeners when module is hot-replaced
// @ts-expect-error - import.meta.hot is provided by Vite for HMR

if (import.meta.hot) {
  // @ts-expect-error - import.meta.hot.dispose is a Vite HMR API
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  import.meta.hot.dispose(() => {
    window.removeEventListener('keydown', handleGlobalKeydown);
    installed = false;
  });
}

/**
 * Hook to register a keyboard shortcut for the component's lifetime.
 */
export function useShortcut(def: ShortcutDef, handler: () => void, when?: () => boolean): void {
  const handlerRef = useRef(handler);
  const whenRef = useRef(when);
  handlerRef.current = handler;
  whenRef.current = when;

  useEffect(() => {
    ensureGlobalListener();

    const shortcut: RegisteredShortcut = {
      ...def,
      handler: () => handlerRef.current(),
    };
    if (whenRef.current) {
      shortcut.when = () => whenRef.current!();
    }

    return registerShortcut(shortcut);
  }, [def.id, def.key, def.meta, def.shift]);
}

/**
 * Get all registered shortcut definitions for the reference modal.
 */
export function getShortcutDefinitions(): ShortcutDef[] {
  return registry.map(({ handler: _handler, when: _when, ...def }) => def);
}

/**
 * Static shortcut definitions for the reference modal.
 * These are always shown regardless of which shortcuts are currently registered.
 */
export const SHORTCUT_REFERENCE: ShortcutDef[] = [
  { id: 'search', key: 'k', meta: true, description: 'Open search', category: 'general' },
  { id: 'save', key: 's', meta: true, description: 'Save chapter', category: 'editing' },
  { id: 'continue', key: 'Enter', meta: true, description: 'AI Continue', category: 'ai' },
  { id: 'shortcuts', key: '/', meta: true, description: 'Shortcut reference', category: 'general' },
];
