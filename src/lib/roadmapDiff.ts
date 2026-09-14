import type { Roadmap } from '../store/useRoadmapStore'

export type RoadmapDiff = { added: string[]; removed: string[]; changed: string[]; unchanged: string[] }

export function diffRoadmaps(original: Roadmap, current: Roadmap): RoadmapDiff {
  const originalNodes = new Map(original.nodes.map((node) => [node.data.title.trim().toLowerCase(), node]))
  const currentNodes = new Map(current.nodes.map((node) => [node.data.title.trim().toLowerCase(), node]))
  const added: string[] = []
  const removed: string[] = []
  const changed: string[] = []
  const unchanged: string[] = []
  for (const [key, node] of currentNodes) {
    const previous = originalNodes.get(key)
    if (!previous) added.push(node.data.title)
    else if (previous.data.status !== node.data.status || previous.data.priority !== node.data.priority || previous.data.dueDate !== node.data.dueDate) changed.push(node.data.title)
    else unchanged.push(node.data.title)
  }
  for (const [key, node] of originalNodes) if (!currentNodes.has(key)) removed.push(node.data.title)
  return { added, removed, changed, unchanged }
}
