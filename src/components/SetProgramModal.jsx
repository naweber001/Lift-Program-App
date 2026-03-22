import React, { useState } from 'react';
import { C } from '../theme.js';
import { Sheet } from './UI.jsx';
import { X, Chevron, Check, ArrowUp, ArrowDown } from './Icons.jsx';
import { getDays, weekDates, localDateStr, weekLabel } from '../dateUtils.js';

export function SetProgramModal({ dispatch, programs, currentWeek, workouts }) {
  const [selProg, setSelProg] = useState(null);
  const [assigns, setAssigns] = useState({});
  const [applied, setApplied] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmApply, setConfirmApply] = useState(false);
  const wds = weekDates(currentWeek);

  // Check if this week has any existing workout data
  const weekHasData = wds.some(date => {
    const dk = localDateStr(date);
    const w = workouts[dk];
    return w && (w.exercises?.length > 0 || w.isRest);
  });

  const [slots, setSlots] = useState([]); // 7 slots, each is a program day index or null

  const selectProg = (p) => {
    setSelProg(p);
    // Fill slots: program days in order, then nulls for remaining weekdays
    const s = Array(7).fill(null);
    p.days.forEach((_, i) => { if (i < 7) s[i] = i; });
    setSlots(s);
    setConfirmApply(false);
  };

  // Convert slots back to assigns format for dispatch
  const slotsToAssigns = () => {
    const a = {};
    slots.forEach((progIdx, weekIdx) => {
      if (progIdx !== null) a[progIdx] = weekIdx;
    });
    return a;
  };

  const doClear = () => {
    dispatch({ type:"CLEAR_SCHEDULE", payload:currentWeek });
    weekDates(currentWeek).forEach(date => {
      const dk = localDateStr(date);
      dispatch({ type:"CLEAR_DAY", payload:dk });
    });
    dispatch({ type:"CLOSE_MODAL" });
  };

  const doApply = () => {
    if (!selProg) return;
    const assigns = slotsToAssigns();
    // Clear existing week data first
    wds.forEach(date => {
      const dk = localDateStr(date);
      dispatch({ type:"CLEAR_DAY", payload:dk });
    });
    dispatch({ type:"SET_SCHEDULE", payload:{ weekKey:currentWeek, programId:selProg.id, assignments:assigns }});
    selProg.days.forEach((d, i) => {
      if (assigns[i] === undefined) return; // program day not assigned to any slot
      const wdIdx = assigns[i];
      const dateKey = localDateStr(wds[wdIdx]);
      if (d.isRest) {
        dispatch({ type:"INIT_DAY", payload:{ dateKey, programDayName:d.name, exercises:[], isRest:true }});
      } else {
        dispatch({ type:"INIT_DAY", payload:{ dateKey, programDayName:d.name, exercises:d.exercises }});
      }
    });
    setApplied(true);
    setTimeout(() => dispatch({ type:"CLOSE_MODAL" }), 600);
  };

  const handleApply = () => {
    if (weekHasData) {
      setConfirmApply(true);
    } else {
      doApply();
    }
  };

  return (
    <Sheet onClose={()=>dispatch({type:"CLOSE_MODAL"})}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h3 style={{ margin:0, fontSize:20, fontWeight:800, color:C.text }}>Set Program</h3>
          <div style={{ fontSize:13, color:C.textDim, marginTop:2 }}>{weekLabel(currentWeek)}</div>
        </div>
        <button onClick={()=>dispatch({type:"CLOSE_MODAL"})} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, width:40, height:40, display:"flex", alignItems:"center", justifyContent:"center", color:C.textDim, cursor:"pointer" }}><X s={18}/></button>
      </div>

      {/* Program picker */}
      {!selProg && (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {!confirmClear ? (
            <button onClick={() => setConfirmClear(true)} style={{
              background:"transparent", borderRadius:14, padding:"16px 18px", border:`1px solid ${C.border}`, cursor:"pointer",
              fontFamily:"inherit", display:"flex", alignItems:"center", width:"100%", gap:10,
            }}>
              <X s={16}/>
              <div style={{ textAlign:"left" }}>
                <div style={{ fontSize:16, fontWeight:700, color:C.danger }}>Clear Program</div>
                <div style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>Remove program from this week</div>
              </div>
            </button>
          ) : (
            <div style={{
              borderRadius:14, padding:"16px 18px", border:`1.5px solid ${C.danger}`,
              background:`${C.danger}10`, display:"flex", flexDirection:"column", gap:12,
            }}>
              <div style={{ fontSize:14, fontWeight:600, color:C.text, textAlign:"center" }}>
                Are you sure? This will clear all workout data for this week.
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => setConfirmClear(false)} style={{
                  flex:1, padding:"12px", borderRadius:10, border:`1px solid ${C.border}`, background:C.surface,
                  color:C.textDim, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
                }}>Cancel</button>
                <button onClick={doClear} style={{
                  flex:1, padding:"12px", borderRadius:10, border:"none", background:C.danger,
                  color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
                }}>Yes, Clear</button>
              </div>
            </div>
          )}
          {programs.map(p => (
            <button key={p.id} onClick={()=>selectProg(p)} style={{
              background:C.card, borderRadius:14, padding:"16px 18px", border:`1px solid ${C.border}`, cursor:"pointer",
              fontFamily:"inherit", display:"flex", justifyContent:"space-between", alignItems:"center", width:"100%", textAlign:"left",
            }}>
              <div>
                <div style={{ fontSize:16, fontWeight:700, color:C.text }}>{p.name}</div>
                <div style={{ fontSize:12, color:C.textDim, marginTop:3 }}>{p.days.length} day{p.days.length>1?"s":""} — {p.days.map(d=>d.name).join(", ")}</div>
              </div>
              <Chevron dir="r"/>
            </button>
          ))}
        </div>
      )}

      {/* Day assignment */}
      {selProg && (
        <>
          <button onClick={()=>{setSelProg(null);setApplied(false);}} style={{ background:"none",border:"none",color:C.accent,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,padding:0,marginBottom:16,display:"flex",alignItems:"center",gap:4 }}><Chevron dir="l"/> Choose different program</button>

          <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:16 }}>{selProg.name}</div>

          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {getDays().map((dayLabel, wi) => {
              const progIdx = slots[wi];
              const progDay = progIdx !== null ? selProg.days[progIdx] : null;
              const canMoveUp = progDay && wi > 0;
              const canMoveDown = progDay && wi < 6;

              const moveSlot = (fromIdx, toIdx) => {
                const s = [...slots];
                [s[fromIdx], s[toIdx]] = [s[toIdx], s[fromIdx]];
                setSlots(s);
              };

              return (
                <div key={wi} style={{
                  background: progDay ? C.card : "transparent",
                  borderRadius: 12, padding: progDay ? "10px 12px" : "6px 12px",
                  border: `1px solid ${progDay?.isRest ? C.success+"40" : progDay ? C.border : C.border+"60"}`,
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  {/* Day label */}
                  <div style={{ width: 36, flexShrink: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: C.accent, textTransform: "uppercase" }}>{dayLabel}</div>
                    <div style={{ fontSize: 10, color: C.textMuted }}>{wds[wi].getDate()}</div>
                  </div>

                  {/* Program day info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {progDay ? (
                      <>
                        <div style={{ fontSize: 13, fontWeight: 600, color: progDay.isRest ? C.success : C.text }}>
                          {progDay.name}{progDay.isRest ? " — Rest" : ""}
                        </div>
                        {!progDay.isRest && progDay.exercises && (
                          <div style={{ fontSize: 10, color: C.textMuted, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {progDay.exercises.map(e => e.name).join(", ")}
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ fontSize: 12, color: C.textMuted, fontStyle: "italic" }}>Empty</div>
                    )}
                  </div>

                  {/* Move arrows */}
                  {progDay && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
                      <button onClick={() => canMoveUp && moveSlot(wi, wi - 1)} disabled={!canMoveUp} style={{
                        background: "none", border: `1px solid ${C.border}`, borderRadius: 6, width: 28, height: 28,
                        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                        color: C.textDim, opacity: canMoveUp ? 1 : 0.3,
                      }}><ArrowUp s={10}/></button>
                      <button onClick={() => canMoveDown && moveSlot(wi, wi + 1)} disabled={!canMoveDown} style={{
                        background: "none", border: `1px solid ${C.border}`, borderRadius: 6, width: 28, height: 28,
                        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                        color: C.textDim, opacity: canMoveDown ? 1 : 0.3,
                      }}><ArrowDown s={10}/></button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!confirmApply ? (
            <button onClick={handleApply} disabled={applied} style={{
              width:"100%", padding:"16px", borderRadius:14, marginTop:16, border:"none",
              background: applied ? C.success : C.accent, color:"#fff", fontSize:16, fontWeight:800, cursor:"pointer", fontFamily:"inherit",
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            }}>{applied ? <><Check s={16}/> Applied</> : "Apply to This Week"}</button>
          ) : (
            <div style={{
              borderRadius:14, padding:"16px 18px", marginTop:16, border:`1.5px solid ${C.danger}`,
              background:`${C.danger}10`, display:"flex", flexDirection:"column", gap:12,
            }}>
              <div style={{ fontSize:14, fontWeight:600, color:C.text, textAlign:"center" }}>
                This week already has workout data. Applying a new program will replace it. Continue?
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => setConfirmApply(false)} style={{
                  flex:1, padding:"12px", borderRadius:10, border:`1px solid ${C.border}`, background:C.surface,
                  color:C.textDim, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
                }}>Cancel</button>
                <button onClick={doApply} style={{
                  flex:1, padding:"12px", borderRadius:10, border:"none", background:C.danger,
                  color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
                }}>Yes, Replace</button>
              </div>
            </div>
          )}
        </>
      )}
    </Sheet>
  );
}
