// API-ready service contract. These are placeholders until the FastAPI backend is available.
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
async function request<T>(path:string, options?:RequestInit):Promise<T>{
  // Replace mock behavior with fetch(`${API_BASE}${path}`, options) during integration.
  console.info('Future API request:', API_BASE + path, options)
  throw new Error('Backend not connected. Use mock data in the frontend for now.')
}
export const api = {
  register:(body:unknown)=>request('/auth/register',{method:'POST',body:JSON.stringify(body)}),
  login:(body:unknown)=>request('/auth/login',{method:'POST',body:JSON.stringify(body)}),
  me:()=>request('/auth/me'),
  profile:()=>request('/profile'),
  updateProfile:(body:unknown)=>request('/profile',{method:'PUT',body:JSON.stringify(body)}),
  uploadResume:(body:unknown)=>request('/resume/upload',{method:'POST',body:body as BodyInit}),
  analyzeResume:()=>request('/resume/analyze',{method:'POST'}),
  resumeAnalysis:()=>request('/resume/analysis'),
  domains:()=>request('/career/domains'),
  jobs:()=>request('/jobs'),
  jobMatches:()=>request('/jobs/matches'),
  job:(id:string)=>request(`/jobs/${id}`),
  skillGap:(roleId:string)=>request(`/skill-gap/${roleId}`),
  roadmap:()=>request('/roadmap'),
  updateRoadmap:(body:unknown)=>request('/roadmap/progress',{method:'PUT',body:JSON.stringify(body)}),
  startInterview:(body:unknown)=>request('/interview/start',{method:'POST',body:JSON.stringify(body)}),
  answerInterview:(body:unknown)=>request('/interview/answer',{method:'POST',body:JSON.stringify(body)}),
  endInterview:()=>request('/interview/end',{method:'POST'}),
  evaluation:(id:string)=>request(`/interview/evaluation/${id}`),
  dashboard:()=>request('/dashboard'),
  finalReport:()=>request('/final-report')
}
