import React, { useRef } from 'react';
import { C } from '../theme.js';
import { Plus } from './Icons.jsx';
import { ProgramsModal } from './ProgramsModal.jsx';

export const ProgramsTab = React.memo(function ProgramsTab({ programs, currentWeek, favorites, dispatch }) {
  const modalRef = useRef(null);
  return (
    <div style={{ padding:"20px 16px 100px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
        <h2 style={{ fontSize:22, fontWeight:800, color:C.text, margin:0 }}>Programs</h2>
        <button onClick={() => modalRef.current?.createProgram()} style={{
          padding:"8px 14px", borderRadius:10, border:"none", cursor:"pointer",
          background:C.accent, color:"#fff", fontFamily:"inherit",
          fontSize:13, fontWeight:700, display:"flex", alignItems:"center", gap:5,
        }}><Plus s={13}/> Create</button>
      </div>
      <div style={{ fontSize:13, color:C.textDim, marginBottom:20 }}>Create and manage workout programs</div>
      <ProgramsModal ref={modalRef} dispatch={dispatch} programs={programs} currentWeek={currentWeek} inline={true} favorites={favorites} />
    </div>
  );
});
