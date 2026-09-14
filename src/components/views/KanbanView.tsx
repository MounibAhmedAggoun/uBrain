import { Columns3, X } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { getCurrentMap, useRoadmapStore, type NodeStatus } from '../../store/useRoadmapStore'
import { isOverdue } from '../../lib/roadmapInsights'

const columns: { status: NodeStatus; label: string }[] = [
  { status: 'not-started', label: 'Not started' },
  { status: 'in-progress', label: 'In progress' },
  { status: 'done', label: 'Done' },
]

export function KanbanView({ onClose }: { onClose: () => void }) {
  const roadmap = useRoadmapStore(useShallow((state) => getCurrentMap(state)))
  const selectNode = useRoadmapStore((state) => state.selectNode)
  const updateNode = useRoadmapStore((state) => state.updateNode)
  const moveNode = (nodeId: string, status: NodeStatus) => updateNode(nodeId, { status })
    return <section className="kanban-view"><div className="kanban-head"><div><span className="eyebrow">Execution view</span><h2>Kanban board</h2></div><button className="button secondary" onClick={onClose}><X size={15} /> Back to canvas</button></div><div className="kanban-columns">{columns.map((column) => { const nodes = roadmap.nodes.filter((node) => (node.data.status ?? 'not-started') === column.status); return <div className={`kanban-column kanban-${column.status}`} key={column.status} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { const nodeId = event.dataTransfer.getData('text/plain'); if (nodeId) moveNode(nodeId, column.status) }}><div className="kanban-column-head"><strong>{column.label}</strong><span>{nodes.length}</span></div><div className="kanban-cards">{nodes.map((node) => <article className="kanban-card" key={node.id} draggable onDragStart={(event) => event.dataTransfer.setData('text/plain', node.id)} onClick={() => selectNode(node.id)}><div className="kanban-card-title">{node.data.icon && <span>{node.data.icon}</span>}{node.data.title}</div><div className="kanban-card-meta"><span className={`priority priority-${node.data.priority ?? 'medium'}`}>{node.data.priority ?? 'medium'}</span>{node.data.owner && <span>{node.data.owner}</span>}{node.data.dueDate && <span className={isOverdue(node.data.dueDate, node.data.status) ? 'overdue-text' : ''}>{isOverdue(node.data.dueDate, node.data.status) ? 'Overdue · ' : ''}{node.data.dueDate}</span>}</div><select value={node.data.status ?? 'not-started'} onClick={(event) => event.stopPropagation()} onChange={(event) => updateNode(node.id, { status: event.target.value as NodeStatus })} aria-label={`Status for ${node.data.title}`}><option value="not-started">Not started</option><option value="in-progress">In progress</option><option value="done">Done</option></select></article>)}</div></div> })}</div>{!roadmap.nodes.length && <div className="kanban-empty"><Columns3 size={24} /><strong>No milestones yet</strong><span>Add nodes on the canvas to start planning.</span></div>}</section>
}
