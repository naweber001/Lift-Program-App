import React from 'react';
import { C, U } from '../theme.js';
import { getInpSm } from './UI.jsx';
import { Check, X } from './Icons.jsx';

export function SetRow({ set, idx, isCardio, exId, dateKey, dispatch, totalSets }) {
  const done = set.done;
  const skipped = set.skipped;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      background: skipped ? "#ef444415" : "transparent",
      borderRadius: 8, padding: skipped ? "2px 4px" : 0,
      border: skipped ? "1px solid #ef444430" : "1px solid transparent",
      transition: "all 0.15s",
    }}>
      <div style={{ width: 24, fontSize: 12, fontWeight: 700, color: skipped ? "#ef4444" : C.textMuted, textAlign: "center", flexShrink: 0, textDecoration: skipped ? "line-through" : "none" }}>{idx + 1}</div>
      {isCardio ? (
        <input style={{ ...getInpSm(), flex: 1, opacity: skipped ? 0.5 : 1 }} placeholder="Duration" value={set.duration || ""} onChange={e => dispatch({ type: "UPDATE_SET", payload: { dateKey, exId, setIdx: idx, field: "duration", value: e.target.value } })} />
      ) : (<>
        <input style={{ ...getInpSm(), width: 80, flexShrink: 0, textAlign: "center", opacity: skipped ? 0.5 : 1, textDecoration: skipped ? "line-through" : "none" }} placeholder={U} inputMode="decimal" value={set.weight || ""} onChange={e => dispatch({ type: "UPDATE_SET", payload: { dateKey, exId, setIdx: idx, field: "weight", value: e.target.value } })} />
        <input style={{ ...getInpSm(), width: 68, flexShrink: 0, textAlign: "center", opacity: skipped ? 0.5 : 1, textDecoration: skipped ? "line-through" : "none" }} placeholder="reps" inputMode="numeric" value={set.reps || ""} onChange={e => dispatch({ type: "UPDATE_SET", payload: { dateKey, exId, setIdx: idx, field: "reps", value: e.target.value } })} />
      </>)}
      <div style={{ flex: 1 }} />
      <button onClick={() => dispatch({ type: "TOGGLE_SET_DONE", payload: { dateKey, exId, setIdx: idx } })} style={{
        width: 32, height: 32, borderRadius: 8,
        border: done ? `1.5px solid ${C.success}` : `1.5px solid ${C.border}`,
        background: done ? C.successDim : C.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", flexShrink: 0, color: done ? C.success : C.textDim,
      }}><Check s={12} /></button>
      <button onClick={() => dispatch({ type: "SKIP_SET", payload: { dateKey, exId, setIdx: idx } })} style={{
        width: 32, height: 32, borderRadius: 8,
        border: skipped ? `1.5px solid #ef4444` : `1.5px solid ${C.border}`,
        background: skipped ? "#ef444420" : C.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", flexShrink: 0, color: skipped ? "#ef4444" : C.textDim,
      }}><X s={12} /></button>
    </div>
  );
}
