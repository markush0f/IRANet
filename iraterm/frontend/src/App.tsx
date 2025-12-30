import { TerminalViewport } from './components/TerminalViewport'
import { Toolbar } from './components/Toolbar'
import { ToolbarToggleButton } from './components/ToolbarToggleButton'
import { TERMINAL_WS_URL, formatWsLabel } from './terminalConfig'
import { useTerminalSessions } from './hooks/useTerminalSessions'

function App() {
  const {
    terminals,
    activeId,
    showToolbar,
    setActiveId,
    setShowToolbar,
    createTerminal,
    closeTerminal,
  } = useTerminalSessions()

  return (
    // Full Screen Container: No padding, full height/width
    <div className="flex flex-col h-screen w-screen bg-[#09090b] text-zinc-200 font-sans selection:bg-white/20 overflow-hidden relative group">

      {/* Toggle Button - Floating in top right, always accessible via hover or if toolbar is hidden */}
      <ToolbarToggleButton
        showToolbar={showToolbar}
        onToggle={() => setShowToolbar(!showToolbar)}
      />

      {/* Minimal Toolbar / Header */}
      <Toolbar
        showToolbar={showToolbar}
        terminals={terminals}
        activeId={activeId}
        wsLabel={formatWsLabel(TERMINAL_WS_URL)}
        onSelect={setActiveId}
        onCreate={createTerminal}
        onClose={closeTerminal}
      />

      {/* Full Screen Terminal Area */}
      <TerminalViewport terminals={terminals} activeId={activeId} wsUrl={TERMINAL_WS_URL} />
    </div>
  )
}

export default App
