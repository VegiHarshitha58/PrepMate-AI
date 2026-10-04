import { useEffect, useState, type ChangeEvent } from 'react'
import {
  Badge,
  Button,
  Card,
  PageHeader,
  Progress,
} from '../components/UI'
import { UploadCloud, WandSparkles } from 'lucide-react'
import { api } from '../services/api'

type ResumeAnalysis = {
  candidate_email: string | null
  candidate_phone: string | null
  candidate_name?: string | null
  name?: string | null
  summary?: string | null
  professional_summary?: string | null
  profile?: string | null
  objective?: string | null
  skills: string[]
  education: unknown[]
  projects?: unknown[]
  experience?: unknown[]
  certifications?: unknown[]
  achievements?: unknown[]
  detected_sections: string[]
  resume_score: number
  word_count: number
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
  }[]
  missing_skills_count: number
  total_required_skills: number
}

type ResumeOptimization = {
  resume_score: number
  suggestions: string[]
  warnings: string[]
  detected_skills: string[]
  detected_sections: string[]
}

type ResumeRewrite = {
  original: string
  improved: string
}

type ResumeResponse = {
  analysis_id?: number
  filename?: string
  resume_analysis?: ResumeAnalysis
  career_analysis?: CareerAnalysis
  job_analysis?: JobAnalysis
  skill_gap_analysis?: SkillGapAnalysis
}

