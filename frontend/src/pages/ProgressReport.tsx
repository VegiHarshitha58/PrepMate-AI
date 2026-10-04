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
  PolarAngleAxis,
} from 'recharts'

import { useEffect, useMemo, useState } from 'react'

import { Card, PageHeader, Progress } from '../components/UI'
import { api } from '../services/api'

type SkillGap = {
  skill: string
  status?: string
  priority?: string
  reason?: string
}

type CareerDomain = {
  domain: string
  match_percentage: number
  matching_skills?: string[]
}

type JobMatch = {
  role: string
  domain?: string
  level?: string
  match_percentage: number
  matching_skills?: string[]
  missing_skills?: string[]
  reason?: string
}

type RoadmapItem = {
  week: number
  title?: string
  description?: string
  skill?: string
  done?: boolean
}

type Analysis = {
  id?: number
  analysis_id?: number

  resume_score?: number

  career_analysis?: {
    recommended_domains?: CareerDomain[]
  }

  job_analysis?: {
    job_matches?: JobMatch[]
  }

  skill_gap_analysis?: {
    target_role?: string
    target_domain?: string
    skill_gaps?: SkillGap[]
    missing_skills_count?: number
    total_required_skills?: number
    missing_skills?: unknown[]
    required_skills?: unknown[]
    matched_skills?: unknown[]
    matching_skills?: unknown[]
  }

  roadmap_analysis?: {
    roadmap?: RoadmapItem[]
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
  answered_questions?: number
  total_questions?: number
}

/* =========================================================
   GENERAL HELPERS
   ========================================================= */

function getStudentId(): number | null {
  const stored = localStorage.getItem('student')

  if (!stored) {
    return null
  }

  try {
    const student = JSON.parse(stored)

    const id = Number(
      student?.student_id ??
        student?.id
    )

    return Number.isFinite(id) && id > 0
      ? id
      : null
  } catch {
    return null
  }
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(value)
    )
  )
}

function parseJsonValue<T>(
  value: unknown
): T | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null
  }

  if (
    typeof value === 'object'
  ) {
    return value as T
  }

  if (
    typeof value === 'string'
  ) {
    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  }

  return null
}

function uniqueStrings(
  values: unknown[]
): string[] {
  return Array.from(
    new Set(
      values
        .map(value => {
          if (
            typeof value === 'string'
          ) {
            return value.trim()
          }

          if (
            value &&
            typeof value === 'object'
          ) {
            const item =
              value as Record<
                string,
                unknown
              >

            return String(
              item.skill ??
                item.name ??
                item.title ??
                ''
            ).trim()
          }

          return ''
        })
        .filter(Boolean)
    )
  )
}

/* =========================================================
   SKILL COVERAGE
   ========================================================= */

function calculateSkillCoverage(
  skillGap:
    | Analysis['skill_gap_analysis']
    | undefined,
  jobs: JobMatch[]
): number {
  if (!skillGap) {
    return 0
  }

  /*
   * First use the explicit counts generated
   * by the Skill Gap Agent.
   */

  const required = Number(
    skillGap.total_required_skills
  )

  const missing = Number(
    skillGap.missing_skills_count
  )

  if (
    Number.isFinite(required) &&
    required > 0
  ) {
    const safeMissing =
      Number.isFinite(missing)
        ? Math.max(
            0,
            Math.min(
              required,
              missing
            )
          )
        : 0

    return clamp(
      (
        (required - safeMissing) /
        required
      ) * 100
    )
  }

  /*
   * Fallback: calculate coverage from
   * the actual skill-gap and job data.
   */

  const gaps =
    Array.isArray(
      skillGap.skill_gaps
    )
      ? skillGap.skill_gaps
      : []

  const missingFromGaps =
    gaps
      .filter(gap =>
        String(
          gap.status ?? ''
        )
          .toLowerCase()
          .includes('missing')
      )
      .map(
        gap => gap.skill
      )

  const matchedSkills =
    uniqueStrings(
      jobs.flatMap(job =>
        Array.isArray(
          job.matching_skills
        )
          ? job.matching_skills
          : []
      )
    )

  const missingSkills =
    uniqueStrings([
      ...missingFromGaps,

      ...jobs.flatMap(job =>
        Array.isArray(
          job.missing_skills
        )
          ? job.missing_skills
          : []
      )
    ])

  const missingOnly =
    missingSkills.filter(
      skill =>
        !matchedSkills.some(
          matched =>
            matched.toLowerCase() ===
            skill.toLowerCase()
        )
    )

  const total =
    matchedSkills.length +
    missingOnly.length

  if (total > 0) {
    return clamp(
      (
        matchedSkills.length /
        total
      ) * 100
    )
  }

  if (
    gaps.length === 0 &&
    missingSkills.length === 0
  ) {
    return 100
  }

  return 0
}

