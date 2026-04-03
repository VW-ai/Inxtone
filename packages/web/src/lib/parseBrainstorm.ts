/**
 * parseBrainstorm — parse AI brainstorm response into suggestion cards
 *
 * Handles multiple numbered formats:
 *   1. **Title**: Description
 *   ### 1. Title
 *   1. Plain Title: Description
 *
 * Falls back to a single card with the full text if parsing fails.
 */

export interface BrainstormSuggestion {
  id: number;
  title: string;
  body: string;
}

export function parseBrainstorm(text: string): BrainstormSuggestion[] {
  const lines = text.split('\n');
  const suggestions: BrainstormSuggestion[] = [];
  let currentId = 0;
  let currentTitle = '';
  let currentBody: string[] = [];

  const flush = () => {
    if (currentTitle || currentBody.length > 0) {
      suggestions.push({
        id: currentId,
        title: currentTitle || `Idea ${currentId}`,
        body: currentBody.join('\n\n').trim(),
      });
    }
  };

  for (const line of lines) {
    /**
     * Match numbered items in these formats:
     *   "1. **Bold Title**: rest"       → groups[1]=title, groups[2]=rest
     *   "### 1. **Bold Title**– rest"   → groups[1]=title, groups[2]=rest
     *   "### 1. Plain text line"        → groups[3]=full text
     *   "1. Plain text line"            → groups[3]=full text
     *
     * Regex breakdown:
     *   ^(?:#{1,6}\s+)?    — optional markdown heading prefix: "### ", "## ", etc.
     *   \d+\.\s+           — numbered prefix: "1. ", "2. ", etc.
     *   (?:                — non-capturing group for two alternatives:
     *     \*\*(.+?)\*\*    — Alt A: bold title in **...**  → capture group 1
     *     [:\-–]?\s*(.*)   — optional separator (colon/hyphen/en-dash) + rest → group 2
     *   |                  — OR
     *     (.*)             — Alt B: plain text → capture group 3
     *   )$
     */
    const numbered = /^(?:#{1,6}\s+)?\d+\.\s+(?:\*\*(.+?)\*\*[:\-–]?\s*(.*)|(.*))$/.exec(line);
    if (numbered) {
      flush();
      currentId++;
      if (numbered[1]) {
        // **Bold title**: rest
        currentTitle = numbered[1].trim();
        currentBody = numbered[2]?.trim() ? [numbered[2].trim()] : [];
      } else if (numbered[3]) {
        // Plain numbered: use first sentence as title
        const plain = numbered[3].trim();
        const colonIdx = plain.indexOf(':');
        const dashIdx = plain.indexOf(' - ');
        if (colonIdx > 0 && colonIdx < 60) {
          currentTitle = plain.slice(0, colonIdx).trim();
          currentBody = [plain.slice(colonIdx + 1).trim()];
        } else if (dashIdx > 0 && dashIdx < 60) {
          currentTitle = plain.slice(0, dashIdx).trim();
          currentBody = [plain.slice(dashIdx + 3).trim()];
        } else {
          currentTitle = plain.length > 60 ? plain.slice(0, 57) + '...' : plain;
          currentBody = plain.length > 60 ? [plain] : [];
        }
      }
    } else if (currentId > 0 && line.trim()) {
      // Continuation line for current suggestion
      currentBody.push(line.trim());
    }
  }
  flush();

  // Fallback: if no numbered items found, return a single card
  if (suggestions.length === 0 && text.trim()) {
    return [
      {
        id: 1,
        title: 'Brainstorm Result',
        body: text.trim(),
      },
    ];
  }

  return suggestions;
}
