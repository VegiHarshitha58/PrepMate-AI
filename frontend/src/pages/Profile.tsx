import { useState } from 'react'
import { profile as initial } from '../data/mock'
import { Badge, Button, Card, PageHeader, Progress } from '../components/UI'

export default function Profile(){
 const [edit,setEdit]=useState(false); const [p,setP]=useState(initial); const [draft,setDraft]=useState(initial)
 const save=()=>{setP(draft);setEdit(false)}; const cancel=()=>{setDraft(p);setEdit(false)}
 return <><PageHeader title="My Profile" subtitle="Keep your information complete so recommendations can be more relevant."/>
 <Card><div className="section-title"><div><h2>{p.name}</h2><p>{p.degree} · {p.branch}</p></div>{!edit?<Button onClick={()=>setEdit(true)}>Edit Profile</Button>:<div className="actions"><Button variant="secondary" onClick={cancel}>Cancel</Button><Button onClick={save}>Save Changes</Button></div>}</div><Progress value={92}/><small>Profile completion: 92%</small></Card>
 <div className="two-col"><Card><h2>Personal Information</h2>{[['Name','name'],['Email','email'],['Phone','phone'],['Location','location']].map(([l,k])=><label key={k}>{l}<input disabled={!edit} value={(draft as any)[k]} onChange={e=>setDraft({...draft,[k]:e.target.value})}/></label>)}</Card>
 <Card><h2>Education</h2>{[['College','college'],['Degree','degree'],['Branch','branch'],['CGPA','cgpa']].map(([l,k])=><label key={k}>{l}<input disabled={!edit} value={(draft as any)[k]} onChange={e=>setDraft({...draft,[k]:k==='cgpa'?Number(e.target.value):e.target.value})}/></label>)}</Card></div>
 <Card><h2>Technical Skills</h2><div className="badges">{p.skills.map(x=><Badge key={x}>{x}</Badge>)}</div><h3>Soft Skills</h3><div className="badges">{p.softSkills.map(x=><Badge key={x}>{x}</Badge>)}</div><h3>Interests</h3><div className="badges">{p.interests.map(x=><Badge key={x}>{x}</Badge>)}</div></Card></>
}