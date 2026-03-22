import React, { useState } from 'react';
import { C, U } from '../theme.js';
import { getInpSm, Badge } from './UI.jsx';
import { ChevDown, ArrowUp, ArrowDown, Check, LinkIco, UnlinkIco } from './Icons.jsx';
import { mColor } from '../constants.js';

export function SupersetLog({ exA, exB, dateKey, dispatch, isFirst, isLast }) {
  const [open, setOpen] = useState(false);
  const allSets = [...exA.sets, ...exB.sets];
  const doneSets = allSets.filter(s => s.done).length;
  const totalSets = allSets.length;
  const allDone = totalSets > 0 && doneSets === totalSets;

  // Build alternating rows: set 1 of A, set 1 of B, set 2 of A, set 2 of B, ...
  const maxSets = Math.max(exA.sets.length, exB.sets.length);
  const rows = [];
  for (let i = 0; i < maxSets; i++) {
    if (i < exA.sets.length) rows.push({ ex: exA, setIdx: i, setNum: i + 1 });
    if (i < exB.sets.length) rows.push({ ex: exB, setIdx: i, setNum: i + 1 });
  }

  const colorA = mColor[exA.muscle] || C.accent;
  const colorB = mColor[exB.muscle] || C.accent;

  const moveBtn = {
    background:"none", border:`1px solid ${C.accent}40`, borderRadius:8, width:30, height:30,
    display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:C.textDim, flexShrink:0, padding:0,
  };

  return (
    <div style={{
      borderRadius:16, border:`1.5px solid ${C.accent}40`, overflow:"hidden",
      background:`linear-gradient(135deg, ${C.accentDim}, transparent)`,
    }}>
      <div style={{ display:"flex", alignItems:"center", padding:"10px 10px 10px 0" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:2, padding:"0 6px", flexShrink:0 }}>
          <button onClick={(e)=>{e.stopPropagation();dispatch({type:"MOVE_EXERCISE",payload:{dateKey,exId:exA.id,direction:-1}});}} disabled={isFirst} style={{ ...moveBtn, opacity:isFirst?0.3:1 }}><ArrowUp s={12}/></button>
          <button onClick={(e)=>{e.stopPropagation();dispatch({type:"MOVE_EXERCISE",payload:{dateKey,exId:exA.id,direction:1}});}} disabled={isLast} style={{ ...moveBtn, opacity:isLast?0.3:1 }}><ArrowDown s={12}/></button>
        </div>
        <button onClick={() => setOpen(!open)} style={{
          flex:1, background:"none", border:"none", cursor:"pointer", padding:"4px 6px 4px 4px",
          display:"flex", alignItems:"center", justifyContent:"space-between", fontFamily:"inherit",
        }}>
        <div style={{ textAlign:"left" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
            <LinkIco s={12}/>
            <span style={{ fontSize:11, fontWeight:700, color:C.accent, textTransform:"uppercase", letterSpacing:"0.06em" }}>Superset</span>
          </div>
          <div style={{ fontSize:15, fontWeight:700, color: allDone ? C.success : C.text }}>
            {exA.name} <span style={{ color:C.textMuted, fontWeight:400, fontSize:13 }}>&</span> {exB.name}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:3 }}>
            <Badge muscle={exA.muscle} small />
            <Badge muscle={exB.muscle} small />
            <span style={{ fontSize:11, color:C.textMuted }}>{doneSets}/{totalSets} sets</span>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {allDone && <Check s={14}/>}
          <ChevDown open={open}/>
        </div>
      </button>
      </div>

      {open && (
        <div style={{ padding:"0 12px 14px", display:"flex", flexDirection:"column", gap:6 }}>
          {/* Header */}
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"0 2px 2px" }}>
            <div style={{ width:28 }}/>
            <div style={{ width:60, fontSize:10, fontWeight:700, color:C.textMuted, flexShrink:0 }}>EXERCISE</div>
            <div style={{ flex:1, fontSize:10, fontWeight:700, color:C.textMuted }}>{"WEIGHT (" + U + ")"}</div>
            <div style={{ width:52, fontSize:10, fontWeight:700, color:C.textMuted }}>REPS</div>
            <div style={{ width:36 }}/>
          </div>

          {rows.map((row, i) => {
            const isA = row.ex.id === exA.id;
            const set = row.ex.sets[row.setIdx];
            const exColor = isA ? colorA : colorB;
            const done = set.done;

            return (
              <div key={`${row.ex.id}-${row.setIdx}`} style={{
                display:"flex", alignItems:"center", gap:8,
                background: isA ? `${colorA}0a` : `${colorB}0a`,
                borderRadius:8, padding:"2px 2px 2px 0",
              }}>
                <div style={{ width:3, height:36, borderRadius:2, background:exColor, flexShrink:0 }}/>
                <div style={{ width:24, fontSize:12, fontWeight:700, color:C.textMuted, textAlign:"center", flexShrink:0 }}>{row.setNum}</div>
                <div style={{ width:56, fontSize:11, fontWeight:600, color:exColor, flexShrink:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {isA ? exA.name.split(" ")[0] : exB.name.split(" ")[0]}
                </div>
                {row.ex.isCardio ? (
                  <input style={{ ...getInpSm(), flex:1 }} placeholder="Duration" value={set.duration||""} onChange={e => dispatch({ type:"UPDATE_SET", payload:{ dateKey, exId:row.ex.id, setIdx:row.setIdx, field:"duration", value:e.target.value }})} />
                ) : (<>
                  <input style={{ ...getInpSm(), width:68, flexShrink:0, textAlign:"center" }} placeholder={U} inputMode="decimal" value={set.weight||""} onChange={e => dispatch({ type:"UPDATE_SET", payload:{ dateKey, exId:row.ex.id, setIdx:row.setIdx, field:"weight", value:e.target.value }})} />
                  <input style={{ ...getInpSm(), width:44, flexShrink:0, textAlign:"center" }} placeholder="reps" inputMode="numeric" value={set.reps||""} onChange={e => dispatch({ type:"UPDATE_SET", payload:{ dateKey, exId:row.ex.id, setIdx:row.setIdx, field:"reps", value:e.target.value }})} />
                </>)}
                <button onClick={() => dispatch({ type:"TOGGLE_SET_DONE", payload:{ dateKey, exId:row.ex.id, setIdx:row.setIdx }})} style={{
                  width:32, height:32, borderRadius:8, border: done ? `1.5px solid ${C.success}` : `1px solid ${C.border}`,
                  background: done ? C.successDim : "transparent", display:"flex",alignItems:"center",justifyContent:"center",
                  cursor:"pointer", flexShrink:0, color: done ? C.success : C.textMuted,
                }}><Check s={12}/></button>
              </div>
            );
          })}

          <div style={{ display:"flex", gap:8, marginTop:4, flexWrap:"wrap" }}>
            <button onClick={() => dispatch({ type:"ADD_SET", payload:{ dateKey, exId:exA.id }})} style={{
              flex:1, minWidth:70, padding:"10px", borderRadius:8, border:`1px dashed ${C.border}`, background:"transparent",
              color:colorA, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
            }}>+ {exA.name.split(" ")[0]}</button>
            <button onClick={() => dispatch({ type:"ADD_SET", payload:{ dateKey, exId:exB.id }})} style={{
              flex:1, minWidth:70, padding:"10px", borderRadius:8, border:`1px dashed ${C.border}`, background:"transparent",
              color:colorB, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
            }}>+ {exB.name.split(" ")[0]}</button>
            <button onClick={() => dispatch({ type:"UNPAIR_SUPERSET", payload:{ dateKey, exId:exA.id }})} style={{
              padding:"10px 12px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent",
              color:C.textMuted, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:4,
            }}><UnlinkIco s={12}/> Unpair</button>
          </div>
        </div>
      )}
    </div>
  );
}
