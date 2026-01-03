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
  const [currentTurn, setCurrentTurn] = useState('white')
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [validMoves, setValidMoves] = useState([])
  const [attackedPieces, setAttackedPieces] = useState([])
  const [showWhiteAttacks, setShowWhiteAttacks] = useState(false)
  const [showBlackAttacks, setShowBlackAttacks] = useState(false)
  const [protectedPieces, setProtectedPieces] = useState([])
  const [showWhiteProtection, setShowWhiteProtection] = useState(false)
  const [showBlackProtection, setShowBlackProtection] = useState(false)
  const [moveHistory, setMoveHistory] = useState([{ moveNumber: 0, text: 'Initial position', color: 'white', boardState: initialBoardState, movedPiecesState: new Set() }])
  const [movedPieces, setMovedPieces] = useState(new Set()) // Track pieces that have moved
  const [kingInCheck, setKingInCheck] = useState(null) // Track which king is in check ('white' or 'black' or null)
  const [checkmate, setCheckmate] = useState(null) // Track checkmate ('white' or 'black' or null)
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

  // Find king position on the board
  const findKingPosition = (color, boardToCheck = board) => {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = boardToCheck[row][col]
        if (piece === `${color}-R`) {
          return { row, col }
        }
      }
    }
    return null
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
    return boardToCheck[row][col].startsWith(color === 'white' ? 'black' : 'white')
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
        { const direction = color === 'white' ? -1 : 1
        const startRow = color === 'white' ? 6 : 1
        
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
    const opponentColor = color === 'white' ? 'black' : 'white'
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = boardToCheck[r][c]
        if (piece?.startsWith(opponentColor)) {
          if (isLegalMove(piece, r, c, row, col, boardToCheck, false)) {
            return true
          }
        }
      }
    }
    return false
  }

  // Check if path is clear (for rook, bishop, queen)
  const isPathClear = (fromRow, fromCol, toRow, toCol, boardToCheck = board) => {
    let rowStep = 0
    if (toRow > fromRow) {
      rowStep = 1
    } else if (toRow < fromRow) {
      rowStep = -1
    }
    let colStep = 0
    if (toCol > fromCol) {
      colStep = 1
    } else if (toCol < fromCol) {
      colStep = -1
    }
    
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
    for (let fromRow = 0; fromRow < 8; fromRow++) {
      for (let fromCol = 0; fromCol < 8; fromCol++) {
        const piece = boardState[fromRow][fromCol]
        if (piece?.startsWith(attackingColor)) {
          for (let toRow = 0; toRow < 8; toRow++) {
            for (let toCol = 0; toCol < 8; toCol++) {
              const targetPiece = boardState[toRow][toCol]
              if (targetPiece && !targetPiece.startsWith(attackingColor)) {
                if (isLegalMove(piece, fromRow, fromCol, toRow, toCol, boardState)) {
                  attacked.push({ row: toRow, col: toCol, attackedBy: attackingColor })
                }
              }
            }
          }
        }
      }
    }
    return attacked
  }

  // Calculate protected pieces (defended by same color) with defender count
  const calculateProtectedPieces = (boardState, protectingColor) => {
    const protectionMap = new Map()
    
    for (let fromRow = 0; fromRow < 8; fromRow++) {
      for (let fromCol = 0; fromCol < 8; fromCol++) {
        const piece = boardState[fromRow][fromCol]
        if (piece?.startsWith(protectingColor)) {
          for (let toRow = 0; toRow < 8; toRow++) {
            for (let toCol = 0; toCol < 8; toCol++) {
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
            }
          }
        }
      }
    }
    
    return Array.from(protectionMap.values())
  }

  // Handle piece selection (click)
  const handlePieceClick = (piece, row, col) => {
    // Prevent moves after checkmate
    if (checkmate) return
    
    const color = piece.split('-')[0]
    if (color !== currentTurn) return

    // If clicking the same piece, deselect
    if (selectedSquare && selectedSquare.row === row && selectedSquare.col === col) {
      setSelectedSquare(null)
      setValidMoves([])
      return
    }

    // Select new piece and show valid moves
    setSelectedSquare({ row, col })
    const moves = getValidMovesForPiece(piece, row, col)
    setValidMoves(moves)
    setAttackedPieces([])
  }

  // Handle square click for moving selected piece
  const handleSquareClick = (toRow, toCol) => {
    // Prevent moves after checkmate
    if (checkmate) return
    
    if (!selectedSquare) return

    const { row: fromRow, col: fromCol } = selectedSquare
    const piece = board[fromRow][fromCol]

    if (isLegalMove(piece, fromRow, fromCol, toRow, toCol)) {
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
      
      setBoard(newBoard)
      
      // Track that this piece has moved
      const newMovedPieces = new Set(movedPieces)
      newMovedPieces.add(`${fromRow}-${fromCol}`)
      setMovedPieces(newMovedPieces)
      const newTurn = currentTurn === 'white' ? 'black' : 'white'
      setCurrentTurn(newTurn)
      setSelectedSquare(null)
      setValidMoves([])
      
      // Truncate history if we're making a move from a previous position
      const truncatedHistory = moveHistory.slice(0, currentMoveIndex + 1)
      
      // Add move to history
      const moveNumber = Math.floor(truncatedHistory.length / 2) + 1
      const color = currentTurn === 'white' ? '⚪' : '⚫'
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
          { moveNumber: moveNumber + 0.5, text: `🏁 CHECKMATE! ${currentTurn === 'white' ? '⚪ White' : '⚫ Black'} wins!`, color: 'checkmate', boardState: newBoard.map(row => [...row]), movedPiecesState: new Set(newMovedPieces) }]
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
      
      // Recalculate attacked pieces based on toggle state
      const attacks = []
      if (showWhiteAttacks) {
        attacks.push(...calculateAttackedPieces(newBoard, 'white'))
      }
      if (showBlackAttacks) {
        attacks.push(...calculateAttackedPieces(newBoard, 'black'))
      }
      setAttackedPieces(attacks)
      
      // Recalculate protected pieces based on toggle state
      const protections = []
      if (showWhiteProtection) {
        protections.push(...calculateProtectedPieces(newBoard, 'white'))
      }
      if (showBlackProtection) {
        protections.push(...calculateProtectedPieces(newBoard, 'black'))
      }
      setProtectedPieces(protections)
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
      const newBoard = board.map(row => [...row])
      const capturedPiece = newBoard[toRow][toCol]
      newBoard[toRow][toCol] = draggedPiece
      newBoard[fromRow][fromCol] = ''
      
      // Handle castling - move the rook
      const pieceType = draggedPiece.split('-')[1]
      if (pieceType === 'R' && Math.abs(toCol - fromCol) === 2) {
        const isKingside = toCol > fromCol
        const rookFromCol = isKingside ? 7 : 0
        const rookToCol = isKingside ? 5 : 3
        const rook = newBoard[fromRow][rookFromCol]
        newBoard[fromRow][rookToCol] = rook
        newBoard[fromRow][rookFromCol] = ''
      }
      
      setBoard(newBoard)
      
      // Track that this piece has moved
      const newMovedPieces = new Set(movedPieces)
      newMovedPieces.add(`${fromRow}-${fromCol}`)
      setMovedPieces(newMovedPieces)
      const newTurn = currentTurn === 'white' ? 'black' : 'white'
      setCurrentTurn(newTurn)
      
      // Truncate history if we're making a move from a previous position
      const truncatedHistory = moveHistory.slice(0, currentMoveIndex + 1)
      
      // Add move to history
      const pieceName = getPieceName(draggedPiece)
      const fromNotation = toChessNotation(fromRow, fromCol)
      const toNotation = toChessNotation(toRow, toCol)
      const moveSymbol = capturedPiece ? 'x' : '→'
      const colorSymbol = currentTurn === 'white' ? '⚪' : '⚫'
      const moveText = `${colorSymbol} ${pieceName} ${fromNotation} ${moveSymbol} ${toNotation}`
      const moveNumber = Math.floor(truncatedHistory.length / 2) + 1
      const newMove = {
        moveNumber: moveNumber,
        text: moveText,
        color: currentTurn
      }
      
      // Check if the opponent king is in check or checkmate
      if (isCheckmate(newTurn, newBoard)) {
        setCheckmate(newTurn)
        setKingInCheck(newTurn)
        // Add checkmate to move history
        newMove.boardState = newBoard.map(row => [...row])
        newMove.movedPiecesState = new Set(newMovedPieces)
        const checkmateMove = { moveNumber: moveNumber + 0.5, text: `🏁 CHECKMATE! ${currentTurn === 'white' ? '⚪ White' : '⚫ Black'} wins!`, color: 'checkmate', boardState: newBoard.map(row => [...row]), movedPiecesState: new Set(newMovedPieces) }
        const newHistory = [...truncatedHistory, newMove, checkmateMove]
        setMoveHistory(newHistory)
        setCurrentMoveIndex(newHistory.length - 1)
      } else {
        newMove.boardState = newBoard.map(row => [...row])
        newMove.movedPiecesState = new Set(newMovedPieces)
        const newHistory = [...truncatedHistory, newMove]
        setMoveHistory(newHistory)
        setCurrentMoveIndex(newHistory.length - 1)
        if (isKingInCheck(newTurn, newBoard)) {
          setKingInCheck(newTurn)
        } else {
          setKingInCheck(null)
        }
      }
      
      // Recalculate attacked pieces based on toggle state
      const attacks = []
      if (showWhiteAttacks) {
        attacks.push(...calculateAttackedPieces(newBoard, 'white'))
      }
      if (showBlackAttacks) {
        attacks.push(...calculateAttackedPieces(newBoard, 'black'))
      }
      setAttackedPieces(attacks)
      
      // Recalculate protected pieces based on toggle state
      const protections = []
      if (showWhiteProtection) {
        protections.push(...calculateProtectedPieces(newBoard, 'white'))
      }
      if (showBlackProtection) {
        protections.push(...calculateProtectedPieces(newBoard, 'black'))
      }
      setProtectedPieces(protections)
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
    
    // Determine whose turn it is based on move index (0=white, 1=black, 2=white, etc.)
    const turn = index % 2 === 0 ? 'white' : 'black'
    setCurrentTurn(turn)
    
    // Check game state
    const restoredBoard = historyEntry.boardState
    if (historyEntry.color === 'checkmate') {
      const checkmatedColor = historyEntry.text.includes('White wins') ? 'black' : 'white'
      setCheckmate(checkmatedColor)
      setKingInCheck(checkmatedColor)
    } else {
      setCheckmate(null)
      if (isKingInCheck('white', restoredBoard)) {
        setKingInCheck('white')
      } else if (isKingInCheck('black', restoredBoard)) {
        setKingInCheck('black')
      } else {
        setKingInCheck(null)
      }
    }
    
    // Recalculate attacked and protected pieces
    const attacks = []
    if (showWhiteAttacks) {
      attacks.push(...calculateAttackedPieces(restoredBoard, 'white'))
    }
    if (showBlackAttacks) {
      attacks.push(...calculateAttackedPieces(restoredBoard, 'black'))
    }
    setAttackedPieces(attacks)
    
    const protections = []
    if (showWhiteProtection) {
      protections.push(...calculateProtectedPieces(restoredBoard, 'white'))
    }
    if (showBlackProtection) {
      protections.push(...calculateProtectedPieces(restoredBoard, 'black'))
    }
    setProtectedPieces(protections)
  }

  const resetBoard = () => {
    setBoard(initialBoardState)
    setCurrentTurn('white')
    setSelectedSquare(null)
    setValidMoves([])
    setAttackedPieces([])
    setProtectedPieces([])
    setMoveHistory([{ moveNumber: 0, text: 'Initial position', color: 'white', boardState: initialBoardState, movedPiecesState: new Set() }])
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

  const importMoveHistory = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.txt'
    
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (!file) return
      
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target.result
        
        try {
          // Parse move history
          const historySection = content.split('Final Board State')[0]
          const moveLines = historySection.split('\n').filter(line => 
            line.match(/^\d+\.\s*(.+)$/)
          )
          
          const parsedMoves = moveLines.map((line, index, array) => {
            const match = line.match(/^(\d+(?:\.\d+)?)\.\s*(.+)$/)
            if (match) {
              const moveNumber = Number.parseFloat(match[1])
              const text = match[2].trim()
              // Determine color from the move text
              let color = 'white'
              if (text.includes('⚫')) color = 'black'
              if (text.includes('CHECKMATE')) color = 'checkmate'
              // Mark all moves as sealed except the last one
              const sealed = index < array.length - 1
              return { moveNumber, text, color, sealed }
            }
            return null
          }).filter(move => move !== null)
          
          // Parse board state
          const boardSection = content.split('Final Board State')[1]
          if (!boardSection) {
            alert('Could not find board state in file')
            return
          }
          
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
          
          // Add board state to the last imported move
          if (parsedMoves.length > 0) {
            parsedMoves[parsedMoves.length - 1].boardState = newBoard.map(row => [...row])
            parsedMoves[parsedMoves.length - 1].movedPiecesState = new Set()
          }
          
          // Update state
          setBoard(newBoard)
          setMoveHistory(parsedMoves)
          setSelectedSquare(null)
          setValidMoves([])
          setAttackedPieces([])
          setProtectedPieces([])
          setMovedPieces(new Set()) // Reset moved pieces
          setKingInCheck(null)
          setCurrentMoveIndex(parsedMoves.length - 1)
          
          // Determine whose turn it is based on the last move
          const lastMove = parsedMoves[parsedMoves.length - 1]
          if (lastMove?.color === 'checkmate') {
            // Game is over, keep the turn as it was
            const checkmatedColor = lastMove.text.includes('White wins') ? 'black' : 'white'
            setCheckmate(checkmatedColor)
            setKingInCheck(checkmatedColor)
            // Set turn to the winner (who made the last move before checkmate)
            const lastMoveColor = parsedMoves[parsedMoves.length - 2]?.color || 'white'
            setCurrentTurn(lastMoveColor === 'white' ? 'black' : 'white')
          } else {
            setCheckmate(null)
            // Determine next turn: if last move was by white, it's black's turn and vice versa
            if (lastMove?.color === 'white') {
              setCurrentTurn('black')
            } else if (lastMove?.color === 'black') {
              setCurrentTurn('white')
            } else {
              // If no moves, white starts
              setCurrentTurn('white')
            }
          }
          
          alert('Game loaded successfully!')
        } catch (error) {
          console.error('Error parsing file:', error)
          alert('Error loading file. Please make sure it is a valid chess game export.')
        }
      }
      
      reader.readAsText(file)
    }
    
    input.click()
  }

  // Handle toggle for white attacks
  const handleToggleWhiteAttacks = () => {
    const newValue = !showWhiteAttacks
    setShowWhiteAttacks(newValue)
    
    if (newValue) {
      // Calculate and show white's attacks
      const whiteAttacks = calculateAttackedPieces(board, 'white')
      const blackAttacks = showBlackAttacks ? calculateAttackedPieces(board, 'black') : []
      // Combine both if black attacks is also on
      setAttackedPieces([...whiteAttacks, ...blackAttacks])
    } else if (showBlackAttacks) {
      // Only keep black attacks if it's on
      const blackAttacks = calculateAttackedPieces(board, 'black')
      setAttackedPieces(blackAttacks)
    } else {
      setAttackedPieces([])
    }
  }

  // Handle toggle for black attacks
  const handleToggleBlackAttacks = () => {
    const newValue = !showBlackAttacks
    setShowBlackAttacks(newValue)
    
    if (newValue) {
      // Calculate and show black's attacks
      const blackAttacks = calculateAttackedPieces(board, 'black')
      const whiteAttacks = showWhiteAttacks ? calculateAttackedPieces(board, 'white') : []
      // Combine both if white attacks is also on
      setAttackedPieces([...whiteAttacks, ...blackAttacks])
    } else if (showWhiteAttacks) {
      // Only keep white attacks if it's on
      const whiteAttacks = calculateAttackedPieces(board, 'white')
      setAttackedPieces(whiteAttacks)
    } else {
      setAttackedPieces([])
    }
  }

  // Handle toggle for white protection
  const handleToggleWhiteProtection = () => {
    const newValue = !showWhiteProtection
    setShowWhiteProtection(newValue)
    
    if (newValue) {
      const whiteProtected = calculateProtectedPieces(board, 'white')
      const blackProtected = showBlackProtection ? calculateProtectedPieces(board, 'black') : []
      setProtectedPieces([...whiteProtected, ...blackProtected])
    } else if (showBlackProtection) {
      const blackProtected = calculateProtectedPieces(board, 'black')
      setProtectedPieces(blackProtected)
    } else {
      setProtectedPieces([])
    }
  }

  // Handle toggle for black protection
  const handleToggleBlackProtection = () => {
    const newValue = !showBlackProtection
    setShowBlackProtection(newValue)
    
    if (newValue) {
      const blackProtected = calculateProtectedPieces(board, 'black')
      const whiteProtected = showWhiteProtection ? calculateProtectedPieces(board, 'white') : []
      setProtectedPieces([...whiteProtected, ...blackProtected])
    } else if (showWhiteProtection) {
      const whiteProtected = calculateProtectedPieces(board, 'white')
      setProtectedPieces(whiteProtected)
    } else {
      setProtectedPieces([])
    }
  }

  const winner = checkmate === 'white' ? '⚫ Black' : '⚪ White'
  const turnMessage = currentTurn === 'white' ? '⚪ White to move' : '⚫ Black to move'
  const checkmateMessage = checkmate 
    ? `🏁 CHECKMATE! ${winner} wins!`
    : turnMessage

  return (
    <div className="analyze-games">
      <header className="analyze-header">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back
        </button>
        <h1>📊 Analyze Games</h1>
        <p className="subtitle">Deep dive into chess games with powerful analysis tools</p>
      </header>

      <main className="analyze-content">
        <div className="chess-board-container">
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
                
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`chess-square ${isLight ? 'light' : 'dark'} ${
                      isSelected ? 'selected' : ''
                    } ${
                      isValidMove ? (wouldBeAttacked ? 'valid-move-attacked' : 'valid-move') : ''
                    } ${
                      isValidAttack ? 'valid-attack' : ''
                    } ${
                      showUnderAttack ? `under-attack under-attack-${attackedBy}` : ''
                    } ${
                      showProtection ? `protected protected-${protectionColor}-${Math.min(defenderCount, 4)}` : ''
                    } ${
                      isKingInCheckmateSquare ? 'in-checkmate' : (isKingInCheckSquare ? 'in-check' : '')
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
              onClick={handleToggleWhiteAttacks}
            >
              ⚪ White Attacks: {showWhiteAttacks ? 'ON' : 'OFF'}
            </button>
            <button 
              className={`toggle-btn ${showBlackAttacks ? 'active' : ''}`}
              onClick={handleToggleBlackAttacks}
            >
              ⚫ Black Attacks: {showBlackAttacks ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="attack-toggles">
            <h4>Show Protection</h4>
            <button 
              className={`toggle-btn ${showWhiteProtection ? 'active' : ''}`}
              onClick={handleToggleWhiteProtection}
            >
              ⚪ White Protection: {showWhiteProtection ? 'ON' : 'OFF'}
            </button>
            <button 
              className={`toggle-btn ${showBlackProtection ? 'active' : ''}`}
              onClick={handleToggleBlackProtection}
            >
              ⚫ Black Protection: {showBlackProtection ? 'ON' : 'OFF'}
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
                <span className="move-text">{move.sealed ? '🔒 ' : ''}{move.text}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default AnalyzeGames
