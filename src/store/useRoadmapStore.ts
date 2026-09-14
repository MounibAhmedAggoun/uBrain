import { create } from 'zustand'
import type { Connection, Edge, Node } from '@xyflow/react'
import type { PartialBlock } from '@blocknote/core'
import { loadRoadmapData } from '../lib/storage'
import { isStoredRoadmaps } from '../lib/roadmapValidation'
import { roadmapTemplates } from '../lib/roadmapTemplates'

export type NodeColor = 'mint' | 'sky' | 'amber' | 'rose' | 'lavender'
export type EdgeKind = 'required' | 'optional' | 'related' | 'alternative'
export type NodeStatus = 'not-started' | 'in-progress' | 'done'
export type NodePriority = 'low' | 'medium' | 'high' | 'urgent'
export type NestedMap = { nodes: Node<RoadmapNodeData>[]; edges: Edge[] }
export type NoteBlock = PartialBlock

export type RoadmapNodeData = {
  title: string
  icon?: string
  notes: NoteBlock[]
  color: NodeColor
  status: NodeStatus
  priority?: NodePriority
  dueDate?: string
  owner?: string
  tags?: string[]
  estimatedMinutes?: number
  actualMinutes?: number
  childMap?: NestedMap
}

export type Roadmap = {
  id: string
  name: string
  nodes: Node<RoadmapNodeData>[]
  edges: Edge[]
  updatedAt: string
}

type RoadmapStore = {
  roadmaps: Roadmap[]
  activeRoadmapId: string
  selectedNodeId: string | null
  selectedEdgeId: string | null
  navigation: string[]
  saveState: 'saved' | 'saving' | 'error'
  searchTerm: string
  statusFilter: NodeStatus | 'all'
  priorityFilter: NodePriority | 'all'
  sidebarOpen: boolean
  expandedNodeId: string | null
  searchTargetId: string | null
  dashboardOpen: boolean
  past: HistorySnapshot[]
  future: HistorySnapshot[]
  versions: RoadmapVersion[]
  hydrate: () => Promise<void>
  addNode: (position?: { x: number; y: number }) => string
  updateNode: (id: string, patch: Partial<RoadmapNodeData>) => void
  updateNodePosition: (id: string, position: { x: number; y: number }) => void
  updateEdgeSelection: (id: string | null) => void
  removeElements: (nodeIds: string[], edgeIds: string[]) => void
  addConnection: (connection: Connection) => void
  updateEdgeKind: (id: string, kind: EdgeKind) => void
  selectNode: (id: string | null) => void
  addSubRoadmap: (id: string) => void
  enterRoadmap: (id: string) => void
  goToLevel: (index: number) => void
  duplicateNode: (id: string) => void
  createRoadmap: () => void
  createTemplate: (name: string) => void
  renameRoadmap: (id: string, name: string) => void
  deleteRoadmap: (id: string) => void
  switchRoadmap: (id: string) => void
  toggleSidebar: () => void
  setSearchTerm: (term: string) => void
  setStatusFilter: (filter: NodeStatus | 'all') => void
  setPriorityFilter: (filter: NodePriority | 'all') => void
  layoutCurrentMap: () => void
  importRoadmap: (roadmap: Roadmap) => void
  undo: () => void
  redo: () => void
  expandNode: (id: string | null) => void
  navigateToNode: (navigation: string[], nodeId: string, roadmapId?: string) => void
  toggleDashboard: () => void
  saveVersion: (label?: string) => void
  restoreVersion: (id: string) => void
}

export type RoadmapVersion = { id: string; label: string; createdAt: string; roadmap: Roadmap }

type HistorySnapshot = Pick<RoadmapStore, 'roadmaps' | 'activeRoadmapId' | 'navigation'>

const STORAGE_KEY = 'roadmapbuilder-data'

const now = () => new Date().toISOString()
const id = (prefix: string) => `${prefix}-${crypto.randomUUID()}`

const starterNode = (title: string, x: number, y: number, color: NodeColor = 'mint'): Node<RoadmapNodeData> => ({
  id: id('node'),
  type: 'roadmap',
  position: { x, y },
  data: { title, notes: [], color, status: 'not-started', priority: 'medium', tags: [] },
})

const initialRoadmap = (): Roadmap => ({
  id: id('roadmap'),
  name: 'Frontend foundations',
  nodes: [
    starterNode('HTML & CSS', 120, 130, 'mint'),
    starterNode('JavaScript', 420, 130, 'sky'),
    starterNode('React', 720, 130, 'lavender'),
  ],
  edges: [],
  updatedAt: now(),
})

