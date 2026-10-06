import type { financialComparison } from './financial-comparison.ts'
type Comparison=ReturnType<typeof financialComparison>
export type FinancialHealthInsight={level:'warning'|'critical'|'positive';code:string;title:string;detail:string}
const pct=(n:number)=>Math.abs(n*100).toFixed(1)+'%'
const amount=(cents:number,currency:string)=>new Intl.NumberFormat('en-US',{style:'currency',currency}).format(cents/100)
export function financialHealthInsights(c:Comparison):FinancialHealthInsight[]{
 const out:FinancialHealthInsight[]=[]
 if(c.changes.netRevenue!==null&&c.changes.netRevenue<=-.2)out.push({level:'critical',code:'revenue-down',title:'Revenue declined',detail:`Net revenue is down ${pct(c.changes.netRevenue)} versus the comparison period.`})
 else if(c.changes.netRevenue!==null&&c.changes.netRevenue<=-.1)out.push({level:'warning',code:'revenue-soft',title:'Revenue is softening',detail:`Net revenue is down ${pct(c.changes.netRevenue)} versus the comparison period.`})
 if(c.changes.expenses!==null&&c.changes.expenses>=.2)out.push({level:'warning',code:'expenses-up',title:'Expenses increased',detail:`Operating expenses are up ${pct(c.changes.expenses)} versus the comparison period.`})
 if(c.changes.margin<=-.1)out.push({level:'critical',code:'margin-down',title:'Margin contracted',detail:`Profit margin fell ${pct(c.changes.margin)} points.`})
 else if(c.changes.margin<=-.05)out.push({level:'warning',code:'margin-soft',title:'Margin is narrowing',detail:`Profit margin fell ${pct(c.changes.margin)} points.`})
 if(c.current.profitCents<0)out.push({level:'critical',code:'loss',title:'Operating loss',detail:'Operating expenses and revenue fees currently exceed revenue for this period.'})
 const currentCosts=new Map(c.current.expensesByCategory),previousCosts=new Map(c.previous.expensesByCategory)
 const drivers=[...currentCosts].map(([category,value])=>({category,value,increase:value-(previousCosts.get(category)||0)})).filter(x=>x.increase>0).sort((a,b)=>b.increase-a.increase)
 if(drivers[0])out.push({level:'warning',code:'cost-driver',title:'Largest rising cost',detail:`${drivers[0].category} increased by ${amount(drivers[0].increase,c.current.currency)} versus the comparison period.`})
 if(c.current.profitCents>0&&c.changes.profit!==null&&c.changes.profit>=.2)out.push({level:'positive',code:'profit-up',title:'Profit improved',detail:`Operating profit is up ${pct(c.changes.profit)} versus the comparison period.`})
 return out
}
