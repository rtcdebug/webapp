import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import LogoIcon from './LogoIcon'

function Header() {
  const location = useLocation()
  const pathname = location.pathname.replace(/\/$/, '') || '/'
  const isLanding = pathname === '/'
  const isVisualizer = pathname === '/visualizer'
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 50)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (e, id) => {
    if (isLanding) {
      e.preventDefault()
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header className={`header ${scrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="header-inner">
          <Link to="/" className="logo">
            <div className="logo-icon">
              <LogoIcon size={18} />
            </div>
            RTCDebug
          </Link>
          <nav className="nav-links">
            {isLanding && (
              <>
                <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')}>How It Works</a>
                <a href="#features" onClick={(e) => scrollToSection(e, 'features')}>Features</a>
              </>
            )}
            {!isVisualizer && (
              <>
                <Link to="/visualizer">Visualizer</Link>
                <a href={isLanding ? '#pricing' : '/#pricing'} onClick={(e) => scrollToSection(e, 'pricing')}>Pricing</a>
              </>
            )}
            <a href="https://github.com/rtcdebug" target="_blank" rel="noopener">GitHub</a>
            {isLanding && (
              <a
                href="#cta"
                className="nav-cta"
                onClick={(e) => scrollToSection(e, 'cta')}
              >
                Get Early Access
              </a>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header
