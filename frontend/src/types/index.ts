export interface StudentProfile {
  name: string; email: string; phone: string; location: string;
  college: string; degree: string; branch: string; graduationYear: number; cgpa: number;
  skills: string[]; softSkills: string[]; interests: string[];
}
export interface JobMatch { id:number; title:string; company:string; location:string; alignment:number; matched:string[]; missing:string[] }
export interface Domain { name:string; alignment:number; reason:string; existing:string[]; missing:string[] }
export interface SkillGap { skill:string; current:number; required:number; status:string }
export interface RoadmapTask { week:number; title:string; description:string; done:boolean }
export interface Evaluation { technical:number; relevance:number; clarity:number; completeness:number; communication:number; overall:number }
