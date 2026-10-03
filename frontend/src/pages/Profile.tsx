import { useEffect, useMemo, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  PageHeader,
  Progress
} from '../components/UI'
import { api } from '../services/api'

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

type ResumeAnalysis = {
  skills?: string[]
  education?: string[]
  detected_sections?: string[]
  candidate_email?: string
  candidate_phone?: string
}

type ResumeResponse = {
  id?: number
  filename?: string
  candidate_email?: string
  candidate_phone?: string
  skills?: string[]
  education?: string[]
  detected_sections?: string[]
  analysis?: ResumeAnalysis
}

function getStudentId(): number | null {
  const storedStudent = localStorage.getItem('student')

  if (!storedStudent) {
    return null
  }

  try {
    const student = JSON.parse(storedStudent)

    const id = Number(
      student?.student_id ?? student?.id
    )

    return Number.isFinite(id) && id > 0
      ? id
      : null
  } catch {
    return null
  }
}

function parseStringArray(
  value: unknown
): string[] {
  if (Array.isArray(value)) {
    return value
      .filter(
        item => typeof item === 'string'
      )
      .map(item => item.trim())
      .filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
  }

  return []
}

function getResumeAnalysis(
  response: ResumeResponse
): ResumeAnalysis {
  if (response.analysis) {
    return response.analysis
  }

  return {
    skills: response.skills,
    education: response.education,
    detected_sections: response.detected_sections,
    candidate_email: response.candidate_email,
    candidate_phone: response.candidate_phone
  }
}

