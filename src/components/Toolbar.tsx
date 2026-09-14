import { BarChart3, CalendarDays, Columns3, Download, Ellipsis, GitCompare, History, Image, LayoutGrid, LogIn, Menu, Moon, Network, Plus, Redo2, Search, Sparkles, Sun, Undo2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { useRoadmapStore, getActiveRoadmap, type Roadmap } from '../store/useRoadmapStore'
import { searchRoadmap } from '../lib/roadmapInsights'
import { roadmapIcs } from '../lib/calendar'
import { isRoadmap } from '../lib/roadmapValidation'
import { roadmapTemplates } from '../lib/roadmapTemplates'
import { cloudConfigured, publishRoadmap } from '../lib/cloud'
import { collectNodes } from '../lib/roadmapInsights'

export function Toolbar({
  theme,
  onToggleTheme,
  onToggleGraphView,
  graphViewActive,
  onToggleKanbanView,
  kanbanViewActive,
  onToggleTimelineView,
  timelineViewActive,
  onToggleCompareView,
  compareViewActive,
  onNotify,
  onOpenAuth,
  onOpenHistory,
  onOpenAi,
  onToggleDiffView,
  diffViewActive,
}: {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onToggleGraphView: () => void
  graphViewActive: boolean
  onToggleKanbanView: () => void
  kanbanViewActive: boolean
  onToggleTimelineView: () => void
  timelineViewActive: boolean
  onToggleCompareView: () => void
  compareViewActive: boolean
  onNotify: (message: string) => void
  onOpenAuth: () => void
  onOpenHistory: () => void
  onOpenAi: () => void
  onToggleDiffView: () => void
  diffViewActive: boolean
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const active = useRoadmapStore((state) => getActiveRoadmap(state))
  const addNode = useRoadmapStore((state) => state.addNode)
  const createRoadmap = useRoadmapStore((state) => state.createRoadmap)
  const createTemplate = useRoadmapStore((state) => state.createTemplate)
  const toggleSidebar = useRoadmapStore((state) => state.toggleSidebar)
  const searchTerm = useRoadmapStore((state) => state.searchTerm)
  const setSearchTerm = useRoadmapStore((state) => state.setSearchTerm)
  const undo = useRoadmapStore((state) => state.undo)
  const redo = useRoadmapStore((state) => state.redo)
  const canUndo = useRoadmapStore((state) => state.past.length > 0)
  const canRedo = useRoadmapStore((state) => state.future.length > 0)
  const navigateToNode = useRoadmapStore((state) => state.navigateToNode)
  const toggleDashboard = useRoadmapStore((state) => state.toggleDashboard)
  const statusFilter = useRoadmapStore((state) => state.statusFilter)
  const priorityFilter = useRoadmapStore((state) => state.priorityFilter)
  const setStatusFilter = useRoadmapStore((state) => state.setStatusFilter)
  const setPriorityFilter = useRoadmapStore((state) => state.setPriorityFilter)
  const layoutCurrentMap = useRoadmapStore((state) => state.layoutCurrentMap)
  const results = searchRoadmap(active, searchTerm)

  const closeMenu = () => setMenuOpen(false)

  const exportPng = async () => {
    closeMenu()
    const canvas = document.querySelector<HTMLElement>('.react-flow')
    if (!canvas) return
    try {
      const dataUrl = await toPng(canvas, { cacheBust: true, backgroundColor: '#f4f7f6' })
      const link = document.createElement('a')
      link.download = `${active.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`
      link.href = dataUrl
      link.click()
      onNotify('PNG exported')
    } catch { onNotify('PNG export failed') }
  }

  const exportRoadmap = () => {
    closeMenu()
    const blob = new Blob([JSON.stringify(active, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${active.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`
    link.click()
    URL.revokeObjectURL(url)
    onNotify('Roadmap exported')
  }

  const exportCalendar = () => {
    closeMenu()
    const blob = new Blob([roadmapIcs(active)], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${active.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`
    link.click()
    URL.revokeObjectURL(url)
    onNotify('Calendar exported')
  }

  const exportProgressCard = () => {
    closeMenu()
    const nodes = collectNodes(active).map((item) => item.node)
    const done = nodes.filter((node) => node.data.status === 'done').length
    const canvas = document.createElement('canvas')
    canvas.width = 1200
    canvas.height = 630
    const context = canvas.getContext('2d')
    if (!context) return
    context.fillStyle = '#f4f7f6'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = '#2f6f63'
    context.fillRect(0, 0, 24, canvas.height)
    context.fillStyle = '#1f2a2b'
    context.font = '700 52px sans-serif'
    context.fillText(active.name, 90, 150)
    context.font = '400 28px sans-serif'
    context.fillStyle = '#5f6868'
    context.fillText('Roadmap progress', 94, 205)
    context.font = '800 120px sans-serif'
    context.fillStyle = '#2f6f63'
    context.fillText(`${nodes.length ? Math.round(done / nodes.length * 100) : 0}%`, 90, 390)
    context.font = '500 30px sans-serif'
    context.fillStyle = '#5f6868'
    context.fillText(`${done} of ${nodes.length} milestones complete`, 95, 455)
    const link = document.createElement('a')
    link.download = `${active.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-progress.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    onNotify('Progress card exported')
  }

  const publish = async () => {
    closeMenu()
    if (!cloudConfigured) { onNotify('Add Supabase credentials to publish'); return }
    const suggestedSlug = active.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const enteredSlug = window.prompt('Public URL slug', suggestedSlug)?.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-')
    const slug = enteredSlug ? `${enteredSlug}${enteredSlug.length < 8 ? `-${active.id.slice(-8)}` : ''}` : ''
    if (!slug) return
    try { await publishRoadmap(active, slug); onNotify(`Published at /public/${slug}`) } catch { onNotify('Publishing failed') }
  }

  const importRoadmap = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    closeMenu()
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const roadmap = JSON.parse(String(reader.result)) as Roadmap
        if (!isRoadmap(roadmap)) throw new Error()
        useRoadmapStore.getState().importRoadmap(roadmap)
        onNotify('Roadmap imported')
      } catch {
        onNotify('That file is not a valid uBrain export')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  return (
    <header className="toolbar">
      <div className="toolbar-brand">
        <button className="icon-button mobile-menu" onClick={toggleSidebar} aria-label="Toggle roadmap list">
          <Menu size={19} />
        </button>
        <div className="brand-mark">u</div>
        <div className="app-title">
          <h1>{active.name}</h1>
        </div>
      </div>

      <div className="toolbar-actions">
        <div className="search-wrap">
          <label className="search-box">
            <Search size={15} />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search roadmap..." aria-label="Search roadmap" />
          </label>
          {searchTerm.trim() && (
            <div className="search-results">
              {results.length ? results.map((result) => (
                  <button key={`${result.roadmap.id}-${result.id}`} onClick={() => navigateToNode(result.navigation, result.id, result.roadmap.id)}>
                  <strong>{result.title}</strong>
                  <small>{result.roadmap.name}{result.path.length > 1 ? ` — ${result.path.slice(0, -1).join(' > ')}` : ''}</small>
                </button>
              )) : <span className="search-empty">No matches</span>}
            </div>
          )}
        </div>

        <button className="button primary" onClick={() => addNode()}>
          <Plus size={16} /> Add node
        </button>

        <div className="toolbar-filters" aria-label="Roadmap filters">
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} aria-label="Filter by status" title="Filter by status">
            <option value="all">All statuses</option><option value="not-started">Not started</option><option value="in-progress">In progress</option><option value="done">Done</option>
          </select>
          <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as typeof priorityFilter)} aria-label="Filter by priority" title="Filter by priority">
            <option value="all">All priorities</option><option value="low">Low priority</option><option value="medium">Medium priority</option><option value="high">High priority</option><option value="urgent">Urgent</option>
          </select>
        </div>

        <button className="icon-button" onClick={layoutCurrentMap} aria-label="Arrange nodes" title="Arrange nodes">
          <LayoutGrid size={16} />
        </button>
        <button className="icon-button" onClick={onOpenAuth} aria-label="Open cloud account" title="Cloud account">
          <LogIn size={16} />
        </button>
        <button className="icon-button" onClick={onOpenHistory} aria-label="Open version history" title="Version history">
          <History size={16} />
        </button>
        <button className="icon-button" onClick={onOpenAi} aria-label="Generate roadmap with AI" title="Generate roadmap with AI">
          <Sparkles size={16} />
        </button>

        <button
          className={`icon-button ${graphViewActive ? 'active' : ''}`}
          onClick={onToggleGraphView}
          aria-label="Toggle graph view"
          title="Graph view (shows all nodes)"
        >
          <Network size={16} />
        </button>

        <button className={`icon-button ${kanbanViewActive ? 'active' : ''}`} onClick={onToggleKanbanView} aria-label="Toggle Kanban view" title="Kanban view">
          <Columns3 size={16} />
        </button>
        <button className={`icon-button ${timelineViewActive ? 'active' : ''}`} onClick={onToggleTimelineView} aria-label="Toggle timeline view" title="Timeline view">
          <CalendarDays size={16} />
        </button>
        <button className={`icon-button ${compareViewActive ? 'active' : ''}`} onClick={onToggleCompareView} aria-label="Compare roadmaps" title="Compare roadmaps">
          <GitCompare size={16} />
        </button>

        <div className="overflow-menu-wrap">
          <button className="icon-button" onClick={() => setMenuOpen((value) => !value)} aria-label="Open more actions" aria-expanded={menuOpen} title="More actions">
            <Ellipsis size={16} />
          </button>

          {menuOpen && (
            <div className="overflow-menu" role="menu">
              <button role="menuitem" onClick={() => { closeMenu(); toggleDashboard() }}>
                <BarChart3 size={15} /> Dashboard
              </button>
              <button role="menuitem" onClick={() => { closeMenu(); onToggleTheme() }}>
                <span>{theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}</span>
                {theme === 'light' ? 'Dark mode' : 'Light mode'}
              </button>
              <button role="menuitem" onClick={() => { closeMenu(); undo() }} disabled={!canUndo}>
                <Undo2 size={15} /> Undo
              </button>
              <button role="menuitem" onClick={() => { closeMenu(); redo() }} disabled={!canRedo}>
                <Redo2 size={15} /> Redo
              </button>
              <button role="menuitem" onClick={exportPng}>
                <Image size={15} /> PNG export
              </button>
              <button role="menuitem" onClick={exportRoadmap}>
                <Download size={15} /> Export JSON
              </button>
              <button role="menuitem" onClick={exportCalendar}>
                <CalendarDays size={15} /> Export calendar
              </button>
              <button role="menuitem" onClick={exportProgressCard}>
                <Image size={15} /> Progress card
              </button>
              <button role="menuitem" onClick={publish}>
                <Network size={15} /> Publish roadmap
              </button>
              <button role="menuitem" onClick={() => inputRef.current?.click()}>
                <Upload size={15} /> Import
              </button>
              <button role="menuitem" onClick={() => { closeMenu(); createRoadmap() }}>
                <Plus size={15} /> New roadmap
              </button>
              <div className="menu-divider" />
              <span className="menu-label">Start from template</span>
              {roadmapTemplates.map((template) => <button role="menuitem" key={template.name} onClick={() => { closeMenu(); createTemplate(template.name) }}><Plus size={15} /> {template.name}</button>)}
            </div>
          )}
        </div>

        <input ref={inputRef} type="file" accept="application/json" hidden onChange={importRoadmap} />
      </div>
    </header>
  )
}
