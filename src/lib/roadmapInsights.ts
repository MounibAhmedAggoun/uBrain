import type { Roadmap, RoadmapNodeData, NoteBlock, NestedMap } from '../store/useRoadmapStore'
import type { Edge } from '@xyflow/react'
import { isNodeUnlocked } from '../store/useRoadmapStore'

export type SearchResult = { id: string; title: string; path: string[]; navigation: string[]; roadmap: Roadmap }

export function blockText(block: NoteBlock): string {
  const content = (block as { content?: unknown }).content
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content.map((item) => typeof item === 'object' && item !== null && 'text' in item ? String(item.text) : '').join('')
}

export function searchRoadmap(roadmap: Roadmap, term: string): SearchResult[] {
  const query = term.trim().toLowerCase()
  if (!query) return []
  const results: SearchResult[] = []
  const visit = (nodes: Roadmap['nodes'], path: string[], navigation: string[], seen: Set<string>) => {
    for (const node of nodes) {
      if (seen.has(node.id)) continue
      const nextSeen = new Set(seen).add(node.id)
      const data = node.data as RoadmapNodeData
      const content = data.notes.map(blockText).join(' ')
      if (`${data.title} ${content}`.toLowerCase().includes(query)) results.push({ id: node.id, title: data.title, path: [...path, data.title], navigation, roadmap })
      if (data.childMap) visit(data.childMap.nodes, [...path, data.title], [...navigation, node.id], nextSeen)
    }
  }
  visit(roadmap.nodes, [], [], new Set())
  return results.slice(0, 30)
}

export function collectNodes(roadmap: Roadmap) {
  const nodes: { node: Roadmap['nodes'][number]; path: string[] }[] = []
  const visit = (items: Roadmap['nodes'], path: string[], seen: Set<string>) => items.forEach((node) => { if (seen.has(node.id)) return; const nextSeen = new Set(seen).add(node.id); nodes.push({ node, path }); if (node.data.childMap) visit(node.data.childMap.nodes, [...path, node.data.title], nextSeen) })
  visit(roadmap.nodes, [], new Set())
  return nodes
}

export function checklistStats(roadmap: Roadmap) {
  return collectNodes(roadmap).reduce((stats, item) => { item.node.data.notes.forEach((block) => { if (block.type === 'checkListItem') { stats.total += 1; if (Boolean((block.props as { checked?: boolean } | undefined)?.checked)) stats.checked += 1 } }); return stats }, { total: 0, checked: 0 })
}

export function dependencyProgress(map: NestedMap) {
  const total = map.nodes.length
  const done = map.nodes.filter((node) => node.data.status === 'done').length
  const blocked = map.nodes.filter((node) => node.data.status !== 'done' && !isNodeUnlocked(map, node.id)).length
  const unlocked = map.nodes.filter((node) => node.data.status !== 'done' && isNodeUnlocked(map, node.id)).length
  const estimatedMinutes = map.nodes.reduce((sum, node) => sum + (node.data.estimatedMinutes ?? 0), 0)
  const actualMinutes = map.nodes.reduce((sum, node) => sum + (node.data.actualMinutes ?? 0), 0)
  const overdue = map.nodes.filter((node) => isOverdue(node.data.dueDate, node.data.status)).length
  return { total, done, blocked, unlocked, overdue, estimatedMinutes, actualMinutes, percent: total ? Math.round(done / total * 100) : 0 }
}

export function nextNodes(map: NestedMap) {
  return map.nodes.filter((node) => node.data.status !== 'done' && isNodeUnlocked(map, node.id)).slice(0, 5)
}

export function blockedBy(map: NestedMap, nodeId: string) {
  return map.edges.filter((edge) => edge.target === nodeId && ((edge.data as { kind?: string } | undefined)?.kind ?? 'required') === 'required').map((edge) => map.nodes.find((node) => node.id === edge.source)).filter((node): node is NestedMap['nodes'][number] => node !== undefined && node.data.status !== 'done')
}

export function isOverdue(dueDate?: string, status?: string) {
  return Boolean(dueDate && status !== 'done' && dueDate < new Date().toISOString().slice(0, 10))
}

export function dependencyEdges(edges: Edge[]) {
  return edges.filter((edge) => ((edge.data as { kind?: string } | undefined)?.kind ?? 'required') === 'required')
}
