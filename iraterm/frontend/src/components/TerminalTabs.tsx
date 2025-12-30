import type { TerminalSession } from '../terminalTypes'

type Props = {
  terminals: TerminalSession[]
  activeId: string
  onSelect: (id: string) => void
  onCreate: () => void
  onClose: (id: string) => void
}

export function TerminalTabs({
  terminals,
  activeId,
  onSelect,
  onCreate,
  onClose,
}: Props) {
  return (
    <div className="flex gap-1 h-full items-end">
      {terminals.map((term) => (
        <div
          key={term.id}
          onClick={() => onSelect(term.id)}
          className={`
            px-3 h-8 text-xs cursor-pointer flex items-center gap-2 border-r border-t border-l border-zinc-800 transition-colors
            ${
              activeId === term.id
                ? 'bg-[#09090b] text-zinc-100 border-b-transparent relative top-[1px] z-10'
                : 'bg-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 border-transparent'
            }
          `}
        >
          <span className="font-medium">{term.title}</span>
          {terminals.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClose(term.id)
              }}
              className="w-4 h-4 flex items-center justify-center rounded-sm hover:bg-white/10 text-zinc-500 hover:text-zinc-300 transition-colors"
              aria-label={`Close ${term.title}`}
            >
              ×
            </button>
          )}
        </div>
      ))}

      <button
        onClick={onCreate}
        className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"
        title="New Terminal"
        aria-label="New terminal"
      >
        +
      </button>
    </div>
  )
}

