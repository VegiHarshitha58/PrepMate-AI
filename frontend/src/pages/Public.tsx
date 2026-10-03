import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BrainCircuit,
  BriefcaseBusiness,
  FileSearch,
  Map,
  Mic2,
  Sparkles
} from 'lucide-react'
import { api } from '../services/api'

const features = [
  [FileSearch, 'Resume Analysis'],
  [BrainCircuit, 'Career Recommendations'],
  [BriefcaseBusiness, 'Job Matching'],
  [Map, 'Learning Roadmap'],
  [Mic2, 'Mock Interviews'],
  [Sparkles, 'Placement Readiness']
] as const

export function Landing() {
  return (
    <div className="landing">
      <nav className="public-nav">
        <div className="brand">
          <span>PM</span>
          <strong>PrepMate AI</strong>
        </div>

        <div>
          <Link to="/login">Login</Link>

          <Link
            className="btn primary"
            to="/register"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <section className="hero">
        <div className="eyebrow">
          MULTI-AGENT AI PLACEMENT ASSISTANT
        </div>

        <h1>
          Understand your skills.
          <br />
          Find your direction.
          <br />
          <em>Prepare for your future.</em>
        </h1>

        <p>
          One workspace to analyze your profile, discover career
          paths, close skill gaps and prepare confidently for
          placements.
        </p>

        <div className="hero-actions">
          <Link
            className="btn primary"
            to="/register"
          >
            Get Started
            <ArrowRight size={17} />
          </Link>

          <Link
            className="btn secondary"
            to="/login"
          >
            Login
          </Link>
        </div>
      </section>

      <section className="feature-grid">
        {features.map(([Icon, label]) => (
          <div
            className="feature"
            key={label}
          >
            <Icon />
            <h3>{label}</h3>

            <p>
              Personalized, structured guidance powered by your
              profile and goals.
            </p>
          </div>
        ))}
      </section>

      <section className="journey">
        <h2>Your placement journey, connected.</h2>

        <p>
          Profile → Resume → Career → Jobs → Skill Gaps → Roadmap
          → Interview → Readiness
        </p>
      </section>
    </div>
  )
}

export function Login() {
  return (
    <Auth
      title="Welcome back"
      subtitle="Continue your placement preparation."
      button="Login"
    />
  )
}

export function Register() {
  return (
    <Auth
      title="Create your account"
      subtitle="Start building your placement-ready profile."
      button="Create Account"
      register
    />
  )
}

type AuthProps = {
  title: string
  subtitle: string
  button: string
  register?: boolean
}

type AuthResponse = {
  student_id?: number
  id?: number
  name?: string
  email?: string
  college?: string
  branch?: string
  cgpa?: string
}

function Auth({
  title,
  subtitle,
  button,
  register = false
}: AuthProps) {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [college, setCollege] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (register) {
        await api.register({
          name: name.trim(),
          college: college.trim(),
          email: email.trim(),
          password
        })

        setSuccess(
          'Account created successfully! Redirecting to login...'
        )

        setTimeout(() => {
          navigate('/login')
        }, 1000)

        return
      }

      const data =
        await api.login({
          email: email.trim(),
          password
        }) as AuthResponse

      const studentId =
        data.student_id ?? data.id

      if (!studentId) {
        throw new Error(
          'Login succeeded but student information was not returned.'
        )
      }

      localStorage.setItem(
        'student',
        JSON.stringify({
          ...data,
          student_id: studentId
        })
      )

      navigate('/app')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth">
      <div className="auth-card">
        <Link
          to="/"
          className="brand center"
        >
          <span>PM</span>
          <strong>PrepMate AI</strong>
        </Link>

        <h1>{title}</h1>

        <p>{subtitle}</p>

        <form onSubmit={handleSubmit}>
          {register && (
            <>
              <label>
                Full Name

                <input
                  value={name}
                  onChange={event =>
                    setName(event.target.value)
                  }
                  placeholder="Your name"
                  required
                  minLength={2}
                />
              </label>

              <label>
                College

                <input
                  value={college}
                  onChange={event =>
                    setCollege(event.target.value)
                  }
                  placeholder="College name"
                  required
                  minLength={2}
                />
              </label>
            </>
          )}

          <label>
            Email

            <input
              type="email"
              value={email}
              onChange={event =>
                setEmail(event.target.value)
              }
              placeholder="student@example.com"
              required
            />
          </label>

          <label>
            Password

            <input
              type="password"
              value={password}
              onChange={event =>
                setPassword(event.target.value)
              }
              placeholder="••••••••"
              required
              minLength={6}
            />
          </label>

          {error && (
            <p className="notice">
              {error}
            </p>
          )}

          {success && (
            <p className="notice">
              {success}
            </p>
          )}

          <button
            type="submit"
            className="btn primary wide"
            disabled={loading}
          >
            {loading
              ? 'Please wait...'
              : button}
          </button>
        </form>

        <small>
          {register
            ? 'Your account information will be securely stored.'
            : 'Login using your registered account.'}
        </small>
      </div>
    </div>
  )
}