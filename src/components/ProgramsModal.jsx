import React, { useState } from 'react';
import { C } from '../theme.js';
import { getInp, Badge, NotesToggle, Sheet, lbl } from './UI.jsx';
import { Chevron, ChevDown, X, Plus, Trash, Check, LinkIco, UnlinkIco, StarIco } from './Icons.jsx';
import { MUSCLE_GROUPS, CARDIO_GROUPS, mColor } from '../constants.js';
import { ProgramExerciseList } from './ProgramExerciseList.jsx';

export const ProgramsModal = React.memo(function ProgramsModal({ dispatch, programs, currentWeek, inline, favorites }) {
  const [view, setView] = useState("list");
  const [selProg, setSelProg] = useState(null);
  const [sortBy, setSortBy] = useState("default");
  const [filterCat, setFilterCat] = useState("All");
  const [searchProg, setSearchProg] = useState("");

  // Create/Edit state
  const [editingId, setEditingId] = useState(null);
  const [cpName, setCpName] = useState("");
  const [cpDays, setCpDays] = useState([{ name: "Day 1", exercises: [] }]);
  const [cpIdx, setCpIdx] = useState(0);
  const [cpNotes, setCpNotes] = useState("");
  const [exN, setExN] = useState(""); const [exM, setExM] = useState("Chest");
  const [exS, setExS] = useState(""); const [exR, setExR] = useState("");

  const openDetail = (p) => {
    setSelProg(p);
    setView("detail");
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  };

  const openEdit = (p) => {
    setEditingId(p.id);
    setCpName(p.name);
    setCpDays(p.days.map(d => ({ name: d.name, notes: d.notes || "", isRest: d.isRest, exercises: d.exercises ? d.exercises.map(e => ({ ...e })) : [] })));
    setCpIdx(0);
    setCpNotes(p.notes || "");
    setExN(""); setExM("Chest"); setExS(""); setExR("");
    setView("edit");
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  };

  const addEx = () => {
    const nameEl = document.getElementById("ex-name");
    const setsEl = document.getElementById("ex-sets");
    const repsEl = document.getElementById("ex-reps");
    const name = (nameEl?.value || "").trim();
    if(!name) return;
    const isC = CARDIO_GROUPS.has(exM);
    const sets = setsEl?.value || "3";
    const reps = repsEl?.value || "";
    const updated = [...cpDays];
    updated[cpIdx] = { ...updated[cpIdx], exercises:[...updated[cpIdx].exercises, { name, muscle:exM, targetSets:isC?"1":sets, targetReps:reps }]};
    setCpDays(updated);
    if (nameEl) nameEl.value = "";
    if (setsEl) setsEl.value = "";
    if (repsEl) repsEl.value = "";
  };

  const saveProg = () => {
    // Read current values from uncontrolled inputs
    const nameVal = (document.getElementById("cp-name")?.value || cpName).trim();
    const notesVal = document.getElementById("cp-notes")?.value || cpNotes;
    // Read day names and notes from DOM
    const finalDays = cpDays.map((d, i) => ({
      ...d,
      name: document.getElementById(`dn-${i}`)?.value || d.name,
      notes: document.getElementById(`dnotes-${i}`)?.value || d.notes || "",
    }));

    if(!nameVal || finalDays.every(d=>d.exercises.length===0 && !d.isRest)) return;
    if (editingId) {
      dispatch({ type:"UPDATE_PROGRAM", payload:{ id:editingId, name:nameVal, notes:notesVal, days:finalDays }});
      const updated = { id:editingId, name:nameVal, notes:notesVal, days:finalDays };
      setSelProg(updated);
      setEditingId(null);
      setView("detail");
    } else {
      dispatch({ type:"ADD_PROGRAM", payload:{ id:`c_${Date.now()}`, name:nameVal, notes:notesVal, days:finalDays }});
      setView("list");
    }
    setCpName(""); setCpNotes(""); setCpDays([{name:"Day 1",exercises:[]}]); setCpIdx(0);
  };

  const resetAndCreate = () => {
    setEditingId(null); setCpName(""); setCpNotes(""); setCpDays([{name:"Day 1",exercises:[]}]); setCpIdx(0);
    setExN(""); setExM("Chest"); setExS(""); setExR("");
    setView("create");
  };

  const Wrapper = inline ? ({children}) => <>{children}</> : ({children}) => <Sheet onClose={()=>dispatch({type:"CLOSE_MODAL"})}>{children}</Sheet>;

  return (
    <Wrapper>
      {/* LIST */}
      {view==="list" && <>
        {!inline && <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h3 style={{ margin:0, fontSize:20, fontWeight:800, color:C.text }}>Programs</h3>
          <button onClick={()=>dispatch({type:"CLOSE_MODAL"})} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, width:40, height:40, display:"flex", alignItems:"center", justifyContent:"center", color:C.textDim, cursor:"pointer" }}><X s={18}/></button>
        </div>}
        {programs.length === 0 && (
          <div style={{ textAlign:"center", padding:"30px 0", color:C.textMuted, fontSize:14 }}>
            No programs yet. Create one to get started.
          </div>
        )}
        {programs.length > 0 && <>
          {/* Search */}
          <input id="prog-search" style={{ ...getInp(), marginBottom:10, fontSize:14, padding:"10px 14px" }} placeholder="Search programs..." defaultValue="" onChange={e=>setSearchProg(e.target.value)} />
          {/* Category filter */}
          <div style={{ display:"flex", gap:6, marginBottom:8 }}>
            {["All","Beginner","Intermediate","Advanced"].map(cat => (
              <button key={cat} onClick={()=>setFilterCat(cat)} style={{
                padding:"7px 14px", borderRadius:20, fontSize:12, fontWeight:700, cursor:"pointer",
                fontFamily:"inherit", border:"none",
                background: filterCat===cat ? C.accent : C.card,
                color: filterCat===cat ? "#fff" : C.textMuted,
                boxShadow: filterCat===cat ? `0 2px 8px ${C.accent}40` : "none",
                transition:"all 0.15s",
              }}>{cat}</button>
            ))}
          </div>
          {/* Sort */}
          <div style={{ display:"flex", gap:4, marginBottom:12 }}>
            {[["default","Default"],["favorites","★ Favs"],["alpha","A-Z"],["days","By Days"]].map(([val,lbl]) => (
              <button key={val} onClick={()=>setSortBy(val)} style={{
                padding:"6px 12px", borderRadius:8, fontSize:11, fontWeight:700, border:"none", cursor:"pointer",
                fontFamily:"inherit", background: sortBy===val ? C.accentDim : C.card,
                color: sortBy===val ? C.accent : C.textMuted, border: sortBy===val ? `1px solid ${C.accent}` : `1px solid ${C.border}`,
              }}>{lbl}</button>
            ))}
          </div>
        </>}
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {(() => {
            let list = [...programs];
            if (filterCat !== "All") list = list.filter(p => p.category === filterCat);
            if (searchProg.trim()) list = list.filter(p => p.name.toLowerCase().includes(searchProg.toLowerCase()));
            if (sortBy === "alpha") list.sort((a,b) => a.name.localeCompare(b.name));
            else if (sortBy === "days") list.sort((a,b) => a.days.length - b.days.length);
            else if (sortBy === "favorites") list.sort((a,b) => {
              const aFav = (favorites||[]).includes(a.id) ? 0 : 1;
              const bFav = (favorites||[]).includes(b.id) ? 0 : 1;
              return aFav - bFav;
            });
            return list.map(p => {
              const isFav = (favorites||[]).includes(p.id);
              return (
                <div key={p.id} style={{ display:"flex", alignItems:"center", gap:0 }}>
                  <button onClick={(e)=>{e.stopPropagation();dispatch({type:"TOGGLE_FAVORITE",payload:p.id});}} style={{
                    background:"none", border:"none", cursor:"pointer", padding:"8px 8px 8px 4px", display:"flex", alignItems:"center",
                    color: isFav ? "#eab308" : C.textMuted, flexShrink:0,
                  }}><StarIco filled={isFav} s={18}/></button>
                  <button onClick={()=>openDetail(p)} style={{
                    flex:1, background:C.card, borderRadius:14, padding:"16px 18px", border:`1px solid ${isFav ? "#eab30840" : C.border}`, cursor:"pointer",
                    fontFamily:"inherit", display:"flex", justifyContent:"space-between", alignItems:"center", width:"100%", textAlign:"left",
                  }}>
                    <div>
                      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                        <span style={{ fontSize:16, fontWeight:700, color:C.text }}>{p.name}</span>
                        {p.category && <span style={{ fontSize:9, fontWeight:700, padding:"2px 6px", borderRadius:6, textTransform:"uppercase", letterSpacing:"0.04em",
                          background: p.category==="Beginner" ? "#22c55e20" : p.category==="Intermediate" ? "#eab30820" : "#ef444420",
                          color: p.category==="Beginner" ? "#22c55e" : p.category==="Intermediate" ? "#eab308" : "#ef4444",
                        }}>{p.category}</span>}
                        {p.id.startsWith("c_") && <span style={{ fontSize:9, fontWeight:700, padding:"2px 6px", borderRadius:6, textTransform:"uppercase", letterSpacing:"0.04em", background:`${C.accent}20`, color:C.accent }}>Custom</span>}
                      </div>
                      <div style={{ fontSize:12, color:C.textDim, marginTop:3 }}>{p.days.length} day{p.days.length>1?"s":""} — {p.days.map(d=>d.name).join(", ")}</div>
                    </div>
                    <Chevron dir="r"/>
                  </button>
                </div>
              );
            });
          })()}
        </div>
        <button onClick={resetAndCreate} style={{
          width:"100%", padding:"16px", borderRadius:14, marginTop:12, border:`1.5px dashed ${C.border}`, background:"transparent",
          color:C.textDim, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:6,
        }}><Plus s={14}/> Create Program</button>
      </>}

      {/* DETAIL */}
      {view==="detail" && selProg && <>
        <button onClick={()=>setView("list")} style={{ background:"none",border:"none",color:C.accent,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,padding:0,marginBottom:16,display:"flex",alignItems:"center",gap:4 }}><Chevron dir="l"/> Back</button>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
          <div>
            <h3 style={{ margin:0, fontSize:20, fontWeight:800, color:C.text }}>{selProg.name}</h3>
            <div style={{ fontSize:13, color:C.textDim, marginTop:2 }}>{selProg.days.length} day{selProg.days.length>1?"s":""}</div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <button onClick={()=>dispatch({type:"TOGGLE_FAVORITE",payload:selProg.id})} style={{
              background:"none", border:"none", cursor:"pointer", padding:6, display:"flex", alignItems:"center",
              color: (favorites||[]).includes(selProg.id) ? "#eab308" : C.textMuted,
            }}><StarIco filled={(favorites||[]).includes(selProg.id)} s={20}/></button>
            <button onClick={()=>openEdit(selProg)} style={{ background:C.accentDim,border:`1px solid ${C.accent}`,borderRadius:10,padding:"8px 14px",color:C.accent,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:5 }}>Edit</button>
            <button onClick={()=>{
              const dup = {
                id:`c_${Date.now()}`,
                name: selProg.name + " (copy)",
                notes: selProg.notes || "",
                days: selProg.days.map(dd => ({ ...dd, exercises: dd.exercises ? dd.exercises.map(e => ({...e})) : [] })),
              };
              dispatch({type:"ADD_PROGRAM",payload:dup});
              setSelProg(dup);
            }} style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"8px 14px",color:C.textDim,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:5 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              Duplicate
            </button>
            <button onClick={()=>{dispatch({type:"DELETE_PROGRAM",payload:selProg.id});setView("list");}} style={{ background:"none",border:"none",color:C.danger,cursor:"pointer",padding:6,display:"flex",alignItems:"center" }}><Trash s={16}/></button>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {selProg.days.map((d,i) => (
            <div key={i} style={{ background:C.card, borderRadius:14, padding:16, border:`1px solid ${d.isRest ? C.success+"40" : C.border}` }}>
              <div style={{ fontSize:15, fontWeight:700, color: d.isRest ? C.success : C.text, marginBottom: d.isRest && !d.notes ? 0 : 8 }}>
                {d.name}{d.isRest ? " — Rest" : ""}
              </div>
              {!d.isRest && (
                <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                  {(() => {
                    const rendered = new Set();
                    return d.exercises.map((e,j) => {
                      if (rendered.has(j)) return null;
                      rendered.add(j);
                      if (e.supersetWithIdx != null && e.supersetWithIdx >= 0 && e.supersetWithIdx < d.exercises.length && !rendered.has(e.supersetWithIdx)) {
                        const p = d.exercises[e.supersetWithIdx];
                        rendered.add(e.supersetWithIdx);
                        return <span key={j} style={{ fontSize:11, color:C.accent, background:C.accentDim, padding:"3px 8px", borderRadius:6, fontWeight:600, display:"inline-flex", alignItems:"center", gap:4 }}><LinkIco s={10}/>{e.name} + {p.name}</span>;
                      }
                      return <span key={j} style={{ fontSize:11, color:C.textDim, background:C.bg, padding:"3px 8px", borderRadius:6, fontWeight:500 }}>{e.name}</span>;
                    });
                  })()}
                </div>
              )}
              {d.notes && (
                <NotesToggle label="Day Notes">{d.notes}</NotesToggle>
              )}
            </div>
          ))}
        </div>
        {selProg.notes && (
          <div style={{ marginTop:16 }}>
            <NotesToggle label="About This Program">
              <div style={{ fontSize:13, lineHeight:1.6 }}>{selProg.notes}</div>
            </NotesToggle>
          </div>
        )}
      </>}

      {/* CREATE / EDIT */}
      {(view==="create" || view==="edit") && <>
        <button onClick={()=>{ if(editingId && selProg) { setEditingId(null); setView("detail"); } else { setView("list"); } }} style={{ background:"none",border:"none",color:C.accent,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,padding:0,marginBottom:16,display:"flex",alignItems:"center",gap:4 }}><Chevron dir="l"/> Back</button>
        <h3 style={{ margin:"0 0 16px", fontSize:20, fontWeight:800, color:C.text }}>{editingId ? "Edit Program" : "Create Program"}</h3>
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div><label style={lbl()}>Program Name</label><input id="cp-name" key={`pn-${editingId||"new"}`} style={getInp()} placeholder="e.g. Upper / Lower" defaultValue={cpName}/></div>
          <div><label style={lbl()}>Program Notes (optional)</label><textarea id="cp-notes" key={`pnotes-${editingId||"new"}`} style={{ ...getInp(), minHeight:60, resize:"vertical", fontFamily:"inherit", lineHeight:1.4 }} placeholder="Progression rules, rest times, general guidelines..." defaultValue={cpNotes}/></div>
          <div>
            <label style={lbl()}>Days</label>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
              {cpDays.map((d,i) => (
                <button key={i} onClick={()=>setCpIdx(i)} style={{
                  padding:"8px 14px", borderRadius:10, fontSize:13, fontWeight:600,
                  border: cpIdx===i ? `1.5px solid ${C.accent}` : `1px solid ${C.border}`,
                  background: cpIdx===i ? C.accentDim : "transparent", color: cpIdx===i ? C.accent : C.textDim,
                  cursor:"pointer", fontFamily:"inherit",
                }}>{d.name}</button>
              ))}
              <button onClick={()=>{setCpDays([...cpDays,{name:`Day ${cpDays.length+1}`,exercises:[]}]);setCpIdx(cpDays.length);}} style={{
                padding:"8px 12px", borderRadius:10, fontSize:13, fontWeight:600, border:`1px dashed ${C.border}`,
                background:"transparent", color:C.textMuted, cursor:"pointer", fontFamily:"inherit",
              }}>+</button>
            </div>
            {cpDays[cpIdx] && (
              <div key={`day-editor-${cpIdx}`} style={{ background:C.card, borderRadius:14, padding:16, border:`1px solid ${C.border}` }}>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:12 }}>
                  <input id={`dn-${cpIdx}`} key={`dn-${cpIdx}`} style={{ ...getInp(), fontSize:14, padding:"10px 12px" }} defaultValue={cpDays[cpIdx].name} placeholder="Day name" autoComplete="off"/>
                  {cpDays.length > 1 && <button onClick={()=>{const u=cpDays.filter((_,i)=>i!==cpIdx);setCpDays(u);if(cpIdx>=u.length)setCpIdx(u.length-1);}} style={{ background:"none",border:"none",color:C.danger,cursor:"pointer",padding:6,display:"flex",flexShrink:0 }}><Trash s={14}/></button>}
                </div>

                {/* Rest day toggle */}
                <button onClick={()=>{const u=[...cpDays];u[cpIdx]={...u[cpIdx],isRest:!u[cpIdx].isRest, exercises: !u[cpIdx].isRest ? [] : u[cpIdx].exercises};setCpDays(u);}} style={{
                  width:"100%", padding:"12px 14px", borderRadius:10, marginBottom:12,
                  border: cpDays[cpIdx].isRest ? `1.5px solid ${C.success}` : `1px solid ${C.border}`,
                  background: cpDays[cpIdx].isRest ? C.successDim : "transparent",
                  color: cpDays[cpIdx].isRest ? C.success : C.textDim,
                  fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                }}>
                  {cpDays[cpIdx].isRest ? <><Check s={14}/> Rest Day</> : "Mark as Rest Day"}
                </button>

                {/* Day notes */}
                <div style={{ marginBottom:12 }}>
                  <textarea id={`dnotes-${cpIdx}`} key={`dnotes-${cpIdx}`} style={{ ...getInp(), minHeight:50, resize:"vertical", fontFamily:"inherit", lineHeight:1.4, fontSize:13, padding:"10px 12px" }}
                    placeholder="Day notes — set/rep details, supersets, rest times..."
                    defaultValue={cpDays[cpIdx].notes || ""}
                  />
                </div>

                {!cpDays[cpIdx].isRest && (<>
                  {cpDays[cpIdx].exercises.length > 0 && (
                    <ProgramExerciseList
                      exercises={cpDays[cpIdx].exercises}
                      onChange={(newExs) => { const u=[...cpDays]; u[cpIdx]={...u[cpIdx], exercises:newExs}; setCpDays(u); }}
                    />
                  )}
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    <input id="ex-name" style={getInp()} placeholder="Exercise name" defaultValue=""/>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {MUSCLE_GROUPS.map(m => (
                        <button key={m} onClick={()=>setExM(m)} style={{
                          padding:"5px 10px", borderRadius:8, fontSize:10, fontWeight:600,
                          border: exM===m ? `1.5px solid ${mColor[m]}` : `1px solid ${C.border}`,
                          background: exM===m ? `${mColor[m]}18` : "transparent", color: exM===m ? mColor[m] : C.textMuted,
                          cursor:"pointer", fontFamily:"inherit",
                        }}>{m}</button>
                      ))}
                    </div>
                    {!CARDIO_GROUPS.has(exM) ? (
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                        <input id="ex-sets" style={getInp()} placeholder="Sets" inputMode="numeric" defaultValue=""/>
                        <input id="ex-reps" style={getInp()} placeholder="Reps" inputMode="numeric" defaultValue=""/>
                      </div>
                    ) : null}
                    <button onClick={addEx} style={{ padding:"12px", borderRadius:10, border:`1px solid ${C.border}`, background:C.surface, color:C.text, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>+ Add Exercise</button>
                  </div>
                </>)}
              </div>
            )}
          </div>
          <button onClick={saveProg} style={{
            padding:"16px", borderRadius:14, border:"none",
            background: cpName.trim()&&cpDays.some(d=>d.exercises.length>0 || d.isRest) ? C.accent : C.border,
            color: cpName.trim()&&cpDays.some(d=>d.exercises.length>0 || d.isRest) ? "#fff" : C.textMuted,
            fontSize:16, fontWeight:800, cursor: cpName.trim()&&cpDays.some(d=>d.exercises.length>0 || d.isRest)?"pointer":"default", fontFamily:"inherit",
          }}>{editingId ? "Save Changes" : "Save Program"}</button>
        </div>
      </>}
    </Wrapper>
  );
});
