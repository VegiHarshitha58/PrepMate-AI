import { useEffect, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  PageHeader,
  Progress
} from '../components/UI'
import {
  UploadCloud,
  WandSparkles
} from 'lucide-react'
import { api } from '../services/api'

type ResumeAnalysis = {
  candidate_email: string | null
  candidate_phone: string | null
  skills: string[]
  education: string[]
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
  resume_analysis?: ResumeAnalysis
  career_analysis?: CareerAnalysis
  job_analysis?: JobAnalysis
  skill_gap_analysis?: SkillGapAnalysis
}

function getStudentId(): number | null {
  const stored = localStorage.getItem('student')

  if (!stored) return null

  try {
    const student = JSON.parse(stored)

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

export default function Resume() {
  const [tab, setTab] =
    useState<'upload' | 'analysis' | 'builder'>(
      'upload'
    )

  const [file, setFile] =
    useState<File | null>(null)

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
    const storedStudent =
      localStorage.getItem('student')

    if (storedStudent) {
      try {
        const student =
          JSON.parse(storedStudent)

        setStudentName(
          student?.name ||
          student?.student_name ||
          'Student'
        )
      } catch {
        setStudentName('Student')
      }
    }

    const savedBuilder =
      localStorage.getItem('resumeBuilder')

    if (savedBuilder) {
      try {
        const builder =
          JSON.parse(savedBuilder)

        setSummary(
          typeof builder?.summary === 'string'
            ? builder.summary
            : ''
        )

        setProjectDescription(
          typeof builder?.projectDescription === 'string'
            ? builder.projectDescription
            : ''
        )
      } catch {
        // Ignore invalid saved builder data.
      }
    }
  }, [])

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
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

      setResumeAnalysis(
        data.resume_analysis
      )

      setCareerAnalysis(
        data.career_analysis ?? null
      )

      setJobAnalysis(
        data.job_analysis ?? null
      )

      setSkillGapAnalysis(
        data.skill_gap_analysis ?? null
      )

      if (data.analysis_id) {
        localStorage.setItem(
          'resumeAnalysisId',
          String(data.analysis_id)
        )
      }

      localStorage.setItem(
        'resumeAnalysis',
        JSON.stringify(
          data.resume_analysis
        )
      )

      localStorage.setItem(
        'careerAnalysis',
        JSON.stringify(
          data.career_analysis ?? null
        )
      )

      localStorage.setItem(
        'jobAnalysis',
        JSON.stringify(
          data.job_analysis ?? null
        )
      )

      localStorage.setItem(
        'skillGapAnalysis',
        JSON.stringify(
          data.skill_gap_analysis ?? null
        )
      )

      setOptimization(null)
      setOptimizerError('')
      setRewriteMessage('')

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
          optimization?: ResumeOptimization
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

      if (!response.result?.improved) {
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
    localStorage.setItem(
      'resumeBuilder',
      JSON.stringify({
        summary,
        projectDescription
      })
    )

    setSaveMessage(
      'Resume changes saved locally.'
    )
  }

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
            'builder'
          ] as const
        ).map(currentTab => (
          <button
            className={
              tab === currentTab
                ? 'active'
                : ''
            }
            onClick={() =>
              setTab(currentTab)
            }
            key={currentTab}
          >
            {currentTab === 'builder'
              ? 'Builder / Optimizer'
              : currentTab[0].toUpperCase() +
                currentTab.slice(1)}
          </button>
        ))}
      </div>

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
              onChange={handleFileChange}
            />

            {file && (
              <p>
                <strong>Selected:</strong>{' '}
                {file.name}
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
          </div>
        </Card>
      )}

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
                  {resumeAnalysis.resume_score}
                </div>

                <Progress
                  value={
                    resumeAnalysis.resume_score
                  }
                />

                <p>
                  {resumeAnalysis.word_count}{' '}
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
                  {resumeAnalysis.candidate_email ||
                    'Not detected'}
                </p>

                <p>
                  <strong>
                    Phone:
                  </strong>{' '}
                  {resumeAnalysis.candidate_phone ||
                    'Not detected'}
                </p>
              </Card>

              <Card>
                <h2>
                  Detected Skills
                </h2>

                <div className="badges">
                  {resumeAnalysis.skills?.length > 0 ? (
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
                  )}
                </div>
              </Card>

              <Card>
                <h2>
                  Education
                </h2>

                {resumeAnalysis.education?.length > 0 ? (
                  <ul>
                    {resumeAnalysis.education.map(
                      (item, index) => (
                        <li key={index}>
                          {item}
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p>
                    No education information
                    detected.
                  </p>
                )}
              </Card>

              <Card>
                <h2>
                  Recommended Career Domains
                </h2>

                {careerAnalysis &&
                careerAnalysis.recommended_domains?.length > 0 ? (
                  careerAnalysis
                    .recommended_domains
                    .map(domain => (
                      <div
                        key={domain.domain}
                      >
                        <p>
                          <strong>
                            {domain.domain}
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
                          {domain
                            .matching_skills?.length > 0 ? (
                            domain.matching_skills.map(
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
                              No matching skills detected.
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                ) : (
                  <p>
                    No career recommendations
                    available yet.
                  </p>
                )}
              </Card>

              <Card>
                <h2>
                  Job Matches
                </h2>

                {jobAnalysis &&
                jobAnalysis.job_matches?.length > 0 ? (
                  jobAnalysis.job_matches.map(
                    job => (
                      <div
                        key={job.role}
                      >
                        <h3>
                          {job.role}
                        </h3>

                        <p>
                          {job.domain} ·{' '}
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
                          {job
                            .matching_skills?.length > 0 ? (
                            job.matching_skills.map(
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
                              No matching skills detected.
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  )
                ) : (
                  <p>
                    No AI job matches available
                    yet.
                  </p>
                )}
              </Card>

              <Card>
                <h2>
                  Skill Gap
                </h2>

                {skillGapAnalysis ? (
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
                      {skillGapAnalysis.skill_gaps?.length > 0 ? (
                        skillGapAnalysis.skill_gaps.map(
                          gap => (
                            <Badge
                              key={gap.skill}
                            >
                              {gap.skill}
                              {gap.priority
                                ? ` · ${gap.priority}`
                                : ''}
                            </Badge>
                          )
                        )
                      ) : (
                        <p>
                          No skill gaps detected.
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <p>
                    No skill-gap analysis
                    available yet.
                  </p>
                )}
              </Card>

              <Card>
                <h2>
                  Detected Resume Sections
                </h2>

                <div className="badges">
                  {resumeAnalysis
                    .detected_sections?.length > 0 ? (
                    resumeAnalysis
                      .detected_sections
                      .map(section => (
                        <Badge
                          key={section}
                        >
                          {section}
                        </Badge>
                      ))
                  ) : (
                    <p>
                      No sections detected.
                    </p>
                  )}
                </div>
              </Card>
            </div>
          )}
        </>
      )}

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
                placeholder="Enter your current professional summary."
                rows={7}
              />
            </label>

            <label>
              Project Description

              <textarea
                value={projectDescription}
                onChange={event =>
                  setProjectDescription(
                    event.target.value
                  )
                }
                placeholder="Enter a project description from your actual experience."
                rows={7}
              />
            </label>

            <div className="actions">
              <Button
                variant="secondary"
                onClick={handleOptimize}
                disabled={
                  optimizerLoading ||
                  rewriteLoading
                }
              >
                <WandSparkles
                  size={16}
                />

                {optimizerLoading
                  ? 'Analyzing...'
                  : 'Analyze Resume'}
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

                {rewriteLoading
                  ? 'Improving...'
                  : 'Improve Summary'}
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
              by the student. PrepMate should
              improve wording only and must not
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
                {studentName}
              </h2>

              <p>
                {resumeAnalysis?.education?.[0] ||
                  'Student'}
              </p>

              <hr />

              <h3>
                Summary
              </h3>

              <p>
                {summary ||
                  'No professional summary entered yet.'}
              </p>

              <h3>
                Skills
              </h3>

              <div className="badges">
                {(
                  optimization?.detected_skills ||
                  resumeAnalysis?.skills ||
                  []
                ).map(skill => (
                  <Badge key={skill}>
                    {skill}
                  </Badge>
                ))}
              </div>

              <h3>
                Projects
              </h3>

              <p>
                {projectDescription ||
                  'No project description entered yet.'}
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
                  {optimization.resume_score}
                </p>

                <Progress
                  value={
                    optimization.resume_score
                  }
                />

                {optimization.suggestions
                  ?.length > 0 && (
                  <>
                    <h3>
                      Suggestions
                    </h3>

                    <ul>
                      {optimization.suggestions.map(
                        (
                          suggestion,
                          index
                        ) => (
                          <li key={index}>
                            {suggestion}
                          </li>
                        )
                      )}
                    </ul>
                  </>
                )}

                {optimization.warnings
                  ?.length > 0 && (
                  <>
                    <h3>
                      Warnings
                    </h3>

                    <ul>
                      {optimization.warnings.map(
                        (
                          warning,
                          index
                        ) => (
                          <li key={index}>
                            {warning}
                          </li>
                        )
                      )}
                    </ul>
                  </>
                )}
              </Card>

              <Card>
                <h2>
                  Detected Resume Content
                </h2>

                <h3>
                  Skills
                </h3>

                <div className="badges">
                  {optimization
                    .detected_skills?.length > 0 ? (
                    optimization
                      .detected_skills
                      .map(skill => (
                        <Badge key={skill}>
                          {skill}
                        </Badge>
                      ))
                  ) : (
                    <p>
                      No skills detected.
                    </p>
                  )}
                </div>

                <h3>
                  Sections
                </h3>

                <div className="badges">
                  {optimization
                    .detected_sections?.length > 0 ? (
                    optimization
                      .detected_sections
                      .map(section => (
                        <Badge
                          key={section}
                        >
                          {section}
                        </Badge>
                      ))
                  ) : (
                    <p>
                      No sections detected.
                    </p>
                  )}
                </div>
              </Card>
            </>
          )}
        </div>
      )}
    </>
  )
}