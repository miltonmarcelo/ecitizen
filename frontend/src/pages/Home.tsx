import { FileText, Search, Users, CheckCircle, BarChart3, Heart, ArrowRight, ClipboardList, Clock, ThumbsUp, User } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import heroIllustration from "@/assets/hero-illustration.jpg";
import { auth } from "@/firebase/firebase";

const STATS = [
  { icon: ClipboardList, value: "128", label: "Issues Reported", color: "text-primary", bg: "bg-primary/10" },
  { icon: CheckCircle, value: "94", label: "Resolved", color: "text-accent", bg: "bg-accent/10" },
  { icon: Clock, value: "21", label: "In Progress", color: "text-warning", bg: "bg-warning/10" },
  { icon: ThumbsUp, value: "340", label: "Supports", color: "text-primary", bg: "bg-primary/10" },
];

const STEPS = [
  { icon: FileText, title: "Submit an Issue", desc: "Describe the problem and pin the location." },
  { icon: Search, title: "Track Updates", desc: "Follow your report's progress in real time." },
  { icon: Users, title: "Support Reports", desc: "Back existing issues to boost priority." },
];

const FEATURES = [
  { icon: CheckCircle, title: "Easy Reporting", desc: "A guided form that makes it fast and simple." },
  { icon: BarChart3, title: "Transparent Tracking", desc: "Real-time status updates on every case." },
  { icon: Heart, title: "Community Driven", desc: "Rally neighbours behind what matters most." },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.4 } }),
};

const HomePage = () => {
  const navigate = useNavigate();
  const handleSubmitIssueClick = () => {
  if (auth.currentUser) {
    navigate("/report");
  } else {
    navigate("/login");
  }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* App Bar */}
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-14">
          <span className="text-lg font-bold tracking-tight text-foreground">
            <span className="text-primary">e</span>Citizen
          </span>
          <div className="flex items-center gap-2">
  <button
    onClick={() => navigate("/staff/login")}
    className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
  >
    Staff Portal
  </button>

  <button
    onClick={() => navigate("/login")}
    className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
  >
    Login
  </button>

  <button
    onClick={() => navigate("/register")}
    className="btn-primary-civic !px-4 !py-2 text-xs"
  >
    Register
  </button>
</div>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 max-w-lg mx-auto w-full space-y-6">
        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl overflow-hidden bg-card border border-border shadow-sm"
        >
          <div className="w-full h-44 overflow-hidden bg-muted">
            <img
              src={heroIllustration}
              alt="Citizen reporting a local issue using a mobile app"
              className="w-full h-full object-cover"
              width={800}
              height={512}
            />
          </div>
          <div className="px-5 py-5">
            <h1 className="text-xl font-bold text-foreground leading-tight mb-1.5">
              Make your area better
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Report local issues and follow progress in one place.
            </p>
            <button
              onClick={handleSubmitIssueClick}
              className="btn-primary-civic flex items-center gap-2 w-full justify-center"
            >
              Report an Issue <ArrowRight size={16} />
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="grid grid-cols-4 gap-2"
        >
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl bg-card border border-border p-3 flex flex-col items-center text-center shadow-sm"
            >
              <div className={`w-8 h-8 rounded-full ${stat.bg} flex items-center justify-center mb-1.5`}>
                <stat.icon size={15} className={stat.color} />
              </div>
              <span className="text-lg font-bold text-foreground leading-none">{stat.value}</span>
              <span className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{stat.label}</span>
            </div>
          ))}
        </motion.div>

        {/* How it Works */}
        <section>
          <h2 className="section-title">How it Works</h2>
          <div className="flex flex-col gap-2.5">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={fadeUp}
                className="card-civic flex items-center gap-3 py-3"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <step.icon size={17} className="text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm leading-tight">{step.title}</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Why eCitizen */}
        <section>
          <h2 className="section-title">Why eCitizen</h2>
          <div className="flex flex-col gap-2.5">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={feat.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={fadeUp}
                className="card-civic flex items-center gap-3 py-3"
              >
                <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <feat.icon size={17} className="text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm leading-tight">{feat.title}</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">{feat.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50">
        <div className="max-w-lg mx-auto px-5 py-5 flex flex-col items-center gap-2">
          <div className="flex gap-6 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">About</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
          <p className="text-[0.7rem] text-muted-foreground/60">© 2026 eCitizen. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
