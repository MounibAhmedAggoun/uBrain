import { Trash2, X } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { getCurrentMap, useRoadmapStore, type EdgeKind } from '../store/useRoadmapStore'

const kinds: { value: EdgeKind; label: string; hint: string }[] = [
  { value: 'required', label: 'Required', hint: 'solid, ordered' },
  { value: 'optional', label: 'Optional', hint: 'dashed, nice-to-have' },
  { value: 'related', label: 'Related', hint: 'dotted, no order' },
  { value: 'alternative', label: 'Alternative', hint: 'orange, choose one' },
]
export function EdgePanel() {
  const selectedId = useRoadmapStore((state) => state.selectedEdgeId)
  const edge = useRoadmapStore(useShallow((state) => getCurrentMap(state).edges.find((item) => item.id === selectedId)))
  const update = useRoadmapStore((state) => state.updateEdgeKind)
  const remove = useRoadmapStore((state) => state.removeElements)
  if (!edge) return null
  const kind = (edge.data as { kind?: EdgeKind } | undefined)?.kind ?? 'required'
  return <div className="edge-popover"><div className="edge-popover-head"><strong>Link type</strong><button className="icon-button" onClick={() => useRoadmapStore.getState().updateEdgeSelection(null)} aria-label="Close link editor"><X size={15} /></button></div><div className="edge-options">{kinds.map((item) => <button key={item.value} className={`edge-option ${kind === item.value ? 'active' : ''}`} onClick={() => update(edge.id, item.value)}><span className={`edge-sample ${item.value}`} /> <span><b>{item.label}</b><small>{item.hint}</small></span></button>)}</div><button className="delete-edge" onClick={() => remove([], [edge.id])}><Trash2 size={14} /> Delete link</button></div>
}
