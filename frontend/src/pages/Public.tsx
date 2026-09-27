import { Link } from 'react-router-dom'
import { ArrowRight, BrainCircuit, BriefcaseBusiness, FileSearch, Map, Mic2, Sparkles } from 'lucide-react'

export function Landing(){
 const features = [[FileSearch,'Resume Analysis'],[BrainCircuit,'Career Recommendations'],[BriefcaseBusiness,'Job Matching'],[Map,'Learning Roadmap'],[Mic2,'Mock Interviews'],[Sparkles,'Placement Readiness']]
 return <div className="landing">
   <nav className="public-nav"><div className="brand"><span>PM</span><strong>PrepMate AI</strong></div><div><Link to="/login">Login</Link><Link className="btn primary" to="/register">Get Started</Link></div></nav>
   <section className="hero"><div className="eyebrow">MULTI-AGENT AI PLACEMENT ASSISTANT</div><h1>Understand your skills.<br/>Find your direction.<br/><em>Prepare for your future.</em></h1><p>One workspace to analyze your profile, discover career paths, close skill gaps and prepare confidently for placements.</p><div className="hero-actions"><Link className="btn primary" to="/register">Get Started <ArrowRight size={17}/></Link><Link className="btn secondary" to="/login">Login</Link></div></section>
   <section className="feature-grid">{features.map(([Icon,label]:any)=><div className="feature" key={label}><Icon/><h3>{label}</h3><p>Personalized, structured guidance powered by your profile and goals.</p></div>)}</section>
   <section className="journey"><h2>Your placement journey, connected.</h2><p>Profile → Resume → Career → Jobs → Skill Gaps → Roadmap → Interview → Readiness</p></section>
 </div>
}

export function Login(){return <Auth title="Welcome back" subtitle="Continue your placement preparation." button="Login"/>}
export function Register(){return <Auth title="Create your account" subtitle="Start building your placement-ready profile." button="Create Account" register/>}
function Auth({title,subtitle,button,register=false}:{title:string,subtitle:string,button:string,register?:boolean}){
 return <div className="auth"><div className="auth-card"><Link to="/" className="brand center"><span>PM</span><strong>PrepMate AI</strong></Link><h1>{title}</h1><p>{subtitle}</p>
 {register&&<><label>Full Name<input placeholder="Your name"/></label><label>College<input placeholder="College name"/></label></>}
 <label>Email<input type="email" placeholder="student@example.com"/></label><label>Password<input type="password" placeholder="••••••••"/></label>
 <Link className="btn primary wide" to="/app">{button}</Link><small>Demo interface only — no real authentication is performed.</small></div></div>
}