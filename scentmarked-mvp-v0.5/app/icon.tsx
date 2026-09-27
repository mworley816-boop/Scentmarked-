import { ImageResponse } from 'next/og'

export const size={width:32,height:32}
export const contentType='image/png'

export default function Icon(){
 return new ImageResponse(<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:'#3b1607',color:'#f4d7a1',fontSize:23,fontFamily:'serif',fontWeight:700,borderRadius:7}}>S</div>,size)
}
