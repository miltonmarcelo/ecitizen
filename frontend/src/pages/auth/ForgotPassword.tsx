import { useMemo, useState } from "react";
import { Mail, Info } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/firebase/firebase";
import CitizenLayout from "@/components/layout/CitizenLayout";
import PageHeader from "@/components/common/PageHeader";
import SectionCard from "@/components/common/SectionCard";

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
    <CitizenLayout showBack backTo="/">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="login-page__header"
      >
        <PageHeader
          title="Reset Password"
          subtitle="Enter your email to receive a reset link"
          className="mb-0"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="login-page__card-wrap"
      >
        <SectionCard>
          <form className="form-stack" onSubmit={handleSubmit}>
            <div className="field-stack">
              <label className="label-text login-page__label">Email</label>

              <div className="login-page__password-wrap">
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="app-input app-input--with-icon"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
                <Mail size={16} className="auth-page__field-icon" />
              </div>
            </div>

            {error ? <p className="login-page__error">{error}</p> : null}

            <button
              type="submit"
              className="app-btn app-btn--primary login-page__submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        </SectionCard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="auth-page__info-card"
      >
        <div className="issue-notice issue-notice--primary card-body">
          <div className="issue-notice__content auth-page__info-row">
            <Info size={16} className="auth-page__info-icon" />
            <p className="helper-text auth-page__info-text">
              If an account exists for this email address, a password reset link will be sent.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="auth-page__helper-note"
      >
        Please make sure you enter the email linked to your account.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="auth-page__actions-center"
      >
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="login-page__text-link login-page__text-link--strong auth-page__inline-back"
        >
          <span>Back to Login</span>
        </button>
      </motion.div>
    </CitizenLayout>
  );
};

export default ForgotPasswordPage;