import { del, get, set } from 'idb-keyval'

export const STORAGE_KEY = 'roadmapbuilder-data'

type StoredRoadmaps = { roadmaps: unknown[]; activeRoadmapId?: string }

export async function loadRoadmapData(): Promise<StoredRoadmaps | null> {
  const indexed = await get<StoredRoadmaps>(STORAGE_KEY)
  if (indexed?.roadmaps?.length) return indexed
  const legacy = localStorage.getItem(STORAGE_KEY)
  if (!legacy) return null
  try {
    const parsed = JSON.parse(legacy) as StoredRoadmaps
    if (!parsed.roadmaps?.length) return null
    await set(STORAGE_KEY, parsed)
    localStorage.removeItem(STORAGE_KEY)
    return parsed
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export async function saveRoadmapData(data: StoredRoadmaps) {
  await set(STORAGE_KEY, data)
}

export async function clearRoadmapData() {
  await del(STORAGE_KEY)
}
