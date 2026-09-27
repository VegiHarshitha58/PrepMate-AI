import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { Card, PageHeader, Progress } from '../components/UI'
import { domains, gaps, jobs } from '../data/mock'

export default function Dashboard(){
 const metrics=[['Profile Completion',92],['Resume Score',78],['Placement Readiness',74],['Interview Score',71]]
 const chart=[{name:'Resume',score:78},{name:'Skills',score:70},{name:'Projects',score:82},{name:'Interview',score:71},{name:'Roadmap',score:65}]
 return <><PageHeader title="Dashboard" subtitle="Your placement preparation at a glance."/>
 <div className="metric-grid">{metrics.map(([x,v])=><Card key={x as string}><small>{x}</small><div className="metric">{v}%</div><Progress value={v as number}/></Card>)}</div>
 <div className="two-col"><Card><h2>Readiness overview</h2><div className="chart"><ResponsiveContainer width="100%" height={240}><BarChart data={chart}><XAxis dataKey="name"/><YAxis domain={[0,100]}/><Tooltip/><Bar dataKey="score" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div></Card>
 <Card><h2>Recommended domains</h2>{domains.map(d=><div className="row-item" key={d.name}><div><strong>{d.name}</strong><small>{d.reason}</small></div><b>{d.alignment}%</b></div>)}</Card></div>
 <div className="two-col"><Card><h2>Top job matches</h2>{jobs.slice(0,3).map(j=><div className="row-item" key={j.id}><div><strong>{j.title}</strong><small>{j.company} · {j.location}</small></div><b>{j.alignment}%</b></div>)}</Card>
 <Card><h2>Current skill gaps</h2>{gaps.slice(0,4).map(g=><div className="row-item" key={g.skill}><div><strong>{g.skill}</strong><small>{g.status}</small></div><b>{g.required-g.current}% gap</b></div>)}</Card></div></>
}