import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import HowItWorks from './pages/HowItWorks'
import CharityDirectory from './pages/CharityDirectory'
import CharityProfile from './pages/CharityProfile'
import Pricing from './pages/Pricing'
import Leaderboard from './pages/Leaderboard'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ScoreEntry from './pages/ScoreEntry'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import WinnerVerification from './pages/WinnerVerification'
import AdminConsole from './pages/AdminConsole'
import Subscription from './pages/Subscription';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/charities" element={<CharityDirectory />} />
        <Route path="/charities/:id" element={<CharityProfile />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/scores" element={<ScoreEntry />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/verify" element={<WinnerVerification />} />
        <Route path="/admin" element={<AdminConsole />} />
        <Route path="/subscription" element={<Subscription />} />
      </Route>
    </Routes>
  )
}

export default App
