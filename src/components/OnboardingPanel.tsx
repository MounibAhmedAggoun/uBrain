import { ArrowRight, Compass, X } from 'lucide-react'
import { roadmapTemplates } from '../lib/roadmapTemplates'
import { useRoadmapStore } from '../store/useRoadmapStore'

export function OnboardingPanel({ onClose }: { onClose: () => void }) {
  const createTemplate = useRoadmapStore((state) => state.createTemplate)
  const start = (name: string) => { createTemplate(name); onClose() }
  return <div className="modal-backdrop" onClick={onClose}><section className="onboarding-panel" onClick={(event) => event.stopPropagation()}><div className="panel-heading"><div><span className="eyebrow">Welcome to uBrain</span><h2><Compass size={18} /> Choose your starting point</h2></div><button className="icon-button" onClick={onClose} aria-label="Close onboarding"><X size={16} /></button></div><p className="onboarding-intro">Start with a proven path, then shape it around your goals.</p><div className="onboarding-templates">{roadmapTemplates.map((template) => <button key={template.name} onClick={() => start(template.name)}><div><strong>{template.name}</strong><small>{template.category} · {template.description}</small></div><ArrowRight size={16} /></button>)}</div><button className="onboarding-skip" onClick={onClose}>Start with a blank roadmap</button></section></div>
}
