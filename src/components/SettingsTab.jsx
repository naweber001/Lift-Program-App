import React, { useState } from 'react';
import { C } from '../theme.js';
import { getInp } from './UI.jsx';
import { ChevDown, X, Trash, DownloadIco, UploadIco } from './Icons.jsx';

export function SettingsTab({ s, d }) {
  const { theme, units, weekStart, restDefault, accentColor, programs, schedules, workouts } = s;
  const [confirmReset, setConfirmReset] = useState(false);
  const [openSections, setOpenSections] = useState({ appearance: false, workout: false, nutrition: false, data: false });
  const toggleSection = (key) => setOpenSections(p => ({ ...p, [key]: !p[key] }));

  const Section = ({ id, title, children }) => (
    <div style={{ marginBottom: 8 }}>
      <button onClick={() => toggleSection(id)} style={{
        width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
        padding: "14px 18px", cursor: "pointer", fontFamily: "inherit",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: C.text, letterSpacing: "-0.01em" }}>{title}</span>
        <ChevDown open={openSections[id]}/>
      </button>
      {openSections[id] && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "10px 0 0" }}>
          {children}
        </div>
      )}
    </div>
  );

  const [exportData, setExportData] = useState(null);
  const [importText, setImportText] = useState("");
  const [importMode, setImportMode] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const handleExport = () => {
    const data = JSON.stringify({ programs, schedules, workouts, theme, units, weekStart, restDefault, accentColor, logoChoice: s.logoChoice, appTitle: s.appTitle, favorites: s.favorites, nutrition: s.nutrition, nutritionFavs: s.nutritionFavs, macroGoals: s.macroGoals, timerAutoStart: s.timerAutoStart });
    setExportData(data);
    try { navigator.clipboard.writeText(data); setCopyFeedback(true); setTimeout(() => setCopyFeedback(false), 2000); } catch {}
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(importText.trim());
      if (data.programs || data.workouts) {
        d({ type: "IMPORT_DATA", payload: data });
        setImportText("");
        setImportMode(false);
      }
    } catch (err) { console.error("Import failed:", err); }
  };

  return (
    <div style={{ padding:"20px 16px 100px" }}>
      <h2 style={{ fontSize:22, fontWeight:800, color:C.text, marginBottom:20 }}>Settings</h2>

      <Section id="appearance" title="Appearance">
        {/* Theme toggle */}
        <div style={{ background:C.surface, borderRadius:14, padding:"18px 20px", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:C.text }}>Theme</div>
            <div style={{ fontSize:12, color:C.textDim, marginTop:2 }}>{theme === "dark" ? "Dark mode" : "Light mode"}</div>
          </div>
          <button onClick={() => d({ type:"SET_THEME", payload: theme === "dark" ? "light" : "dark" })} style={{
            width:52, height:30, borderRadius:15, border:"none", cursor:"pointer", position:"relative",
            background: theme === "dark" ? C.accent : C.border, transition:"background 0.2s",
          }}>
            <div style={{
              width:24, height:24, borderRadius:12, background:"#fff",
              position:"absolute", top:3, left: theme === "dark" ? 25 : 3,
              transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.3)",
            }}/>
          </button>
        </div>

        {/* Units toggle */}
        <div style={{ background:C.surface, borderRadius:14, padding:"18px 20px", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:C.text }}>Units</div>
            <div style={{ fontSize:12, color:C.textDim, marginTop:2 }}>{units === "lbs" ? "Pounds (lbs)" : "Kilograms (kg)"}</div>
          </div>
          <div style={{ display:"flex", borderRadius:10, overflow:"hidden", border:`1px solid ${C.border}` }}>
            {["lbs","kg"].map(u => (
              <button key={u} onClick={() => d({ type:"SET_UNITS", payload:u })} style={{
                padding:"8px 16px", border:"none", cursor:"pointer", fontFamily:"inherit",
                fontSize:13, fontWeight:700, textTransform:"uppercase",
                background: units===u ? C.accent : "transparent",
                color: units===u ? "#fff" : C.textMuted,
                transition:"all 0.2s",
              }}>{u}</button>
            ))}
          </div>
        </div>

        {/* Accent Color */}
        <div style={{ background:C.surface, borderRadius:14, padding:"18px 20px", border:`1px solid ${C.border}` }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:C.text }}>Accent Color</div>
              <div style={{ fontSize:12, color:C.textDim, marginTop:2 }}>{accentColor || "Default"}</div>
            </div>
            {accentColor && (
              <button onClick={() => d({ type:"SET_ACCENT_COLOR", payload:null })} style={{
                padding:"6px 12px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent",
                color:C.textDim, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
              }}>Reset</button>
            )}
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {["#5b9cf5","#3b7dd8","#6366f1","#8b5cf6","#a855f7","#ec4899","#f43f5e","#ef4444","#f97316","#eab308","#22c55e","#14b8a6","#06b6d4","#64748b"].map(color => (
              <button key={color} onClick={() => d({ type:"SET_ACCENT_COLOR", payload:color })} style={{
                width:36, height:36, borderRadius:10, border: (accentColor||C.accent)===color ? "3px solid #fff" : "2px solid transparent",
                background:color, cursor:"pointer", boxShadow: (accentColor||C.accent)===color ? `0 0 0 2px ${color}` : "none",
                transition:"all 0.15s",
              }}/>
            ))}
          </div>
        </div>

      </Section>

      <Section id="workout" title="Workout">
        {/* Week Start Day */}
        <div style={{ background:C.surface, borderRadius:14, padding:"18px 20px", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:C.text }}>Week Starts On</div>
            <div style={{ fontSize:12, color:C.textDim, marginTop:2 }}>{weekStart.charAt(0).toUpperCase() + weekStart.slice(1)}</div>
          </div>
          <div style={{ display:"flex", borderRadius:10, overflow:"hidden", border:`1px solid ${C.border}` }}>
            {["saturday","sunday","monday"].map(ws => (
              <button key={ws} onClick={() => d({ type:"SET_WEEK_START", payload:ws })} style={{
                padding:"8px 12px", border:"none", cursor:"pointer", fontFamily:"inherit",
                fontSize:12, fontWeight:700, textTransform:"capitalize",
                background: weekStart===ws ? C.accent : "transparent",
                color: weekStart===ws ? "#fff" : C.textMuted,
                transition:"all 0.2s",
              }}>{ws.slice(0,3)}</button>
            ))}
          </div>
        </div>

        {/* Default Rest Timer */}
        <div style={{ background:C.surface, borderRadius:14, padding:"18px 20px", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:C.text }}>Rest Timer Default</div>
            <div style={{ fontSize:12, color:C.textDim, marginTop:2 }}>{restDefault}s ({Math.floor(restDefault/60)}:{(restDefault%60).toString().padStart(2,"0")})</div>
          </div>
          <div style={{ display:"flex", borderRadius:10, overflow:"hidden", border:`1px solid ${C.border}` }}>
            {[60,90,120,180].map(t => (
              <button key={t} onClick={() => d({ type:"SET_REST_DEFAULT", payload:t })} style={{
                padding:"8px 10px", border:"none", cursor:"pointer", fontFamily:"inherit",
                fontSize:12, fontWeight:700,
                background: restDefault===t ? C.accent : "transparent",
                color: restDefault===t ? "#fff" : C.textMuted,
                transition:"all 0.2s",
              }}>{t < 120 ? `${t}s` : `${t/60}m`}</button>
            ))}
          </div>
        </div>

        {/* Timer Auto-Start */}
        <div style={{ background:C.surface, borderRadius:14, padding:"18px 20px", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:C.text }}>Auto-Start Timer</div>
            <div style={{ fontSize:12, color:C.textDim, marginTop:2 }}>Start rest timer when checking off a set</div>
          </div>
          <button onClick={() => d({ type:"SET_TIMER_AUTO_START", payload: !s.timerAutoStart })} style={{
            width:52, height:30, borderRadius:15, border:"none", cursor:"pointer", position:"relative",
            background: s.timerAutoStart !== false ? C.accent : C.border, transition:"background 0.2s",
          }}>
            <div style={{
              width:24, height:24, borderRadius:12, background:"#fff",
              position:"absolute", top:3, left: s.timerAutoStart !== false ? 25 : 3,
              transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.3)",
            }}/>
          </button>
        </div>

      </Section>

      <Section id="nutrition" title="Nutrition">
        {/* Macro Goals */}
        <div style={{ background:C.surface, borderRadius:14, padding:"18px 20px", border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:12 }}>Daily Macro Goals</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:10 }}>
            {[["protein","Protein (g)"],["carbs","Carbs (g)"],["fat","Fat (g)"]].map(([key,lbl]) => (
              <div key={key}>
                <div style={{ fontSize:11, color:C.textMuted, marginBottom:3 }}>{lbl}</div>
                <input id={`macro-${key}`} style={{ ...getInp(), width:"100%", fontSize:14, padding:"8px 10px" }} inputMode="numeric"
                  defaultValue={(s.macroGoals||{})[key]||""}
                  onBlur={e => d({ type:"SET_MACRO_GOALS", payload:{ [key]: parseInt(e.target.value)||0 }})} />
              </div>
            ))}
          </div>
          <div style={{ background:C.card, borderRadius:10, padding:"8px 14px", border:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:12, fontWeight:600, color:C.textMuted }}>Calories (auto)</span>
            <span style={{ fontSize:16, fontWeight:800, color:C.accent }}>{(s.macroGoals||{}).calories || 0}</span>
          </div>
          <div style={{ fontSize:10, color:C.textMuted, marginTop:4, textAlign:"center" }}>Protein × 4 + Carbs × 4 + Fat × 9</div>
        </div>
      </Section>

      <Section id="data" title="Data & Backup">
        {/* Export / Import */}
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={handleExport} style={{
            flex:1, padding:"14px", borderRadius:12, border:`1px solid ${copyFeedback ? "#22c55e" : C.border}`,
            background: copyFeedback ? "#22c55e20" : C.surface,
            cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            transition:"all 0.2s",
          }}>
            <DownloadIco/><span style={{ fontSize:13, fontWeight:600, color: copyFeedback ? "#22c55e" : C.textDim }}>{copyFeedback ? "Copied!" : "Export"}</span>
          </button>
          <button onClick={() => setImportMode(!importMode)} style={{
            flex:1, padding:"14px", borderRadius:12, border:`1px solid ${importMode ? C.accent : C.border}`,
            background: importMode ? C.accentDim : C.surface,
            cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:8,
          }}>
            <UploadIco/><span style={{ fontSize:13, fontWeight:600, color: importMode ? C.accent : C.textDim }}>Import</span>
          </button>
        </div>

        {/* Export output */}
        {exportData && !importMode && (
          <div style={{ background:C.card, borderRadius:10, border:`1px solid ${C.border}`, padding:10 }}>
            <div style={{ fontSize:10, fontWeight:600, color:C.textMuted, marginBottom:6 }}>Backup data (copied to clipboard):</div>
            <textarea readOnly value={exportData} style={{ ...getInp(), fontSize:10, minHeight:60, resize:"vertical", fontFamily:"monospace", lineHeight:1.3 }} onFocus={e => e.target.select()} />
            <button onClick={() => setExportData(null)} style={{ marginTop:6, padding:"6px 12px", borderRadius:6, border:`1px solid ${C.border}`, background:"transparent", color:C.textMuted, fontSize:10, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Close</button>
          </div>
        )}

        {/* Import input */}
        {importMode && (
          <div style={{ background:C.card, borderRadius:10, border:`1px solid ${C.border}`, padding:10 }}>
            <div style={{ fontSize:10, fontWeight:600, color:C.textMuted, marginBottom:6 }}>Paste your backup data:</div>
            <textarea value={importText} onChange={e => setImportText(e.target.value)} placeholder="Paste exported data here..." style={{ ...getInp(), fontSize:10, minHeight:80, resize:"vertical", fontFamily:"monospace", lineHeight:1.3 }} />
            <div style={{ display:"flex", gap:6, marginTop:6 }}>
              <button onClick={handleImport} disabled={!importText.trim()} style={{ flex:1, padding:"8px", borderRadius:6, border:"none", background: importText.trim() ? C.accent : C.border, color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Import Data</button>
              <button onClick={() => { setImportMode(false); setImportText(""); }} style={{ padding:"8px 12px", borderRadius:6, border:`1px solid ${C.border}`, background:"transparent", color:C.textMuted, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Reset All Data */}
        {!confirmReset ? (
          <button onClick={() => setConfirmReset(true)} style={{
            width:"100%", padding:"16px", borderRadius:12, border:`1px solid ${C.danger}40`,
            background:"transparent", cursor:"pointer", fontFamily:"inherit",
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
          }}>
            <Trash s={14}/>
            <span style={{ fontSize:14, fontWeight:600, color:C.danger }}>Reset All Data</span>
          </button>
        ) : (
          <div style={{
            borderRadius:14, padding:"16px 18px", border:`1.5px solid ${C.danger}`,
            background:`${C.danger}10`, display:"flex", flexDirection:"column", gap:12,
          }}>
            <div style={{ fontSize:14, fontWeight:600, color:C.text, textAlign:"center" }}>
              Are you sure? This will permanently delete all your workouts, programs, and schedules. Your settings will be preserved.
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => setConfirmReset(false)} style={{
                flex:1, padding:"12px", borderRadius:10, border:`1px solid ${C.border}`, background:C.surface,
                color:C.textDim, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
              }}>Cancel</button>
              <button onClick={() => { d({ type:"RESET_ALL_DATA" }); setConfirmReset(false); }} style={{
                flex:1, padding:"12px", borderRadius:10, border:"none", background:C.danger,
                color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
              }}>Yes, Delete Everything</button>
            </div>
          </div>
        )}
      </Section>

      {/* App info */}
      <div style={{ textAlign:"center", padding:"16px 0 0", color:C.textMuted, fontSize:12 }}>
        LIFE – Fitness v1.0
      </div>
    </div>
  );
}

