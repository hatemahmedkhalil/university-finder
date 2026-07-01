import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

/* Routes that should NOT show the sidebar (public/auth pages) */
const NO_SIDEBAR_PATHS = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];

const DashboardLayout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const isPublicPage = NO_SIDEBAR_PATHS.includes(location.pathname) || !user;

  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    return saved === "true";
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pageKey, setPageKey] = useState(location.pathname);

  const toggleCollapsed = () => {
    setCollapsed(v => {
      localStorage.setItem("sidebar_collapsed", String(!v));
      return !v;
    });
  };

  // Trigger page transition on route change
  useEffect(() => {
    setPageKey(location.pathname);
    setMobileOpen(false);
  }, [location.pathname]);

  const sidebarWidth = collapsed ? 68 : 240;

  if (isPublicPage) {
    return (
      <>
        <Topbar sidebarWidth={0} onMobileOpen={() => {}} />
        <main className="pt-[60px]">
          {children}
        </main>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        collapsed={collapsed}
        onToggle={toggleCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <Topbar
        sidebarWidth={sidebarWidth}
        onMobileOpen={() => setMobileOpen(true)}
      />

      {/* Main content — desktop shifts away from sidebar; mobile stays full width */}
      <main
        className="pt-[60px] min-h-screen transition-all duration-300 ease-in-out"
        style={{ [isRTL ? "marginRight" : "marginLeft"]: `${sidebarWidth}px` }}
      >
        <div key={pageKey} className="page-enter">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
