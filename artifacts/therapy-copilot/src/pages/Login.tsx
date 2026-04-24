import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import withyouLogo from "@assets/withyou-logo_1_(1)_1774397490571.png";

export default function Login() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsPending(true);
    try {
      await login(email.trim(), password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <img src={withyouLogo} alt="WithYou" className="w-8 h-8 object-contain" />
          <span className="font-display font-semibold text-lg text-foreground tracking-wide">
            WithYou
          </span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-soft border border-white/60 p-8">
          <h1 className="text-2xl font-display font-medium text-foreground mb-1">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Pick up where you left off and let WithYou support you with the context it already knows.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl bg-background border border-border/60 text-sm focus:outline-none focus:ring-[3px] focus:ring-primary/10 focus:border-primary/25 transition-shadow placeholder:text-muted-foreground/30"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-background border border-border/60 text-sm focus:outline-none focus:ring-[3px] focus:ring-primary/10 focus:border-primary/25 transition-shadow placeholder:text-muted-foreground/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-crisis/80 bg-crisis/5 border border-crisis/15 rounded-xl px-3.5 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm tracking-[-0.01em] hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              {isPending ? "Logging in…" : "Log in"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Don't have an account?{" "}
          <button
            onClick={() => setLocation("/signup")}
            className="text-primary font-medium hover:underline"
          >
            Create one
          </button>
        </p>

        <p className="text-center text-[11px] text-muted-foreground/40 mt-5 max-w-xs mx-auto leading-relaxed">
          WithYou is here to support reflection and emotional awareness. It isn't a medical,
          therapy, or crisis service.
        </p>
      </motion.div>
    </div>
  );
}
