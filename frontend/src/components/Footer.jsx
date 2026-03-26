import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer" id="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <span className="logo-icon">⛳</span>
              <span>GolfGives</span>
            </Link>
            <p>Where every round makes a difference. Subscribe, play, win — and support the causes you care about.</p>
          </div>

          <div className="footer-col">
            <h4>Platform</h4>
            <ul>
              <li><Link to="/how-it-works">How It Works</Link></li>
              <li><Link to="/charities">Charities</Link></li>
              <li><Link to="/signup">Subscribe</Link></li>
              <li><Link to="/scores">Score Entry</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Account</h4>
            <ul>
              <li><Link to="/login">Log In</Link></li>
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/verify">Verification</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Connect</h4>
            <ul>
              <li><a href="mailto:hello@golfgives.com">hello@golfgives.com</a></li>
              <li><a href="#">Twitter / X</a></li>
              <li><a href="#">Instagram</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} GolfGives. All rights reserved.</p>
          <div className="footer-bottom-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
