import { ArrowLeft, User, Mail, Shield, CalendarDays, CheckCircle, LogOut, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/TopBar";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase/firebase";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.35 } }),
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const handleSignOut = async () => {
  try {
    await signOut(auth);
    navigate("/");
  } catch (error) {
    console.error("Error signing out:", error);
  }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* App Bar */}
      <TopBar showBack backTo="/dashboard" />

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Avatar & Summary Card */}
        <motion.div className="card-civic flex flex-col items-center text-center space-y-3 py-6" initial="hidden" animate="visible" custom={0} variants={fadeUp}>
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-10 h-10 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Milton Marcelo</h2>
            <p className="text-sm text-muted-foreground">milton.marcelo@email.com</p>
          </div>
          <span className="inline-block text-[11px] font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">Citizen</span>
        </motion.div>

        {/* Account Information */}
        <motion.div className="card-civic space-y-0" initial="hidden" animate="visible" custom={1} variants={fadeUp}>
          <h3 className="section-title px-1 pb-3">Account Information</h3>
          {[
            { icon: User, label: "Full Name", value: "Milton Marcelo" },
            { icon: Mail, label: "Email Address", value: "milton.marcelo@email.com" },
            { icon: Shield, label: "User Role", value: "Citizen" },
            { icon: CalendarDays, label: "Member Since", value: "15 January 2026" },
            { icon: CheckCircle, label: "Account Status", value: "Active" },
          ].map((item, idx) => (
            <div key={item.label} className={`flex items-center gap-3 py-3 ${idx > 0 ? "border-t border-border" : ""}`}>
              <item.icon className="w-4 h-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-medium text-foreground">{item.value}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Actions */}
        <motion.div className="space-y-3" initial="hidden" animate="visible" custom={2} variants={fadeUp}>
          <button onClick={() => navigate("/dashboard")} className="btn-secondary-civic w-full flex items-center justify-center gap-2">
            <LayoutDashboard className="w-4 h-4" />
            Back to Dashboard
          </button>
          <button onClick={handleSignOut} className="btn-outline-civic w-full flex items-center justify-center gap-2 text-destructive border-destructive/30 hover:bg-destructive/5">
            <LogOut className="w-4 h-4" />
              Sign Out
          </button>
        </motion.div>
      </main>
    </div>
  );
};

export default ProfilePage;
