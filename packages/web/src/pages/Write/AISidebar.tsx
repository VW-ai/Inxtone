/**
 * AISidebar — AI panel orchestrator
 *
 * Quick actions (Continue, Brainstorm), prompt input, streaming response,
 * accept/reject/regenerate action bar.
 */

import React from 'react';
import { Button } from '../../components/ui';
import { Textarea } from '../../components/forms';
import {
  useSelectedChapterId,
  useAILoading,
  useAIResponse,
  useEditorActions,
  useEditorStore,
} from '../../stores/useEditorStore';
import { useBuildContext } from '../../hooks';
import { streamAI } from '../../lib/aiStream';
import { ContextPreview } from './ContextPreview';
import { StreamingResponse } from './StreamingResponse';
import { RejectReasonModal } from './RejectReasonModal';
import styles from './AISidebar.module.css';

interface AISidebarProps {
  onAccept: (text: string) => void;
}

export function AISidebar({ onAccept }: AISidebarProps): React.ReactElement {
  const selectedId = useSelectedChapterId();
  const isLoading = useAILoading();
  const aiResponse = useAIResponse();
  const { setAILoading, setAIResponse, appendAIContent, addRejectHistory, setBuiltContext } =
    useEditorActions();

  const { data: contextData } = useBuildContext(selectedId);
  const [promptText, setPromptText] = React.useState('');
  const [showRejectModal, setShowRejectModal] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);
  const lastActionRef = React.useRef<{ endpoint: string; body: Record<string, unknown> } | null>(
    null
  );

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
    void runStream('/ai/continue', body);
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
    // Inject reject context from history
    const history = useEditorStore.getState().aiHistory;
    const lastReject = [...history].reverse().find((h) => h.rejectReason);
    if (lastReject?.rejectReason) {
      body.userInstruction = `Previous attempt was rejected: "${lastReject.rejectReason}". Please try a different approach.`;
    }
    void runStream(endpoint, body);
  };

  // Cleanup abort controller on unmount
  React.useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const hasResponse = !!aiResponse && !isLoading;

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <h3 className={styles.title}>AI Assistant</h3>
      </div>

      <ContextPreview />

      <div className={styles.actions}>
        <div className={styles.quickActions}>
          <Button
            size="sm"
            variant="primary"
            onClick={handleContinue}
            disabled={isLoading || !selectedId}
          >
            Continue
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

      <StreamingResponse />

      {hasResponse && (
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
