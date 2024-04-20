'use client'
import React, { useState, useEffect } from 'react';
import { TetrisView, KeepTetrisView, PreviewTetrisView } from '/app/play/tetris_view'
import { tetrominos, tetrominosPositions, tetrominosColors, getNewQueue } from '/app/play/tetrominos'
import { useInterval } from '/app/useInterval';
import { socket } from '../socket';
import useKeypress from 'react-use-keypress';

export default function play() {
  const [tetQueue, setTetQueue] = useState(getNewQueue())
  
  function consumeTetQueue() {
    let _tetQueue = tetQueue.slice()
    let newTet = _tetQueue.shift();
    if (_tetQueue.length < tetrominos.length) {
      _tetQueue = _tetQueue.concat(getNewQueue())
    }
    setTetQueue(_tetQueue)
    return newTet
  }
  
  const [tStart, setTStart] = useState(Date.now())
  
  const [curPos, setCurPos] = useState([5, 1])
  const [curTet, setCurTet] = useState('')
  const [keepTet, setKeepTet] = useState('')
  const [isAvailableKeep, setIsAvailableKeep] = useState(true)
  const [curDegree, setCurDegree] = useState(0)
  const [score, setScore] = useState(0)
  const [tScoreUpdated, setTScoreUpdated] = useState(0)
  
  const FPS = 30 // 60
  const tickInterval = 1000
  const rows = 20
  const columns = 10
  
  const [tetrisArrFg, setTetrisArrFg] = useState(Array(rows).fill().map(() => Array(columns).fill('')))
  const [tetrisArrBg, setTetrisArrBg] = useState(Array(rows).fill().map(() => Array(columns).fill('')))
  
  const numPreviews = 7
  
  function setForeground(tet, degree, pos) {
    let _tetrisArrFg = Array(rows).fill().map(() => Array(columns).fill(''));
    for (let i=0; i<4; i++) {
      let tx = tetrominosPositions[tet][degree][i][0];
      let ty = tetrominosPositions[tet][degree][i][1];
      _tetrisArrFg[pos[1]+ty][pos[0]+tx] = tet;
    }
    setTetrisArrFg(_tetrisArrFg);
  }
  
  function getKeepTet() {
    let Prv = Array(4).fill().map(() => Array(4).fill('_black'))
    let tet = keepTet
    let degree = 0
    if (tet != '') {
      for (let i=0; i<4; i++) {
        let tx = tetrominosPositions[tet][degree][i][0];
        let ty = tetrominosPositions[tet][degree][i][1];
        Prv[2+ty][2+tx] = tet;
      }
    }
    return Prv;
  }
  
  function getPreview() {
    let Prv = Array(numPreviews*4).fill().map(() => Array(4).fill('_black'))
    for (let pi=0; pi<numPreviews; pi++) {
      let tet = tetQueue[pi]
      let degree = 0
      for (let i=0; i<4; i++) {
        let tx = tetrominosPositions[tet][degree][i][0];
        let ty = tetrominosPositions[tet][degree][i][1];
        Prv[pi*4+2+ty][2+tx] = tet;
      }
    }
    return Prv;
  }
  
  function checkLineClear() {
    let _tetrisArrBg = tetrisArrBg.slice();
    let y = 0;
    for (; y<rows; y++) {
      let isClear = true;
      for (let x=0; x<columns; x++) {
        if (_tetrisArrBg[y][x] == '') {
          isClear = false;
          break;
        }
      }
      if (isClear == true) {
        // gain score
        setScore(score+1)
        setTScoreUpdated(Date.now())
        // shift
        for (let ty=y; ty>=0; ty--) {
          for (let x=0; x<columns; x++) {
            _tetrisArrBg[ty][x] = (ty==0)?'':_tetrisArrBg[ty-1][x];
          }
        }
      }
    }
    setTetrisArrBg(_tetrisArrBg.slice());
  }
  
  function resetForeground(newTet) {
    if (newTet == undefined) {
      newTet = consumeTetQueue()
    }
    let newDegree = 0
    let newPos = [5, 1]
    setCurTet(newTet)
    setCurDegree(newDegree)
    setCurPos(newPos)
    
    let _tetrisArrFg = Array(rows).fill().map(() => Array(columns).fill(''));
    setTetrisArrFg(_tetrisArrFg);
    
    setForeground(newTet, newDegree, newPos)
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
        checkLineClear()
        resetForeground()
        setIsAvailableKeep(true)
      }
    }
  }, 1000 / FPS);
  
  useKeypress(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Control'], (event) => {
    let x = curPos[0]
    let y = curPos[1]
    let degree = curDegree;
    
    if (event.key === 'ArrowUp') {
      if (checkPosIsPosible(curTet, (degree+1)%4, [x, y])) {
        degree = (degree+1)%4;
        setCurDegree(degree)
      }
    } else if (event.key === 'Control') {
      console.log('control')
      if (checkPosIsPosible(curTet, (degree-1+4)%4, [x, y])) {
        degree = (degree-1+4)%4;
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
        checkLineClear()
        
        resetForeground()
        setIsAvailableKeep(true)
        setTStart(Date.now())
        return
      }
      y += 1;
    }
    
  });
  
  useKeypress(['Escape'], (event) => {
  });
  
  useKeypress(['Shift'], (event) => {
    if (isAvailableKeep == true) {
      if (keepTet != '') {
        resetForeground(keepTet)
      } else {
        resetForeground()
      }
      setKeepTet(curTet);
      setIsAvailableKeep(false)
    }
  });
  
  useEffect(() => {
    if (curTet == '') {
      let newTet = consumeTetQueue()
      setCurTet(newTet)
      setForeground(newTet, curDegree, curPos)
    }
  }, [])
  
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
      <div className="flex items-start justify-items-start">
        <KeepTetrisView
          tetrisArray={getKeepTet()}
        />
        <TetrisView
          tetrisArray={mergeArray(tetrisArrFg, tetrisArrBg)}
        />
        <PreviewTetrisView
          tetrisArray={getPreview()}
        />
        
        <div className="m-5">
          Space: 내리기<br />
          Shift: 킵<br />
          ↑: 시계방향 회전<br />
          Ctrl (control): 반시계뱡향 회전<br />
        </div>
      </div>
      
      <div>
        Score: {score}
        <span className="text-green-400">{(Date.now()-tScoreUpdated < 1500)?' (+1 점!)':''}</span>
      </div>
    </main>
  );
}
