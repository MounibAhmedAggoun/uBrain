import { useEffect, useRef, useState } from 'react'
import { BlockNoteViewRaw, useCreateBlockNote } from '@blocknote/react'
import '@blocknote/core/style.css'
import { Bold, CheckSquare, Copy, FileText, GitBranch, Italic, Maximize2, Minus, Quote, Strikethrough, Table2, Underline, X } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { noteTemplates } from '../lib/notesTemplates'
import { useRoadmapStore, getCurrentMap, type NodeColor, type NodePriority, type NodeStatus, type NoteBlock, type RoadmapNodeData } from '../store/useRoadmapStore'

const colorOptions: { value: NodeColor; label: string }[] = [
  { value: 'mint', label: 'Ready' }, { value: 'sky', label: 'In progress' }, { value: 'amber', label: 'Planning' }, { value: 'rose', label: 'Blocked' }, { value: 'lavender', label: 'Reference' },
]
const icons = ['', '🚀', '💡', '🎯', '📚', '🧪', '🛠️', '✅', '⭐', '🧠']
type EditorProps = { nodeId: string; notes: NoteBlock[]; expanded: boolean; onExpand: () => void; onCollapse: () => void }

type Editor = ReturnType<typeof useCreateBlockNote>

function PlanningFields({ node, updateNode }: { node: { id: string; data: RoadmapNodeData }; updateNode: (id: string, patch: Partial<RoadmapNodeData>) => void }) {
  return <div className="planning-fields"><div className="field-row"><label className="field-label" htmlFor="node-priority">Priority</label><select id="node-priority" className="status-select" value={node.data.priority ?? 'medium'} onChange={(event) => updateNode(node.id, { priority: event.target.value as NodePriority })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></div><div className="field-row"><label className="field-label" htmlFor="node-due-date">Due date</label><input id="node-due-date" className="date-input" type="date" value={node.data.dueDate ?? ''} onChange={(event) => updateNode(node.id, { dueDate: event.target.value || undefined })} /></div><label className="field-label" htmlFor="node-owner">Owner</label><input id="node-owner" className="text-input" placeholder="Unassigned" value={node.data.owner ?? ''} onChange={(event) => updateNode(node.id, { owner: event.target.value || undefined })} /><label className="field-label" htmlFor="node-tags">Tags</label><input id="node-tags" className="text-input" placeholder="design, frontend, v1" value={(node.data.tags ?? []).join(', ')} onChange={(event) => updateNode(node.id, { tags: event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) })} /></div>
}
function EditorToolbar({ editor }: { editor: Editor }) {
  const [active, setActive] = useState<Record<string, unknown>>({})
  useEffect(() => { const sync = () => setActive(editor.getActiveStyles()); editor.onEditorContentChange(sync); return () => editor.onEditorContentChange(sync) }, [editor])
  const toggle = (style: 'bold' | 'italic' | 'underline' | 'strike') => { editor.toggleStyles({ [style]: true }); setActive(editor.getActiveStyles()) }
  const insert = (block: NoteBlock) => { const current = editor.getTextCursorPosition().block; const reference = current ?? editor.document[editor.document.length - 1]; editor.insertBlocks([block], reference.id, 'after'); editor.focus() }
  const block = (type: string, props?: Record<string, unknown>) => insert({ type, props } as NoteBlock)
  const button = (label: string, icon: React.ReactNode, action: () => void, key?: string) => <button className={`editor-tool ${key && active[key] ? 'active' : ''}`} onMouseDown={(event) => event.preventDefault()} onClick={action} aria-label={label} title={label}>{icon}</button>
  return <div className="expanded-toolbar"><div className="editor-tool-group">{button('Bold', <Bold size={16} />, () => toggle('bold'), 'bold')}{button('Italic', <Italic size={16} />, () => toggle('italic'), 'italic')}{button('Underline', <Underline size={16} />, () => toggle('underline'), 'underline')}{button('Strikethrough', <Strikethrough size={16} />, () => toggle('strike'), 'strike')}</div><div className="editor-tool-group"><button className="editor-tool text-tool" onClick={() => block('heading', { level: 1 })}>H1</button><button className="editor-tool text-tool" onClick={() => block('heading', { level: 2 })}>H2</button><button className="editor-tool text-tool" onClick={() => block('heading', { level: 3 })}>H3</button>{button('Bulleted list', <span>•</span>, () => block('bulletListItem'))}{button('Numbered list', <span>1.</span>, () => block('numberedListItem'))}{button('Checklist', <CheckSquare size={16} />, () => block('checkListItem', { checked: false }))}{button('Quote', <Quote size={16} />, () => block('quote'))}{button('Divider', <Minus size={16} />, () => block('divider'))}{button('Table', <Table2 size={16} />, () => insert({ type: 'table', content: { type: 'tableContent', headerRows: 1, columnWidths: [220, 160], rows: [{ cells: [['Task'], ['Status']] }, { cells: [[''], ['']] }] } } as NoteBlock))}</div></div>
}

