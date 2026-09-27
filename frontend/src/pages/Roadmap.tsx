import { useState } from 'react'
import { roadmap as initial } from '../data/mock'
import { Badge, Card, PageHeader, Progress } from '../components/UI'

export default function Roadmap(){
 const [tasks,setTasks]=useState(initial); const pct=Math.round(tasks.filter(t=>t.done).length/tasks.length*100)
 return <><PageHeader title="Personalized Roadmap" subtitle="A structured learning path toward your selected role."/><Card><h2>Goal: Become placement-ready for Junior Data Analyst</h2><Progress value={pct}/><p>{pct}% complete</p></Card><div className="timeline">{tasks.map(t=><Card key={t.week}><div className="section-title"><div><Badge>Week {t.week}</Badge><h2>{t.title}</h2></div><input type="checkbox" checked={t.done} onChange={()=>setTasks(tasks.map(x=>x.week===t.week?{...x,done:!x.done}:x))}/></div><p>{t.description}</p><small>{t.done?'Completed':'Not completed'}</small></Card>)}</div></>
}