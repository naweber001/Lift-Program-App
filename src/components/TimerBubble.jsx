import React from 'react';
import { C } from '../theme.js';
import { ChevDown, PlayIco, PauseIco, ResetIco, TimerIco } from './Icons.jsx';

export function TimerBubble({ timerState, onAction }) {
  const { mode, seconds, running, expanded, restDefault } = timerState;
  const fmt = (s) => { const m = Math.floor(Math.abs(s)/60); const sec = Math.abs(s)%60; return `${m}:${sec.toString().padStart(2,"0")}`; };
  const isRest = mode === "rest";
  const isOvertime = isRest && seconds < 0;

  if (!expanded) {
    return (
      <button onClick={()=>onAction("toggleExpand")} style={{
        position:"fixed", bottom:70, right:16, maxWidth:480,
        width:56, height:56, borderRadius:28, border:"none", cursor:"pointer",
        background: isOvertime ? C.danger : running ? C.accent : C.surface,
        color: running ? "#fff" : C.accent,
        boxShadow: isOvertime ? `0 4px 20px ${C.danger}60` : "0 4px 20px rgba(0,0,0,0.3)",
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", zIndex:15, fontFamily:"inherit",
        border: running ? "none" : `1.5px solid ${C.accent}`,
        animation: isOvertime ? "celebPulse 1s ease-in-out infinite" : "none",
      }}>
        {running ? (
          <span style={{ fontSize: isOvertime ? 12 : 14, fontWeight:800, lineHeight:1 }}>{isOvertime && "+"}{fmt(seconds)}</span>
        ) : (
          <TimerIco/>
        )}
      </button>
    );
  }

  return (
    <div style={{
      position:"fixed", bottom:70, left:16, right:16, maxWidth:448, margin:"0 auto",
      background:C.surface, borderRadius:20, padding:"16px 20px",
      boxShadow: isOvertime ? `0 8px 32px ${C.danger}30` : "0 8px 32px rgba(0,0,0,0.4)", zIndex:15,
      border: isOvertime ? `1.5px solid ${C.danger}` : `1px solid ${C.border}`,
    }}>
      {/* Header with mode tabs */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div style={{ display:"flex", gap:4 }}>
          {["rest","stopwatch"].map(m => (
            <button key={m} onClick={()=>onAction("setMode",m)} style={{
              padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:700, border:"none", cursor:"pointer",
              fontFamily:"inherit", textTransform:"capitalize",
              background: mode===m ? C.accentDim : "transparent", color: mode===m ? C.accent : C.textMuted,
            }}>{m === "rest" ? "Rest Timer" : "Stopwatch"}</button>
          ))}
        </div>
        <button onClick={()=>onAction("toggleExpand")} style={{
          background:"none", border:"none", cursor:"pointer", color:C.textMuted, padding:4, display:"flex",
        }}><ChevDown open={true}/></button>
      </div>

      {/* Timer display */}
      <div style={{ textAlign:"center", marginBottom:14 }}>
        <div style={{
          fontSize:48, fontWeight:800, fontFamily:"'DM Sans',monospace", letterSpacing:"-0.02em",
          color: isOvertime ? C.danger : running ? C.text : C.textDim,
        }}>
          {isOvertime && "+"}{fmt(seconds)}
        </div>
        {isRest && (
          <div style={{ fontSize:11, color:C.textMuted, marginTop:4 }}>
            {running ? (isOvertime ? "Overtime — get back to it!" : "Resting...") : "Tap play to start rest"}
          </div>
        )}
        {!isRest && (
          <div style={{ fontSize:11, color:C.textMuted, marginTop:4 }}>
            {running ? "Timing..." : "Tap play to start"}
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12 }}>
        <button onClick={()=>onAction("reset")} style={{
          width:40, height:40, borderRadius:20, border:`1px solid ${C.border}`, background:C.card,
          cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:C.textDim,
        }}><ResetIco/></button>

        <button onClick={()=>onAction("playPause")} style={{
          width:56, height:56, borderRadius:28, border:"none",
          background: running ? C.danger : C.accent, cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center", color:"#fff",
        }}>{running ? <PauseIco/> : <PlayIco/>}</button>

        {isRest && (
          <div style={{ display:"flex", gap:4 }}>
            {[60,90,120,180].map(t => (
              <button key={t} onClick={()=>onAction("setRest",t)} style={{
                padding:"6px 8px", borderRadius:8, fontSize:11, fontWeight:700, border:"none", cursor:"pointer",
                fontFamily:"inherit",
                background: restDefault===t ? C.accentDim : C.card, color: restDefault===t ? C.accent : C.textMuted,
              }}>{t < 120 ? `${t}s` : `${t/60}m`}</button>
            ))}
          </div>
        )}
        {!isRest && <div style={{ width:40 }}/>}
      </div>
    </div>
  );
}