/* =========================================================
   INTERVIEW RESULT
   ========================================================= */

function findInterviewResult(
  studentId: number
): InterviewResult | null {
  const keys = [
    `prepmate_interview_result_${studentId}`,
    ...Object.keys(
      localStorage
    ).filter(key =>
      key
        .toLowerCase()
        .includes('interview')
    )
  ]

  const checkedKeys =
    new Set<string>()

  for (const key of keys) {
    if (
      checkedKeys.has(key)
    ) {
      continue
    }

    checkedKeys.add(key)

    const raw =
      localStorage.getItem(key)

    if (!raw) {
      continue
    }

    try {
      const parsed =
        JSON.parse(raw)

      const candidates = [
        parsed,
        parsed?.evaluation,
        parsed?.result,
        parsed?.data,
        parsed?.data?.evaluation,
        parsed?.data?.result
      ]

      for (
        const candidate of
        candidates
      ) {
        if (
          !candidate ||
          typeof candidate !==
            'object'
        ) {
          continue
        }

        if (
          !Number.isFinite(
            Number(
              candidate.overall_score
            )
          )
        ) {
          continue
        }

        return {
          overall_score:
            Number(
              candidate.overall_score
            ),

          technical_score:
            Number(
              candidate.technical_score ??
                0
            ),

          relevance_score:
            Number(
              candidate.relevance_score ??
                0
            ),

          communication_score:
            Number(
              candidate.communication_score ??
                0
            ),

          clarity_score:
            Number(
              candidate.clarity_score ??
                0
            ),

          answered_questions:
            Number(
              candidate.answered_questions ??
                0
            ),

          total_questions:
            Number(
              candidate.total_questions ??
                0
            )
        }
      }
    } catch {
      continue
    }
  }

  return null
}

/* =========================================================
   LOAD LATEST ANALYSIS
   ========================================================= */

async function loadLatestAnalysis(
  studentId: number
): Promise<Analysis> {
  const response =
    await api.getLatestResume(
      studentId
    )

  const raw =
    response as Record<
      string,
      unknown
    >

  const analysisId =
    Number(
      raw.analysis_id ??
        raw.id ??
        0
    ) || undefined

  return {
    id: analysisId,

    analysis_id:
      analysisId,

    resume_score:
      Number(
        raw.resume_score ??
          0
      ),

    career_analysis:
      parseJsonValue(
        raw.career_analysis
      ) ?? undefined,

    job_analysis:
      parseJsonValue(
        raw.job_analysis
      ) ?? undefined,

    skill_gap_analysis:
      parseJsonValue(
        raw.skill_gap_analysis
      ) ?? undefined,

    roadmap_analysis:
      parseJsonValue(
        raw.roadmap_analysis
      ) ?? undefined
  }
}

/* =========================================================
   SETTINGS HELPERS
   ========================================================= */

function applyAppearance(
  value: string
) {
  const root =
    document.documentElement

  const body =
    document.body

  root.setAttribute(
    'data-theme',
    value.toLowerCase()
  )

  if (value === 'Dark') {
    root.classList.add(
      'prepmate-dark'
    )

    body.classList.add(
      'prepmate-dark'
    )
  } else {
    root.classList.remove(
      'prepmate-dark'
    )

    body.classList.remove(
      'prepmate-dark'
    )
  }
}

function applySavedSettings() {
  const appearance =
    localStorage.getItem(
      'prepmate_appearance'
    ) || 'System'

  applyAppearance(
    appearance
  )
}

/* =========================================================
   PROGRESS PAGE
   ========================================================= */

