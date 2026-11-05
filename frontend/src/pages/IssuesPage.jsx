import { useCallback, useEffect, useState } from 'react'
import api, { getErrorMessage } from '../api/client'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import LoadingBlock, { ErrorBanner } from '../components/Loading'
import { useToast } from '../context/ToastContext'
import { formatDate } from '../utils/format'
import {
  AlertIcon,
  ClockIcon,
  ReturnIcon,
  SearchIcon,
  SwapIcon
} from '../components/Icons'

function twoWeeksFromToday() {
  const date = new Date()
  date.setDate(date.getDate() + 14)
  return date.toISOString().slice(0, 10)
}

export default function IssuesPage() {
  const [issues, setIssues] = useState([])
  const [students, setStudents] = useState([])
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [form, setForm] = useState({ studentId: '', bookId: '' })
  const [formError, setFormError] = useState('')
  const [issuing, setIssuing] = useState(false)
  const [returnTarget, setReturnTarget] = useState(null)
  const [returning, setReturning] = useState(false)

  const [statusFilter, setStatusFilter] = useState('ALL')
  const [search, setSearch] = useState('')

  const { showToast } = useToast()

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [issuesResponse, studentsResponse, booksResponse] =
        await Promise.all([
          api.get('/issues'),
          api.get('/students'),
          api.get('/books')
        ])
      setIssues(issuesResponse.data)
      setStudents(studentsResponse.data)
      setBooks(booksResponse.data)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const availableBooks = books.filter((book) => book.availableCopies > 0)

  const handleIssue = async (event) => {
    event.preventDefault()
    setFormError('')

    if (!form.studentId || !form.bookId) {
      setFormError('Select both a student and a book with available copies.')
      return
    }

    try {
      setIssuing(true)
      const response = await api.post('/issues', {
        studentId: Number(form.studentId),
        bookId: Number(form.bookId)
      })
      showToast(
        `Book issued successfully. Due on ${formatDate(response.data.dueDate)}.`
      )
      setForm((current) => ({ ...current, bookId: '' }))
      await loadData()
    } catch (requestError) {
      setFormError(getErrorMessage(requestError))
      await loadData()
    } finally {
      setIssuing(false)
    }
  }

  const handleReturn = async () => {
    if (!returnTarget) return
    try {
      setReturning(true)
      await api.put(`/issues/${returnTarget.issueId}/return`)
      showToast(
        `"${returnTarget.bookTitle}" marked as returned. Available copies updated.`
      )
      setReturnTarget(null)
      await loadData()
    } catch (requestError) {
      showToast(getErrorMessage(requestError), 'error')
      setReturnTarget(null)
      await loadData()
    } finally {
      setReturning(false)
    }
  }

  const term = search.trim().toLowerCase()
  const filteredIssues = issues.filter((issue) => {
    const matchesStatus =
      statusFilter === 'ALL' || issue.status === statusFilter
    const matchesSearch =
      !term ||
      issue.bookTitle.toLowerCase().includes(term) ||
      issue.studentName.toLowerCase().includes(term) ||
      String(issue.issueId).includes(term)
    return matchesStatus && matchesSearch
  })

  const activeCount = issues.filter(
    (issue) => issue.status === 'ISSUED'
  ).length
  const overdueCount = issues.filter((issue) => issue.overdue).length
  const returnedCount = issues.filter(
    (issue) => issue.status === 'RETURNED'
  ).length

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Circulation desk</span>
          <h1>Issue &amp; Return</h1>
          <p className="page-subtitle">
            Issue a copy for 14 days, then return it to update availability
            automatically.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={loadData}
          disabled={loading}
        >
          Refresh
        </button>
      </header>

      <ErrorBanner message={error} onRetry={loadData} />

      <section className="issue-desk">
        <div className="panel issue-form-panel">
          <div className="panel-header">
            <div>
              <h2>Issue a book</h2>
              <p>Only books with at least one available copy are listed.</p>
            </div>
            <span className="panel-icon">
              <SwapIcon size={20} />
            </span>
          </div>

          <form onSubmit={handleIssue} noValidate>
            {formError && (
              <div className="alert alert-error" role="alert">
                {formError}
              </div>
            )}

            <label className="field">
              <span>Student</span>
              <select
                value={form.studentId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    studentId: event.target.value
                  }))
                }
              >
                <option value="">Select a student…</option>
                {students.map((student) => (
                  <option key={student.studentId} value={student.studentId}>
                    {student.name} (#{student.studentId})
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Book</span>
              <select
                value={form.bookId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    bookId: event.target.value
                  }))
                }
                disabled={availableBooks.length === 0}
              >
                <option value="">
                  {availableBooks.length === 0
                    ? 'No copies available right now'
                    : 'Select an available book…'}
                </option>
                {availableBooks.map((book) => (
                  <option key={book.bookId} value={book.bookId}>
                    {book.title} — {book.availableCopies} available
                  </option>
                ))}
              </select>
            </label>

            <div className="due-preview">
              <ClockIcon size={18} />
              <span>
                Due date preview: <strong>{formatDate(twoWeeksFromToday())}</strong>
                <small>14-day loan period, calculated by the server</small>
              </span>
            </div>

            {students.length === 0 && (
              <p className="form-note">
                Add a student first so a book can be issued.
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={
                issuing || students.length === 0 || availableBooks.length === 0
              }
            >
              {issuing ? <span className="spinner spinner-light" /> : null}
              {issuing ? 'Issuing…' : 'Issue book'}
            </button>
          </form>
        </div>

        <div className="issue-summary">
          <article className="summary-card summary-indigo">
            <span className="summary-icon">
              <SwapIcon size={20} />
            </span>
            <div>
              <strong>{activeCount}</strong>
              <span>Currently issued</span>
            </div>
          </article>
          <article className="summary-card summary-rose">
            <span className="summary-icon">
              <AlertIcon size={20} />
            </span>
            <div>
              <strong>{overdueCount}</strong>
              <span>Overdue</span>
            </div>
          </article>
          <article className="summary-card summary-teal">
            <span className="summary-icon">
              <ReturnIcon size={20} />
            </span>
            <div>
              <strong>{returnedCount}</strong>
              <span>Returned</span>
            </div>
          </article>
          <p className="summary-note">
            Availability is changed inside a database transaction, so two
            librarians cannot take the same last copy.
          </p>
        </div>
      </section>

      <div className="toolbar toolbar-wrap">
        <label className="search-input">
          <SearchIcon size={18} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by book, student or issue #…"
            aria-label="Search issue records"
          />
        </label>
        <div className="segmented" role="group" aria-label="Filter by status">
          {['ALL', 'ISSUED', 'RETURNED'].map((status) => (
            <button
              key={status}
              type="button"
              className={statusFilter === status ? 'active' : ''}
              onClick={() => setStatusFilter(status)}
            >
              {status === 'ALL'
                ? 'All'
                : status === 'ISSUED'
                  ? 'Issued'
                  : 'Returned'}
            </button>
          ))}
        </div>
        <span className="toolbar-count">
          {filteredIssues.length} record
          {filteredIssues.length === 1 ? '' : 's'}
        </span>
      </div>

      <section className="panel table-panel">
        {loading && issues.length === 0 ? (
          <LoadingBlock message="Loading issue records…" />
        ) : filteredIssues.length === 0 ? (
          <EmptyState
            icon={<SwapIcon size={28} />}
            title={
              issues.length === 0
                ? 'No books issued yet'
                : 'No records match this view'
            }
            message={
              issues.length === 0
                ? 'Use the form above to issue the first book.'
                : 'Try another search term or status filter.'
            }
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Issue</th>
                  <th>Book</th>
                  <th>Student</th>
                  <th>Issued</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th className="align-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.map((issue) => (
                  <tr key={issue.issueId}>
                    <td className="mono">#{issue.issueId}</td>
                    <td>
                      <span className="cell-title">{issue.bookTitle}</span>
                      <span className="cell-sub">
                        Book #{issue.bookId}
                      </span>
                    </td>
                    <td>
                      <span className="cell-title">{issue.studentName}</span>
                      <span className="cell-sub">
                        Student #{issue.studentId}
                      </span>
                    </td>
                    <td>{formatDate(issue.issueDate)}</td>
                    <td>
                      <span
                        className={
                          issue.overdue ? 'text-danger text-semibold' : ''
                        }
                      >
                        {formatDate(issue.dueDate)}
                      </span>
                      {issue.overdue && (
                        <span className="cell-sub text-danger">
                          {issue.overdueDays} day
                          {issue.overdueDays === 1 ? '' : 's'} late
                        </span>
                      )}
                    </td>
                    <td>
                      {issue.status === 'RETURNED' ? (
                        <>
                          <span className="badge badge-muted">Returned</span>
                          <span className="cell-sub">
                            {formatDate(issue.returnDate)}
                          </span>
                        </>
                      ) : issue.overdue ? (
                        <span className="badge badge-danger">
                          Overdue {issue.overdueDays}d
                        </span>
                      ) : (
                        <span className="badge badge-success">Issued</span>
                      )}
                    </td>
                    <td>
                      <div className="row-actions">
                        {issue.status === 'ISSUED' ? (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setReturnTarget(issue)}
                          >
                            <ReturnIcon size={16} />
                            Return
                          </button>
                        ) : (
                          <span className="muted small">Completed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {returnTarget && (
        <ConfirmDialog
          title="Return this book?"
          message={`Mark "${returnTarget.bookTitle}" issued to ${returnTarget.studentName} as returned? One available copy will be added back.`}
          confirmLabel="Return book"
          cancelLabel="Keep issued"
          busy={returning}
          onConfirm={handleReturn}
          onClose={() => setReturnTarget(null)}
        />
      )}
    </div>
  )
}
