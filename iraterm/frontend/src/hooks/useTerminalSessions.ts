import { useMemo, useReducer, useState } from 'react'
import type { TerminalSession } from '../terminalTypes'

type UseTerminalSessionsResult = {
  terminals: TerminalSession[]
  activeId: string
  showToolbar: boolean
  setActiveId: (id: string) => void
  setShowToolbar: (next: boolean) => void
  createTerminal: () => void
  closeTerminal: (id: string) => void
}

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? Date.now().toString()
}

type SessionState = {
  terminals: TerminalSession[]
  activeId: string
}

type SessionAction =
  | { type: 'select'; id: string }
  | { type: 'create' }
  | { type: 'close'; id: string }

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  if (action.type === 'select') {
    return { ...state, activeId: action.id }
  }

  if (action.type === 'create') {
    const newId = createId()
    const newTerminal: TerminalSession = {
      id: newId,
      title: `Terminal ${state.terminals.length + 1}`,
    }
    return {
      terminals: [...state.terminals, newTerminal],
      activeId: newId,
    }
  }

  if (state.terminals.length === 1) return state

  const nextTerminals = state.terminals.filter((t) => t.id !== action.id)
  const nextActiveId =
    state.activeId === action.id
      ? nextTerminals[nextTerminals.length - 1].id
      : state.activeId

  return { terminals: nextTerminals, activeId: nextActiveId }
}

export function useTerminalSessions(): UseTerminalSessionsResult {
  const initialId = useMemo(() => createId(), [])
  const [sessionState, dispatch] = useReducer(sessionReducer, {
    terminals: [{ id: initialId, title: 'Terminal 1' }],
    activeId: initialId,
  })
  const [showToolbar, setShowToolbar] = useState<boolean>(true)

  const createTerminal = () => {
    dispatch({ type: 'create' })
  }

  const closeTerminal = (id: string) => {
    dispatch({ type: 'close', id })
  }

  return {
    terminals: sessionState.terminals,
    activeId: sessionState.activeId,
    showToolbar,
    setActiveId: (id: string) => dispatch({ type: 'select', id }),
    setShowToolbar,
    createTerminal,
    closeTerminal,
  }
}
