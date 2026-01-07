/**
 * Helper functions and constants for chess game analysis
 */

// Constants for player colors
export const PLAYER_TURN_WHITE = 'white'
export const PLAYER_TURN_BLACK = 'black'
export const PLAYER_TURN_CHECKMATE = 'checkmate'

// Initialize chess board with starting position (using piece codes)
export const initialBoardState = [
  ['black-T', 'black-C', 'black-F', 'black-Q', 'black-R', 'black-F', 'black-C', 'black-T'],
  ['black-p', 'black-p', 'black-p', 'black-p', 'black-p', 'black-p', 'black-p', 'black-p'],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['white-p', 'white-p', 'white-p', 'white-p', 'white-p', 'white-p', 'white-p', 'white-p'],
  ['white-T', 'white-C', 'white-F', 'white-Q', 'white-R', 'white-F', 'white-C', 'white-T']
]

// Convert piece code to readable name
export const getPieceName = (pieceCode) => {
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
export const toChessNotation = (row, col) => {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1']
  return files[col] + ranks[row]
}

// Get opponent color
export const getOpponentColor = (color) => {
  return color === PLAYER_TURN_WHITE ? PLAYER_TURN_BLACK : PLAYER_TURN_WHITE
}

// Iterate over all board squares with a callback
export const forEachBoardSquare = (callback) => {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (callback(row, col) === false) return false
    }
  }
  return true
}

// Find king position on the board
export const findKingPosition = (color, boardToCheck) => {
  let kingPos = null
  forEachBoardSquare((row, col) => {
    if (boardToCheck[row][col] === `${color}-R`) {
      kingPos = { row, col }
      return false // Stop iteration
    }
  })
  return kingPos
}

// Helper function to check if a square is empty
export const isEmpty = (row, col, boardToCheck) => {
  return boardToCheck[row]?.[col] === ''
}

// Helper function to check if a square has an opponent piece
export const isOpponent = (row, col, color, boardToCheck) => {
  if (!boardToCheck[row]?.[col]) return false
  return boardToCheck[row][col].startsWith(getOpponentColor(color))
}

