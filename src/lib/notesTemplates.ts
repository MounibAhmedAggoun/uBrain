import type { PartialBlock } from '@blocknote/core'

export type NotesTemplate = {
  label: string
  blocks: PartialBlock[]
}

const checklist = (text = ''): PartialBlock => ({ type: 'checkListItem', props: { checked: false }, content: text })
const paragraph = (text: string): PartialBlock => ({ type: 'paragraph', content: text })
const bullet = (text: string): PartialBlock => ({ type: 'bulletListItem', content: text })

export const noteTemplates: NotesTemplate[] = [
  { label: 'To-Do List', blocks: [checklist(), checklist(), checklist()] },
  { label: 'Resource Links', blocks: [bullet('[Resource link]'), bullet('[Documentation link]'), bullet('[Reference link]')] },
  { label: 'Checklist + Notes', blocks: [paragraph('Checklist'), checklist(), checklist(), checklist(), paragraph('---'), paragraph('Notes')] },
  {
    label: 'Simple Table',
    blocks: [{
      type: 'table',
      content: {
        type: 'tableContent',
        headerRows: 1,
        columnWidths: [240, 160],
        rows: [
          { cells: [['Task'], ['Status']] },
          { cells: [[''], ['']] },
        ],
      },
    }],
  },
]
