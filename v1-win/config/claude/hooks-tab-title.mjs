// tab-title.mjs: sets the terminal tab title so you can tell parallel Claude Code sessions apart
// and see which one needs you. Silent (no sound, no toast). Wired to UserPromptSubmit,
// PermissionRequest and Stop as synchronous command hooks: terminalSequence is ignored for async hooks.
//
// Reads the hook payload on stdin, prints {"terminalSequence": "<OSC 2 title>"} on stdout.
// Any failure prints nothing and exits 0, so a bad payload can never break a session.

const TITLES = {
  UserPromptSubmit: (project) => `◐ ${project}`,
  PermissionRequest: (project) => `▲ ${project} · needs you`,
  Stop: (project) => `✓ ${project} · done`,
};

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { raw += chunk; });
process.stdin.on('end', () => {
  try {
    const payload = JSON.parse(raw);
    const make = TITLES[payload.hook_event_name];
    if (!make || typeof payload.cwd !== 'string') return;

    const project = payload.cwd.split(/[\\/]+/).filter(Boolean).pop() || 'claude';
    // Strip control characters so a hostile directory name cannot smuggle escape sequences into the title.
    const safe = make(project).replace(/[\u0000-\u001f\u007f-\u009f]/g, '').slice(0, 80);
    process.stdout.write(JSON.stringify({ terminalSequence: `\u001b]2;${safe}\u0007` }));
  } catch {
    // stay silent on purpose
  }
});