const initialState = { roadmaps: [initialRoadmap()], activeRoadmapId: '', selectedNodeId: null, selectedEdgeId: null, navigation: [], saveState: 'saved' as const, searchTerm: '', statusFilter: 'all' as const, priorityFilter: 'all' as const, sidebarOpen: typeof window === 'undefined' || window.innerWidth > 900, expandedNodeId: null, searchTargetId: null, dashboardOpen: false, past: [] as HistorySnapshot[], future: [] as HistorySnapshot[], versions: [] as RoadmapVersion[] }
initialState.activeRoadmapId = initialState.roadmaps[0].id

const normalizeNode = (node: Node<RoadmapNodeData>): Node<RoadmapNodeData> => ({
  ...node,
  data: {
    ...node.data,
    priority: node.data.priority ?? 'medium',
    tags: Array.isArray(node.data.tags) ? node.data.tags : [],
    notes: (() => { const rawNotes = node.data.notes as unknown; return typeof rawNotes === 'string' ? (rawNotes.trim() ? [{ type: 'paragraph', content: rawNotes }] : []) : Array.isArray(rawNotes) ? rawNotes : [] })(),
    childMap: node.data.childMap ? { ...node.data.childMap, nodes: node.data.childMap.nodes.map(normalizeNode) } : undefined,
  },
})

const normalizeRoadmap = (roadmap: Roadmap): Roadmap => ({ ...roadmap, nodes: roadmap.nodes.map(normalizeNode) })

const cloneEdges = (source: NestedMap, nodeIds: Map<string, string>): Edge[] => source.edges.flatMap((edge) => {
  const nextSource = nodeIds.get(edge.source)
  const nextTarget = nodeIds.get(edge.target)
  return nextSource && nextTarget ? [{ ...edge, id: id('edge'), source: nextSource, target: nextTarget }] : []
})

const cloneMap = (source: NestedMap, nodeIds: Map<string, string>): NestedMap => {
  const nodes = source.nodes.map((node) => cloneNode(node, nodeIds))
  return { nodes, edges: cloneEdges(source, nodeIds) }
}

const cloneNode = (source: Node<RoadmapNodeData>, nodeIds = new Map<string, string>()): Node<RoadmapNodeData> => {
  const clonedId = id('node')
  nodeIds.set(source.id, clonedId)
  const childMap = source.data.childMap
  return { ...source, id: clonedId, selected: false, position: { x: source.position.x + 40, y: source.position.y + 40 }, data: { ...source.data, notes: [...source.data.notes], tags: source.data.tags ? [...source.data.tags] : [], childMap: childMap ? cloneMap(childMap, nodeIds) : undefined } }
}

const hasPath = (edges: Edge[], start: string, goal: string): boolean => {
  const visited = new Set<string>()
  const visit = (current: string): boolean => {
    if (current === goal) return true
    if (visited.has(current)) return false
    visited.add(current)
    return edges.filter((edge) => edge.source === current).some((edge) => visit(edge.target))
  }
  return visit(start)
}

const updateMapAt = (map: NestedMap, path: string[], change: (map: NestedMap) => NestedMap): NestedMap => {
  if (!path.length) return change(map)
  const [nodeId, ...rest] = path
  return { ...map, nodes: map.nodes.map((node) => node.id === nodeId && node.data.childMap ? { ...node, data: { ...node.data, childMap: updateMapAt(node.data.childMap, rest, change) } } : node) }
}

const updateCurrent = (state: RoadmapStore, change: (map: NestedMap) => NestedMap) => ({
  roadmaps: state.roadmaps.map((roadmap) => roadmap.id === state.activeRoadmapId ? { ...roadmap, ...updateMapAt({ nodes: roadmap.nodes, edges: roadmap.edges }, state.navigation, change), updatedAt: now() } : roadmap),
})

const snapshot = (state: RoadmapStore): HistorySnapshot => ({ roadmaps: state.roadmaps, activeRoadmapId: state.activeRoadmapId, navigation: state.navigation })
const commit = (state: RoadmapStore, change: (state: RoadmapStore) => Partial<RoadmapStore>) => ({ ...change(state), past: [...state.past, snapshot(state)].slice(-50), future: [] })

export const getCurrentMap = (state: Pick<RoadmapStore, 'roadmaps' | 'activeRoadmapId' | 'navigation'>): NestedMap => {
  const roadmap = state.roadmaps.find((item) => item.id === state.activeRoadmapId)
  let map: NestedMap = { nodes: roadmap?.nodes ?? [], edges: roadmap?.edges ?? [] }
  for (const nodeId of state.navigation) map = map.nodes.find((node) => node.id === nodeId)?.data.childMap ?? map
  return map
}

