import type { NoteBlock } from '../store/useRoadmapStore'

export type NotesPreview = { text: string; kind: 'checklist' | 'link' | 'document' }

const textFromContent = (content: unknown): string => {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content.map((item) => {
    if (!item || typeof item !== 'object') return ''
    const value = item as { text?: string; type?: string; content?: string }
    return value.text ?? value.content ?? ''
  }).join('')
}

export const getNotesPreview = (notes: NoteBlock[]): NotesPreview | null => {
  if (!notes.length) return null
  const checklist = notes.filter((block) => block.type === 'checkListItem')
  if (checklist.length) {
    const completed = checklist.filter((block) => Boolean((block.props as { checked?: boolean } | undefined)?.checked)).length
    return { text: `${completed}/${checklist.length} done`, kind: 'checklist' }
  }
  const meaningful = notes.find((block) => textFromContent(block.content).trim() || block.type === 'table')
  if (!meaningful) return null
  const text = meaningful.type === 'table' ? 'Simple table' : textFromContent(meaningful.content).trim()
  const kind = text.includes('http') || (Array.isArray(meaningful.content) && meaningful.content.some((item) => typeof item === 'object' && item !== null && (item as { type?: string }).type === 'link')) ? 'link' : 'document'
  return { text, kind }
}
