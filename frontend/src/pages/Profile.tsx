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

  phone?: string | null
  location?: string | null
  degree?: string | null
  skills?: string[]
  softSkills?: string[]
  interests?: string[]
}


type UpdateStudentResponse = {
  message: string
  student: StudentFromBackend
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
  analysis_id?: number
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


function uniqueStrings(
  values: string[]
): string[] {

  return Array.from(
    new Set(
      values
        .map(value => value.trim())
        .filter(Boolean)
    )
  )
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


        /*
         * ------------------------------------------------
         * 1. Load saved student profile from PostgreSQL
         * ------------------------------------------------
         */

        const student =
          await api.getStudent(id) as StudentFromBackend


        /*
         * ------------------------------------------------
         * 2. Try to load latest resume analysis
         * ------------------------------------------------
         */

        let resume: ResumeResponse | null = null

        try {

          resume =
            await api.getLatestResume(id) as ResumeResponse

        } catch {

          /*
           * No resume is perfectly valid.
           * Profile should still load normally.
           */

          resume = null
        }


        const resumeAnalysis = resume
          ? getResumeAnalysis(resume)
          : {}


        /*
         * ------------------------------------------------
         * 3. Existing database data has priority
         * ------------------------------------------------
         *
         * Resume AI is only used to fill fields that are
         * currently empty.
         */

        const databaseSkills =
          parseStringArray(student.skills)

        const resumeSkills =
          parseStringArray(resumeAnalysis.skills)


        const profileData: ProfileData = {

          // Registration/database value first
          name:
            student.name || '',

          email:
            student.email || resumeAnalysis.candidate_email || '',

          // Use saved phone first, otherwise resume
          phone:
            student.phone ||
            resumeAnalysis.candidate_phone ||
            '',

          location:
            student.location || '',

          college:
            student.college || '',

          degree:
            student.degree || 'B.Tech',

          branch:
            student.branch || '',

          cgpa:
            student.cgpa || '',

          /*
           * If the user already has saved skills,
           * preserve them.
           *
           * Otherwise use resume AI skills.
           */
          skills:
            databaseSkills.length > 0
              ? databaseSkills
              : uniqueStrings(resumeSkills),

          softSkills:
            parseStringArray(student.softSkills),

          interests:
            parseStringArray(student.interests)
        }


        setP(profileData)
        setDraft({
          ...profileData,
          skills: [...profileData.skills],
          softSkills: [...profileData.softSkills],
          interests: [...profileData.interests]
        })


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


  /*
   * ------------------------------------------------
   * Profile completion
   * ------------------------------------------------
   */

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
      (
        (
          completedFields +
          skillBonus +
          softSkillBonus +
          interestBonus
        ) /
        total
      ) *
      100
    )

  }, [p])


  /*
   * ------------------------------------------------
   * SAVE PROFILE
   * ------------------------------------------------
   */

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

            college:
              draft.college.trim(),

            branch:
              draft.branch.trim(),

            cgpa:
              draft.cgpa.trim(),

            phone:
              draft.phone.trim(),

            location:
              draft.location.trim(),

            degree:
              draft.degree.trim(),

            skills:
              draft.skills,

            softSkills:
              draft.softSkills,

            interests:
              draft.interests
          }
        ) as UpdateStudentResponse


      /*
       * Backend returns:
       *
       * {
       *   message: "...",
       *   student: {...}
       * }
       */

      const updatedStudent =
        response.student


      /*
       * Rebuild profile from the SAVED backend data.
       *
       * This is important because it proves that the
       * values actually reached PostgreSQL.
       */

      const updatedProfile: ProfileData = {

        name:
          updatedStudent.name || '',

        email:
          updatedStudent.email || '',

        phone:
          updatedStudent.phone || '',

        location:
          updatedStudent.location || '',

        college:
          updatedStudent.college || '',

        degree:
          updatedStudent.degree || 'B.Tech',

        branch:
          updatedStudent.branch || '',

        cgpa:
          updatedStudent.cgpa || '',

        skills:
          parseStringArray(
            updatedStudent.skills
          ),

        softSkills:
          parseStringArray(
            updatedStudent.softSkills
          ),

        interests:
          parseStringArray(
            updatedStudent.interests
          )
      }


      setP(updatedProfile)

      setDraft({
        ...updatedProfile,
        skills: [...updatedProfile.skills],
        softSkills: [...updatedProfile.softSkills],
        interests: [...updatedProfile.interests]
      })


      /*
       * Keep login information synchronized.
       */

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

              name:
                updatedStudent.name,

              email:
                updatedStudent.email,

              college:
                updatedStudent.college,

              branch:
                updatedStudent.branch,

              cgpa:
                updatedStudent.cgpa

            })
          )

        } catch {

          localStorage.setItem(
            'student',
            JSON.stringify({

              student_id:
                studentId,

              id:
                studentId,

              name:
                updatedStudent.name,

              email:
                updatedStudent.email,

              college:
                updatedStudent.college,

              branch:
                updatedStudent.branch,

              cgpa:
                updatedStudent.cgpa

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


  /*
   * ------------------------------------------------
   * CANCEL EDIT
   * ------------------------------------------------
   */

  const cancel = () => {

    if (!p) return


    setDraft({

      ...p,

      skills: [...p.skills],

      softSkills:
        [...p.softSkills],

      interests:
        [...p.interests]

    })


    setEdit(false)
    setError('')
    setSuccess('')
  }


  /*
   * ------------------------------------------------
   * UPDATE FIELD
   * ------------------------------------------------
   */

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


  /*
   * ------------------------------------------------
   * LOADING
   * ------------------------------------------------
   */

  if (loading) {

    return (
      <>
        <PageHeader
          title="My Profile"
          subtitle="Keep your information complete so recommendations can be more relevant."
        />

        <Card>
          <p>
            Loading your profile...
          </p>
        </Card>
      </>
    )
  }


  /*
   * ------------------------------------------------
   * ERROR
   * ------------------------------------------------
   */

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


  /*
   * ------------------------------------------------
   * PAGE
   * ------------------------------------------------
   */

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


      {/* PROFILE HEADER */}

      <Card>

        <div className="section-title">

          <div>

            <h2>
              {p.name}
            </h2>

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


      {/* PERSONAL + EDUCATION */}

      <div className="two-col">


        <Card>

          <h2>
            Personal Information
          </h2>


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

          <h2>
            Education
          </h2>


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


      {/* SKILLS */}

      <Card>

        <h2>
          Technical Skills
        </h2>


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


        <h3>
          Soft Skills
        </h3>


        <div className="badges">

          {p.softSkills.length > 0 ? (

            p.softSkills.map(skill => (

              <Badge key={skill}>
                {skill}
              </Badge>

            ))

          ) : (

            <p>
              Soft skills can be added from
              your profile.
            </p>

          )}

        </div>


        <h3>
          Interests
        </h3>


        <div className="badges">

          {p.interests.length > 0 ? (

            p.interests.map(interest => (

              <Badge key={interest}>
                {interest}
              </Badge>

            ))

          ) : (

            <p>
              Interests can be added from
              your profile.
            </p>

          )}

        </div>

      </Card>

    </>
  )
}