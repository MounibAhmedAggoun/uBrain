import { useCallback, useEffect, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { Background, Controls, MiniMap, ReactFlow, useReactFlow, type Connection, type Edge, type Node, type NodeChange, type EdgeChange, type OnSelectionChangeParams } from '@xyflow/react'
import { useRoadmapStore, getCurrentMap, type RoadmapNodeData } from '../store/useRoadmapStore'
import { RoadmapNode } from './RoadmapNode'

const nodeTypes = { roadmap: RoadmapNode }

function CanvasEvents() {
  const roadmap = useRoadmapStore(useShallow((state) => getCurrentMap(state)))
  const addNode = useRoadmapStore((state) => state.addNode)
  const { screenToFlowPosition } = useReactFlow()
  const canvasRef = useRef<HTMLDivElement>(null)
  const onContextMenu = (event: React.MouseEvent) => { event.preventDefault(); const bounds = canvasRef.current?.getBoundingClientRect(); if (bounds) addNode(screenToFlowPosition({ x: event.clientX, y: event.clientY })) }

  if (!roadmap.nodes.length) {
    return <div className="flow-wrap"><div className="empty-roadmap"><div className="empty-roadmap-card"><p className="eyebrow">Start here</p><h3>Build your first milestone</h3><p>Drop your first idea onto the canvas and connect the rest as you go.</p><button className="button primary" onClick={() => addNode({ x: 260, y: 200 })}>+ Add your first node</button></div></div></div>
  }

  return <div ref={canvasRef} className="flow-wrap" onContextMenu={onContextMenu}><ReactFlowCanvas /></div>
}

function ReactFlowCanvas() {
  const roadmap = useRoadmapStore(useShallow((state) => getCurrentMap(state)))
  const statusFilter = useRoadmapStore((state) => state.statusFilter)
  const priorityFilter = useRoadmapStore((state) => state.priorityFilter)
  const searchTargetId = useRoadmapStore((state) => state.searchTargetId)
  const { setCenter } = useReactFlow()
  const updatePosition = useRoadmapStore((state) => state.updateNodePosition)
  const removeElements = useRoadmapStore((state) => state.removeElements)
  const updateEdgeSelection = useRoadmapStore((state) => state.updateEdgeSelection)
  const addConnection = useRoadmapStore((state) => state.addConnection)
  const selectNode = useRoadmapStore((state) => state.selectNode)
  const undo = useRoadmapStore((state) => state.undo)
  const redo = useRoadmapStore((state) => state.redo)
  const onConnect = useCallback((connection: Connection) => addConnection(connection), [addConnection])
  const onNodesChange = useCallback((changes: NodeChange<Node<RoadmapNodeData>>[]) => { changes.forEach((change) => { if (change.type === 'position' && change.position && !change.dragging) updatePosition(change.id, change.position) }) }, [updatePosition])
  const onSelectionChange = useCallback(({ nodes }: OnSelectionChangeParams) => { if (nodes[0]) selectNode(nodes[0].id) }, [selectNode])
  const onEdgesChange = useCallback((changes: EdgeChange<Edge>[]) => { changes.forEach((change) => { if (change.type === 'select') updateEdgeSelection(change.selected ? change.id : null) }) }, [updateEdgeSelection])
  useEffect(() => { const target = roadmap.nodes.find((node) => node.id === searchTargetId); if (!target) return; setCenter(target.position.x + 80, target.position.y + 40, { zoom: 1.1, duration: 450 }); const timer = window.setTimeout(() => useRoadmapStore.setState({ searchTargetId: null }), 1600); return () => window.clearTimeout(timer) }, [roadmap.nodes, searchTargetId, setCenter])
  useEffect(() => { const handleKeyDown = (event: KeyboardEvent) => { const target = event.target as HTMLElement | null; const isTyping = target?.isContentEditable || target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.tagName === 'SELECT'; if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !isTyping) { event.preventDefault(); event.shiftKey ? redo() : undo(); return } if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y' && !isTyping) { event.preventDefault(); redo(); return } if ((event.key === 'Backspace' || event.key === 'Delete') && !isTyping) { const state = useRoadmapStore.getState(); const current = getCurrentMap(state); const nodeIds = state.selectedNodeId ? [state.selectedNodeId] : []; removeElements(nodeIds, state.selectedEdgeId ? [state.selectedEdgeId] : current.edges.filter((edge) => edge.selected).map((edge) => edge.id)) } }; window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown) }, [redo, undo, removeElements])

  const visibleNodes = roadmap.nodes.filter((node) => (statusFilter === 'all' || node.data.status === statusFilter) && (priorityFilter === 'all' || (node.data.priority ?? 'medium') === priorityFilter))
  const visibleIds = new Set(visibleNodes.map((node) => node.id))
  const visibleEdges = roadmap.edges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target))
  useEffect(() => { if (useRoadmapStore.getState().selectedNodeId && !visibleIds.has(useRoadmapStore.getState().selectedNodeId!)) selectNode(null) }, [selectNode, statusFilter, priorityFilter, roadmap.nodes])
  return <ReactFlow<Node<RoadmapNodeData>, Edge> nodes={visibleNodes} edges={visibleEdges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onSelectionChange={onSelectionChange} onPaneClick={() => selectNode(null)} fitView={false} deleteKeyCode={null} proOptions={{ hideAttribution: true }}><Background color="#dbe5e1" gap={24} size={1} /><Controls showInteractive={false} /><MiniMap nodeColor="#9bc8b8" maskColor="rgba(246, 249, 248, .78)" /></ReactFlow>
}

export function Canvas() { return <CanvasEvents /> }
