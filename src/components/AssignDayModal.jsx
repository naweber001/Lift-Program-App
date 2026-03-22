import React, { useState } from 'react';
import { C } from '../theme.js';
import { Sheet } from './UI.jsx';
import { Chevron, ChevDown, X } from './Icons.jsx';
import { ALL_DAYS } from '../constants.js';

export function AssignDayModal({ dateKey, programs, dispatch }) {
  const dayDate = new Date(dateKey + "T00:00:00");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const title = `${ALL_DAYS[dayDate.getDay()]}, ${months[dayDate.getMonth()]} ${dayDate.getDate()}`;
  const [openProg, setOpenProg] = useState(null);

  return (
    <Sheet onClose={()=>dispatch({type:"CLOSE_MODAL"})}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h3 style={{ margin:0, fontSize:20, fontWeight:800, color:C.text }}>Assign Workout</h3>
          <div style={{ fontSize:13, color:C.textDim, marginTop:2 }}>{title}</div>
        </div>
        <button onClick={()=>dispatch({type:"CLOSE_MODAL"})} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, width:40, height:40, display:"flex", alignItems:"center", justifyContent:"center", color:C.textDim, cursor:"pointer" }}><X s={18}/></button>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {programs.map(prog => {
          const isOpen = openProg === prog.id;
          return (
            <div key={prog.id}>
              <button onClick={() => setOpenProg(isOpen ? null : prog.id)} style={{
                width:"100%", background: isOpen ? C.accentDim : C.card, borderRadius:12,
                padding:"14px 16px", border:`1px solid ${isOpen ? C.accent : C.border}`, cursor:"pointer",
                fontFamily:"inherit", display:"flex", justifyContent:"space-between", alignItems:"center",
              }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:700, color: isOpen ? C.accent : C.text }}>{prog.name}</div>
                  <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>{prog.days.length} day{prog.days.length>1?"s":""}</div>
                </div>
                <ChevDown open={isOpen}/>
              </button>
              {isOpen && (
                <div style={{ display:"flex", flexDirection:"column", gap:4, padding:"8px 0 4px 10px" }}>
                  {prog.days.map((d, i) => (
                    <button key={i} onClick={() => {
                      if (d.isRest) {
                        dispatch({ type:"REPLACE_DAY", payload:{ dateKey, programDayName:d.name, exercises:[], isRest:true }});
                      } else {
                        dispatch({ type:"REPLACE_DAY", payload:{ dateKey, programDayName:d.name, exercises:d.exercises, isRest:false }});
                      }
                    }} style={{
                      width:"100%", background:C.surface, borderRadius:10, padding:"10px 14px",
                      border:`1px solid ${C.border}`, cursor:"pointer", fontFamily:"inherit",
                      display:"flex", justifyContent:"space-between", alignItems:"center", textAlign:"left",
                    }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color: d.isRest ? C.success : C.text }}>
                          {d.name}{d.isRest ? " — Rest" : ""}
                        </div>
                        {!d.isRest && d.exercises.length > 0 && (
                          <div style={{ fontSize:10, color:C.textMuted, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                            {d.exercises.map(e=>e.name).join(", ")}
                          </div>
                        )}
                      </div>
                      <Chevron dir="r"/>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={()=>dispatch({type:"CLEAR_DAY",payload:dateKey})} style={{
        width:"100%", padding:"14px", borderRadius:12, border:`1px solid ${C.border}`, background:"transparent",
        color:C.textMuted, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
        display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginTop:12,
      }}>Clear Day</button>
    </Sheet>
  );
}
