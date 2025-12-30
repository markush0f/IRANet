export const TERMINAL_WS_URL: string =
  import.meta.env.VITE_TERMINAL_WS_URL ?? 'ws://localhost:3001/ws/terminal'

export function formatWsLabel(wsUrl: string): string {
  try {
    const url = new URL(wsUrl)
    return `${url.protocol}//${url.host}`
  } catch {
    return wsUrl
  }
}

