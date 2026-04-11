import { ArrowLeft, Info, MailCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";

const ForgotPasswordConfirmationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-14">
          <span className="text-lg font-bold tracking-tight text-foreground">
            <span className="text-primary">e</span>Citizen
          </span>
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} /> Back to Login
          </button>
        </div>
      </header>

      <main className="flex-1 px-5 py-8 max-w-lg mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-foreground mb-1">Check Your Email</h1>
          <p className="text-sm text-muted-foreground">
            If an account exists for this email address, a reset link has been sent.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="card-civic mb-5"
        >
          <div className="flex flex-col items-center text-center py-2">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <MailCheck size={24} className="text-primary" />
            </div>

            <h2 className="text-lg font-semibold text-foreground mb-2">
              Email Sent
            </h2>

            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              {email
                ? `If ${email} is registered with eCitizen, you will receive a password reset email shortly.`
                : "If your email address is registered with eCitizen, you will receive a password reset email shortly."}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="card-civic bg-primary/5 border-primary/15 mb-5"
        >
          <div className="flex items-start gap-2.5">
            <Info size={16} className="text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Please check your inbox and spam folder. For security reasons, we cannot confirm whether an email address is registered.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="flex flex-col gap-3"
        >
          <button
            onClick={() => navigate("/forgot-password")}
            className="btn-secondary-civic w-full"
          >
            Try Another Email
          </button>

          <button
            onClick={() => navigate("/login")}
            className="text-sm text-primary font-medium hover:underline inline-flex items-center justify-center gap-1"
          >
            <ArrowLeft size={14} /> Back to Login
          </button>
        </motion.div>
      </main>
    </div>
  );
};

export default ForgotPasswordConfirmationPage;