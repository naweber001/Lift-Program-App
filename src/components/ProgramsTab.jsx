import React from 'react';
import { C } from '../theme.js';
import { ProgramsModal } from './ProgramsModal.jsx';

export const ProgramsTab = React.memo(function ProgramsTab({ programs, currentWeek, favorites, dispatch }) {
  return (
    <div style={{ padding:"20px 16px 100px" }}>
      <h2 style={{ fontSize:22, fontWeight:800, color:C.text, marginBottom:8 }}>Programs</h2>
      <div style={{ fontSize:13, color:C.textDim, marginBottom:20 }}>Create and manage workout programs</div>
      <ProgramsModal dispatch={dispatch} programs={programs} currentWeek={currentWeek} inline={true} favorites={favorites} />
    </div>
  );
});
