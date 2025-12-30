import type { TerminalSession } from '../terminalTypes'
import { Terminal } from './Terminal'

type Props = {
  terminals: TerminalSession[]
  activeId: string
  wsUrl: string
}

export function TerminalViewport({ terminals, activeId, wsUrl }: Props) {
  return (
    <main className="flex-1 bg-[#09090b] relative w-full h-full overflow-hidden">
      {terminals.map((term) => {
        const isActive = activeId === term.id
        return (
          <div
            key={term.id}
            className="absolute inset-0 pl-1 pt-1 bg-[#09090b]"
            style={{
              visibility: isActive ? 'visible' : 'hidden',
              zIndex: isActive ? 10 : 0,
            }}
          >
            <Terminal wsUrl={wsUrl} isActive={isActive} />
          </div>
        )
      })}
    </main>
  )
}

