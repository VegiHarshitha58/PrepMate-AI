import { useEffect, useState } from 'react'
import { Card, Progress, PageHeader, Badge } from '../components/UI'

type Student = {
  id: number
  student_id?: number
  name: string
  email: string
  college: string | null
  branch: string | null
  cgpa: string | null
}

type ResumeAnalysis = {
  resume_score: number
  word_count: number
  skills: string[]
}

type CareerAnalysis = {
  recommended_domains: {
    domain: string
    match_percentage: number
    matching_skills: string[]
  }[]
}

type JobAnalysis = {
  job_matches: {
    role: string
    domain: string
    level: string
    match_percentage: number
    matching_skills: string[]
    missing_skills: string[]
  }[]
}

type SkillGapAnalysis = {
  target_role: string
  target_domain: string
  skill_gaps: {
    skill: string
    status: string
    priority: string
    reason: string
  }[]
  missing_skills_count: number
  total_required_skills: number
}

export default function Dashboard() {
  const [student, setStudent] = useState<Student | null>(null)
  const [resume, setResume] = useState<ResumeAnalysis | null>(null)
  const [career, setCareer] = useState<CareerAnalysis | null>(null)
  const [jobs, setJobs] = useState<JobAnalysis | null>(null)
  const [skillGap, setSkillGap] =
    useState<SkillGapAnalysis | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // -----------------------------
        // Get logged-in student
        // -----------------------------
        const storedStudent =
          localStorage.getItem('student')

        if (!storedStudent) {
          setError('Please login to view your dashboard.')
          setLoading(false)
          return
        }

        const loggedInStudent = JSON.parse(storedStudent)

        setStudent(loggedInStudent)

        const studentId =
          loggedInStudent.student_id ||
          loggedInStudent.id

        if (!studentId) {
          setError('Student ID not found. Please login again.')
          setLoading(false)
          return
        }

        // -----------------------------
        // Fetch latest resume analysis
        // from PostgreSQL
        // -----------------------------
        const response = await fetch(
          `http://127.0.0.1:8000/api/resume/latest/${studentId}`
        )

        if (response.status === 404) {
          // Student has not uploaded a resume yet
          setLoading(false)
          return
        }

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.detail ||
              'Failed to load resume analysis.'
          )
        }

        // -----------------------------
        // Set real database data
        // -----------------------------
        setResume({
          resume_score: data.resume_score,
          word_count: data.word_count,
          skills: data.skills
        })

        setCareer(data.career_analysis)

        setJobs(data.job_analysis)

        setSkillGap(data.skill_gap_analysis)

      } catch (err) {
        console.error(
          'Failed to load dashboard data:',
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

    loadDashboardData()
  }, [])

  const topDomain =
    career?.recommended_domains?.length
      ? career.recommended_domains[0]
      : null

  const topJob =
    jobs?.job_matches?.length
      ? jobs.job_matches[0]
      : null

  // -----------------------------
  // Loading state
  // -----------------------------
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

  // -----------------------------
  // Error state
  // -----------------------------
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

  return (
    <>
      <PageHeader
        title={`Good afternoon, ${
          student?.name || 'Student'
        } 👋`}
        subtitle="Your placement preparation snapshot."
      />

      {/* Dynamic Metrics */}
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

          <Progress
            value={resume?.resume_score || 0}
          />

          <p>
            {resume
              ? `${resume.skills.length} skills detected`
              : 'Upload your resume'}
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

          <Progress
            value={
              topDomain?.match_percentage || 0
            }
          />

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
            Top Job Match
          </div>

          <div className="metric">
            {topJob
              ? `${topJob.match_percentage}%`
              : '--'}
          </div>

          <Progress
            value={
              topJob?.match_percentage || 0
            }
          />

          <p>
            {topJob
              ? topJob.role
              : 'No job matches yet'}
          </p>
        </Card>

      </div>

      {/* Student Information + Career */}
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
              {student?.college || 'Not added'}
            </p>

            <p>
              <strong>Branch:</strong>{' '}
              {student?.branch || 'Not added'}
            </p>

            <p>
              <strong>CGPA:</strong>{' '}
              {student?.cgpa || 'Not added'}
            </p>

          </div>
        </Card>

        <Card>
          <h2>Recommended Career Domain</h2>

          {topDomain ? (
            <div style={{ marginTop: 20 }}>

              <h3>{topDomain.domain}</h3>

              <Progress
                value={
                  topDomain.match_percentage
                }
              />

              <p>
                {topDomain.match_percentage}% match
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
              Upload and analyze your resume to get
              career recommendations.
            </p>
          )}

        </Card>

      </div>

      {/* Job Match + Skill Gap */}
      <div className="two-col">

        <Card>
          <h2>Top Job Match</h2>

          {topJob ? (
            <div style={{ marginTop: 20 }}>

              <h3>{topJob.role}</h3>

              <p>
                {topJob.domain} · {topJob.level}
              </p>

              <Progress
                value={
                  topJob.match_percentage
                }
              />

              <p>
                {topJob.match_percentage}% match
              </p>

              <h4>Matching Skills</h4>

              <div className="badges">
                {topJob.matching_skills.map(
                  (skill) => (
                    <Badge key={skill}>
                      {skill}
                    </Badge>
                  )
                )}
              </div>

              {topJob.missing_skills.length > 0 && (
                <>
                  <h4>Missing Skills</h4>

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
              No job matches available yet.
            </p>
          )}

        </Card>

        <Card>
          <h2>Skill Gap</h2>

          {skillGap ? (
            <div style={{ marginTop: 20 }}>

              <p>
                <strong>Target Role:</strong>{' '}
                {skillGap.target_role}
              </p>

              <p>
                <strong>Target Domain:</strong>{' '}
                {skillGap.target_domain}
              </p>

              <p>
                <strong>Missing Skills:</strong>{' '}
                {skillGap.missing_skills_count}
              </p>

              <div className="badges">
                {skillGap.skill_gaps
                  .filter(
                    (gap) =>
                      gap.status === 'Missing'
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
              skill gaps.
            </p>
          )}

        </Card>

      </div>

      {/* Resume Status */}
      <Card>
        <h2>Resume Status</h2>

        {resume ? (
          <div style={{ marginTop: 20 }}>

            <p>
              <strong>Resume Score:</strong>{' '}
              {resume.resume_score}/100
            </p>

            <p>
              <strong>Word Count:</strong>{' '}
              {resume.word_count}
            </p>

            <p>
              <strong>Skills Detected:</strong>{' '}
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