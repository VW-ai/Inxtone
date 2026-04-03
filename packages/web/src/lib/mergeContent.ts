/**
 * mergeContent — merge AI-generated text into existing editor content
 *
 * Supports two modes:
 * - Insert at cursor position (mid-content)
 * - Append at end
 *
 * Ensures exactly \n\n paragraph breaks at join points.
 */

/**
 * Merge new text into existing content at a specific position.
 *
 * @param currentContent - The existing editor content
 * @param newText - The AI-generated text to merge
 * @param cursorPosition - Where to insert (null/undefined = append at end)
 * @returns The merged content string
 */
export function mergeContent(
  currentContent: string,
  newText: string,
  cursorPosition?: number | null
): string {
  const isInsertMode =
    cursorPosition != null && cursorPosition >= 0 && cursorPosition < currentContent.length;

  if (isInsertMode) {
    const before = currentContent.slice(0, cursorPosition);
    const after = currentContent.slice(cursorPosition);
    const sep1 = before
      ? before.endsWith('\n\n')
        ? ''
        : before.endsWith('\n')
          ? '\n'
          : '\n\n'
      : '';
    const sep2 = after
      ? after.startsWith('\n\n')
        ? ''
        : after.startsWith('\n')
          ? '\n'
          : '\n\n'
      : '';
    return before + sep1 + newText + sep2 + after;
  }

  return currentContent + (currentContent ? '\n\n' : '') + newText;
}
