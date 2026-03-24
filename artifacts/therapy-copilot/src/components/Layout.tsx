import { Link, useLocation } from "wouter";
import { BookOpen, BarChart2, History } from "lucide-react";
import { ReactNode } from "react";

function ClarityLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="clarityGrad" x1="100" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9BAAD4" />
          <stop offset="100%" stopColor="#6B6FAF" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="24" fill="url(#clarityGrad)" />
      {/* Horizontal bar */}
      <rect x="18" y="44" width="64" height="12" rx="6" fill="white" />
      {/* Vertical bar */}
      <rect x="44" y="18" width="12" height="64" rx="6" fill="white" />
      {/* NW–SE diagonal */}
      <line x1="27" y1="27" x2="73" y2="73" stroke="white" strokeWidth="7" strokeLinecap="round" strokeOpacity="0.75" />
      {/* NE–SW diagonal */}
      <line x1="73" y1="27" x2="27" y2="73" stroke="white" strokeWidth="7" strokeLinecap="round" strokeOpacity="0.75" />
      {/* Dots */}
      <circle cx="50" cy="16" r="4" fill="white" fillOpacity="0.55" />
      <circle cx="70" cy="24" r="3" fill="white" fillOpacity="0.45" />
      <circle cx="79" cy="46" r="2.5" fill="white" fillOpacity="0.4" />
      <circle cx="24" cy="74" r="4" fill="white" fillOpacity="0.5" />
    </svg>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

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
          <Link href="/" className="flex items-center gap-2 group">
            <div className="shadow-md group-hover:shadow-floating transition-all duration-300 rounded-xl">
              <ClarityLogo />
            </div>
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
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12 pb-24 md:pb-12">
        {children}
      </main>
    </div>
  );
}
