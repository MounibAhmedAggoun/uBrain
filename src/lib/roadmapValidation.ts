import type { Roadmap } from '../store/useRoadmapStore'

const edgeKinds = new Set(['required', 'optional', 'related', 'alternative'])
const nodeColors = new Set(['mint', 'sky', 'amber', 'rose', 'lavender'])
const nodeStatuses = new Set(['not-started', 'in-progress', 'done'])

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const isNode = (value: unknown): boolean => {
  if (!isRecord(value) || typeof value.id !== 'string' || !isRecord(value.data)) return false
  if (typeof value.data.title !== 'string' || !nodeColors.has(String(value.data.color)) || !nodeStatuses.has(String(value.data.status))) return false
  if (value.data.priority !== undefined && !['low', 'medium', 'high', 'urgent'].includes(String(value.data.priority))) return false
  if (!Array.isArray(value.data.notes)) return false
  if (value.data.childMap === undefined) return true
  return isMap(value.data.childMap)
}

const isMap = (value: unknown): boolean => isRecord(value) && Array.isArray(value.nodes) && Array.isArray(value.edges) && value.nodes.every(isNode)

export const isRoadmap = (value: unknown): value is Roadmap => {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string' || !Array.isArray(value.nodes) || !Array.isArray(value.edges)) return false
  if (typeof value.updatedAt !== 'string' || !value.nodes.every(isNode)) return false
  return value.edges.every((edge) => isRecord(edge) && typeof edge.id === 'string' && typeof edge.source === 'string' && typeof edge.target === 'string' && (edge.data === undefined || !isRecord(edge.data) || edge.data.kind === undefined || edgeKinds.has(String(edge.data.kind))))
}

export const isStoredRoadmaps = (value: unknown): value is { roadmaps: Roadmap[]; activeRoadmapId?: string } => isRecord(value) && Array.isArray(value.roadmaps) && value.roadmaps.length > 0 && value.roadmaps.every(isRoadmap)
