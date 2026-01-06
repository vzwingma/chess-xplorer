/**
 * Controller for importing and exporting chess games
 * Handles file I/O operations for chess game move history and board state
 */

// Constants for player colors
const PLAYER_TURN_WHITE = 'white'
const PLAYER_TURN_BLACK = 'black'
const PLAYER_TURN_CHECKMATE = 'checkmate'

/**
 * Exports the current chess game's move history and board state to a text file.
 * 
 * Creates a downloadable text file containing:
 * - Date and timestamp
 * - Complete move history with move numbers
 * - Final board state using Unicode chess symbols
 * 
 * @param {Array} moveHistory - Array of move objects containing moveNumber, text, color, etc.
 * @param {Array<Array<string>>} board - 8x8 array representing the current board state
 * @returns {void}
 */
export const exportMoveHistory = (moveHistory, board) => {
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

/**
 * Parses move history from file content.
 * 
 * Extracts move lines in the format "moveNumber. moveText" and determines:
 * - Move number (supports decimal notation like 1.5 for black moves)
 * - Player color based on chess piece symbols (⚫ for black)
 * - Checkmate status
 * - Sealed status (all moves except the last one)
 * 
 * @param {string} historySection - The section of file content containing move history
 * @returns {Array<Object>} Array of move objects with moveNumber, text, color, and sealed properties
 * @private
 */
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

/**
 * Parses board state from file content.
 * 
 * Converts Unicode chess symbols from the board representation to internal piece notation.
 * Expects board lines in the format: "8 | ♜ | ♞ | ♝ | ♛ | ♚ | ♝ | ♞ | ♜ | 8"
 * 
 * @param {string} boardSection - The section of file content containing the board state
 * @returns {Array<Array<string>>} 8x8 array with internal piece codes (e.g., 'white-p', 'black-R')
 * @private
 */
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
 * - Calls the provided callback with parsed data for game state updates
 * 
 * @function
 * @param {Function} onImportSuccess - Callback function called with (parsedMoves, newBoard) on successful import
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
 */
export const importMoveHistory = (onImportSuccess) => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.txt'
  
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target.result
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
        
        // Call the success callback with parsed data
        onImportSuccess(parsedMoves, newBoard)
      } catch (error) {
        console.error('Error parsing file:', error)
        alert('Error loading file. Please make sure it is a valid chess game export.')
      }
    }
    
    reader.readAsText(file)
  }
  
  input.click()
}
