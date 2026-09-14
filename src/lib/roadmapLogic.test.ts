import { describe, expect, it } from 'vitest'
import { roadmapIcs } from './calendar'
import { diffRoadmaps } from './roadmapDiff'
import { dependencyProgress, isOverdue, nextNodes } from './roadmapInsights'
import { isNodeUnlocked, type NestedMap, type Roadmap } from '../store/useRoadmapStore'

const node = (id: string, title: string, status: 'not-started' | 'in-progress' | 'done' = 'not-started', dueDate?: string) => ({ id, type: 'roadmap', position: { x: 0, y: 0 }, data: { title, notes: [], color: 'mint' as const, status, priority: 'medium' as const, dueDate } })
const map = (): NestedMap => ({ nodes: [node('a', 'Foundations', 'done'), node('b', 'API')], edges: [{ id: 'e', source: 'a', target: 'b', data: { kind: 'required' } }] })
const roadmap = (nodes: NestedMap['nodes']): Roadmap => ({ id: 'roadmap-test', name: 'Test roadmap', nodes, edges: [], updatedAt: '2026-01-01T00:00:00.000Z' })

describe('roadmap dependency logic', () => {
  it('unlocks nodes after required prerequisites are done', () => {
    expect(isNodeUnlocked(map(), 'b')).toBe(true)
    const blocked: NestedMap = { ...map(), nodes: [node('a', 'Foundations'), node('b', 'API')] }
    expect(isNodeUnlocked(blocked, 'b')).toBe(false)
    expect(nextNodes(blocked).map((item) => item.id)).toEqual(['a'])
  })

  it('reports dependency progress and effort totals', () => {
    const current = map()
    current.nodes[0].data.estimatedMinutes = 120
    current.nodes[0].data.actualMinutes = 60
    expect(dependencyProgress(current)).toMatchObject({ total: 2, done: 1, unlocked: 1, estimatedMinutes: 120, actualMinutes: 60 })
  })

  it('detects overdue incomplete milestones', () => {
    expect(isOverdue('2020-01-01', 'in-progress')).toBe(true)
    expect(isOverdue('2020-01-01', 'done')).toBe(false)
  })
})

describe('roadmap exports and diffs', () => {
  it('creates calendar events for dated nodes', () => {
    const result = roadmapIcs(roadmap([node('a', 'Ship API', 'in-progress', '2026-09-20')]))
    expect(result).toContain('BEGIN:VCALENDAR')
    expect(result).toContain('DTSTART;VALUE=DATE:20260920')
    expect(result).toContain('SUMMARY:Ship API')
  })

  it('classifies changed and added milestones', () => {
    const original = roadmap([node('a', 'API')])
    const current = roadmap([node('a', 'API', 'done'), node('b', 'Deploy')])
    expect(diffRoadmaps(original, current)).toMatchObject({ added: ['Deploy'], changed: ['API'] })
  })
})
