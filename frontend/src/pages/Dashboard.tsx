import { useEffect, useState } from 'react'
import { Card, Progress, PageHeader, Badge } from '../components/UI'
import { api } from '../services/api'

type Student = {
  student_id?: number
  id?: number
  name: string
  email: string
  college?: string | null
  branch?: string | null
  cgpa?: string | null
}

type ResumeAnalysis = {
  resume_score: number
  word_count: number
  skills: string[]
}

type CareerDomain = {
  domain: string
  match_percentage: number
  matching_skills: string[]
}

type CareerAnalysis = {
  recommended_domains: CareerDomain[]
  skills_used: string[]
}

type JobMatch = {
  role: string
  domain: string
  level: string
  match_percentage: number
  matching_skills: string[]
  missing_skills: string[]
}

type JobAnalysis = {
  job_matches: JobMatch[]
  skills_used: string[]
}

type SkillGap = {
  skill: string
  status: string
  priority: string
  reason: string
}

type SkillGapAnalysis = {
  target_role: string
  target_domain: string
  skill_gaps: SkillGap[]
  missing_skills_count: number
  total_required_skills: number
}

type DashboardData = {
  resume_score: number
  word_count: number
  skills: string[]
  career_analysis: CareerAnalysis
  job_analysis: JobAnalysis
  skill_gap_analysis: SkillGapAnalysis
}

function getStudentFromStorage(): Student | null {
  const storedStudent = localStorage.getItem('student')

  if (!storedStudent) {
    return null
  }

  try {
    return JSON.parse(storedStudent)
  } catch {
    return null
  }
}

