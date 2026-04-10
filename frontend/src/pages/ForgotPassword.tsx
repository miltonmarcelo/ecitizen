import { useMemo, useState } from "react";
import { ArrowLeft, Mail, Info } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/firebase/firebase";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const actionCodeSettings = useMemo(() => {
    const fallbackUrl = `${window.location.origin}/login`;
    const configuredUrl = import.meta.env.VITE_PASSWORD_RESET_CONTINUE_URL;

    return {
      url: configuredUrl || fallbackUrl,
      handleCodeInApp: false,
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setIsSubmitting(true);

      await sendPasswordResetEmail(auth, trimmedEmail, actionCodeSettings);

      navigate("/forgot-password-confirmation", {
        state: { email: trimmedEmail },
      });
    } catch (err: any) {
      console.error("Password reset request failed:", err);

      if (err?.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
        return;
      }

      if (err?.code === "auth/too-many-requests") {
        setError("Too many attempts. Please try again later.");
        return;
      }

      if (err?.code === "auth/network-request-failed") {
        setError("Network error. Please check your connection and try again.");
        return;
      }

      setError("Unable to send reset email right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-foreground mb-1">Reset Password</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email to receive a reset link
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="card-civic mb-5"
        >
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="input-civic pr-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
                <Mail
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              className="btn-primary-civic w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
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
              If an account exists for this email address, a password reset link will be sent.
            </p>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-xs text-muted-foreground mb-6"
        >
          Please make sure you enter the email linked to your account.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-center"
        >
          <button
            onClick={() => navigate("/login")}
            className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1"
          >
            <ArrowLeft size={14} /> Back to Login
          </button>
        </motion.div>
      </main>
    </div>
  );
};

export default ForgotPasswordPage;