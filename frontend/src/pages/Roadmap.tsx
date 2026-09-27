import { useEffect, useState } from 'react'
import { Badge, Card, PageHeader, Progress } from '../components/UI'

type RoadmapTask = {
  week: number
  title: string
  description: string
  skill: string
  done: boolean
}

type RoadmapAnalysis = {
  target_role: string
  target_domain: string
  total_weeks: number
  roadmap: RoadmapTask[]
}

export default function Roadmap() {
  const [roadmap, setRoadmap] =
    useState<RoadmapAnalysis | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadRoadmap = async () => {
      try {
        const storedStudent =
          localStorage.getItem('student')

        if (!storedStudent) {
          setError('Please login to view your roadmap.')
          setLoading(false)
          return
        }

        const student = JSON.parse(storedStudent)

        const studentId =
          student.student_id || student.id

        if (!studentId) {
          setError(
            'Student ID not found. Please login again.'
          )
          setLoading(false)
          return
        }

        const response = await fetch(
          `http://127.0.0.1:8000/api/resume/latest/${studentId}`
        )

        if (response.status === 404) {
          setError(
            'Upload and analyze your resume first to generate a roadmap.'
          )
          setLoading(false)
          return
        }

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.detail || 'Failed to load roadmap.'
          )
        }

        setRoadmap(data.roadmap_analysis)

      } catch (err) {
        console.error(
          'Failed to load roadmap:',
          err
        )

        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load roadmap.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadRoadmap()
  }, [])

  const toggleTask = (week: number) => {
    if (!roadmap) return

    setRoadmap({
      ...roadmap,
      roadmap: roadmap.roadmap.map((task) =>
        task.week === week
          ? {
              ...task,
              done: !task.done
            }
          : task
      )
    })
  }

  const completedTasks =
    roadmap?.roadmap.filter(
      (task) => task.done
    ).length || 0

  const totalTasks =
    roadmap?.roadmap.length || 0

  const percentage =
    totalTasks > 0
      ? Math.round(
          (completedTasks / totalTasks) * 100
        )
      : 0

  if (loading) {
    return (
      <>
        <PageHeader
          title="Personalized Roadmap"
          subtitle="A structured learning path toward your selected role."
        />

        <Card>
          <p>Loading your personalized roadmap...</p>
        </Card>
      </>
    )
  }

  if (error) {
    return (
      <>
        <PageHeader
          title="Personalized Roadmap"
          subtitle="A structured learning path toward your selected role."
        />

        <Card>
          <p className="notice">
            {error}
          </p>
        </Card>
      </>
    )
  }

  if (!roadmap) {
    return null
  }

  return (
    <>
      <PageHeader
        title="Personalized Roadmap"
        subtitle="A structured learning path toward your selected role."
      />

      <Card>
        <h2>
          Goal: Become placement-ready for{' '}
          {roadmap.target_role}
        </h2>

        <p>
          Target Domain:{' '}
          <strong>
            {roadmap.target_domain}
          </strong>
        </p>

        <Progress value={percentage} />

        <p>
          {percentage}% complete
        </p>

        <small>
          {completedTasks} of {totalTasks} stages completed
        </small>
      </Card>

      <div className="timeline">

        {roadmap.roadmap.map((task) => (
          <Card key={task.week}>

            <div className="section-title">

              <div>
                <Badge>
                  Week {task.week}
                </Badge>

                <h2>
                  {task.title}
                </h2>
              </div>

              <input
                type="checkbox"
                checked={task.done}
                onChange={() =>
                  toggleTask(task.week)
                }
              />

            </div>

            <p>
              {task.description}
            </p>

            <p>
              <strong>Focus:</strong>{' '}
              {task.skill}
            </p>

            <small>
              {task.done
                ? 'Completed'
                : 'Not completed'}
            </small>

          </Card>
        ))}

      </div>
    </>
  )
}