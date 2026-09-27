import { useState } from 'react'
import { Badge, Button, Card, PageHeader, Progress } from '../components/UI'
import { UploadCloud, WandSparkles } from 'lucide-react'

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
    status: string
    priority: string
    reason: string
  }[]
  missing_skills_count: number
  total_required_skills: number
}

export default function Resume() {
  const [tab, setTab] = useState<'upload' | 'analysis' | 'builder'>('upload')

  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [resumeAnalysis, setResumeAnalysis] =
    useState<ResumeAnalysis | null>(null)

  const [careerAnalysis, setCareerAnalysis] =
    useState<CareerAnalysis | null>(null)

  const [jobAnalysis, setJobAnalysis] =
    useState<JobAnalysis | null>(null)

  const [skillGapAnalysis, setSkillGapAnalysis] =
    useState<SkillGapAnalysis | null>(null)

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0]

    if (!selectedFile) return

    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a PDF resume.')
      setFile(null)
      return
    }

    setError('')
    setFile(selectedFile)
  }

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please select a PDF resume first.')
      return
    }

    // Get logged-in student
    const student = JSON.parse(
      localStorage.getItem('student') || 'null'
    )

    if (!student?.student_id) {
      setError('Please login before uploading your resume.')
      return
    }

    setLoading(true)
    setError('')

    const formData = new FormData()

    formData.append('file', file)

    formData.append(
      'student_id',
      String(student.student_id)
    )

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/api/resume/upload',
        {
          method: 'POST',
          body: formData,
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail || 'Resume analysis failed.'
        )
      }

      // Store backend results in React state
      setResumeAnalysis(data.resume_analysis)
      setCareerAnalysis(data.career_analysis)
      setJobAnalysis(data.job_analysis)
      setSkillGapAnalysis(data.skill_gap_analysis)

      // Temporary frontend storage
      localStorage.setItem(
        'resumeAnalysis',
        JSON.stringify(data.resume_analysis)
      )

      localStorage.setItem(
        'careerAnalysis',
        JSON.stringify(data.career_analysis)
      )

      localStorage.setItem(
        'jobAnalysis',
        JSON.stringify(data.job_analysis)
      )

      localStorage.setItem(
        'skillGapAnalysis',
        JSON.stringify(data.skill_gap_analysis)
      )

      // Store database analysis ID
      localStorage.setItem(
        'resumeAnalysisId',
        String(data.analysis_id)
      )

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

  return (
    <>
      <PageHeader
        title="Resume"
        subtitle="Upload, analyze and improve your resume for target roles."
      />

      <div className="tabs">
        {(['upload', 'analysis', 'builder'] as const).map((t) => (
          <button
            className={tab === t ? 'active' : ''}
            onClick={() => setTab(t)}
            key={t}
          >
            {t === 'builder'
              ? 'Builder / Optimizer'
              : t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'upload' && (
        <Card>
          <div className="drop">
            <UploadCloud size={42} />

            <h2>Upload your resume</h2>

            <p>PDF only · AI-powered resume analysis</p>

            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
            />

            {file && (
              <p>
                <strong>Selected:</strong> {file.name}
              </p>
            )}

            {error && (
              <p className="notice">
                {error}
              </p>
            )}

            <Button
              onClick={handleAnalyze}
              disabled={loading || !file}
            >
              {loading ? 'Analyzing...' : 'Analyze Resume'}
            </Button>
          </div>
        </Card>
      )}

      {tab === 'analysis' && (
        <>
          {!resumeAnalysis ? (
            <Card>
              <h2>No resume analyzed yet</h2>

              <p>
                Upload your resume and click Analyze Resume first.
              </p>
            </Card>
          ) : (
            <div className="two-col">

              <Card>
                <h2>Overall Resume Score</h2>

                <div className="score">
                  {resumeAnalysis.resume_score}
                </div>

                <Progress
                  value={resumeAnalysis.resume_score}
                />

                <p>
                  {resumeAnalysis.word_count} words detected
                </p>
              </Card>

              <Card>
                <h2>Contact Information</h2>

                <p>
                  <strong>Email:</strong>{' '}
                  {resumeAnalysis.candidate_email || 'Not detected'}
                </p>

                <p>
                  <strong>Phone:</strong>{' '}
                  {resumeAnalysis.candidate_phone || 'Not detected'}
                </p>
              </Card>

              <Card>
                <h2>Detected Skills</h2>

                <div className="badges">
                  {resumeAnalysis.skills.length > 0 ? (
                    resumeAnalysis.skills.map((skill) => (
                      <Badge key={skill}>
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <p>No skills detected.</p>
                  )}
                </div>
              </Card>

              <Card>
                <h2>Education</h2>

                {resumeAnalysis.education.length > 0 ? (
                  <ul>
                    {resumeAnalysis.education.map(
                      (item, index) => (
                        <li key={index}>{item}</li>
                      )
                    )}
                  </ul>
                ) : (
                  <p>No education information detected.</p>
                )}
              </Card>

              <Card>
                <h2>Recommended Career Domains</h2>

                {careerAnalysis?.recommended_domains.map(
                  (domain) => (
                    <div key={domain.domain}>
                      <p>
                        <strong>{domain.domain}</strong>
                      </p>

                      <Progress
                        value={domain.match_percentage}
                      />

                      <p>
                        {domain.match_percentage}% match
                      </p>

                      <div className="badges">
                        {domain.matching_skills.map(
                          (skill) => (
                            <Badge key={skill}>
                              {skill}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  )
                )}
              </Card>

              <Card>
                <h2>Job Matches</h2>

                {jobAnalysis?.job_matches.map((job) => (
                  <div key={job.role}>
                    <h3>{job.role}</h3>

                    <p>
                      {job.domain} · {job.level}
                    </p>

                    <Progress
                      value={job.match_percentage}
                    />

                    <p>
                      {job.match_percentage}% match
                    </p>

                    <div className="badges">
                      {job.matching_skills.map(
                        (skill) => (
                          <Badge key={skill}>
                            {skill}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </Card>

              <Card>
                <h2>Skill Gap</h2>

                {skillGapAnalysis && (
                  <>
                    <p>
                      <strong>Target Role:</strong>{' '}
                      {skillGapAnalysis.target_role}
                    </p>

                    <p>
                      <strong>Missing Skills:</strong>{' '}
                      {skillGapAnalysis.missing_skills_count}
                    </p>

                    <div className="badges">
                      {skillGapAnalysis.skill_gaps
                        .filter(
                          (gap) => gap.status === 'Missing'
                        )
                        .map((gap) => (
                          <Badge key={gap.skill}>
                            {gap.skill}
                          </Badge>
                        ))}
                    </div>
                  </>
                )}
              </Card>

              <Card>
                <h2>Detected Resume Sections</h2>

                <div className="badges">
                  {resumeAnalysis.detected_sections.map(
                    (section) => (
                      <Badge key={section}>
                        {section}
                      </Badge>
                    )
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
            <h2>Resume Builder</h2>

            <label>
              Professional Summary

              <textarea
                defaultValue="Computer Science student with experience building web and data-focused academic projects."
              />
            </label>

            <label>
              Project Description

              <textarea
                defaultValue="Built a responsive placement preparation dashboard using React and TypeScript."
              />
            </label>

            <div className="actions">
              <Button variant="secondary">
                <WandSparkles size={16} />
                Improve Summary
              </Button>

              <Button>
                Save
              </Button>
            </div>

            <p className="notice">
              AI suggestions should be reviewed by the student.
              PrepMate should improve wording only and must not
              invent experience, skills, achievements or metrics.
            </p>
          </Card>

          <Card>
            <h2>Live Preview</h2>

            <div className="resume-preview">
              <h2>Aarohi Sharma</h2>

              <p>Computer Science Student</p>

              <hr />

              <h3>Summary</h3>

              <p>
                Computer Science student with experience building
                web and data-focused academic projects.
              </p>

              <h3>Skills</h3>

              <p>
                Python · SQL · React · JavaScript
              </p>

              <h3>Projects</h3>

              <strong>PrepMate AI</strong>

              <p>
                Placement preparation platform with profile,
                resume, career and interview modules.
              </p>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}