import { useEffect, useMemo, useState } from "react";
import { Menu, Plus, X } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/api";
import dublinMap from "@/assets/dublin-map.png";
import BrandLogo from "@/components/common/BrandLogo";
import UserProfileDropdown from "@/components/UserProfileDropdown";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

const MAP_PINS = [
  { top: "18%", left: "10%", colorClass: "home-page__pin-dot--success", label: "Pothole • Resolved" },
  { top: "42%", left: "28%", colorClass: "home-page__pin-dot--warning", label: "Street Light • In Progress" },
  { top: "25%", right: "14%", colorClass: "home-page__pin-dot--primary", label: "Graffiti • Open" },
  { bottom: "32%", right: "10%", colorClass: "home-page__pin-dot--danger", label: "Dumping • Open" },
  { bottom: "22%", left: "18%", colorClass: "home-page__pin-dot--success", label: "Flooding • Resolved" },
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

  useEffect(() => {
    if (user) setMobileMenuOpen(false);
  }, [user]);

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
    <div className="home-page">
      <header className="home-page__header">
        <div className="home-page__header-inner">
          <button
            onClick={() => goTo("/")}
            className="home-page__brand-button"
            type="button"
          >
            <BrandLogo size="md" showText={true} />
          </button>

          {user ? (
            <div className="flex items-center gap-4">
              <UserProfileDropdown />
            </div>
          ) : (
            <div className="home-page__header-actions">
              <div className="home-page__desktop-actions">
                <button
                  onClick={() => goTo("/login")}
                  className="home-page__nav-btn home-page__nav-btn--secondary"
                  type="button"
                >
                  Log in
                </button>

                <button
                  onClick={() => goTo("/register")}
                  className="home-page__nav-btn home-page__nav-btn--accent"
                  type="button"
                >
                  Register
                </button>
              </div>

              <button
                type="button"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="home-page__menu-toggle"
              >
                {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          )}
        </div>

        {!user && mobileMenuOpen && (
          <div className="home-page__mobile-menu">
            <div className="home-page__mobile-menu-inner">
              <div className="home-page__mobile-menu-actions">
                <button
                  onClick={() => goTo("/login", true)}
                  className="home-page__mobile-btn home-page__mobile-btn--secondary"
                  type="button"
                >
                  Log in
                </button>

                <button
                  onClick={() => goTo("/register", true)}
                  className="home-page__mobile-btn home-page__mobile-btn--accent"
                  type="button"
                >
                  Register
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="home-page__main">
        <section className="home-page__hero">
          <div className="home-page__hero-grid">
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="home-page__hero-copy"
            >
              <h1 className="home-page__hero-title">
                See it.
                <br />
                <span className="home-page__hero-title-accent">Report it.</span>
                <br />
                Resolved.
              </h1>

              <p className="home-page__hero-text">
                Report potholes, broken lighting, graffiti and more. Track your cases and help improve your city through one clear platform.
              </p>

              <div className="home-page__hero-actions">
                <button onClick={goToReport} className="home-page__cta-btn">
                  <Plus size={17} />
                  <span>Report New Issue</span>
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="home-page__hero-map"
            >
              <img src={dublinMap} alt="Dublin city map" className="home-page__hero-map-image" />
              <div className="home-page__hero-map-overlay" />

              {MAP_PINS.map((pin, i) => (
                <div
                  key={i}
                  className={`home-page__map-pin ${i > 1 ? "home-page__map-pin--desktop-only" : ""}`}
                  style={{
                    top: pin.top,
                    left: pin.left,
                    right: pin.right,
                    bottom: pin.bottom,
                    animationDelay: `${ANIM_DELAYS[i]}s`,
                  }}
                >
                  <span className={`home-page__pin-dot ${pin.colorClass}`} />
                  {pin.label}
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="home-page__stats-bar">
          <div className="home-page__stats-inner">
            <div className="home-page__stats-grid">
              {statCards.map((stat) => (
                <div key={stat.label} className="home-page__stat-item">
                  <span className="home-page__stat-value">{stat.value}</span>
                  <span className="home-page__stat-label">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="home-page__steps-section">
          <div className="home-page__section-inner">
            <div className="home-page__section-copy">
              <p className="home-page__section-kicker">How It Works</p>
              <h2 className="home-page__section-title">
                From report to resolution,
                <br />
                every step is clear.
              </h2>
              <p className="home-page__section-text">
                You report it. We handle it. You see every step.
              </p>
            </div>

            <div className="home-page__steps-grid">
              {STEPS.map((step, i) => (
                <motion.div
                  key={step.num}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  variants={fadeUp}
                  className={`home-page__step-card ${step.num === 3 ? "home-page__step-card--wide" : ""}`}
                >
                  <div className="home-page__step-badge">{step.num}</div>
                  <h3 className="home-page__step-title">{step.title}</h3>
                  <p className="home-page__step-text">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="home-page__final-cta">
          <div className="home-page__section-inner">
            <div className="home-page__final-cta-copy">
              <h2 className="home-page__final-cta-title">Ready to make a difference?</h2>

              <p className="home-page__final-cta-text">
                It takes less than a minute to report an issue. Your city is listening.
              </p>

              <div className="home-page__final-cta-actions">
                <button onClick={goToReport} className="home-page__final-cta-btn">
                  <Plus size={17} />
                  <span>Get Started</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="home-page__footer">
        <div className="home-page__footer-inner">
          <BrandLogo size="sm" showText={true} />

          <nav className="home-page__footer-nav">
            <button onClick={goToReport} className="home-page__footer-link">
              Report New Issue
            </button>
            <button onClick={() => goTo("/contact")} className="home-page__footer-link">
              Contact Us
            </button>
          </nav>

          <p className="home-page__footer-copy">© 2026 eCitizen • Dublin, Ireland</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
