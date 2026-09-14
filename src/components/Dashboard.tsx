import { X } from 'lucide-react'
import { collectNodes, dependencyProgress, checklistStats, nextNodes } from '../lib/roadmapInsights'
import { getCurrentMap, useRoadmapStore, type Roadmap } from '../store/useRoadmapStore'

function branchStats(roadmap: Roadmap, nodeId: string) {
  const root = roadmap.nodes.find((node) => node.id === nodeId)
  if (!root) return { total: 0, done: 0 }
  const nested = root.data.childMap ? collectNodes({ ...roadmap, nodes: root.data.childMap.nodes, edges: root.data.childMap.edges }) : []
  const nodes = [{ node: root, path: [] }, ...nested]
  return { total: nodes.length, done: nodes.filter((item) => item.node.data.status === 'done').length }
}

export function Dashboard() {
  const open = useRoadmapStore((state) => state.dashboardOpen)
  const toggle = useRoadmapStore((state) => state.toggleDashboard)
  const roadmap = useRoadmapStore((state) => state.roadmaps.find((item) => item.id === state.activeRoadmapId) ?? state.roadmaps[0])
  if (!open || !roadmap) return null
  const all = collectNodes(roadmap)
  const counts = all.reduce((result, item) => { result[item.node.data.status] += 1; return result }, { done: 0, 'in-progress': 0, 'not-started': 0 })
  const checks = checklistStats(roadmap)
  const progress = dependencyProgress(getCurrentMap(useRoadmapStore.getState()))
  const next = nextNodes(getCurrentMap(useRoadmapStore.getState()))
  const percent = (value: number, total: number) => total ? Math.round(value / total * 100) : 0
  return <aside className="dashboard-panel"><div className="panel-heading"><div><span className="eyebrow">Roadmap overview</span><h2>Dashboard</h2></div><button className="icon-button" onClick={toggle} aria-label="Close dashboard"><X size={17} /></button></div><div className="dashboard-total"><strong>{all.length}</strong><span>Total nodes across every level</span></div><div className="dashboard-statuses"><div><strong>{counts.done}</strong><span>Done · {percent(counts.done, all.length)}%</span></div><div><strong>{counts['in-progress']}</strong><span>In progress · {percent(counts['in-progress'], all.length)}%</span></div><div><strong>{counts['not-started']}</strong><span>Not started · {percent(counts['not-started'], all.length)}%</span></div></div><section className="dashboard-section"><div className="dashboard-section-head"><strong>Dependency progress</strong><span>{progress.done}/{progress.total} · {progress.percent}%</span></div><div className="progress-track"><i style={{ width: `${progress.percent}%` }} /></div><small className="dashboard-note">{progress.unlocked} unlocked · {progress.blocked} blocked</small></section><section className="dashboard-section"><strong>What's next</strong><div className="next-list">{next.length ? next.map((node) => <button key={node.id} onClick={() => useRoadmapStore.getState().selectNode(node.id)}>{node.data.icon} {node.data.title}<span>{node.data.priority ?? 'medium'}</span></button>) : <span className="dashboard-note">Complete a prerequisite to unlock your next milestone.</span>}</div></section><section className="dashboard-section"><div className="dashboard-section-head"><strong>Time tracked</strong><span>{Math.round(progress.actualMinutes / 60 * 10) / 10}h / {Math.round(progress.estimatedMinutes / 60 * 10) / 10}h</span></div><div className="progress-track"><i style={{ width: `${progress.estimatedMinutes ? Math.min(100, progress.actualMinutes / progress.estimatedMinutes * 100) : 0}%` }} /></div></section><section className="dashboard-section"><div className="dashboard-section-head"><strong>Checklist completion</strong><span>{checks.checked}/{checks.total} · {percent(checks.checked, checks.total)}%</span></div><div className="progress-track"><i style={{ width: `${percent(checks.checked, checks.total)}%` }} /></div></section><section className="dashboard-section"><strong>Top-level branches</strong><div className="branch-list">{roadmap.nodes.map((node) => { const stats = branchStats(roadmap, node.id); return <div className="branch-row" key={node.id}><div><span>{node.data.icon} {node.data.title}</span><small>{stats.done}/{stats.total} nodes done</small></div><div className="progress-track"><i style={{ width: `${percent(stats.done, stats.total)}%` }} /></div></div> })}</div></section></aside>
}
