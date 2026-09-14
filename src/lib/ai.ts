import type { Roadmap } from '../store/useRoadmapStore'

export type GeneratedRoadmap = Pick<Roadmap, 'name' | 'nodes' | 'edges'>
export const aiConfigured = Boolean(import.meta.env.VITE_AI_ENDPOINT)

export async function generateRoadmapFromGoal(goal: string): Promise<GeneratedRoadmap> {
  if (!aiConfigured) throw new Error('Configure VITE_AI_ENDPOINT to generate roadmaps')
  const response = await fetch(import.meta.env.VITE_AI_ENDPOINT!, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goal }) })
  if (!response.ok) throw new Error(`AI request failed (${response.status})`)
  const result = await response.json() as GeneratedRoadmap
  if (typeof result.name !== 'string' || !Array.isArray(result.nodes) || !Array.isArray(result.edges)) throw new Error('AI returned an invalid roadmap')
  return result
}