export const isNodeUnlocked = (map: NestedMap, nodeId: string): boolean => {
  const prerequisites = map.edges.filter((edge) => edge.target === nodeId && ((edge.data as { kind?: string } | undefined)?.kind ?? 'required') === 'required')
  return prerequisites.every((edge) => map.nodes.find((node) => node.id === edge.source)?.data.status === 'done')
}

export const useRoadmapStore = create<RoadmapStore>((set, get) => ({
  ...initialState,
  hydrate: async () => {
    const parsed = await loadRoadmapData()
    if (isStoredRoadmaps(parsed)) set({ roadmaps: parsed.roadmaps.map(normalizeRoadmap), activeRoadmapId: parsed.activeRoadmapId ?? parsed.roadmaps[0].id })
  },
  addNode: (position = { x: 260, y: 260 }) => {
    const nodeId = id('node')
    set((state) => commit(state, (state) => ({
      ...updateCurrent(state, (map) => ({ ...map, nodes: [...map.nodes, { id: nodeId, type: 'roadmap', position, data: { title: 'Untitled milestone', notes: [], color: 'mint', status: 'not-started', priority: 'medium', tags: [] } }] })),
      selectedNodeId: nodeId,
    })))
    return nodeId
  },
  updateNode: (nodeId, patch) => set((state) => { if (patch.status === 'done' && !isNodeUnlocked(getCurrentMap(state), nodeId)) return state; return commit(state, (state) => ({ saveState: 'saving', ...updateCurrent(state, (map) => ({ ...map, nodes: map.nodes.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, ...patch } } : node) })) })) }),
  updateNodePosition: (nodeId, position) => set((state) => commit(state, (state) => ({ saveState: 'saving', ...updateCurrent(state, (map) => ({ ...map, nodes: map.nodes.map((node) => node.id === nodeId ? { ...node, position } : node) })) }))),
  updateEdgeSelection: (edgeId) => set({ selectedEdgeId: edgeId, selectedNodeId: null }),
  removeElements: (nodeIds, edgeIds) => set((state) => commit(state, (state) => ({ saveState: 'saving', ...updateCurrent(state, (map) => ({ ...map, nodes: map.nodes.filter((node) => !nodeIds.includes(node.id)), edges: map.edges.filter((edge) => !edgeIds.includes(edge.id) && !nodeIds.includes(edge.source) && !nodeIds.includes(edge.target)) })), selectedNodeId: null, selectedEdgeId: null }))),
  addConnection: (connection) => set((state) => { const current = getCurrentMap(state); const invalid = connection.source === connection.target || current.edges.some((edge) => edge.source === connection.source && edge.target === connection.target) || hasPath(current.edges, connection.target, connection.source); if (invalid) return state; const edgeId = id('edge'); return commit(state, (state) => ({ saveState: 'saving', ...updateCurrent(state, (map) => ({ ...map, edges: [...map.edges, { ...connection, id: edgeId, type: 'smoothstep', data: { kind: 'required' }, label: 'Required', style: { stroke: '#347b69', strokeWidth: 2 }, markerEnd: 'arrowclosed' }] })), selectedNodeId: null, selectedEdgeId: edgeId })) }),
  updateEdgeKind: (edgeId, kind) => set((state) => commit(state, (state) => ({ saveState: 'saving', ...updateCurrent(state, (map) => ({ ...map, edges: map.edges.map((edge) => edge.id === edgeId ? { ...edge, data: { kind }, label: kind[0].toUpperCase() + kind.slice(1), style: { stroke: kind === 'alternative' ? '#c97935' : '#347b69', strokeWidth: 2, strokeDasharray: kind === 'optional' ? '7 5' : kind === 'related' ? '2 5' : undefined }, markerEnd: kind === 'related' ? undefined : 'arrowclosed' } : edge) })) }))),
  selectNode: (selectedNodeId) => set({ selectedNodeId, selectedEdgeId: null }),
  addSubRoadmap: (nodeId) => set((state) => commit(state, (state) => ({ saveState: 'saving', ...updateCurrent(state, (map) => ({ ...map, nodes: map.nodes.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, childMap: node.data.childMap ?? { nodes: [], edges: [] } } } : node) })) }))),
  enterRoadmap: (nodeId) => set((state) => ({ navigation: [...state.navigation, nodeId], selectedNodeId: null, selectedEdgeId: null })),
  goToLevel: (index) => set((state) => ({ navigation: state.navigation.slice(0, index), selectedNodeId: null, selectedEdgeId: null })),
  duplicateNode: (nodeId) => set((state) => commit(state, (state) => ({ saveState: 'saving', ...updateCurrent(state, (map) => ({ ...map, nodes: map.nodes.flatMap((node) => { if (node.id !== nodeId) return [node]; return [node, cloneNode(node)] }) })) }))),
  createRoadmap: () => { const roadmap = { ...initialRoadmap(), name: 'New roadmap', nodes: [], edges: [] }; set((state) => ({ roadmaps: [...state.roadmaps, roadmap], activeRoadmapId: roadmap.id, navigation: [], selectedNodeId: null, selectedEdgeId: null })) },
  createTemplate: (name) => { const template = roadmapTemplates.find((item) => item.name === name); if (!template) return; const roadmap = { ...initialRoadmap(), name: template.name, nodes: template.nodes.map((title, index) => starterNode(title, 100 + (index % 4) * 260, 100 + Math.floor(index / 4) * 150)), edges: [] }; set((state) => ({ roadmaps: [...state.roadmaps, roadmap], activeRoadmapId: roadmap.id, navigation: [], selectedNodeId: null, selectedEdgeId: null })) },
  renameRoadmap: (roadmapId, name) => set((state) => ({ roadmaps: state.roadmaps.map((roadmap) => roadmap.id === roadmapId ? { ...roadmap, name: name || 'Untitled roadmap', updatedAt: now() } : roadmap) })),
  deleteRoadmap: (roadmapId) => set((state) => { const remaining = state.roadmaps.filter((roadmap) => roadmap.id !== roadmapId); const roadmaps = remaining.length ? remaining : [initialRoadmap()]; return { roadmaps, activeRoadmapId: state.activeRoadmapId === roadmapId ? roadmaps[0].id : state.activeRoadmapId, navigation: state.activeRoadmapId === roadmapId ? [] : state.navigation, selectedNodeId: null, selectedEdgeId: null } }),
  switchRoadmap: (activeRoadmapId) => set({ activeRoadmapId, navigation: [], selectedNodeId: null, selectedEdgeId: null }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setPriorityFilter: (priorityFilter) => set({ priorityFilter }),
  layoutCurrentMap: () => set((state) => commit(state, (state) => ({ saveState: 'saving', ...updateCurrent(state, (map) => ({ ...map, nodes: map.nodes.map((node, index) => ({ ...node, position: { x: 100 + (index % 4) * 260, y: 100 + Math.floor(index / 4) * 150 } })) })) }))),
  importRoadmap: (roadmap) => set((state) => commit(state, (state) => ({ roadmaps: [...state.roadmaps.filter((item) => item.id !== roadmap.id), { ...normalizeRoadmap(roadmap), updatedAt: now() }], activeRoadmapId: roadmap.id, selectedNodeId: null }))),
  undo: () => set((state) => { const previous = state.past[state.past.length - 1]; if (!previous) return state; return { ...previous, past: state.past.slice(0, -1), future: [snapshot(state), ...state.future] } }),
  redo: () => set((state) => { const next = state.future[0]; if (!next) return state; return { ...next, past: [...state.past, snapshot(state)], future: state.future.slice(1) } }),
  expandNode: (expandedNodeId) => set({ expandedNodeId }),
  navigateToNode: (navigation, nodeId, roadmapId) => set((state) => ({ activeRoadmapId: roadmapId ?? state.activeRoadmapId, navigation, selectedNodeId: nodeId, selectedEdgeId: null, searchTargetId: nodeId })),
  toggleDashboard: () => set((state) => ({ dashboardOpen: !state.dashboardOpen })),
  saveVersion: (label = 'Manual snapshot') => set((state) => ({ versions: [{ id: id('version'), label, createdAt: now(), roadmap: structuredClone(getActiveRoadmap(state)) }, ...state.versions].slice(0, 30) })),
  restoreVersion: (versionId) => set((state) => { const version = state.versions.find((item) => item.id === versionId); if (!version) return state; return commit(state, (current) => ({ roadmaps: current.roadmaps.map((roadmap) => roadmap.id === current.activeRoadmapId ? { ...version.roadmap, updatedAt: now() } : roadmap), selectedNodeId: null, selectedEdgeId: null, navigation: [] })) }),
}))

export const getActiveRoadmap = (state: RoadmapStore) => state.roadmaps.find((roadmap) => roadmap.id === state.activeRoadmapId) ?? state.roadmaps[0]
export { STORAGE_KEY }
