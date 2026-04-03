/**
 * App - Root Component
 *
 * Sets up routing, QueryClient, and global providers.
 * Shows ApiKeyDialog on first visit if no key stored.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from './components/layout';
import { Dashboard, StoryBible, Plot, Write, Export, Settings, Intake } from './pages';
import { ApiKeyDialog } from './components/ApiKeyDialog';
import { SearchModal } from './components/SearchModal';
import { ShortcutReferenceModal } from './components/ShortcutReferenceModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotificationToast } from './components/NotificationToast';
import { useApiKeyStore } from './stores/useApiKeyStore';
import { useShortcut, SHORTCUT_REFERENCE } from './hooks/useKeyboardShortcuts';

// Create QueryClient with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function App(): React.ReactElement {
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    const store = useApiKeyStore.getState();
    store.loadFromStorage();
    // Show dialog on first visit if no key stored
    if (!localStorage.getItem('gemini-api-key')) {
      store.openDialog();
    }
  }, []);

  // Global keyboard shortcuts (Cmd+K search, Cmd+/ reference)
  const searchDef = SHORTCUT_REFERENCE.find((d) => d.id === 'search')!;
  const shortcutsDef = SHORTCUT_REFERENCE.find((d) => d.id === 'shortcuts')!;

  useShortcut(searchDef, () => setSearchOpen((prev) => !prev));
  useShortcut(shortcutsDef, () => setShortcutsOpen((prev) => !prev));

  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const closeShortcuts = useCallback(() => setShortcutsOpen(false), []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<AppShell />}>
              <Route index element={<Dashboard />} />
              <Route path="bible" element={<StoryBible />} />
              <Route path="plot" element={<Plot />} />
              <Route path="write" element={<Write />} />
              <Route path="export" element={<Export />} />
              <Route path="intake" element={<Intake />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
          <ApiKeyDialog />
          <SearchModal isOpen={searchOpen} onClose={closeSearch} />
          <ShortcutReferenceModal isOpen={shortcutsOpen} onClose={closeShortcuts} />
          <NotificationToast />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
