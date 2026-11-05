export default function LoadingBlock({ message = 'Loading…', compact = false }) {
  return (
    <div className={`loading-block ${compact ? 'loading-compact' : ''}`}>
      <span className="spinner" />
      <span>{message}</span>
    </div>
  )
}

export function ErrorBanner({ message, onRetry }) {
  if (!message) return null
  return (
    <div className="alert alert-error" role="alert">
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}
