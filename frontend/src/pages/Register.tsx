import { Eye, EyeOff, ShieldCheck, Bell, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  deleteUser,
  signOut,
} from "firebase/auth";
import { auth } from "@/firebase/firebase";
import TopBar from "@/components/TopBar";

const BENEFITS = [
  { icon: BarChart3, text: "Track your reported issues in real time" },
  { icon: Bell, text: "Receive updates when status changes" },
  { icon: ShieldCheck, text: "Support existing reports in your area" },
];

const RegisterPage = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
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

    if (!agreed) {
      setError("Please accept the terms to continue.");
      return;
    }

    let createdUser = null;

    try {
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      createdUser = userCredential.user;

      await updateProfile(createdUser, {
        displayName: fullName,
      });

      const token = await createdUser.getIdToken(true);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName,
        }),
      });

      const rawText = await response.text();
      let data: any = {};

      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(data.message || data.details || "Failed to sync user");
      }

      navigate("/my-reports");
    } catch (err: any) {
      console.error("Register error:", err);

      const firebaseErrorCode = err?.code || "";
      const message = err?.message || "Unable to create account. Please try again.";

      if (createdUser && !firebaseErrorCode) {
        try {
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
        setError("This email is already in use. Please login instead or use another email.");
      } else if (firebaseErrorCode === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (firebaseErrorCode === "auth/weak-password") {
        setError("Please choose a stronger password.");
      } else if (message === "Unauthorized") {
        setError("Registration reached Firebase, but backend user sync failed with Unauthorized. Please check that frontend Firebase and backend Admin credentials are using the same Firebase project.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar showBack backTo="/" />

      <main className="flex-1 px-5 py-8 max-w-lg mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-foreground mb-1">Create Account</h1>
          <p className="text-sm text-muted-foreground">Register to report and track issues</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="card-civic mb-5"
        >
          <form className="flex flex-col gap-4" onSubmit={handleRegister}>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                className="input-civic"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="input-civic"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  className="input-civic pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm your password"
                  className="input-civic pr-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-border text-primary accent-primary"
              />
              <span className="text-xs text-muted-foreground leading-relaxed">
                I agree to the Terms of Service and Privacy Notice
              </span>
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button type="submit" className="btn-primary-civic w-full mt-1" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-center text-sm text-muted-foreground mb-6"
        >
          Already have an account?{" "}
          <button onClick={() => navigate("/login")} className="text-primary font-medium hover:underline">
            Login
          </button>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="card-civic bg-primary/5 border-primary/15"
        >
          <p className="text-xs font-semibold text-foreground mb-3">Why register?</p>
          <div className="flex flex-col gap-2.5">
            {BENEFITS.map((b) => (
              <div key={b.text} className="flex items-center gap-2.5">
                <b.icon size={15} className="text-primary shrink-0" />
                <span className="text-xs text-muted-foreground">{b.text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default RegisterPage;
