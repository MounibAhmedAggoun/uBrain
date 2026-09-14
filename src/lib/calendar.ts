import type { Roadmap } from '../store/useRoadmapStore'

const escapeText = (value: string) => value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
const dateStamp = (date: string) => date.replace(/-/g, '')

export function roadmapIcs(roadmap: Roadmap) {
  const events = roadmap.nodes.filter((node) => node.data.dueDate).map((node) => {
    const date = dateStamp(node.data.dueDate!)
    return ['BEGIN:VEVENT', `UID:${node.id}@ubrain`, `DTSTART;VALUE=DATE:${date}`, `SUMMARY:${escapeText(node.data.title)}`, `DESCRIPTION:${escapeText(`${node.data.status} · ${node.data.priority ?? 'medium'} priority${node.data.owner ? ` · ${node.data.owner}` : ''}`)}`, 'END:VEVENT'].join('\r\n')
  })
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//uBrain//Roadmap//EN', 'CALSCALE:GREGORIAN', ...events, 'END:VCALENDAR', ''].join('\r\n')
}
