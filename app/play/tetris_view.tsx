'use client'
import React from 'react';
import { tetrominosColors } from '/app/play/tetrominos'

export function TetrisView({ tetrisArray }) {
  return (
      <div className="grid grid-cols-10 gap-[2px] w-[298px]">
        {
          tetrisArray.map((row, row_idx) => (
            row.map((val, col_idx) => (
              <div key={col_idx} className={`rounded bg-${tetrominosColors[val]} w-[28px] h-[28px]`}></div>
            ))
          ))
        }
      </div>
  );
}
