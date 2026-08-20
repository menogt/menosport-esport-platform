import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import NotFound from "@/pages/NotFound";
import BracketPage from "@/pages/BracketPage";
import ClanDashboard from "@/pages/ClanDashboard";
import Home from "@/pages/Home";
import MatchRoomPage from "@/pages/MatchRoomPage";
import PlayerDashboard from "@/pages/PlayerDashboard";
import ProfilePage from "@/pages/ProfilePage";
import TeamDashboard from "@/pages/TeamDashboard";
import TournamentCreatePage from "@/pages/TournamentCreatePage";
import AdminDisputesPage from "@/pages/AdminDisputesPage";
import LoginPage from "@/pages/LoginPage";
import Phase3Page from "@/pages/Phase3Page";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={LoginPage} />
      <Route path="/tournaments/live" component={Phase3Page} />
      <Route path="/games" component={Phase3Page} />
      <Route path="/clans" component={Phase3Page} />
      <Route path="/media" component={Phase3Page} />
      <Route path="/arena" component={Phase3Page} />
      <Route path="/dashboard/player" component={PlayerDashboard} />
      <Route path="/dashboard/team" component={TeamDashboard} />
      <Route path="/dashboard/clan" component={ClanDashboard} />
      <Route path="/tournaments/new" component={TournamentCreatePage} />
      <Route path="/admin/disputes" component={AdminDisputesPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/matches/:id" component={MatchRoomPage} />
      <Route path="/brackets/:id" component={BracketPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <SmoothScrollProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </SmoothScrollProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