function NodeNotesEditor({ nodeId, notes, expanded, onExpand, onCollapse }: EditorProps) {
  const updateNode = useRoadmapStore((state) => state.updateNode)
  const darkMode = document.documentElement.dataset.theme === 'dark'
  const [template, setTemplate] = useState('')
  const [saving, setSaving] = useState(false)
  const saveTimer = useRef<number | undefined>(undefined)
  const editor = useCreateBlockNote({ initialContent: notes.length ? notes : undefined }, [nodeId])
  useEffect(() => { editor.focus() }, [editor, expanded])
  useEffect(() => () => window.clearTimeout(saveTimer.current), [])
  const save = () => { setSaving(true); window.clearTimeout(saveTimer.current); saveTimer.current = window.setTimeout(() => { updateNode(nodeId, { notes: editor.document }); setSaving(false) }, 350) }
  const insertTemplate = (value: string) => { const selected = noteTemplates.find((item) => item.label === value); if (!selected) return; const current = editor.getTextCursorPosition().block; const reference = current ?? editor.document[editor.document.length - 1]; editor.insertBlocks(selected.blocks, reference.id, 'after'); setTemplate(''); editor.focus(); save() }
  const text = editor.document.map((block) => { const content = (block as { content?: unknown }).content; return typeof content === 'string' ? content : Array.isArray(content) ? content.map((item) => typeof item === 'object' && item !== null && 'text' in item ? String(item.text) : '').join('') : '' }).join(' ')
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const view = <><div className="notes-editor-toolbar"><label htmlFor={`note-template-${nodeId}`}>Insert Template</label><select id={`note-template-${nodeId}`} value={template} onChange={(event) => insertTemplate(event.target.value)}><option value="">Choose a template...</option>{noteTemplates.map((item) => <option key={item.label} value={item.label}>{item.label}</option>)}</select></div>{expanded && <EditorToolbar editor={editor} />}<BlockNoteViewRaw editor={editor} theme={darkMode ? 'dark' : 'light'} onChange={save} /></>
  if (expanded) return <div className="editor-overlay"><div className="expanded-editor"><div className="expanded-editor-head"><div><span className="eyebrow">uBrain document</span><h2>Notes</h2></div><div className="expanded-head-actions"><span className={`expanded-save ${saving ? 'saving' : ''}`}>{saving ? 'Saving...' : 'Saved'}</span><button className="icon-button" onClick={onCollapse} aria-label="Collapse editor" title="Collapse"><Minus size={17} /></button><button className="icon-button" onClick={onCollapse} aria-label="Close editor" title="Close"><X size={17} /></button></div></div><div className="expanded-cover" /><div className="expanded-document-title"><span className="expanded-node-icon">{useRoadmapStore.getState().roadmaps.flatMap((roadmap) => roadmap.nodes).find((item) => item.id === nodeId)?.data.icon || '🧠'}</span><span>Keep thinking clearly.</span></div>{view}<div className="expanded-footer"><span>{wordCount} words</span><span>{text.length} characters</span></div></div></div>
  return <div className="notes-editor-wrap">{view}<button className="expand-editor-button" onClick={onExpand}><Maximize2 size={14} /> Expand editor</button></div>
}

