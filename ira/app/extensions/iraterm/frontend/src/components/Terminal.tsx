import { useEffect, useMemo, useRef } from 'react'
import { Terminal as XTerm } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'

type Props = {
  wsUrl: string
  isActive: boolean
}

type TerminalMessage =
  | { type: 'input'; data: string }
  | { type: 'resize'; cols: number; rows: number }

export function Terminal({ wsUrl, isActive }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const isActiveRef = useRef<boolean>(isActive)
  const terminalRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  isActiveRef.current = isActive

  const textDecoder = useMemo(() => new TextDecoder(), [])

  const requestFitAndResize = () => {
    const terminal = terminalRef.current
    const fitAddon = fitAddonRef.current

    if (!terminal || !fitAddon) return
    if (!isActiveRef.current) return

    requestAnimationFrame(() => {
      fitAddon.fit()

      const ws = wsRef.current
      if (!ws || ws.readyState !== WebSocket.OPEN) return

      const message: TerminalMessage = {
        type: 'resize',
        cols: terminal.cols,
        rows: terminal.rows,
      }
      ws.send(JSON.stringify(message))
    })
  }

  useEffect(() => {
    const terminal = new XTerm({
      cursorBlink: true,
      fontFamily:
        '"Fira Code", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: 13,
      theme: {
        background: '#09090b',
        foreground: '#e4e4e7',
        cursor: '#e4e4e7',
        selectionBackground: 'rgba(255,255,255,0.15)',
      },
    })
    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)

    terminalRef.current = terminal
    fitAddonRef.current = fitAddon

    if (!containerRef.current) return
    terminal.open(containerRef.current)

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.addEventListener('open', () => {
      requestFitAndResize()
      terminal.focus()
    })

    ws.addEventListener('message', (event) => {
      if (typeof event.data === 'string') {
        terminal.write(event.data)
        return
      }

      if (event.data instanceof ArrayBuffer) {
        terminal.write(textDecoder.decode(event.data))
      }
    })

    ws.addEventListener('close', () => {
      terminal.write('\r\n\x1b[31m[disconnected]\x1b[0m\r\n')
    })

    ws.addEventListener('error', () => {
      terminal.write('\r\n\x1b[31m[ws error]\x1b[0m\r\n')
    })

    const dataDisposable = terminal.onData((data) => {
      if (ws.readyState !== WebSocket.OPEN) return
      const message: TerminalMessage = { type: 'input', data }
      ws.send(JSON.stringify(message))
    })

    const resizeObserver = new ResizeObserver(() => {
      requestFitAndResize()
    })
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      dataDisposable.dispose()
      ws.close()
      terminal.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsUrl])

  useEffect(() => {
    if (isActive) requestFitAndResize()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive])

  return <div ref={containerRef} className="h-full w-full" />
}
