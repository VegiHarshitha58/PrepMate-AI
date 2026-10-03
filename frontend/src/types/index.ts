export interface StudentProfile {
  id?: number
  student_id?: number
  name: string
  email: string
  phone: string
  location: string
  college: string
  degree: string
  branch: string
  graduationYear?: number
  cgpa: string
  skills: string[]
  softSkills: string[]
  interests: string[]
}

export interface JobMatch {
  role: string
  domain?: string
  level?: string
  match_percentage: number
  matching_skills: string[]
  missing_skills: string[]
}

export interface Domain {
  domain: string
  match_percentage: number
  matching_skills: string[]
}

export interface SkillGap {
  skill: string
  priority: string
}

export interface RoadmapTask {
  week: number
  title: string
  description: string
  skill: string
  done: boolean
}

export interface Evaluation {
  technical_score: number
  relevance_score: number
  clarity_score: number
  completeness_score: number
  communication_score: number
  overall_score: number
}

export interface CareerAnalysis {
  recommended_domains: Domain[]
}

export interface JobAnalysis {
  job_matches: JobMatch[]
}

export interface SkillGapAnalysis {
  target_role?: string
  target_domain?: string
  skill_gaps: SkillGap[]
  missing_skills_count: number
  total_required_skills: number
}

export interface RoadmapAnalysis {
  target_role?: string
  target_domain?: string
  total_weeks: number
  roadmap: RoadmapTask[]
}

export interface ResumeAnalysis {
  id?: number
  student_id?: number
  filename?: string
  candidate_email?: string
  candidate_phone?: string
  resume_score?: number
  word_count?: number
  skills: string[]
  education: string[]
  detected_sections: string[]
  career_analysis?: CareerAnalysis
  job_analysis?: JobAnalysis
  skill_gap_analysis?: SkillGapAnalysis
  roadmap_analysis?: RoadmapAnalysis
}