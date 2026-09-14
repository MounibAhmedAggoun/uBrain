import { useEffect, useMemo } from 'react'
import { Background, Controls, MiniMap, ReactFlow, type Edge, type Node } from '@xyflow/react'
import { ChevronLeft } from 'lucide-react'
import { useRoadmapStore, type RoadmapNodeData } from '../../store/useRoadmapStore'
import { collectAllNodes, type CommandPaletteNode } from '../../lib/commandUtils'

const nodeTypes = { 'graph-node': GraphNodeComponent }

function GraphNodeComponent({ data }: { data: RoadmapNodeData & { level: number } }) {
  const colors = { mint: '#dff3eb', sky: '#e1eff8', amber: '#f8edcf', rose: '#f8e2e1', lavender: '#e9e5f6' }
  const statusColorMap = { 'not-started': '#a8a8a8', 'in-progress': '#d09b47', done: '#2f6f63' }
  return (
    <div
      style={{
        backgroundColor: colors[data.color],
        borderColor: statusColorMap[data.status ?? 'not-started'],
        borderWidth: '2px',
      }}
      className="roadmap-node"
    >
      <div className="node-status" style={{ background: statusColorMap[data.status ?? 'not-started'] }} />
      <div className="node-title">{data.title}</div>
    </div>
  )
}

/**
 * Simple radial layout algorithm
 * Groups nodes by nesting depth and arranges them in circular layers
 */
function radialLayout(
  nodeCount: number
): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = []
  const itemsPerLevel = Math.max(8, Math.ceil(Math.sqrt(nodeCount)))
  let currentLevel = 0
  let levelIndex = 0

  for (let i = 0; i < nodeCount; i++) {
    if (levelIndex >= itemsPerLevel) {
      levelIndex = 0
      currentLevel++
    }

    const angle = (levelIndex / itemsPerLevel) * 2 * Math.PI
    const radius = 80 + currentLevel * 120
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius

    positions.push({ x, y })
    levelIndex++
  }

  return positions
}

export function GraphView({ onClose }: { onClose: () => void }) {
  const roadmaps = useRoadmapStore((state) => state.roadmaps)
  const navigateToNode = useRoadmapStore((state) => state.navigateToNode)

  const { nodes, edges } = useMemo(() => {
    const allNodes: Node<RoadmapNodeData & { level: number }>[] = []
    const allEdges: Edge[] = []

    // Collect all node data from all roadmaps
    const allCollectedNodes: CommandPaletteNode[] = []
    for (const roadmap of roadmaps) {
      allCollectedNodes.push(...collectAllNodes(roadmap))
    }

    // Create node objects with positions
    const positions = radialLayout(allCollectedNodes.length)

    for (let i = 0; i < allCollectedNodes.length; i++) {
      const nodeData = allCollectedNodes[i]
      const pos = positions[i]

      allNodes.push({
        id: nodeData.id,
        type: 'graph-node',
        position: pos,
        data: {
          title: nodeData.title,
          notes: [],
          color: 'mint',
          status: nodeData.status,
          level: nodeData.navigation.length,
        },
      })

      // Create containment edges from parent to child
      if (nodeData.navigation.length > 0) {
        const parentId = nodeData.navigation[nodeData.navigation.length - 1]
        allEdges.push({
          id: `contain-${parentId}-${nodeData.id}`,
          source: parentId,
          target: nodeData.id,
          style: { stroke: '#c8d0ce', strokeDasharray: '5 5', strokeWidth: 1 },
          type: 'smoothstep',
        })
      }
    }

    // Add existing edges between nodes (within same roadmap level)
    for (const roadmap of roadmaps) {
      const edgeIds = new Set<string>()
      const visit = (nodes: typeof roadmap.nodes, edges: typeof roadmap.edges) => {
        for (const edge of edges) {
          if (edgeIds.has(edge.id) || !allNodes.find((n) => n.id === edge.source) || !allNodes.find((n) => n.id === edge.target)) continue
          edgeIds.add(edge.id)
          allEdges.push({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: 'smoothstep',
            style: { stroke: '#347b69', strokeWidth: 1.5 },
          })
        }
        for (const node of nodes) {
          if (node.data.childMap) visit(node.data.childMap.nodes, node.data.childMap.edges)
        }
      }
      visit(roadmap.nodes, roadmap.edges)
    }

    return { nodes: allNodes, edges: allEdges }
  }, [roadmaps])

  const handleNodeClick = (nodeId: string) => {
    const allCollected: CommandPaletteNode[] = []
    for (const roadmap of roadmaps) {
      allCollected.push(...collectAllNodes(roadmap))
    }
    const targetNode = allCollected.find((n) => n.id === nodeId)
    if (targetNode) {
      navigateToNode(targetNode.navigation, targetNode.id, targetNode.roadmapId)
      onClose()
    }
  }

  return (
    <div className="graph-view-container">
      <button className="graph-view-button" onClick={onClose}>
        <ChevronLeft size={14} /> Back to Roadmap
      </button>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => handleNodeClick(node.id)}
        fitView
        defaultViewport={{ zoom: 0.5, x: 0, y: 0 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#dbe5e1" gap={32} size={1} />
        <Controls showInteractive={false} />
        <MiniMap nodeColor="#9bc8b8" maskColor="rgba(246, 249, 248, .78)" />
      </ReactFlow>
    </div>
  )
}
