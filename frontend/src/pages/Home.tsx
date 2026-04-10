import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
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

const MINI_ISSUES = [
  { status: "In Progress", statusClass: "bg-warning/15 text-warning", title: "Pothole on Pembroke Rd", votes: 12 },
  { status: "Open", statusClass: "bg-primary/15 text-primary", title: "Broken light • Merrion Sq", votes: 8 },
  { status: "Resolved", statusClass: "bg-success/15 text-success", title: "Graffiti • Leeson St", votes: 5 },
];

const MAP_MINI_PINS = [
  { top: "19%", left: "14%", color: "bg-warning", label: "Lighting" },
  { top: "44%", left: "44%", color: "bg-success", label: "Pothole ✓" },
  { top: "27%", right: "13%", color: "bg-primary", label: "Graffiti" },
  { bottom: "28%", left: "22%", color: "bg-destructive", label: "Dumping" },
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
    title: "Follow your report's progress",
    desc: "Follow the case status and timeline from submission through to completion.",
  },
];

const ANIM_DELAYS = [0, -1.3, -2.7, -0.6, -3.2];

const HomePage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [stats, setStats] = useState({
    totalIssues: 0,
    resolutionRate: 0,
    averageCloseDays: 0,
  });

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

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-IE").format(value);
  };

  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`;
  };

  const formatDays = (value: number) => {
    return `${value.toFixed(1)}d`;
  };

  const handleReportClick = () => {
    if (loading) return;
    navigate(user ? "/report" : "/login");
  };

  const handleBrowseClick = () => {
    if (loading) return;
    navigate(user ? "/area-issues" : "/login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-card/94 backdrop-blur-2xl border-b border-border">
        <div className="max-w-[480px] md:max-w-[900px] lg:max-w-[1100px] mx-auto flex items-center gap-3 px-5 md:px-8 lg:px-10 py-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 font-extrabold text-lg text-primary shrink-0"
          >
            <svg className="w-8 h-8" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="9" fill="hsl(var(--primary))" />
              <path
                d="M18 7C13.03 7 9 11.03 9 16c0 3.76 2.27 7.01 5.56 8.47L18 29l3.44-4.53C24.73 23.01 27 19.76 27 16c0-4.97-4.03-9-9-9z"
                fill="hsl(var(--accent))"
              />
              <circle cx="18" cy="16" r="4" fill="white" />
            </svg>
            eCitizen
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/login")}
              className="hidden sm:inline-flex text-xs font-medium text-primary border border-primary px-4 py-2 rounded-lg hover:bg-primary/5 transition-colors"
            >
              Log In
            </button>

            <button
              onClick={() => navigate("/register")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-accent text-accent-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              Register
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden bg-card md:grid md:grid-cols-2 md:min-h-[600px]">
          <div className="absolute inset-0 md:hidden bg-muted">
            <img src={dublinMap} alt="" className="w-full h-full object-cover opacity-[0.18]" />
          </div>

          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 flex flex-col justify-center px-5 md:px-8 lg:px-16 py-10 md:py-16"
          >
            <h1 className="text-[clamp(2.25rem,1rem+5.5vw,4rem)] font-extrabold text-primary leading-[1.08] mb-5">
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
                onClick={handleReportClick}
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
            className="relative overflow-hidden hidden md:block"
          >
            <img src={dublinMap} alt="Dublin city map" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/18 to-transparent" />

            {MAP_PINS.map((pin, i) => (
              <div
                key={i}
                className="absolute flex items-center gap-1.5 bg-card rounded-full px-3 py-1 shadow-md text-[11px] font-semibold whitespace-nowrap"
                style={{
                  top: pin.top,
                  left: pin.left,
                  right: pin.right,
                  bottom: pin.bottom,
                  animation: `pinFloat 4s ease-in-out infinite`,
                  animationDelay: `${ANIM_DELAYS[i]}s`,
                }}
              >
                <span className={`w-2 h-2 rounded-full ${pin.color}`} />
                {pin.label}
              </div>
            ))}
          </motion.div>
        </section>

        <div className="bg-primary py-5 md:py-8">
          <div className="max-w-[480px] md:max-w-[900px] lg:max-w-[1100px] mx-auto px-5 md:px-8">
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { value: formatNumber(stats.totalIssues), label: "Issues Reported" },
                { value: formatPercentage(stats.resolutionRate), label: "Resolution Rate" },
                { value: formatDays(stats.averageCloseDays), label: "Avg. Close Time" },
              ].map((stat) => (
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
          <div className="max-w-[480px] md:max-w-[900px] lg:max-w-[1100px] mx-auto px-5 md:px-8">
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

            <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {STEPS.map((step, i) => (
                <motion.div
                  key={step.num}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  variants={fadeUp}
                  className="bg-card rounded-xl p-6 border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all active:scale-[0.98]"
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
          <div className="max-w-[600px] mx-auto px-5 md:px-8">
            <h2 className="text-[clamp(1.75rem,1.1rem+2.8vw,3rem)] font-extrabold text-primary-foreground mb-4">
              Ready to make a difference?
            </h2>

            <p className="text-base text-primary-foreground/75 max-w-[42ch] mx-auto mb-8">
              It takes less than a minute to report an issue. Your city is listening.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleReportClick}
                className="inline-flex items-center justify-center gap-2 font-bold text-sm bg-card text-primary rounded-lg px-6 py-3 min-h-[48px] max-w-[240px] w-full hover:bg-card/90 shadow-lg active:scale-[0.97] transition-all"
              >
                <Plus size={17} /> Get Started
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-card border-t border-border py-8 pb-[calc(2rem+env(safe-area-inset-bottom,0px))]">
        <div className="max-w-[480px] md:max-w-[900px] lg:max-w-[1100px] mx-auto px-5 md:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 sm:gap-4 flex-wrap">
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
            <button onClick={handleReportClick} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Report New Issue
            </button>
            <button onClick={() => navigate("/contact")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
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
