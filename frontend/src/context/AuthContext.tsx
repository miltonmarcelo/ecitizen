import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/firebase/firebase";
import { API_BASE_URL } from "@/lib/api";
import type { Role } from "@/types/domain";

type AppUser = {
  id: number;
  firebaseUid?: string | null;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  staffProfile?: {
    id: number;
    userId: number;
    jobTitle: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

type AuthContextType = {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setLoading(true);
        setUser(firebaseUser);

        if (!firebaseUser) {
          setAppUser(null);
          setLoading(false);
          return;
        }

        const token = await firebaseUser.getIdToken();

        const response = await fetch(`${API_BASE_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          setAppUser(null);
          setLoading(false);
          return;
        }

        const data = await response.json();
        setAppUser(data.user || null);
      } catch (error) {
        console.error("AuthContext profile load error:", error);
        setAppUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    setAppUser(null);
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, appUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
