import { LoaderCircle, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { aiConfigured, generateRoadmapFromGoal } from '../lib/ai'
import { roadmapTemplates } from '../lib/roadmapTemplates'
import { useRoadmapStore } from '../store/useRoadmapStore'

export function AiRoadmapPanel({ onClose, onNotify }: { onClose: () => void; onNotify: (message: string) => void }) {
  const [goal, setGoal] = useState('')
  const [loading, setLoading] = useState(false)
  const createTemplate = useRoadmapStore((state) => state.createTemplate)
  const importRoadmap = useRoadmapStore((state) => state.importRoadmap)
  const generate = async () => { if (!goal.trim()) return; setLoading(true); try { const generated = await generateRoadmapFromGoal(goal.trim()); importRoadmap({ ...generated, id: `roadmap-${crypto.randomUUID()}`, updatedAt: new Date().toISOString() }); onNotify('AI roadmap created'); onClose() } catch (error) { onNotify(error instanceof Error ? error.message : 'AI generation failed') } finally { setLoading(false) } }
  const useFallback = (name: string) => { createTemplate(name); onNotify('Starter roadmap created'); onClose() }
  return <div className="modal-backdrop" onClick={onClose}><section className="ai-panel" onClick={(event) => event.stopPropagation()}><div className="panel-heading"><div><span className="eyebrow">Roadmap generator</span><h2><Sparkles size={18} /> Describe your goal</h2></div><button className="icon-button" onClick={onClose} aria-label="Close roadmap generator"><X size={16} /></button></div><textarea value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="Become a backend developer in 6 months..." autoFocus /><button className="button primary ai-generate" onClick={generate} disabled={loading || !goal.trim()}>{loading ? <LoaderCircle size={15} className="spin" /> : <Sparkles size={15} />} {loading ? 'Generating...' : 'Generate roadmap'}</button>{!aiConfigured && <p className="ai-note">AI endpoint is not configured. Try a curated starter path instead.</p>}<div className="ai-fallbacks">{roadmapTemplates.map((template) => <button key={template.name} onClick={() => useFallback(template.name)}><strong>{template.name}</strong><small>{template.description}</small></button>)}</div></section></div>
}
