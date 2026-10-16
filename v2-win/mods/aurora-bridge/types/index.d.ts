// The pane's state contract: one value, the whole Bridge (shape as in hooks/core.ts), kept in $.state so a reload keeps it.
// Self-contained on purpose: `claude plugin validate` refuses a contract that imports.
export type BridgeKind = 'read' | 'write' | 'run' | 'search' | 'web' | 'mcp' | 'agent' | 'other'

declare module 'claude-code' {
  interface PluginState {
    'aurora-bridge': {
      bridge: {
        calls: { id: string; tool: string; kind: BridgeKind; turn: number; at: number; end?: number; err?: boolean; sub?: boolean; target?: string }[]
        turns: { n: number; at: number; end?: number; durationMs?: number; reason?: string; out?: number }[]
        agents: { id: string; type: string; label: string; at: number; end?: number }[]
        gate: { allow: number; ask: number; deny: number }
        files: Record<string, number>
        working: boolean
        turn: number
        startedAt: number
      }
    }
  }
}
