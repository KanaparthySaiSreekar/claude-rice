// PROTOTYPE (scratch only): tab-title.mjs plus the git branch. Not installed.
import { spawnSync } from 'node:child_process';

const TITLES = {
  UserPromptSubmit: (project) => `◐ ${project}`,
  PermissionRequest: (project) => `▲ ${project} · needs you`,
  Stop: (project) => `✓ ${project} · done`,
};

// One short git call; any failure (not a repo, git missing, slow disk) just means no branch.
function branchOf(cwd) {
  try {
    const r = spawnSync('git', ['-C', cwd, 'branch', '--show-current'], { encoding: 'utf8', timeout: 1500, windowsHide: true });
    return r.status === 0 ? r.stdout.trim() : '';
  } catch { return ''; }
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { raw += chunk; });
process.stdin.on('end', () => {
  try {
    const payload = JSON.parse(raw);
    const make = TITLES[payload.hook_event_name];
    if (!make || typeof payload.cwd !== 'string') return;
    const folder = payload.cwd.split(/[\/]+/).filter(Boolean).pop() || 'claude';
    const branch = branchOf(payload.cwd);
    const project = branch ? `${folder} ⎇ ${branch}` : folder;
    const safe = make(project).replace(/[\u0000-\u001f\u007f-\u009f]/g, '').slice(0, 80);
    process.stdout.write(JSON.stringify({ terminalSequence: `\u001b]2;${safe}\u0007` }));
  } catch { /* silent on purpose */ }
});
