import { Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { auth } from "@/firebase/firebase";
import CitizenLayout from "@/components/layout/CitizenLayout";
import PageHeader from "@/components/common/PageHeader";
import SectionCard from "@/components/common/SectionCard";

const LoginPage = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      // Keeps session only for this tab unless "Remember me" is checked.
      await setPersistence(
        auth,
        remember ? browserLocalPersistence : browserSessionPersistence
      );

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Sends a fresh Firebase token so backend can sync role/profile safely.
      const token = await userCredential.user.getIdToken(true);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to sync user");
      }

      // Redirects by role so admins and staff land on their own dashboards.
      if (data.user?.role === "ADMIN") {
        navigate("/admin/dashboard", { replace: true });
      } else if (data.user?.role === "STAFF") {
        navigate("/staff/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err: any) {
      if (err.code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError(err.message || "Unable to log in. Please try again.");
      }
    } finally {
      setLoading(false);
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
          title="Welcome Back to eCitizen"
          subtitle="Log in to report and track issues in your area"
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
          <form className="form-stack" onSubmit={handleLogin} autoComplete="off">
            <div className="field-stack">
              <label htmlFor="email" className="label-text login-page__label">
                Email
              </label>
              <input
                id="email"
                name="user_email"
                type="email"
                placeholder="you@example.com"
                className="app-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="section-login email"
                inputMode="email"
                autoCapitalize="none"
                spellCheck={false}
              />
            </div>

           <div className="field-stack">
              <label htmlFor="password" className="label-text login-page__label">
                Password
              </label>

              <div className="login-page__password-wrap">
                <input
                  id="password"
                  name="user_password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="app-input app-input--with-icon"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="section-login current-password"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="login-page__password-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="login-page__options-row">
              <label className="login-page__checkbox-label">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="login-page__checkbox"
                />
                <span className="helper-text">Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="login-page__text-link"
              >
                Forgot Password?
              </button>
            </div>

            {error ? <p className="login-page__error">{error}</p> : null}

            <button
              type="submit"
              className="app-btn app-btn--primary login-page__submit"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>
        </SectionCard>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="login-page__footer"
      >
        No account yet?{" "}
        <button
          type="button"
          onClick={() => navigate("/register")}
          className="login-page__text-link login-page__text-link--strong"
        >
          Register
        </button>
      </motion.p>
    </CitizenLayout>
  );
};

export default LoginPage;
