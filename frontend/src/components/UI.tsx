import React from 'react'

export const Card = ({children, className=''}:{children:React.ReactNode,className?:string}) => <div className={`card ${className}`}>{children}</div>
export const Badge = ({children}:{children:React.ReactNode}) => <span className="badge">{children}</span>
export const Progress = ({value}:{value:number}) => <div className="progress"><span style={{width:`${Math.min(100,Math.max(0,value))}%`}} /></div>
export const Button = ({children,onClick,variant='primary',type='button'}:{children:React.ReactNode,onClick?:()=>void,variant?:'primary'|'secondary'|'ghost',type?:'button'|'submit'}) =>
  <button type={type} onClick={onClick} className={`btn ${variant}`}>{children}</button>
export const PageHeader = ({title,subtitle}:{title:string,subtitle:string}) => <div className="page-header"><div><h1>{title}</h1><p>{subtitle}</p></div></div>
