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
          <div className="feature-card" onClick={() => navigate('/analyze')}>
            <h3>📊 Analyze Games</h3>
            <p>Deep dive into chess games with powerful analysis tools</p>
          </div>
          
          <div className="feature-card">
            <h3>📚 Learn Openings</h3>
            <p>Explore and master various chess openings</p>
          </div>
          
          <div className="feature-card">
            <h3>🎯 Practice Tactics</h3>
            <p>Sharpen your skills with tactical puzzles</p>
          </div>
        </section>

        <button className="cta-button">Get Started</button>
      </main>
    </div>
  )
}

export default HomePage
