import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './AnalyzeGames.css'
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

  // Constants for player colors
  const PLAYER_TURN_WHITE = 'white'
  const PLAYER_TURN_BLACK = 'black'
  const PLAYER_TURN_CHECKMATE = 'checkmate'

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

  // Initialize chess board with starting position (using piece codes)
  const initialBoardState = [
    ['black-T', 'black-C', 'black-F', 'black-Q', 'black-R', 'black-F', 'black-C', 'black-T'],
    ['black-p', 'black-p', 'black-p', 'black-p', 'black-p', 'black-p', 'black-p', 'black-p'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['white-p', 'white-p', 'white-p', 'white-p', 'white-p', 'white-p', 'white-p', 'white-p'],
    ['white-T', 'white-C', 'white-F', 'white-Q', 'white-R', 'white-F', 'white-C', 'white-T']
  ]

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
  const [moveHistory, setMoveHistory] = useState([{ moveNumber: 0, text: 'Initial position', color: PLAYER_TURN_WHITE, boardState: initialBoardState, movedPiecesState: new Set() }])
  const [movedPieces, setMovedPieces] = useState(new Set()) // Track pieces that have moved
  const [kingInCheck, setKingInCheck] = useState(null) // Track which king is in check (PLAYER_WHITE or PLAYER_BLACK or null)
  const [checkmate, setCheckmate] = useState(null) // Track checkmate (PLAYER_WHITE or PLAYER_BLACK or null)
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0) // Track current position in history

  // Convert piece code to readable name
  const getPieceName = (pieceCode) => {
    const pieceType = pieceCode.split('-')[1]
    const pieceIcons = {
      'p': '♟',
      'T': '♜',
      'C': '♞',
      'F': '♝',
      'Q': '♛',
      'R': '♚'
    }
    return pieceIcons[pieceType] || ''
  }

  // Convert row/col to chess notation (e.g., e2, e4)
  const toChessNotation = (row, col) => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1']
    return files[col] + ranks[row]
  }

  // Get opponent color
  const getOpponentColor = (color) => {
    return color === PLAYER_TURN_WHITE ? PLAYER_TURN_BLACK : PLAYER_TURN_WHITE
  }

  // Iterate over all board squares with a callback
  const forEachBoardSquare = (callback) => {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (callback(row, col) === false) return false
      }
    }
    return true
  }

  // Find king position on the board
  const findKingPosition = (color, boardToCheck = board) => {
    let kingPos = null
    forEachBoardSquare((row, col) => {
      if (boardToCheck[row][col] === `${color}-R`) {
        kingPos = { row, col }
        return false // Stop iteration
      }
    })
    return kingPos
  }

  // Check if a king is in check
  const isKingInCheck = (color, boardToCheck = board) => {
    const kingPos = findKingPosition(color, boardToCheck)
    if (!kingPos) return false
    return isSquareUnderAttack(kingPos.row, kingPos.col, color, boardToCheck)
  }

  // Check if a player has any legal moves
  const hasLegalMoves = (color, boardToCheck = board) => {
    for (let fromRow = 0; fromRow < 8; fromRow++) {
      for (let fromCol = 0; fromCol < 8; fromCol++) {
        const piece = boardToCheck[fromRow][fromCol]
        if (piece?.startsWith(color)) {
          // Try all possible moves
          for (let toRow = 0; toRow < 8; toRow++) {
            for (let toCol = 0; toCol < 8; toCol++) {
              if (isLegalMove(piece, fromRow, fromCol, toRow, toCol, boardToCheck)) {
                // Simulate the move and check if king is still in check
                const testBoard = boardToCheck.map(row => [...row])
                testBoard[toRow][toCol] = piece
                testBoard[fromRow][fromCol] = ''
                
                // Handle castling in test board
                const pieceType = piece.split('-')[1]
                if (pieceType === 'R' && Math.abs(toCol - fromCol) === 2) {
                  const isKingside = toCol > fromCol
                  const rookFromCol = isKingside ? 7 : 0
                  const rookToCol = isKingside ? 5 : 3
                  const rook = testBoard[fromRow][rookFromCol]
                  testBoard[fromRow][rookToCol] = rook
                  testBoard[fromRow][rookFromCol] = ''
                }
                
                if (!isKingInCheck(color, testBoard)) {
                  return true // Found a legal move
                }
              }
            }
          }
        }
      }
    }
    return false // No legal moves found
  }

  // Check for checkmate
  const isCheckmate = (color, boardToCheck = board) => {
    return isKingInCheck(color, boardToCheck) && !hasLegalMoves(color, boardToCheck)
  }

  // Helper function to check if a square is empty
  const isEmpty = (row, col, boardToCheck = board) => {
    return boardToCheck[row]?.[col] === ''
  }

  // Helper function to check if a square has an opponent piece
  const isOpponent = (row, col, color, boardToCheck = board) => {
    if (!boardToCheck[row]?.[col]) return false
    return boardToCheck[row][col].startsWith(getOpponentColor(color))
  }

  // Validate legal moves for each piece type
  const isLegalMove = (piece, fromRow, fromCol, toRow, toCol, boardToCheck = board, allowSameColor = false) => {
    if (fromRow === toRow && fromCol === toCol) return false
    
    const color = piece.split('-')[0]
    const pieceType = piece.split('-')[1]
    const rowDiff = toRow - fromRow
    const colDiff = toCol - fromCol
    
    // Check if destination has same color piece (only block if not checking protection)
    if (!allowSameColor && boardToCheck[toRow][toCol]?.startsWith(color)) {
      return false
    }

    switch (pieceType) {
      case 'p': // Pawn
        { const direction = color === PLAYER_TURN_WHITE ? -1 : 1
        const startRow = color === PLAYER_TURN_WHITE ? 6 : 1
        
        // Move forward one square
        if (colDiff === 0 && rowDiff === direction && isEmpty(toRow, toCol, boardToCheck)) {
          return true
        }
        
        // Move forward two squares from starting position
        if (colDiff === 0 && rowDiff === 2 * direction && fromRow === startRow && 
            isEmpty(toRow, toCol, boardToCheck) && isEmpty(fromRow + direction, fromCol, boardToCheck)) {
          return true
        }
        
        // Capture diagonally (or protect same-color piece when checking protection)
        if (Math.abs(colDiff) === 1 && rowDiff === direction) {
          if (allowSameColor && boardToCheck[toRow][toCol]?.startsWith(color)) {
            return true // Protecting same-color piece
          }
          if (isOpponent(toRow, toCol, color, boardToCheck)) {
            return true // Can capture opponent
          }
        }
        return false }

      case 'T': // Tower (Rook)
        if (rowDiff !== 0 && colDiff !== 0) return false
        return isPathClear(fromRow, fromCol, toRow, toCol, boardToCheck)

      case 'C': // Knight
        return (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 1) ||
               (Math.abs(rowDiff) === 1 && Math.abs(colDiff) === 2)

      case 'F': // Bishop
        if (Math.abs(rowDiff) !== Math.abs(colDiff)) return false
        return isPathClear(fromRow, fromCol, toRow, toCol, boardToCheck)

      case 'Q': // Queen
        if (rowDiff !== 0 && colDiff !== 0 && Math.abs(rowDiff) !== Math.abs(colDiff)) {
          return false
        }
        return isPathClear(fromRow, fromCol, toRow, toCol, boardToCheck)

      case 'R': // King
        // Normal king move
        if (Math.abs(rowDiff) <= 1 && Math.abs(colDiff) <= 1) {
          return true
        }
        
        // Castling
        if (!allowSameColor && rowDiff === 0 && Math.abs(colDiff) === 2) {
          const kingKey = `${fromRow}-${fromCol}`
          // King must not have moved
          if (movedPieces.has(kingKey)) return false
          
          // King must not be in check
          if (isSquareUnderAttack(fromRow, fromCol, color, boardToCheck)) return false
          
          // Determine if kingside or queenside castling
          const isKingside = colDiff > 0
          const rookCol = isKingside ? 7 : 0
          const rookKey = `${fromRow}-${rookCol}`
          const rook = boardToCheck[fromRow][rookCol]
          
          // Rook must be present and not have moved
          if (!rook?.endsWith('-T') || movedPieces.has(rookKey)) return false
          
          // Path between king and rook must be clear
          const direction = isKingside ? 1 : -1
          const passCol = fromCol + direction
          const endCol = isKingside ? 6 : 2
          
          // Check squares between king and rook
          for (let c = Math.min(fromCol, rookCol) + 1; c < Math.max(fromCol, rookCol); c++) {
            if (!isEmpty(fromRow, c, boardToCheck)) return false
          }
          
          // King cannot pass through or end up in check
          if (isSquareUnderAttack(fromRow, passCol, color, boardToCheck)) return false
          if (isSquareUnderAttack(fromRow, endCol, color, boardToCheck)) return false
          
          return true
        }
        
        return false

      default:
        return false
    }
  }

  // Check if a square is under attack by opponent
  const isSquareUnderAttack = (row, col, color, boardToCheck = board) => {
    const opponentColor = getOpponentColor(color)
    let isAttacked = false
    forEachBoardSquare((r, c) => {
      const piece = boardToCheck[r][c]
      if (piece?.startsWith(opponentColor)) {
        if (isLegalMove(piece, r, c, row, col, boardToCheck, false)) {
          isAttacked = true
          return false // Stop iteration
        }
      }
    })
    return isAttacked
  }

  // Check if path is clear (for rook, bishop, queen)
  const isPathClear = (fromRow, fromCol, toRow, toCol, boardToCheck = board) => {
    const rowStep = Math.sign(toRow - fromRow)
    const colStep = Math.sign(toCol - fromCol)
    
    let currentRow = fromRow + rowStep
    let currentCol = fromCol + colStep
    
    while (currentRow !== toRow || currentCol !== toCol) {
      if (!isEmpty(currentRow, currentCol, boardToCheck)) {
        return false
      }
      currentRow += rowStep
      currentCol += colStep
    }
    
    return true
  }

  // Calculate all valid moves for a piece
  const getValidMovesForPiece = (piece, fromRow, fromCol) => {
    const moves = []
    const color = piece.split('-')[0]
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (isLegalMove(piece, fromRow, fromCol, row, col)) {
          const isAttack = board[row][col] !== ''
          
          // Create a test board with the piece moved to check if it would be under attack
          const testBoard = board.map(r => [...r])
          testBoard[row][col] = piece
          testBoard[fromRow][fromCol] = ''
          const wouldBeAttacked = isSquareUnderAttack(row, col, color, testBoard)
          
          moves.push({ row, col, isAttack, wouldBeAttacked })
        }
      }
    }
    return moves
  }

  // Calculate all attacked pieces by the current player
  const calculateAttackedPieces = (boardState, attackingColor) => {
    const attacked = []
    forEachBoardSquare((fromRow, fromCol) => {
      const piece = boardState[fromRow][fromCol]
      if (piece?.startsWith(attackingColor)) {
        forEachBoardSquare((toRow, toCol) => {
          const targetPiece = boardState[toRow][toCol]
          if (targetPiece && !targetPiece.startsWith(attackingColor)) {
            if (isLegalMove(piece, fromRow, fromCol, toRow, toCol, boardState)) {
              attacked.push({ row: toRow, col: toCol, attackedBy: attackingColor })
            }
          }
        })
      }
    })
    return attacked
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

  // Calculate which pieces defend a specific piece
  const calculateDefenders = (targetRow, targetCol, boardState = board) => {
    const targetPiece = boardState[targetRow][targetCol]
    if (!targetPiece) return []
    
    const defenders = []
    const pieceColor = targetPiece.split('-')[0]
    
    forEachBoardSquare((fromRow, fromCol) => {
      const piece = boardState[fromRow][fromCol]
      if (piece?.startsWith(pieceColor) && !(fromRow === targetRow && fromCol === targetCol)) {
        if (isLegalMove(piece, fromRow, fromCol, targetRow, targetCol, boardState, true)) {
          defenders.push({ row: fromRow, col: fromCol, color: pieceColor })
        }
      }
    })
    
    return defenders
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

  // Calculate protected pieces (defended by same color) with defender count
  const calculateProtectedPieces = (boardState, protectingColor) => {
    const protectionMap = new Map()
    
    forEachBoardSquare((fromRow, fromCol) => {
      const piece = boardState[fromRow][fromCol]
      if (piece?.startsWith(protectingColor)) {
        forEachBoardSquare((toRow, toCol) => {
          const targetPiece = boardState[toRow][toCol]
          // Check if target is same color and can be defended
          if (targetPiece?.startsWith(protectingColor) && 
              !(fromRow === toRow && fromCol === toCol)) {
            if (isLegalMove(piece, fromRow, fromCol, toRow, toCol, boardState, true)) {
              const key = `${toRow}-${toCol}`
              const current = protectionMap.get(key) || { row: toRow, col: toCol, defenders: 0, color: protectingColor }
              current.defenders += 1
              protectionMap.set(key, current)
            }
          }
        })
      }
    })
    
    return Array.from(protectionMap.values())
  }

  // Execute a move and update game state (shared logic for click and drag-drop)
  const executeMove = (piece, fromRow, fromCol, toRow, toCol) => {
    const newBoard = board.map(row => [...row])
    const capturedPiece = newBoard[toRow][toCol]
    newBoard[toRow][toCol] = piece
    newBoard[fromRow][fromCol] = ''
    
    // Handle castling - move the rook
    const pieceType = piece.split('-')[1]
    if (pieceType === 'R' && Math.abs(toCol - fromCol) === 2) {
      const isKingside = toCol > fromCol
      const rookFromCol = isKingside ? 7 : 0
      const rookToCol = isKingside ? 5 : 3
      const rook = newBoard[fromRow][rookFromCol]
      newBoard[fromRow][rookToCol] = rook
      newBoard[fromRow][rookFromCol] = ''
    }
    
    // Handle pawn promotion - promote to queen when reaching opposite end
    const colorPiece = piece.split('-')[0]
    if (pieceType === 'p') {
      const promotionRow = colorPiece === PLAYER_TURN_WHITE ? 0 : 7
      if (toRow === promotionRow) {
        newBoard[toRow][toCol] = `${colorPiece}-Q`
      }
    }
    
    setBoard(newBoard)
    
    // Track that this piece has moved
    const newMovedPieces = new Set(movedPieces)
    newMovedPieces.add(`${fromRow}-${fromCol}`)
    setMovedPieces(newMovedPieces)
    const newTurn = currentTurn === PLAYER_TURN_WHITE ? PLAYER_TURN_BLACK : PLAYER_TURN_WHITE
    setCurrentTurn(newTurn)
    setSelectedSquare(null)
    setValidMoves([])
    
    // Truncate history if we're making a move from a previous position
    const truncatedHistory = moveHistory.slice(0, currentMoveIndex + 1)
    
    // Add move to history
    const moveNumber = Math.floor(truncatedHistory.length / 2) + 1
    const color = currentTurn === PLAYER_TURN_WHITE ? '⚪' : '⚫'
    const pieceName = getPieceName(piece)
    const from = toChessNotation(fromRow, fromCol)
    const to = toChessNotation(toRow, toCol)
    const capture = capturedPiece ? ' x ' : ' → '
    const moveText = `${color} ${pieceName} ${from}${capture}${to}`
    
    // Check if the opponent king is in check or checkmate
    if (isCheckmate(newTurn, newBoard)) {
      setCheckmate(newTurn)
      setKingInCheck(newTurn)
      // Add checkmate to move history
      const newHistory = [...truncatedHistory, 
        { moveNumber, text: moveText, color: currentTurn, boardState: newBoard.map(row => [...row]), movedPiecesState: new Set(newMovedPieces) }, 
        { moveNumber: moveNumber + 0.5, text: `🏁 CHECKMATE! ${currentTurn === PLAYER_TURN_WHITE ? '⚪ White' : '⚫ Black'} wins!`, color: PLAYER_TURN_CHECKMATE, boardState: newBoard.map(row => [...row]), movedPiecesState: new Set(newMovedPieces) }]
      setMoveHistory(newHistory)
      setCurrentMoveIndex(newHistory.length - 1)
    } else {
      const newHistory = [...truncatedHistory, { moveNumber, text: moveText, color: currentTurn, boardState: newBoard.map(row => [...row]), movedPiecesState: new Set(newMovedPieces) }]
      setMoveHistory(newHistory)
      setCurrentMoveIndex(newHistory.length - 1)
      if (isKingInCheck(newTurn, newBoard)) {
        setKingInCheck(newTurn)
      } else {
        setKingInCheck(null)
      }
    }
    
    // Recalculate attacked and protected pieces
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
      if (color !== currentTurn) return
      
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
      setAttackedPieces([])
      flashDefenders(row, col)
      return
    }
    
    // No piece selected yet - only select if it's the current player's piece
    if (color !== currentTurn) return

    // Select piece and show valid moves
    setSelectedSquare({ row, col })
    const moves = getValidMovesForPiece(piece, row, col)
    setValidMoves(moves)
    setAttackedPieces([])
    flashDefenders(row, col)
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

  const handleMoveClick = (index) => {
    const historyEntry = moveHistory[index]
    // Prevent clicking on sealed moves
    if (historyEntry.sealed) return
    
    setBoard(historyEntry.boardState.map(row => [...row]))
    setMovedPieces(new Set(historyEntry.movedPiecesState))
    setCurrentMoveIndex(index)
    setSelectedSquare(null)
    setValidMoves([])
    
    // Determine whose turn it is: if the move was made by white, it's black's turn next
    // For index 0 (initial position), it's white's turn
    let turn = PLAYER_TURN_WHITE
    if (index > 0) {
      // After a move is made, it's the other player's turn
      if (historyEntry.color === PLAYER_TURN_WHITE) {
        turn = PLAYER_TURN_BLACK
      } else if (historyEntry.color === PLAYER_TURN_BLACK) {
        turn = PLAYER_TURN_WHITE
      } else if (historyEntry.color === PLAYER_TURN_CHECKMATE) {
        // On checkmate move, keep the current turn (game is over anyway)
        turn = historyEntry.text.includes('White wins') ? PLAYER_TURN_BLACK : PLAYER_TURN_WHITE
      }
    }
    setCurrentTurn(turn)
    
    // Check game state
    const restoredBoard = historyEntry.boardState
    if (historyEntry.color === PLAYER_TURN_CHECKMATE) {
      const checkmatedColor = historyEntry.text.includes('White wins') ? PLAYER_TURN_BLACK : PLAYER_TURN_WHITE
      setCheckmate(checkmatedColor)
      setKingInCheck(checkmatedColor)
    } else {
      setCheckmate(null)
      if (isKingInCheck(PLAYER_TURN_WHITE, restoredBoard)) {
        setKingInCheck(PLAYER_TURN_WHITE)
      } else if (isKingInCheck(PLAYER_TURN_BLACK, restoredBoard)) {
        setKingInCheck(PLAYER_TURN_BLACK)
      } else {
        setKingInCheck(null)
      }
    }
    
    // Recalculate attacked and protected pieces
    recalculateAttacksAndProtection(restoredBoard)
  }

  const resetBoard = () => {
    setBoard(initialBoardState)
    setCurrentTurn(PLAYER_TURN_WHITE)
    setSelectedSquare(null)
    setValidMoves([])
    setAttackedPieces([])
    setProtectedPieces([])
    setMoveHistory([{ moveNumber: 0, text: 'Initial position', color: PLAYER_TURN_WHITE, boardState: initialBoardState, movedPiecesState: new Set() }])
    setMovedPieces(new Set())
    setKingInCheck(null)
    setCheckmate(null)
    setCurrentMoveIndex(0)
  }

  const exportMoveHistory = () => {
    if (moveHistory.length === 0) return
    
    const timestamp = new Date().toISOString().replaceAll(/[:.]/g, '-').slice(0, -5)
    let content = 'Chess Game Move History\n'
    content += '======================\n'
    content += `Date: ${new Date().toLocaleString()}\n\n`
    
    moveHistory.forEach(move => {
      content += `${move.moveNumber}. ${move.text}\n`
    })
    
    content += '\n\nFinal Board State\n'
    content += '=================\n\n'
    content += '    a   b   c   d   e   f   g   h\n'
    content += '  +---+---+---+---+---+---+---+---+\n'
    
    // Map piece codes to unicode symbols
    const pieceSymbols = {
      'white-p': '♙', 'white-T': '♖', 'white-C': '♘', 'white-F': '♗', 'white-Q': '♕', 'white-R': '♔',
      'black-p': '♟', 'black-T': '♜', 'black-C': '♞', 'black-F': '♝', 'black-Q': '♛', 'black-R': '♚'
    }
    
    board.forEach((row, rowIndex) => {
      const rank = 8 - rowIndex
      content += `${rank} |`
      row.forEach(piece => {
        const symbol = piece ? pieceSymbols[piece] || '?' : ' '
        content += ` ${symbol} |`
      })
      content += ` ${rank}\n`
      content += '  +---+---+---+---+---+---+---+---+\n'
    })
    
    content += '    a   b   c   d   e   f   g   h\n'
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `chess-game-${timestamp}.txt`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  // Helper function to parse move history from file content
  const parseMoveHistory = (historySection) => {
    const moveLines = historySection.split('\n').filter(line => 
      line.match(/^\d+\.\s*(.+)$/)
    )
    
    return moveLines.map((line, index, array) => {
      const match = line.match(/^(\d+(?:\.\d+)?)\.\s*(.+)$/)
      if (match) {
        const moveNumber = Number.parseFloat(match[1])
        const text = match[2].trim()
        let color = PLAYER_TURN_WHITE
        if (text.includes('⚫')) color = PLAYER_TURN_BLACK
        if (text.includes('CHECKMATE')) color = PLAYER_TURN_CHECKMATE
        const sealed = index < array.length - 1
        return { moveNumber, text, color, sealed }
      }
      return null
    }).filter(move => move !== null)
  }

  // Helper function to parse board state from file content
  const parseBoardState = (boardSection) => {
    const symbolToPiece = {
      '♙': 'white-p', '♖': 'white-T', '♘': 'white-C', '♗': 'white-F', '♕': 'white-Q', '♔': 'white-R',
      '♟': 'black-p', '♜': 'black-T', '♞': 'black-C', '♝': 'black-F', '♛': 'black-Q', '♚': 'black-R'
    }
    
    const boardLines = boardSection.split('\n').filter(line => line.match(/^\d\s*\|/))
    const newBoard = new Array(8).fill(null).map(() => new Array(8).fill(''))
    
    boardLines.forEach(line => {
      const match = line.match(/^(\d)\s*\|(.+)\|\s*\d$/)
      if (match) {
        const rank = Number.parseInt(match[1])
        const rowIndex = 8 - rank
        const squares = match[2].split('|').map(s => s.trim())
        
        squares.forEach((symbol, colIndex) => {
          if (symbol && symbol !== ' ' && symbolToPiece[symbol]) {
            newBoard[rowIndex][colIndex] = symbolToPiece[symbol]
          }
        })
      }
    })
    
    return newBoard
  }

  // Helper function to update game state after import
  const updateGameStateAfterImport = (parsedMoves, newBoard) => {
    setBoard(newBoard)
    setMoveHistory(parsedMoves)
    setSelectedSquare(null)
    setValidMoves([])
    setAttackedPieces([])
    setProtectedPieces([])
    setMovedPieces(new Set())
    setKingInCheck(null)
    setCurrentMoveIndex(parsedMoves.length - 1)
    
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

  // Helper function to handle file loading
  const handleFileLoad = (content) => {
    try {
      const historySection = content.split('Final Board State')[0]
      const parsedMoves = parseMoveHistory(historySection)
      
      const boardSection = content.split('Final Board State')[1]
      if (!boardSection) {
        alert('Could not find board state in file')
        return
      }
      
      const newBoard = parseBoardState(boardSection)
      
      if (parsedMoves.length > 0) {
        parsedMoves[parsedMoves.length - 1].boardState = newBoard.map(row => [...row])
        parsedMoves[parsedMoves.length - 1].movedPiecesState = new Set()
      }
      
      updateGameStateAfterImport(parsedMoves, newBoard)
      alert('Game loaded successfully!')
    } catch (error) {
      console.error('Error parsing file:', error)
      alert('Error loading file. Please make sure it is a valid chess game export.')
    }
  }

/**
 * Imports a chess game's move history and board state from a text file.
 * 
 * Creates a file input dialog that accepts .txt files containing exported chess games.
 * The file should contain a move history section and a "Final Board State" section with
 * the board represented using Unicode chess symbols.
 * 
 * The function performs the following operations:
 * - Parses move history lines in the format "moveNumber. moveText"
 * - Extracts player turns (white/black) based on chess piece symbols (⚫)
 * - Marks all moves as sealed except the last one
 * - Parses the board state from Unicode chess symbols to internal piece notation
 * - Updates the game state including board, move history, current turn, and check/checkmate status
 * - Determines the next player's turn based on the last move or checkmate state
 * 
 * @function
 * @throws {Error} Displays an alert if the file format is invalid or parsing fails
 * @fires input#onchange - Triggers when a file is selected
 * 
 * @example
 * // File format expected:
 * // 1. ♙ e2-e4
 * // 1.5. ⚫ ♟ e7-e5
 * // 2. ♘ g1-f3
 * // Final Board State
 * // 8 | ♜ | ♞ | ♝ | ♛ | ♚ | ♝ | ♞ | ♜ | 8
 * // ...
 * 
 * @see {@link PLAYER_TURN_WHITE}
 * @see {@link PLAYER_TURN_BLACK}
 * @see {@link PLAYER_TURN_CHECKMATE}
 */
  const importMoveHistory = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.txt'
    
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (!file) return
      
      const reader = new FileReader()
      reader.onload = (event) => {
        handleFileLoad(event.target.result)
      }
      
      reader.readAsText(file)
    }
    
    input.click()
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

  return (
    <div className="analyze-games">
      <header className="analyze-header">
        <h1>📊 Analyze Games</h1>
      </header>

      <main className="analyze-content">
        <div className="chess-board-container">
          
                  <button className="back-button" onClick={() => navigate('/')}>
          ← Back
        </button>
          <div className="turn-indicator">
            {checkmateMessage}
          </div>
          <div className="chess-board" style={{ backgroundImage: `url(${plateauImage})` }}>
            {board.map((row, rowIndex) => (
              row.map((piece, colIndex) => {
                const isLight = (rowIndex + colIndex) % 2 === 0
                const isSelected = selectedSquare && selectedSquare.row === rowIndex && selectedSquare.col === colIndex
                const validMove = validMoves.find(m => m.row === rowIndex && m.col === colIndex)
                const isValidMove = validMove && !validMove.isAttack
                const isValidAttack = validMove?.isAttack
                const wouldBeAttacked = validMove?.wouldBeAttacked
                const attackInfo = attackedPieces.find(ap => ap.row === rowIndex && ap.col === colIndex)
                const isUnderAttack = !!attackInfo
                const attackedBy = attackInfo ? attackInfo.attackedBy : ''
                const protectedInfo = protectedPieces.find(pp => pp.row === rowIndex && pp.col === colIndex)
                const isProtected = !!protectedInfo
                const defenderCount = protectedInfo ? protectedInfo.defenders : 0
                const protectionColor = protectedInfo ? protectedInfo.color : ''
                const isKingInCheckSquare = kingInCheck && piece === `${kingInCheck}-R`
                const isKingInCheckmateSquare = checkmate && piece === `${checkmate}-R`
                // Don't show under-attack styling if king is in check (show in-check styling instead)
                const showUnderAttack = isUnderAttack && !isKingInCheckSquare && !isKingInCheckmateSquare
                // Don't show protection if king is in checkmate
                const showProtection = isProtected && !isKingInCheckmateSquare
                const isFlashing = flashingPieces.some(fp => fp.row === rowIndex && fp.col === colIndex)
                const flashingPieceInfo = flashingPieces.find(fp => fp.row === rowIndex && fp.col === colIndex)
                const flashClass = isFlashing && flashingPieceInfo ? `defender-flash-${flashingPieceInfo.color}` : ''
                let validMoveClass = ''
                if (isValidMove) {
                  validMoveClass = wouldBeAttacked ? 'valid-move-attacked' : 'valid-move'
                }
                
                // For valid attacks, add a class to indicate if piece would be safe or attacked
                let validAttackClass = ''
                if (isValidAttack) {
                  validAttackClass = wouldBeAttacked ? 'valid-attack valid-attack-unsafe' : 'valid-attack valid-attack-safe'
                }
                
                let checkStatusClass = ''
                if (isKingInCheckmateSquare) {
                  checkStatusClass = 'in-checkmate'
                } else if (isKingInCheckSquare) {
                  checkStatusClass = 'in-check'
                }
                
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`chess-square ${isLight ? 'light' : 'dark'} ${
                      isSelected ? 'selected' : ''
                    } ${
                      validMoveClass
                    } ${
                      validAttackClass
                    } ${
                      showUnderAttack ? `under-attack under-attack-${attackedBy}` : ''
                    } ${
                      showProtection ? `protected protected-${protectionColor}-${Math.min(defenderCount, 4)}` : ''
                    } ${
                      checkStatusClass
                    } ${
                      flashClass
                    }`}
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
              })
            ))}
          </div>
          <div className="board-coordinates">
            <div className="files">a b c d e f g h</div>
          </div>
        </div>

        <div className="analysis-panel">
          <h3>Analysis Tools</h3>
          <div className="tool-buttons">
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
            <button className="tool-btn" onClick={resetBoard}>Reset Board</button>
          </div>
          <div className="attack-toggles">
            <h4>Show Attacks</h4>
            <button 
              className={`toggle-btn ${showWhiteAttacks ? 'active' : ''}`}
              onClick={() => handleToggleAttacks(PLAYER_TURN_WHITE)}
            >
              ⚪ White Attacks <span className={`status-light ${showWhiteAttacks ? 'on' : 'off'}`}>●</span>
            </button>
            <button 
              className={`toggle-btn ${showBlackAttacks ? 'active' : ''}`}
              onClick={() => handleToggleAttacks(PLAYER_TURN_BLACK)}
            >
              ⚫ Black Attacks <span className={`status-light ${showBlackAttacks ? 'on' : 'off'}`}>●</span>
            </button>
          </div>
          <div className="attack-toggles">
            <h4>Show Protections</h4>
            <button 
              className={`toggle-btn ${showWhiteProtection ? 'active' : ''}`}
              onClick={() => handleToggleProtection(PLAYER_TURN_WHITE)}
            >
              ⚪ White Protections <span className={`status-light ${showWhiteProtection ? 'on' : 'off'}`}>●</span>
            </button>
            <button 
              className={`toggle-btn ${showBlackProtection ? 'active' : ''}`}
              onClick={() => handleToggleProtection(PLAYER_TURN_BLACK)}
            >
              ⚫ Black Protections <span className={`status-light ${showBlackProtection ? 'on' : 'off'}`}>●</span>
            </button>
            <button 
              className={`toggle-btn ${showDefenderFlash ? 'active' : ''}`}
              onClick={() => setShowDefenderFlash(!showDefenderFlash)}
            >
              ✨ Selected piece <span className={`status-light ${showDefenderFlash ? 'on' : 'off'}`}>●</span>
            </button>
          </div>
        </div>

        <div className="move-history-panel">
          <h3>Move History</h3>
          <div className="moves-container">
            {moveHistory.map((move, index) => (
              <div 
                key={`${move.moveNumber}-${move.text}`} 
                className={`move-item ${index === currentMoveIndex ? 'active' : ''} ${move.sealed ? 'sealed' : ''}`}
                onClick={() => handleMoveClick(index)}
                title={move.sealed ? 'Imported move (locked)' : ''}
              >
                <span className="move-number">{move.moveNumber}.</span>
                <span className="move-text">{move.text}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default AnalyzeGames
