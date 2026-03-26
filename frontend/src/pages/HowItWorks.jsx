import './HowItWorks.css'
import { Link } from 'react-router-dom'

const steps = [
  {
    num: '01',
    icon: '📝',
    title: 'Choose Your Plan',
    desc: 'Select from Birdie, Eagle, or Albatross tiers. Each includes charity allocation, score tracking, and access to seasonal prize pools.',
    detail: 'A portion of every subscription goes directly to your chosen charities.',
  },
  {
    num: '02',
    icon: '🎯',
    title: 'Pick Your Charities',
    desc: 'Browse our curated directory of 340+ verified non-profits. Choose the causes that matter most to you.',
    detail: 'You can change your charity selections at any time during the season.',
  },
  {
    num: '03',
    icon: '⛳',
    title: 'Play Your Rounds',
    desc: 'Hit the course at any of our partner locations nationwide. No restrictions on when or how often you play.',
    detail: 'The more rounds you play, the more impact your subscription creates.',
  },
  {
    num: '04',
    icon: '📊',
    title: 'Submit Scores',
    desc: 'Enter your verified scorecard through our app. Scores are validated against course records and handicap data.',
    detail: 'Our verification system ensures fair competition for all golfers.',
  },
  {
    num: '05',
    icon: '🏆',
    title: 'Climb the Leaderboard',
    desc: 'Compete against fellow golfers in seasonal standings. Track your progress and see how you rank in real time.',
    detail: 'Leaderboards are divided by handicap tiers for equitable competition.',
  },
  {
    num: '06',
    icon: '🎁',
    title: 'Win & Give Back',
    desc: 'Top performers win exclusive prizes — equipment, resort stays, and once-in-a-lifetime experiences.',
    detail: 'Every winner also triggers a bonus donation to their chosen charities.',
  },
]

const faqs = [
  { q: 'How are scores verified?', a: 'We use a multi-layered verification system including course API integration, peer attestation, and random audits.' },
  { q: 'Can I change my charity mid-season?', a: 'Yes! You can update your charity selections anytime from your dashboard.' },
  { q: 'What courses are eligible?', a: 'Any USGA-rated course is eligible. Our network includes 10,000+ courses.' },
  { q: 'How are prizes awarded?', a: 'Prizes are awarded at the end of each season based on leaderboard standings, adjusted for handicap tier.' },
  { q: 'Is there a handicap requirement?', a: 'No! Golfers of all skill levels are welcome. Our tiered system ensures fair competition.' },
]

export default function HowItWorks() {
  return (
    <div className="how-page">
      <section className="section page-header">
        <div className="container text-center">
          <span className="badge badge-copper">The Process</span>
          <h1 style={{ marginTop: 'var(--space-4)' }}>How GolfGives Works</h1>
          <p style={{ maxWidth: '600px', margin: 'var(--space-4) auto 0' }}>
            From signup to impact — here's how every round creates change
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="timeline">
            {steps.map((step, i) => (
              <div className={`timeline-item ${i % 2 === 0 ? 'left' : 'right'}`} key={step.num}>
                <div className="timeline-dot">{step.num}</div>
                <div className="card timeline-card">
                  <span className="step-icon-lg">{step.icon}</span>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                  <p className="timeline-detail">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section faq-section" id="faq-section">
        <div className="container" style={{ maxWidth: '800px' }}>
          <div className="text-center" style={{ marginBottom: 'var(--space-10)' }}>
            <span className="badge badge-forest">Questions?</span>
            <h2 style={{ marginTop: 'var(--space-3)' }}>Frequently Asked</h2>
          </div>
          <div className="faq-list">
            {faqs.map(faq => (
              <details className="faq-item card" key={faq.q}>
                <summary>{faq.q}</summary>
                <p>{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section text-center">
        <div className="container">
          <h2>Ready to Start?</h2>
          <p style={{ maxWidth: '400px', margin: 'var(--space-3) auto 0' }}>
            Join the community and make your rounds matter.
          </p>
          <Link to="/signup" className="btn btn-copper btn-lg" style={{ marginTop: 'var(--space-6)' }}>
            Subscribe Now
          </Link>
        </div>
      </section>
    </div>
  )
}
