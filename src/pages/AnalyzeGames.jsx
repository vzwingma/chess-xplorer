import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './AnalyzeGames.css'
import { exportMoveHistory as exportMoveHistoryController, importMoveHistory as importMoveHistoryController } from '../controllers/ImportExportGames.controller'
import {
  PLAYER_TURN_WHITE,
  PLAYER_TURN_BLACK,
  PLAYER_TURN_CHECKMATE,
  initialBoardState,
  getPieceName,
  toChessNotation,
  getOpponentColor,
  forEachBoardSquare,
  isLegalMove as isLegalMoveHelper,
  isSquareUnderAttack as isSquareUnderAttackHelper,
  isKingInCheck as isKingInCheckHelper,
  hasLegalMoves as hasLegalMovesHelper,
  isCheckmate as isCheckmateHelper,
  getValidMovesForPiece as getValidMovesForPieceHelper,
  calculateAttackedPieces as calculateAttackedPiecesHelper,
  calculateDefenders as calculateDefendersHelper,
  calculateProtectedPieces as calculateProtectedPiecesHelper
} from '../controllers/AnalyseGames.helper'
import plateauImage from '../resources/plateau.png'
import blackT from '../resources/black-T.png'
import blackC from '../resources/black-C.png'
import blackF from '../resources/black-F.png'
import blackQ from '../resources/black-Q.png'
import blackR from '../resources/black-R.png'
import blackP from '../resources/black-p.png'
import whiteT from '../resources/white-T.png'
import whiteC from '../resources/white-C.png'
import whiteF from '../resources/white-F.png'
import whiteQ from '../resources/white-Q.png'
import whiteR from '../resources/white-R.png'
import whiteP from '../resources/white-p.png'

