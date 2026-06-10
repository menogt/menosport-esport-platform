import { createBrowserRouter } from 'react-router';
import { RootLayout } from './layouts/RootLayout';
import { HomePage } from './pages/HomePage';
import { TournamentsPage } from './pages/TournamentsPage';
import { TournamentDetailPage } from './pages/TournamentDetailPage';
import { BracketPage } from './pages/BracketPage';
import { PlayerDashboard } from './pages/PlayerDashboard';
import { TeamDashboard } from './pages/TeamDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { TeamsPage } from './pages/TeamsPage';
import { TeamProfilePage } from './pages/TeamProfilePage';
import { CreateTeamPage } from './pages/CreateTeamPage';
import { CreateTournamentPage } from './pages/CreateTournamentPage';
import { MatchDetailPage } from './pages/MatchDetailPage';
import { GamesPage } from './pages/GamesPage';
import { GameHubPage } from './pages/GameHubPage';
import { MediaPage } from './pages/MediaPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { LiveCenterPage } from './pages/LiveCenterPage';
import { CommunityPage } from './pages/CommunityPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { SponsorsPage } from './pages/SponsorsPage';
import { StorePage } from './pages/StorePage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      // Tournaments
      { path: 'tournaments', Component: TournamentsPage },
      { path: 'tournaments/create', Component: CreateTournamentPage },
      { path: 'tournaments/:id', Component: TournamentDetailPage },
      // Brackets
      { path: 'brackets/:id', Component: BracketPage },
      // Matches
      { path: 'matches/:id', Component: MatchDetailPage },
      // Teams
      { path: 'teams', Component: TeamsPage },
      { path: 'teams/create', Component: CreateTeamPage },
      { path: 'teams/:id', Component: TeamProfilePage },
      // Dashboards
      { path: 'dashboard/player', Component: PlayerDashboard },
      { path: 'dashboard/team', Component: TeamDashboard },
      { path: 'dashboard/admin', Component: AdminDashboard },
      // Auth
      { path: 'login', Component: LoginPage },
      { path: 'register', Component: RegisterPage },
      // Phase 3
      { path: 'games', Component: GamesPage },
      { path: 'games/:slug', Component: GameHubPage },
      { path: 'media', Component: MediaPage },
      { path: 'notifications', Component: NotificationsPage },
      { path: 'live', Component: LiveCenterPage },
      { path: 'community', Component: CommunityPage },
      { path: 'integrations', Component: IntegrationsPage },
      { path: 'sponsors', Component: SponsorsPage },
      { path: 'store', Component: StorePage },
    ],
  },
]);
