import { useEffect, useState } from 'react'
import { CalendarDays, CheckCircle2, GitFork, LockKeyhole, MessageCircle } from 'lucide-react'
import { addRoadmapComment, forkPublishedRoadmap, loadPublishedComments, loadPublishedRoadmap, supabase } from '../../lib/cloud'
import { isOverdue } from '../../lib/roadmapInsights'
import { collectNodes } from '../../lib/roadmapInsights'
import { useRoadmapStore, type Roadmap } from '../../store/useRoadmapStore'

export function PublicRoadmapView({ slug }: { slug: string }) {
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [comments, setComments] = useState<{ id: string; node_id?: string; body: string; created_at: string }[]>([])
  const [comment, setComment] = useState('')
  const [forking, setForking] = useState(false)
  useEffect(() => { loadPublishedRoadmap(slug).then((value) => { setRoadmap(value); if (value) return loadPublishedComments(value.id).then(setComments) }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load roadmap')) }, [slug])
  if (error) return <main className="public-roadmap"><h1>Roadmap unavailable</h1><p>{error}</p></main>
  if (!roadmap) return <main className="public-roadmap"><p>Loading roadmap...</p></main>
  const nodes = collectNodes(roadmap).map((item) => item.node)
  const done = nodes.filter((node) => node.data.status === 'done').length
  const submitComment = async () => { if (!comment.trim() || !supabase) return; try { await addRoadmapComment(roadmap.id, undefined, comment.trim()); setComments(await loadPublishedComments(roadmap.id)); setComment('') } catch { setError('Sign in to comment on this roadmap') } }
  const fork = async () => { setForking(true); try { const copy = await forkPublishedRoadmap(roadmap.id, roadmap); useRoadmapStore.getState().importRoadmap(copy); setNotice('Roadmap forked into your local workspace') } catch (reason: unknown) { setNotice(reason instanceof Error ? reason.message : 'Unable to fork roadmap') } finally { setForking(false) } }
  return <main className="public-roadmap"><header className="public-head"><div><span className="eyebrow">Published roadmap</span><h1>{roadmap.name}</h1><p>{done} of {nodes.length} milestones complete</p></div><div className="public-progress"><strong>{nodes.length ? Math.round(done / nodes.length * 100) : 0}%</strong><span>complete</span></div><button className="button secondary" onClick={fork} disabled={forking}><GitFork size={15} /> {forking ? 'Forking...' : 'Fork roadmap'}</button></header>{notice && <div className="public-notice" role="status">{notice}</div>}<section className="public-list">{nodes.map((node) => <article className={`public-node ${node.data.status === 'done' ? 'complete' : ''}`} key={node.id}><div>{node.data.status === 'done' ? <CheckCircle2 size={18} /> : node.data.dueDate ? <CalendarDays size={18} /> : <LockKeyhole size={18} />}<strong>{node.data.icon} {node.data.title}</strong></div>{node.data.dueDate && <time className={isOverdue(node.data.dueDate, node.data.status) ? 'overdue-text' : ''}>{node.data.dueDate}</time>}</article>)}</section><section className="public-comments"><h2><MessageCircle size={17} /> Discussion</h2>{comments.map((item) => <p key={item.id}>{item.body}</p>)}<textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add a comment..." /><button className="button primary" onClick={submitComment}>Post comment</button></section></main>
}
