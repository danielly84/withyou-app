import { Link, useLocation } from "wouter";
import { BookOpen, BarChart2, History, LogOut } from "lucide-react";
import { type ReactNode } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import withyouLogo from "@assets/withyou-logo_1_(1)_1774397490571.png";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const displayName = user?.preferredName || user?.name?.split(" ")[0] || "You";

  const handleLogout = async () => {
    await logout();
    queryClient.clear();
  };

  const navItems = [
    { href: "/", label: "Journal", icon: BookOpen },
    { href: "/insights", label: "Insights", icon: BarChart2 },
    { href: "/history", label: "History", icon: History },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Navbar */}
      <header className="sticky top-0 z-50 glass-panel border-b-0 border-white/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src={withyouLogo}
              alt="WithYou logo"
              className="w-8 h-8 object-contain group-hover:opacity-90 transition-opacity duration-200"
            />
            <span className="font-display font-semibold text-lg text-foreground tracking-wide">
              WithYou
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                    isActive
                      ? "bg-white text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User + logout — desktop */}
          <div className="hidden md:flex items-center gap-3">
            <span className="text-sm text-muted-foreground/70">
              Hi, {displayName}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground/60 hover:text-foreground border border-border/50 hover:border-border rounded-full px-3 py-1.5 transition-all duration-150"
            >
              <LogOut className="w-3 h-3" />
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-white/50 pb-safe">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div className={`p-1 rounded-lg mb-1 ${isActive ? "bg-primary/10" : ""}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          {/* Logout for mobile */}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center p-2 rounded-xl text-muted-foreground transition-all"
          >
            <div className="p-1 rounded-lg mb-1">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium">Log out</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12 pb-24 md:pb-12">
        {children}
      </main>
    </div>
  );
}
