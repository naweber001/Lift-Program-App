import React, { useState } from 'react';
import { C, U } from '../theme.js';
import { getInpSm, Badge } from './UI.jsx';
import { ChevDown, ArrowUp, ArrowDown, Check, LinkIco, UnlinkIco, Trash, X } from './Icons.jsx';
import { SetRow } from './SetRow.jsx';

export function ExerciseLog({ ex, dateKey, dispatch, isPaired, onPair, availablePartners, isFirst, isLast, lastWeight }) {
  const [open, setOpen] = useState(false);
  const [showPairPicker, setShowPairPicker] = useState(false);
  const completedSets = ex.sets.filter(s => s.done).length;
  const totalSets = ex.sets.length;
  const allDone = completedSets === totalSets && totalSets > 0;

  const moveBtn = (dir) => ({
    background:"none", border:`1px solid ${C.border}`, borderRadius:8, width:30, height:30,
    display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:C.textDim, flexShrink:0, padding:0,
  });

  return (
    <div style={{ background:C.card, borderRadius:14, border:`1px solid ${allDone ? C.success+"50" : C.border}`, overflow:"hidden" }}>
      <div style={{ display:"flex", alignItems:"center", padding:"10px 10px 10px 0" }}>
        {/* Move buttons */}
        <div style={{ display:"flex", flexDirection:"column", gap:2, padding:"0 6px", flexShrink:0 }}>
          <button onClick={(e)=>{e.stopPropagation();dispatch({type:"MOVE_EXERCISE",payload:{dateKey,exId:ex.id,direction:-1}});}} disabled={isFirst} style={{ ...moveBtn(), opacity:isFirst?0.3:1 }}><ArrowUp s={12}/></button>
          <button onClick={(e)=>{e.stopPropagation();dispatch({type:"MOVE_EXERCISE",payload:{dateKey,exId:ex.id,direction:1}});}} disabled={isLast} style={{ ...moveBtn(), opacity:isLast?0.3:1 }}><ArrowDown s={12}/></button>
        </div>
        <button onClick={() => setOpen(!open)} style={{
          flex:1, background:"none", border:"none", cursor:"pointer", padding:"4px 6px 4px 4px",
          display:"flex", alignItems:"center", justifyContent:"space-between", fontFamily:"inherit",
        }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, textAlign:"left" }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color: allDone ? C.success : C.text }}>{ex.name}</div>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:3, flexWrap:"wrap" }}>
              <Badge muscle={ex.muscle} small />
              <span style={{ fontSize:11, color:C.textMuted }}>
                {completedSets}/{totalSets} sets
                {!ex.isCardio && ex.targetReps ? ` · target ${ex.targetReps} reps` : ""}
              </span>
              {lastWeight && <span style={{ fontSize:10, color:C.accent, fontStyle:"italic" }}>Last: {lastWeight.weight} × {lastWeight.reps}</span>}
            </div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {allDone && <Check s={14}/>}
          <ChevDown open={open}/>
        </div>
      </button>
      </div>

      {open && (
        <div style={{ padding:"0 14px 14px", display:"flex", flexDirection:"column", gap:8 }}>
          {/* Header */}
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"0 0 4px" }}>
            <div style={{ width:24, fontSize:10, fontWeight:700, color:C.textMuted, textAlign:"center" }}>SET</div>
            {ex.isCardio ? (
              <div style={{ flex:1, fontSize:10, fontWeight:700, color:C.textMuted }}>DURATION</div>
            ) : (<>
              <div style={{ width:80, fontSize:10, fontWeight:700, color:C.textMuted, textAlign:"center", flexShrink:0 }}>{"WEIGHT (" + U + ")"}</div>
              <div style={{ width:68, fontSize:10, fontWeight:700, color:C.textMuted, textAlign:"center", flexShrink:0 }}>REPS</div>
            </>)}
            <div style={{ flex:1 }}/>
            <div style={{ width:68, fontSize:10, fontWeight:700, color:C.textMuted, textAlign:"center", flexShrink:0 }}>COMPLETE</div>
          </div>

          {ex.sets.map((set, i) => (
            <SetRow key={i} set={set} idx={i} isCardio={ex.isCardio} exId={ex.id} dateKey={dateKey} dispatch={dispatch} totalSets={ex.sets.length} />
          ))}

          <div style={{ display:"flex", gap:8, marginTop:4, flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", borderRadius:8, border:`1px solid ${C.border}`, overflow:"hidden", flex:1, minWidth:80 }}>
              <button onClick={() => { if (ex.sets.length > 1) dispatch({ type:"DELETE_SET", payload:{ dateKey, exId:ex.id, setIdx:ex.sets.length-1 }}); }} disabled={ex.sets.length <= 1} style={{
                padding:"10px 14px", background:"transparent", border:"none", borderRight:`1px solid ${C.border}`,
                color: ex.sets.length > 1 ? C.textDim : C.border, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
              }}>−</button>
              <div style={{ flex:1, textAlign:"center", fontSize:12, fontWeight:600, color:C.textDim, padding:"10px 0" }}>SET</div>
              <button onClick={() => dispatch({ type:"ADD_SET", payload:{ dateKey, exId:ex.id }})} style={{
                padding:"10px 14px", background:"transparent", border:"none", borderLeft:`1px solid ${C.border}`,
                color:C.textDim, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
              }}>+</button>
            </div>

            {isPaired ? (
              <button onClick={() => dispatch({ type:"UNPAIR_SUPERSET", payload:{ dateKey, exId:ex.id }})} style={{
                padding:"10px 12px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent",
                color:C.textMuted, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:4,
              }}><UnlinkIco s={12}/> Unpair</button>
            ) : availablePartners && availablePartners.length > 0 ? (
              <button onClick={() => setShowPairPicker(!showPairPicker)} style={{
                padding:"10px 12px", borderRadius:8, border:`1px solid ${C.accent}40`, background:C.accentDim,
                color:C.accent, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:4,
              }}><LinkIco s={12}/> Superset</button>
            ) : null}

            <button onClick={() => dispatch({ type:"DELETE_EXERCISE", payload:{ dateKey, exId:ex.id }})} style={{
              padding:"10px 12px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent",
              color:C.danger, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:4,
            }}><Trash s={12}/> Remove</button>
          </div>

          {/* Pair picker */}
          {showPairPicker && availablePartners && (
            <div style={{ background:C.bg, borderRadius:10, padding:10, border:`1px solid ${C.border}`, display:"flex", flexDirection:"column", gap:4 }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:2 }}>Pair with:</div>
              {availablePartners.map(p => (
                <button key={p.id} onClick={() => { onPair(ex.id, p.id); setShowPairPicker(false); }} style={{
                  width:"100%", padding:"10px 12px", borderRadius:8, border:`1px solid ${C.border}`, background:C.card,
                  color:C.text, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", textAlign:"left",
                  display:"flex", alignItems:"center", gap:8,
                }}>
                  <Badge muscle={p.muscle} small />{p.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
