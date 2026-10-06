export function revenueGoalMetrics(currentNetCents:number,goalCents:number,now=new Date()){
 const goal=Math.max(0,Number(goalCents||0)),current=Math.max(0,Number(currentNetCents||0))
 const year=now.getUTCFullYear(),month=now.getUTCMonth(),day=now.getUTCDate()
 const daysInMonth=new Date(Date.UTC(year,month+1,0)).getUTCDate()
 const elapsed=Math.max(1,day),remaining=Math.max(0,daysInMonth-day)
 const progress=goal?current/goal:0
 const projectedCents=Math.round((current/elapsed)*daysInMonth)
 const remainingCents=Math.max(0,goal-current)
 const dailyNeededCents=remaining?Math.ceil(remainingCents/remaining):remainingCents
 return {goalCents:goal,currentNetCents:current,progress,projectedCents,remainingCents,dailyNeededCents,daysRemaining:remaining,onPace:goal>0&&projectedCents>=goal}
}
