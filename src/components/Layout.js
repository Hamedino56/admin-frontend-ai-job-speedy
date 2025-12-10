import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiGrid, FiUsers, FiBriefcase, FiCpu, FiUserCheck, FiMenu } from "react-icons/fi";
import waveImg from "../assets/wave.png";
import jobLogo from "../assets/job_logo.png";
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../utils/i18n";
import useMediaQuery from "../hooks/useMediaQuery";

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, toggleLanguage } = useLanguage();

  const getSidebarItems = () => [
    { label: t(language, 'sidebar.dashboard'), key: "dashboard" },
    { label: t(language, 'sidebar.candidates'), key: "candidates" },
    { label: t(language, 'sidebar.jobs'), key: "jobs" },
    { label: t(language, 'sidebar.aiTools'), key: "ai-tools" },
    { label: t(language, 'sidebar.clients'), key: "clients" },
  ];

  const renderIcon = (key) => {
    const iconProps = { size: 18, style: { marginRight: 10, flexShrink: 0 } };
    switch (key) {
      case "dashboard":
        return <FiGrid color="#0083FF" {...iconProps} />;
      case "candidates":
        return <FiUsers color="#0083FF" {...iconProps} />;
      case "jobs":
        return <FiBriefcase color="#0083FF" {...iconProps} />;
      case "ai-tools":
        return <FiCpu color="#0083FF" {...iconProps} />;
      case "clients":
        return <FiUserCheck color="#0083FF" {...iconProps} />;
      default:
        return null;
    }
  };
  
  const handleNavigate = (key) => {
    const routes = {
      "dashboard": "/dashboard",
      "candidates": "/candidates",
      "jobs": "/jobs",
      "ai-tools": "/ai-tools",
      "clients": "/clients"
    };
    
    const route = routes[key];
    if (route) {
      navigate(route);
    }
  };

  const getSidebarItemStyle = (item) => {
    const routes = {
      "dashboard": "/dashboard",
      "candidates": "/candidates",
      "jobs": "/jobs",
      "ai-tools": "/ai-tools",
      "clients": "/clients"
    };
    
    const isActive = location.pathname === routes[item.key];
    
    return {
      ...styles.sidebarItem,
      ...(isActive && {
        background: "linear-gradient(90deg, rgba(0,178,255,0.15), rgba(0,131,255,0.25))",
        boxShadow: "0 4px 10px rgba(0,178,255,0.2)",
        color: "#0083FF"
      })
    };
  };

  const handleButtonClick = (e) => {
    const btn = e.currentTarget;
    if (btn) btn.style.transform = "scale(0.95)";
    setTimeout(() => {
      if (btn) btn.style.transform = "scale(1)";
      try {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
        localStorage.removeItem('accessToken');
        window.dispatchEvent(new Event('storage'));
      } catch (_) {}
      navigate('/login', { replace: true });
    }, 150);
  };

  const isTablet = useMediaQuery("(max-width: 1024px)");
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [sidebarOpen, setSidebarOpen] = useState(!isTablet);

  useEffect(() => {
    setSidebarOpen(!isTablet);
  }, [isTablet]);

  const sidebarStyle = useMemo(() => ({
    ...styles.sidebar,
    width: isTablet ? 260 : 220,
    transform: isTablet
      ? sidebarOpen
        ? "translateX(0)"
        : "translateX(-100%)"
      : "translateX(0)",
    position: isTablet ? "fixed" : "fixed",
    top: "80px",
    left: 0,
    zIndex: 1200,
  }), [isTablet, sidebarOpen]);

  const mainStyle = useMemo(() => ({
    ...styles.main,
    marginLeft: isTablet ? 0 : 220,
    padding: isMobile ? "20px 15px 60px" : "40px",
  }), [isTablet, isMobile]);

  return (
    <div style={styles.page}>
      {/* Top Section with Logo and Navbar */}
      <div style={styles.topSection}>
        {/* Logo */}
        <div style={{ ...styles.logo, justifyContent: isTablet ? "flex-start" : "center", paddingLeft: isTablet ? 16 : 32 }}>
          {isTablet && (
            <button
              type="button"
              aria-label="Toggle navigation"
              style={styles.menuBtn}
              onClick={() => setSidebarOpen((prev) => !prev)}
            >
              <FiMenu size={22} color="#2e236c" />
            </button>
          )}
          <img src={jobLogo} alt="JOBspeedy AI" style={styles.logoImage} />
        </div>
        
        {/* Top Navbar */}
        <nav style={{ ...styles.topNavbar, paddingRight: isMobile ? 16 : 40 }}>
          <div style={styles.topRight}>
            <button 
              style={styles.languageBtn} 
              onClick={toggleLanguage}
              title={t(language, 'common.language')}
            >
              🌐 {language.toUpperCase()}
            </button>
            <span style={styles.topBarItem}>{t(language, 'common.admin')}</span>
            <button style={styles.logoutBtn} onClick={handleButtonClick}>
              {t(language, 'common.logout')}
            </button>
          </div>
        </nav>
      </div>

      {/* Sidebar + Main */}
      <div style={{ ...styles.contentWrapper, flexDirection: isTablet ? "column" : "row" }}>
        {/* Sidebar */}
        <div style={sidebarStyle}>
          {getSidebarItems().map((item) => {
            const routes = {
              "dashboard": "/dashboard",
              "candidates": "/candidates",
              "jobs": "/jobs",
              "ai-tools": "/ai-tools",
              "clients": "/clients"
            };
            const isActive = location.pathname === routes[item.key];
            return (
              <div
                key={item.key}
                style={getSidebarItemStyle(item)}
                onClick={() => handleNavigate(item.key)}
                onMouseOver={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background =
                      "linear-gradient(90deg, rgba(0,178,255,0.15), rgba(0,131,255,0.25))";
                    e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,178,255,0.2)";
                    e.currentTarget.style.color = "#0083FF";
                  }
                }}
                onMouseOut={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.color = "#555";
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 12, width: '100%' }}>
                  {renderIcon(item.key)}
                  <span>{item.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content */}
        {isTablet && sidebarOpen && (
          <div
            style={styles.overlay}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div style={mainStyle}>
          {children}
        </div>
      </div>

      {/* Wave Background */}
      <div style={styles.waveContainer}>
        <img src={waveImg} alt="wave background" style={styles.wave} />
      </div>
    </div>
  );
};

const styles = {
  page: {
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f8f8ff",
    color: "#2e236c",
    minHeight: "100vh",
    position: "relative",
  },
  topSection: {
    display: "flex",
    alignItems: "center",
    background: "white",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    height: "80px",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0px 24px",
    minWidth: "220px",
    height: "100%",
  },
  logoImage: {
    height: 38,
    objectFit: "contain",
  },
  topNavbar: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: "15px 24px",
    flex: 1,
    height: "100%",
  },
  topRight: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  topBarItem: { fontWeight: 500, color: "#2e236c" },
  languageBtn: {
    background: "transparent",
    color: "#2e236c",
    border: "1px solid #ddd",
    borderRadius: "20px",
    padding: "6px 12px",
    cursor: "pointer",
    transition: "all 0.15s ease",
    fontWeight: 500,
    fontSize: "13px",
    whiteSpace: "nowrap",
  },
  logoutBtn: {
    background: "#0477BF",
    color: "#fff",
    border: "none",
    borderRadius: "20px",
    padding: "8px 14px",
    cursor: "pointer",
    transition: "all 0.15s ease",
    fontSize: "13px",
    whiteSpace: "nowrap",
  },
  contentWrapper: { 
    display: "flex", 
    marginTop: "80px",
    minHeight: "calc(100vh - 80px)",
    position: "relative",
  },
  sidebar: { 
    width: "220px", 
    background: "white", 
    padding: "40px 20px 20px 20px", 
    display: "flex", 
    flexDirection: "column", 
    gap: "15px", 
    bottom: 0,
    height: "calc(100vh - 80px)",
    overflowY: "auto",
    boxShadow: "2px 0 8px rgba(0,0,0,0.05)",
    transition: "transform 0.3s ease",
  },
  sidebarItem: {
    cursor: "pointer",
    color: "#555",
    fontWeight: "bold",
    fontSize: "16px",
    textAlign: "left",
    padding: "12px 12px",
    borderRadius: "8px",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
  },
  main: { 
    flex: 1, 
    padding: "40px",
    marginLeft: "220px",
    overflowY: "auto",
    minHeight: "calc(100vh - 80px)",
    transition: "margin 0.3s ease, padding 0.3s ease",
  },
  waveContainer: {
    position: "fixed",
    bottom: 0,
    left: 0,
    width: "100%",
    textAlign: "center",
    zIndex: -1,
    pointerEvents: "none",
  },
  wave: { width: "100%", height: "auto", display: "block" },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    border: "1px solid #e5e5ef",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginRight: 12,
    cursor: "pointer",
  },
  menuLine: {
    width: 20,
    height: 2,
    backgroundColor: "#2e236c",
    borderRadius: 2,
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    zIndex: 1100,
  },
};

export default Layout;
