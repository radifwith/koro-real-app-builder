

# Raxzen AI — 4 Feature Improvements Plan

## 1. History Panel — Pin Feature
**Current:** History items can only be clicked to load a session.
**Change:** Add a pin icon button on each history item. Pinned sessions will be stored in `localStorage` and shown at the top of the history list with a visual pin indicator. Pinned items won't get removed when history exceeds 50 items.

**File:** `src/components/HistoryPanel.tsx`
- Add `Pin` icon button on each session card
- New prop `onPinSession` and `pinnedIds` set
- Pinned items sorted to top with a separator

**File:** `src/pages/Index.tsx`
- Add `pinnedSessions` state backed by `localStorage`
- Pass pin handlers to `HistoryPanel`

---

## 2. Quiz Mode — Interactive Quiz Card UI
**Current:** Quiz mode just sends text to AI like other modes. `QuizCard` component exists but is hardcoded and not integrated.
**Change:** When in Quiz mode, AI responses containing questions with options (A/B/C/D) will be parsed and rendered as interactive quiz cards with animated question box, selectable options, and correct/wrong feedback.

**File:** `src/components/QuizCard.tsx`
- Rewrite to accept dynamic props: `question`, `options[]`, `correctIndex`, `onAnswer`
- Add entrance animation (slide-up box style)
- Show progress indicator

**File:** `src/components/MessageBubble.tsx`
- Detect quiz-format responses (question + A/B/C/D pattern)
- Parse and render `QuizCard` instead of plain markdown when quiz content detected

**File:** `supabase/functions/chat/index.ts`
- Update quiz mode system prompt to always output structured format:
  ```
  QUESTION: ...
  A) ...
  B) ...
  C) ...
  D) ...
  ANSWER: B
  ```

---

## 3. TopBar — Logo/Name Links to Developer Page
**Current:** Logo and "Raxzen AI" text are static, no click action.
**Change:** Wrap logo + name in an `<a>` tag that opens `https://raxzenapp-p9ksao39.manus.space/` in a new tab.

**File:** `src/components/TopBar.tsx`
- Wrap the logo+name div with `<a href="https://raxzenapp-p9ksao39.manus.space/" target="_blank">`

---

## 4. Code Block — Dedicated Copy Button
**Current:** Code blocks in AI responses use the `pre` component from react-markdown but have no copy button. The standalone `CodeBlock` component has copy but isn't used in MessageBubble.
**Change:** Add a copy button inside the `pre` renderer in `MessageBubble.tsx` so every code block in AI responses gets its own copy button with the code content only (not the surrounding text).

**File:** `src/components/MessageBubble.tsx`
- Update the `pre` component in ReactMarkdown to extract code text and add a copy button in the top-right corner
- Use the same copy logic (clipboard + "Copied!" feedback)

---

## Summary of Files to Edit
1. `src/components/HistoryPanel.tsx` — Pin feature
2. `src/pages/Index.tsx` — Pin state management
3. `src/components/QuizCard.tsx` — Dynamic interactive quiz
4. `src/components/MessageBubble.tsx` — Quiz detection + code block copy
5. `src/components/TopBar.tsx` — Clickable logo link
6. `supabase/functions/chat/index.ts` — Quiz mode structured output prompt

