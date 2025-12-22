import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <p className="footer-tagline">
            Built by RTCDebug — Stop guessing why calls fail
          </p>
          <div className="footer-links">
            <Link to="/">Home</Link>
            <Link to="/visualizer">Visualizer</Link>
            <a href="https://github.com/rtcdebug" target="_blank" rel="noopener">GitHub</a>
          </div>
          <p className="footer-copyright">© {new Date().getFullYear()} RTCDebug</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
