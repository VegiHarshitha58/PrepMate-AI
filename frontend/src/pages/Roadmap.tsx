import { useEffect, useState } from 'react'
import {
  Badge,
  Card,
  PageHeader,
  Progress,
} from '../components/UI'
import { api } from '../services/api'

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

  const [analysisId, setAnalysisId] =
    useState<number | null>(null)

  const [studentId, setStudentId] =
    useState<number | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingWeek, setSavingWeek] =
    useState<number | null>(null)

  useEffect(() => {
    const loadRoadmap = async () => {
      try {
        const storedStudent =
          localStorage.getItem('student')

        if (!storedStudent) {
          setError(
            'Please login to view your roadmap.'
          )
          setLoading(false)
          return
        }

        const student = JSON.parse(storedStudent)

        const currentStudentId =
          student.student_id || student.id

        if (!currentStudentId) {
          setError(
            'Student ID not found. Please login again.'
          )
          setLoading(false)
          return
        }

        setStudentId(
          Number(currentStudentId)
        )

        let data: any
        try {
          data = await api.getLatestResume(Number(currentStudentId))
        } catch (err) {
          throw new Error(err instanceof Error ? err.message : 'Failed to load roadmap.')
        }

        const currentAnalysisId =
          Number(data.analysis_id)

        setAnalysisId(currentAnalysisId)

        const roadmapAnalysis =
          data.roadmap_analysis

        /*
         * Load saved completion status
         * from PostgreSQL.
         */
        let savedProgress: { week: number; done: boolean }[] = []
        try {
          const progress = await api.getRoadmapProgress(Number(currentStudentId), currentAnalysisId)
          if (Array.isArray(progress)) savedProgress = progress as { week: number; done: boolean }[]
        } catch {
          savedProgress = []
        }

        /*
         * Merge database progress with
         * the generated roadmap.
         */
        const updatedRoadmap: RoadmapAnalysis = {
          ...roadmapAnalysis,
          roadmap:
            roadmapAnalysis.roadmap.map(
              (task: RoadmapTask) => {
                const savedTask =
                  savedProgress.find(
                    (item) =>
                      item.week === task.week
                  )

                return {
                  ...task,
                  done:
                    savedTask?.done ??
                    task.done
                }
              }
            ),
        }

        setRoadmap(updatedRoadmap)

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

  const toggleTask = async (week: number) => {
    if (
      !roadmap ||
      !studentId ||
      !analysisId
    ) {
      return
    }

    const task =
      roadmap.roadmap.find(
        (item) => item.week === week
      )

    if (!task) return

    const newDone = !task.done

    /*
     * Update UI immediately.
     */
    setRoadmap({
      ...roadmap,
      roadmap: roadmap.roadmap.map(
        (item) =>
          item.week === week
            ? {
                ...item,
                done: newDone,
              }
            : item
      ),
    })

    setSavingWeek(week)

    try {
      await api.updateRoadmapProgress(studentId, analysisId, week, newDone)

    } catch (err) {
      console.error(
        'Failed to save roadmap progress:',
        err
      )

      /*
       * Roll back the checkbox if
       * PostgreSQL update failed.
       */
      setRoadmap({
        ...roadmap,
        roadmap: roadmap.roadmap.map(
          (item) =>
            item.week === week
              ? {
                  ...item,
                  done: !newDone,
                }
              : item
        ),
      })

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save roadmap progress.'
      )
    } finally {
      setSavingWeek(null)
    }
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
          (completedTasks / totalTasks) *
            100
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
          <p>
            Loading your personalized
            roadmap...
          </p>
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
          {completedTasks} of {totalTasks}{' '}
          stages completed
        </small>
      </Card>

      <div className="timeline">
        {roadmap.roadmap.map(
          (task) => (
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
                  disabled={
                    savingWeek === task.week
                  }
                  onChange={() =>
                    toggleTask(task.week)
                  }
                />
              </div>

              <p>
                {task.description}
              </p>

              <p>
                <strong>
                  Focus:
                </strong>{' '}
                {task.skill}
              </p>

              <small>
                {savingWeek ===
                task.week
                  ? 'Saving...'
                  : task.done
                  ? 'Completed'
                  : 'Not completed'}
              </small>
            </Card>
          )
        )}
      </div>
    </>
  )
}