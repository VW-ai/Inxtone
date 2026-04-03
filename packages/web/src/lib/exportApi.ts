/**
 * Export API Client
 *
 * Dedicated fetch utility for export endpoints that return raw file data
 * (not JSON envelope). Handles blob download via <a download> pattern.
 */

import { ApiError } from './api';

interface ExportChaptersPayload {
  format: 'md' | 'txt' | 'docx';
  range: {
    type: 'all' | 'volume' | 'chapters';
    volumeId?: number;
    chapterIds?: number[];
  };
  includeOutline?: boolean;
  includeMetadata?: boolean;
}

interface ExportBiblePayload {
  sections?: string[];
}

async function fetchExport(path: string, body: unknown): Promise<void> {
  const res = await fetch(`/api/export${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new ApiError('EXPORT_ERROR', `Export failed: ${text}`);
  }

  // Extract filename from Content-Disposition header
  const disposition = res.headers.get('Content-Disposition') ?? '';
  const filenameMatch = /filename="([^"]+)"/.exec(disposition);
  const filename = filenameMatch?.[1]?.replace(/[^a-zA-Z0-9._-]/g, '_') ?? 'export';

  // Download via blob + <a> trick
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportChapters(payload: ExportChaptersPayload): Promise<void> {
  await fetchExport('/chapters', payload);
}

export async function exportStoryBible(payload?: ExportBiblePayload): Promise<void> {
  await fetchExport('/story-bible', payload ?? {});
}
