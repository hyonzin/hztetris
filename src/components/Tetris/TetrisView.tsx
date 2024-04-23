'use client'
import React from 'react'
import { tetrominosColors } from './tetrominos'

export function TetrisView({ tetrisArray }) {
  return (
      <div className="grid grid-cols-10 gap-[2px] min-w-[298px]">
        {
          tetrisArray.map((row, row_idx) => (
            row.map((val, col_idx) => (
              <div
                key={col_idx}
                className={`rounded ${tetrominosColors[val]} w-[28px] h-[28px]`}
              ></div>
            ))
          ))
        }
      </div>
  )
}

export function KeepTetrisView({ tetrisArray }) {
  return (
      <div>
        Keep:
        <div className="grid grid-cols-4 gap-[1px] min-w-[59px] bg-gray-900">
          {
            tetrisArray.map((row, row_idx) => (
              row.map((val, col_idx) => (
                <div key={col_idx} className={`rounded ${tetrominosColors[val]} w-[14px] h-[14px]`}></div>
              ))
            ))
          }
        </div>
      </div>
  )
}

export function PreviewTetrisView({ tetrisArray }) {
  return (
      <div>
        Preview:
        <div className="grid grid-cols-4 gap-[1px] min-w-[59px] bg-gray-900">
          {
            tetrisArray.map((row, row_idx) => (
              row.map((val, col_idx) => (
                <div key={col_idx} className={`rounded ${tetrominosColors[val]} w-[14px] h-[14px]`}></div>
              ))
            ))
          }
        </div>
      </div>
  )
}
