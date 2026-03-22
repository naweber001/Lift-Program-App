import React, { useState } from 'react';
import { C } from '../theme.js';
import { getInp } from './UI.jsx';
import { X, ArrowUp, ArrowDown, LinkIco, UnlinkIco } from './Icons.jsx';
import { CARDIO_GROUPS, mColor } from '../constants.js';

export function ProgramExerciseList({ exercises, onChange }) {
  const [editingIdx, setEditingIdx] = useState(null);

  const deleteEx = (idx) => {
    const newExs = exercises.filter((_, k) => k !== idx).map(x => {
      if (x.supersetWithIdx === idx) return { ...x, supersetWithIdx: undefined };
      if (x.supersetWithIdx > idx) return { ...x, supersetWithIdx: x.supersetWithIdx - 1 };
      return x;
    });
    onChange(newExs);
  };

  const unpairEx = (idx) => {
    const partnerIdx = exercises[idx]?.supersetWithIdx;
    const newExs = exercises.map((x, k) => {
      if (k === idx || k === partnerIdx) return { ...x, supersetWithIdx: undefined };
      return x;
    });
    onChange(newExs);
  };

  const pairExs = (idx1, idx2) => {
    const newExs = exercises.map((x, k) => {
      if (k === idx1) return { ...x, supersetWithIdx: idx2 };
      if (k === idx2) return { ...x, supersetWithIdx: idx1 };
      return x;
    });
    onChange(newExs);
  };

  const moveEx = (fromIdx, direction) => {
    const toIdx = fromIdx + direction;
    if (toIdx < 0 || toIdx >= exercises.length) return;
    const arr = [...exercises];
    // Check if this is part of a superset — move both
    const ex = arr[fromIdx];
    if (ex.supersetWithIdx != null) {
      const partnerIdx = ex.supersetWithIdx;
      const minIdx = Math.min(fromIdx, partnerIdx);
      const maxIdx = Math.max(fromIdx, partnerIdx);
      const pair = [arr[minIdx], arr[maxIdx]];
      const rest = arr.filter((_, i) => i !== minIdx && i !== maxIdx);
      const insertAt = Math.max(0, Math.min(rest.length, minIdx + direction));
      rest.splice(insertAt, 0, ...pair);
      // Remap supersetWithIdx
      const oldIndices = rest.map(e => exercises.indexOf(e));
      const oldToNew = {};
      oldIndices.forEach((oldI, newI) => { oldToNew[oldI] = newI; });
      const remapped = rest.map(e => {
        if (e.supersetWithIdx != null) return { ...e, supersetWithIdx: oldToNew[e.supersetWithIdx] };
        return e;
      });
      onChange(remapped);
      return;
    }
    [arr[fromIdx], arr[toIdx]] = [arr[toIdx], arr[fromIdx]];
    // Remap superset indices
    const oldIndices = arr.map(e => exercises.indexOf(e));
    const oldToNew = {};
    oldIndices.forEach((oldI, newI) => { oldToNew[oldI] = newI; });
    const remapped = arr.map(e => {
      if (e.supersetWithIdx != null) return { ...e, supersetWithIdx: oldToNew[e.supersetWithIdx] };
      return e;
    });
    onChange(remapped);
  };

  const updateEx = (idx) => {
    const setsEl = document.getElementById(`pex-sets-${idx}`);
    const repsEl = document.getElementById(`pex-reps-${idx}`);
    if (setsEl || repsEl) {
      const newExs = [...exercises];
      newExs[idx] = { ...newExs[idx], targetSets: setsEl?.value || newExs[idx].targetSets, targetReps: repsEl?.value || newExs[idx].targetReps };
      onChange(newExs);
    }
    setEditingIdx(null);
  };

  const rendered = new Set();
  const moveBtn = (disabled) => ({
    background:"none", border:`1px solid ${C.border}`, borderRadius:8, width:28, height:28,
    display:"flex", alignItems:"center", justifyContent:"center", cursor: disabled?"default":"pointer",
    color:C.textDim, flexShrink:0, padding:0, opacity: disabled?0.3:1,
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:12 }}>
      {exercises.map((ex, j) => {
        if (rendered.has(j)) return null;
        rendered.add(j);

        const partnerIdx = ex.supersetWithIdx;
        const hasPartner = partnerIdx != null && partnerIdx >= 0 && partnerIdx < exercises.length && !rendered.has(partnerIdx);

        if (hasPartner) {
          rendered.add(partnerIdx);
          const partner = exercises[partnerIdx];
          const isFirst = Math.min(j, partnerIdx) === 0;
          const isLast = Math.max(j, partnerIdx) === exercises.length - 1;
          return (
            <div key={j} style={{ borderRadius:10, border:`1.5px solid ${C.accent}40`, padding:6, background:C.accentDim+"30" }}>
              <div style={{ display:"flex", alignItems:"center", gap:4, padding:"2px 6px 6px", color:C.accent }}>
                <div style={{ display:"flex", gap:2, marginRight:4 }}>
                  <button onClick={()=>moveEx(Math.min(j,partnerIdx),-1)} style={moveBtn(isFirst)}><ArrowUp s={11}/></button>
                  <button onClick={()=>moveEx(Math.min(j,partnerIdx),1)} style={moveBtn(isLast)}><ArrowDown s={11}/></button>
                </div>
                <LinkIco s={10}/><span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>Superset</span>
              </div>
              {[{e:ex,i:j},{e:partner,i:partnerIdx}].map(({e,i:ii}) => (
                <div key={ii} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",background:C.bg,borderRadius:8,padding:"8px 10px",marginBottom:ii===j?4:0 }}>
                  <div><span style={{ fontSize:13,fontWeight:600,color:C.text }}>{e.name}</span><span style={{ fontSize:11,color:C.textMuted,marginLeft:8 }}>{e.muscle}{!CARDIO_GROUPS.has(e.muscle)?` ${e.targetSets}x${e.targetReps}`:""}</span></div>
                  <div style={{ display:"flex", gap:4 }}>
                    <button onClick={()=>unpairEx(j)} style={{ background:"none",border:"none",color:C.textMuted,cursor:"pointer",padding:4,display:"flex" }}><UnlinkIco s={12}/></button>
                    <button onClick={()=>deleteEx(ii)} style={{ background:"none",border:"none",color:C.textMuted,cursor:"pointer",padding:4,display:"flex" }}><X s={12}/></button>
                  </div>
                </div>
              ))}
            </div>
          );
        }

        // Single exercise
        const isFirst = j === 0;
        const isLast = j === exercises.length - 1;
        return (
          <div key={j} style={{ display:"flex", alignItems:"center", background: editingIdx===j ? C.accentDim : C.bg, borderRadius:8, padding:"6px 10px 6px 6px", gap:6, border: editingIdx===j ? `1px solid ${C.accent}` : "1px solid transparent" }}>
            <div style={{ display:"flex", flexDirection:"column", gap:2, flexShrink:0 }}>
              <button onClick={()=>moveEx(j,-1)} style={moveBtn(isFirst)}><ArrowUp s={11}/></button>
              <button onClick={()=>moveEx(j,1)} style={moveBtn(isLast)}><ArrowDown s={11}/></button>
            </div>
            <div style={{ flex:1, minWidth:0, cursor:"pointer" }} onClick={()=>setEditingIdx(editingIdx===j ? null : j)}>
              <span style={{ fontSize:13,fontWeight:600,color:C.text }}>{ex.name}</span>
              {editingIdx !== j && <span style={{ fontSize:11,color:C.textMuted,marginLeft:8 }}>{ex.muscle}{!CARDIO_GROUPS.has(ex.muscle)?` ${ex.targetSets}x${ex.targetReps}`:""}</span>}
            </div>
            {editingIdx === j && !CARDIO_GROUPS.has(ex.muscle) && (
              <div style={{ display:"flex", gap:4, alignItems:"center", flexShrink:0 }}>
                <input id={`pex-sets-${j}`} defaultValue={ex.targetSets} style={{ ...getInp(), width:36, fontSize:12, padding:"5px 6px", textAlign:"center" }} inputMode="numeric" placeholder="S"/>
                <span style={{ fontSize:11, color:C.textMuted }}>×</span>
                <input id={`pex-reps-${j}`} defaultValue={ex.targetReps} style={{ ...getInp(), width:44, fontSize:12, padding:"5px 6px", textAlign:"center" }} inputMode="numeric" placeholder="R"/>
                <button onClick={()=>updateEx(j)} style={{ background:C.accent, border:"none", borderRadius:6, padding:"5px 8px", color:"#fff", fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>OK</button>
              </div>
            )}
            <div style={{ display:"flex", gap:4, flexShrink:0 }}>
              {editingIdx !== j && exercises.filter((_,k)=>k!==j && _.supersetWithIdx==null && exercises[j].supersetWithIdx==null).length > 0 && (
                <select value="" onClick={e=>e.stopPropagation()} onChange={e2=>{
                  const pi = parseInt(e2.target.value); if(isNaN(pi)) return;
                  pairExs(j, pi);
                }} style={{ background:"none",border:`1px solid ${C.accent}40`,borderRadius:6,padding:"3px 6px",color:C.accent,fontSize:11,fontFamily:"inherit",cursor:"pointer",WebkitAppearance:"none",maxWidth:80 }}>
                  <option value="">SS</option>
                  {exercises.map((x,k)=>k!==j && x.supersetWithIdx==null && exercises[j].supersetWithIdx==null ? <option key={k} value={k}>{x.name}</option> : null)}
                </select>
              )}
              <button onClick={()=>deleteEx(j)} style={{ background:"none",border:"none",color:C.textMuted,cursor:"pointer",padding:4,display:"flex" }}><X s={12}/></button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
