'use client'
import React, { useState, useEffect } from 'react'
import { TetrisView, HoldTetrisView, PreviewTetrisView } from 'components/Tetris/TetrisView'
import { tetrominos, tetrominosPositions, tetrominosColors, tetrominosRotationTests, getNewQueue } from 'components/Tetris/tetrominos'
import { useInterval } from 'lib/useInterval'
import { socket } from 'lib/socket'
import useKeypress from 'react-use-keypress'

export default function Play() {
  const [isGameOver, setIsGameOver] = useState(false)
  const [tetQueue, setTetQueue] = useState([])
  
  function consumeTetQueue() {
    let _tetQueue = tetQueue.slice()
    if (_tetQueue.length <= tetrominos.length) {
      _tetQueue = _tetQueue.concat(getNewQueue())
    }
    let newTet = _tetQueue.shift() || ''
    setTetQueue(_tetQueue)
    return newTet
  }
  
  const [tStart, setTStart] = useState(Date.now())
  
  const [curPos, setCurPos] = useState([5, 1])
  const [curTet, setCurTet] = useState('')
  const [holdTet, setHoldTet] = useState('')
  const [isAvailableHold, setIsAvailableHold] = useState(true)
  const [curDegree, setCurDegree] = useState(0)
  const [score, setScore] = useState(0)
  const [gainedScore, setGainedScore] = useState(0)
  const [tScoreUpdated, setTScoreUpdated] = useState(0)
  
  const FPS = 60
  const tickInterval = 1000
  const rows = 20
  const columns = 10
  
  const SCORE_PER_LINE = 5
  
  const [tetrisArrFg, setTetrisArrFg] = useState(Array(rows).fill('').map(() => Array(columns).fill('')))
  const [tetrisArrBg, setTetrisArrBg] = useState(Array(rows).fill('').map(() => Array(columns).fill('')))
  
  const numPreviews = 4
  
  function setForeground(tet, degree, pos) {
    let _tetrisArrFg = Array(rows).fill('').map(() => Array(columns).fill(''))
    for (let i=0; i<4; i++) {
      let tx = tetrominosPositions[tet][degree][i][0]
      let ty = tetrominosPositions[tet][degree][i][1]
      _tetrisArrFg[pos[1]+ty][pos[0]+tx] = tet
    }
    setTetrisArrFg(_tetrisArrFg)
  }
  
  function getHoldTet() {
    let Prv = Array(4).fill('').map(() => Array(4).fill('_black'))
    let tet = holdTet
    let degree = 0
    if (tet != '') {
      for (let i=0; i<4; i++) {
        let tx = tetrominosPositions[tet][degree][i][0]
        let ty = tetrominosPositions[tet][degree][i][1]
        Prv[2+ty][2+tx] = tet
      }
    }
    return Prv
  }
  
  function getPreview() {
    let Prv = Array(numPreviews*4).fill('').map(() => Array(4).fill('_black'))
    for (let pi=0; pi<numPreviews && pi<tetQueue.length; pi++) {
      let tet = tetQueue[pi]
      let degree = 0
      for (let i=0; i<4; i++) {
        let tx = tetrominosPositions[tet][degree][i][0]
        let ty = tetrominosPositions[tet][degree][i][1]
        Prv[pi*4+2+ty][2+tx] = tet
      }
    }
    return Prv
  }
  
  function checkGameOver() {
    if (!isGameOver) {
      return false
    }
    return true
  }
  
  function checkLineClear() {
    let _tetrisArrBg = tetrisArrBg.slice()
    let _score = score
    let _gainedScore = 0
    let y = 0
    for (; y<rows; y++) {
      let isClear = true
      for (let x=0; x<columns; x++) {
        if (_tetrisArrBg[y][x] == '') {
          isClear = false
          break
        }
      }
      if (isClear == true) {
        // gain score
        _gainedScore += SCORE_PER_LINE
        setScore(_score + _gainedScore)
        setTScoreUpdated(Date.now())
        // shift
        for (let ty=y; ty>=0; ty--) {
          for (let x=0; x<columns; x++) {
            _tetrisArrBg[ty][x] = (ty==0)?'':_tetrisArrBg[ty-1][x]
          }
        }
      }
    }
    setTetrisArrBg(_tetrisArrBg.slice())
    setGainedScore(_gainedScore)
  }
  
  function resetForeground(newTet) {
    if (!newTet) {
      newTet = consumeTetQueue()
    }
    let newDegree = 0
    let newPos = [5, 1]
    setCurTet(newTet)
    setCurDegree(newDegree)
    setCurPos(newPos)
    
    if (!checkPosIsPosible(newTet, newDegree, newPos)) {
      setIsGameOver(true)
      return
    }
    
    let _tetrisArrFg = Array(rows).fill('').map(() => Array(columns).fill(''))
    setTetrisArrFg(_tetrisArrFg)
    
    setForeground(newTet, newDegree, newPos)
  }
  
  function setBackground(tet, degree, pos) {
    let _tetrisArrBg = tetrisArrBg.slice()
    for (let i=0; i<4; i++) {
      let tx = tetrominosPositions[tet][degree][i][0]
      let ty = tetrominosPositions[tet][degree][i][1]
      _tetrisArrBg[pos[1]+ty][pos[0]+tx] = tet
    }
    setTetrisArrBg(_tetrisArrBg.slice())
  }
  
  function checkPosIsPosible(tet, degree, pos) {
    let x = pos[0]
    let y = pos[1]
    for (let i=0; i<4; i++) {
      let tx = tetrominosPositions[tet][degree][i][0]
      let ty = tetrominosPositions[tet][degree][i][1]
      
      let px = x+tx
      let py = y+ty
      if (px < 0 || px >= columns || py < 0 || py >= rows || tetrisArrBg[y+ty][x+tx] != '') {
        return false
      }
    }
    return true
  }
  
  useInterval(() => {
    if (checkGameOver() == true) {
      return
    }
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
  
        resetForeground('')
        setIsAvailableHold(true)
      }
    }
  }, 1000 / FPS)
  
  useKeypress(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Control'], (event) => {
    event.preventDefault()
    if (checkGameOver() == true) {
      return
    }
    let x = curPos[0]
    let y = curPos[1]
    let tet = curTet
    let degree = curDegree
    
    if (event.key === 'ArrowUp') {
      let tDegree = (degree+1)%4

      let tests = tetrominosRotationTests['default']['R'][curDegree]
      if (curTet in tetrominosRotationTests) {
        tests = tetrominosRotationTests[curTet]['R'][curDegree]
      }
      
      for (let ti=0; ti<tests.length; ti++) {
        if (checkPosIsPosible(tet, tDegree, [x+tests[ti][0], y+tests[ti][1]])) {
          x += tests[ti][0]
          y += tests[ti][1]
          degree = tDegree
          setCurPos([x, y])
          setCurDegree(degree)
          break
        }
      }
      
    } else if (event.key === 'Control') {
      let tDegree = (degree-1+4)%4

      let tests = tetrominosRotationTests['default']['L'][curDegree]
      if (curTet in tetrominosRotationTests) {
        tests = tetrominosRotationTests[curTet]['L'][curDegree]
      }
      
      for (let ti=0; ti<tests.length; ti++) {
        if (checkPosIsPosible(tet, tDegree, [x+tests[ti][0], y+tests[ti][1]])) {
          x += tests[ti][0]
          y += tests[ti][1]
          degree = tDegree
          setCurPos([x, y])
          setCurDegree(degree)
          break
        }
      }
    } else if (event.key === 'ArrowDown') {
      if (checkPosIsPosible(tet, degree, [x, y+1])) {
        y += 1
        setCurPos([x, y])
        setTStart(Date.now())
      }
    } else if (event.key === 'ArrowLeft') {
      if (checkPosIsPosible(tet, degree, [x-1, y])) {
        x -= 1
        setCurPos([x, y])
      }
    } else if (event.key === 'ArrowRight') {
      if (checkPosIsPosible(tet, degree, [x+1, y])) {
        x += 1
        setCurPos([x, y])
      }
    }
    setForeground(tet, degree, [x, y])
  })
  
  useKeypress([' '], (event) => {
    if (checkGameOver() == true) {
      return
    }
    let x = curPos[0]
    let y = curPos[1]
    let degree = curDegree
    
    while (true) {
      if (! checkPosIsPosible(curTet, curDegree, [x, y+1])) {
        setBackground(curTet, curDegree, [x, y])
        checkLineClear()
        
        resetForeground('')
        setIsAvailableHold(true)
        setTStart(Date.now())
        return
      }
      y += 1
    }
    
  })
  
  useKeypress(['Escape'], (event) => {
  })
  
  useKeypress(['Shift'], (event) => {
    if (checkGameOver() == true) {
      return
    }
    if (isAvailableHold == true) {
      if (holdTet != '') {
        resetForeground(holdTet)
      } else {
        resetForeground('')
      }
      setHoldTet(curTet)
      setIsAvailableHold(false)
    }
  })
  
  useEffect(() => {
    if (curTet == '') {
      let newTet = consumeTetQueue()
      setCurTet(newTet)
      setForeground(newTet, curDegree, curPos)
    }
  }, [])
  
  function mergeArray(arr1, arr2) {
    let merged = Array(rows).fill('').map(() => Array(columns).fill(0))
    for (let i=0; i<rows; i++) {
      for (let j=0; j<columns; j++) {
        merged[i][j] = arr1[i][j] || arr2[i][j]
      }
    }
    return merged
  }
  
  let gameOver = <div></div>
  if (isGameOver == true) {
    gameOver = <div className="absolute text-red-600 text-2xl font-bold text-center top-[268px] left-[144px]">Game Over</div>
  }
  
  return (
    <main>
      <div className="flex items-start justify-items-start mx-10 my-5 gap-3">
        <HoldTetrisView
          tetrisArray={getHoldTet()}
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
        
        {gameOver}
      </div>
      
      <div className="mx-[112px]">
        Score: {score}
        <span className="text-green-400">{(Date.now()-tScoreUpdated < 1500)?` (+${gainedScore} 점!)`:''}</span>
      </div>
    </main>
  )
}
