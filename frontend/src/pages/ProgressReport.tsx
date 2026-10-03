import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis
} from 'recharts'
import { useEffect, useMemo, useState } from 'react'
import { Card, PageHeader, Progress } from '../components/UI'
import { api } from '../services/api'

type SkillGap = {
  skill: string
  priority?: string
}

type Analysis = {
  id?: number
  resume_score?: number

  career_analysis?: {
    recommended_domains?: Array<{
      domain: string
      match_percentage: number
      matching_skills?: string[]
    }>
  }

  job_analysis?: {
    job_matches?: Array<{
      role: string
      domain?: string
      level?: string
      match_percentage: number
      matching_skills?: string[]
      missing_skills?: string[]
    }>
  }

  skill_gap_analysis?: {
    target_role?: string
    target_domain?: string
    skill_gaps?: SkillGap[]
    missing_skills_count?: number
    total_required_skills?: number
  }

  roadmap_analysis?: {
    roadmap?: Array<{
      week: number
      done?: boolean
    }>
  }
}

type RoadmapProgress = {
  week: number
  done: boolean
}

type InterviewResult = {
  overall_score?: number
  technical_score?: number
  relevance_score?: number
  communication_score?: number
  clarity_score?: number
}

function getStudentId(): number | null {
  const stored = localStorage.getItem('student')

  if (!stored) return null

  try {
    const student = JSON.parse(stored)
    const id = Number(student?.student_id ?? student?.id)

    return Number.isFinite(id) && id > 0 ? id : null
  } catch {
    return null
  }
}

function clamp(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)))
}

/* =========================================================
   GLOBAL SETTINGS HELPERS
   ========================================================= */

function applyAppearance(value: string) {
  const root = document.documentElement
  const body = document.body

  root.setAttribute('data-theme', value.toLowerCase())

  if (value === 'Dark') {
    root.classList.add('prepmate-dark')
    body.classList.add('prepmate-dark')
  } else {
    root.classList.remove('prepmate-dark')
    body.classList.remove('prepmate-dark')
  }
}

function applySavedSettings() {
  const savedAppearance =
    localStorage.getItem('prepmate_appearance') || 'System'

  applyAppearance(savedAppearance)
}

/* =========================================================
   PROGRESS PAGE
   ========================================================= */

