// tab-title.mjs: sets the terminal tab title so you can tell parallel Claude Code sessions apart
// and see which one needs you. Silent (no sound, no toast). Wired to UserPromptSubmit,
// PermissionRequest and Stop as synchronous command hooks: terminalSequence is ignored for async hooks.
//
// Reads the hook payload on stdin, prints {"terminalSequence": "<OSC 2 title>"} on stdout.
// Any failure prints nothing and exits 0, so a bad payload can never break a session.
//
// The title carries the git branch ("folder ⎇ branch") so the status line does not have to.
// The branch is read straight from .git/HEAD: no `git` process is started, so nothing inside the
// repository you are in (hooks, fsmonitor, aliases) can run, and the hook stays as fast as before.

import { readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const TITLES = {
  UserPromptSubmit: (project) => `◐ ${project}`,
  PermissionRequest: (project) => `▲ ${project} · needs you`,
  Stop: (project) => `✓ ${project} · done`,
};

// Walks up from `start` to the nearest .git (a folder, or a file for worktrees and submodules)
// and returns the checked-out branch. '' when not in a repo, on a detached HEAD, or on any error.
function branchOf(start) {
  try {
    let dir = resolve(start);
    for (let depth = 0; depth < 64; depth += 1) {
      const dotGit = join(dir, '.git');
      let info = null;
      try { info = statSync(dotGit); } catch { /* not here, keep climbing */ }
      if (info) {
        let gitDir = dotGit;
        if (info.isFile()) {
          const pointer = /^gitdir:\s*(.+)$/m.exec(readFileSync(dotGit, 'utf8'));
          if (!pointer) return '';
          gitDir = resolve(dir, pointer[1].trim());
        }
        const head = /^ref:\s*refs\/heads\/(.+)$/m.exec(readFileSync(join(gitDir, 'HEAD'), 'utf8'));
        return head ? head[1].trim() : '';
      }
      const parent = dirname(dir);
      if (parent === dir) return '';
      dir = parent;
    }
  } catch {
    // unreadable HEAD, permissions, odd paths: no branch
  }
  return '';
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { raw += chunk; });
process.stdin.on('end', () => {
  try {
    const payload = JSON.parse(raw);
    const make = TITLES[payload.hook_event_name];
    if (!make || typeof payload.cwd !== 'string') return;

    const folder = payload.cwd.split(/[\\/]+/).filter(Boolean).pop() || 'claude';
    const branch = branchOf(payload.cwd);
    // Strip control characters so a hostile directory or branch name cannot smuggle escape sequences into the title.
    const safe = make(branch ? `${folder} ⎇ ${branch}` : folder).replace(/[\u0000-\u001f\u007f-\u009f]/g, '').slice(0, 80);
    process.stdout.write(JSON.stringify({ terminalSequence: `\u001b]2;${safe}\u0007` }));
  } catch {
    // stay silent on purpose
  }
});