export default function Profile() {
  const [edit, setEdit] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [studentId, setStudentId] =
    useState<number | null>(null)

  const [p, setP] =
    useState<ProfileData | null>(null)

  const [draft, setDraft] =
    useState<ProfileData | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const id = getStudentId()

        if (!id) {
          setError(
            'Student ID not found. Please login again.'
          )
          setLoading(false)
          return
        }

        setStudentId(id)

        const student =
          await api.getStudent(id) as StudentFromBackend

        let resume: ResumeResponse | null = null

        try {
          resume =
            await api.getLatestResume(id) as ResumeResponse
        } catch {
          resume = null
        }

        const resumeAnalysis = resume
          ? getResumeAnalysis(resume)
          : {}

        const profileData: ProfileData = {
          name: student.name || '',
          email:
            resumeAnalysis.candidate_email ||
            student.email ||
            '',
          phone:
            resumeAnalysis.candidate_phone ||
            '',
          location: '',
          college: student.college || '',
          degree: 'B.Tech',
          branch: student.branch || '',
          cgpa: student.cgpa || '',
          skills: parseStringArray(
            resumeAnalysis.skills
          ),
          softSkills: [],
          interests: []
        }

        setP(profileData)
        setDraft(profileData)
      } catch (err) {
        console.error(
          'Failed to load profile:',
          err
        )

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

  const profileCompletion = useMemo(() => {
    if (!p) return 0

    const fields = [
      p.name,
      p.email,
      p.phone,
      p.location,
      p.college,
      p.degree,
      p.branch,
      p.cgpa
    ]

    const completedFields =
      fields.filter(
        value => value.trim().length > 0
      ).length

    const skillBonus =
      p.skills.length > 0 ? 1 : 0

    const softSkillBonus =
      p.softSkills.length > 0 ? 1 : 0

    const interestBonus =
      p.interests.length > 0 ? 1 : 0

    const total =
      fields.length + 3

    return Math.round(
      ((completedFields +
        skillBonus +
        softSkillBonus +
        interestBonus) /
        total) *
        100
    )
  }, [p])

  const save = async () => {
    if (!draft || !studentId) {
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response =
        await api.updateStudent(
          studentId,
          {
            name: draft.name.trim(),
            email: draft.email.trim(),
            college: draft.college.trim(),
            branch: draft.branch.trim(),
            cgpa: draft.cgpa.trim()
          }
        ) as StudentFromBackend

      const updatedProfile: ProfileData = {
        ...draft,
        name: response.name || '',
        email: response.email || '',
        college: response.college || '',
        branch: response.branch || '',
        cgpa: response.cgpa || ''
      }

      setP(updatedProfile)
      setDraft(updatedProfile)

      const storedStudent =
        localStorage.getItem('student')

      if (storedStudent) {
        try {
          const oldStudent =
            JSON.parse(storedStudent)

          localStorage.setItem(
            'student',
            JSON.stringify({
              ...oldStudent,
              student_id:
                oldStudent.student_id ??
                oldStudent.id ??
                studentId,
              id:
                oldStudent.id ??
                studentId,
              name: response.name,
              email: response.email,
              college: response.college,
              branch: response.branch,
              cgpa: response.cgpa
            })
          )
        } catch {
          localStorage.setItem(
            'student',
            JSON.stringify({
              student_id: studentId,
              id: studentId,
              name: response.name,
              email: response.email,
              college: response.college,
              branch: response.branch,
              cgpa: response.cgpa
            })
          )
        }
      }

      setEdit(false)
      setSuccess(
        'Profile updated successfully.'
      )
    } catch (err) {
      console.error(
        'Failed to update profile:',
        err
      )

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

    setDraft({
      ...p,
      skills: [...p.skills],
      softSkills: [...p.softSkills],
      interests: [...p.interests]
    })

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
          <p className="notice">
            {error}
          </p>
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
              {p.degree}
              {p.branch
                ? ` · ${p.branch}`
                : ''}
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

        <Progress
          value={profileCompletion}
        />

        <small>
          Profile completion:{' '}
          {profileCompletion}%
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
              onChange={event =>
                updateDraft(
                  'name',
                  event.target.value
                )
              }
            />
          </label>

          <label>
            Email

            <input
              type="email"
              disabled={!edit}
              value={draft.email}
              onChange={event =>
                updateDraft(
                  'email',
                  event.target.value
                )
              }
            />
          </label>

          <label>
            Phone

            <input
              disabled={!edit}
              value={draft.phone}
              onChange={event =>
                updateDraft(
                  'phone',
                  event.target.value
                )
              }
            />
          </label>

          <label>
            Location

            <input
              disabled={!edit}
              value={draft.location}
              onChange={event =>
                updateDraft(
                  'location',
                  event.target.value
                )
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
              onChange={event =>
                updateDraft(
                  'college',
                  event.target.value
                )
              }
            />
          </label>

          <label>
            Degree

            <input
              disabled={!edit}
              value={draft.degree}
              onChange={event =>
                updateDraft(
                  'degree',
                  event.target.value
                )
              }
            />
          </label>

          <label>
            Branch

            <input
              disabled={!edit}
              value={draft.branch}
              onChange={event =>
                updateDraft(
                  'branch',
                  event.target.value
                )
              }
            />
          </label>

          <label>
            CGPA

            <input
              disabled={!edit}
              value={draft.cgpa}
              onChange={event =>
                updateDraft(
                  'cgpa',
                  event.target.value
                )
              }
            />
          </label>
        </Card>
      </div>

      <Card>
        <h2>Technical Skills</h2>

        <div className="badges">
          {p.skills.length > 0 ? (
            p.skills.map(skill => (
              <Badge key={skill}>
                {skill}
              </Badge>
            ))
          ) : (
            <p>
              Upload a resume to let AI extract
              your technical skills.
            </p>
          )}
        </div>

        <h3>Soft Skills</h3>

        <div className="badges">
          {p.softSkills.length > 0 ? (
            p.softSkills.map(skill => (
              <Badge key={skill}>
                {skill}
              </Badge>
            ))
          ) : (
            <p>
              Soft skills will be populated from
              your AI resume analysis.
            </p>
          )}
        </div>

        <h3>Interests</h3>

        <div className="badges">
          {p.interests.length > 0 ? (
            p.interests.map(interest => (
              <Badge key={interest}>
                {interest}
              </Badge>
            ))
          ) : (
            <p>
              Interests can be added as profile
              information becomes available.
            </p>
          )}
        </div>
      </Card>
    </>
  )
}