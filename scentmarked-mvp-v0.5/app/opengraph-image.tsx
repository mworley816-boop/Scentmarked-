import { ImageResponse } from 'next/og'

export const alt='Scentmarked — Know the notes. Find the match.'
export const size={width:1200,height:630}
export const contentType='image/png'

export default function Image(){
 return new ImageResponse(<div style={{width:'100%',height:'100%',display:'flex',background:'#fbf5ec',color:'#3b1607',padding:'78px 92px',position:'relative',fontFamily:'serif'}}>
  <div style={{display:'flex',flexDirection:'column',justifyContent:'center',maxWidth:760}}>
   <div style={{fontSize:25,letterSpacing:7,color:'#9a6b3d',marginBottom:24}}>SCENTMARKED</div>
   <div style={{fontSize:76,lineHeight:1.03,fontWeight:600}}>Know the notes.<br/>Find the match.</div>
   <div style={{fontSize:27,lineHeight:1.45,marginTop:30,color:'#765743'}}>Discover fragrance notes, compare scents, and find similar fragrance profiles.</div>
  </div>
  <div style={{position:'absolute',right:92,top:112,width:220,height:350,border:'3px solid #b98a55',borderRadius:'34px 34px 24px 24px',display:'flex',alignItems:'center',justifyContent:'center',background:'#f2dfc4'}}>
   <div style={{fontSize:84,color:'#3b1607'}}>S</div>
   <div style={{position:'absolute',top:-54,width:90,height:62,border:'3px solid #b98a55',borderRadius:'12px 12px 4px 4px',background:'#3b1607'}}/>
  </div>
  <div style={{position:'absolute',left:92,bottom:48,width:1016,height:2,background:'#d9bd95'}}/>
 </div>,size)
}