export default function Dashboard() {
  const [student, setStudent] =
    useState<Student | null>(null)

  const [data, setData] =
    useState<DashboardData | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  useEffect(() => {
    const loadDashboard = async () => {
      const loggedInStudent =
        getStudentFromStorage()

      if (!loggedInStudent) {
        setError(
          'Please login to view your dashboard.'
        )
        setLoading(false)
        return
      }

      setStudent(loggedInStudent)

      const studentId =
        loggedInStudent.student_id ??
        loggedInStudent.id

      if (!studentId) {
        setError(
          'Student information is incomplete. Please login again.'
        )
        setLoading(false)
        return
      }

      try {
        try {
          const result = await api.getLatestResume(Number(studentId))
          setData(result as DashboardData)
        } catch (err) {
          if (err instanceof Error && err.message.toLowerCase().includes('no resume analysis')) {
            setData(null)
            setLoading(false)
            return
          }
          throw err
        }
      } catch (err) {
        console.error(
          'Failed to load dashboard:',
          err
        )

        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load dashboard data.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  if (loading) {
    return (
      <>
        <PageHeader
          title="Dashboard"
          subtitle="Loading your placement preparation data..."
        />

        <Card>
          <p>Loading your data...</p>
        </Card>
      </>
    )
  }

  if (error) {
    return (
      <>
        <PageHeader
          title="Dashboard"
          subtitle="Your placement preparation snapshot."
        />

        <Card>
          <p className="notice">
            {error}
          </p>
        </Card>
      </>
    )
  }

  const resume = data
    ? {
        resume_score: data.resume_score,
        word_count: data.word_count,
        skills: data.skills
      }
    : null

  const career = data?.career_analysis

  const jobs = data?.job_analysis

  const skillGap =
    data?.skill_gap_analysis

  const topDomain =
    career?.recommended_domains?.[0] ?? null

  const topJob =
    jobs?.job_matches?.[0] ?? null

  return (
    <>
      <PageHeader
        title={`Good afternoon, ${
          student?.name || 'Student'
        } 👋`}
        subtitle="Your placement preparation snapshot."
      />

      <div className="metrics">

        <Card>
          <div className="metric-label">
            Resume Score
          </div>

          <div className="metric">
            {resume
              ? `${resume.resume_score}/100`
              : '--'}
          </div>

          {resume && (
            <Progress
              value={resume.resume_score}
            />
          )}

          <p>
            {resume
              ? `${resume.skills.length} skills detected`
              : 'Upload your resume to begin'}
          </p>
        </Card>

        <Card>
          <div className="metric-label">
            Career Alignment
          </div>

          <div className="metric">
            {topDomain
              ? `${topDomain.match_percentage}%`
              : '--'}
          </div>

          {topDomain && (
            <Progress
              value={
                topDomain.match_percentage
              }
            />
          )}

          <p>
            {topDomain
              ? topDomain.domain
              : 'Analyze your resume'}
          </p>
        </Card>

        <Card>
          <div className="metric-label">
            Skill Gaps
          </div>

          <div className="metric">
            {skillGap
              ? skillGap.missing_skills_count
              : '--'}
          </div>

          <p>
            {skillGap
              ? `Skills needed for ${skillGap.target_role}`
              : 'Analyze your resume'}
          </p>
        </Card>

        <Card>
          <div className="metric-label">
            Job Matches
          </div>

          <div className="metric">
            {jobs?.job_matches?.length ?? '--'}
          </div>

          <p>
            {jobs
              ? 'Roles identified from your analysis'
              : 'Analyze your resume'}
          </p>
        </Card>

      </div>

      <div className="two-col">

        <Card>
          <h2>Student Information</h2>

          <div style={{ marginTop: 20 }}>
            <p>
              <strong>Name:</strong>{' '}
              {student?.name || 'Not available'}
            </p>

            <p>
              <strong>Email:</strong>{' '}
              {student?.email || 'Not available'}
            </p>

            <p>
              <strong>College:</strong>{' '}
              {student?.college ||
                'Not added'}
            </p>

            <p>
              <strong>Branch:</strong>{' '}
              {student?.branch ||
                'Not added'}
            </p>

            <p>
              <strong>CGPA:</strong>{' '}
              {student?.cgpa ||
                'Not added'}
            </p>
          </div>
        </Card>

        <Card>
          <h2>Career Direction</h2>

          {topDomain ? (
            <div style={{ marginTop: 20 }}>
              <h3>
                {topDomain.domain}
              </h3>

              <Progress
                value={
                  topDomain.match_percentage
                }
              />

              <p>
                {topDomain.match_percentage}%
                profile alignment
              </p>

              <div className="badges">
                {topDomain.matching_skills.map(
                  (skill) => (
                    <Badge key={skill}>
                      {skill}
                    </Badge>
                  )
                )}
              </div>
            </div>
          ) : (
            <p style={{ marginTop: 20 }}>
              Upload and analyze your resume
              to generate career directions.
            </p>
          )}
        </Card>

      </div>

      <div className="two-col">

        <Card>
          <h2>Current Job Matches</h2>

          {topJob ? (
            <div style={{ marginTop: 20 }}>
              <h3>
                {topJob.role}
              </h3>

              <p>
                {topJob.domain} ·{' '}
                {topJob.level}
              </p>

              <Progress
                value={
                  topJob.match_percentage
                }
              />

              <p>
                {topJob.match_percentage}%
                profile match
              </p>

              <h4>
                Matching Skills
              </h4>

              <div className="badges">
                {topJob.matching_skills.map(
                  (skill) => (
                    <Badge key={skill}>
                      {skill}
                    </Badge>
                  )
                )}
              </div>

              {topJob.missing_skills.length >
                0 && (
                <>
                  <h4>
                    Skills to Develop
                  </h4>

                  <div className="badges">
                    {topJob.missing_skills.map(
                      (skill) => (
                        <Badge key={skill}>
                          {skill}
                        </Badge>
                      )
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <p style={{ marginTop: 20 }}>
              No job matches are available
              yet.
            </p>
          )}
        </Card>

        <Card>
          <h2>Skill Gap</h2>

          {skillGap ? (
            <div style={{ marginTop: 20 }}>
              <p>
                <strong>
                  Target Role:
                </strong>{' '}
                {skillGap.target_role}
              </p>

              <p>
                <strong>
                  Target Domain:
                </strong>{' '}
                {skillGap.target_domain}
              </p>

              <p>
                <strong>
                  Missing Skills:
                </strong>{' '}
                {skillGap.missing_skills_count}
              </p>

              <div className="badges">
                {skillGap.skill_gaps
                  .filter(
                    (gap) =>
                      gap.status ===
                      'Missing'
                  )
                  .map((gap) => (
                    <Badge key={gap.skill}>
                      {gap.skill}
                    </Badge>
                  ))}
              </div>
            </div>
          ) : (
            <p style={{ marginTop: 20 }}>
              Analyze your resume to identify
              personalized skill gaps.
            </p>
          )}
        </Card>

      </div>

      <Card>
        <h2>Resume Status</h2>

        {resume ? (
          <div style={{ marginTop: 20 }}>
            <p>
              <strong>
                Resume Score:
              </strong>{' '}
              {resume.resume_score}/100
            </p>

            <p>
              <strong>
                Word Count:
              </strong>{' '}
              {resume.word_count}
            </p>

            <p>
              <strong>
                Skills Detected:
              </strong>{' '}
              {resume.skills.length}
            </p>

            <Progress
              value={resume.resume_score}
            />
          </div>
        ) : (
          <p style={{ marginTop: 20 }}>
            No resume has been analyzed yet.
          </p>
        )}
      </Card>
    </>
  )
}