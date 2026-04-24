import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, Shield } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import withyouLogo from "@assets/withyou-logo_1_(1)_1774397490571.png";

const ANON_USER_ID_KEY = "clarity_user_id";

export default function Signup() {
  const { signup } = useAuth();
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsPending(true);
    try {
      const anonymousUserId = localStorage.getItem(ANON_USER_ID_KEY) ?? undefined;

      await signup({
        name: name.trim(),
        email: email.trim(),
        password,
        preferredName: preferredName.trim() || undefined,
        anonymousUserId,
      });

      // Clean up anonymous ID after migration
      if (anonymousUserId) {
        localStorage.removeItem(ANON_USER_ID_KEY);
      }
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
          <h1 className="text-2xl font-display font-medium text-foreground mb-1 leading-tight">
            Let WithYou remember what matters
          </h1>
          <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
            Create a private account so WithYou can save your reflections, notice patterns, and
            offer more personal support over time.
          </p>

          {/* Privacy note */}
          <div className="flex gap-2.5 items-start bg-primary/5 border border-primary/10 rounded-xl px-3.5 py-3 mb-5">
            <Shield className="w-3.5 h-3.5 text-primary/60 mt-0.5 shrink-0" />
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              Your reflections are private to your account and help WithYou personalize your
              experience.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Your name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="First name is fine"
                required
                autoComplete="given-name"
                className="w-full px-4 py-3 rounded-xl bg-background border border-border/60 text-sm focus:outline-none focus:ring-[3px] focus:ring-primary/10 focus:border-primary/25 transition-shadow placeholder:text-muted-foreground/30"
              />
            </div>

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
                  placeholder="At least 8 characters"
                  required
                  autoComplete="new-password"
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

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                What should WithYou call you?{" "}
                <span className="text-muted-foreground/50 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
                placeholder="A nickname is fine"
                autoComplete="nickname"
                className="w-full px-4 py-3 rounded-xl bg-background border border-border/60 text-sm focus:outline-none focus:ring-[3px] focus:ring-primary/10 focus:border-primary/25 transition-shadow placeholder:text-muted-foreground/30"
              />
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
              {isPending ? "Creating your account…" : "Create my account"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Already have an account?{" "}
          <button
            onClick={() => setLocation("/login")}
            className="text-primary font-medium hover:underline"
          >
            Log in
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
