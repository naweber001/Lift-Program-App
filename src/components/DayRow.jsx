import React, { useState, useMemo } from 'react';
import { C } from '../theme.js';
import { getInp, Badge } from './UI.jsx';
import { ChevDown, Plus, X, ListIco, ArrowUp, ArrowDown, Check, DumbbellTab, NutritionIco } from './Icons.jsx';
import { CARDIO_GROUPS } from '../constants.js';
import { localDateStr } from '../dateUtils.js';
import { ExerciseLog } from './ExerciseLog.jsx';
import { SupersetLog } from './SupersetLog.jsx';
import { DayNutrition } from './DayNutrition.jsx';

export const DayRow = React.memo(function DayRow({ dayLbl, date, dateKey, workout, programDayName, activeProgramName, isToday, isExpanded, dispatch, hasPrograms, allWorkouts, nutrition, nutritionFavs, macroGoals }) {
  const exercises = workout?.exercises || [];
  const isRest = workout?.isRest || false;
  const totalSets = exercises.reduce((a, e) => a + e.sets.length, 0);
  const doneSets = exercises.reduce((a, e) => a + e.sets.filter(s => s.done).length, 0);
  const hasWorkout = exercises.length > 0;
  const allDone = hasWorkout && doneSets === totalSets;
  const pct = totalSets > 0 ? (doneSets / totalSets) * 100 : 0;

  const hasStrength = exercises.some(e => !e.isCardio);
  const [confirmClearDay, setConfirmClearDay] = useState(false);
  const [workoutOpen, setWorkoutOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  // Compute last-time weights for each exercise name
  const exerciseNames = exercises.map(e => e.name).join(",");
  const lastWeights = useMemo(() => {
    const result = {};
    if (allWorkouts) {
      const sortedDates = Object.keys(allWorkouts).filter(dk => dk < dateKey).sort().reverse();
      for (const dk of sortedDates) {
        const day = allWorkouts[dk];
        if (!day?.exercises) continue;
        for (const ex of day.exercises) {
          if (result[ex.name]) continue;
          const done = ex.sets?.filter(st => st.done && st.weight);
          if (done && done.length > 0) {
            const bestSet = done.reduce((best, st) => (parseFloat(st.weight)||0) > (parseFloat(best.weight)||0) ? st : best, done[0]);
            result[ex.name] = { weight: bestSet.weight, reps: bestSet.reps };
          }
        }
        if (exercises.every(ex => result[ex.name])) break;
      }
    }
    return result;
  }, [allWorkouts, dateKey, exerciseNames]);

  return (
    <div style={{
      background: isToday ? C.accentDim : "transparent", borderRadius:16, overflow:"hidden",
      border: isToday ? `1.5px solid ${C.accent}` : `1px solid ${C.border}`,
    }}>
      <button onClick={() => dispatch({ type:"TOGGLE_DAY", payload:dateKey })} style={{
        width:"100%", background:"none", border:"none", cursor:"pointer", padding:"12px 14px",
        display:"flex", alignItems:"center", justifyContent:"space-between", fontFamily:"inherit", color:C.text,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, flex:1, minWidth:0 }}>
          <div style={{
            width:46, height:46, borderRadius:12, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flexShrink:0,
            background: isToday ? C.accent : C.card, border: isToday ? `1.5px solid ${C.accent}` : `1px solid ${C.border}`,
          }}>
            <span style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.08em", color: isToday ? "#fff" : C.textMuted, lineHeight:1 }}>{dayLbl}</span>
            <span style={{ fontSize:18, fontWeight:800, color: isToday ? "#fff" : C.textDim, lineHeight:1.2 }}>{date.getDate()}</span>
          </div>
          <div style={{ flex:1, minWidth:0, display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
            <div style={{ minWidth:0 }}>
              {isRest ? (
                <div style={{ fontSize:15, fontWeight:700, color:C.textMuted }}>
                  {programDayName ? `${programDayName} — Rest` : "Rest day"}
                </div>
              ) : exercises.length > 0 ? (
                <div style={{ fontSize:14, fontWeight:700, color: allDone ? C.success : C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {[...new Set(exercises.map(e => e.muscle).filter(Boolean))].join(" / ")}
                </div>
              ) : (
                <div style={{ fontSize:15, fontWeight:700, color:C.textMuted }}>Rest day</div>
              )}
            </div>
          </div>
        </div>
        <div style={{ flexShrink:0, marginLeft:8 }}><ChevDown open={isExpanded}/></div>
      </button>

      {isExpanded && (
        <div style={{ padding:"0 14px 14px", display:"flex", flexDirection:"column", gap: 8 }}>

          {/* Workout collapsible */}
          <div>
            <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.border}, transparent)`, marginBottom: 8 }} />
            <button onClick={() => setWorkoutOpen(!workoutOpen)} style={{
              width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
              padding: "8px 12px", cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ color: C.accent }}><DumbbellTab /></span>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: "0.06em" }}>Workout</span>
              <span style={{ fontSize: 11, color: C.textMuted, marginLeft: "auto" }}>
                {exercises.length > 0 ? `${doneSets}/${totalSets} sets` : isRest ? "Rest" : "Empty"}
              </span>
              <ChevDown open={workoutOpen} />
            </button>

            {workoutOpen && (
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
            <>
              {!isRest && (() => {
                const rendered = new Set();
                const items = [];
                const handlePair = (id1, id2) => dispatch({ type:"PAIR_SUPERSET", payload:{ dateKey, exId1:id1, exId2:id2 }});

                exercises.forEach(ex => {
                  if (rendered.has(ex.id)) return;
                  rendered.add(ex.id);

                  if (ex.supersetWith) {
                    const partner = exercises.find(e => e.id === ex.supersetWith);
                    if (partner && !rendered.has(partner.id)) {
                      rendered.add(partner.id);
                      items.push({ type:"superset", exA:ex, exB:partner });
                      return;
                    }
                  }
                  const available = exercises.filter(e => e.id !== ex.id && !e.supersetWith);
                  items.push({ type:"single", ex, available });
                });

                return items.map((item, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === items.length - 1;
                  if (item.type === "superset") {
                    return <SupersetLog key={`ss-${item.exA.id}`} exA={item.exA} exB={item.exB} dateKey={dateKey} dispatch={dispatch} isFirst={isFirst} isLast={isLast} lastWeights={lastWeights} />;
                  }
                  return <ExerciseLog key={item.ex.id} ex={item.ex} dateKey={dateKey} dispatch={dispatch}
                    isPaired={false} onPair={handlePair} availablePartners={item.available} isFirst={isFirst} isLast={isLast} lastWeight={lastWeights[item.ex.name]} />;
                });
              })()}
              {isRest && <div style={{ padding:"12px 0", textAlign:"center", fontSize:13, color:C.textMuted, fontStyle:"italic" }}>Rest day — no exercises</div>}

              <div style={{ display:"flex", gap:8 }}>
                {!isRest && (
                  <button onClick={() => dispatch({ type:"OPEN_MODAL", payload:{ modal:"addExercise", day:dateKey }})} style={{
                    flex:1, padding:"14px 0", borderRadius:12, border:`1.5px dashed ${C.border}`, background:"transparent",
                    color:C.textDim, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                  }}><Plus s={14}/> Add Exercise</button>
                )}
                {hasPrograms && (
                  <button onClick={() => dispatch({ type:"OPEN_MODAL", payload:{ modal:"assignDay", day:dateKey }})} style={{
                    flex:1, padding:"14px 0", borderRadius:12, border:`1px solid ${C.border}`, background:C.card,
                    color:C.accent, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                  }}><ListIco /> {hasWorkout || isRest ? "Change" : "From Program"}</button>
                )}
              </div>
              {hasWorkout && !confirmClearDay && (
                <button onClick={() => setConfirmClearDay(true)} style={{
                  width:"100%", padding:"10px 0", borderRadius:10, border:`1px solid ${C.border}`, background:"transparent",
                  color:C.textMuted, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:5, marginTop:4,
                }}><X s={11}/> Clear Day</button>
              )}
              {confirmClearDay && (
                <div style={{ display:"flex", gap:8, marginTop:4 }}>
                  <button onClick={() => { dispatch({ type:"CLEAR_DAY", payload: dateKey }); setConfirmClearDay(false); }} style={{
                    flex:1, padding:"10px 0", borderRadius:10, border:"none", background:"#ef4444",
                    color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
                  }}>Clear All Exercises</button>
                  <button onClick={() => setConfirmClearDay(false)} style={{
                    padding:"10px 16px", borderRadius:10, border:`1px solid ${C.border}`, background:C.card,
                    color:C.textMuted, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
                  }}>Cancel</button>
                </div>
              )}
            </>
              </div>
            )}
          </div>

          {/* Day Nutrition */}
          <DayNutrition dateKey={dateKey} nutrition={nutrition} nutritionFavs={nutritionFavs} macroGoals={macroGoals} dispatch={dispatch} />

          {/* Day Notes */}
          <div>
            <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.border}, transparent)`, marginBottom: 8 }} />
            <button onClick={() => setNotesOpen(!notesOpen)} style={{
              width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
              padding: "8px 12px", cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ color: "#eab308" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#eab308", textTransform: "uppercase", letterSpacing: "0.06em" }}>Notes</span>
              {workout?.notes && <span style={{ fontSize: 11, color: C.textMuted, marginLeft: "auto", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150 }}>{workout.notes}</span>}
              <ChevDown open={notesOpen} />
            </button>
            {notesOpen && (
              <div style={{ marginTop: 8 }}>
                <textarea
                  id={`day-notes-${dateKey}`}
                  key={`day-notes-${dateKey}`}
                  defaultValue={workout?.notes || ""}
                  onBlur={e => dispatch({ type: "SET_DAY_NOTES", payload: { dateKey, notes: e.target.value } })}
                  placeholder="How did today's workout feel? Any notes..."
                  style={{ ...getInp(), minHeight: 80, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5, fontSize: 13, padding: "10px 12px" }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
