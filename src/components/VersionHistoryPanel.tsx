import { History, RotateCcw, X } from 'lucide-react'
import { useRoadmapStore } from '../store/useRoadmapStore'

export function VersionHistoryPanel({ onClose }: { onClose: () => void }) {
  const versions = useRoadmapStore((state) => state.versions)
  const saveVersion = useRoadmapStore((state) => state.saveVersion)
  const restoreVersion = useRoadmapStore((state) => state.restoreVersion)
  return <div className="modal-backdrop" onClick={onClose}><section className="version-panel" onClick={(event) => event.stopPropagation()}><div className="panel-heading"><div><span className="eyebrow">Recovery</span><h2><History size={17} /> Version history</h2></div><button className="icon-button" onClick={onClose} aria-label="Close version history"><X size={16} /></button></div><button className="button primary" onClick={() => saveVersion('Manual snapshot')}><History size={15} /> Save current version</button><div className="version-list">{versions.length ? versions.map((version) => <div className="version-row" key={version.id}><div><strong>{version.label}</strong><small>{new Date(version.createdAt).toLocaleString()}</small></div><button className="icon-button" onClick={() => restoreVersion(version.id)} aria-label={`Restore ${version.label}`} title="Restore version"><RotateCcw size={14} /></button></div>) : <p className="dashboard-note">No saved versions yet.</p>}</div></section></div>
}
