import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { getErrorMessage } from '../api/client'
import { formatDate } from '../utils/format'
import LoadingBlock, { ErrorBanner } from '../components/Loading'
import {
  ArrowRightIcon,
  BooksIcon,
  CheckIcon,
  ClockIcon,
  StudentsIcon,
  SwapIcon
} from '../components/Icons'

function StatCard({ tone, icon, label, value, hint }) {
  return (
    <article className={`stat-card stat-${tone}`}>
      <div className="stat-top">
        <span className="stat-icon">{icon}</span>
        <span className="stat-label">{label}</span>
      </div>
      <strong className="stat-value">{value}</strong>
      {hint && <span className="stat-hint">{hint}</span>}
    </article>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [statsResponse, recentResponse] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/recent', { params: { limit: 8 } })
      ])
      setStats(statsResponse.data)
      setRecent(recentResponse.data)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Overview</span>
          <h1>{greeting}, librarian</h1>
          <p className="page-subtitle">
            A live snapshot of your library, straight from MySQL.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={loadDashboard}
          disabled={loading}
        >
          Refresh
        </button>
      </header>

      <ErrorBanner message={error} onRetry={loadDashboard} />

      {loading && !stats ? (
        <LoadingBlock message="Loading dashboard…" />
      ) : (
        <>
          <section className="stats-grid" aria-label="Library statistics">
            <StatCard
              tone="indigo"
              icon={<BooksIcon size={22} />}
              label="Book titles"
              value={stats?.totalTitles ?? 0}
              hint={`${stats?.totalCopies ?? 0} physical copies`}
            />
            <StatCard
              tone="teal"
              icon={<CheckIcon size={22} />}
              label="Available copies"
              value={stats?.availableCopies ?? 0}
              hint="Ready to be issued"
            />
            <StatCard
              tone="blue"
              icon={<StudentsIcon size={22} />}
              label="Students"
              value={stats?.totalStudents ?? 0}
              hint="Registered borrowers"
            />
            <StatCard
              tone="amber"
              icon={<SwapIcon size={22} />}
              label="Currently issued"
              value={stats?.issuedBooks ?? 0}
              hint="Not yet returned"
            />
            <StatCard
              tone="rose"
              icon={<ClockIcon size={22} />}
              label="Overdue"
              value={stats?.overdueBooks ?? 0}
              hint="Past their due date"
            />
          </section>

          <section className="dashboard-grid">
            <div className="panel">
              <div className="panel-header">
                <div>
                  <h2>Recent activity</h2>
                  <p>Latest issues and returns</p>
                </div>
                <Link to="/issues" className="text-link">
                  View all <ArrowRightIcon size={16} />
                </Link>
              </div>

              {recent.length === 0 ? (
                <div className="empty-state compact">
                  <h3>No activity yet</h3>
                  <p>Issue your first book to see it appear here.</p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Book</th>
                        <th>Student</th>
                        <th>Due</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((issue) => (
                        <tr key={issue.issueId}>
                          <td>
                            <span className="cell-title">{issue.bookTitle}</span>
                            <span className="cell-sub">
                              #{issue.issueId} · {formatDate(issue.issueDate)}
                            </span>
                          </td>
                          <td>{issue.studentName}</td>
                          <td>{formatDate(issue.dueDate)}</td>
                          <td>
                            {issue.status === 'RETURNED' ? (
                              <span className="badge badge-muted">Returned</span>
                            ) : issue.overdue ? (
                              <span className="badge badge-danger">
                                Overdue {issue.overdueDays}d
                              </span>
                            ) : (
                              <span className="badge badge-success">Issued</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="panel quick-panel">
              <div className="panel-header">
                <div>
                  <h2>Quick actions</h2>
                  <p>Jump straight to daily work</p>
                </div>
              </div>
              <div className="quick-links">
                <Link to="/books" className="quick-link">
                  <span className="quick-icon quick-indigo">
                    <BooksIcon size={20} />
                  </span>
                  <span>
                    <strong>Manage books</strong>
                    <small>Add, edit, search copies</small>
                  </span>
                  <ArrowRightIcon size={18} />
                </Link>
                <Link to="/students" className="quick-link">
                  <span className="quick-icon quick-teal">
                    <StudentsIcon size={20} />
                  </span>
                  <span>
                    <strong>Manage students</strong>
                    <small>Borrower records</small>
                  </span>
                  <ArrowRightIcon size={18} />
                </Link>
                <Link to="/issues" className="quick-link">
                  <span className="quick-icon quick-amber">
                    <SwapIcon size={20} />
                  </span>
                  <span>
                    <strong>Issue or return</strong>
                    <small>Track due dates</small>
                  </span>
                  <ArrowRightIcon size={18} />
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
