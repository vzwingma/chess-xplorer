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
  const [moveHistory, setMoveHistory] = useState([])
  const [movedPieces, setMovedPieces] = useState(new Set()) // Track pieces that have moved
  const [kingInCheck, setKingInCheck] = useState(null) // Track which king is in check ('white' or 'black' or null)

  // Convert piece code to readable name
  const getPieceName = (pieceCode) => {
    const pieceType = pieceCode.split('-')[1]
    const pieceNames = {
      'p': 'Pawn',
      'T': 'Rook',
      'C': 'Knight',
      'F': 'Bishop',
      'Q': 'Queen',
      'R': 'King'
    }
    return pieceNames[pieceType] || ''
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
          if (!rook || !rook.endsWith('-T') || movedPieces.has(rookKey)) return false
          
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
        if (piece && piece.startsWith(opponentColor)) {
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
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (isLegalMove(piece, fromRow, fromCol, row, col)) {
          const isAttack = board[row][col] !== ''
          moves.push({ row, col, isAttack })
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
      
      // Check if the opponent king is in check
      if (isKingInCheck(newTurn, newBoard)) {
        setKingInCheck(newTurn)
      } else {
        setKingInCheck(null)
      }
      
      // Add move to history
      const moveNumber = Math.floor(moveHistory.length / 2) + 1
      const color = currentTurn === 'white' ? '⚪' : '⚫'
      const pieceName = getPieceName(piece)
      const from = toChessNotation(fromRow, fromCol)
      const to = toChessNotation(toRow, toCol)
      const capture = capturedPiece ? ' x ' : ' → '
      const moveText = `${color} ${pieceName} ${from}${capture}${to}`
      setMoveHistory([...moveHistory, { moveNumber, text: moveText, color: currentTurn }])
      
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
      
      // Check if the opponent king is in check
      if (isKingInCheck(newTurn, newBoard)) {
        setKingInCheck(newTurn)
      } else {
        setKingInCheck(null)
      }
      
      // Add move to history
      const pieceName = getPieceName(draggedPiece)
      const fromNotation = toChessNotation(fromRow, fromCol)
      const toNotation = toChessNotation(toRow, toCol)
      const moveSymbol = capturedPiece ? 'x' : '→'
      const colorSymbol = currentTurn === 'white' ? '⚪' : '⚫'
      const moveText = `${colorSymbol} ${pieceName} ${fromNotation} ${moveSymbol} ${toNotation}`
      const newMove = {
        moveNumber: moveHistory.length + 1,
        text: moveText,
        color: currentTurn
      }
      setMoveHistory([...moveHistory, newMove])
      
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

  const resetBoard = () => {
    setBoard(initialBoardState)
    setCurrentTurn('white')
    setSelectedSquare(null)
    setValidMoves([])
    setAttackedPieces([])
    setProtectedPieces([])
    setMoveHistory([])
    setMovedPieces(new Set())
    setKingInCheck(null)
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
            {currentTurn === 'white' ? '⚪ White to move' : '⚫ Black to move'}
          </div>
          <div className="chess-board" style={{ backgroundImage: `url(${plateauImage})` }}>
            {board.map((row, rowIndex) => (
              row.map((piece, colIndex) => {
                const isLight = (rowIndex + colIndex) % 2 === 0
                const isSelected = selectedSquare && selectedSquare.row === rowIndex && selectedSquare.col === colIndex
                const validMove = validMoves.find(m => m.row === rowIndex && m.col === colIndex)
                const isValidMove = validMove && !validMove.isAttack
                const isValidAttack = validMove?.isAttack
                const attackInfo = attackedPieces.find(ap => ap.row === rowIndex && ap.col === colIndex)
                const isUnderAttack = !!attackInfo
                const attackedBy = attackInfo ? attackInfo.attackedBy : ''
                const protectedInfo = protectedPieces.find(pp => pp.row === rowIndex && pp.col === colIndex)
                const isProtected = !!protectedInfo
                const defenderCount = protectedInfo ? protectedInfo.defenders : 0
                const protectionColor = protectedInfo ? protectedInfo.color : ''
                const isKingInCheckSquare = kingInCheck && piece === `${kingInCheck}-R`
                // Don't show under-attack styling if king is in check (show in-check styling instead)
                const showUnderAttack = isUnderAttack && !isKingInCheckSquare
                
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`chess-square ${isLight ? 'light' : 'dark'} ${
                      isSelected ? 'selected' : ''
                    } ${
                      isValidMove ? 'valid-move' : ''
                    } ${
                      isValidAttack ? 'valid-attack' : ''
                    } ${
                      showUnderAttack ? `under-attack under-attack-${attackedBy}` : ''
                    } ${
                      isProtected ? `protected protected-${protectionColor}-${Math.min(defenderCount, 4)}` : ''
                    } ${
                      isKingInCheckSquare ? 'in-check' : ''
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
            <button className="tool-btn">Start Analysis</button>
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
          {moveHistory.length === 0 ? (
            <p className="placeholder">No moves yet</p>
          ) : (
            <div className="moves-container">
              {moveHistory.map((move, index) => (
                <div key={index} className="move-item">
                  <span className="move-number">{move.moveNumber}.</span>
                  <span className="move-text">{move.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default AnalyzeGames
