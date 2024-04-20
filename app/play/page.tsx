'use client'
import React, { useState, useEffect } from 'react';
import { TetrisView } from '/app/play/tetris_view'
import { tetrominos, tetrominosPositions, tetrominosColors } from '/app/play/tetrominos'
import { useInterval } from '/app/useInterval';
import { socket } from '../socket';
import useKeypress from 'react-use-keypress';

export default function play() {
  const [tStart, setTStart] = useState(Date.now())
  
  const [curPos, setCurPos] = useState([5, 1]);
  const [curTet, setCurTet] = useState('L')
  const [curDegree, setCurDegree] = useState(0)
  
  const FPS = 30; // 60
  const tickInterval = 1000;
  const rows = 20;
  const columns = 10;
  
  const [tetrisArrFg, setTetrisArrFg] = useState(Array(rows).fill().map(() => Array(columns).fill('')))
  const [tetrisArrBg, setTetrisArrBg] = useState(Array(rows).fill().map(() => Array(columns).fill('')))
  
  function getRandomTetrominos() {
    return tetrominos[Math.floor(Math.random()*7)]
  }
  
  function setForeground(tet, degree, pos) {
    let _tetrisArrFg = Array(rows).fill().map(() => Array(columns).fill(''));
    for (let i=0; i<4; i++) {
      let tx = tetrominosPositions[tet][degree][i][0];
      let ty = tetrominosPositions[tet][degree][i][1];
      _tetrisArrFg[pos[1]+ty][pos[0]+tx] = tet;
    }
    setTetrisArrFg(_tetrisArrFg);
  }
  
  function resetForeground() {
    let _tetrisArrFg = Array(rows).fill().map(() => Array(columns).fill(''));
    setTetrisArrFg(_tetrisArrFg);
  }
  
  function setBackground(tet, degree, pos) {
    let _tetrisArrBg = tetrisArrBg.slice();
    for (let i=0; i<4; i++) {
      let tx = tetrominosPositions[tet][degree][i][0];
      let ty = tetrominosPositions[tet][degree][i][1];
      _tetrisArrBg[pos[1]+ty][pos[0]+tx] = tet;
    }
    setTetrisArrBg(_tetrisArrBg.slice());
  }
  
  function checkPosIsPosible(tet, degree, pos) {
    let x = pos[0]
    let y = pos[1]
    for (let i=0; i<4; i++) {
      let tx = tetrominosPositions[tet][degree][i][0];
      let ty = tetrominosPositions[tet][degree][i][1];
      
      let px = x+tx;
      let py = y+ty;
      if (px < 0 || px >= columns || py < 0 || py >= rows || tetrisArrBg[y+ty][x+tx] != '') {
        return false
      }
    }
    return true
  }
  
  useInterval(() => {
    if (Date.now() - tStart >= tickInterval) {
      let x = curPos[0]
      let y = curPos[1]
      if (checkPosIsPosible(curTet, curDegree, [x, y+1])) {
        setCurPos([x, y+1])
        setTStart(tStart + tickInterval)
        setForeground(curTet, curDegree, [x, y+1])
      } else {
        setBackground(curTet, curDegree, [x, y])
        setCurTet(getRandomTetrominos())
        setCurDegree(0)
        setCurPos([5, 1])
        resetForeground()
      }
    }
  }, 1000 / FPS);
  
  useKeypress(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'], (event) => {
    let x = curPos[0]
    let y = curPos[1]
    let degree = curDegree;
    
    if (event.key === 'ArrowUp') {
      if (checkPosIsPosible(curTet, (degree+1)%4, [x, y])) {
        degree = (degree+1)%4;
        setCurDegree(degree)
      }
    } else if (event.key === 'ArrowDown') {
      if (checkPosIsPosible(curTet, degree, [x, y+1])) {
        y += 1;
        setCurPos([x, y])
        setTStart(Date.now())
      }
    } else if (event.key === 'ArrowLeft') {
      if (checkPosIsPosible(curTet, degree, [x-1, y])) {
        x -= 1;
        setCurPos([x, y])
      }
    } else if (event.key === 'ArrowRight') {
      if (checkPosIsPosible(curTet, degree, [x+1, y])) {
        x += 1;
        setCurPos([x, y])
      }
    }
    setForeground(curTet, degree, [x, y])
  });
  
  useKeypress([' '], (event) => {
    let x = curPos[0]
    let y = curPos[1]
    let degree = curDegree;
    
    while (true) {
      if (! checkPosIsPosible(curTet, curDegree, [x, y+1])) {
        setBackground(curTet, curDegree, [x, y])
        let newTet = getRandomTetrominos()
        let newDegree = 0
        let newPos = [5, 1]
        setCurTet(newTet)
        setCurDegree(newDegree)
        setCurPos(newPos)
        resetForeground()
        setForeground(newTet, newDegree, newPos)
        return
      }
      y += 1;
    }
  });
  
  useKeypress(['Escape'], (event) => {
  });
  
  function mergeArray(arr1, arr2) {
    let merged = Array(rows).fill().map(() => Array(columns).fill(0));
    for (let i=0; i<rows; i++) {
      for (let j=0; j<columns; j++) {
        merged[i][j] = arr1[i][j] || arr2[i][j]
      }
    }
    return merged
  }
  
  return (
    <main>
      <TetrisView
        tetrisArray={mergeArray(tetrisArrFg, tetrisArrBg)}
      />
    </main>
  );
}
