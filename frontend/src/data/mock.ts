import { Domain, JobMatch, RoadmapTask, SkillGap, StudentProfile } from '../types'

export const profile: StudentProfile = {
  name: 'Aarohi Sharma', email: 'aarohi@example.com', phone: '+91 98765 43210',
  location: 'Visakhapatnam, India', college: 'Andhra University', degree: 'B.Tech',
  branch: 'Computer Science Engineering', graduationYear: 2028, cgpa: 9.1,
  skills: ['Python','JavaScript','React','SQL','HTML','CSS'],
  softSkills: ['Communication','Teamwork','Problem Solving'],
  interests: ['AI/ML','Data Analytics','Web Development']
}

export const domains: Domain[] = [
  {name:'Data Analytics', alignment:88, reason:'Strong Python, SQL and analytical foundation.', existing:['Python','SQL'], missing:['Power BI','Statistics']},
  {name:'Frontend Development', alignment:82, reason:'Good web fundamentals and React exposure.', existing:['HTML','CSS','JavaScript','React'], missing:['Testing','Advanced TypeScript']},
  {name:'AI / Machine Learning', alignment:74, reason:'Python foundation and interest in intelligent systems.', existing:['Python'], missing:['ML Algorithms','Model Evaluation']}
]

export const jobs: JobMatch[] = [
  {id:1,title:'Junior Data Analyst',company:'Nova Analytics',location:'Hyderabad',alignment:86,matched:['Python','SQL'],missing:['Tableau']},
  {id:2,title:'Frontend Developer Intern',company:'PixelForge',location:'Bengaluru',alignment:81,matched:['React','JavaScript','CSS'],missing:['Testing']},
  {id:3,title:'Software Engineer Intern',company:'CloudNest',location:'Remote',alignment:76,matched:['Python','JavaScript'],missing:['DSA','System Design']}
]

export const gaps: SkillGap[] = [
  {skill:'Advanced SQL',current:55,required:80,status:'Developing'},
  {skill:'Statistics',current:40,required:75,status:'Needs Improvement'},
  {skill:'Data Visualization',current:30,required:70,status:'Missing'},
  {skill:'Python',current:78,required:80,status:'Strong'}
]

export const roadmap: RoadmapTask[] = [
  {week:1,title:'SQL Fundamentals',description:'Queries, joins, grouping and subqueries.',done:true},
  {week:2,title:'Advanced SQL',description:'Window functions, CTEs and optimization.',done:false},
  {week:3,title:'Statistics',description:'Probability, distributions and hypothesis testing.',done:false},
  {week:4,title:'Data Visualization',description:'Build clear dashboards and visual stories.',done:false},
  {week:5,title:'Analytics Project',description:'Complete one portfolio-ready analytics project.',done:false},
  {week:6,title:'Interview Preparation',description:'Practice SQL, analytics and behavioral questions.',done:false}
]
