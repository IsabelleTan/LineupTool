import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import PlayersPage from './pages/PlayersPage'
import GamesPage from './pages/GamesPage'

function Nav() {
  return (
    <nav className="border-b px-6 py-3 flex gap-6 items-center">
      <span className="font-semibold text-lg mr-4">Lineup Tool</span>
      <NavLink
        to="/players"
        className={({ isActive }) =>
          isActive ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'
        }
      >
        Players
      </NavLink>
      <NavLink
        to="/games"
        className={({ isActive }) =>
          isActive ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'
        }
      >
        Games
      </NavLink>
    </nav>
  )
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 p-6">
        <Routes>
          <Route path="/" element={<Navigate to="/players" replace />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/games" element={<GamesPage />} />
        </Routes>
      </main>
    </div>
  )
}
