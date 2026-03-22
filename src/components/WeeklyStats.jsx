import React from 'react';
import { C } from '../theme.js';
import { getDays, weekDates, localDateStr } from '../dateUtils.js';

export function WeeklyStats({ workouts, currentWeek }) {
  const dates = weekDates(currentWeek);
  return (
    <div style={{ marginTop:20 }}>
      <h3 style={{ fontSize:12, fontWeight:700, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10, padding:"0 2px" }}>Weekly Summary</h3>
      <div style={{ background:C.surface, borderRadius:14, padding:"18px 20px", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ fontSize:14, fontWeight:600, color:C.textDim }}>Active Days</div>
        <div style={{ display:"flex", gap:6 }}>
          {[0,1,2,3,4,5,6].map(i => {
            const d = dates[i]; const k = localDateStr(d);
            const active = workouts[k]?.exercises?.length > 0;
            return <div key={i} style={{ width:32,height:32,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,background:active?C.accentDim:C.bg,border:active?`1.5px solid ${C.accent}`:`1px solid ${C.border}`,color:active?C.accent:C.textMuted }}>{getDays()[i].charAt(0)}</div>;
          })}
        </div>
      </div>
    </div>
  );
}