type LatestResumeResponse = {
  analysis_id: number
  student_id: number
  filename?: string | null
  candidate_email: string | null
  candidate_phone: string | null
  resume_score: number
  word_count: number
  skills: string[]
  education: unknown[]
  detected_sections: string[]
  career_analysis?: CareerAnalysis
  job_analysis?: JobAnalysis
  skill_gap_analysis?: SkillGapAnalysis
  roadmap_analysis?: unknown
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

function textValue(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number') return String(value)
  return ''
}

function objectValue(
  item: Record<string, unknown>,
  keys: string[]
): string {
  for (const key of keys) {
    const value = textValue(item[key])
    if (value) return value
  }

  return ''
}

/*
 * Converts education returned by the resume parser into readable text.
 *
 * Handles both:
 * 1. Actual objects:
 *    { degree: "...", field: "...", institution: "..." }
 *
 * 2. Python-style strings:
 *    "{'degree': '...', 'field': '...'}"
 */
function formatEducationItem(item: unknown): string {
  if (typeof item === 'string') {
    const trimmed = item.trim()

    if (!trimmed) return ''

    try {
      const jsonLike = trimmed
        .replace(/'/g, '"')
        .replace(/\bNone\b/g, 'null')
        .replace(/\bTrue\b/g, 'true')
        .replace(/\bFalse\b/g, 'false')

      const parsed = JSON.parse(jsonLike)

      if (
        parsed &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed)
      ) {
        return formatEducationItem(parsed)
      }
    } catch {
      // Keep normal string education text unchanged.
    }

    return trimmed
  }

  if (
    !item ||
    typeof item !== 'object' ||
    Array.isArray(item)
  ) {
    return ''
  }

  const value = item as Record<string, unknown>

  const degree = objectValue(value, [
    'degree',
    'qualification',
    'program',
  ])

  const field = objectValue(value, [
    'field',
    'specialization',
    'major',
  ])

  const institution = objectValue(value, [
    'institution',
    'college',
    'university',
    'school',
  ])

  const date = objectValue(value, [
    'date',
    'year',
    'duration',
    'graduation_year',
  ])

  const gpa = objectValue(value, [
    'gpa',
    'cgpa',
    'grade',
  ])

  const firstLine = [degree, field]
    .filter(Boolean)
    .join(' — ')

  const secondLine = [
    institution,
    date,
    gpa ? `GPA: ${gpa}` : '',
  ]
    .filter(Boolean)
    .join(' · ')

  return [firstLine, secondLine]
    .filter(Boolean)
    .join(' | ')
}

function formatProjectItem(item: unknown): string {
  if (typeof item === 'string') {
    return item.trim()
  }

  if (
    !item ||
    typeof item !== 'object' ||
    Array.isArray(item)
  ) {
    return ''
  }

  const value = item as Record<string, unknown>

  const title = objectValue(value, [
    'name',
    'title',
    'project',
    'project_name',
  ])

  const description = objectValue(value, [
    'description',
    'details',
    'summary',
    'about',
  ])

  const technologyValue =
    value.technologies ??
    value.technology ??
    value.tech_stack ??
    value.techStack

  const technologies = Array.isArray(technologyValue)
    ? technologyValue
        .map(textValue)
        .filter(Boolean)
        .join(', ')
    : textValue(technologyValue)

  return [
    title,
    description,
    technologies
      ? `Technologies: ${technologies}`
      : '',
  ]
    .filter(Boolean)
    .join(' — ')
}

function extractResumeSummary(
  analysis: ResumeAnalysis | null
): string {
  if (!analysis) return ''

  const candidates = [
    analysis.summary,
    analysis.professional_summary,
    analysis.profile,
    analysis.objective,
  ]

  for (const candidate of candidates) {
    const value = textValue(candidate)

    if (value) return value
  }

  return ''
}

function extractProjectDescription(
  analysis: ResumeAnalysis | null
): string {
  if (
    !analysis ||
    !Array.isArray(analysis.projects)
  ) {
    return ''
  }

  return analysis.projects
    .map(formatProjectItem)
    .filter(Boolean)
    .join('\n\n')
}

function getResumeCandidateName(
  analysis: ResumeAnalysis | null
): string {
  if (!analysis) return ''

  return (
    textValue(analysis.candidate_name) ||
    textValue(analysis.name)
  )
}

function restoreBuilderFromResume(
  analysis: ResumeAnalysis | null,
  setSummary: (value: string) => void,
  setProjectDescription: (value: string) => void
) {
  setSummary(extractResumeSummary(analysis))
  setProjectDescription(
    extractProjectDescription(analysis)
  )
}

function mergeLatestWithStored(
  response: LatestResumeResponse,
  stored: ResumeAnalysis | null,
  storedAnalysisId: string | null
): ResumeAnalysis {
  const sameAnalysis =
    !!stored &&
    !!storedAnalysisId &&
    String(response.analysis_id) ===
      String(storedAnalysisId)

  return {
    candidate_email:
      response.candidate_email ?? null,

    candidate_phone:
      response.candidate_phone ?? null,

    candidate_name: sameAnalysis
      ? stored?.candidate_name
      : null,

    name: sameAnalysis
      ? stored?.name
      : null,

    summary: sameAnalysis
      ? stored?.summary
      : '',

    professional_summary: sameAnalysis
      ? stored?.professional_summary
      : '',

    profile: sameAnalysis
      ? stored?.profile
      : '',

    objective: sameAnalysis
      ? stored?.objective
      : '',

    skills: response.skills ?? [],

    education: response.education ?? [],

    projects: sameAnalysis
      ? stored?.projects
      : [],

    experience: sameAnalysis
      ? stored?.experience
      : [],

    certifications: sameAnalysis
      ? stored?.certifications
      : [],

    achievements: sameAnalysis
      ? stored?.achievements
      : [],

    detected_sections:
      response.detected_sections ?? [],

    resume_score:
      response.resume_score ?? 0,

    word_count:
      response.word_count ?? 0,
  }
}

export default function Resume() {
  const [tab, setTab] = useState<
    'upload' | 'analysis' | 'builder'
  >('upload')

  const [file, setFile] =
    useState<File | null>(null)

  const [resumeFileName, setResumeFileName] =
    useState('')

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState('')

  const [resumeAnalysis, setResumeAnalysis] =
    useState<ResumeAnalysis | null>(null)

  const [careerAnalysis, setCareerAnalysis] =
    useState<CareerAnalysis | null>(null)

  const [jobAnalysis, setJobAnalysis] =
    useState<JobAnalysis | null>(null)

  const [skillGapAnalysis, setSkillGapAnalysis] =
    useState<SkillGapAnalysis | null>(null)

  const [optimization, setOptimization] =
    useState<ResumeOptimization | null>(null)

  const [optimizerLoading, setOptimizerLoading] =
    useState(false)

  const [optimizerError, setOptimizerError] =
    useState('')

  const [summary, setSummary] =
    useState('')

  const [projectDescription, setProjectDescription] =
    useState('')

  const [saveMessage, setSaveMessage] =
    useState('')

  const [rewriteLoading, setRewriteLoading] =
    useState(false)

  const [rewriteMessage, setRewriteMessage] =
    useState('')

  const [studentName, setStudentName] =
    useState('Student')

  useEffect(() => {
    const loadResumeData = async () => {
      const storedStudent =
        localStorage.getItem('student')

      let studentId: number | null = null

      if (storedStudent) {
        try {
          const student =
            JSON.parse(storedStudent)

          setStudentName(
            student?.name ||
              student?.student_name ||
              'Student'
          )

          const id = Number(
            student?.student_id ??
              student?.id
          )

          if (
            Number.isFinite(id) &&
            id > 0
          ) {
            studentId = id
          }
        } catch {
          setStudentName('Student')
        }
      }

      let storedResumeAnalysis:
        ResumeAnalysis | null = null

      const storedAnalysisId =
        localStorage.getItem(
          'resumeAnalysisId'
        )

      const storedResume =
        localStorage.getItem(
          'resumeAnalysis'
        )

      if (storedResume) {
        try {
          storedResumeAnalysis =
            JSON.parse(
              storedResume
            ) as ResumeAnalysis

          setResumeAnalysis(
            storedResumeAnalysis
          )

          restoreBuilderFromResume(
            storedResumeAnalysis,
            setSummary,
            setProjectDescription
          )
        } catch {
          storedResumeAnalysis = null
        }
      }

      /*
       * Restore manually saved Builder content
       * only when it belongs to the same resume.
       */
      const savedBuilder =
        localStorage.getItem(
          'resumeBuilder'
        )

      if (savedBuilder) {
        try {
          const builder =
            JSON.parse(savedBuilder)

          if (
            builder?.analysisId &&
            storedAnalysisId &&
            String(
              builder.analysisId
            ) ===
              String(
                storedAnalysisId
              )
          ) {
            if (
              typeof builder?.summary ===
              'string'
            ) {
              setSummary(
                builder.summary
              )
            }

            if (
              typeof builder?.projectDescription ===
              'string'
            ) {
              setProjectDescription(
                builder.projectDescription
              )
            }
          }
        } catch {
          // Ignore invalid saved Builder data.
        }
      }

      if (!studentId) return

      try {
        const response =
          await api.getLatestResume(
            studentId
          ) as LatestResumeResponse

        const merged =
          mergeLatestWithStored(
            response,
            storedResumeAnalysis,
            storedAnalysisId
          )

        setResumeFileName(
          response.filename || ''
        )

        setResumeAnalysis(merged)

        setCareerAnalysis(
          response.career_analysis ??
            null
        )

        setJobAnalysis(
          response.job_analysis ??
            null
        )

        setSkillGapAnalysis(
          response.skill_gap_analysis ??
            null
        )

        localStorage.setItem(
          'resumeAnalysisId',
          String(
            response.analysis_id
          )
        )

        localStorage.setItem(
          'resumeFileName',
          response.filename || ''
        )

        localStorage.setItem(
          'resumeAnalysis',
          JSON.stringify(merged)
        )

        localStorage.setItem(
          'careerAnalysis',
          JSON.stringify(
            response.career_analysis ??
              null
          )
        )

        localStorage.setItem(
          'jobAnalysis',
          JSON.stringify(
            response.job_analysis ??
              null
          )
        )

        localStorage.setItem(
          'skillGapAnalysis',
          JSON.stringify(
            response.skill_gap_analysis ??
              null
          )
        )

        setTab('analysis')
      } catch (err) {
        if (
          err instanceof Error &&
          err.message
            .toLowerCase()
            .includes(
              'no resume analysis found'
            )
        ) {
          return
        }

        console.error(
          'Failed to load latest resume:',
          err
        )
      }
    }

    loadResumeData()
  }, [])

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile =
      event.target.files?.[0]

    if (!selectedFile) return

    if (
      selectedFile.type !==
      'application/pdf'
    ) {
      setError(
        'Please upload a PDF resume.'
      )

      setFile(null)
      return
    }

    setError('')
    setFile(selectedFile)
    setResumeFileName(
      selectedFile.name
    )
  }

  const handleAnalyze = async () => {
    if (!file) {
      setError(
        'Please select a PDF resume first.'
      )

      return
    }

    const studentId =
      getStudentId()

    if (!studentId) {
      setError(
        'Please login before uploading your resume.'
      )

      return
    }

    setLoading(true)
    setError('')

    try {
      const data =
        await api.uploadResume(
          file,
          studentId
        ) as ResumeResponse

      if (!data.resume_analysis) {
        throw new Error(
          'Resume analysis was not returned by the backend.'
        )
      }

      const filename =
        data.filename ||
        file.name

      setResumeFileName(filename)

      setResumeAnalysis(
        data.resume_analysis
      )

      /*
       * A new resume must never inherit
       * Builder content from an older resume.
       */
      localStorage.removeItem(
        'resumeBuilder'
      )

      restoreBuilderFromResume(
        data.resume_analysis,
        setSummary,
        setProjectDescription
      )

      setCareerAnalysis(
        data.career_analysis ??
          null
      )

      setJobAnalysis(
        data.job_analysis ??
          null
      )

      setSkillGapAnalysis(
        data.skill_gap_analysis ??
          null
      )

      if (data.analysis_id) {
        localStorage.setItem(
          'resumeAnalysisId',
          String(
            data.analysis_id
          )
        )
      }

      localStorage.setItem(
        'resumeFileName',
        filename
      )

      localStorage.setItem(
        'resumeAnalysis',
        JSON.stringify(
          data.resume_analysis
        )
      )

      localStorage.setItem(
        'careerAnalysis',
        JSON.stringify(
          data.career_analysis ??
            null
        )
      )

      localStorage.setItem(
        'jobAnalysis',
        JSON.stringify(
          data.job_analysis ??
            null
        )
      )

      localStorage.setItem(
        'skillGapAnalysis',
        JSON.stringify(
          data.skill_gap_analysis ??
            null
        )
      )

      setOptimization(null)
      setOptimizerError('')
      setRewriteMessage('')
      setSaveMessage('')
      setTab('analysis')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while analyzing the resume.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleOptimize = async () => {
    const storedAnalysisId =
      localStorage.getItem(
        'resumeAnalysisId'
      )

    const analysisId =
      Number(storedAnalysisId)

    if (
      !Number.isFinite(analysisId) ||
      analysisId <= 0
    ) {
      setOptimizerError(
        'Please upload and analyze your resume first.'
      )

      return
    }

    setOptimizerLoading(true)
    setOptimizerError('')
    setSaveMessage('')

    try {
      const response =
        await api.optimizeResume(
          analysisId
        ) as {
          optimization?:
            ResumeOptimization
        }

      if (!response.optimization) {
        throw new Error(
          'Resume optimization was not returned by the backend.'
        )
      }

      setOptimization(
        response.optimization
      )
    } catch (err) {
      setOptimizerError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while optimizing the resume.'
      )
    } finally {
      setOptimizerLoading(false)
    }
  }

  const handleImproveSummary = async () => {
    const storedAnalysisId =
      localStorage.getItem(
        'resumeAnalysisId'
      )

    const analysisId =
      Number(storedAnalysisId)

    if (
      !Number.isFinite(analysisId) ||
      analysisId <= 0
    ) {
      setOptimizerError(
        'Please upload and analyze your resume first.'
      )

      return
    }

    if (!summary.trim()) {
      setOptimizerError(
        'Please enter a professional summary first.'
      )

      return
    }

    setRewriteLoading(true)
    setOptimizerError('')
    setRewriteMessage('')

    try {
      const response =
        await api.rewriteSummary(
          summary.trim(),
          analysisId
        ) as {
          result?: ResumeRewrite
        }

      if (
        !response.result?.improved
      ) {
        throw new Error(
          'Improved summary was not returned by the backend.'
        )
      }

      setSummary(
        response.result.improved
      )

      setRewriteMessage(
        'Summary improved successfully.'
      )
    } catch (err) {
      setOptimizerError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while improving the summary.'
      )
    } finally {
      setRewriteLoading(false)
    }
  }

  const handleSave = () => {
    const analysisId =
      Number(
        localStorage.getItem(
          'resumeAnalysisId'
        )
      )

    localStorage.setItem(
      'resumeBuilder',
      JSON.stringify({
        analysisId:
          Number.isFinite(
            analysisId
          ) &&
          analysisId > 0
            ? analysisId
            : null,

        summary,

        projectDescription,
      })
    )

    setSaveMessage(
      'Resume changes saved locally.'
    )
  }

  const displayedSkills =
    optimization?.detected_skills?.length
      ? optimization.detected_skills
      : resumeAnalysis?.skills ?? []

  return (
    <>
      <PageHeader
        title="Resume"
        subtitle="Upload, analyze and improve your resume for target roles."
      />

      <div className="tabs">
        {(
          [
            'upload',
            'analysis',
            'builder',
          ] as const
        ).map(currentTab => (
          <button
            key={currentTab}
            className={
              tab === currentTab
                ? 'active'
                : ''
            }
            onClick={() =>
              setTab(currentTab)
            }
          >
            {currentTab === 'builder'
              ? 'Builder / Optimizer'
              : currentTab[0].toUpperCase() +
                currentTab.slice(1)}
          </button>
        ))}
      </div>

      {/* =========================
          UPLOAD
      ========================== */}

      {tab === 'upload' && (
        <Card>
          <div className="drop">
            <UploadCloud size={42} />

            <h2>
              Upload your resume
            </h2>

            <p>
              PDF only · AI-powered resume analysis
            </p>

            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={
                handleFileChange
              }
            />

            {resumeFileName && (
              <p>
                <strong>
                  Selected:
                </strong>{' '}
                {file?.name ||
                  resumeFileName}
              </p>
            )}

            {error && (
              <p className="notice">
                {error}
              </p>
            )}

            <Button
              onClick={handleAnalyze}
              disabled={
                loading || !file
              }
            >
              {loading
                ? 'Analyzing...'
                : 'Analyze Resume'}
            </Button>

            {resumeAnalysis &&
              !file && (
                <p className="notice">
                  A previously analyzed resume
                  is already available. Open the
                  Analysis tab to view it, or
                  choose a new PDF to replace it.
                </p>
              )}
          </div>
        </Card>
      )}

      {/* =========================
          ANALYSIS
      ========================== */}

      {tab === 'analysis' && (
        <>
          {!resumeAnalysis ? (
            <Card>
              <h2>
                No resume analyzed yet
              </h2>

              <p>
                Upload your resume and click
                Analyze Resume first.
              </p>
            </Card>
          ) : (
            <div className="two-col">

              <Card>
                <h2>
                  Overall Resume Score
                </h2>

                <div className="score">
                  {
                    resumeAnalysis.resume_score
                  }
                </div>

                <Progress
                  value={
                    resumeAnalysis.resume_score
                  }
                />

                <p>
                  {
                    resumeAnalysis.word_count
                  }{' '}
                  words detected
                </p>
              </Card>

              <Card>
                <h2>
                  Contact Information
                </h2>

                <p>
                  <strong>
                    Email:
                  </strong>{' '}
                  {
                    resumeAnalysis.candidate_email ||
                    'Not detected'
                  }
                </p>

                <p>
                  <strong>
                    Phone:
                  </strong>{' '}
                  {
                    resumeAnalysis.candidate_phone ||
                    'Not detected'
                  }
                </p>
              </Card>

              <Card>
                <h2>
                  Detected Skills
                </h2>

                <div className="badges">
                  {
                    resumeAnalysis.skills?.length >
                    0 ? (
                      resumeAnalysis.skills.map(
                        skill => (
                          <Badge
                            key={skill}
                          >
                            {skill}
                          </Badge>
                        )
                      )
                    ) : (
                      <p>
                        No skills detected.
                      </p>
                    )
                  }
                </div>
              </Card>

              <Card>
                <h2>
                  Education
                </h2>

                {
                  resumeAnalysis.education?.length >
                  0 ? (
                    <ul>
                      {
                        resumeAnalysis.education.map(
                          (
                            item,
                            index
                          ) => (
                            <li
                              key={index}
                            >
                              {
                                formatEducationItem(
                                  item
                                )
                              }
                            </li>
                          )
                        )
                      }
                    </ul>
                  ) : (
                    <p>
                      No education information
                      detected.
                    </p>
                  )
                }
              </Card>

              <Card>
                <h2>
                  Recommended Career Domains
                </h2>

                {
                  careerAnalysis &&
                  careerAnalysis.recommended_domains?.length >
                    0 ? (
                    careerAnalysis.recommended_domains.map(
                      domain => (
                        <div
                          key={
                            domain.domain
                          }
                        >
                          <p>
                            <strong>
                              {
                                domain.domain
                              }
                            </strong>
                          </p>

                          <Progress
                            value={
                              domain.match_percentage
                            }
                          />

                          <p>
                            {
                              domain.match_percentage
                            }
                            % match
                          </p>

                          <div className="badges">
                            {
                              domain.matching_skills?.length >
                              0 ? (
                                domain.matching_skills.map(
                                  skill => (
                                    <Badge
                                      key={
                                        skill
                                      }
                                    >
                                      {skill}
                                    </Badge>
                                  )
                                )
                              ) : (
                                <p>
                                  No matching skills detected.
                                </p>
                              )
                            }
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <p>
                      No career recommendations
                      available yet.
                    </p>
                  )
                }
              </Card>

              <Card>
                <h2>
                  Job Matches
                </h2>

                {
                  jobAnalysis &&
                  jobAnalysis.job_matches?.length >
                    0 ? (
                    jobAnalysis.job_matches.map(
                      job => (
                        <div
                          key={job.role}
                        >
                          <h3>
                            {job.role}
                          </h3>

                          <p>
                            {job.domain}{' '}
                            ·{' '}
                            {job.level}
                          </p>

                          <Progress
                            value={
                              job.match_percentage
                            }
                          />

                          <p>
                            {
                              job.match_percentage
                            }
                            % match
                          </p>

                          <div className="badges">
                            {
                              job.matching_skills?.length >
                              0 ? (
                                job.matching_skills.map(
                                  skill => (
                                    <Badge
                                      key={
                                        skill
                                      }
                                    >
                                      {skill}
                                    </Badge>
                                  )
                                )
                              ) : (
                                <p>
                                  No matching skills detected.
                                </p>
                              )
                            }
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <p>
                      No AI job matches available
                      yet.
                    </p>
                  )
                }
              </Card>

              <Card>
                <h2>
                  Skill Gap
                </h2>

                {
                  skillGapAnalysis ? (
                    <>
                      <p>
                        <strong>
                          Target Role:
                        </strong>{' '}
                        {
                          skillGapAnalysis.target_role
                        }
                      </p>

                      <p>
                        <strong>
                          Target Domain:
                        </strong>{' '}
                        {
                          skillGapAnalysis.target_domain
                        }
                      </p>

                      <p>
                        <strong>
                          Missing Skills:
                        </strong>{' '}
                        {
                          skillGapAnalysis.missing_skills_count
                        }
                      </p>

                      <div className="badges">
                        {
                          skillGapAnalysis.skill_gaps
                            ?.filter(
                              gap =>
                                gap.status ===
                                'Missing'
                            )
                            .length >
                          0 ? (
                            skillGapAnalysis.skill_gaps
                              .filter(
                                gap =>
                                  gap.status ===
                                  'Missing'
                              )
                              .map(
                                gap => (
                                  <Badge
                                    key={
                                      gap.skill
                                    }
                                  >
                                    {gap.skill}
                                    {
                                      gap.priority
                                        ? ` · ${gap.priority}`
                                        : ''
                                    }
                                  </Badge>
                                )
                              )
                          ) : (
                            <p>
                              No missing skills detected.
                            </p>
                          )
                        }
                      </div>
                    </>
                  ) : (
                    <p>
                      No skill-gap analysis
                      available yet.
                    </p>
                  )
                }
              </Card>

              <Card>
                <h2>
                  Detected Resume Sections
                </h2>

                <div className="badges">
                  {
                    resumeAnalysis
                      .detected_sections?.length >
                    0 ? (
                      resumeAnalysis
                        .detected_sections
                        .map(
                          section => (
                            <Badge
                              key={
                                section
                              }
                            >
                              {section}
                            </Badge>
                          )
                        )
                    ) : (
                      <p>
                        No sections detected.
                      </p>
                    )
                  }
                </div>
              </Card>

            </div>
          )}
        </>
      )}

      {/* =========================
          BUILDER / OPTIMIZER
      ========================== */}

      {tab === 'builder' && (
        <div className="two-col">

          <Card>
            <h2>
              Resume Builder
            </h2>

            <label>
              Professional Summary

              <textarea
                value={summary}
                onChange={event =>
                  setSummary(
                    event.target.value
                  )
                }
                placeholder="Enter a summary based only on your actual resume."
                rows={7}
              />
            </label>

            <label>
              Project Description

              <textarea
                value={
                  projectDescription
                }
                onChange={event =>
                  setProjectDescription(
                    event.target.value
                  )
                }
                placeholder="Enter a project from your actual resume or experience."
                rows={7}
              />
            </label>

            <div className="actions">

              <Button
                variant="secondary"
                onClick={
                  handleOptimize
                }
                disabled={
                  optimizerLoading ||
                  rewriteLoading
                }
              >
                <WandSparkles
                  size={16}
                />

                {
                  optimizerLoading
                    ? 'Analyzing...'
                    : 'Analyze Resume'
                }
              </Button>

              <Button
                variant="secondary"
                onClick={
                  handleImproveSummary
                }
                disabled={
                  optimizerLoading ||
                  rewriteLoading
                }
              >
                <WandSparkles
                  size={16}
                />

                {
                  rewriteLoading
                    ? 'Improving...'
                    : 'Improve Summary'
                }
              </Button>

              <Button
                onClick={handleSave}
              >
                Save
              </Button>

            </div>

            {saveMessage && (
              <p className="notice">
                {saveMessage}
              </p>
            )}

            {rewriteMessage && (
              <p className="notice">
                {rewriteMessage}
              </p>
            )}

            {optimizerError && (
              <p className="notice">
                {optimizerError}
              </p>
            )}

            <p className="notice">
              AI suggestions should be reviewed
              by the student. PrepMate must not
              invent experience, skills,
              achievements or metrics.
            </p>
          </Card>

          <Card>
            <h2>
              Live Preview
            </h2>

            <div className="resume-preview">

              <h2>
                {
                  getResumeCandidateName(
                    resumeAnalysis
                  ) ||
                  studentName
                }
              </h2>

              <p>
                {
                  resumeAnalysis?.education?.length
                    ? formatEducationItem(
                        resumeAnalysis.education[0]
                      )
                    : 'Student'
                }
              </p>

              <hr />

              <h3>
                Summary
              </h3>

              <p>
                {
                  summary ||
                  'No professional summary detected or entered.'
                }
              </p>

              <h3>
                Skills
              </h3>

              <div className="badges">
                {
                  displayedSkills.map(
                    skill => (
                      <Badge
                        key={skill}
                      >
                        {skill}
                      </Badge>
                    )
                  )
                }
              </div>

              <h3>
                Projects
              </h3>

              <p>
                {
                  projectDescription ||
                  'No project information was detected in the uploaded resume.'
                }
              </p>

            </div>
          </Card>

          {optimization && (
            <>
              <Card>
                <h2>
                  Resume Optimization
                </h2>

                <p>
                  <strong>
                    Current Resume Score:
                  </strong>{' '}
                  {
                    optimization.resume_score
                  }
                </p>

                <Progress
                  value={
                    optimization.resume_score
                  }
                />

                {
                  optimization.suggestions?.length >
                  0 && (
                    <>
                      <h3>
                        Suggestions
                      </h3>

                      <ul>
                        {
                          optimization.suggestions.map(
                            (
                              suggestion,
                              index
                            ) => (
                              <li
                                key={index}
                              >
                                {
                                  suggestion
                                }
                              </li>
                            )
                          )
                        }
                      </ul>
                    </>
                  )
                }

                {
                  optimization.warnings?.length >
                  0 && (
                    <>
                      <h3>
                        Warnings
                      </h3>

                      <ul>
                        {
                          optimization.warnings.map(
                            (
                              warning,
                              index
                            ) => (
                              <li
                                key={index}
                              >
                                {warning}
                              </li>
                            )
                          )
                        }
                      </ul>
                    </>
                  )
                }
              </Card>

              <Card>
                <h2>
                  Detected Resume Content
                </h2>

                <h3>
                  Skills
                </h3>

                <div className="badges">
                  {
                    optimization.detected_skills?.length >
                    0 ? (
                      optimization.detected_skills.map(
                        skill => (
                          <Badge
                            key={skill}
                          >
                            {skill}
                          </Badge>
                        )
                      )
                    ) : (
                      <p>
                        No skills detected.
                      </p>
                    )
                  }
                </div>

                <h3>
                  Sections
                </h3>

                <div className="badges">
                  {
                    optimization.detected_sections?.length >
                    0 ? (
                      optimization.detected_sections.map(
                        section => (
                          <Badge
                            key={section}
                          >
                            {section}
                          </Badge>
                        )
                      )
                    ) : (
                      <p>
                        No sections detected.
                      </p>
                    )
                  }
                </div>
              </Card>
            </>
          )}

        </div>
      )}
    </>
  )
}