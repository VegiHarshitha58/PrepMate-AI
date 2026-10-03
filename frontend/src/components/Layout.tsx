import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  BriefcaseBusiness,
  FileText,
  Gauge,
  GraduationCap,
  Menu,
  Mic2,
  Route,
  Settings,
  User,
  X
} from 'lucide-react'
import { useEffect, useState } from 'react'

const items = [
  ['Dashboard', '/app', Gauge],
  ['My Profile', '/app/profile', User],
  ['Resume', '/app/resume', FileText],
  ['Career Domains', '/app/domains', GraduationCap],
  ['Job Matches', '/app/jobs', BriefcaseBusiness],
  ['Skill Gaps', '/app/skill-gaps', BarChart3],
  ['Roadmap', '/app/roadmap', Route],
  ['Interview', '/app/interview', Mic2],
  ['Progress', '/app/progress', BarChart3],
  ['Final Report', '/app/report', FileText],
  ['Settings', '/app/settings', Settings]
] as const

type Student = {
  student_id?: number
  name?: string
  email?: string
  college?: string
}

export default function Layout() {
  const [open, setOpen] = useState(false)
  const [student, setStudent] = useState<Student | null>(null)

  const navigate = useNavigate()

  useEffect(() => {
    const storedStudent = localStorage.getItem('student')

    if (!storedStudent) {
      navigate('/login')
      return
    }

    try {
      setStudent(JSON.parse(storedStudent))
    } catch {
      localStorage.removeItem('student')
      navigate('/login')
    }
  }, [navigate])

  const getInitials = (name?: string) => {
    if (!name?.trim()) return 'PM'

    const parts = name.trim().split(/\s+/)

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase()
    }

    return (
      parts[0][0] +
      parts[parts.length - 1][0]
    ).toUpperCase()
  }

  return (
    <div className="shell">

      <button
        className="mobile-menu"
        onClick={() => setOpen(!open)}
        aria-label="Toggle navigation"
      >
        {open ? <X /> : <Menu />}
      </button>

      <aside
        className={
          open
            ? 'sidebar open'
            : 'sidebar'
        }
      >

        <div className="brand">
          <span>PM</span>

          <div>
            <strong>PrepMate AI</strong>
            <small>Placement Mentor</small>
          </div>
        </div>

        <nav>
          {items.map(
            ([label, to, Icon]) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/app'}
                onClick={() => setOpen(false)}
              >
                <Icon size={18} />
                {label}
              </NavLink>
            )
          )}
        </nav>

      </aside>

      <main className="main">

        <header className="topbar">

          <div>
            <strong>PrepMate AI</strong>

            <small>
              AI-powered placement preparation
            </small>
          </div>

          <button
            className="avatar"
            onClick={() => navigate('/app/profile')}
            title={
              student?.name ||
              'My Profile'
            }
          >
            {getInitials(student?.name)}
          </button>

        </header>

        <div className="content">
          <Outlet />
        </div>

      </main>

    </div>
  )
}