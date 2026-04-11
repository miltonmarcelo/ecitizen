import { useEffect, useMemo, useState } from "react";
import { Menu, Plus, X } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/api";
import dublinMap from "@/assets/dublin-map.png";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

const MAP_PINS = [
  { top: "18%", left: "10%", color: "bg-success", label: "Pothole • Resolved" },
  { top: "42%", left: "28%", color: "bg-warning", label: "Street Light • In Progress" },
  { top: "25%", right: "14%", color: "bg-primary", label: "Graffiti • Open" },
  { bottom: "32%", right: "10%", color: "bg-destructive", label: "Dumping • Open" },
  { bottom: "22%", left: "18%", color: "bg-success", label: "Flooding • Resolved" },
];

const STEPS = [
  {
    num: 1,
    title: "Report your issue",
    desc: "Describe the problem, choose a category, and submit it in a structured way.",
  },
  {
    num: 2,
    title: "Staff review and action",
    desc: "Our team picks it up, reviews the details, and gets to work.",
  },
  {
    num: 3,
    title: "Follow the progress of your report",
    desc: "Follow the case status and timeline from submission through to completion.",
  },
];

const ANIM_DELAYS = [0, -1.3, -2.7, -0.6, -3.2];

type PublicStats = {
  totalIssues: number;
  resolutionRate: number;
  averageCloseDays: number;
};

const INITIAL_STATS: PublicStats = {
  totalIssues: 0,
  resolutionRate: 0,
  averageCloseDays: 0,
};

