"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ensureUserProfile, getUserProfile } from "@/lib/firestore";

type Profile = { uid: string; name: string; email: string; role: "customer" | "admin" };

const AuthContext = createContext<{
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}>({ user: null, profile: null, loading: true, refreshProfile: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async (nextUser = user) => {
    if (!nextUser) {
      setProfile(null);
      return;
    }
    const data = await getUserProfile(nextUser.uid);
    setProfile(data);
  }, [user]);

  useEffect(() => {
    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser?.email) {
        await ensureUserProfile(nextUser.uid, {
          name: nextUser.displayName || nextUser.email.split("@")[0],
          email: nextUser.email
        });
        await refreshProfile(nextUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, [refreshProfile]);

  const value = useMemo(() => ({ user, profile, loading, refreshProfile }), [user, profile, loading, refreshProfile]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
