import { useEffect, useState } from 'react'
import { Badge, Button, Card, PageHeader, Progress } from '../components/UI'

type ProfileData = {
  name: string
  email: string
  phone: string
  location: string
  college: string
  degree: string
  branch: string
  cgpa: string
  skills: string[]
  softSkills: string[]
  interests: string[]
}

type StudentFromBackend = {
  id: number
  name: string
  email: string
  college: string | null
  branch: string | null
  cgpa: string | null
}

export default function Profile() {
  const [edit, setEdit] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [studentId, setStudentId] = useState<number | null>(null)

  const [p, setP] = useState<ProfileData | null>(null)
  const [draft, setDraft] = useState<ProfileData | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const storedStudent = localStorage.getItem('student')

        if (!storedStudent) {
          setError('Please login to view your profile.')
          setLoading(false)
          return
        }

        const loggedInStudent = JSON.parse(storedStudent)

        const id =
          loggedInStudent.student_id ||
          loggedInStudent.id

        if (!id) {
          setError('Student ID not found. Please login again.')
          setLoading(false)
          return
        }

        setStudentId(Number(id))

        const response = await fetch(
          `http://127.0.0.1:8000/api/students/${id}`
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.detail || 'Failed to load profile.'
          )
        }

        const backendStudent: StudentFromBackend = data

        const profileData: ProfileData = {
          name: backendStudent.name || '',
          email: backendStudent.email || '',
          phone: '',
          location: '',
          college: backendStudent.college || '',
          degree: 'B.Tech',
          branch: backendStudent.branch || '',
          cgpa: backendStudent.cgpa || '',
          skills: [],
          softSkills: [],
          interests: []
        }

        setP(profileData)
        setDraft(profileData)

      } catch (err) {
        console.error('Failed to load profile:', err)

        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load profile.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const save = async () => {
    if (!draft || !studentId) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/students/${studentId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: draft.name,
            email: draft.email,
            college: draft.college,
            branch: draft.branch,
            cgpa: draft.cgpa
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail || 'Failed to update profile.'
        )
      }

      const updatedStudent = data.student

      // Update profile state
      const updatedProfile: ProfileData = {
        ...draft,
        name: updatedStudent.name,
        email: updatedStudent.email,
        college: updatedStudent.college || '',
        branch: updatedStudent.branch || '',
        cgpa: updatedStudent.cgpa || ''
      }

      setP(updatedProfile)
      setDraft(updatedProfile)

      // Keep login information synchronized
      const storedStudent =
        localStorage.getItem('student')

      if (storedStudent) {
        const oldStudent = JSON.parse(storedStudent)

        localStorage.setItem(
          'student',
          JSON.stringify({
            ...oldStudent,
            name: updatedStudent.name,
            email: updatedStudent.email,
            college: updatedStudent.college,
            branch: updatedStudent.branch,
            cgpa: updatedStudent.cgpa
          })
        )
      }

      setEdit(false)
      setSuccess('Profile updated successfully.')

    } catch (err) {
      console.error('Failed to update profile:', err)

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update profile.'
      )
    } finally {
      setSaving(false)
    }
  }

  const cancel = () => {
    if (!p) return

    setDraft({ ...p })
    setEdit(false)
    setError('')
    setSuccess('')
  }

  const updateDraft = (
    key: keyof ProfileData,
    value: string
  ) => {
    if (!draft) return

    setDraft({
      ...draft,
      [key]: value
    })
  }

  if (loading) {
    return (
      <>
        <PageHeader
          title="My Profile"
          subtitle="Keep your information complete so recommendations can be more relevant."
        />

        <Card>
          <p>Loading your profile...</p>
        </Card>
      </>
    )
  }

  if (error && !p) {
    return (
      <>
        <PageHeader
          title="My Profile"
          subtitle="Keep your information complete so recommendations can be more relevant."
        />

        <Card>
          <p className="notice">{error}</p>
        </Card>
      </>
    )
  }

  if (!p || !draft) {
    return null
  }

  return (
    <>
      <PageHeader
        title="My Profile"
        subtitle="Keep your information complete so recommendations can be more relevant."
      />

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

      <Card>
        <div className="section-title">

          <div>
            <h2>{p.name}</h2>

            <p>
              {p.degree} · {p.branch}
            </p>
          </div>

          {!edit ? (
            <Button
              onClick={() => {
                setSuccess('')
                setError('')
                setEdit(true)
              }}
            >
              Edit Profile
            </Button>
          ) : (
            <div className="actions">

              <Button
                variant="secondary"
                onClick={cancel}
                disabled={saving}
              >
                Cancel
              </Button>

              <Button
                onClick={save}
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : 'Save Changes'}
              </Button>

            </div>
          )}

        </div>

        <Progress value={92} />

        <small>
          Profile completion: 92%
        </small>
      </Card>

      <div className="two-col">

        <Card>
          <h2>Personal Information</h2>

          <label>
            Name

            <input
              disabled={!edit}
              value={draft.name}
              onChange={(e) =>
                updateDraft('name', e.target.value)
              }
            />
          </label>

          <label>
            Email

            <input
              disabled={!edit}
              value={draft.email}
              onChange={(e) =>
                updateDraft('email', e.target.value)
              }
            />
          </label>

          <label>
            Phone

            <input
              disabled={!edit}
              value={draft.phone}
              onChange={(e) =>
                updateDraft('phone', e.target.value)
              }
            />
          </label>

          <label>
            Location

            <input
              disabled={!edit}
              value={draft.location}
              onChange={(e) =>
                updateDraft('location', e.target.value)
              }
            />
          </label>
        </Card>

        <Card>
          <h2>Education</h2>

          <label>
            College

            <input
              disabled={!edit}
              value={draft.college}
              onChange={(e) =>
                updateDraft('college', e.target.value)
              }
            />
          </label>

          <label>
            Degree

            <input
              disabled={!edit}
              value={draft.degree}
              onChange={(e) =>
                updateDraft('degree', e.target.value)
              }
            />
          </label>

          <label>
            Branch

            <input
              disabled={!edit}
              value={draft.branch}
              onChange={(e) =>
                updateDraft('branch', e.target.value)
              }
            />
          </label>

          <label>
            CGPA

            <input
              disabled={!edit}
              value={draft.cgpa}
              onChange={(e) =>
                updateDraft('cgpa', e.target.value)
              }
            />
          </label>
        </Card>

      </div>

      <Card>
        <h2>Technical Skills</h2>

        <div className="badges">
          {p.skills.length > 0 ? (
            p.skills.map((skill) => (
              <Badge key={skill}>
                {skill}
              </Badge>
            ))
          ) : (
            <p>No technical skills added yet.</p>
          )}
        </div>

        <h3>Soft Skills</h3>

        <div className="badges">
          {p.softSkills.length > 0 ? (
            p.softSkills.map((skill) => (
              <Badge key={skill}>
                {skill}
              </Badge>
            ))
          ) : (
            <p>No soft skills added yet.</p>
          )}
        </div>

        <h3>Interests</h3>

        <div className="badges">
          {p.interests.length > 0 ? (
            p.interests.map((interest) => (
              <Badge key={interest}>
                {interest}
              </Badge>
            ))
          ) : (
            <p>No interests added yet.</p>
          )}
        </div>
      </Card>
    </>
  )
}