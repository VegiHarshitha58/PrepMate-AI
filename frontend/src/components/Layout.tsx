import { NavLink, Outlet } from 'react-router-dom'
import { BarChart3, BriefcaseBusiness, FileText, Gauge, GraduationCap, Menu, Mic2, Route, Settings, User, X } from 'lucide-react'
import { useState } from 'react'

const items = [
  ['Dashboard','/app',Gauge], ['My Profile','/app/profile',User], ['Resume','/app/resume',FileText],
  ['Career Domains','/app/domains',GraduationCap], ['Job Matches','/app/jobs',BriefcaseBusiness],
  ['Skill Gaps','/app/skill-gaps',BarChart3], ['Roadmap','/app/roadmap',Route],
  ['Interview','/app/interview',Mic2], ['Progress','/app/progress',BarChart3],
  ['Final Report','/app/report',FileText], ['Settings','/app/settings',Settings]
] as const

export default function Layout(){
  const [open,setOpen]=useState(false)
  return <div className="shell">
    <button className="mobile-menu" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button>
    <aside className={open?'sidebar open':'sidebar'}>
      <div className="brand"><span>PM</span><div><strong>PrepMate AI</strong><small>Placement Mentor</small></div></div>
      <nav>{items.map(([label,to,Icon])=><NavLink key={to} to={to} end={to==='/app'} onClick={()=>setOpen(false)}><Icon size={18}/>{label}</NavLink>)}</nav>
    </aside>
    <main className="main"><header className="topbar"><div><strong>PrepMate AI</strong><small>AI-powered placement preparation</small></div><div className="avatar">AS</div></header><div className="content"><Outlet/></div></main>
  </div>
}