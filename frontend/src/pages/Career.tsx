import { useEffect, useState } from 'react'
import { Badge, Card, PageHeader, Progress } from '../components/UI'
import { api } from '../services/api'

type DomainRecommendation = {
  domain: string
  match_percentage: number
  matching_skills: string[]
}

type JobMatch = {
  role: string
  domain: string
  level: string
  match_percentage: number
  matching_skills: string[]
  missing_skills: string[]
}

type SkillGap = {
  skill: string
  status: string
  priority: string
  reason: string
}

type CareerAnalysis = {
  recommended_domains: DomainRecommendation[]
  skills_used: string[]
}

type JobAnalysis = {
  job_matches: JobMatch[]
  skills_used: string[]
}

type SkillGapAnalysis = {
  target_role: string
  target_domain: string
  skill_gaps: SkillGap[]
  missing_skills_count: number
  total_required_skills: number
}

type ResumeResponse = {
  career_analysis: CareerAnalysis
  job_analysis: JobAnalysis
  skill_gap_analysis: SkillGapAnalysis
}

function getStudentId(): number | null {
  const storedStudent = localStorage.getItem('student')

  if (!storedStudent) {
    return null
  }

  try {
    const student = JSON.parse(storedStudent)

    return student.student_id ?? student.id ?? null
  } catch {
    return null
  }
}

async function fetchLatestAnalysis(): Promise<ResumeResponse> {
  const studentId = getStudentId()
  if (!studentId) throw new Error('Student information not found. Please login again.')
  return api.getLatestResume(Number(studentId)) as Promise<ResumeResponse>
}

function LoadingState({
  message
}: {
  message: string
}) {
  return (
    <Card>
      <p>{message}</p>
    </Card>
  )
}

function ErrorState({
  message
}: {
  message: string
}) {
  return (
    <Card>
      <p>{message}</p>
    </Card>
  )
}

export function Domains() {
  const [data, setData] =
    useState<ResumeResponse | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  useEffect(() => {
    fetchLatestAnalysis()
      .then(setData)
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load career analysis.'
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <>
        <PageHeader
          title="Career Domains"
          subtitle="AI-based career directions from your current profile."
        />

        <LoadingState message="Loading career analysis..." />
      </>
    )
  }

  if (error) {
    return (
      <>
        <PageHeader
          title="Career Domains"
          subtitle="AI-based career directions from your current profile."
        />

        <ErrorState message={error} />
      </>
    )
  }

  if (!data) {
    return null
  }

  const domains =
    data.career_analysis?.recommended_domains ?? []

  return (
    <>
      <PageHeader
        title="Career Domains"
        subtitle="Career directions generated from your resume and current profile."
      />

      {domains.length === 0 ? (
        <Card>
          <p>
            No career recommendations are available yet.
            Upload and analyze your resume first.
          </p>
        </Card>
      ) : (
        <div className="card-grid">
          {domains.map((domain) => (
            <Card key={domain.domain}>
              <div className="section-title">
                <h2>{domain.domain}</h2>

                <b>
                  {domain.match_percentage}%
                </b>
              </div>

              <Progress
                value={domain.match_percentage}
              />

              <h3>Skills considered</h3>

              {domain.matching_skills.length > 0 ? (
                <div className="badges">
                  {domain.matching_skills.map(
                    (skill) => (
                      <Badge key={skill}>
                        {skill}
                      </Badge>
                    )
                  )}
                </div>
              ) : (
                <p>
                  No matching skills were detected.
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  )
}

export function Jobs() {
  const [data, setData] =
    useState<ResumeResponse | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  useEffect(() => {
    fetchLatestAnalysis()
      .then(setData)
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load job matches.'
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <>
        <PageHeader
          title="Job Matches"
          subtitle="AI-generated role matches based on your profile."
        />

        <LoadingState message="Loading job matches..." />
      </>
    )
  }

  if (error) {
    return (
      <>
        <PageHeader
          title="Job Matches"
          subtitle="AI-generated role matches based on your profile."
        />

        <ErrorState message={error} />
      </>
    )
  }

  if (!data) {
    return null
  }

  const jobs =
    data.job_analysis?.job_matches ?? []

  return (
    <>
      <PageHeader
        title="Job Matches"
        subtitle="Roles matched against your current skills and profile."
      />

      {jobs.length === 0 ? (
        <Card>
          <p>
            No job matches are available yet.
          </p>
        </Card>
      ) : (
        <div className="card-grid">
          {jobs.map((job, index) => (
            <Card
              key={`${job.role}-${job.domain}-${index}`}
            >
              <div className="section-title">
                <div>
                  <h2>{job.role}</h2>

                  <p>
                    {job.domain} · {job.level}
                  </p>
                </div>

                <b>
                  {job.match_percentage}%
                </b>
              </div>

              <Progress
                value={job.match_percentage}
              />

              <h3>Matching skills</h3>

              {job.matching_skills.length > 0 ? (
                <div className="badges">
                  {job.matching_skills.map(
                    (skill) => (
                      <Badge key={skill}>
                        {skill}
                      </Badge>
                    )
                  )}
                </div>
              ) : (
                <p>
                  No matching skills detected.
                </p>
              )}

              <h3>Skills to develop</h3>

              {job.missing_skills.length > 0 ? (
                <div className="badges">
                  {job.missing_skills.map(
                    (skill) => (
                      <Badge key={skill}>
                        {skill}
                      </Badge>
                    )
                  )}
                </div>
              ) : (
                <p>
                  No missing skills detected.
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  )
}

export function SkillGaps() {
  const [data, setData] =
    useState<ResumeResponse | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  useEffect(() => {
    fetchLatestAnalysis()
      .then(setData)
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load skill-gap analysis.'
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <>
        <PageHeader
          title="Skill Gap Analysis"
          subtitle="Skills identified from your target career direction."
        />

        <LoadingState message="Loading skill-gap analysis..." />
      </>
    )
  }

  if (error) {
    return (
      <>
        <PageHeader
          title="Skill Gap Analysis"
          subtitle="Skills identified from your target career direction."
        />

        <ErrorState message={error} />
      </>
    )
  }

  if (!data) {
    return null
  }

  const analysis =
    data.skill_gap_analysis

  const gaps =
    analysis?.skill_gaps ?? []

  return (
    <>
      <PageHeader
        title="Skill Gap Analysis"
        subtitle="Skills identified from your current profile and target direction."
      />

      <Card>
        <p>
          <strong>Target Role:</strong>{' '}
          {analysis?.target_role ||
            'Not available'}
        </p>

        <p>
          <strong>Target Domain:</strong>{' '}
          {analysis?.target_domain ||
            'Not available'}
        </p>

        <p>
          <strong>Missing Skills:</strong>{' '}
          {analysis?.missing_skills_count ?? 0}
        </p>
      </Card>

      {gaps.length === 0 ? (
        <Card>
          <p>
            No skill gaps were identified for the
            current analysis.
          </p>
        </Card>
      ) : (
        <div className="card-grid">
          {gaps.map((gap) => (
            <Card key={gap.skill}>
              <div className="section-title">
                <h2>{gap.skill}</h2>

                <Badge>
                  {gap.status}
                </Badge>
              </div>

              {gap.priority && (
                <p>
                  <strong>
                    Priority:
                  </strong>{' '}
                  {gap.priority}
                </p>
              )}

              {gap.reason && (
                <p>{gap.reason}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  )
}