function AnalyzeGames() {
  const navigate = useNavigate()

  // Mapping of piece codes to images
  const pieceImages = {
    'black-T': blackT,
    'black-C': blackC,
    'black-F': blackF,
    'black-Q': blackQ,
    'black-R': blackR,
    'black-p': blackP,
    'white-T': whiteT,
    'white-C': whiteC,
    'white-F': whiteF,
    'white-Q': whiteQ,
    'white-R': whiteR,
    'white-p': whiteP,
  }

  const [board, setBoard] = useState(initialBoardState)
  const [draggedPiece, setDraggedPiece] = useState(null)
  const [draggedFrom, setDraggedFrom] = useState(null)
  const [currentTurn, setCurrentTurn] = useState(PLAYER_TURN_WHITE)
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [validMoves, setValidMoves] = useState([])
  const [attackedPieces, setAttackedPieces] = useState([])
  const [showWhiteAttacks, setShowWhiteAttacks] = useState(false)
  const [showBlackAttacks, setShowBlackAttacks] = useState(false)
  const [protectedPieces, setProtectedPieces] = useState([])
  const [showWhiteProtection, setShowWhiteProtection] = useState(false)
  const [showBlackProtection, setShowBlackProtection] = useState(false)
  const [flashingPieces, setFlashingPieces] = useState([])
  const [showDefenderFlash, setShowDefenderFlash] = useState(true)
  const [showAttackedFlash, setShowAttackedFlash] = useState(true)
  const [flashingAttackedPieces, setFlashingAttackedPieces] = useState([])
  const [moveHistory, setMoveHistory] = useState([])
  const [movedPieces, setMovedPieces] = useState(new Set()) // Track pieces that have moved
  const [kingInCheck, setKingInCheck] = useState(null) // Track which king is in check (PLAYER_WHITE or PLAYER_BLACK or null)
  const [checkmate, setCheckmate] = useState(null) // Track checkmate (PLAYER_WHITE or PLAYER_BLACK or null)
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0) // Track current position in history
  const [capturedPieces, setCapturedPieces] = useState({ white: [], black: [] }) // Track captured pieces
  const [playNumber, setPlayNumber] = useState(() => {
    // Generate initial play number: random 8-digit number
    return Math.floor(10000000 + Math.random() * 90000000).toString()
  })

  // Function to generate a new play number
  const generatePlayNumber = () => {
    return Math.floor(10000000 + Math.random() * 90000000).toString()
  }

  // Wrapper functions for helpers that need access to component state
  const isSquareUnderAttack = (row, col, color, boardToCheck = board) => {
    return isSquareUnderAttackHelper(row, col, color, boardToCheck, movedPieces, isLegalMove)
  }

  const isLegalMove = (piece, fromRow, fromCol, toRow, toCol, boardToCheck = board, allowSameColor = false) => {
    return isLegalMoveHelper(piece, fromRow, fromCol, toRow, toCol, boardToCheck, movedPieces, isSquareUnderAttack, allowSameColor)
  }

  const isKingInCheck = (color, boardToCheck = board) => {
    return isKingInCheckHelper(color, boardToCheck, movedPieces, isSquareUnderAttack)
  }

  const hasLegalMoves = (color, boardToCheck = board) => {
    return hasLegalMovesHelper(color, boardToCheck, movedPieces, isLegalMove, isKingInCheck)
  }

  const isCheckmate = (color, boardToCheck = board) => {
    return isCheckmateHelper(color, boardToCheck, movedPieces, isKingInCheck, hasLegalMoves)
  }

  const getValidMovesForPiece = (piece, fromRow, fromCol) => {
    return getValidMovesForPieceHelper(piece, fromRow, fromCol, board, isLegalMove, isSquareUnderAttack)
  }

  const calculateAttackedPieces = (boardState, attackingColor) => {
    return calculateAttackedPiecesHelper(boardState, attackingColor, isLegalMove)
  }

  const calculateDefenders = (targetRow, targetCol, boardState = board) => {
    return calculateDefendersHelper(targetRow, targetCol, boardState, isLegalMove)
  }

  const calculateProtectedPieces = (boardState, protectingColor) => {
    return calculateProtectedPiecesHelper(boardState, protectingColor, isLegalMove)
  }

  // Recalculate attacked and protected pieces based on toggle states
  const recalculateAttacksAndProtection = (boardState) => {
    const attacks = []
    if (showWhiteAttacks) {
      attacks.push(...calculateAttackedPieces(boardState, PLAYER_TURN_WHITE))
    }
    if (showBlackAttacks) {
      attacks.push(...calculateAttackedPieces(boardState, PLAYER_TURN_BLACK))
    }
    setAttackedPieces(attacks)
    
    const protections = []
    if (showWhiteProtection) {
      protections.push(...calculateProtectedPieces(boardState, PLAYER_TURN_WHITE))
    }
    if (showBlackProtection) {
      protections.push(...calculateProtectedPieces(boardState, PLAYER_TURN_BLACK))
    }
    setProtectedPieces(protections)
  }

  // Flash defender pieces with timeout
  const flashDefenders = (row, col) => {
    if (showDefenderFlash) {
      const defenders = calculateDefenders(row, col)
      setFlashingPieces(defenders)
      setTimeout(() => {
        setFlashingPieces([])
      }, 1000)
    }
  }

  // Flash attacked pieces with timeout
  const flashAttackedPieces = (row, col) => {
    if (showAttackedFlash) {
      const piece = board[row][col]
      if (!piece) return
      
      const color = piece.split('-')[0]
      const attacked = []
      
      // Find all pieces this piece can attack
      forEachBoardSquare((toRow, toCol) => {
        const targetPiece = board[toRow][toCol]
        if (targetPiece && !targetPiece.startsWith(color)) {
          if (isLegalMove(piece, row, col, toRow, toCol, board)) {
            attacked.push({ row: toRow, col: toCol, color: targetPiece.split('-')[0] })
          }
        }
      })
      
      setFlashingAttackedPieces(attacked)
      setTimeout(() => {
        setFlashingAttackedPieces([])
      }, 1000)
    }
  }

  // Helper function to handle piece capture
  const handleCapture = (capturedPiece) => {
    if (!capturedPiece) return
    
    const capturedColor = capturedPiece.split('-')[0]
    const newCapturedPieces = { ...capturedPieces }
    if (capturedColor === PLAYER_TURN_WHITE) {
      newCapturedPieces.white = [...newCapturedPieces.white, capturedPiece]
    } else {
      newCapturedPieces.black = [...newCapturedPieces.black, capturedPiece]
    }
    setCapturedPieces(newCapturedPieces)
  }

  // Helper function to handle castling
  const handleCastling = (newBoard, piece, fromRow, fromCol, toCol) => {
    const pieceType = piece.split('-')[1]
    if (pieceType === 'R' && Math.abs(toCol - fromCol) === 2) {
      const isKingside = toCol > fromCol
      const rookFromCol = isKingside ? 7 : 0
      const rookToCol = isKingside ? 5 : 3
      const rook = newBoard[fromRow][rookFromCol]
      newBoard[fromRow][rookToCol] = rook
      newBoard[fromRow][rookFromCol] = ''
    }
  }

  // Helper function to handle pawn promotion
  const handlePawnPromotion = (newBoard, piece, toRow, toCol) => {
    const pieceType = piece.split('-')[1]
    const colorPiece = piece.split('-')[0]
    if (pieceType === 'p') {
      const promotionRow = colorPiece === PLAYER_TURN_WHITE ? 0 : 7
      if (toRow === promotionRow) {
        newBoard[toRow][toCol] = `${colorPiece}-Q`
      }
    }
  }

  // Helper function to update move history with checkmate
  const updateHistoryWithCheckmate = (truncatedHistory, moveNumber, moveText, newBoard, newMovedPieces) => {
    const newHistory = [...truncatedHistory, 
      { moveNumber, text: moveText, color: currentTurn, boardState: newBoard.map(row => [...row]), movedPiecesState: new Set(newMovedPieces), capturedPiecesState: { ...capturedPieces } }, 
      { moveNumber: moveNumber + 0.5, text: `🏁 CHECKMATE! ${currentTurn === PLAYER_TURN_WHITE ? '⚪ White' : '⚫ Black'} wins!`, color: PLAYER_TURN_CHECKMATE, boardState: newBoard.map(row => [...row]), movedPiecesState: new Set(newMovedPieces), capturedPiecesState: { ...capturedPieces } }]
    setMoveHistory(newHistory)
    setCurrentMoveIndex(newHistory.length - 1)
  }

  // Helper function to update move history without checkmate
  const updateHistoryWithMove = (truncatedHistory, moveNumber, moveText, newBoard, newMovedPieces, newTurn) => {
    const newHistory = [...truncatedHistory, { moveNumber, text: moveText, color: currentTurn, boardState: newBoard.map(row => [...row]), movedPiecesState: new Set(newMovedPieces), capturedPiecesState: { ...capturedPieces } }]
    setMoveHistory(newHistory)
    setCurrentMoveIndex(newHistory.length - 1)
    setKingInCheck(isKingInCheck(newTurn, newBoard) ? newTurn : null)
  }

  // Execute a move and update game state (shared logic for click and drag-drop)
  const executeMove = (piece, fromRow, fromCol, toRow, toCol) => {
    const newBoard = board.map(row => [...row])
    const capturedPiece = newBoard[toRow][toCol]
    
    handleCapture(capturedPiece)
    
    newBoard[toRow][toCol] = piece
    newBoard[fromRow][fromCol] = ''
    
    handleCastling(newBoard, piece, fromRow, fromCol, toCol)
    handlePawnPromotion(newBoard, piece, toRow, toCol)
    
    setBoard(newBoard)
    
    const newMovedPieces = new Set(movedPieces)
    newMovedPieces.add(`${fromRow}-${fromCol}`)
    setMovedPieces(newMovedPieces)
    
    const newTurn = currentTurn === PLAYER_TURN_WHITE ? PLAYER_TURN_BLACK : PLAYER_TURN_WHITE
    setCurrentTurn(newTurn)
    setSelectedSquare(null)
    setValidMoves([])
    
    const truncatedHistory = moveHistory.slice(0, currentMoveIndex + 1)
    const moveNumber = Math.floor(truncatedHistory.length / 2) + 1
    const color = currentTurn === PLAYER_TURN_WHITE ? '⚪' : '⚫'
    const pieceName = getPieceName(piece)
    const from = toChessNotation(fromRow, fromCol)
    const to = toChessNotation(toRow, toCol)
    const capture = capturedPiece ? ' x ' : ' → '
    const moveText = `${color} ${pieceName} ${from}${capture}${to}`
    
    if (isCheckmate(newTurn, newBoard)) {
      setCheckmate(newTurn)
      setKingInCheck(newTurn)
      updateHistoryWithCheckmate(truncatedHistory, moveNumber, moveText, newBoard, newMovedPieces)
    } else {
      updateHistoryWithMove(truncatedHistory, moveNumber, moveText, newBoard, newMovedPieces, newTurn)
    }
    
    recalculateAttacksAndProtection(newBoard)
  }

  // Handle piece selection (click)
  const handlePieceClick = (piece, row, col) => {
    // Prevent moves after checkmate
    if (checkmate) return
    
    const color = piece.split('-')[0]
    
    // If there's a selected piece, check if this is a valid attack/capture move
    if (selectedSquare) {
      const { row: fromRow, col: fromCol } = selectedSquare
      const selectedPiece = board[fromRow][fromCol]
      const selectedColor = selectedPiece.split('-')[0]
      
      // If clicking on enemy piece, try to capture it
      if (color !== selectedColor) {
        handleSquareClick(row, col)
        return
      }
      
      // If clicking on same color piece
      if (color !== currentTurn) {
        // Allow clicking on opponent pieces to show their defenders
        setSelectedSquare(null)
        setValidMoves([])
        flashDefenders(row, col)
        return
      }
      
      // If clicking the same piece, deselect
      if (selectedSquare.row === row && selectedSquare.col === col) {
        setSelectedSquare(null)
        setValidMoves([])
        return
      }
      
      // Select different piece of same color
      setSelectedSquare({ row, col })
      const moves = getValidMovesForPiece(piece, row, col)
      setValidMoves(moves)
      flashDefenders(row, col)
      return
    }
    
    // No piece selected yet - select any piece to show its defenders
    // Only allow moving if it's the current player's piece
    if (color === currentTurn) {
      // Select piece and show valid moves
      setSelectedSquare({ row, col })
      const moves = getValidMovesForPiece(piece, row, col)
      setValidMoves(moves)
    }
    
    // Show defenders for any piece (including opponent pieces)
    flashDefenders(row, col)
    // Show attacked pieces if toggle is on
    flashAttackedPieces(row, col)
  }

  // Handle square click for moving selected piece
  const handleSquareClick = (toRow, toCol) => {
    // Prevent moves after checkmate
    if (checkmate) return
    
    if (!selectedSquare) return

    const { row: fromRow, col: fromCol } = selectedSquare
    const piece = board[fromRow][fromCol]

    if (isLegalMove(piece, fromRow, fromCol, toRow, toCol)) {
      executeMove(piece, fromRow, fromCol, toRow, toCol)
    }
  }

  // Drag handlers
  const handleDragStart = (e, piece, row, col) => {
    // Prevent moves after checkmate
    if (checkmate) {
      e.preventDefault()
      return
    }
    
    const color = piece.split('-')[0]
    if (color !== currentTurn) {
      e.preventDefault()
      return
    }
    
    setDraggedPiece(piece)
    setDraggedFrom({ row, col })
    setSelectedSquare(null)
    setValidMoves([])
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e, toRow, toCol) => {
    e.preventDefault()
    
    if (!draggedPiece || !draggedFrom) return
    
    const { row: fromRow, col: fromCol } = draggedFrom
    
    if (isLegalMove(draggedPiece, fromRow, fromCol, toRow, toCol)) {
      executeMove(draggedPiece, fromRow, fromCol, toRow, toCol)
    }
    
    setDraggedPiece(null)
    setDraggedFrom(null)
  }

  const handleDragEnd = () => {
    setDraggedPiece(null)
    setDraggedFrom(null)
  }

  // Helper function to determine turn after a move
  const determineTurnAfterMove = (index, historyEntry) => {
    if (index === 0) return PLAYER_TURN_WHITE
    
    if (historyEntry.color === PLAYER_TURN_WHITE) {
      return PLAYER_TURN_BLACK
    } else if (historyEntry.color === PLAYER_TURN_BLACK) {
      return PLAYER_TURN_WHITE
    } else if (historyEntry.color === PLAYER_TURN_CHECKMATE) {
      return historyEntry.text.includes('White wins') ? PLAYER_TURN_BLACK : PLAYER_TURN_WHITE
    }
    return PLAYER_TURN_WHITE
  }

  // Helper function to update check/checkmate state
  const updateCheckState = (historyEntry, restoredBoard) => {
    if (historyEntry.color === PLAYER_TURN_CHECKMATE) {
      const checkmatedColor = historyEntry.text.includes('White wins') ? PLAYER_TURN_BLACK : PLAYER_TURN_WHITE
      setCheckmate(checkmatedColor)
      setKingInCheck(checkmatedColor)
      return
    }
    
    setCheckmate(null)
    if (isKingInCheck(PLAYER_TURN_WHITE, restoredBoard)) {
      setKingInCheck(PLAYER_TURN_WHITE)
    } else if (isKingInCheck(PLAYER_TURN_BLACK, restoredBoard)) {
      setKingInCheck(PLAYER_TURN_BLACK)
    } else {
      setKingInCheck(null)
    }
  }

  const handleMoveClick = (index) => {
    const historyEntry = moveHistory[index]
    if (historyEntry.sealed) return
    
    setBoard(historyEntry.boardState.map(row => [...row]))
    setMovedPieces(new Set(historyEntry.movedPiecesState))
    setCurrentMoveIndex(index)
    setSelectedSquare(null)
    setValidMoves([])
    
    if (historyEntry.capturedPiecesState) {
      setCapturedPieces(historyEntry.capturedPiecesState)
    }
    
    const turn = determineTurnAfterMove(index, historyEntry)
    setCurrentTurn(turn)
    
    const restoredBoard = historyEntry.boardState
    updateCheckState(historyEntry, restoredBoard)
    recalculateAttacksAndProtection(restoredBoard)
  }

  const resetBoard = () => {
    setBoard(initialBoardState)
    setCurrentTurn(PLAYER_TURN_WHITE)
    setSelectedSquare(null)
    setValidMoves([])
    setAttackedPieces([])
    setProtectedPieces([])
    setMoveHistory([])
    setMovedPieces(new Set())
    setKingInCheck(null)
    setCheckmate(null)
    setCurrentMoveIndex(0)
    setCapturedPieces({ white: [], black: [] })
    setPlayNumber(generatePlayNumber())
  }

  // Export current game to a text file
  const exportMoveHistory = () => {
    exportMoveHistoryController(moveHistory, board, playNumber, capturedPieces)
  }





  // Helper function to update game state after import
  const updateGameStateAfterImport = (parsedMoves, newBoard, capturedPieces) => {
    setBoard(newBoard)
    setMoveHistory(parsedMoves)
    setSelectedSquare(null)
    setValidMoves([])
    setAttackedPieces([])
    setProtectedPieces([])
    setMovedPieces(new Set())
    setKingInCheck(null)
    setCurrentMoveIndex(parsedMoves.length - 1)
    setCapturedPieces(capturedPieces || { white: [], black: [] })
    
    const lastMove = parsedMoves[parsedMoves.length - 1]
    if (lastMove?.color === PLAYER_TURN_CHECKMATE) {
      const checkmatedColor = lastMove.text.includes('White wins') ? PLAYER_TURN_BLACK : PLAYER_TURN_WHITE
      setCheckmate(checkmatedColor)
      setKingInCheck(checkmatedColor)
      const lastMoveColor = parsedMoves[parsedMoves.length - 2]?.color || PLAYER_TURN_WHITE
      setCurrentTurn(lastMoveColor === PLAYER_TURN_WHITE ? PLAYER_TURN_BLACK : PLAYER_TURN_WHITE)
    } else {
      setCheckmate(null)
      if (lastMove?.color === PLAYER_TURN_WHITE) {
        setCurrentTurn(PLAYER_TURN_BLACK)
      } else if (lastMove?.color === PLAYER_TURN_BLACK) {
        setCurrentTurn(PLAYER_TURN_WHITE)
      } else {
        setCurrentTurn(PLAYER_TURN_WHITE)
      }
    }
  }

  // Import game from a text file
  const importMoveHistory = () => {
    importMoveHistoryController((parsedMoves, newBoard, capturedPieces) => {
      updateGameStateAfterImport(parsedMoves, newBoard, capturedPieces)
    })
  }

  // Generic toggle handler for attacks or protection
  const handleToggle = (color, type) => {
    const isWhite = color === PLAYER_TURN_WHITE
    const isAttack = type === 'attack'
    
    // Get current state values
    const getStateValue = (white, attack) => {
      if (white && attack) return showWhiteAttacks
      if (white && !attack) return showWhiteProtection
      if (!white && attack) return showBlackAttacks
      return showBlackProtection
    }
    
    const currentValue = getStateValue(isWhite, isAttack)
    const otherValue = getStateValue(!isWhite, isAttack)
    
    // Get setter function
    const getSetter = (white, attack) => {
      if (white && attack) return setShowWhiteAttacks
      if (white && !attack) return setShowWhiteProtection
      if (!white && attack) return setShowBlackAttacks
      return setShowBlackProtection
    }
    const setter = getSetter(isWhite, isAttack)
    
    const calculator = isAttack ? calculateAttackedPieces : calculateProtectedPieces
    const stateSetter = isAttack ? setAttackedPieces : setProtectedPieces
    
    const newValue = !currentValue
    setter(newValue)
    
    const otherColor = getOpponentColor(color)
    const current = newValue ? calculator(board, color) : []
    const other = otherValue ? calculator(board, otherColor) : []
    stateSetter([...current, ...other])
  }

  const handleToggleAttacks = (color) => handleToggle(color, 'attack')
  const handleToggleProtection = (color) => handleToggle(color, 'protection')

  const winner = checkmate === PLAYER_TURN_WHITE ? '⚫ Black' : '⚪ White'
  const turnMessage = currentTurn === PLAYER_TURN_WHITE ? '⚪ White to move' : '⚫ Black to move'
  const checkmateMessage = checkmate 
    ? `🏁 CHECKMATE! ${winner} wins!`
    : turnMessage

  // Helper function to get flash class for a square
  const getFlashClass = (rowIndex, colIndex) => {
    const flashingPieceInfo = flashingPieces.find(fp => fp.row === rowIndex && fp.col === colIndex)
    if (flashingPieceInfo) {
      return `defender-flash-${flashingPieceInfo.color}`
    }
    
    const flashingAttackedInfo = flashingAttackedPieces.find(fp => fp.row === rowIndex && fp.col === colIndex)
    if (flashingAttackedInfo) {
      return `attacked-flash-${flashingAttackedInfo.color}`
    }
    
    return ''
  }

  // Helper function to get valid move class
  const getValidMoveClass = (validMove) => {
    if (!validMove || validMove.isAttack) return ''
    return validMove.wouldBeAttacked ? 'valid-move-attacked' : 'valid-move'
  }

  // Helper function to get valid attack class
  const getValidAttackClass = (validMove) => {
    if (!validMove?.isAttack) return ''
    
    let attackClass = showAttackedFlash ? '' : 'valid-attack '
    attackClass += validMove.wouldBeAttacked ? 'valid-attack-unsafe' : 'valid-attack-safe'
    return attackClass
  }

  // Helper function to get check status class
  const getCheckStatusClass = (piece) => {
    const isKingInCheckmateSquare = checkmate && piece === `${checkmate}-R`
    if (isKingInCheckmateSquare) return 'in-checkmate'
    
    const isKingInCheckSquare = kingInCheck && piece === `${kingInCheck}-R`
    if (isKingInCheckSquare) return 'in-check'
    
    return ''
  }

  // Helper function to get attack class
  const getAttackClass = (rowIndex, colIndex, piece) => {
    const attackInfo = attackedPieces.find(ap => ap.row === rowIndex && ap.col === colIndex)
    if (!attackInfo) return ''
    
    const isKingInCheckSquare = kingInCheck && piece === `${kingInCheck}-R`
    const isKingInCheckmateSquare = checkmate && piece === `${checkmate}-R`
    const showUnderAttack = !isKingInCheckSquare && !isKingInCheckmateSquare
    
    return showUnderAttack ? `under-attack under-attack-${attackInfo.attackedBy}` : ''
  }

  // Helper function to get protection class
  const getProtectionClass = (rowIndex, colIndex, piece) => {
    const protectedInfo = protectedPieces.find(pp => pp.row === rowIndex && pp.col === colIndex)
    if (!protectedInfo) return ''
    
    const isKingInCheckmateSquare = checkmate && piece === `${checkmate}-R`
    if (isKingInCheckmateSquare) return ''
    
    const defenderCount = Math.min(protectedInfo.defenders, 4)
    return `protected protected-${protectedInfo.color}-${defenderCount}`
  }

  // Helper function to calculate square classes
  const getSquareClasses = (rowIndex, colIndex, piece) => {
    const isLight = (rowIndex + colIndex) % 2 === 0
    const isSelected = selectedSquare && selectedSquare.row === rowIndex && selectedSquare.col === colIndex
    const validMove = validMoves.find(m => m.row === rowIndex && m.col === colIndex)
    
    const validMoveClass = getValidMoveClass(validMove)
    const validAttackClass = getValidAttackClass(validMove)
    const checkStatusClass = getCheckStatusClass(piece)
    const attackClass = getAttackClass(rowIndex, colIndex, piece)
    const protectionClass = getProtectionClass(rowIndex, colIndex, piece)
    const flashClass = getFlashClass(rowIndex, colIndex)
    
    return `chess-square ${isLight ? 'light' : 'dark'} ${
      isSelected ? 'selected' : ''
    } ${validMoveClass} ${validAttackClass} ${attackClass} ${protectionClass} ${checkStatusClass} ${flashClass}`
  }

  // Helper function to render a chess square
  const renderSquare = (piece, rowIndex, colIndex) => {
    const squareClasses = getSquareClasses(rowIndex, colIndex, piece)
    
    return (
      <div
        key={`${rowIndex}-${colIndex}`}
        className={squareClasses}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, rowIndex, colIndex)}
        onClick={() => piece ? handlePieceClick(piece, rowIndex, colIndex) : handleSquareClick(rowIndex, colIndex)}
      >
        {piece && (
          <img 
            src={pieceImages[piece]} 
            alt={piece} 
            className="chess-piece-img"
            draggable
            onDragStart={(e) => handleDragStart(e, piece, rowIndex, colIndex)}
            onDragEnd={handleDragEnd}
          />
        )}
      </div>
    )
  }

  return (
    <div className="analyze-games">
      <header className="analyze-header">
        <h1>📊 Analyze Game #{playNumber}</h1>
        <div className="turn-indicator">
          {checkmateMessage}
        </div>
      </header>
        
      <main className="analyze-content">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back
        </button>
        <div className="chess-board-container">
          <div className="board-with-captures">
            <div className="captured-pieces-container">
              <div className="captured-pieces captured-white">
                <div className="captured-icons">
                  {capturedPieces.white.map((piece, index) => (
                    <img 
                      key={`captured-white-${piece}-${index}`}
                      src={pieceImages[piece]} 
                      alt={piece}
                      className="captured-piece-icon"
                    />
                  ))}
                </div>
              </div>
              <div className="captured-pieces captured-black">
                <div className="captured-icons">
                  {capturedPieces.black.map((piece, index) => (
                    <img 
                      key={`captured-black-${piece}-${index}`}
                      src={pieceImages[piece]} 
                      alt={piece}
                      className="captured-piece-icon"
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="chess-board" style={{ backgroundImage: `url(${plateauImage})` }}>
              {board.map((row, rowIndex) => (
                row.map((piece, colIndex) => renderSquare(piece, rowIndex, colIndex))
              ))}
            </div>
          </div>
        </div>

        <div className="analysis-panel">
          <h3>Analysis Tools</h3>
          <div className="tool-buttons">
            <div className="button-row">
              <button 
                className="tool-btn import-btn"
                onClick={importMoveHistory}
                title="Import game from text file"
              >
                📂 Import
              </button>
              <button 
                className="tool-btn export-btn"
                onClick={exportMoveHistory}
                disabled={moveHistory.length === 0}
                title="Export move history to text file"
              >
                💾 Export
              </button>
            </div>
            <button className="tool-btn" onClick={resetBoard}>Reset Board</button>
          </div>
          <div className="attack-toggles">
            <h4>Show Attacks</h4>
            <button 
              className={`toggle-btn ${showWhiteAttacks ? 'active' : ''}`}
              onClick={() => handleToggleAttacks(PLAYER_TURN_WHITE)}
            >
              <span className="toggle-content"><span className="toggle-icon">⚪</span><span className="toggle-label">White Attacks</span></span> <span className={`status-light ${showWhiteAttacks ? 'on' : 'off'}`}>●</span>
            </button>
            <button 
              className={`toggle-btn ${showBlackAttacks ? 'active' : ''}`}
              onClick={() => handleToggleAttacks(PLAYER_TURN_BLACK)}
            >
              <span className="toggle-content"><span className="toggle-icon">⚫</span><span className="toggle-label">Black Attacks</span></span> <span className={`status-light ${showBlackAttacks ? 'on' : 'off'}`}>●</span>
            </button>
            <button 
              className={`toggle-btn ${showAttackedFlash ? 'active' : ''}`}
              onClick={() => setShowAttackedFlash(!showAttackedFlash)}
            >
              <span className="toggle-content"><span className="toggle-icon">🎯</span><span className="toggle-label">Selected piece</span></span> <span className={`status-light ${showAttackedFlash ? 'on' : 'off'}`}>●</span>
            </button>
          </div>
          <div className="attack-toggles">
            <h4>Show Protections</h4>
            <button 
              className={`toggle-btn ${showWhiteProtection ? 'active' : ''}`}
              onClick={() => handleToggleProtection(PLAYER_TURN_WHITE)}
            >
              <span className="toggle-content"><span className="toggle-icon">⚪</span><span className="toggle-label">White Protections</span></span> <span className={`status-light ${showWhiteProtection ? 'on' : 'off'}`}>●</span>
            </button>
            <button 
              className={`toggle-btn ${showBlackProtection ? 'active' : ''}`}
              onClick={() => handleToggleProtection(PLAYER_TURN_BLACK)}
            >
              <span className="toggle-content"><span className="toggle-icon">⚫</span><span className="toggle-label">Black Protections</span></span> <span className={`status-light ${showBlackProtection ? 'on' : 'off'}`}>●</span>
            </button>
            <button 
              className={`toggle-btn ${showDefenderFlash ? 'active' : ''}`}
              onClick={() => setShowDefenderFlash(!showDefenderFlash)}
            >
              <span className="toggle-content"><span className="toggle-icon">✨</span><span className="toggle-label">Selected piece</span></span> <span className={`status-light ${showDefenderFlash ? 'on' : 'off'}`}>●</span>
            </button>
          </div>
        </div>

        <div className="move-history-panel">
          <h3>Move History</h3>
          <div className="moves-container">
            <div className="move-history-header-row">
              <span className="move-number-col">#</span>
              <span className="white-moves-col">⚪ White</span>
              <span className="black-moves-col">⚫ Black</span>
            </div>
            {(() => {
              // Helper to render checkmate row
              const renderCheckmateRow = (moveNum, checkmate) => (
                <div key={`checkmate-${moveNum}`} className="move-row checkmate-row">
                  <span className="move-number">{moveNum}.</span>
                  <div 
                    className={`move-cell checkmate-cell ${checkmate.index === currentMoveIndex ? 'active' : ''} ${checkmate.move.sealed ? 'sealed' : ''}`}
                    onClick={() => handleMoveClick(checkmate.index)}
                  >
                    {checkmate.move.text}
                  </div>
                </div>
              )

              // Helper to render regular move row
              const renderMoveRow = (moveNum, white, black) => {
                let whiteStatusClass = 'empty'
                if (white) {
                  whiteStatusClass = white.index === currentMoveIndex ? 'active' : ''
                }
                
                let blackStatusClass = 'empty'
                if (black) {
                  blackStatusClass = black.index === currentMoveIndex ? 'active' : ''
                }
                
                return (
                  <div key={`move-${moveNum}`} className="move-row">
                    <span className="move-number">{moveNum}.</span>
                    <div 
                      className={`move-cell white-move ${whiteStatusClass} ${white?.move.sealed ? 'sealed' : ''}`}
                      onClick={() => white && handleMoveClick(white.index)}
                      title={white?.move.sealed ? 'Imported move (locked)' : ''}
                    >
                      {white ? white.move.text.replace('⚪', '').trim() : ''}
                    </div>
                    <div 
                      className={`move-cell black-move ${blackStatusClass} ${black?.move.sealed ? 'sealed' : ''}`}
                      onClick={() => black && handleMoveClick(black.index)}
                      title={black?.move.sealed ? 'Imported move (locked)' : ''}
                    >
                      {black ? black.move.text.replace('⚫', '').trim() : ''}
                    </div>
                  </div>
                )
              }

              // Group moves by move number
              const groupedMoves = {}
              moveHistory.forEach((move, index) => {
                const moveNum = Math.floor(move.moveNumber)
                if (!groupedMoves[moveNum]) {
                  groupedMoves[moveNum] = { white: null, black: null }
                }
                if (move.color === PLAYER_TURN_WHITE) {
                  groupedMoves[moveNum].white = { move, index }
                } else if (move.color === PLAYER_TURN_BLACK) {
                  groupedMoves[moveNum].black = { move, index }
                } else if (move.color === PLAYER_TURN_CHECKMATE) {
                  groupedMoves[moveNum].checkmate = { move, index }
                }
              })

              // Render in reverse order (newest first)
              return Object.keys(groupedMoves)
                .map(Number)
                .sort((a, b) => b - a)
                .map(moveNum => {
                  const { white, black, checkmate } = groupedMoves[moveNum]
                  return checkmate ? renderCheckmateRow(moveNum, checkmate) : renderMoveRow(moveNum, white, black)
                })
            })()}
          </div>
        </div>
      </main>
    </div>
  )
}

export default AnalyzeGames
