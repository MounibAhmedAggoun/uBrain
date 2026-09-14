import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { ReactFlowProvider } from '@xyflow/react'
import { Canvas } from './components/Canvas'
const NotesPanel = lazy(() => import('./components/NotesPanel').then((module) => ({ default: module.NotesPanel })))
const EdgePanel = lazy(() => import('./components/EdgePanel').then((module) => ({ default: module.EdgePanel })))
const PlanningPanel = lazy(() => import('./components/PlanningPanel').then((module) => ({ default: module.PlanningPanel })))
import { Sidebar } from './components/Sidebar'
import { Toolbar } from './components/Toolbar'
const Dashboard = lazy(() => import('./components/Dashboard').then((module) => ({ default: module.Dashboard })))
const CommandPalette = lazy(() => import('./components/CommandPalette').then((module) => ({ default: module.CommandPalette })))
const GraphView = lazy(() => import('./components/views/GraphView').then((module) => ({ default: module.GraphView })))
const KanbanView = lazy(() => import('./components/views/KanbanView').then((module) => ({ default: module.KanbanView })))
const TimelineView = lazy(() => import('./components/views/TimelineView').then((module) => ({ default: module.TimelineView })))
const CompareView = lazy(() => import('./components/views/CompareView').then((module) => ({ default: module.CompareView })))
const PublicRoadmapView = lazy(() => import('./components/views/PublicRoadmapView').then((module) => ({ default: module.PublicRoadmapView })))
const AuthPanel = lazy(() => import('./components/AuthPanel').then((module) => ({ default: module.AuthPanel })))
const OnboardingPanel = lazy(() => import('./components/OnboardingPanel').then((module) => ({ default: module.OnboardingPanel })))
const AiRoadmapPanel = lazy(() => import('./components/AiRoadmapPanel').then((module) => ({ default: module.AiRoadmapPanel })))
const VersionHistoryPanel = lazy(() => import('./components/VersionHistoryPanel').then((module) => ({ default: module.VersionHistoryPanel })))
const DiffView = lazy(() => import('./components/views/DiffView').then((module) => ({ default: module.DiffView })))
import { getActiveRoadmap, useRoadmapStore } from './store/useRoadmapStore'
import { saveRoadmapData } from './lib/storage'

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('ubrain-theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [graphViewActive, setGraphViewActive] = useState(false)
  const [kanbanViewActive, setKanbanViewActive] = useState(false)
  const [timelineViewActive, setTimelineViewActive] = useState(false)
  const [compareViewActive, setCompareViewActive] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [onboardingOpen, setOnboardingOpen] = useState(() => !window.location.pathname.startsWith('/public/') && !localStorage.getItem('ubrain-onboarding-seen'))
  const [aiOpen, setAiOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [diffViewActive, setDiffViewActive] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const hydrate = useRoadmapStore((state) => state.hydrate)
  const roadmaps = useRoadmapStore((state) => state.roadmaps)
  const activeRoadmap = useRoadmapStore((state) => getActiveRoadmap(state))
  const sidebarOpen = useRoadmapStore((state) => state.sidebarOpen)
  const saveState = useRoadmapStore((state) => state.saveState)
  const goToLevel = useRoadmapStore((state) => state.goToLevel)
  const navigationNames = useRoadmapStore(useShallow((state) => {
    const root = state.roadmaps.find((item) => item.id === state.activeRoadmapId)
    const names = [root?.name ?? 'Roadmap']
    let nodes = root?.nodes ?? []
    for (const id of state.navigation) {
      const node = nodes.find((item) => item.id === id)
      if (!node) break
      names.push(node.data.title)
      nodes = node.data.childMap?.nodes ?? []
    }
    return names
  }))
  const typedEdgeCount = activeRoadmap?.edges.filter((edge) => typeof (edge.data as { kind?: string } | undefined)?.kind === 'string').length ?? 0
  const [hydrated, setHydrated] = useState(false)
  const saveVersion = useRef(0)

  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), 3200); return () => window.clearTimeout(timer) }, [toast])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('ubrain-theme', theme)
  }, [theme])

  useEffect(() => {
    hydrate().catch(() => useRoadmapStore.setState({ saveState: 'error' })).finally(() => setHydrated(true))
  }, [hydrate])

  useEffect(() => {
    if (!hydrated) return
    const version = ++saveVersion.current
    useRoadmapStore.setState({ saveState: 'saving' })
    const timer = window.setTimeout(() => {
      saveRoadmapData({ roadmaps, activeRoadmapId: activeRoadmap?.id }).then(() => { if (version === saveVersion.current) useRoadmapStore.setState({ saveState: 'saved' }) }).catch(() => { if (version === saveVersion.current) useRoadmapStore.setState({ saveState: 'error' }) })
    }, 250)
    return () => window.clearTimeout(timer)
  }, [hydrated, roadmaps, activeRoadmap?.id])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        setCommandPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <Suspense fallback={<div className="loading-screen">Loading...</div>}>
    {window.location.pathname.startsWith('/public/') ? <PublicRoadmapView slug={decodeURIComponent(window.location.pathname.slice('/public/'.length))} /> : <>
      <div className="app-shell">
        <Toolbar
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          onToggleGraphView={() => { setGraphViewActive(!graphViewActive); setKanbanViewActive(false); setTimelineViewActive(false); setCompareViewActive(false) }}
          graphViewActive={graphViewActive}
          onToggleKanbanView={() => { setKanbanViewActive(!kanbanViewActive); setGraphViewActive(false); setCompareViewActive(false) }}
          kanbanViewActive={kanbanViewActive}
          onToggleTimelineView={() => { setTimelineViewActive(!timelineViewActive); setGraphViewActive(false); setKanbanViewActive(false); setCompareViewActive(false) }}
          timelineViewActive={timelineViewActive}
          onToggleCompareView={() => { setCompareViewActive(!compareViewActive); setGraphViewActive(false); setKanbanViewActive(false); setTimelineViewActive(false) }}
          compareViewActive={compareViewActive}
          onNotify={setToast}
          onOpenAuth={() => setAuthOpen(true)}
          onOpenAi={() => setAiOpen(true)}
          onOpenHistory={() => setHistoryOpen(true)}
          onToggleDiffView={() => setDiffViewActive(!diffViewActive)}
          diffViewActive={diffViewActive}
        />
        <div className="workspace">
          {diffViewActive ? (
            <DiffView onClose={() => setDiffViewActive(false)} />
          ) : compareViewActive ? (
            <CompareView onClose={() => setCompareViewActive(false)} />
          ) : timelineViewActive ? (
            <TimelineView onClose={() => setTimelineViewActive(false)} />
          ) : kanbanViewActive ? (
            <KanbanView onClose={() => setKanbanViewActive(false)} />
          ) : graphViewActive ? (
            <ReactFlowProvider>
              <GraphView onClose={() => setGraphViewActive(false)} />
            </ReactFlowProvider>
          ) : (
            <>
              <div className={`sidebar-slot ${sidebarOpen ? 'open' : ''}`}>
                <Sidebar onNotify={setToast} />
              </div>
              <main className="canvas-area">
                <div className="canvas-heading">
                  <div>
                    <div className="breadcrumbs">
                      {navigationNames.map((name, index) => (
                        <span key={`${name}-${index}`}>
                          <button onClick={() => goToLevel(index)}>{name}</button>
                          {index < navigationNames.length - 1 && <b> / </b>}
                        </span>
                      ))}
                    </div>
                    <h2>{navigationNames[navigationNames.length - 1]}</h2>
                  </div>
                  <div className="canvas-hint">
                    <span className={`hint-dot ${saveState}`} />
                    {saveState === 'saving' ? 'Saving...' : saveState === 'error' ? 'Save failed' : 'Saved locally'}
                  </div>
                </div>
                <ReactFlowProvider>
                  <Canvas />
                </ReactFlowProvider>
                <div className="canvas-tip"><span>Right-click</span> anywhere to add a milestone</div>
                {typedEdgeCount > 0 && (
                  <div className="legend">
                    <strong>Link types</strong>
                    <span><i className="legend-line required" /> Required</span>
                    <span><i className="legend-line optional" /> Optional</span>
                    <span><i className="legend-line related" /> Related</span>
                    <span><i className="legend-line alternative" /> Alternative</span>
                  </div>
                )}
              </main>
              <NotesPanel />
              <PlanningPanel />
              <EdgePanel />
            </>
          )}
        </div>
      </div>
      <Dashboard />
      <CommandPalette open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
      {authOpen && <AuthPanel onClose={() => setAuthOpen(false)} onNotify={setToast} />}
      {onboardingOpen && <OnboardingPanel onClose={() => { localStorage.setItem('ubrain-onboarding-seen', '1'); setOnboardingOpen(false) }} />}
      {aiOpen && <AiRoadmapPanel onClose={() => setAiOpen(false)} onNotify={setToast} />}
      {historyOpen && <VersionHistoryPanel onClose={() => setHistoryOpen(false)} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </>}
    </Suspense>
  )
}

export default App

