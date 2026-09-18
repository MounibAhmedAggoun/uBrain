import type { Roadmap } from '../store/useRoadmapStore'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const cloudConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
export const supabase: SupabaseClient | null = cloudConfigured ? createClient(import.meta.env.VITE_SUPABASE_URL!, import.meta.env.VITE_SUPABASE_ANON_KEY!) : null
const endpoint = () => `${import.meta.env.VITE_SUPABASE_URL ?? ''}/rest/v1`
const headers = async () => { const key = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''; const session = await supabase?.auth.getSession(); return { apikey: key, Authorization: `Bearer ${session?.data.session?.access_token ?? key}`, 'Content-Type': 'application/json' } }

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  if (!cloudConfigured) throw new Error('Supabase is not configured')
  const response = await fetch(`${endpoint()}${path}`, { ...init, headers: { ...(await headers()), ...(init?.headers ?? {}) } })
  if (!response.ok) throw new Error(`Cloud request failed (${response.status})`)
  return response.json() as Promise<T>
}

export async function publishRoadmap(roadmap: Roadmap, slug: string) {
  if (!supabase) throw new Error('Supabase is not configured')
  const session = await supabase.auth.getSession()
  const ownerId = session.data.session?.user.id
  if (!ownerId) throw new Error('Sign in to publish a roadmap')
  const saved = await supabase.from('roadmaps').upsert({ id: roadmap.id, owner_id: ownerId, name: roadmap.name, payload: roadmap, updated_at: new Date().toISOString() }, { onConflict: 'id' })
  if (saved.error) throw saved.error
  const rows = await request<{ slug: string }[]>('/roadmap_shares?on_conflict=roadmap_id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify({ roadmap_id: roadmap.id, slug, published_payload: roadmap }) })
  return rows[0]
}

export async function loadPublishedRoadmap(slug: string) {
  const rows = await request<{ published_payload: Roadmap }[]>(`/roadmap_shares?select=published_payload&slug=eq.${encodeURIComponent(slug)}&limit=1`)
  return rows[0]?.published_payload ?? null
}

export async function addRoadmapComment(roadmapId: string, nodeId: string | undefined, body: string) {
  return request('/roadmap_comments', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ roadmap_id: roadmapId, node_id: nodeId, body }) })
}

export async function signIn(email: string, password: string) {
  if (!supabase) throw new Error('Supabase is not configured')
  const result = await supabase.auth.signInWithPassword({ email, password })
  if (result.error) throw result.error
  return result.data.user
}

export async function signUp(email: string, password: string) {
  if (!supabase) throw new Error('Supabase is not configured')
  const result = await supabase.auth.signUp({ email, password })
  if (result.error) throw result.error
  return result.data.user
}

export async function signOut() {
  if (!supabase) return
  const result = await supabase.auth.signOut()
  if (result.error) throw result.error
}

export async function forkPublishedRoadmap(sourceId: string, roadmap: Roadmap) {
  if (!supabase) throw new Error('Supabase is not configured')
  const session = await supabase.auth.getSession()
  const ownerId = session.data.session?.user.id
  if (!ownerId) throw new Error('Sign in to fork a roadmap')
  const forked = { ...roadmap, id: crypto.randomUUID(), name: `${roadmap.name} (fork)` }
  const created = await supabase.from('roadmaps').insert({ id: forked.id, owner_id: ownerId, name: forked.name, payload: forked, updated_at: new Date().toISOString() }).select('id').single()
  if (created.error) throw created.error
  const relation = await supabase.from('roadmap_forks').insert({ source_roadmap_id: sourceId, forked_roadmap_id: forked.id })
  if (relation.error) throw relation.error
  return forked
}

export async function loadPublishedComments(roadmapId: string) {
  return request<{ id: string; node_id?: string; body: string; created_at: string }[]>(`/roadmap_comments?select=id,node_id,body,created_at&roadmap_id=eq.${encodeURIComponent(roadmapId)}&order=created_at.asc`)
}

export async function saveCloudRoadmap(roadmap: Roadmap) {
  if (!supabase) throw new Error('Supabase is not configured')
  const session = await supabase.auth.getSession()
  const ownerId = session.data.session?.user.id
  if (!ownerId) throw new Error('Sign in to sync roadmaps')
  const updatedAt = new Date().toISOString()
  const result = await supabase.from('roadmaps').upsert({ id: roadmap.id, owner_id: ownerId, name: roadmap.name, payload: roadmap, updated_at: updatedAt }, { onConflict: 'id' })
  if (result.error) throw result.error
  return updatedAt
}

export async function loadCloudRoadmap(roadmapId: string) {
  if (!supabase) throw new Error('Supabase is not configured')
  const result = await supabase.from('roadmaps').select('payload, updated_at').eq('id', roadmapId).single()
  if (result.error) throw result.error
  return { roadmap: result.data.payload as Roadmap, updatedAt: result.data.updated_at as string }
}

export function subscribeToRoadmap(roadmapId: string, onChange: (roadmap: Roadmap, updatedAt: string) => void) {
  if (!supabase) return () => undefined
  const channel = supabase.channel(`roadmap:${roadmapId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'roadmaps', filter: `id=eq.${roadmapId}` }, (payload) => { const row = payload.new as { payload?: Roadmap; updated_at?: string }; if (row.payload && row.updated_at) onChange(row.payload, row.updated_at) }).subscribe()
  return () => { void supabase.removeChannel(channel) }
}