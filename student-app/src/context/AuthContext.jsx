import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]                           = useState(null);
  const [loading, setLoading]                     = useState(true);
  const [showOnboarding, setShowOnboarding]       = useState(false);
  const [profileComplete, setProfileComplete]     = useState(null); // null=checking, true/false

  // Returns true if profile exists, false if not
  const checkProfile = async () => {
    try {
      await api.get("/profiles/me");
      setProfileComplete(true);
      return true;
    } catch (e) {
      setProfileComplete(false);
      return false;
    }
  };

  // On app load — restore session if token exists
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) { setLoading(false); return; }

    (async () => {
      try {
        const r = await api.get("/auth/me");
        setUser({ token, ...r.data });
        if (!r.data.has_completed_onboarding) setShowOnboarding(true);
        await checkProfile(); // awaited so profileComplete is ready before loading=false
      } catch {
        const lang = localStorage.getItem("lang");
        localStorage.clear();
        if (lang) localStorage.setItem("lang", lang);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email, password) => {
    const res   = await api.post("/auth/login", { email, password });
    localStorage.setItem("access_token", res.data.access_token);
    localStorage.setItem("refresh_token", res.data.refresh_token);
    const meRes = await api.get("/auth/me");
    setUser({ token: res.data.access_token, ...meRes.data });
    if (!meRes.data.has_completed_onboarding) setShowOnboarding(true);
    const profileDone = await checkProfile();
    // Return user data + profile status so Login.jsx can navigate correctly
    return { userData: meRes.data, profileComplete: profileDone };
  };

  const register = async (email, password) => {
    const res = await api.post("/auth/register", { email, password });
    localStorage.setItem("access_token", res.data.access_token);
    if (res.data.refresh_token) localStorage.setItem("refresh_token", res.data.refresh_token);
    const meRes = await api.get("/auth/me");
    setUser({ token: res.data.access_token, ...meRes.data });
    if (!meRes.data.has_completed_onboarding) setShowOnboarding(true);
    await checkProfile(); // new user → sets profileComplete = false
    return res.data;
  };

  const logout = () => {
    const lang = localStorage.getItem("lang");
    localStorage.clear();
    if (lang) localStorage.setItem("lang", lang);
    setUser(null);
    setShowOnboarding(false);
    setProfileComplete(null);
  };

  const completeOnboarding = async () => {
    try { await api.post("/auth/onboarding/complete"); } catch {}
    setUser(prev => ({ ...prev, has_completed_onboarding: true }));
    setShowOnboarding(false);
  };

  const restartOnboarding = async () => {
    try { await api.post("/auth/onboarding/reset"); } catch {}
    setUser(prev => ({ ...prev, has_completed_onboarding: false }));
    setShowOnboarding(true);
  };

  // Called from Profile.jsx after a successful save to update flow state
  const markProfileComplete = () => setProfileComplete(true);

  return (
    <AuthContext.Provider value={{
      user, login, register, logout, loading,
      showOnboarding, completeOnboarding, restartOnboarding,
      profileComplete, markProfileComplete,
      // kept for ProfileWizard backward compat
      showProfileWizard: false,
      closeProfileWizard: () => {},
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