// Check if path is clear (for rook, bishop, queen)
export const isPathClear = (fromRow, fromCol, toRow, toCol, boardToCheck) => {
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

// Helper function to validate pawn moves
const isLegalPawnMove = (color, { rowDiff, colDiff, fromRow, toRow, toCol }, boardToCheck, allowSameColor) => {
  const direction = color === PLAYER_TURN_WHITE ? -1 : 1
  const startRow = color === PLAYER_TURN_WHITE ? 6 : 1
  
  // Move forward one square
  if (colDiff === 0 && rowDiff === direction && isEmpty(toRow, toCol, boardToCheck)) {
    return true
  }
  
  // Move forward two squares from starting position
  if (colDiff === 0 && rowDiff === 2 * direction && fromRow === startRow) {
    return isEmpty(toRow, toCol, boardToCheck) && isEmpty(fromRow + direction, toCol, boardToCheck)
  }
  
  // Capture diagonally (or protect same-color piece)
  if (Math.abs(colDiff) === 1 && rowDiff === direction) {
    if (allowSameColor && boardToCheck[toRow][toCol]?.startsWith(color)) {
      return true
    }
    return isOpponent(toRow, toCol, color, boardToCheck)
  }
  
  return false
}

// Helper function to validate castling
const canCastle = (context) => {
  const { fromRow, fromCol, colDiff, color, boardToCheck, movedPieces, isSquareUnderAttackFn } = context
  
  const kingKey = `${fromRow}-${fromCol}`
  if (movedPieces.has(kingKey)) return false
  if (isSquareUnderAttackFn(fromRow, fromCol, color, boardToCheck)) return false
  
  const isKingside = colDiff > 0
  const rookCol = isKingside ? 7 : 0
  const rookKey = `${fromRow}-${rookCol}`
  const rook = boardToCheck[fromRow][rookCol]
  
  if (!rook?.endsWith('-T') || movedPieces.has(rookKey)) return false
  
  // Check path is clear
  for (let c = Math.min(fromCol, rookCol) + 1; c < Math.max(fromCol, rookCol); c++) {
    if (!isEmpty(fromRow, c, boardToCheck)) return false
  }
  
  // Check king's path is not under attack
  const direction = isKingside ? 1 : -1
  const passCol = fromCol + direction
  const endCol = isKingside ? 6 : 2
  
  if (isSquareUnderAttackFn(fromRow, passCol, color, boardToCheck)) return false
  if (isSquareUnderAttackFn(fromRow, endCol, color, boardToCheck)) return false
  
  return true
}

// Helper function to validate king moves
const isLegalKingMove = (rowDiff, colDiff, fromRow, fromCol, color, boardToCheck, context) => {
  const { movedPieces, isSquareUnderAttackFn, allowSameColor } = context
  
  // Normal king move
  if (Math.abs(rowDiff) <= 1 && Math.abs(colDiff) <= 1) {
    return true
  }
  
  // Castling
  if (!allowSameColor && rowDiff === 0 && Math.abs(colDiff) === 2) {
    return canCastle({ fromRow, fromCol, colDiff, color, boardToCheck, movedPieces, isSquareUnderAttackFn })
  }
  
  return false
}

// Validate legal moves for each piece type
export const isLegalMove = (piece, fromRow, fromCol, toRow, toCol, boardToCheck, context = {}) => {
  if (fromRow === toRow && fromCol === toCol) return false
  
  const { allowSameColor = false } = context
  const color = piece.split('-')[0]
  const pieceType = piece.split('-')[1]
  const rowDiff = toRow - fromRow
  const colDiff = toCol - fromCol
  
  // Check if destination has same color piece
  if (!allowSameColor && boardToCheck[toRow][toCol]?.startsWith(color)) {
    return false
  }

  switch (pieceType) {
    case 'p': // Pawn
      return isLegalPawnMove(color, { rowDiff, colDiff, fromRow, toRow, toCol }, boardToCheck, allowSameColor)

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
      return isLegalKingMove(rowDiff, colDiff, fromRow, fromCol, color, boardToCheck, context)

    default:
      return false
  }
}

// Check if a square is under attack by opponent
export const isSquareUnderAttack = (row, col, color, boardToCheck, movedPieces, isLegalMoveFn) => {
  const opponentColor = getOpponentColor(color)
  let isAttacked = false
  forEachBoardSquare((r, c) => {
    const piece = boardToCheck[r][c]
    if (piece?.startsWith(opponentColor)) {
      if (isLegalMoveFn(piece, r, c, row, col, boardToCheck, { movedPieces, allowSameColor: false })) {
        isAttacked = true
        return false // Stop iteration
      }
    }
  })
  return isAttacked
}

// Check if a king is in check
export const isKingInCheck = (color, boardToCheck, movedPieces, isSquareUnderAttackFn) => {
  const kingPos = findKingPosition(color, boardToCheck)
  if (!kingPos) return false
  return isSquareUnderAttackFn(kingPos.row, kingPos.col, color, boardToCheck)
}

// Helper to simulate a move on a test board
const simulateMove = (piece, fromRow, fromCol, toRow, toCol, boardToCheck) => {
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
  
  return testBoard
}

// Helper to check if a move is valid and doesn't leave king in check
const isValidMoveForPiece = (piece, options) => {
  const { fromRow, fromCol, toRow, toCol, boardToCheck, movedPieces, color, isLegalMoveFn, isKingInCheckFn } = options
  if (!isLegalMoveFn(piece, fromRow, fromCol, toRow, toCol, boardToCheck, { movedPieces, allowSameColor: false })) {
    return false
  }
  
  const testBoard = simulateMove(piece, fromRow, fromCol, toRow, toCol, boardToCheck)
  return !isKingInCheckFn(color, testBoard)
}

// Helper to check if a piece has any legal moves
const pieceHasLegalMoves = (piece, fromRow, fromCol, options) => {
  const { color, boardToCheck, movedPieces, isLegalMoveFn, isKingInCheckFn } = options
  for (let toRow = 0; toRow < 8; toRow++) {
    for (let toCol = 0; toCol < 8; toCol++) {
      if (isValidMoveForPiece(piece, { fromRow, fromCol, toRow, toCol, boardToCheck, movedPieces, color, isLegalMoveFn, isKingInCheckFn })) {
        return true
      }
    }
  }
  return false
}

// Check if a player has any legal moves
export const hasLegalMoves = (color, boardToCheck, movedPieces, isLegalMoveFn, isKingInCheckFn) => {
  for (let fromRow = 0; fromRow < 8; fromRow++) {
    for (let fromCol = 0; fromCol < 8; fromCol++) {
      const piece = boardToCheck[fromRow][fromCol]
      if (piece?.startsWith(color)) {
        if (pieceHasLegalMoves(piece, fromRow, fromCol, { color, boardToCheck, movedPieces, isLegalMoveFn, isKingInCheckFn })) {
          return true
        }
      }
    }
  }
  return false // No legal moves found
}

// Check for checkmate
export const isCheckmate = (color, boardToCheck, movedPieces, isKingInCheckFn, hasLegalMovesFn) => {
  return isKingInCheckFn(color, boardToCheck) && !hasLegalMovesFn(color, boardToCheck)
}

// Calculate all valid moves for a piece
export const getValidMovesForPiece = (piece, fromRow, fromCol, board, isLegalMoveFn, isSquareUnderAttackFn) => {
  const moves = []
  const color = piece.split('-')[0]
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (isLegalMoveFn(piece, fromRow, fromCol, row, col, board, { allowSameColor: false })) {
        const isAttack = board[row][col] !== ''
        
        // Create a test board with the piece moved to check if it would be under attack
        const testBoard = board.map(r => [...r])
        testBoard[row][col] = piece
        testBoard[fromRow][fromCol] = ''
        const wouldBeAttacked = isSquareUnderAttackFn(row, col, color, testBoard)
        
        moves.push({ row, col, isAttack, wouldBeAttacked })
      }
    }
  }
  return moves
}

