import { useEffect, useRef, useState } from 'react'
import { ChevronRight, Search } from 'lucide-react'
import { useRoadmapStore, getActiveRoadmap } from '../store/useRoadmapStore'
import { searchNodes, searchRoadmaps, type CommandPaletteAction } from '../lib/commandUtils'
import type { CommandPaletteNode, CommandPaletteRoadmap } from '../lib/commandUtils'

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const roadmaps = useRoadmapStore((state) => state.roadmaps)
  const activeRoadmap = useRoadmapStore((state) => getActiveRoadmap(state))
  const navigateToNode = useRoadmapStore((state) => state.navigateToNode)
  const switchRoadmap = useRoadmapStore((state) => state.switchRoadmap)
  const toggleDashboard = useRoadmapStore((state) => state.toggleDashboard)
  const addNode = useRoadmapStore((state) => state.addNode)
  const createRoadmap = useRoadmapStore((state) => state.createRoadmap)
  const undo = useRoadmapStore((state) => state.undo)
  const redo = useRoadmapStore((state) => state.redo)
  const canUndo = useRoadmapStore((state) => state.past.length > 0)
  const canRedo = useRoadmapStore((state) => state.future.length > 0)

  const nodeResults = searchNodes(roadmaps, query)
  const roadmapResults = searchRoadmaps(roadmaps, query)

  const actions: CommandPaletteAction[] = [
    { id: 'new-roadmap', name: 'New Roadmap', icon: '⊕', execute: () => { createRoadmap(); onClose() } },
    { id: 'new-node', name: 'New Node', icon: '+', execute: () => { addNode(); onClose() } },
    { id: 'toggle-dashboard', name: 'Toggle Dashboard', icon: '📊', execute: () => { toggleDashboard(); onClose() } },
    { id: 'undo', name: 'Undo', icon: '↶', execute: () => { undo(); onClose() }, disabled: !canUndo },
    { id: 'redo', name: 'Redo', icon: '↷', execute: () => { redo(); onClose() }, disabled: !canRedo },
  ]

  const actionResults = actions.filter((action) => query.length === 0 || action.name.toLowerCase().includes(query.toLowerCase()))

  type Result = { type: 'node'; item: CommandPaletteNode } | { type: 'roadmap'; item: CommandPaletteRoadmap } | { type: 'action'; item: CommandPaletteAction }
  const allResults: Result[] = [
    ...nodeResults.map((item) => ({ type: 'node' as const, item })),
    ...roadmapResults.map((item) => ({ type: 'roadmap' as const, item })),
    ...actionResults.map((item) => ({ type: 'action' as const, item })),
  ]

  const handleSelect = (result: Result) => {
    if (result.type === 'node') {
      navigateToNode(result.item.navigation, result.item.id, result.item.roadmapId)
      onClose()
    } else if (result.type === 'roadmap') {
      switchRoadmap(result.item.id)
      onClose()
    } else if (result.type === 'action') {
      if (!result.item.disabled) result.item.execute()
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose()
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, allResults.length - 1))
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      if (allResults[selectedIndex]) handleSelect(allResults[selectedIndex])
    }
  }

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])


  if (!open) return null

  return (
    <div className="command-palette-overlay" onClick={() => onClose()}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()} ref={containerRef}>
        <div className="command-palette-header">
          <Search size={18} />
          <input
            ref={inputRef}
            type="text"
            className="command-palette-input"
            placeholder="Search nodes, roadmaps, or actions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="command-palette-results">
          {allResults.length === 0 && query && <div className="command-palette-empty">No results for "{query}"</div>}

          {allResults.length > 0 && (
            <div className="command-palette-groups">
              {nodeResults.length > 0 && (
                <div className="command-palette-group">
                  <div className="command-palette-group-title">Nodes</div>
                  {nodeResults.map((node, idx) => {
                    const resultIdx = allResults.findIndex((r) => r.type === 'node' && r.item.id === node.id)
                    return (
                      <div
                        key={node.id}
                        className={`command-palette-item ${resultIdx === selectedIndex ? 'selected' : ''}`}
                        onMouseEnter={() => setSelectedIndex(resultIdx)}
                        onClick={() => handleSelect({ type: 'node', item: node })}
                      >
                        <div className="command-palette-item-content">
                          <div className="command-palette-item-title">{node.title}</div>
                          <div className="command-palette-item-path">{node.path.slice(0, -1).join(' > ') || 'Root'}</div>
                        </div>
                        <ChevronRight size={14} />
                      </div>
                    )
                  })}
                </div>
              )}

              {roadmapResults.length > 0 && (
                <div className="command-palette-group">
                  <div className="command-palette-group-title">Roadmaps</div>
                  {roadmapResults.map((roadmap) => {
                    const resultIdx = allResults.findIndex((r) => r.type === 'roadmap' && r.item.id === roadmap.id)
                    return (
                      <div
                        key={roadmap.id}
                        className={`command-palette-item ${resultIdx === selectedIndex ? 'selected' : ''}`}
                        onMouseEnter={() => setSelectedIndex(resultIdx)}
                        onClick={() => handleSelect({ type: 'roadmap', item: roadmap })}
                      >
                        <div className="command-palette-item-title">{roadmap.name}</div>
                        <ChevronRight size={14} />
                      </div>
                    )
                  })}
                </div>
              )}

              {actionResults.length > 0 && (
                <div className="command-palette-group">
                  <div className="command-palette-group-title">Actions</div>
                  {actionResults.map((action) => {
                    const resultIdx = allResults.findIndex((r) => r.type === 'action' && r.item.id === action.id)
                    return (
                      <div
                        key={action.id}
                        className={`command-palette-item ${resultIdx === selectedIndex ? 'selected' : ''} ${action.disabled ? 'disabled' : ''}`}
                        onMouseEnter={() => !action.disabled && setSelectedIndex(resultIdx)}
                        onClick={() => !action.disabled && handleSelect({ type: 'action', item: action })}
                      >
                        <div className="command-palette-item-content">
                          <span className="command-palette-item-icon">{action.icon}</span>
                          <div className="command-palette-item-title">{action.name}</div>
                        </div>
                        <ChevronRight size={14} />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="command-palette-footer">
          <kbd>↑↓</kbd> Navigate <kbd>↵</kbd> Select <kbd>Esc</kbd> Close
        </div>
      </div>
    </div>
  )
}
