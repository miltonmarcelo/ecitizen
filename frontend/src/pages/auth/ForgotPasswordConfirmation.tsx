import { Info, MailCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import CitizenLayout from "@/components/layout/CitizenLayout";
import PageHeader from "@/components/common/PageHeader";
import SectionCard from "@/components/common/SectionCard";

const ForgotPasswordConfirmationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Reads email from navigation state, with a safe fallback when opened directly.
  const email = location.state?.email || "";

  return (
    <CitizenLayout showBack backTo="/">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="login-page__header"
      >
        <PageHeader
          title="Check Your Email"
          subtitle="If an account exists for this email address, a reset link has been sent."
          className="mb-0"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="login-page__card-wrap"
      >
        <SectionCard className="auth-page__confirmation-card">
          <div className="auth-page__confirmation-content">
            <div className="auth-page__confirmation-icon-wrap">
              <MailCheck size={24} className="auth-page__confirmation-icon" />
            </div>

            <h2 className="section-title auth-page__confirmation-title">Email Sent</h2>

            <p className="page-subtitle auth-page__confirmation-text">
              {email
                ? `If ${email} is registered with eCitizen, you will receive a password reset email shortly.`
                : "If your email address is registered with eCitizen, you will receive a password reset email shortly."}
            </p>
          </div>
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
              Please check your inbox and spam folder. For security reasons, we cannot confirm whether an email address is registered.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="auth-page__stack-actions"
      >
        <button
          type="button"
          onClick={() => navigate("/forgot-password")}
          className="app-btn app-btn--secondary auth-page__full-width-btn"
        >
          Try Another Email
        </button>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="login-page__text-link login-page__text-link--strong auth-page__inline-back auth-page__centered-link"
        >
          <span>Back to Login</span>
        </button>
      </motion.div>
    </CitizenLayout>
  );
};

export default ForgotPasswordConfirmationPage;
