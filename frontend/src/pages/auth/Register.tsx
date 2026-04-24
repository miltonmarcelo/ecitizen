import { Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  signOut,
} from "firebase/auth";
import { auth } from "@/firebase/firebase";
import CitizenLayout from "@/components/layout/CitizenLayout";
import PageHeader from "@/components/common/PageHeader";
import SectionCard from "@/components/common/SectionCard";

const RegisterPage = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    // Normalizes spacing so the saved full name is consistent.
    const normalizedFullName = fullName.trim().replace(/\s+/g, " ");

    if (!normalizedFullName) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (password.length < 6) {
      setError("Password must have at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    let createdUser = null;

    try {
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      createdUser = userCredential.user;

      // Uses Firebase token so backend can create or sync the app-level user record.
      const token = await createdUser.getIdToken(true);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: normalizedFullName,
        }),
      });

      const rawText = await response.text();
      let data: any = {};

      try {
        // Parses defensively in case backend returns plain text on some errors.
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(data.message || data.details || "Failed to sync user");
      }

      navigate("/dashboard");
    } catch (err: any) {
      console.error("Register error:", err);

      const firebaseErrorCode = err?.code || "";
      const message = err?.message || "Unable to create account. Please try again.";

      if (createdUser && !firebaseErrorCode) {
        try {
          // Rolls back Firebase auth user when backend sync fails after account creation.
          await deleteUser(createdUser);
        } catch (deleteError) {
          console.error("Failed to delete Firebase user after sync error:", deleteError);
          try {
            await signOut(auth);
          } catch (signOutError) {
            console.error("Failed to sign out after sync error:", signOutError);
          }
        }
      }

      if (firebaseErrorCode === "auth/email-already-in-use") {
        setError("This email is already in use. Please log in instead or use another email.");
      } else if (firebaseErrorCode === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (firebaseErrorCode === "auth/weak-password") {
        setError("Please choose a stronger password.");
      } else if (message === "Unauthorized") {
        setError(
          "Registration reached Firebase, but backend user sync failed with Unauthorized. Please check that frontend Firebase and backend Admin credentials are using the same Firebase project."
        );
      } else {
        setError(message);
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
          title="Create Account"
          subtitle="Register to report and track issues"
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
          <form className="form-stack" onSubmit={handleRegister} autoComplete="on">
            <div className="field-stack">
              <label className="label-text login-page__label">Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                className="app-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
              />
            </div>

            <div className="field-stack">
              <label className="label-text login-page__label">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="app-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="field-stack">
              <label className="label-text login-page__label">Password</label>
              <div className="login-page__password-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  className="app-input app-input--with-icon"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
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

            <div className="field-stack">
              <label className="label-text login-page__label">Confirm Password</label>
              <div className="login-page__password-wrap">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm your password"
                  className="app-input app-input--with-icon"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  className="login-page__password-toggle"
                  aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="register-page__agreement">
              <span className="helper-text register-page__agreement-text">
                By creating an account, I agree to the Terms of Service and Privacy Policy
              </span>
            </div>

            {error ? <p className="login-page__error">{error}</p> : null}

            <button
              type="submit"
              className="app-btn app-btn--primary login-page__submit"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
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
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="login-page__text-link login-page__text-link--strong"
        >
          Log in
        </button>
      </motion.p>
    </CitizenLayout>
  );
};

export default RegisterPage;
