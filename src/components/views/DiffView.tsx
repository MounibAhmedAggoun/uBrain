import { GitCompare, X } from 'lucide-react'
import { useState } from 'react'
import { diffRoadmaps } from '../../lib/roadmapDiff'
import { useRoadmapStore } from '../../store/useRoadmapStore'

export function DiffView({ onClose }: { onClose: () => void }) {
  const active = useRoadmapStore((state) => state.roadmaps.find((item) => item.id === state.activeRoadmapId) ?? state.roadmaps[0])
  const versions = useRoadmapStore((state) => state.versions)
  const [versionId, setVersionId] = useState(versions[0]?.id ?? '')
  if (!active) return null
  const version = versions.find((item) => item.id === versionId)
  const result = version ? diffRoadmaps(version.roadmap, active) : null
  return <section className="diff-view"><div className="diff-head"><div><span className="eyebrow">History</span><h2><GitCompare size={19} /> Roadmap changes</h2></div><button className="button secondary" onClick={onClose}><X size={15} /> Back</button></div><label className="diff-select">Compare with<select value={versionId} onChange={(event) => setVersionId(event.target.value)}><option value="">Choose a saved version...</option>{versions.map((item) => <option key={item.id} value={item.id}>{item.label} · {new Date(item.createdAt).toLocaleString()}</option>)}</select></label>{result ? <div className="diff-grid"><DiffGroup label="Added" items={result.added} kind="added" /><DiffGroup label="Removed" items={result.removed} kind="removed" /><DiffGroup label="Changed" items={result.changed} kind="changed" /><DiffGroup label="Unchanged" items={result.unchanged} kind="unchanged" /></div> : <div className="timeline-empty"><GitCompare size={26} /><strong>Choose a saved version</strong><span>Save a version from the toolbar to compare changes.</span></div>}</section>
}
function DiffGroup({ label, items, kind }: { label: string; items: string[]; kind: string }) { return <section className={`diff-group ${kind}`}><div><strong>{label}</strong><span>{items.length}</span></div>{items.map((item) => <p key={item}>{item}</p>)}</section> }
