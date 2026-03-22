import React, { useState } from 'react';
import { C, U } from '../theme.js';
import { getInp, Badge } from './UI.jsx';
import { Chevron, TrophyIco } from './Icons.jsx';

export function HistoryTab({ workouts, units }) {
  const [search, setSearch] = useState("");
  const [selectedEx, setSelectedEx] = useState(null);
  const [sortBy, setSortBy] = useState("sessions");
  const [filterMuscle, setFilterMuscle] = useState("All");
  const [repFilter, setRepFilter] = useState("All"); // "All" or a number string like "5"

  // Build exercise stats from all workouts
  const exStats = {};
  Object.entries(workouts).forEach(([dateKey, day]) => {
    if (!day.exercises) return;
    day.exercises.forEach(ex => {
      if (!ex.sets || ex.isCardio) return;
      const completedSets = ex.sets.filter(s => s.done);
      if (completedSets.length === 0) return;

      if (!exStats[ex.name]) {
        exStats[ex.name] = { muscle: ex.muscle, bestWeight: 0, bestReps: 0, bestVolume: 0, bestSet: null, totalSets: 0, sessions: [], pr: null };
      }
      const stat = exStats[ex.name];

      const sessionSets = [];
      completedSets.forEach(s => {
        const w = parseFloat(s.weight) || 0;
        const r = parseInt(s.reps) || 0;
        const vol = w * r;
        sessionSets.push({ weight: w, reps: r, volume: vol });

        stat.totalSets++;
        if (w > stat.bestWeight) { stat.bestWeight = w; stat.pr = { weight: w, reps: r, date: dateKey }; }
        if (w === stat.bestWeight && r > (stat.pr?.reps || 0)) { stat.pr = { weight: w, reps: r, date: dateKey }; }
        if (r > stat.bestReps) stat.bestReps = r;
        if (vol > stat.bestVolume) { stat.bestVolume = vol; stat.bestSet = { weight: w, reps: r, date: dateKey }; }
      });

      stat.sessions.push({ date: dateKey, sets: sessionSets });
    });
  });

  // Sort: most sessions first, then alphabetical
  const exerciseList = Object.entries(exStats);

  // Get unique muscle groups
  const allMuscles = [...new Set(exerciseList.map(([_, s]) => s.muscle).filter(Boolean))].sort();

  // Apply filters and sort
  let filtered = [...exerciseList];
  if (filterMuscle !== "All") filtered = filtered.filter(([_, s]) => s.muscle === filterMuscle);
  if (search.trim()) filtered = filtered.filter(([name]) => name.toLowerCase().includes(search.toLowerCase()));

  if (sortBy === "sessions") filtered.sort((a, b) => b[1].sessions.length - a[1].sessions.length || a[0].localeCompare(b[0]));
  else if (sortBy === "alpha") filtered.sort((a, b) => a[0].localeCompare(b[0]));
  else if (sortBy === "weight") filtered.sort((a, b) => b[1].bestWeight - a[1].bestWeight);
  else if (sortBy === "recent") filtered.sort((a, b) => {
    const aLast = a[1].sessions[a[1].sessions.length - 1]?.date || "";
    const bLast = b[1].sessions[b[1].sessions.length - 1]?.date || "";
    return bLast.localeCompare(aLast);
  });

  const fmtDate = (dk) => {
    const d = new Date(dk + "T00:00:00");
    return d.toLocaleDateString("en-US", { month:"short", day:"numeric" });
  };

  // Detail view for a single exercise
  if (selectedEx && exStats[selectedEx]) {
    const stat = exStats[selectedEx];
    const sessions = [...stat.sessions].sort((a, b) => b.date.localeCompare(a.date));

    return (
      <div style={{ padding:"20px 16px 100px" }}>
        <button onClick={()=>setSelectedEx(null)} style={{ background:"none",border:"none",color:C.accent,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,padding:0,marginBottom:16,display:"flex",alignItems:"center",gap:4 }}>
          <Chevron dir="l"/> Back
        </button>
        <h2 style={{ fontSize:20, fontWeight:800, color:C.text, marginBottom:4 }}>{selectedEx}</h2>
        <Badge muscle={stat.muscle} small />

        {/* PR Cards */}
        <div style={{ display:"flex", gap:8, marginTop:16, marginBottom:12, flexWrap:"wrap" }}>
          <div style={{ flex:"1 1 45%", background:C.surface, borderRadius:12, padding:"14px", border:`1px solid ${C.border}`, textAlign:"center" }}>
            <div style={{ fontSize:10, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>Best Weight</div>
            <div style={{ fontSize:24, fontWeight:800, color:C.accent }}>{stat.bestWeight}<span style={{ fontSize:12, fontWeight:600, color:C.textDim }}> {units}</span></div>
            {stat.pr && <div style={{ fontSize:10, color:C.textMuted, marginTop:2 }}>{stat.pr.reps} reps · {fmtDate(stat.pr.date)}</div>}
          </div>
          <div style={{ flex:"1 1 45%", background:C.surface, borderRadius:12, padding:"14px", border:`1px solid ${C.border}`, textAlign:"center" }}>
            <div style={{ fontSize:10, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>Est. 1RM</div>
            {(() => {
              // Epley formula: weight × (1 + reps/30). Find the set that gives the highest e1RM.
              let best1RM = 0, best1RMset = null, best1RMdate = null;
              stat.sessions.forEach(sess => {
                sess.sets.forEach(st => {
                  if (st.weight > 0 && st.reps > 0) {
                    const e1rm = st.reps === 1 ? st.weight : Math.round(st.weight * (1 + st.reps / 30));
                    if (e1rm > best1RM) { best1RM = e1rm; best1RMset = st; best1RMdate = sess.date; }
                  }
                });
              });
              return best1RM > 0 ? (
                <>
                  <div style={{ fontSize:24, fontWeight:800, color:"#c084fc" }}>{best1RM}<span style={{ fontSize:12, fontWeight:600, color:C.textDim }}> {units}</span></div>
                  <div style={{ fontSize:10, color:C.textMuted, marginTop:2 }}>from {best1RMset.weight}×{best1RMset.reps} · {fmtDate(best1RMdate)}</div>
                </>
              ) : <div style={{ fontSize:14, color:C.textMuted }}>—</div>;
            })()}
          </div>
          <div style={{ flex:"1 1 45%", background:C.surface, borderRadius:12, padding:"14px", border:`1px solid ${C.border}`, textAlign:"center" }}>
            <div style={{ fontSize:10, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>Best Volume</div>
            <div style={{ fontSize:24, fontWeight:800, color:C.success }}>{stat.bestVolume.toLocaleString()}<span style={{ fontSize:12, fontWeight:600, color:C.textDim }}> {units}</span></div>
            {stat.bestSet && <div style={{ fontSize:10, color:C.textMuted, marginTop:2 }}>{stat.bestSet.weight}x{stat.bestSet.reps} · {fmtDate(stat.bestSet.date)}</div>}
          </div>
          <div style={{ flex:"1 1 45%", background:C.surface, borderRadius:12, padding:"14px", border:`1px solid ${C.border}`, textAlign:"center" }}>
            <div style={{ fontSize:10, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>Sessions</div>
            <div style={{ fontSize:24, fontWeight:800, color:C.text }}>{stat.sessions.length}</div>
            <div style={{ fontSize:10, color:C.textMuted, marginTop:2 }}>{stat.totalSets} total sets</div>
          </div>
        </div>

        {/* Rep count filter */}
        {(() => {
          const allReps = new Set();
          stat.sessions.forEach(sess => sess.sets.forEach(st => { if (st.reps > 0) allReps.add(st.reps); }));
          const repCounts = [...allReps].sort((a, b) => a - b);
          if (repCounts.length <= 1) return null;
          return (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>Filter by Reps</div>
              <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                <button onClick={()=>setRepFilter("All")} style={{
                  padding:"5px 12px", borderRadius:8, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
                  background: repFilter==="All" ? C.accent : C.card, color: repFilter==="All" ? "#fff" : C.textMuted,
                  border: repFilter==="All" ? "none" : `1px solid ${C.border}`,
                }}>All</button>
                {repCounts.map(r => (
                  <button key={r} onClick={()=>setRepFilter(String(r))} style={{
                    padding:"5px 12px", borderRadius:8, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
                    background: repFilter===String(r) ? C.accent : C.card, color: repFilter===String(r) ? "#fff" : C.textMuted,
                    border: repFilter===String(r) ? "none" : `1px solid ${C.border}`,
                  }}>{r} rep{r!==1?"s":""}</button>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Progress Chart */}
        {(() => {
          const rFilter = repFilter !== "All" ? parseInt(repFilter) : null;
          const chronological = [...stat.sessions].sort((a, b) => a.date.localeCompare(b.date));
          // Filter sessions to only include sets matching rep filter
          const filtered = chronological.map(sess => ({
            ...sess,
            sets: rFilter ? sess.sets.filter(st => st.reps === rFilter) : sess.sets,
          })).filter(sess => sess.sets.length > 0);
          if (filtered.length < 2) return null;
          const points = filtered.map(sess => ({
            date: sess.date,
            weight: Math.max(...sess.sets.map(st => st.weight)),
          }));
          const minW = Math.min(...points.map(p => p.weight));
          const maxW = Math.max(...points.map(p => p.weight));
          const range = maxW - minW || 1;
          const W_CHART = 360;
          const H_CHART = 140;
          const PAD = { top: 20, right: 16, bottom: 30, left: 40 };
          const plotW = W_CHART - PAD.left - PAD.right;
          const plotH = H_CHART - PAD.top - PAD.bottom;

          const getX = (i) => PAD.left + (i / (points.length - 1)) * plotW;
          const getY = (w) => PAD.top + plotH - ((w - minW) / range) * plotH;

          const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${getX(i)},${getY(p.weight)}`).join(" ");
          const areaD = pathD + ` L${getX(points.length - 1)},${PAD.top + plotH} L${getX(0)},${PAD.top + plotH} Z`;

          // Y-axis labels (3-4 ticks)
          const ticks = [];
          const step = range <= 5 ? 1 : range <= 20 ? 5 : range <= 50 ? 10 : Math.ceil(range / 4 / 10) * 10;
          for (let v = Math.floor(minW / step) * step; v <= maxW + step; v += step) {
            if (v >= minW - step * 0.5) ticks.push(v);
          }

          return (
            <div style={{ background:C.surface, borderRadius:14, padding:"16px", border:`1px solid ${C.border}`, marginBottom:16 }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:12 }}>Weight Progress ({units})</div>
              <svg width="100%" viewBox={`0 0 ${W_CHART} ${H_CHART}`} style={{ display:"block" }}>
                {/* Grid lines */}
                {ticks.map((v, i) => (
                  <g key={i}>
                    <line x1={PAD.left} y1={getY(v)} x2={W_CHART - PAD.right} y2={getY(v)} stroke={C.border} strokeWidth="1"/>
                    <text x={PAD.left - 6} y={getY(v) + 4} fill={C.textMuted} fontSize="9" textAnchor="end">{Math.round(v)}</text>
                  </g>
                ))}
                {/* X-axis labels (first, last, maybe middle) */}
                {[0, points.length - 1].map(i => (
                  <text key={i} x={getX(i)} y={H_CHART - 4} fill={C.textMuted} fontSize="9" textAnchor="middle">{fmtDate(points[i].date)}</text>
                ))}
                {/* Area fill */}
                <path d={areaD} fill={C.accent} opacity="0.1"/>
                {/* Line */}
                <path d={pathD} fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                {/* Dots */}
                {points.map((p, i) => (
                  <circle key={i} cx={getX(i)} cy={getY(p.weight)} r="4" fill={C.accent} stroke={C.surface} strokeWidth="2"/>
                ))}
              </svg>
            </div>
          );
        })()}

        {/* Session history */}
        <h3 style={{ fontSize:12, fontWeight:700, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>
          Session History{repFilter !== "All" ? ` (${repFilter}-rep sets)` : ""}
        </h3>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {(() => {
            const rFilter = repFilter !== "All" ? parseInt(repFilter) : null;
            const filteredSessions = sessions.map(sess => ({
              ...sess,
              sets: rFilter ? sess.sets.filter(st => st.reps === rFilter) : sess.sets,
            })).filter(sess => sess.sets.length > 0);

            if (filteredSessions.length === 0) return (
              <div style={{ textAlign:"center", padding:"20px 0", color:C.textMuted, fontSize:13 }}>No sessions with {repFilter}-rep sets</div>
            );

            return filteredSessions.map((sess, i) => {
              const maxW = Math.max(...sess.sets.map(s => s.weight));
              const isPR = stat.pr && stat.pr.date === sess.date;
              return (
                <div key={i} style={{ background:C.surface, borderRadius:12, padding:"12px 14px", border:`1px solid ${isPR ? C.accent+"60" : C.border}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{fmtDate(sess.date)}</div>
                    {isPR && <span style={{ fontSize:10, fontWeight:700, color:C.accent, background:C.accentDim, padding:"2px 8px", borderRadius:6, display:"inline-flex", alignItems:"center", gap:3 }}><TrophyIco/> PR</span>}
                  </div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {sess.sets.map((set, j) => (
                      <div key={j} style={{
                        fontSize:12, color: set.weight === maxW ? C.accent : C.textDim, fontWeight: set.weight === maxW ? 700 : 500,
                        background:C.bg, padding:"4px 8px", borderRadius:6,
                      }}>
                        {set.weight}×{set.reps}
                      </div>
                    ))}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div style={{ padding:"20px 16px 100px" }}>
      <h2 style={{ fontSize:22, fontWeight:800, color:C.text, marginBottom:16 }}>Exercises</h2>

      {/* Search */}
      <input style={{
        ...getInp(), marginBottom:10, fontSize:14, padding:"12px 14px",
      }} placeholder="Search exercises..." value={search} onChange={e=>setSearch(e.target.value)} />

      {exerciseList.length > 0 && <>
        {/* Muscle group filter */}
        <div style={{ display:"flex", gap:6, marginBottom:8, overflowX:"auto", paddingBottom:4, WebkitOverflowScrolling:"touch" }}>
          {["All", ...allMuscles].map(m => (
            <button key={m} onClick={()=>setFilterMuscle(m)} style={{
              padding:"6px 12px", borderRadius:16, fontSize:11, fontWeight:700, cursor:"pointer",
              fontFamily:"inherit", border:"none", whiteSpace:"nowrap", flexShrink:0,
              background: filterMuscle===m ? C.accent : C.card,
              color: filterMuscle===m ? "#fff" : C.textMuted,
              transition:"all 0.15s",
            }}>{m}</button>
          ))}
        </div>

        {/* Sort */}
        <div style={{ display:"flex", gap:4, marginBottom:14 }}>
          {[["sessions","Most Used"],["recent","Recent"],["weight","Heaviest"],["alpha","A-Z"]].map(([val,lbl]) => (
            <button key={val} onClick={()=>setSortBy(val)} style={{
              padding:"5px 10px", borderRadius:8, fontSize:10, fontWeight:700, cursor:"pointer",
              fontFamily:"inherit", background: sortBy===val ? C.accentDim : C.card,
              color: sortBy===val ? C.accent : C.textMuted, border: sortBy===val ? `1px solid ${C.accent}` : `1px solid ${C.border}`,
            }}>{lbl}</button>
          ))}
        </div>
      </>}

      {filtered.length === 0 && (
        <div style={{ textAlign:"center", padding:"40px 0", color:C.textMuted, fontSize:14 }}>
          {exerciseList.length === 0 ? "No completed sets yet. Start logging workouts to see your exercises here." : "No exercises match your filters."}
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {filtered.map(([name, stat]) => {
          const isPR = stat.bestWeight > 0;
          return (
            <button key={name} onClick={()=>{setSelectedEx(name);setRepFilter("All");}} style={{
              background:C.surface, borderRadius:12, padding:"14px 16px", border:`1px solid ${C.border}`,
              cursor:"pointer", fontFamily:"inherit", width:"100%", textAlign:"left",
              display:"flex", alignItems:"center", justifyContent:"space-between",
            }}>
              <div style={{ minWidth:0, flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:14, fontWeight:700, color:C.text }}>{name}</span>
                  <Badge muscle={stat.muscle} small />
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:5 }}>
                  {stat.bestWeight > 0 && (
                    <span style={{ fontSize:12, color:C.textDim }}>
                      Best: <span style={{ color:C.accent, fontWeight:700 }}>{stat.bestWeight} {units}</span>
                    </span>
                  )}
                  <span style={{ fontSize:12, color:C.textMuted }}>{stat.sessions.length} session{stat.sessions.length!==1?"s":""}</span>
                  <span style={{ fontSize:12, color:C.textMuted }}>{stat.totalSets} sets</span>
                </div>
              </div>
              <Chevron dir="r"/>
            </button>
          );
        })}
      </div>
    </div>
  );
}