// Calculate all attacked pieces by the current player
export const calculateAttackedPieces = (boardState, attackingColor, isLegalMoveFn) => {
  const attacked = []
  forEachBoardSquare((fromRow, fromCol) => {
    const piece = boardState[fromRow][fromCol]
    if (piece?.startsWith(attackingColor)) {
      forEachBoardSquare((toRow, toCol) => {
        const targetPiece = boardState[toRow][toCol]
        if (targetPiece && !targetPiece.startsWith(attackingColor)) {
          if (isLegalMoveFn(piece, fromRow, fromCol, toRow, toCol, boardState, { allowSameColor: false })) {
            attacked.push({ row: toRow, col: toCol, attackedBy: attackingColor })
          }
        }
      })
    }
  })
  return attacked
}

// Calculate which pieces defend a specific piece
export const calculateDefenders = (targetRow, targetCol, boardState, isLegalMoveFn) => {
  const targetPiece = boardState[targetRow][targetCol]
  if (!targetPiece) return []
  
  const defenders = []
  const pieceColor = targetPiece.split('-')[0]
  
  forEachBoardSquare((fromRow, fromCol) => {
    const piece = boardState[fromRow][fromCol]
    if (piece?.startsWith(pieceColor) && !(fromRow === targetRow && fromCol === targetCol)) {
      if (isLegalMoveFn(piece, fromRow, fromCol, targetRow, targetCol, boardState, { allowSameColor: true })) {
        defenders.push({ row: fromRow, col: fromCol, color: pieceColor })
      }
    }
  })
  
  return defenders
}

// Calculate protected pieces (defended by same color) with defender count
export const calculateProtectedPieces = (boardState, protectingColor, isLegalMoveFn) => {
  const protectionMap = new Map()
  
  forEachBoardSquare((fromRow, fromCol) => {
    const piece = boardState[fromRow][fromCol]
    if (piece?.startsWith(protectingColor)) {
      forEachBoardSquare((toRow, toCol) => {
        const targetPiece = boardState[toRow][toCol]
        // Check if target is same color and can be defended
        if (targetPiece?.startsWith(protectingColor) && 
            !(fromRow === toRow && fromCol === toCol)) {
          if (isLegalMoveFn(piece, fromRow, fromCol, toRow, toCol, boardState, { allowSameColor: true })) {
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
