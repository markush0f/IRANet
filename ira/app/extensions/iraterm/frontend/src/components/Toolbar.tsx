import { Github } from 'lucide-react'
import type { TerminalSession } from '../terminalTypes'
import { TerminalTabs } from './TerminalTabs'

type Props = {
  showToolbar: boolean
  terminals: TerminalSession[]
  activeId: string
  wsLabel: string
  onSelect: (id: string) => void
  onCreate: () => void
  onClose: (id: string) => void
}

export function Toolbar({
  showToolbar,
  terminals,
  activeId,
  wsLabel,
  onSelect,
  onCreate,
  onClose,
}: Props) {
  return (
    <header
      className={`
        flex justify-between items-center bg-zinc-900/90 backdrop-blur-sm border-b border-zinc-800 h-9 shrink-0 px-2 select-none
        transition-all duration-300 ease-in-out origin-top
        ${
          showToolbar
            ? 'translate-y-0 opacity-100'
            : '-translate-y-full opacity-0 h-0 border-none overflow-hidden'
        }
      `}
    >
      <TerminalTabs
        terminals={terminals}
        activeId={activeId}
        onSelect={onSelect}
        onCreate={onCreate}
        onClose={onClose}
      />

      <div className="flex items-center gap-4 text-[10px] text-zinc-500 font-mono pr-8">
        <div className="flex items-center gap-2">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              terminals.length > 0 ? 'bg-emerald-500' : 'bg-red-500'
            }`}
          />
          <span>{wsLabel}</span>
        </div>

        <div className="h-3 w-px bg-zinc-800" />

        <a
          href="https://github.com/markush0f"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-zinc-300 transition-colors flex items-center gap-1.5 group"
          aria-label="GitHub profile"
        >
          <Github className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
        </a>
      </div>
    </header>
  )
}

