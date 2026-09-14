import { useMemo, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { Node } from '@xyflow/react'
import { CheckSquare, ChevronRight, Copy, FileText, Link2, LockKeyhole, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { getCurrentMap, isNodeUnlocked, useRoadmapStore, type RoadmapNodeData } from '../store/useRoadmapStore'
import { getNotesPreview } from '../lib/notesPreview'
import { blockedBy } from '../lib/roadmapInsights'

const colors = {
  mint: '#dff3eb', sky: '#e1eff8', amber: '#f8edcf', rose: '#f8e2e1', lavender: '#e9e5f6',
}

const statusColorMap = {
  'not-started': '#a8a8a8',
  'in-progress': '#d09b47',
  done: '#2f6f63',
} as const

export function RoadmapNode({ id, data, selected }: NodeProps<Node<RoadmapNodeData>>) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(data.title)
  const [hovered, setHovered] = useState(false)
  const updateNode = useRoadmapStore((state) => state.updateNode)
  const enterRoadmap = useRoadmapStore((state) => state.enterRoadmap)
  const selectNode = useRoadmapStore((state) => state.selectNode)
  const expandNode = useRoadmapStore((state) => state.expandNode)
  const duplicateNode = useRoadmapStore((state) => state.duplicateNode)
  const addSubRoadmap = useRoadmapStore((state) => state.addSubRoadmap)
  const removeElements = useRoadmapStore((state) => state.removeElements)
  const searchTerm = useRoadmapStore((state) => state.searchTerm)
  const notesPreview = getNotesPreview(data.notes)
  const roadmaps = useRoadmapStore((state) => state.roadmaps)
  const activeRoadmapId = useRoadmapStore((state) => state.activeRoadmapId)
  const navigation = useRoadmapStore((state) => state.navigation)
  const currentMap = useMemo(() => getCurrentMap({ roadmaps, activeRoadmapId, navigation }), [roadmaps, activeRoadmapId, navigation])
  const unlocked = isNodeUnlocked(currentMap, id)
  const blockers = blockedBy(currentMap, id)
  const PreviewIcon = notesPreview?.kind === 'checklist' ? CheckSquare : notesPreview?.kind === 'link' ? Link2 : FileText
  const showActions = selected || hovered
  const statusColor = useMemo(() => statusColorMap[data.status ?? 'not-started'], [data.status])
  const finishEditing = () => { setEditing(false); updateNode(id, { title: draft.trim() || 'Untitled milestone' }) }

  return (
    <div className={`roadmap-node ${selected ? 'selected' : ''} ${!unlocked ? 'locked' : ''} ${searchTerm && data.title.toLowerCase().includes(searchTerm.toLowerCase()) ? 'search-match' : ''}`} style={{ backgroundColor: colors[data.color] }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={() => selectNode(id)} title={!unlocked ? `Blocked by: ${blockers.map((node) => node.data.title).join(', ')}` : undefined}>
      <Handle type="target" position={Position.Left} style={{ width: 14, height: 14, border: '3px solid var(--surface)', background: 'var(--accent)' }} />
      <div className="node-header">
        <span className="node-status" style={{ background: statusColor }} aria-label={`Status: ${data.status ?? 'not-started'}`} />
        {!unlocked && data.status !== 'done' && <LockKeyhole size={13} className="node-lock" aria-label="Locked by prerequisites" />}
        {editing ? <input autoFocus className="node-title-input" value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={finishEditing} onKeyDown={(event) => { if (event.key === 'Enter') finishEditing(); if (event.key === 'Escape') { setDraft(data.title); setEditing(false) } }} /> : <div className="node-title" onDoubleClick={(event) => { event.stopPropagation(); selectNode(id); setDraft(data.title); setEditing(true) }}>{data.icon && <span className="node-icon" aria-hidden="true">{data.icon}</span>}{data.title}</div>}
        {showActions && <div className="node-actions" onClick={(event) => event.stopPropagation()}>
          <button className="mini-icon-button" onClick={() => addSubRoadmap(id)} title="Add sub-roadmap" aria-label="Add sub-roadmap"><Plus size={12} /></button>
          <button className="mini-icon-button" onClick={() => duplicateNode(id)} title="Duplicate" aria-label="Duplicate node"><Copy size={12} /></button>
          <button className="mini-icon-button" onClick={() => { selectNode(id); setDraft(data.title); setEditing(true) }} title="Rename" aria-label="Rename node"><Pencil size={12} /></button>
          <button className="mini-icon-button" onClick={() => removeElements([id], [])} title="Delete" aria-label="Delete node"><Trash2 size={12} /></button>
          <button className="mini-icon-button" onClick={() => { selectNode(id); expandNode(id) }} title="Open notes" aria-label="Open notes"><MoreHorizontal size={12} /></button>
        </div>}
      </div>
      {notesPreview && <div className="node-preview" title={notesPreview.text}><PreviewIcon size={12} /><span>{notesPreview.text}</span></div>}
      {!unlocked && <div className="node-blockers">Blocked by {blockers.length} prerequisite{blockers.length === 1 ? '' : 's'}</div>}
      {data.childMap && <button className="child-indicator nodrag" onClick={(event) => { event.stopPropagation(); enterRoadmap(id) }} aria-label="Open sub-roadmap"><ChevronRight size={13} /><span>{data.childMap.nodes.length}</span></button>}
      <Handle type="source" position={Position.Right} style={{ width: 14, height: 14, border: '3px solid var(--surface)', background: 'var(--accent)' }} />
    </div>
  )
}
