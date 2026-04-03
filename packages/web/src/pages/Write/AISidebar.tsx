/**
 * AISidebar — AI panel orchestrator
 *
 * Quick actions (Continue, Brainstorm), prompt input, streaming response,
 * accept/reject/regenerate action bar, iterative brainstorm direction explorer.
 */

import React from 'react';
import { Button } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { Textarea } from '../../components/forms';
import {
  useSelectedChapterId,
  useAILoading,
  useAIResponse,
  useExcludedContextIds,
  useInjectedEntities,
  useEditorActions,
  useEditorStore,
  useBrainstormStack,
} from '../../stores/useEditorStore';
import { useBuildContext } from '../../hooks';
import { streamAI } from '../../lib/aiStream';
import { parseBrainstorm } from '../../lib/parseBrainstorm';
import type { BrainstormSuggestion } from '../../lib/parseBrainstorm';
import { ContextPreview } from './ContextPreview';
import { PromptPresets } from './PromptPresets';
import { StreamingResponse } from './StreamingResponse';
import { BrainstormPanel } from './BrainstormPanel';
import { RejectReasonModal } from './RejectReasonModal';
import styles from './AISidebar.module.css';

interface AISidebarProps {
  onAccept: (text: string) => void;
}

export function AISidebar({ onAccept }: AISidebarProps): React.ReactElement {
  const selectedId = useSelectedChapterId();
  const isLoading = useAILoading();
  const aiResponse = useAIResponse();
  const excludedIds = useExcludedContextIds();
  const injectedEntities = useInjectedEntities();
  const brainstormStack = useBrainstormStack();
  const {
    setAILoading,
    setAIResponse,
    appendAIContent,
    addRejectHistory,
    setBuiltContext,
    pushBrainstormLayer,
    popBrainstormLayer,
    clearBrainstormStack,
  } = useEditorActions();

  const additionalItems = injectedEntities.length > 0 ? injectedEntities : undefined;
  const { data: contextData } = useBuildContext(selectedId, additionalItems);
  const [promptText, setPromptText] = React.useState('');
  const [showRejectModal, setShowRejectModal] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);
  const lastActionRef = React.useRef<{ endpoint: string; body: Record<string, unknown> } | null>(
    null
  );

  // Track current AI action for distinguishing continue vs brainstorm
  const aiAction = useEditorStore((s) => s.aiAction);

  // Brainstorm stack management refs
  const pendingTopicRef = React.useRef<string>('');
  const processedRef = React.useRef<string | null>(null);

  // Sync context data to store
  React.useEffect(() => {
    if (contextData) {
      setBuiltContext(contextData);
    }
  }, [contextData, setBuiltContext]);

  const runStream = React.useCallback(
    async (endpoint: string, body: Record<string, unknown>) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      lastActionRef.current = { endpoint, body };
      setAILoading(true);
      setAIResponse('', endpoint);

      try {
        for await (const chunk of streamAI(endpoint, body, controller.signal)) {
          if (chunk.type === 'content' && chunk.content) {
            appendAIContent(chunk.content);
          } else if (chunk.type === 'error') {
            setAIResponse(`Error: ${chunk.error ?? 'Unknown error'}`, endpoint);
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          // Cancelled by user
        } else {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          setAIResponse(`Error: ${msg}`, null);
        }
      } finally {
        setAILoading(false);
      }
    },
    [setAILoading, setAIResponse, appendAIContent]
  );

  const handleContinue = () => {
    if (!selectedId) return;
    const body: Record<string, unknown> = { chapterId: selectedId };
    if (promptText.trim()) body.userInstruction = promptText.trim();
    const excluded = Array.from(excludedIds);
    if (excluded.length > 0) body.excludedContextIds = excluded;
    void runStream('/ai/continue', body);
  };

  const handleBrainstorm = () => {
    if (!selectedId) return;
    const topic = promptText.trim() || 'What should happen next in this chapter?';
    pendingTopicRef.current = topic;
    processedRef.current = null;
    const body: Record<string, unknown> = { topic, chapterId: selectedId };
    void runStream('/ai/brainstorm', body);
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setAILoading(false);
  };

  const handleAccept = () => {
    if (aiResponse) {
      onAccept(aiResponse);
      // clearAIState() is called by Write.tsx after preview confirmation
    }
  };

  const handleReject = (reason: string) => {
    addRejectHistory(reason);
    setShowRejectModal(false);
  };

  const handleRegenerate = () => {
    if (!lastActionRef.current) return;
    const { endpoint, body } = lastActionRef.current;

    // For brainstorm regeneration: pop current layer so new results replace at same depth
    if (endpoint === '/ai/brainstorm' && brainstormStack.length > 0) {
      popBrainstormLayer();
      processedRef.current = null;
      void runStream(endpoint, body);
      return;
    }

    // Inject reject context from history for continue regeneration
    const history = useEditorStore.getState().aiHistory;
    const lastReject = [...history].reverse().find((h) => h.rejectReason);
    if (lastReject?.rejectReason) {
      body.userInstruction = `Previous attempt was rejected: "${lastReject.rejectReason}". Please try a different approach.`;
    }
    void runStream(endpoint, body);
  };

  // When brainstorm stream finishes, parse and push to stack
  React.useEffect(() => {
    if (aiAction !== '/ai/brainstorm' || isLoading || !aiResponse) return;
    if (processedRef.current === aiResponse) return;
    processedRef.current = aiResponse;
    const suggestions = parseBrainstorm(aiResponse);
    if (suggestions.length > 0) {
      pushBrainstormLayer({
        suggestions,
        selectedId: null,
        topic: pendingTopicRef.current,
      });
    }
    // Clear raw AI response (now captured in stack)
    setAIResponse(null, null);
  }, [aiAction, isLoading, aiResponse, pushBrainstormLayer, setAIResponse]);

  const handleDigDeeper = (suggestion: BrainstormSuggestion) => {
    if (!selectedId) return;
    const topic = suggestion.title;
    const userInstruction = suggestion.body
      ? `The user selected direction: "${suggestion.title}: ${suggestion.body}". Provide 3-5 more specific sub-directions or scene breakdowns for this direction.`
      : `The user selected direction: "${suggestion.title}". Provide 3-5 more specific sub-directions or scene breakdowns for this direction.`;
    pendingTopicRef.current = topic;
    processedRef.current = null;
    const body: Record<string, unknown> = { topic, userInstruction, chapterId: selectedId };
    void runStream('/ai/brainstorm', body);
  };

  const handleWriteThis = (suggestion: BrainstormSuggestion) => {
    if (!selectedId) return;
    const instruction = suggestion.body
      ? `${suggestion.title}: ${suggestion.body}`
      : suggestion.title;
    setPromptText(instruction);
    clearBrainstormStack();
    // Auto-trigger continue with selected direction
    const body: Record<string, unknown> = {
      chapterId: selectedId,
      userInstruction: instruction,
    };
    const excluded = Array.from(excludedIds);
    if (excluded.length > 0) body.excludedContextIds = excluded;
    void runStream('/ai/continue', body);
  };

  const handleBrainstormBack = () => {
    popBrainstormLayer();
  };

  const handleDismissBrainstorm = () => {
    clearBrainstormStack();
    const { clearAIState } = useEditorStore.getState();
    clearAIState();
  };

  // Abort stream on chapter switch or unmount
  React.useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, [selectedId]);

  const hasBrainstorm = brainstormStack.length > 0;
  const isBrainstormLoading = aiAction === '/ai/brainstorm' && isLoading;
  const isContinueResult = !!aiResponse && !isLoading && aiAction === '/ai/continue';

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <h3 className={styles.title}>AI Assistant</h3>
      </div>

      <ContextPreview />

      <PromptPresets
        onSelect={(instruction) => {
          setPromptText((prev) => (prev ? `${prev}\n${instruction}` : instruction));
        }}
      />

      <div className={styles.actions}>
        <div className={styles.quickActions}>
          <Button variant="primary" onClick={handleContinue} disabled={isLoading || !selectedId}>
            <Icon name="play" className={styles.btnIcon} />
            Continue
          </Button>
          <Button
            variant="secondary"
            onClick={handleBrainstorm}
            disabled={isLoading || !selectedId}
          >
            <Icon name="sparkle" className={styles.btnIcon} />
            Brainstorm
          </Button>
          {isLoading && (
            <Button size="sm" variant="ghost" onClick={handleStop}>
              Stop
            </Button>
          )}
        </div>

        <div className={styles.prompt}>
          <Textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            rows={2}
            placeholder="Instructions for AI (optional)..."
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Show brainstorm stack or streaming response */}
      {hasBrainstorm || isBrainstormLoading ? (
        <BrainstormPanel
          stack={brainstormStack}
          onDigDeeper={handleDigDeeper}
          onWriteThis={handleWriteThis}
          onBack={handleBrainstormBack}
          onRegenerate={handleRegenerate}
          onDismiss={handleDismissBrainstorm}
          isLoading={isBrainstormLoading}
        />
      ) : (
        <StreamingResponse />
      )}

      {isContinueResult && (
        <div className={styles.actionBar}>
          <Button size="sm" variant="primary" onClick={handleAccept}>
            Accept
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowRejectModal(true)}>
            Reject
          </Button>
          <Button size="sm" variant="secondary" onClick={handleRegenerate}>
            Regenerate
          </Button>
        </div>
      )}

      <RejectReasonModal
        isOpen={showRejectModal}
        onConfirm={handleReject}
        onCancel={() => setShowRejectModal(false)}
      />
    </div>
  );
}