export function NotesPanel() {
  const selectedId = useRoadmapStore((state) => state.selectedNodeId)
  const expandedNodeId = useRoadmapStore((state) => state.expandedNodeId)
  const roadmap = useRoadmapStore(useShallow((state) => getCurrentMap(state)))
  const updateNode = useRoadmapStore((state) => state.updateNode)
  const selectNode = useRoadmapStore((state) => state.selectNode)
  const expandNode = useRoadmapStore((state) => state.expandNode)
  const addSubRoadmap = useRoadmapStore((state) => state.addSubRoadmap)
  const enterRoadmap = useRoadmapStore((state) => state.enterRoadmap)
  const duplicateNode = useRoadmapStore((state) => state.duplicateNode)
  const node = roadmap.nodes.find((item) => item.id === selectedId)
  const expandedNode = roadmap.nodes.find((item) => item.id === expandedNodeId) ?? node
  const [panelWidth, setPanelWidth] = useState(() => Number(localStorage.getItem('ubrain-notes-panel-width')) || 390)
  const expanded = Boolean(expandedNodeId && expandedNodeId === expandedNode?.id)
  useEffect(() => { const panel = document.querySelector<HTMLElement>('.notes-panel'); if (!panel) return; if (!expanded) panel.style.width = `${panelWidth}px`; const observer = new ResizeObserver(() => { if (!expanded && panel.offsetWidth >= 320) { setPanelWidth(panel.offsetWidth); localStorage.setItem('ubrain-notes-panel-width', String(panel.offsetWidth)) } }); observer.observe(panel); return () => observer.disconnect() }, [expanded, panelWidth])
  useEffect(() => { if (!expanded) return; const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') expandNode(null) }; window.addEventListener('keydown', closeOnEscape); return () => window.removeEventListener('keydown', closeOnEscape) }, [expanded, expandNode])
  if (!node || !expandedNode) return null
  const planningFields = <PlanningFields node={node} updateNode={updateNode} />
  return <><aside className={`notes-panel ${expanded ? 'panel-hidden' : ''}`}><div className="panel-heading"><div><span className="eyebrow">Milestone details</span><h2>Edit node</h2></div><div className="panel-heading-actions"><button className="icon-button" onClick={() => expandNode(node.id)} aria-label="Expand editor" title="Expand editor"><Maximize2 size={16} /></button><button className="icon-button" onClick={() => selectNode(null)} aria-label="Close notes panel"><X size={18} /></button></div></div><div className="node-icon-picker"><label htmlFor="node-icon">Icon</label><select id="node-icon" value={node.data.icon ?? ''} onChange={(event) => updateNode(node.id, { icon: event.target.value || undefined })}>{icons.map((icon) => <option key={icon} value={icon}>{icon || 'None'}</option>)}</select></div><label className="field-label" htmlFor="node-title">Title</label><input id="node-title" className="text-input" value={node.data.title} onChange={(event) => updateNode(node.id, { title: event.target.value })} /><div className="field-row"><label className="field-label">Status</label><select className="status-select" value={node.data.status ?? 'not-started'} onChange={(event) => updateNode(node.id, { status: event.target.value as NodeStatus })}><option value="not-started">Not Started</option><option value="in-progress">In Progress</option><option value="done">Done</option></select></div><div className="field-row"><label className="field-label">Color</label><div className="swatches">{colorOptions.map((option) => <button key={option.value} title={option.label} aria-label={option.label} className={`swatch swatch-${option.value} ${node.data.color === option.value ? 'active' : ''}`} onClick={() => updateNode(node.id, { color: option.value })} />)}</div></div><label className="field-label">Notes <span>Slash commands enabled</span></label><NodeNotesEditor nodeId={node.id} notes={node.data.notes} expanded={expanded} onExpand={() => expandNode(node.id)} onCollapse={() => expandNode(null)} /><div className="panel-actions"><button className="panel-action" onClick={() => { addSubRoadmap(node.id); enterRoadmap(node.id) }}><GitBranch size={15} /> {node.data.childMap ? 'Open sub-roadmap' : 'Add sub-roadmap'}</button><button className="panel-action" onClick={() => duplicateNode(node.id)}><Copy size={15} /> Duplicate node</button></div><div className="panel-footnote"><FileText size={15} /> Notes and sub-roadmap are separate</div></aside></>
}
