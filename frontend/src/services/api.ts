const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData
  const headers = new Headers(options.headers)
  if (!isFormData && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers })
  let data: unknown = null
  try { data = await response.json() } catch { data = null }

  if (!response.ok) {
    const message = typeof data === 'object' && data !== null && 'detail' in data
      ? String((data as { detail: unknown }).detail)
      : `Request failed with status ${response.status}`
    throw new Error(message)
  }
  return data as T
}

export const api = {
  register: (body: unknown) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: unknown) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getStudent: (studentId: number) => request(`/api/students/${studentId}`),
  updateStudent: (studentId: number, body: unknown) => request(`/api/students/${studentId}`, { method: 'PUT', body: JSON.stringify(body) }),
  uploadResume: (file: File, studentId: number) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('student_id', String(studentId))
    return request('/api/resume/upload', { method: 'POST', body: formData })
  },
  getLatestResume: (studentId: number) => request(`/api/resume/latest/${studentId}`),
  optimizeResume: (analysisId: number) => request(`/api/resume/optimize/${analysisId}`),
  rewriteSummary: (summary: string, analysisId: number) => request(`/api/resume/rewrite-summary?summary=${encodeURIComponent(summary)}&analysis_id=${analysisId}`, { method: 'POST' }),
  updateRoadmapProgress: (studentId: number, analysisId: number, week: number, done: boolean) => request(`/api/roadmap/progress?student_id=${studentId}&analysis_id=${analysisId}&week=${week}&done=${done}`, { method: 'POST' }),
  getRoadmapProgress: (studentId: number, analysisId: number) => request(`/api/roadmap/progress/${studentId}/${analysisId}`),
  generateInterview: (body: { student_id:number; question_count:number; interview_type:'Mixed'|'Technical'|'HR'|'Role-specific'; difficulty:'Easy'|'Medium'|'Hard' }) => request('/api/interview/generate', { method:'POST', body:JSON.stringify(body) }),
  evaluateInterview: (body: { questions: unknown[]; answers: unknown[] }) => request('/api/interview/evaluate', { method:'POST', body:JSON.stringify(body) }),
  health: () => request('/api/health'),
}
