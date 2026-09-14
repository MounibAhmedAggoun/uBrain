import { GitCompare, X } from 'lucide-react'
import { useState } from 'react'
import { collectNodes } from '../../lib/roadmapInsights'
import { useRoadmapStore } from '../../store/useRoadmapStore'

export function CompareView({ onClose }: { onClose: () => void }) {
  const roadmaps = useRoadmapStore((state) => state.roadmaps)
  const [leftId, setLeftId] = useState(roadmaps[0]?.id ?? '')
  const [rightId, setRightId] = useState(roadmaps[1]?.id ?? roadmaps[0]?.id ?? '')
  const left = roadmaps.find((roadmap) => roadmap.id === leftId) ?? roadmaps[0]
  const right = roadmaps.find((roadmap) => roadmap.id === rightId) ?? roadmaps[0]
  if (!left || !right) return null
  const leftNodes = collectNodes(left).map((item) => item.node)
  const rightNodes = collectNodes(right).map((item) => item.node)
  const rightTitles = new Set(rightNodes.map((node) => node.data.title.trim().toLowerCase()))
  const leftTitles = new Set(leftNodes.map((node) => node.data.title.trim().toLowerCase()))
  return <section className="compare-view"><div className="compare-head"><div><span className="eyebrow">Analysis view</span><h2><GitCompare size={20} /> Compare roadmaps</h2></div><button className="button secondary" onClick={onClose}><X size={15} /> Back to canvas</button></div><div className="compare-selects"><label>Roadmap A<select value={left.id} onChange={(event) => setLeftId(event.target.value)}>{roadmaps.map((roadmap) => <option key={roadmap.id} value={roadmap.id}>{roadmap.name}</option>)}</select></label><label>Roadmap B<select value={right.id} onChange={(event) => setRightId(event.target.value)}>{roadmaps.map((roadmap) => <option key={roadmap.id} value={roadmap.id}>{roadmap.name}</option>)}</select></label></div><div className="compare-summary"><span>{leftNodes.filter((node) => rightTitles.has(node.data.title.trim().toLowerCase())).length} overlapping nodes</span><span>{leftNodes.length} vs {rightNodes.length} total nodes</span></div><div className="compare-columns"><div><h3>{left.name}</h3>{leftNodes.map((node) => <div className={`compare-node ${rightTitles.has(node.data.title.trim().toLowerCase()) ? 'overlap' : 'unique'}`} key={node.id}><span>{node.data.icon} {node.data.title}</span><small>{rightTitles.has(node.data.title.trim().toLowerCase()) ? 'Shared' : 'Only in A'}</small></div>)}</div><div><h3>{right.name}</h3>{rightNodes.map((node) => <div className={`compare-node ${leftTitles.has(node.data.title.trim().toLowerCase()) ? 'overlap' : 'unique'}`} key={node.id}><span>{node.data.icon} {node.data.title}</span><small>{leftTitles.has(node.data.title.trim().toLowerCase()) ? 'Shared' : 'Only in B'}</small></div>)}</div></div></section>
}
