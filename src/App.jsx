import React, { useState, useEffect, useRef } from 'react';
import { applyTheme, C } from './theme.js';
import { WEEK_STARTS } from './constants.js';
import { W, setWeekStart, getDays, weekKey, weekDates, localDateStr, weekLabel } from './dateUtils.js';
import { LIFE_LOGO } from './data/defaultPrograms.js';
import { usePersisted } from './hooks/usePersisted.js';
import { ErrorBoundary } from './ErrorBoundary.jsx';
import { Chevron, ChevDown, ListIco, DumbbellTab, HistoryIco, GearIco, Check } from './components/Icons.jsx';
import { DayRow } from './components/DayRow.jsx';
import { WeeklyStats } from './components/WeeklyStats.jsx';
import { ProgramsTab } from './components/ProgramsTab.jsx';
import { HistoryTab } from './components/HistoryTab.jsx';
import { SettingsTab } from './components/SettingsTab.jsx';
import { TimerBubble } from './components/TimerBubble.jsx';
import { AddExerciseModal } from './components/AddExerciseModal.jsx';
import { AssignDayModal } from './components/AssignDayModal.jsx';
import { ProgramsModal } from './components/ProgramsModal.jsx';
import { SetProgramModal } from './components/SetProgramModal.jsx';

function App() {
  const [s, d] = usePersisted();
  const { workouts, programs, schedules, currentWeek, expandedDay, modal, modalDay, tab, theme, favorites } = s;

  // Apply theme
  applyTheme(theme, s.accentColor, s.units);
  setWeekStart(s.weekStart);

  // Timer state
  const rd = s.restDefault || 90;
  const [timer, setTimer] = useState({ mode:"rest", seconds:rd, running:false, expanded:false, restDefault:rd });
  const timerRef = useRef(null);
  const swipeRef = useRef({ startX: 0, startY: 0 });
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);

  // Tab animation
  const TAB_ORDER = ["workout","programs","history","settings"];
  const prevTabRef = useRef(tab);
  const [tabAnim, setTabAnim] = useState({ active: false, dir: 0 });

  useEffect(() => {
    if (prevTabRef.current !== tab) {
      const oldIdx = TAB_ORDER.indexOf(prevTabRef.current);
      const newIdx = TAB_ORDER.indexOf(tab);
      const dir = newIdx > oldIdx ? 1 : -1;
      setTabAnim({ active: true, dir });
      const t = setTimeout(() => setTabAnim({ active: false, dir: 0 }), 300);
      prevTabRef.current = tab;
      return () => clearTimeout(t);
    }
  }, [tab]);

  const handleSwipeStart = (e) => {
    const t = e.touches[0];
    swipeRef.current = { startX: t.clientX, startY: t.clientY, locked: false, isHorizontal: null };
  };
  const handleSwipeMove = (e) => {
    const t = e.touches[0];
    const dx = t.clientX - swipeRef.current.startX;
    const dy = t.clientY - swipeRef.current.startY;
    // Determine direction on first significant movement
    if (swipeRef.current.isHorizontal === null && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
      swipeRef.current.isHorizontal = Math.abs(dx) > Math.abs(dy);
    }
    if (swipeRef.current.isHorizontal) {
      setSwiping(true);
      setSwipeOffset(dx);
    }
  };
  const handleSwipeEnd = (e) => {
    const dx = swipeOffset;
    if (swiping && Math.abs(dx) > 60) {
      const dd = new Date(currentWeek + "T00:00:00");
      dd.setDate(dd.getDate() + (dx < 0 ? 7 : -7));
      d({ type: "SET_WEEK", payload: weekKey(dd) });
    }
    setSwiping(false);
    setSwipeOffset(0);
  };

  // Sync timer restDefault when setting changes
  useEffect(() => {
    setTimer(p => ({ ...p, restDefault: rd, seconds: p.running ? p.seconds : (p.mode === "rest" ? rd : p.seconds) }));
  }, [rd]);

  useEffect(() => {
    if (timer.running) {
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev.mode === "rest") return { ...prev, seconds: prev.seconds - 1 };
          return { ...prev, seconds: prev.seconds + 1 };
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timer.running]);

  const timerAction = (action, val) => {
    switch(action) {
      case "toggleExpand": setTimer(p => ({ ...p, expanded: !p.expanded })); break;
      case "setMode": setTimer(p => ({ ...p, mode: val, seconds: val==="rest" ? p.restDefault : 0, running: false })); break;
      case "playPause": setTimer(p => ({ ...p, running: !p.running })); break;
      case "reset": setTimer(p => ({ ...p, seconds: p.mode==="rest" ? p.restDefault : 0, running: false })); break;
      case "setRest": setTimer(p => ({ ...p, restDefault: val, seconds: p.running ? p.seconds : val })); break;
      case "autoStart": setTimer(p => ({ ...p, mode:"rest", seconds: p.restDefault, running: true, expanded: false })); break;
    }
  };

  // Celebration state
  const [celebration, setCelebration] = useState(null); // { dateKey } or null

  // Wrapper dispatch that intercepts TOGGLE_SET_DONE to auto-start rest timer + check day completion
  const dispatch = (action) => {
    if (action.type === "TOGGLE_SET_DONE") {
      const { dateKey, exId, setIdx } = action.payload;
      const day = workouts[dateKey];
      if (day) {
        const ex = day.exercises.find(e => e.id === exId);
        if (ex) {
          const set = ex.sets[setIdx];
          if (set && !set.done) {
            timerAction(s.timerAutoStart !== false ? "autoStart" : null);

            // Check if this toggle will complete the entire day
            const allOtherDone = day.exercises.every(e => {
              if (e.id === exId) {
                return e.sets.every((st, si) => si === setIdx ? true : st.done);
              }
              return e.sets.every(st => st.done);
            });
            if (allOtherDone && day.exercises.length > 0) {
              setTimeout(() => setCelebration({ dateKey }), 100);
              setTimeout(() => setCelebration(null), 2500);
            }
          }
        }
      }
    }
    d(action);
  };

  const today = new Date();
  const todayKey = localDateStr(today);
  const wds = weekDates(currentWeek);

  const weekSchedule = schedules[currentWeek] || null;
  const dayNames = {};
  if (weekSchedule) {
    const prog = programs.find(p => p.id === weekSchedule.programId);
    if (prog) {
      Object.entries(weekSchedule.assignments).forEach(([pdi, wdi]) => {
        const dk = localDateStr(wds[wdi]);
        dayNames[dk] = prog.days[parseInt(pdi)]?.name || "";
      });
    }
  }
  Object.entries(workouts).forEach(([dk, w]) => { if (w.programDayName && !dayNames[dk]) dayNames[dk] = w.programDayName; });
  const activeProgramName = weekSchedule ? (programs.find(p => p.id === weekSchedule.programId)?.name || "") : "";

  const tabBtn = (id, label, Icon) => (
    <button onClick={()=>d({type:"SET_TAB",payload:id})} style={{
      flex:1, background:"none", border:"none", cursor:"pointer", padding:"6px 0 2px",
      display:"flex", flexDirection:"column", alignItems:"center", gap:4, fontFamily:"inherit",
      color: tab===id ? C.accent : C.textMuted, transition:"color 0.2s",
    }}>
      <Icon/>
      <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.02em" }}>{label}</span>
      <div style={{ width:4, height:4, borderRadius:2, background: tab===id ? C.accent : "transparent", transition:"background 0.2s" }}/>
    </button>
  );

  return (
    <div style={{ fontFamily:"'DM Sans','SF Pro Display',-apple-system,sans-serif", background:C.bg, minHeight:"100vh", color:C.text, maxWidth:480, margin:"0 auto", WebkitTapHighlightColor:"transparent" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;0,9..40,800;1,9..40,400&display=swap');
        *{box-sizing:border-box;margin:0;-webkit-tap-highlight-color:transparent}
        html{background:${C.bg}} ::-webkit-scrollbar{display:none}
        input::placeholder{color:${C.textMuted}} input{font-size:16px!important} select{font-size:16px!important} textarea::placeholder{color:${C.textMuted}}
        @keyframes slideInLeft { from { transform:translateX(100%); opacity:0.5; } to { transform:translateX(0); opacity:1; } }
        @keyframes slideInRight { from { transform:translateX(-100%); opacity:0.5; } to { transform:translateX(0); opacity:1; } }
        @keyframes celebFadeIn { from { opacity:0; transform:scale(0.8); } to { opacity:1; transform:scale(1); } }
        @keyframes celebFadeOut { from { opacity:1; } to { opacity:0; } }
        @keyframes confettiFall { 0% { transform:translateY(-20px) rotate(0deg); opacity:1; } 100% { transform:translateY(120px) rotate(720deg); opacity:0; } }
        @keyframes celebPulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.05); } }
      `}</style>

      {/* Header */}
      <div style={{ padding:"12px 20px", borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, zIndex:10, background: theme === "light" ? "#1e2a4a" : C.bg, overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, background: theme === "light" ? "none" : `linear-gradient(135deg, transparent 20%, ${C.accent})`, opacity:0.12, pointerEvents:"none" }}/>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", position:"relative" }}>
          <img src={LIFE_LOGO} alt="Logo" style={{ width:42, height:42, borderRadius:10, objectFit:"cover", boxShadow:`0 2px 8px rgba(0,0,0,0.3)` }}/>
          {tab === "workout" && (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <button onClick={()=>{const dd=new Date(currentWeek+"T00:00:00");dd.setDate(dd.getDate()-7);d({type:"SET_WEEK",payload:weekKey(dd)});}} style={{ background:"transparent",border:"none",borderRadius:8,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",color: theme==="light" ? "#fff" : C.textDim,cursor:"pointer" }}><Chevron dir="l"/></button>
              <div style={{ textAlign:"center", minWidth:100 }}>
                <div style={{ fontSize:14, fontWeight:700, color: theme==="light" ? "#fff" : C.text }}>{weekLabel(currentWeek)}</div>
                {currentWeek===weekKey(new Date()) ? (
                  <div style={{ fontSize:9, color: theme==="light" ? "rgba(255,255,255,0.6)" : C.accent, fontWeight:700, marginTop:1, letterSpacing:"0.1em", textTransform:"uppercase" }}>This Week</div>
                ) : (
                  <button onClick={()=>d({type:"SET_WEEK",payload:weekKey(new Date())})} style={{
                    background: theme==="light" ? "rgba(255,255,255,0.2)" : C.accentDim, border:"none", borderRadius:6, padding:"2px 10px",
                    marginTop:2, cursor:"pointer", fontFamily:"inherit",
                    fontSize:9, fontWeight:700, color: theme==="light" ? "#fff" : C.accent, letterSpacing:"0.06em", textTransform:"uppercase",
                  }}>Today</button>
                )}
              </div>
              <button onClick={()=>{const dd=new Date(currentWeek+"T00:00:00");dd.setDate(dd.getDate()+7);d({type:"SET_WEEK",payload:weekKey(dd)});}} style={{ background:"transparent",border:"none",borderRadius:8,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",color: theme==="light" ? "#fff" : C.textDim,cursor:"pointer" }}><Chevron dir="r"/></button>
            </div>
          )}
        </div>
      </div>

      {/* Tab content */}
      <div style={{
        animation: tabAnim.active ? (tabAnim.dir > 0 ? "slideInLeft 0.25s ease-out" : "slideInRight 0.25s ease-out") : "none",
        overflow: "hidden",
      }}>
      {tab === "workout" && (
        <div onTouchStart={handleSwipeStart} onTouchMove={handleSwipeMove} onTouchEnd={handleSwipeEnd}>

          {/* Swipe indicator */}
          {swiping && Math.abs(swipeOffset) > 20 && (() => {
            const goingNext = swipeOffset < 0;
            const progress = Math.min(Math.abs(swipeOffset) / 60, 1);
            const targetDate = new Date(currentWeek + "T00:00:00");
            targetDate.setDate(targetDate.getDate() + (goingNext ? 7 : -7));
            const targetLabel = weekLabel(weekKey(targetDate));
            return (
              <div style={{
                display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                padding:"10px 20px",
                opacity: progress,
                transform: `translateX(${swipeOffset * 0.3}px)`,
                transition: "none",
              }}>
                {!goingNext && <Chevron dir="l"/>}
                <div style={{
                  background: progress >= 1 ? C.accent : C.surface,
                  border: `1.5px solid ${progress >= 1 ? C.accent : C.border}`,
                  borderRadius:12, padding:"8px 16px",
                  display:"flex", alignItems:"center", gap:8,
                  boxShadow: `0 4px 16px rgba(0,0,0,${progress * 0.2})`,
                }}>
                  <span style={{
                    fontSize:13, fontWeight:700,
                    color: progress >= 1 ? "#fff" : C.textDim,
                  }}>{goingNext ? "Next" : "Prev"}: {targetLabel}</span>
                </div>
                {goingNext && <Chevron dir="r"/>}
              </div>
            );
          })()}

          <div style={{ padding:"8px 16px 0" }}>
            <WeeklyStats workouts={workouts} currentWeek={currentWeek} />
          </div>


          <div style={{ padding:"12px 16px 0", display:"flex", gap:8 }}>
            <button onClick={()=>d({type:"OPEN_MODAL",payload:{modal:"setProgram"}})} style={{
              flex:1, padding:"12px 16px", borderRadius:12,
              background:C.surface, border:`1px solid ${C.border}`, cursor:"pointer",
              fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            }}>
              <ListIco />
              <span style={{ fontSize:14, fontWeight:600, color:C.accent }}>Set Program</span>
            </button>
            <button onClick={()=>d({type:"COPY_LAST_WEEK",payload:{currentWeek}})} style={{
              padding:"12px 16px", borderRadius:12,
              background:C.surface, border:`1px solid ${C.border}`, cursor:"pointer",
              fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:6,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.textDim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              <span style={{ fontSize:13, fontWeight:600, color:C.textDim }}>Copy Last Week</span>
            </button>
          </div>

          <div style={{ padding:"12px 16px 0", display:"flex", flexDirection:"column", gap:8 }}>
            {wds.map((date, i) => {
              const dk = localDateStr(date);
              return <DayRow key={dk} dayLbl={getDays()[i]} date={date} dateKey={dk}
                workout={workouts[dk]} programDayName={dayNames[dk]} activeProgramName={activeProgramName}
                isToday={dk===todayKey} isExpanded={expandedDay===dk} dispatch={dispatch}
                hasPrograms={programs.length > 0} allWorkouts={workouts}
                nutrition={s.nutrition} nutritionFavs={s.nutritionFavs} macroGoals={s.macroGoals} />;
            })}
          </div>

          <div style={{ padding:"8px 16px 100px" }} />
        </div>
      )}

      {tab === "programs" && <ProgramsTab programs={programs} currentWeek={currentWeek} favorites={favorites} dispatch={d} />}
      {tab === "history" && <HistoryTab workouts={workouts} units={s.units} />}
      {tab === "settings" && <SettingsTab s={s} d={d} />}
      </div>

      {/* Timer Bubble */}
      {tab === "workout" && <TimerBubble timerState={timer} onAction={timerAction} />}

      {/* Bottom Tab Bar */}
      <div style={{
        position:"fixed", bottom:0, left:0, right:0, maxWidth:480, margin:"0 auto",
        background:C.surface, borderTop:`1px solid ${C.border}`,
        display:"flex", padding:"8px 0 env(safe-area-inset-bottom, 10px)", zIndex:20,
        boxShadow:`0 -4px 24px rgba(0,0,0,0.25), 0 -1px 8px ${C.accent}15`,
      }}>
        {tabBtn("workout", "Workout", DumbbellTab)}
        {tabBtn("programs", "Programs", ListIco)}
        {tabBtn("history", "Exercises", HistoryIco)}
        {tabBtn("settings", "Settings", GearIco)}
      </div>

      {/* Modals */}
      {modal==="addExercise" && modalDay && <AddExerciseModal dateKey={modalDay} dispatch={d} workouts={workouts} programs={programs} exerciseFavs={s.exerciseFavs} />}
      {modal==="assignDay" && modalDay && <AssignDayModal dateKey={modalDay} programs={programs} dispatch={d} />}
      {modal==="programs" && <ProgramsModal dispatch={d} programs={programs} currentWeek={currentWeek} favorites={favorites} />}
      {modal==="setProgram" && <SetProgramModal dispatch={d} programs={programs} currentWeek={currentWeek} workouts={workouts} />}

      {/* First-launch welcome prompt */}
      {Object.keys(workouts).length === 0 && Object.keys(schedules).length === 0 && tab === "workout" && !modal && (
        <div style={{
          position:"fixed", inset:0, maxWidth:480, margin:"0 auto", zIndex:50,
          background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center",
          padding:20,
        }}>
          <div style={{
            background:C.surface, borderRadius:20, padding:"36px 24px 28px", border:`1px solid ${C.border}`,
            textAlign:"center", maxWidth:340, width:"100%",
            boxShadow:`0 16px 48px rgba(0,0,0,0.4)`,
            display:"flex", flexDirection:"column", alignItems:"center",
          }}>
            <img src={LIFE_LOGO} alt="LIFE" style={{ width:88, height:88, borderRadius:18, objectFit:"cover", marginBottom:20, boxShadow:`0 4px 16px rgba(0,0,0,0.3)` }}/>
            <h2 style={{ fontSize:22, fontWeight:800, color:C.text, margin:"0 0 6px", letterSpacing:"-0.02em" }}>Fitness</h2>
            <p style={{ fontSize:14, color:C.textMuted, margin:"0 0 20px", lineHeight:1.5 }}>Welcome! Pick a program to get started, or add exercises manually to any day.</p>

            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <button onClick={()=>d({type:"OPEN_MODAL",payload:{modal:"setProgram"}})} style={{
                padding:"14px", borderRadius:14, border:"none", background:C.accent, color:"#fff",
                fontSize:16, fontWeight:800, cursor:"pointer", fontFamily:"inherit",
                boxShadow:`0 4px 12px ${C.accent}40`,
              }}>Choose a Program</button>
              <button onClick={()=>d({type:"SET_TAB",payload:"programs"})} style={{
                padding:"12px", borderRadius:12, border:`1px solid ${C.border}`, background:"transparent",
                color:C.textDim, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
              }}>Browse All Programs</button>
              <button onClick={()=>{
                const dk = localDateStr(new Date());
                d({type:"INIT_DAY", payload:{ dateKey:dk, programDayName:"Custom", exercises:[], isRest:false }});
                d({type:"TOGGLE_DAY", payload:dk});
              }} style={{
                padding:"10px", background:"none", border:"none", color:C.textMuted,
                fontSize:13, fontWeight:500, cursor:"pointer", fontFamily:"inherit",
              }}>Skip — I'll add exercises manually</button>
            </div>
          </div>
        </div>
      )}

      {/* Celebration overlay */}
      {celebration && (
        <div style={{
          position:"fixed", inset:0, maxWidth:480, margin:"0 auto", zIndex:100,
          display:"flex", alignItems:"center", justifyContent:"center",
          pointerEvents:"none",
          animation:"celebFadeIn 0.3s ease-out, celebFadeOut 0.5s ease-in 2s forwards",
        }}>
          {/* Confetti particles */}
          {Array.from({ length: 30 }, (_, i) => {
            const colors = ["#22c55e","#eab308","#ef4444","#3b82f6","#a855f7","#ec4899","#f97316"];
            const left = Math.random() * 100;
            const delay = Math.random() * 0.8;
            const size = 6 + Math.random() * 8;
            const color = colors[i % colors.length];
            return (
              <div key={i} style={{
                position:"absolute", top:"20%", left:`${left}%`,
                width:size, height:size * 0.6, borderRadius:2,
                background:color, opacity:0.9,
                animation:`confettiFall ${1.2 + Math.random() * 1}s ease-in ${delay}s both`,
              }}/>
            );
          })}
          {/* Message */}
          <div style={{
            background:C.success, borderRadius:20, padding:"20px 32px",
            boxShadow:`0 8px 32px rgba(0,0,0,0.4), 0 0 60px ${C.success}40`,
            animation:"celebPulse 0.6s ease-in-out 2",
            textAlign:"center",
          }}>
            <div style={{ fontSize:28, marginBottom:4 }}>💪</div>
            <div style={{ fontSize:18, fontWeight:800, color:"#fff", letterSpacing:"-0.02em" }}>Workout Complete!</div>
            <div style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.8)", marginTop:4 }}>All sets done. Great work!</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