const HomePage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [stats, setStats] = useState<PublicStats>(INITIAL_STATS);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchPublicStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/issues/public-stats/summary`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch public stats");
        }

        setStats({
          totalIssues: Number(data.totalIssues || 0),
          resolutionRate: Number(data.resolutionRate || 0),
          averageCloseDays: Number(data.averageCloseDays || 0),
        });
      } catch (error) {
        console.error("Failed to load homepage stats:", error);
      }
    };

    fetchPublicStats();
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 360px)");
    const closeMenu = () => setMobileMenuOpen(false);

    if (media.matches) closeMenu();

    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) closeMenu();
    };

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  const goTo = (path: string, closeMenu = false) => {
    if (closeMenu) setMobileMenuOpen(false);
    navigate(path);
  };

  const goToReport = () => {
    if (loading) return;
    navigate(user ? "/report" : "/login");
  };

  const formatNumber = (value: number) => new Intl.NumberFormat("en-IE").format(value);
  const formatPercentage = (value: number) => `${Math.round(value)}%`;
  const formatDays = (value: number) => `${Math.round(value)}d`;

  const statCards = useMemo(
    () => [
      { value: formatNumber(stats.totalIssues), label: "Issues Reported" },
      { value: formatPercentage(stats.resolutionRate), label: "Resolution Rate" },
      { value: formatDays(stats.averageCloseDays), label: "Avg. Close Time" },
    ],
    [stats]
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-card/94 backdrop-blur-2xl border-b border-border">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-2 px-4 sm:px-6">
          <button
            onClick={() => goTo("/")}
            className="flex min-w-0 shrink items-center gap-2 sm:gap-3 font-extrabold text-lg text-primary"
          >
            <svg className="w-8 h-8" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="9" fill="hsl(var(--primary))" />
              <path
                d="M18 7C13.03 7 9 11.03 9 16c0 3.76 2.27 7.01 5.56 8.47L18 29l3.44-4.53C24.73 23.01 27 19.76 27 16c0-4.97-4.03-9-9-9z"
                fill="hsl(var(--accent))"
              />
              <circle cx="18" cy="16" r="4" fill="white" />
            </svg>
            <span className="truncate text-base sm:text-lg">eCitizen</span>
          </button>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden min-[360px]:flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => goTo("/login")}
                className="inline-flex min-w-[96px] items-center justify-center rounded-lg border border-primary px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/5 sm:min-w-[110px] sm:px-4"
              >
                Log in
              </button>

              <button
                onClick={() => goTo("/register")}
                className="inline-flex min-w-[108px] items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-xs font-semibold text-accent-foreground transition-opacity hover:opacity-90 sm:min-w-[132px] sm:px-5"
              >
                Register
              </button>
            </div>

            <button
              type="button"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-primary transition-colors hover:bg-muted min-[360px]:hidden"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="min-[360px]:hidden border-t border-border bg-card">
            <div className="mx-auto w-full max-w-[1200px] px-4 py-3">
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => goTo("/login", true)}
                  className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
                >
                  Log in
                </button>

                <button
                  onClick={() => goTo("/register", true)}
                  className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
                >
                  Register
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden bg-card">
          <div className="mx-auto grid w-full max-w-[1200px] items-stretch gap-8 px-6 py-10 md:py-16 min-[860px]:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="order-1 flex flex-col justify-center"
            >
              <h1 className="mb-5 text-[clamp(2.75rem,1.4rem+5vw,5.5rem)] font-extrabold leading-[0.96] text-primary">
                See it.
                <br />
                <span className="text-accent">Report it.</span>
                <br />
                Resolved.
              </h1>

              <p className="text-base text-muted-foreground max-w-[42ch] leading-[1.7] mb-8">
                Report potholes, broken lighting, graffiti and more. Track your cases and help improve your city through one clear platform.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={goToReport}
                  className="inline-flex items-center justify-center gap-2 font-semibold text-sm bg-accent text-accent-foreground rounded-lg px-6 py-3 min-h-[48px] max-w-[260px] w-full hover:opacity-90 active:scale-[0.97] transition-all"
                >
                  <Plus size={17} /> Report New Issue
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="order-2 relative h-[320px] overflow-hidden rounded-[24px] border border-border bg-muted sm:h-[380px] min-[860px]:h-full min-[860px]:min-h-[560px] lg:min-h-[720px]"
            >
              <img src={dublinMap} alt="Dublin city map" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/18 to-transparent" />

              {MAP_PINS.map((pin, i) => (
                <div
                  key={i}
                  className={`absolute items-center gap-1.5 whitespace-nowrap rounded-full bg-card px-3 py-1 text-[11px] font-semibold shadow-md ${
                    i > 1 ? "hidden sm:flex" : "flex"
                  }`}
                  style={{
                    top: pin.top,
                    left: pin.left,
                    right: pin.right,
                    bottom: pin.bottom,
                    animation: "pinFloat 4s ease-in-out infinite",
                    animationDelay: `${ANIM_DELAYS[i]}s`,
                  }}
                >
                  <span className={`h-2 w-2 rounded-full ${pin.color}`} />
                  {pin.label}
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        <div className="bg-primary py-5 md:py-8">
          <div className="mx-auto w-full max-w-[1200px] px-6">
            <div className="grid grid-cols-3 gap-2 text-center">
              {statCards.map((stat) => (
                <div key={stat.label}>
                  <span className="text-[clamp(1.75rem,1.1rem+2.8vw,3rem)] font-extrabold text-primary-foreground leading-none block">
                    {stat.value}
                  </span>
                  <span className="text-[clamp(0.75rem,0.7rem+0.25vw,0.8125rem)] text-primary-foreground/65 mt-1 font-medium tracking-wide block">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <section className="bg-secondary/30 py-12 md:py-20">
          <div className="mx-auto w-full max-w-[1200px] px-6">
            <div className="mb-8 md:mb-12">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-accent mb-3">How It Works</p>
              <h2 className="text-[clamp(1.75rem,1.1rem+2.8vw,3rem)] font-extrabold text-primary leading-[1.1] mb-4">
                From report to resolution,
                <br />
                every step is clear.
              </h2>
              <p className="text-base text-muted-foreground leading-[1.7] max-w-[48ch]">
                You report it. We handle it. You see every step.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {STEPS.map((step, i) => (
                <motion.div
                  key={step.num}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  variants={fadeUp}
                  className={`bg-card rounded-xl border border-border p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] ${
                    step.num === 3 ? "md:col-span-2" : ""
                  }`}
                >
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground font-extrabold text-lg flex items-center justify-center mb-5 shadow-sm">
                    {step.num}
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-20 bg-gradient-to-br from-primary via-[hsl(210,50%,22%)] to-accent text-center">
          <div className="mx-auto w-full max-w-[1200px] px-6">
            <div className="mx-auto max-w-[600px] text-center">
              <h2 className="text-[clamp(1.75rem,1.1rem+2.8vw,3rem)] font-extrabold text-primary-foreground mb-4">
                Ready to make a difference?
              </h2>

              <p className="text-base text-primary-foreground/75 max-w-[42ch] mx-auto mb-8">
                It takes less than a minute to report an issue. Your city is listening.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={goToReport}
                  className="inline-flex items-center justify-center gap-2 font-bold text-sm bg-card text-primary rounded-lg px-6 py-3 min-h-[48px] max-w-[240px] w-full hover:bg-card/90 shadow-lg active:scale-[0.97] transition-all"
                >
                  <Plus size={17} /> Get Started
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-card border-t border-border py-8 pb-[calc(2rem+env(safe-area-inset-bottom,0px))]">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 px-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
          <div className="flex items-center gap-2 font-extrabold text-primary">
            <svg className="w-[26px] h-[26px]" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="9" fill="hsl(var(--primary))" />
              <path
                d="M18 7C13.03 7 9 11.03 9 16c0 3.76 2.27 7.01 5.56 8.47L18 29l3.44-4.53C24.73 23.01 27 19.76 27 16c0-4.97-4.03-9-9-9z"
                fill="hsl(var(--accent))"
              />
              <circle cx="18" cy="16" r="4" fill="white" />
            </svg>
            eCitizen
          </div>

          <nav className="flex gap-5 flex-wrap">
            <button
              onClick={goToReport}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Report New Issue
            </button>
            <button
              onClick={() => goTo("/contact")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact Us
            </button>
          </nav>

          <p className="text-xs text-muted-foreground/50">© 2026 eCitizen • Dublin, Ireland</p>
        </div>
      </footer>

      <style>{`
        @keyframes pinFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
};

export default HomePage;