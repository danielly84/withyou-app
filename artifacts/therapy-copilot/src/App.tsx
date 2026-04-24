import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Layout } from "./components/Layout";
import Home from "./pages/Home";
import Insights from "./pages/Insights";
import History from "./pages/History";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const AUTH_PATHS = new Set(["/login", "/signup"]);

function AuthGate() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  // When user becomes authenticated on an auth page, redirect to home
  useEffect(() => {
    if (user && AUTH_PATHS.has(location)) {
      setLocation("/");
    }
  }, [user, location, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/signup" component={Signup} />
        <Route component={Login} />
      </Switch>
    );
  }

  // Still on an auth-only page — redirect is pending via useEffect, show spinner
  if (AUTH_PATHS.has(location)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
      </div>
    );
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/insights" component={Insights} />
        <Route path="/history" component={History} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AuthProvider>
          <AuthGate />
        </AuthProvider>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
