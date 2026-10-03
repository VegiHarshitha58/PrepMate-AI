import { useState } from 'react'
import { Button, Card, PageHeader, Progress } from '../components/UI'
import { api } from '../services/api'

type InterviewQuestion = {
  question: string
  skill: string | null
  type: string
}

type InterviewData = {
  target_role: string
  target_domain: string
  questions: InterviewQuestion[]
  total_questions: number
}

type InterviewResponse = {
  analysis_id: number
  student_id: number
  interview: InterviewData
}

type AnswerRecord = {
  question: string
  answer: string
}

type Evaluation = {
  overall_score: number
  technical_score: number
  relevance_score: number
  clarity_score: number
  communication_score: number
  answered_questions: number
  total_questions: number
  feedback: {
    question: string
    feedback: string
  }[]
}

export default function Interview() {
  const [interview, setInterview] =
    useState<InterviewData | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [started, setStarted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const [answers, setAnswers] =
    useState<Record<string, string>>({})

  const [difficulty, setDifficulty] =
    useState('Medium')

  const [questionCount, setQuestionCount] =
    useState(10)

  const [interviewType, setInterviewType] =
    useState('Mixed')

  const [evaluating, setEvaluating] =
    useState(false)

  const [evaluation, setEvaluation] =
    useState<Evaluation | null>(null)

  const generateInterview = async () => {
    setLoading(true)
    setError('')

    const studentData =
      localStorage.getItem('student')

    if (!studentData) {
      setError('Please login first.')
      setLoading(false)
      return
    }

    let student

    try {
      student = JSON.parse(studentData)
    } catch {
      setError(
        'Student information is invalid. Please login again.'
      )
      setLoading(false)
      return
    }

    const studentId =
      student.student_id ?? student.id

    if (!studentId) {
      setError(
        'Student information not found. Please login again.'
      )
      setLoading(false)
      return
    }

    try {
      const data = await api.generateInterview({
        student_id: studentId,
        question_count: questionCount,
        interview_type: interviewType as 'Mixed' | 'Technical' | 'HR' | 'Role-specific',
        difficulty: difficulty as 'Easy' | 'Medium' | 'Hard'
      }) as InterviewResponse

      const result =
        data as InterviewResponse

      if (
        !result.interview ||
        !result.interview.questions?.length
      ) {
        throw new Error(
          'AI did not generate any interview questions.'
        )
      }

      setInterview(result.interview)
      setAnswers({})
      setCurrentIndex(0)
      setEvaluation(null)
      setStarted(true)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to generate interview.'
      )
    } finally {
      setLoading(false)
    }
  }

  const updateAnswer = (
    question: string,
    value: string
  ) => {
    setAnswers((previous) => ({
      ...previous,
      [question]: value
    }))
  }

  const evaluateInterview = async () => {
    if (!interview) return

    setEvaluating(true)
    setError('')

    const answerPayload: AnswerRecord[] =
      interview.questions.map(
        (question) => ({
          question: question.question,
          answer:
            answers[question.question] || ''
        })
      )

    try {
      const data = await api.evaluateInterview({
        questions: interview.questions,
        answers: answerPayload
      }) as { evaluation: Evaluation }

      setEvaluation(data.evaluation)
      const studentData = localStorage.getItem('student')
      if (studentData) {
        try {
          const student = JSON.parse(studentData)
          const id = student.student_id ?? student.id
          if (id) localStorage.setItem(`prepmate_interview_result_${id}`, JSON.stringify(data.evaluation))
        } catch { /* ignore invalid local data */ }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Interview evaluation failed.'
      )
    } finally {
      setEvaluating(false)
    }
  }

  if (evaluation && interview) {
    return (
      <>
        <PageHeader
          title="Interview Evaluation"
          subtitle={`AI evaluation for ${interview.target_role}`}
        />

        <div className="metric-grid">

          <Card>
            <small>
              Overall Score
            </small>

            <div className="metric">
              {evaluation.overall_score}%
            </div>

            <Progress
              value={
                evaluation.overall_score
              }
            />
          </Card>

          <Card>
            <small>
              Technical
            </small>

            <div className="metric">
              {evaluation.technical_score}%
            </div>

            <Progress
              value={
                evaluation.technical_score
              }
            />
          </Card>

          <Card>
            <small>
              Relevance
            </small>

            <div className="metric">
              {evaluation.relevance_score}%
            </div>

            <Progress
              value={
                evaluation.relevance_score
              }
            />
          </Card>

          <Card>
            <small>
              Communication
            </small>

            <div className="metric">
              {evaluation.communication_score}%
            </div>

            <Progress
              value={
                evaluation.communication_score
              }
            />
          </Card>

        </div>

        <Card>
          <h2>
            Interview Summary
          </h2>

          <p>
            Answered{' '}
            {evaluation.answered_questions}{' '}
            of{' '}
            {evaluation.total_questions}{' '}
            questions.
          </p>

          <p>
            Clarity:{' '}
            {evaluation.clarity_score}%
          </p>
        </Card>

        <Card>
          <h2>
            Question-wise Feedback
          </h2>

          <div className="stack">

            {evaluation.feedback.map(
              (item, index) => (
                <div key={index}>
                  <b>
                    Q{index + 1}.{' '}
                    {item.question}
                  </b>

                  <p>
                    {item.feedback}
                  </p>
                </div>
              )
            )}

          </div>
        </Card>

        <div className="actions">
          <Button
            variant="secondary"
            onClick={() => {
              setEvaluation(null)
              setInterview(null)
              setAnswers({})
              setCurrentIndex(0)
              setStarted(false)
              setError('')
            }}
          >
            New AI Interview
          </Button>
        </div>
      </>
    )
  }

  if (started && interview) {
    const currentQuestion =
      interview.questions[currentIndex]

    if (!currentQuestion) {
      return null
    }

    const progress =
      ((currentIndex + 1) /
        interview.questions.length) *
      100

    const isLast =
      currentIndex ===
      interview.questions.length - 1

    return (
      <>
        <PageHeader
          title="AI Mock Interview"
          subtitle={`${interview.target_role} · ${interviewType} · ${difficulty}`}
        />

        <Card>

          <div className="section-title">
            <b>
              Question{' '}
              {currentIndex + 1} of{' '}
              {interview.questions.length}
            </b>

            <span>
              {Math.round(progress)}%
            </span>
          </div>

          <Progress
            value={progress}
          />

          <h2 className="question">
            {currentQuestion.question}
          </h2>

          <small>
            {currentQuestion.type}

            {currentQuestion.skill
              ? ` · ${currentQuestion.skill}`
              : ''}
          </small>

          <textarea
            rows={8}
            value={
              answers[
                currentQuestion.question
              ] || ''
            }
            onChange={(e) =>
              updateAnswer(
                currentQuestion.question,
                e.target.value
              )
            }
            placeholder="Type your answer here..."
          />

          {error && (
            <p className="notice">
              {error}
            </p>
          )}

          <div className="actions">

            <Button
              variant="secondary"
              disabled={
                currentIndex === 0
              }
              onClick={() =>
                setCurrentIndex(
                  currentIndex - 1
                )
              }
            >
              Previous
            </Button>

            {!isLast ? (
              <Button
                onClick={() =>
                  setCurrentIndex(
                    currentIndex + 1
                  )
                }
              >
                Save & Next
              </Button>
            ) : (
              <Button
                onClick={
                  evaluateInterview
                }
                disabled={evaluating}
              >
                {evaluating
                  ? 'Evaluating...'
                  : 'Submit Interview'}
              </Button>
            )}

          </div>

        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="AI Interview Preparation"
        subtitle="Generate a personalized interview from your resume, career direction, skill gaps and job requirements."
      />

      <Card>

        <div className="form-grid">

          <label>
            Interview Type

            <select
              value={interviewType}
              onChange={(e) =>
                setInterviewType(
                  e.target.value
                )
              }
            >
              <option value="Mixed">
                Mixed
              </option>

              <option value="Technical">
                Technical
              </option>

              <option value="HR">
                HR
              </option>

              <option value="Role-specific">
                Role-specific
              </option>
            </select>
          </label>

          <label>
            Difficulty

            <select
              value={difficulty}
              onChange={(e) =>
                setDifficulty(
                  e.target.value
                )
              }
            >
              <option value="Easy">
                Easy
              </option>

              <option value="Medium">
                Medium
              </option>

              <option value="Hard">
                Hard
              </option>
            </select>
          </label>

          <label>
            Questions

            <select
              value={questionCount}
              onChange={(e) =>
                setQuestionCount(
                  Number(e.target.value)
                )
              }
            >
              <option value={3}>
                3
              </option>

              <option value={5}>
                5
              </option>

              <option value={10}>
                10
              </option>

              <option value={15}>
                15
              </option>
            </select>
          </label>

        </div>

        <p>
          Questions will be generated dynamically
          by AI based on your individual profile.
        </p>

        {error && (
          <p className="notice">
            {error}
          </p>
        )}

        <Button
          onClick={generateInterview}
          disabled={loading}
        >
          {loading
            ? 'Generating AI Interview...'
            : 'Generate AI Interview'}
        </Button>

      </Card>
    </>
  )
}