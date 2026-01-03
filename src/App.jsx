import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import HomePage from './pages/HomePage'
import AnalyzeGames from './pages/AnalyzeGames'

function App() {
  return (
    <Router basename="/chess-xplorer">
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/analyze" element={<AnalyzeGames />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
