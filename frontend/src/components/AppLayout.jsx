import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  BooksIcon,
  DashboardIcon,
  LogoutIcon,
  MenuIcon,
  StudentsIcon,
  SwapIcon
} from './Icons'

const navItems = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon, end: true },
  { to: '/books', label: 'Books', icon: BooksIcon },
  { to: '/students', label: 'Students', icon: StudentsIcon },
  { to: '/issues', label: 'Issue / Return', icon: SwapIcon }
]

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">
            <BooksIcon size={24} />
          </div>
          <div>
            <span className="brand-name">Library</span>
            <span className="brand-sub">Management System</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <span className="nav-label">Workspace</span>
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'nav-link-active' : ''}`
              }
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="admin-chip">
            <div className="avatar">
              {(user || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="admin-meta">
              <strong>{user || 'Administrator'}</strong>
              <span>Administrator</span>
            </div>
          </div>
          <button type="button" className="btn btn-sidebar" onClick={handleLogout}>
            <LogoutIcon size={18} />
            Logout
          </button>
          <p className="sidebar-note">
            Data comes live from the LIBRARY_MANAGEMENT MySQL database.
          </p>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="main-column">
        <header className="mobile-topbar">
          <button
            type="button"
            className="icon-button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <MenuIcon />
          </button>
          <div className="mobile-brand">
            <BooksIcon size={20} />
            <span>Library MS</span>
          </div>
        </header>
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
