import { BooksIcon } from './Icons'

export default function EmptyState({
  icon,
  title = 'Nothing here yet',
  message,
  action
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon || <BooksIcon size={28} />}</div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action}
    </div>
  )
}
