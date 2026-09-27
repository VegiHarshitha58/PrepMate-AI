import { useEffect, useState } from 'react'
import { Badge, Card, PageHeader, Progress } from '../components/UI'

type Domain = {
  name: string
  alignment: number
  reason: string
  existing: string[]
  missing: string[]
}

type JobMatch = {
  id: number
  title: string
  company: string
  location: string
  alignment: number
  matched: string[]
  missing: string[]
}

type SkillGap = {
  skill: string
  status: string
  current?: number
  required?: number
}

type CareerAnalysis = {
  recommended_domains?: Array<{
    domain: string
    score?: number
    reason?: string
    matching_skills?: string[]
  }>
}

type JobAnalysis = {
  matches?: Array<{
    id?: number
    title: string
    company?: string
    location?: string
    match_score?: number
    matched_skills?: string[]
    missing_skills?: string[]
  }>
}

type SkillGapAnalysis = {
  target_role?: string
  target_domain?: string
  skill_gaps?: Array<{
    skill: string
    status: string
    priority?: string
    reason?: string
  }>
}

type ResumeResponse = {
  career_analysis: CareerAnalysis
  job_analysis: JobAnalysis
  skill_gap_analysis: SkillGapAnalysis
}

export function Domains() {
  const [data, setData] = useState<ResumeResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadCareerData()
  }, [])

  const loadCareerData = async () => {
    try {
      const storedStudent = localStorage.getItem('student')

      if (!storedStudent) {
        setError('Please login to view your career analysis.')
        return
      }

      const student = JSON.parse(storedStudent)
      const studentId = student.student_id || student.id

      if (!studentId) {
        setError('Student ID not found. Please login again.')
        return
      }

      const response = await fetch(
        `http://127.0.0.1:8000/api/resume/latest/${studentId}`
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.detail || 'Failed to load career analysis.'
        )
      }

      setData(result)
    } catch (err) {
      console.error(err)
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load career analysis.'
      )
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <p>Loading career analysis...</p>
  }

  if (error) {
    return (
      <Card>
        <p>{error}</p>
      </Card>
    )
  }

  if (!data) {
    return null
  }

  const domains: Domain[] =
    data.career_analysis?.recommended_domains?.map((domain, index) => ({
      name: domain.domain,
      alignment: domain.score ?? 0,
      reason: domain.reason ?? 'Based on your resume skills.',
      existing: domain.matching_skills ?? [],
      missing: [],
    })) ?? []

  return (
    <>
      <PageHeader
        title="Career Domains"
        subtitle="Explore potential career directions based on your current profile."
      />

      {domains.length === 0 ? (
        <Card>
          <p>No career domain analysis is available yet.</p>
        </Card>
      ) : (
        <div className="card-grid">
          {domains.map((domain) => (
            <Card key={domain.name}>
              <div className="section-title">
                <h2>{domain.name}</h2>
                <b>{domain.alignment}%</b>
              </div>

              <Progress value={domain.alignment} />

              <p>{domain.reason}</p>

              <h3>Existing skills</h3>

              <div className="badges">
                {domain.existing.map((skill) => (
                  <Badge key={skill}>{skill}</Badge>
                ))}
              </div>

              {domain.missing.length > 0 && (
                <>
                  <h3>Skills to develop</h3>

                  <div className="badges">
                    {domain.missing.map((skill) => (
                      <Badge key={skill}>{skill}</Badge>
                    ))}
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  )
}

export function Jobs() {
  const [data, setData] = useState<ResumeResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadJobData()
  }, [])

  const loadJobData = async () => {
    try {
      const storedStudent = localStorage.getItem('student')

      if (!storedStudent) {
        setError('Please login to view job matches.')
        return
      }

      const student = JSON.parse(storedStudent)
      const studentId = student.student_id || student.id

      if (!studentId) {
        setError('Student ID not found. Please login again.')
        return
      }

      const response = await fetch(
        `http://127.0.0.1:8000/api/resume/latest/${studentId}`
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.detail || 'Failed to load job matches.'
        )
      }

      setData(result)
    } catch (err) {
      console.error(err)
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load job matches.'
      )
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <p>Loading job matches...</p>
  }

  if (error) {
    return (
      <Card>
        <p>{error}</p>
      </Card>
    )
  }

  if (!data) {
    return null
  }

  const jobs: JobMatch[] =
    data.job_analysis?.matches?.map((job, index) => ({
      id: job.id ?? index,
      title: job.title,
      company: job.company ?? 'Company not specified',
      location: job.location ?? 'Location not specified',
      alignment: job.match_score ?? 0,
      matched: job.matched_skills ?? [],
      missing: job.missing_skills ?? [],
    })) ?? []

  return (
    <>
      <PageHeader
        title="Job Matches"
        subtitle="Opportunities matched against the skills detected from your resume."
      />

      {jobs.length === 0 ? (
        <Card>
          <p>No job matches are available yet.</p>
        </Card>
      ) : (
        <div className="card-grid">
          {jobs.map((job) => (
            <Card key={job.id}>
              <div className="section-title">
                <div>
                  <h2>{job.title}</h2>
                  <p>
                    {job.company} · {job.location}
                  </p>
                </div>

                <b>{job.alignment}%</b>
              </div>

              <Progress value={job.alignment} />

              <h3>Matched</h3>

              <div className="badges">
                {job.matched.map((skill) => (
                  <Badge key={skill}>{skill}</Badge>
                ))}
              </div>

              <h3>Missing</h3>

              <div className="badges">
                {job.missing.length > 0 ? (
                  job.missing.map((skill) => (
                    <Badge key={skill}>{skill}</Badge>
                  ))
                ) : (
                  <span>No missing skills detected.</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}

export function SkillGaps() {
  const [data, setData] = useState<ResumeResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadSkillGapData()
  }, [])

  const loadSkillGapData = async () => {
    try {
      const storedStudent = localStorage.getItem('student')

      if (!storedStudent) {
        setError('Please login to view skill gap analysis.')
        return
      }

      const student = JSON.parse(storedStudent)
      const studentId = student.student_id || student.id

      if (!studentId) {
        setError('Student ID not found. Please login again.')
        return
      }

      const response = await fetch(
        `http://127.0.0.1:8000/api/resume/latest/${studentId}`
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.detail || 'Failed to load skill gap analysis.'
        )
      }

      setData(result)
    } catch (err) {
      console.error(err)
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load skill gap analysis.'
      )
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <p>Loading skill gap analysis...</p>
  }

  if (error) {
    return (
      <Card>
        <p>{error}</p>
      </Card>
    )
  }

  if (!data) {
    return null
  }

  const skillGapAnalysis = data.skill_gap_analysis

  const gaps: SkillGap[] =
    skillGapAnalysis?.skill_gaps?.map((gap) => ({
      skill: gap.skill,
      status: gap.status,
    })) ?? []

  return (
    <>
      <PageHeader
        title="Skill Gap Analysis"
        subtitle="Compare your current skills with the requirements of your target role."
      />

      <Card>
        <p>
          <strong>Target Role:</strong>{' '}
          {skillGapAnalysis?.target_role || 'Not available'}
        </p>

        <p>
          <strong>Target Domain:</strong>{' '}
          {skillGapAnalysis?.target_domain || 'Not available'}
        </p>
      </Card>

      {gaps.length === 0 ? (
        <Card>
          <p>No skill gaps were detected for the current analysis.</p>
        </Card>
      ) : (
        <div className="card-grid">
          {gaps.map((gap) => (
            <Card key={gap.skill}>
              <div className="section-title">
                <h2>{gap.skill}</h2>
                <Badge>{gap.status}</Badge>
              </div>

              <p>
                This skill was identified by the Skill Gap Agent based on
                your resume and target role.
              </p>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}