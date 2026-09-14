import type { Roadmap, RoadmapNodeData } from '../store/useRoadmapStore'
import { blockText } from './roadmapInsights'

export type CommandPaletteNode = {
  id: string
  title: string
  path: string[]
  navigation: string[]
  roadmapId: string
  content: string
  status: 'not-started' | 'in-progress' | 'done'
}

export type CommandPaletteRoadmap = {
  id: string
  name: string
}

export type CommandPaletteAction = {
  id: string
  name: string
  icon: string
  execute: () => void
  disabled?: boolean
}

/**
 * Fuzzy search: score how well a query matches a target string
 * Returns a score > 0 if matched, 0 if not matched
 * Higher score = better match
 */
export function fuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase()
  const t = target.toLowerCase()
  if (!q) return 1
  if (!t.includes(q)) return 0

  let score = 0
  let lastIndex = -1
  for (let i = 0; i < q.length; i++) {
    const index = t.indexOf(q[i], lastIndex + 1)
    if (index === -1) return 0
    if (lastIndex === -1) score += 10
    else score += Math.max(0, 10 - (index - lastIndex))
    lastIndex = index
  }
  return score
}

/**
 * Gather all nodes from a roadmap including all nested sub-roadmaps
 */
export function collectAllNodes(roadmap: Roadmap): CommandPaletteNode[] {
  const nodes: CommandPaletteNode[] = []
  const visit = (items: Roadmap['nodes'], path: string[], navigation: string[], seen: Set<string>) => {
    items.forEach((node) => {
      if (seen.has(node.id)) return
      const nextSeen = new Set(seen).add(node.id)
      const data = node.data as RoadmapNodeData
      const content = data.notes.map(blockText).join(' ')
      nodes.push({
        id: node.id,
        title: data.title,
        path: [...path, data.title],
        navigation,
        roadmapId: roadmap.id,
        content,
        status: data.status ?? 'not-started',
      })
      if (data.childMap) visit(data.childMap.nodes, [...path, data.title], [...navigation, node.id], nextSeen)
    })
  }
  visit(roadmap.nodes, [], [], new Set())
  return nodes
}

/**
 * Search nodes by title and content, returning scored results
 */
export function searchNodes(roadmaps: Roadmap[], query: string): Array<CommandPaletteNode & { score: number }> {
  const q = query.toLowerCase().trim()
  if (!q) return []

  const allNodes = roadmaps.flatMap(collectAllNodes)
  return allNodes
    .map((node) => {
      const titleScore = fuzzyScore(q, node.title)
      const contentScore = fuzzyScore(q, node.content)
      const score = Math.max(titleScore, contentScore * 0.5)
      return { ...node, score }
    })
    .filter((n) => n.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
}

/**
 * Search roadmaps by name, returning scored results
 */
export function searchRoadmaps(roadmaps: Roadmap[], query: string): Array<CommandPaletteRoadmap & { score: number }> {
  const q = query.toLowerCase().trim()
  if (!q) return []

  return roadmaps
    .map((roadmap) => ({
      id: roadmap.id,
      name: roadmap.name,
      score: fuzzyScore(q, roadmap.name),
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
}
