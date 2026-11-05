export default function Pagination({
  page,
  pageSize = 10,
  totalPages,
  totalElements,
  onPageChange,
  itemLabel = 'items'
}) {
  if (!totalElements) return null

  const from = page * pageSize + 1
  const to = Math.min(totalElements, (page + 1) * pageSize)

  return (
    <div className="pagination">
      <span className="pagination-info">
        {from}–{to} of {totalElements} {itemLabel}
      </span>
      <div className="pagination-controls">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 0}
        >
          Previous
        </button>
        <span className="pagination-page">
          Page {Math.min(page + 1, Math.max(totalPages, 1))} of{' '}
          {Math.max(totalPages, 1)}
        </span>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page + 1 >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  )
}
