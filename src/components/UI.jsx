import React, { useState } from 'react';
import { C } from '../theme.js';
import { mColor } from '../constants.js';
import { ChevDown } from './Icons.jsx';

export const getInp = () => ({ background:C.bg, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px", color:C.text, fontSize:16, outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"inherit", WebkitAppearance:"none" });
export const getInpSm = () => ({ ...getInp(), padding:"10px 8px", fontSize:14, borderRadius:8 });
export const lbl = () => ({ fontSize:11, fontWeight:700, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, display:"block" });

export const Badge = ({ muscle, small }) => { const c = mColor[muscle]||C.textDim; return <span style={{ display:"inline-flex",alignItems:"center",gap:4,padding:small?"2px 7px":"4px 10px",borderRadius:6,fontSize:small?10:11,fontWeight:700,background:`${c}18`,color:c,letterSpacing:"0.04em",textTransform:"uppercase" }}><span style={{ width:small?5:6,height:small?5:6,borderRadius:"50%",background:c }}/>{muscle}</span>; };

export function NotesToggle({ label, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop:10 }}>
      <button onClick={()=>setOpen(!open)} style={{
        width:"100%", background:C.bg, border:`1px solid ${C.border}`, borderRadius:8,
        padding:"10px 12px", cursor:"pointer", fontFamily:"inherit",
        display:"flex", alignItems:"center", justifyContent:"space-between",
      }}>
        <span style={{ fontSize:12, fontWeight:600, color:C.textDim }}>{label || "Notes"}</span>
        <ChevDown open={open}/>
      </button>
      {open && (
        <div style={{ fontSize:12, color:C.textMuted, lineHeight:1.5, padding:"10px 12px", background:C.bg, borderRadius:"0 0 8px 8px", borderLeft:`1px solid ${C.border}`, borderRight:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`, marginTop:-1 }}>
          {children}
        </div>
      )}
    </div>
  );
}

export function Sheet({ onClose, children }) {
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(10px)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:1000 }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:C.surface,borderRadius:"24px 24px 0 0",padding:"24px 20px 36px",width:"100%",maxWidth:480,maxHeight:"92vh",overflowY:"auto",border:`1px solid ${C.border}`,borderBottom:"none",WebkitOverflowScrolling:"touch" }}>
        <div style={{ display:"flex",justifyContent:"center",marginBottom:16 }}><div style={{ width:36,height:4,borderRadius:2,background:C.border }}/></div>
        {children}
      </div>
    </div>
  );
}
