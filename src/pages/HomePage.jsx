import { useNavigate } from 'react-router-dom'
import './HomePage.css'

function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="home-page">
      <header className="header">
        <h1>♟️ Chess Xplorer</h1>
        <p className="tagline">Explore the world of Chess</p>
      </header>
      
      <main className="main-content">
        <section className="welcome-section">
          <h2>Welcome to Chess Xplorer!</h2>
          <p>Your journey into chess analysis and exploration begins here.</p>
        </section>

        <section className="features">
          <button 
            className="feature-card" 
            onClick={() => navigate('/analyze')}
          >
            <h3>📊 Analyze Game</h3>
            <p>Deep dive into a chess game with powerful viewer and analysis tools</p>
          </button>          
        </section>

        <button className="cta-button" onClick={() => navigate('/analyze')}>Get Started</button>
      </main>
    </div>
  )
}

export default HomePage
