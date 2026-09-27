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

export function Landing() {
  const features = [
    [FileSearch, 'Resume Analysis'],
    [BrainCircuit, 'Career Recommendations'],
    [BriefcaseBusiness, 'Job Matching'],
    [Map, 'Learning Roadmap'],
    [Mic2, 'Mock Interviews'],
    [Sparkles, 'Placement Readiness']
  ]

  return (
    <div className="landing">

      <nav className="public-nav">
        <div className="brand">
          <span>PM</span>
          <strong>PrepMate AI</strong>
        </div>

        <div>
          <Link to="/login">Login</Link>
          <Link className="btn primary" to="/register">
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
          <Link className="btn primary" to="/register">
            Get Started <ArrowRight size={17} />
          </Link>

          <Link className="btn secondary" to="/login">
            Login
          </Link>
        </div>
      </section>

      <section className="feature-grid">
        {features.map(([Icon, label]: any) => (
          <div className="feature" key={label}>
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


function Auth({
  title,
  subtitle,
  button,
  register = false
}: {
  title: string
  subtitle: string
  button: string
  register?: boolean
}) {

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

      const endpoint = register
        ? 'http://127.0.0.1:8000/auth/register'
        : 'http://127.0.0.1:8000/auth/login'

      const body = register
        ? {
            name,
            college,
            email,
            password
          }
        : {
            email,
            password
          }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail || 'Something went wrong.'
        )
      }

      if (register) {

        setSuccess(
          'Account created successfully! Redirecting to login...'
        )

        setTimeout(() => {
          navigate('/login')
        }, 1000)

      } else {

        localStorage.setItem(
          'student',
          JSON.stringify(data)
        )

        navigate('/app')
      }

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
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="Your name"
                  required
                />
              </label>

              <label>
                College

                <input
                  value={college}
                  onChange={(e) =>
                    setCollege(e.target.value)
                  }
                  placeholder="College name"
                  required
                />
              </label>
            </>
          )}

          <label>
            Email

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
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
              onChange={(e) =>
                setPassword(e.target.value)
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
            {loading ? 'Please wait...' : button}
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