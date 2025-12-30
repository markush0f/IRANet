import { ChevronDown, ChevronUp } from 'lucide-react'

type Props = {
  showToolbar: boolean
  onToggle: () => void
}

export function ToolbarToggleButton({ showToolbar, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      className={`
        absolute top-0 right-0 z-50 p-2 text-zinc-500 hover:text-zinc-300 transition-opacity duration-300
        ${showToolbar ? 'opacity-0 group-hover:opacity-100' : 'opacity-50 hover:opacity-100'}
      `}
      title={showToolbar ? 'Hide Toolbar' : 'Show Toolbar'}
    >
      {showToolbar ? (
        <ChevronUp className="w-4 h-4" />
      ) : (
        <ChevronDown className="w-4 h-4" />
      )}
    </button>
  )
}