export function ProgressPage() {
  const [analysis, setAnalysis] =
    useState<Analysis | null>(null)

  const [roadmapProgress, setRoadmapProgress] =
    useState<RoadmapProgress[]>([])

  const [interview, setInterview] =
    useState<InterviewResult | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  useEffect(() => {
    const load = async () => {
      const studentId = getStudentId()

      if (!studentId) {
        setError(
          'Student information is not available.'
        )
        setLoading(false)
        return
      }

      try {
        const response =
          await api.getLatestResume(studentId)

        const currentAnalysis =
          response as Analysis

        setAnalysis(currentAnalysis)

        if (currentAnalysis.id) {
          try {
            const progress =
              await api.getRoadmapProgress(
                studentId,
                currentAnalysis.id
              )

            if (Array.isArray(progress)) {
              setRoadmapProgress(progress)
            }
          } catch {
            setRoadmapProgress([])
          }
        }

        const savedInterview =
          localStorage.getItem(
            `prepmate_interview_result_${studentId}`
          )

        if (savedInterview) {
          try {
            setInterview(
              JSON.parse(savedInterview)
            )
          } catch {
            setInterview(null)
          }
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load progress data.'
        )
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const metrics = useMemo(() => {
    const resume = clamp(
      Number(
        analysis?.resume_score ?? 0
      )
    )

    const domains =
      analysis?.career_analysis
        ?.recommended_domains ?? []

    const career = clamp(
      domains.length
        ? domains.reduce(
            (sum, item) =>
              sum +
              Number(
                item.match_percentage || 0
              ),
            0
          ) / domains.length
        : 0
    )

    const totalRequired =
      Number(
        analysis?.skill_gap_analysis
          ?.total_required_skills ?? 0
      )

    const missing =
      Number(
        analysis?.skill_gap_analysis
          ?.missing_skills_count ?? 0
      )

    const skillCoverage = clamp(
      totalRequired > 0
        ? ((totalRequired - missing) /
            totalRequired) *
            100
        : 0
    )

    const roadmap =
      analysis?.roadmap_analysis
        ?.roadmap ?? []

    const roadmapDone =
      roadmap.filter(item =>
        roadmapProgress.some(
          progress =>
            progress.week === item.week &&
            progress.done
        ) || item.done
      ).length

    const roadmapScore = clamp(
      roadmap.length
        ? (roadmapDone / roadmap.length) *
            100
        : 0
    )

    const interviewScore = clamp(
      Number(
        interview?.overall_score ?? 0
      )
    )

    return {
      resume,
      career,
      skillCoverage,
      roadmapScore,
      interviewScore
    }
  }, [
    analysis,
    roadmapProgress,
    interview
  ])

  const trend = [
    {
      week: 'Resume',
      score: metrics.resume
    },
    {
      week: 'Career',
      score: metrics.career
    },
    {
      week: 'Skills',
      score: metrics.skillCoverage
    },
    {
      week: 'Roadmap',
      score: metrics.roadmapScore
    },
    {
      week: 'Interview',
      score: metrics.interviewScore
    }
  ]

  const radar = [
    {
      area: 'Resume',
      value: metrics.resume
    },
    {
      area: 'Skills',
      value: metrics.skillCoverage
    },
    {
      area: 'Career',
      value: metrics.career
    },
    {
      area: 'Interview',
      value: metrics.interviewScore
    },
    {
      area: 'Roadmap',
      value: metrics.roadmapScore
    }
  ]

  if (loading) {
    return (
      <>
        <PageHeader
          title="Progress & Analytics"
          subtitle="Loading your personalized preparation progress..."
        />

        <Card>
          <p>
            Loading AI-generated progress data...
          </p>
        </Card>
      </>
    )
  }

  if (error) {
    return (
      <>
        <PageHeader
          title="Progress & Analytics"
          subtitle="Your personalized preparation analytics."
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
        title="Progress & Analytics"
        subtitle="Your preparation progress based on your resume, skills, career alignment, roadmap, and interview performance."
      />

      <div className="two-col">
        <Card>
          <h2>Readiness Trend</h2>

          <div className="chart">
            <ResponsiveContainer
              width="100%"
              height={260}
            >
              <LineChart data={trend}>
                <XAxis dataKey="week" />
                <YAxis
                  domain={[0, 100]}
                />
                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="score"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h2>
            Preparation Coverage
          </h2>

          <div className="chart">
            <ResponsiveContainer
              width="100%"
              height={260}
            >
              <RadarChart data={radar}>
                <PolarGrid />
                <PolarAngleAxis
                  dataKey="area"
                />

                <Radar
                  dataKey="value"
                  fillOpacity={0.25}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="card-grid">
        {[
          ['Resume', metrics.resume],
          [
            'Career Alignment',
            metrics.career
          ],
          [
            'Skill Coverage',
            metrics.skillCoverage
          ],
          [
            'Roadmap Progress',
            metrics.roadmapScore
          ],
          [
            'Interview Readiness',
            metrics.interviewScore
          ]
        ].map(([label, value]) => (
          <Card key={String(label)}>
            <div className="section-title">
              <h3>
                {String(label)}
              </h3>

              <b>
                {Number(value)}%
              </b>
            </div>

            <Progress
              value={Number(value)}
            />
          </Card>
        ))}
      </div>
    </>
  )
}

/* =========================================================
   FINAL REPORT
   ========================================================= */

export function Report() {
  const [analysis, setAnalysis] =
    useState<Analysis | null>(null)

  const [studentName, setStudentName] =
    useState('Student')

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  useEffect(() => {
    const load = async () => {
      const studentId =
        getStudentId()

      if (!studentId) {
        setError(
          'Student information is not available.'
        )
        setLoading(false)
        return
      }

      const stored =
        localStorage.getItem(
          'student'
        )

      if (stored) {
        try {
          const student =
            JSON.parse(stored)

          if (student?.name) {
            setStudentName(
              student.name
            )
          }
        } catch {
          // Ignore invalid local profile data.
        }
      }

      try {
        const response =
          await api.getLatestResume(
            studentId
          )

        setAnalysis(
          response as Analysis
        )
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load final report.'
        )
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const reportMetrics =
    useMemo(() => {
      const domains =
        analysis?.career_analysis
          ?.recommended_domains ?? []

      const jobs =
        analysis?.job_analysis
          ?.job_matches ?? []

      const totalRequired =
        Number(
          analysis?.skill_gap_analysis
            ?.total_required_skills ?? 0
        )

      const missing =
        Number(
          analysis?.skill_gap_analysis
            ?.missing_skills_count ?? 0
        )

      const skillCoverage =
        totalRequired > 0
          ? clamp(
              ((totalRequired -
                missing) /
                totalRequired) *
                100
            )
          : 0

      const career =
        domains.length > 0
          ? clamp(
              domains.reduce(
                (sum, item) =>
                  sum +
                  Number(
                    item.match_percentage ||
                      0
                  ),
                0
              ) / domains.length
            )
          : 0

      const jobMatch =
        jobs.length > 0
          ? clamp(
              jobs.reduce(
                (sum, item) =>
                  sum +
                  Number(
                    item.match_percentage ||
                      0
                  ),
                0
              ) / jobs.length
            )
          : 0

      return [
        [
          'Resume',
          clamp(
            Number(
              analysis?.resume_score ?? 0
            )
          )
        ],
        [
          'Career Alignment',
          career
        ],
        [
          'Job Match',
          jobMatch
        ],
        [
          'Skill Coverage',
          skillCoverage
        ]
      ] as const
    }, [analysis])

  const targetRole =
    analysis?.skill_gap_analysis
      ?.target_role ||
    analysis?.job_analysis
      ?.job_matches?.[0]?.role ||
    'Not yet determined by AI'

  const targetDomain =
    analysis?.skill_gap_analysis
      ?.target_domain ||
    analysis?.job_analysis
      ?.job_matches?.[0]?.domain ||
    'Not yet determined by AI'

  const gaps =
    analysis?.skill_gap_analysis
      ?.skill_gaps ?? []

  const topJobs =
    analysis?.job_analysis
      ?.job_matches ?? []

  if (loading) {
    return (
      <>
        <PageHeader
          title="Final Placement Readiness Report"
          subtitle="Loading your personalized AI report..."
        />

        <Card>
          <p>
            Loading report...
          </p>
        </Card>
      </>
    )
  }

  if (error) {
    return (
      <>
        <PageHeader
          title="Final Placement Readiness Report"
          subtitle="Your current AI-generated preparation report."
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
        title="Final Placement Readiness Report"
        subtitle={`AI-generated preparation summary for ${studentName}.`}
      />

      <Card>
        <h2>
          Current Career Direction
        </h2>

        <p>
          <strong>
            Target Role:
          </strong>{' '}
          {targetRole}
        </p>

        <p>
          <strong>
            Target Domain:
          </strong>{' '}
          {targetDomain}
        </p>

        <p>
          This report reflects the latest AI
          analysis of your resume, career
          alignment, job matches, and skill
          coverage.
        </p>
      </Card>

      <div className="card-grid">
        {reportMetrics.map(
          ([label, value]) => (
            <Card key={label}>
              <div className="section-title">
                <h3>{label}</h3>

                <b>
                  {value}%
                </b>
              </div>

              <Progress
                value={value}
              />
            </Card>
          )
        )}
      </div>

      <div className="two-col">
        <Card>
          <h2>
            Current Skill Gaps
          </h2>

          {gaps.length > 0 ? (
            <ul>
              {gaps.map(
                (gap, index) => (
                  <li
                    key={`${gap.skill}-${index}`}
                  >
                    <strong>
                      {gap.skill}
                    </strong>

                    {gap.priority
                      ? ` — ${gap.priority} priority`
                      : ''}
                  </li>
                )
              )}
            </ul>
          ) : (
            <p>
              No unresolved skill gaps were
              identified by the AI.
            </p>
          )}
        </Card>

        <Card>
          <h2>
            AI-Matched Roles
          </h2>

          {topJobs.length > 0 ? (
            <ul>
              {topJobs
                .slice(0, 5)
                .map(
                  (job, index) => (
                    <li
                      key={`${job.role}-${index}`}
                    >
                      <strong>
                        {job.role}
                      </strong>

                      {job.domain
                        ? ` — ${job.domain}`
                        : ''}

                      {` (${clamp(
                        Number(
                          job.match_percentage ||
                            0
                        )
                      )}% match)`}
                    </li>
                  )
                )}
            </ul>
          ) : (
            <p>
              No job matches are available
              yet.
            </p>
          )}
        </Card>
      </div>
    </>
  )
}

/* =========================================================
   SETTINGS
   ========================================================= */

export function Settings() {
  const [notifications, setNotifications] =
    useState(
      localStorage.getItem(
        'prepmate_notifications'
      ) !== 'disabled'
    )

  const [appearance, setAppearance] =
    useState(
      localStorage.getItem(
        'prepmate_appearance'
      ) || 'System'
    )

  /* Apply saved appearance when Settings opens */
  useEffect(() => {
    applySavedSettings()
  }, [])

  /* Listen for settings changes from other
     parts of the application */
  useEffect(() => {
    const handleSettingsChange = () => {
      const savedNotifications =
        localStorage.getItem(
          'prepmate_notifications'
        ) !== 'disabled'

      const savedAppearance =
        localStorage.getItem(
          'prepmate_appearance'
        ) || 'System'

      setNotifications(
        savedNotifications
      )

      setAppearance(
        savedAppearance
      )

      applyAppearance(
        savedAppearance
      )
    }

    window.addEventListener(
      'prepmate-settings-changed',
      handleSettingsChange
    )

    return () => {
      window.removeEventListener(
        'prepmate-settings-changed',
        handleSettingsChange
      )
    }
  }, [])

  const updateNotifications = (
    value: boolean
  ) => {
    setNotifications(value)

    localStorage.setItem(
      'prepmate_notifications',
      value
        ? 'enabled'
        : 'disabled'
    )

    window.dispatchEvent(
      new Event(
        'prepmate-settings-changed'
      )
    )
  }

  const updateAppearance = (
    value: string
  ) => {
    setAppearance(value)

    localStorage.setItem(
      'prepmate_appearance',
      value
    )

    applyAppearance(value)

    window.dispatchEvent(
      new Event(
        'prepmate-settings-changed'
      )
    )
  }

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Manage your PrepMate AI preferences."
      />

      <Card>
        <h2>
          Preferences
        </h2>

        <label>
          Notifications

          <select
            value={
              notifications
                ? 'Enabled'
                : 'Disabled'
            }
            onChange={event =>
              updateNotifications(
                event.target.value ===
                  'Enabled'
              )
            }
          >
            <option>
              Enabled
            </option>

            <option>
              Disabled
            </option>
          </select>
        </label>

        <label>
          Appearance

          <select
            value={appearance}
            onChange={event =>
              updateAppearance(
                event.target.value
              )
            }
          >
            <option>
              System
            </option>

            <option>
              Light
            </option>

            <option>
              Dark
            </option>
          </select>
        </label>

        <p className="notice">
          Your preferences are saved locally
          in this browser.
        </p>
      </Card>
    </>
  )
}