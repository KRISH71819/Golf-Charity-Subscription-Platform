import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './CharityProfile.css'

// Expanded to include all 9 charities from your directory
const charityData = {
  1: { id: 1, name: 'First Tee', category: 'Youth Development', raised: 340000, icon: '🌱', color: '#4A8B4A', mission: 'First Tee creates experiences that build character, instill life-enhancing values and promote healthy choices through the game of golf.', founded: '1997', impact: '10M+ young people served', website: 'firsttee.org' },
  2: { id: 2, name: 'Folds of Honor', category: 'Military Families', raised: 520000, icon: '🇺🇸', color: '#4A7B8B', mission: 'Providing educational scholarships to spouses and children of America\'s fallen and disabled service members.', founded: '2007', impact: '44,000+ scholarships awarded', website: 'foldsofhonor.org' },
  3: { id: 3, name: 'PGA REACH', category: 'Community Outreach', raised: 280000, icon: '⛳', color: '#D4A030', mission: 'The charitable foundation of the PGA of America, empowering youth and military to thrive through golf.', founded: '2014', impact: '100+ community programs', website: 'pgareach.org' },
  4: { id: 4, name: 'Special Olympics Golf', category: 'Adaptive Sports', raised: 190000, icon: '🏅', color: '#8B4A4A', mission: 'Providing year-round sports training and athletic competition for children and adults with intellectual disabilities.', founded: '1968', impact: '5M+ athletes globally', website: 'specialolympics.org' },
  5: { id: 5, name: 'St. Jude Children\'s', category: 'Healthcare', raised: 410000, icon: '❤️', color: '#B23A3A', mission: 'Leading the way the world understands, treats and defeats childhood cancer and other life-threatening diseases.', founded: '1962', impact: '80% survival rate achieved', website: 'stjude.org' },
  6: { id: 6, name: 'Golf Course Superintendents Environmental', category: 'Environment', raised: 150000, icon: '🌿', color: '#3A8B55', mission: 'Advancing environmentally sound golf course management through research and education.', founded: '1955', impact: '10,000+ courses improved', website: 'gcsaa.org' },
  7: { id: 7, name: 'Veterans Golf Association', category: 'Military Families', raised: 230000, icon: '🎖️', color: '#2C3E50', mission: 'Dedicated to promoting the game of golf to veterans and their family members to enhance their physical and mental well-being.', founded: '2014', impact: '15,000+ veteran members', website: 'vgagolf.org' },
  8: { id: 8, name: 'Youth on Course', category: 'Youth Development', raised: 175000, icon: '👦', color: '#E67E22', mission: 'Providing youth with access to life-changing opportunities through golf with subsidized $5 rounds.', founded: '2006', impact: '2M+ subsidized rounds', website: 'youthoncourse.org' },
  9: { id: 9, name: 'Wounded Warrior Project', category: 'Military Families', raised: 380000, icon: '💪', color: '#5D6D7E', mission: 'Honoring and empowering wounded warriors who incurred a physical or mental injury, illnesses, or wound.', founded: '2003', impact: '200,000+ warriors served', website: 'woundedwarriorproject.org' },
}

const baseSupporters = ['Sarah Mitchell', 'James Chen', 'Maria Rodriguez', 'David Park', 'Emily Watson', 'Michael Chang', 'Jessica Taylor', 'Robert Vance', 'Amanda Cole', 'William Hunt']

export default function CharityProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  // Fallback to charity 1 if a weird ID is entered in the URL
  const charity = charityData[id] || charityData

  // Smart redirect for the donation button
  const handleSupportClick = () => {
    if (user) {
      navigate('/subscription')
    } else {
      navigate('/signup?redirect=/subscription')
    }
  }

  // --- Dynamic Data Generators ---
  const scaleFactor = charity.raised / 340000;
  const dynamicDonationHistory = [
    { month: 'January', amount: 12400 * scaleFactor },
    { month: 'February', amount: 14200 * scaleFactor },
    { month: 'March', amount: 11800 * scaleFactor },
    { month: 'April', amount: 16500 * scaleFactor },
    { month: 'May', amount: 18300 * scaleFactor },
    { month: 'June', amount: 15700 * scaleFactor },
  ]
  const maxDonation = Math.max(...dynamicDonationHistory.map(d => d.amount))

  const startIndex = (charity.id * 3) % baseSupporters.length
  const topSupporters = [...baseSupporters.slice(startIndex), ...baseSupporters.slice(0, startIndex)].slice(0, 5)

  return (
    <div className="charity-profile-page">
      <section className="charity-hero" style={{ background: `linear-gradient(160deg, ${charity.color}15, ${charity.color}05)` }}>
        <div className="container">
          <Link to="/charities" className="back-link">← Back to Charities</Link>
          <div className="charity-hero-content">
            <div className="charity-hero-icon" style={{ background: `${charity.color}15` }}>
              <span>{charity.icon}</span>
            </div>
            <div>
              <span className="badge badge-forest">{charity.category}</span>
              <h1 style={{ marginTop: 'var(--space-2)' }}>{charity.name}</h1>
              <p className="charity-hero-mission">{charity.mission}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="charity-profile-grid">
            <div className="charity-stats-col">
              <div className="card-solid">
                <h3>Impact Summary</h3>
                <div className="charity-stat-list">
                  <div className="charity-stat-item">
                    <span className="charity-stat-label">Total Raised</span>
                    <span className="charity-stat-value">${charity.raised.toLocaleString()}</span>
                  </div>
                  <div className="charity-stat-item">
                    <span className="charity-stat-label">Founded</span>
                    <span className="charity-stat-value">{charity.founded}</span>
                  </div>
                  <div className="charity-stat-item">
                    <span className="charity-stat-label">Impact</span>
                    <span className="charity-stat-value">{charity.impact}</span>
                  </div>
                  <div className="charity-stat-item">
                    <span className="charity-stat-label">Active Supporters</span>
                    <span className="charity-stat-value">{(charity.raised / 275).toFixed(0).toLocaleString()}</span>
                  </div>
                </div>
                <button onClick={handleSupportClick} className="btn btn-copper" style={{ width: '100%', marginTop: 'var(--space-4)' }}>
                  Support This Charity
                </button>
              </div>
            </div>

            <div className="charity-main-col">
              <div className="card-solid">
                <h3>Monthly Donations (2025)</h3>
                <div className="donation-chart">
                  {dynamicDonationHistory.map(d => (
                    <div className="donation-bar-wrap" key={d.month}>
                      <div
                        className="donation-bar"
                        style={{ height: `${(d.amount / maxDonation) * 100}%`, background: charity.color }}
                      ></div>
                      <span className="donation-month">{d.month.slice(0, 3)}</span>
                      <span className="donation-amount">${d.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-solid" style={{ marginTop: 'var(--space-6)' }}>
                <h3>Top Supporters</h3>
                <div className="supporters-list">
                  {topSupporters.map((name, i) => {
                    // FIX: Using charAt(0) so brackets don't get swallowed!
                    const initials = name.split(' ').map(word => word.charAt(0)).join('');
                    
                    return (
                      <div className="supporter-item" key={name}>
                        <div className="supporter-avatar" style={{ background: `hsl(${(i * 60 + charity.id * 20) % 360}, 40%, 85%)` }}>
                          {initials}
                        </div>
                        <div>
                          <strong>{name}</strong>
                          <span className="supporter-rounds">{24 - i * 2 + (charity.id % 3)} rounds this season</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}