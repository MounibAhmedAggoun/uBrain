import { Clock3 } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { getCurrentMap, useRoadmapStore } from '../store/useRoadmapStore'

const hours = (minutes?: number) => minutes ? String(minutes / 60) : ''
const minutes = (value: string) => { const parsed = Number(value); return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 60) : undefined }

export function TimePanel() {
  const selectedId = useRoadmapStore((state) => state.selectedNodeId)
  const node = useRoadmapStore(useShallow((state) => getCurrentMap(state).nodes.find((item) => item.id === selectedId)))
  const updateNode = useRoadmapStore((state) => state.updateNode)
  if (!node) return null
  return <aside className="time-panel"><div className="time-panel-title"><Clock3 size={15} /><strong>Effort tracking</strong></div><label>Estimated hours<input type="number" min="0" step="0.5" value={hours(node.data.estimatedMinutes)} onChange={(event) => updateNode(node.id, { estimatedMinutes: minutes(event.target.value) })} /></label><label>Actual hours<input type="number" min="0" step="0.5" value={hours(node.data.actualMinutes)} onChange={(event) => updateNode(node.id, { actualMinutes: minutes(event.target.value) })} /></label></aside>
}
