import { Component, type ErrorInfo, type ReactNode } from 'react'
import { get } from 'idb-keyval'
import { STORAGE_KEY, clearRoadmapData } from '../lib/storage'

type Props = {
  children: ReactNode
  /** Short label shown in the fallback, e.g. "notes panel" or "canvas". Defaults to "app". */
  label?: string
}

type State = {
  hasError: boolean
  error: Error | null
}

async function downloadBackup() {
  try {
    const data = await get(STORAGE_KEY)
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ubrain-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  } catch {
    // If even the backup fails, there's nothing more we can safely do client-side.
  }
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('uBrain crashed:', error, info.componentStack)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleExportAndReset = async () => {
    await downloadBackup()
    await clearRoadmapData()
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const label = this.props.label ?? 'app'

    return (
      <div
        role="alert"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          minHeight: '100%',
          padding: 32,
          textAlign: 'center',
          background: 'var(--bg)',
          color: 'var(--text)',
        }}
      >
        <h2 style={{ margin: 0 }}>Something went wrong in the {label}</h2>
        <p style={{ margin: 0, maxWidth: 420, color: 'var(--text-soft)' }}>
          uBrain hit an unexpected error and stopped this part of the app so the rest keeps working.
          Reloading usually fixes it. Your saved roadmaps are still on this device.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="button primary" onClick={this.handleReload}>
            Reload
          </button>
          <button className="button secondary" onClick={this.handleExportAndReset}>
            Export my data &amp; reset
          </button>
        </div>
        {this.state.error && (
          <details style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 12 }}>
            <summary>Technical details</summary>
            <pre style={{ whiteSpace: 'pre-wrap', textAlign: 'left', maxWidth: 480 }}>
              {this.state.error.message}
            </pre>
          </details>
        )}
      </div>
    )
  }
}