import React, { useState } from 'react';
import { C } from '../theme.js';
import { getInp, Badge, Sheet, lbl } from './UI.jsx';
import { X, ChevDown, StarIco } from './Icons.jsx';
import { MUSCLE_GROUPS, CARDIO_GROUPS, mColor } from '../constants.js';

export function AddExerciseModal({ dateKey, dispatch, workouts, programs, exerciseFavs }) {
  const [name, setName] = useState("");
  const [muscle, setMuscle] = useState("Chest");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [showPrevious, setShowPrevious] = useState(true);
  const [filterMuscle, setFilterMuscle] = useState("All");
  const [showFavsOnly, setShowFavsOnly] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const isCardio = CARDIO_GROUPS.has(muscle);

  // Build list of previously used exercises + all program exercises
  const prevExercises = {};
  // From workout history first (these take priority)
  Object.values(workouts || {}).forEach(day => {
    if (!day.exercises) return;
    day.exercises.forEach(ex => {
      if (!prevExercises[ex.name]) {
        prevExercises[ex.name] = { muscle: ex.muscle, targetSets: ex.targetSets || ex.sets?.length || 3, targetReps: ex.targetReps || "", fromHistory: true };
      }
    });
  });
  // From programs (only add if not already from history)
  (programs || []).forEach(prog => {
    (prog.days || []).forEach(day => {
      if (day.isRest || !day.exercises) return;
      day.exercises.forEach(ex => {
        if (!prevExercises[ex.name]) {
          prevExercises[ex.name] = { muscle: ex.muscle, targetSets: ex.targetSets || "3", targetReps: ex.targetReps || "", fromHistory: false };
        }
      });
    });
  });
  const prevList = Object.entries(prevExercises).sort((a, b) => a[0].localeCompare(b[0]));
  const allMuscles = [...new Set(prevList.map(([_, s]) => s.muscle).filter(Boolean))].sort();
  const eFavs = exerciseFavs || [];
  let prevFiltered = [...prevList];
  if (showFavsOnly) prevFiltered = prevFiltered.filter(([n]) => eFavs.includes(n));
  if (filterMuscle !== "All") prevFiltered = prevFiltered.filter(([_, s]) => s.muscle === filterMuscle);
  if (name.trim()) prevFiltered = prevFiltered.filter(([n]) => n.toLowerCase().includes(name.toLowerCase()));

  const pickPrev = (exName, info) => {
    setName(exName);
    setMuscle(info.muscle || "Chest");
    setSets("");
    setReps("");
    setShowPrevious(false);
  };

  return (
    <Sheet onClose={() => dispatch({ type:"CLOSE_MODAL" })}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <h3 style={{ margin:0, fontSize:20, fontWeight:800, color:C.text }}>Add Exercise</h3>
        <button onClick={() => dispatch({ type:"CLOSE_MODAL" })} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, width:40, height:40, display:"flex", alignItems:"center", justifyContent:"center", color:C.textDim, cursor:"pointer" }}><X s={18}/></button>
      </div>

      {/* Toggle between previous exercises and manual entry */}
      {prevList.length > 0 && (
        <div style={{ display:"flex", gap:4, marginBottom:12 }}>
          <button onClick={()=>setShowPrevious(true)} style={{
            flex:1, padding:"8px", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
            background: showPrevious ? C.accentDim : C.card, color: showPrevious ? C.accent : C.textMuted,
            border: showPrevious ? `1px solid ${C.accent}` : `1px solid ${C.border}`,
          }}>From History</button>
          <button onClick={()=>setShowPrevious(false)} style={{
            flex:1, padding:"8px", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
            background: !showPrevious ? C.accentDim : C.card, color: !showPrevious ? C.accent : C.textMuted,
            border: !showPrevious ? `1px solid ${C.accent}` : `1px solid ${C.border}`,
          }}>New Exercise</button>
        </div>
      )}

      {showPrevious && prevList.length > 0 ? (
        <div>
          <input style={{ ...getInp(), marginBottom:8, fontSize:14, padding:"10px 14px" }} placeholder="Search exercises..." value={name} onChange={e=>setName(e.target.value)} />
          {/* Favs + Muscle filter */}
          <div style={{ display:"flex", gap:4, marginBottom:10, overflowX:"auto", paddingBottom:4, WebkitOverflowScrolling:"touch" }}>
            {eFavs.length > 0 && (
              <button onClick={()=>setShowFavsOnly(!showFavsOnly)} style={{
                padding:"5px 10px", borderRadius:12, fontSize:10, fontWeight:700, cursor:"pointer",
                fontFamily:"inherit", border:"none", whiteSpace:"nowrap", flexShrink:0,
                background: showFavsOnly ? "#eab308" : C.card,
                color: showFavsOnly ? "#fff" : "#eab308",
                transition:"all 0.15s",
              }}>★ Favs</button>
            )}
            {["All", ...allMuscles].map(m => (
              <button key={m} onClick={()=>setFilterMuscle(m)} style={{
                padding:"5px 10px", borderRadius:12, fontSize:10, fontWeight:700, cursor:"pointer",
                fontFamily:"inherit", border:"none", whiteSpace:"nowrap", flexShrink:0,
                background: filterMuscle===m ? C.accent : C.card,
                color: filterMuscle===m ? "#fff" : C.textMuted,
                transition:"all 0.15s",
              }}>{m}</button>
            ))}
          </div>
          <div style={{ maxHeight:350, overflowY:"auto", display:"flex", flexDirection:"column", gap:4 }}>
            {prevFiltered.length === 0 && (
              <div style={{ textAlign:"center", padding:"20px 0", color:C.textMuted, fontSize:13 }}>
                No matches. <button onClick={()=>setShowPrevious(false)} style={{ background:"none", border:"none", color:C.accent, cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:600 }}>Create new</button>
              </div>
            )}
            {(() => {
              // If searching or filtering by muscle, show flat list
              if (name.trim() || filterMuscle !== "All") {
                return prevFiltered.map(([exName, info]) => {
                  const isFav = eFavs.includes(exName);
                  return (
                    <div key={exName} style={{ display:"flex", alignItems:"center", gap:0 }}>
                      <button onClick={(e)=>{e.stopPropagation();dispatch({type:"TOGGLE_EXERCISE_FAV",payload:exName});}} style={{
                        background:"none", border:"none", cursor:"pointer", padding:"8px 6px 8px 4px",
                        color: isFav ? "#eab308" : C.textMuted, flexShrink:0, display:"flex", alignItems:"center",
                      }}><StarIco filled={isFav} s={14}/></button>
                      <button onClick={()=>pickPrev(exName, info)} style={{
                        flex:1, background:C.surface, borderRadius:10, padding:"10px 12px", border:`1px solid ${isFav ? "#eab30830" : C.border}`,
                        cursor:"pointer", fontFamily:"inherit", textAlign:"left",
                        display:"flex", alignItems:"center", gap:8,
                      }}>
                        <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{exName}</span>
                      </button>
                    </div>
                  );
                });
              }
              // Group by muscle
              const groups = {};
              prevFiltered.forEach(([exName, info]) => {
                const m = info.muscle || "Other";
                if (!groups[m]) groups[m] = [];
                groups[m].push([exName, info]);
              });
              const sortedGroups = Object.keys(groups).sort();
              return sortedGroups.map(muscle => {
                const isOpen = expandedGroup === muscle;
                const exs = groups[muscle];
                return (
                  <div key={muscle}>
                    <button onClick={() => setExpandedGroup(isOpen ? null : muscle)} style={{
                      width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
                      padding:"8px 12px", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"inherit",
                      background: isOpen ? C.accentDim : C.card, marginBottom: isOpen ? 4 : 0,
                    }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <Badge muscle={muscle} small />
                        <span style={{ fontSize:13, fontWeight:700, color: isOpen ? C.accent : C.text }}>{muscle}</span>
                        <span style={{ fontSize:11, color:C.textMuted }}>({exs.length})</span>
                      </div>
                      <ChevDown open={isOpen}/>
                    </button>
                    {isOpen && (
                      <div style={{ display:"flex", flexDirection:"column", gap:3, paddingLeft:4, marginBottom:6 }}>
                        {exs.map(([exName, info]) => {
                          const isFav = eFavs.includes(exName);
                          return (
                            <div key={exName} style={{ display:"flex", alignItems:"center", gap:0 }}>
                              <button onClick={(e)=>{e.stopPropagation();dispatch({type:"TOGGLE_EXERCISE_FAV",payload:exName});}} style={{
                                background:"none", border:"none", cursor:"pointer", padding:"6px 6px 6px 2px",
                                color: isFav ? "#eab308" : C.textMuted, flexShrink:0, display:"flex", alignItems:"center",
                              }}><StarIco filled={isFav} s={12}/></button>
                              <button onClick={()=>pickPrev(exName, info)} style={{
                                flex:1, background:C.surface, borderRadius:8, padding:"8px 10px", border:`1px solid ${isFav ? "#eab30830" : C.border}`,
                                cursor:"pointer", fontFamily:"inherit", textAlign:"left",
                              }}>
                                <span style={{ fontSize:12, fontWeight:600, color:C.text }}>{exName}</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div><label style={lbl()}>Exercise Name</label>
            <input style={getInp()} placeholder="e.g. Bench Press" value={name} onChange={e=>setName(e.target.value)} /></div>
          <div>
            <label style={lbl()}>Category</label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {MUSCLE_GROUPS.map(m => (
                <button key={m} onClick={()=>setMuscle(m)} style={{
                  padding:"12px 14px", borderRadius:12, fontSize:13, fontWeight:600,
                  border: muscle===m ? `1.5px solid ${mColor[m]}` : `1px solid ${C.border}`,
                  background: muscle===m ? `${mColor[m]}18` : C.bg, color: muscle===m ? mColor[m] : C.textDim,
                  cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:8,
                }}><span style={{ width:8,height:8,borderRadius:"50%",background:muscle===m?mColor[m]:C.textMuted }}/>{m}</button>
              ))}
            </div>
          </div>
          {!isCardio && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div><label style={lbl()}>Sets</label><input style={getInp()} placeholder="3" inputMode="numeric" value={sets} onChange={e=>setSets(e.target.value)}/></div>
              <div><label style={lbl()}>Target Reps</label><input style={getInp()} placeholder="10" inputMode="numeric" value={reps} onChange={e=>setReps(e.target.value)}/></div>
            </div>
          )}
          <button onClick={() => { if(!name.trim()) return; dispatch({ type:"ADD_EXERCISE", payload:{ dateKey, exercise:{ name:name.trim(), muscle, targetSets:isCardio?"1":sets, targetReps:reps, fromProgram:false }}}); }} style={{
            padding:"16px", borderRadius:14, border:"none", background:C.accent, color:"#fff", fontSize:16, fontWeight:800, cursor:"pointer", fontFamily:"inherit",
          }}>Add Exercise</button>
        </div>
      )}
    </Sheet>
  );
}