export function ProgressPage() {
  const [
    analysis,
    setAnalysis
  ] = useState<
    Analysis | null
  >(null)

  const [
    roadmapProgress,
    setRoadmapProgress
  ] = useState<
    RoadmapProgress[]
  >([])

  const [
    interview,
    setInterview
  ] = useState<
    InterviewResult | null
  >(null)

  const [
    loading,
    setLoading
  ] = useState(true)

  const [
    error,
    setError
  ] = useState('')

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

      try {
        /*
         * LOAD LATEST ANALYSIS
         */

        const currentAnalysis =
          await loadLatestAnalysis(
            studentId
          )

        setAnalysis(
          currentAnalysis
        )

        /*
         * LOAD ROADMAP PROGRESS
         */

        const analysisId =
          Number(
            currentAnalysis.analysis_id ??
              currentAnalysis.id ??
              0
          )

        if (analysisId > 0) {
          try {
            const response =
              await api.getRoadmapProgress(
                studentId,
                analysisId
              )

            let items:
              unknown[] = []

            if (
              Array.isArray(
                response
              )
            ) {
              items =
                response
            } else if (
              response &&
              typeof response ===
                'object'
            ) {
              const object =
                response as Record<
                  string,
                  unknown
                >

              if (
                Array.isArray(
                  object.progress
                )
              ) {
                items =
                  object.progress
              } else if (
                Array.isArray(
                  object.data
                )
              ) {
                items =
                  object.data
              } else if (
                Array.isArray(
                  object.items
                )
              ) {
                items =
                  object.items
              }
            }

            const normalized =
              items
                .map(item => {
                  if (
                    !item ||
                    typeof item !==
                      'object'
                  ) {
                    return null
                  }

                  const value =
                    item as Record<
                      string,
                      unknown
                    >

                  return {
                    week:
                      Number(
                        value.week ??
                          value.week_number ??
                          0
                      ),

                    done:
                      value.done ===
                        true ||
                      value.done ===
                        1 ||
                      value.done ===
                        'true'
                  }
                })
                .filter(
                  (
                    item
                  ): item is RoadmapProgress =>
                    item !== null &&
                    item.week > 0
                )

            setRoadmapProgress(
              normalized
            )
          } catch {
            setRoadmapProgress(
              []
            )
          }
        }

        /*
         * LOAD INTERVIEW
         */

        setInterview(
          findInterviewResult(
            studentId
          )
        )
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

  /*
   * METRICS
   */

  const metrics =
    useMemo(() => {
      const resume =
        clamp(
          Number(
            analysis?.resume_score ??
              0
          )
        )

      const domains =
        analysis
          ?.career_analysis
          ?.recommended_domains ??
        []

      const jobs =
        analysis
          ?.job_analysis
          ?.job_matches ??
        []

      const career =
        domains.length > 0
          ? clamp(
              domains.reduce(
                (
                  sum,
                  item
                ) =>
                  sum +
                  Number(
                    item.match_percentage ??
                      0
                  ),
                0
              ) /
                domains.length
            )
          : 0

      const skillCoverage =
        calculateSkillCoverage(
          analysis
            ?.skill_gap_analysis,
          jobs
        )

      const roadmap =
        analysis
          ?.roadmap_analysis
          ?.roadmap ??
        []

      const roadmapDone =
        roadmap.filter(
          item => {
            const saved =
              roadmapProgress.find(
                progress =>
                  Number(
                    progress.week
                  ) ===
                    Number(
                      item.week
                    )
              )

            return Boolean(
              saved?.done ||
                item.done
            )
          }
        ).length

      const roadmapScore =
        roadmap.length > 0
          ? clamp(
              (
                roadmapDone /
                roadmap.length
              ) * 100
            )
          : 0

      const interviewScore =
        clamp(
          Number(
            interview?.overall_score ??
              0
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

  if (loading) {
    return (
      <>
        <PageHeader
          title="Progress & Analytics"
          subtitle="Loading your personalized preparation progress..."
        />

        <Card>
          <p>
            Loading AI-generated
            progress data...
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
      score:
        metrics.skillCoverage
    },
    {
      week: 'Roadmap',
      score:
        metrics.roadmapScore
    },
    {
      week: 'Interview',
      score:
        metrics.interviewScore
    }
  ]

  const radar = [
    {
      area: 'Resume',
      value: metrics.resume
    },
    {
      area: 'Skills',
      value:
        metrics.skillCoverage
    },
    {
      area: 'Career',
      value: metrics.career
    },
    {
      area: 'Interview',
      value:
        metrics.interviewScore
    },
    {
      area: 'Roadmap',
      value:
        metrics.roadmapScore
    }
  ]

  const cards = [
    [
      'Resume',
      metrics.resume
    ],
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
  ] as const

  return (
    <>
      <PageHeader
        title="Progress & Analytics"
        subtitle="Your preparation progress based on your resume, skills, career alignment, roadmap, and interview performance."
      />

      <div className="two-col">
        <Card>
          <h2>
            Readiness Trend
          </h2>

          <div className="chart">
            <ResponsiveContainer
              width="100%"
              height={260}
            >
              <LineChart
                data={trend}
              >
                <XAxis
                  dataKey="week"
                />

                <YAxis
                  domain={[
                    0,
                    100
                  ]}
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
              <RadarChart
                data={radar}
              >
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
        {cards.map(
          ([label, value]) => (
            <Card
              key={label}
            >
              <div className="section-title">
                <h3>
                  {label}
                </h3>

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

      {interview && (
        <Card>
          <h2>
            Interview Evaluation
          </h2>

          <div className="card-grid">
            <div>
              <strong>
                Overall
              </strong>

              <p>
                {clamp(
                  Number(
                    interview.overall_score ??
                      0
                  )
                )}
                %
              </p>
            </div>

            <div>
              <strong>
                Technical
              </strong>

              <p>
                {clamp(
                  Number(
                    interview.technical_score ??
                      0
                  )
                )}
                %
              </p>
            </div>

            <div>
              <strong>
                Relevance
              </strong>

              <p>
                {clamp(
                  Number(
                    interview.relevance_score ??
                      0
                  )
                )}
                %
              </p>
            </div>

            <div>
              <strong>
                Communication
              </strong>

              <p>
                {clamp(
                  Number(
                    interview.communication_score ??
                      0
                  )
                )}
                %
              </p>
            </div>
          </div>
        </Card>
      )}
    </>
  )
}

/* =========================================================
   FINAL REPORT
   ========================================================= */

export function Report() {
  const [
    analysis,
    setAnalysis
  ] = useState<
    Analysis | null
  >(null)

  const [
    studentName,
    setStudentName
  ] = useState('Student')

  const [
    interview,
    setInterview
  ] = useState<
    InterviewResult | null
  >(null)

  const [
    loading,
    setLoading
  ] = useState(true)

  const [
    error,
    setError
  ] = useState('')

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

          setStudentName(
            student?.name ||
              student?.student_name ||
              'Student'
          )
        } catch {
          setStudentName(
            'Student'
          )
        }
      }

      try {
        const currentAnalysis =
          await loadLatestAnalysis(
            studentId
          )

        setAnalysis(
          currentAnalysis
        )

        setInterview(
          findInterviewResult(
            studentId
          )
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
        analysis
          ?.career_analysis
          ?.recommended_domains ??
        []

      const jobs =
        analysis
          ?.job_analysis
          ?.job_matches ??
        []

      const career =
        domains.length > 0
          ? clamp(
              domains.reduce(
                (
                  sum,
                  item
                ) =>
                  sum +
                  Number(
                    item.match_percentage ??
                      0
                  ),
                0
              ) /
                domains.length
            )
          : 0

      const jobMatch =
        jobs.length > 0
          ? clamp(
              jobs.reduce(
                (
                  sum,
                  item
                ) =>
                  sum +
                  Number(
                    item.match_percentage ??
                      0
                  ),
                0
              ) /
                jobs.length
            )
          : 0

      const skillCoverage =
        calculateSkillCoverage(
          analysis
            ?.skill_gap_analysis,
          jobs
        )

      const interviewScore =
        clamp(
          Number(
            interview?.overall_score ??
              0
          )
        )

      return [
        [
          'Resume',
          clamp(
            Number(
              analysis?.resume_score ??
                0
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
        ],
        [
          'Interview Readiness',
          interviewScore
        ]
      ] as const
    }, [
      analysis,
      interview
    ])

  const targetRole =
    analysis
      ?.skill_gap_analysis
      ?.target_role ||
    analysis
      ?.job_analysis
      ?.job_matches?.[0]
      ?.role ||
    'Not yet determined by AI'

  const targetDomain =
    analysis
      ?.skill_gap_analysis
      ?.target_domain ||
    analysis
      ?.job_analysis
      ?.job_matches?.[0]
      ?.domain ||
    'Not yet determined by AI'

  const gaps =
    analysis
      ?.skill_gap_analysis
      ?.skill_gaps ??
    []

  const topJobs =
    analysis
      ?.job_analysis
      ?.job_matches ??
    []

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
          This report reflects
          the latest AI analysis
          of your resume, career
          alignment, job matches,
          skill coverage, and
          interview preparation.
        </p>
      </Card>

      <div className="card-grid">
        {reportMetrics.map(
          ([label, value]) => (
            <Card
              key={label}
            >
              <div className="section-title">
                <h3>
                  {label}
                </h3>

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

      {interview && (
        <Card>
          <h2>
            Interview Evaluation
          </h2>

          <div className="card-grid">
            <div>
              <strong>
                Overall
              </strong>

              <p>
                {clamp(
                  Number(
                    interview.overall_score ??
                      0
                  )
                )}
                %
              </p>
            </div>

            <div>
              <strong>
                Technical
              </strong>

              <p>
                {clamp(
                  Number(
                    interview.technical_score ??
                      0
                  )
                )}
                %
              </p>
            </div>

            <div>
              <strong>
                Relevance
              </strong>

              <p>
                {clamp(
                  Number(
                    interview.relevance_score ??
                      0
                  )
                )}
                %
              </p>
            </div>

            <div>
              <strong>
                Communication
              </strong>

              <p>
                {clamp(
                  Number(
                    interview.communication_score ??
                      0
                  )
                )}
                %
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="two-col">
        <Card>
          <h2>
            Current Skill Gaps
          </h2>

          {gaps.length > 0 ? (
            <ul>
              {gaps.map(
                (
                  gap,
                  index
                ) => (
                  <li
                    key={`${gap.skill}-${index}`}
                  >
                    <strong>
                      {gap.skill}
                    </strong>

                    {gap.priority
                      ? ` — ${gap.priority} priority`
                      : ''}

                    {gap.status
                      ? ` · ${gap.status}`
                      : ''}
                  </li>
                )
              )}
            </ul>
          ) : (
            <p>
              No unresolved skill
              gaps were identified
              by the AI.
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
                  (
                    job,
                    index
                  ) => (
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
                          job.match_percentage ??
                            0
                        )
                      )}% match)`}
                    </li>
                  )
                )}
            </ul>
          ) : (
            <p>
              No job matches are
              available yet.
            </p>
          )}
        </Card>
      </div>

      <Card>
        <h2>
          Placement Preparation Status
        </h2>

        <p>
          Your current preparation
          data has been generated
          from the AI pipeline using
          your resume, career
          direction, job matches,
          skill gaps, roadmap and
          interview evaluation.
        </p>

        {interview ? (
          <p>
            <strong>
              Interview evaluation:
            </strong>{' '}

            {clamp(
              Number(
                interview.overall_score ??
                  0
              )
            )}
            % overall.
          </p>
        ) : (
          <p>
            Complete a mock interview
            to add interview readiness
            to this report.
          </p>
        )}
      </Card>
    </>
  )
}

/* =========================================================
   SETTINGS
   ========================================================= */

export function Settings() {
  const [
    notifications,
    setNotifications
  ] = useState(
    localStorage.getItem(
      'prepmate_notifications'
    ) !== 'disabled'
  )

  const [
    appearance,
    setAppearance
  ] = useState(
    localStorage.getItem(
      'prepmate_appearance'
    ) || 'System'
  )

  useEffect(() => {
    applySavedSettings()
  }, [])

  useEffect(() => {
    const handleSettingsChange =
      () => {
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

  const updateNotifications =
    (
      value: boolean
    ) => {
      setNotifications(
        value
      )

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

  const updateAppearance =
    (
      value: string
    ) => {
      setAppearance(
        value
      )

      localStorage.setItem(
        'prepmate_appearance',
        value
      )

      applyAppearance(
        value
      )

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
            value={
              appearance
            }
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
          Your preferences are saved
          locally in this browser.
        </p>
      </Card>
    </>
  )
}