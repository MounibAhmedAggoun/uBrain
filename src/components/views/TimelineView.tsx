import { CalendarDays, X } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { getCurrentMap, useRoadmapStore, type NodeStatus } from '../../store/useRoadmapStore'
import { isOverdue } from '../../lib/roadmapInsights'

const statusLabel: Record<NodeStatus, string> = { 'not-started': 'Not started', 'in-progress': 'In progress', done: 'Done' }

export function TimelineView({ onClose }: { onClose: () => void }) {
  const roadmap = useRoadmapStore(useShallow((state) => getCurrentMap(state)))
  const selectNode = useRoadmapStore((state) => state.selectNode)
  const updateNode = useRoadmapStore((state) => state.updateNode)
  const scheduled = [...roadmap.nodes].filter((node) => node.data.dueDate).sort((a, b) => String(a.data.dueDate).localeCompare(String(b.data.dueDate)))
  const unscheduled = roadmap.nodes.filter((node) => !node.data.dueDate)
  return <section className="timeline-view"><div className="timeline-head"><div><span className="eyebrow">Execution view</span><h2>Timeline</h2></div><button className="button secondary" onClick={onClose}><X size={15} /> Back to canvas</button></div>{scheduled.length ? <div className="timeline-list">{scheduled.map((node) => <article className={`timeline-item ${isOverdue(node.data.dueDate, node.data.status) ? 'overdue' : ''}`} key={node.id} onClick={() => selectNode(node.id)}><div className="timeline-date"><CalendarDays size={14} /><time dateTime={node.data.dueDate}>{node.data.dueDate}</time></div><div className="timeline-marker" /><div className="timeline-content"><strong>{node.data.icon} {node.data.title}</strong><span>{isOverdue(node.data.dueDate, node.data.status) ? 'Overdue · ' : ''}{statusLabel[node.data.status]} · {node.data.priority ?? 'medium'} priority{node.data.owner ? ` · ${node.data.owner}` : ''}</span><select value={node.data.status} onClick={(event) => event.stopPropagation()} onChange={(event) => updateNode(node.id, { status: event.target.value as NodeStatus })} aria-label={`Status for ${node.data.title}`}><option value="not-started">Not started</option><option value="in-progress">In progress</option><option value="done">Done</option></select></div></article>)}</div> : <div className="timeline-empty"><CalendarDays size={26} /><strong>No due dates yet</strong><span>Add due dates from the planning inspector.</span></div>}{unscheduled.length > 0 && <div className="timeline-unscheduled"><strong>Unscheduled · {unscheduled.length}</strong><div>{unscheduled.map((node) => <button key={node.id} onClick={() => selectNode(node.id)}>{node.data.icon} {node.data.title}</button>)}</div></div>}</section>
}
