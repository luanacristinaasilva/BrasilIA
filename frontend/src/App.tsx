import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import Footer from './components/layout/Footer'
import Home from './pages/Home'
import Contributions from './pages/Contributions'
import Profile from './pages/Profile'
import Matchmaking from './pages/Matchmaking'
import Scheduling from './pages/Scheduling'

import { CURRENT_USER_ID } from './constants'
export { CURRENT_USER_ID }

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6 max-w-6xl mx-auto w-full animate-fade-in">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/contributions" element={<Contributions />} />
              <Route path="/profile/:id" element={<Profile />} />
              <Route path="/profile" element={<Navigate to={`/profile/${CURRENT_USER_ID}`} replace />} />
              <Route path="/matchmaking" element={<Matchmaking />} />
              <Route path="/scheduling" element={<Scheduling />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
