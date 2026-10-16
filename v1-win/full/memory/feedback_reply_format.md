---
name: feedback_reply_format
description: "How the user wants replies laid out: ## section headings (drawn as ▍ bars by the skins mod) with short bullets, not bold-label paragraphs"
metadata:
  node_type: memory
  type: feedback
  originSessionId: a45701a8-1a29-45e0-9fa3-993d028d4590
  modified: 2026-10-15T17:58:40.507Z
---

Structure replies as `##` section headings with short bullet lists underneath, like:

```
## Why you only saw the project tree
One or two sentences, then bullets.
## After the restart
- bullet
- bullet
```

**Why:** The user runs the skins mod, which draws level-1 and level-2 markdown headings as a `▍ Title` bar (see `skins/hooks/prose.tsx`: `level <= 2`). They said this "highlights the section neatly and makes it easy to read", and pasted a heading-structured reply with "I want this" after a reply that used bold labels instead. See [[project_claude_code_rice]].

**How to apply:**
- Use `##` (or `#`) for sections in anything longer than a couple of sentences. `###` and bold do NOT get the `▍` bar, so don't rely on them for section breaks.
- Keep each section tight: a lead sentence plus bullets. Short answers can stay a single paragraph with no heading.
- This is a layout preference only; it doesn't change how much detail to include or the plain, honest tone.
