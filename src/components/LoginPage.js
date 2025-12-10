import React, { useMemo, useState } from "react";
import backgroundImg from "../assets/background.png";
import waveImg from "../assets/wave.png";
import jobLogo from "../assets/job_logo.png";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../utils/i18n";
import useMediaQuery from "../hooks/useMediaQuery";
import { apiFetch } from "../utils/api";

const LoginPage = () => {
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch("/api/auth/login-admin", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      // Store token if provided
      const token = data.token || data.accessToken || data.authToken || data.data?.token;
      if (token) {
        try {
          localStorage.setItem('authToken', token);
          localStorage.setItem('token', token);
        } catch (_) {}
      }
      // Mark authenticated so navbar and upload gate recognize login
      try {
        localStorage.setItem('isAuthenticated', 'true');
        window.dispatchEvent(new Event('storage'));
      } catch (_) {}
      // Navigate to dashboard
      navigate("/dashboard");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    setResetError("");
    setResetSuccess("");
    setResetEmail("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetSuccess("");
    
    if (!resetEmail || !newPassword || !confirmPassword) {
      setResetError(language === 'de' ? 'Alle Felder sind erforderlich' : 'All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError(language === 'de' ? 'Passwörter stimmen nicht überein' : 'Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setResetError(language === 'de' ? 'Passwort muss mindestens 6 Zeichen lang sein' : 'Password must be at least 6 characters long');
      return;
    }

    setResetLoading(true);
    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ 
          email: resetEmail, 
          newPassword: newPassword 
        }),
      });

      setResetSuccess(language === 'de' ? 'Passwort erfolgreich aktualisiert' : 'Password successfully updated');
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetEmail("");
        setNewPassword("");
        setConfirmPassword("");
      }, 2000);
    } catch (e) {
      setResetError(e.message);
    } finally {
      setResetLoading(false);
    }
  };

  const isTablet = useMediaQuery("(max-width: 1024px)");
  const isMobile = useMediaQuery("(max-width: 640px)");

  const responsive = useMemo(() => ({
    page: {
      ...styles.page,
      flexDirection: isTablet ? "column" : "row",
      minHeight: "100vh",
      height: "auto",
      paddingTop: isTablet ? "60px" : 0,
    },
    leftSection: {
      ...styles.leftSection,
      display: isTablet ? "none" : "flex",
    },
    rightSection: {
      ...styles.rightSection,
      flex: isTablet ? "unset" : 1,
      width: "100%",
      minHeight: isTablet ? "auto" : "100vh",
      padding: isTablet ? "40px 20px 80px" : 0,
    },
    formBox: {
      ...styles.formBox,
      width: isMobile ? "100%" : isTablet ? "90%" : "350px",
      padding: isMobile ? "30px 20px" : "40px",
      boxShadow: isTablet ? "0 10px 30px rgba(0,0,0,0.1)" : "none",
    },
  }), [isTablet, isMobile]);

  return (
    <div style={responsive.page}>
      {/* Language Switcher */}
      <button 
        style={styles.languageBtn} 
        onClick={toggleLanguage}
        title={t(language, 'common.language')}
      >
        🌐 {language.toUpperCase()}
      </button>

      {/* Left Side */}
      <div style={responsive.leftSection}>
        <img src={jobLogo} alt="JOBspeedy AI" style={styles.logoImage} />
        <p style={styles.quote}>
          {t(language, 'login.quote')}
        </p>
      </div>

      {/* Right Side - Login Form */}
      <div style={responsive.rightSection}>
        <div style={responsive.formBox}>
          <h2 style={styles.formTitle}>{t(language, 'login.title')}</h2>

          <div style={styles.formGroup}>
            <label style={styles.label}>{t(language, 'login.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="example@email.com"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>{t(language, 'login.password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="********"
            />
          </div>

          <div style={styles.forgotPassword}>
            <button type="button" style={styles.forgotLink} onClick={handleForgotPassword}>
              {language === 'de' ? 'Passwort vergessen?' : 'Forgot Password?'}
            </button>
          </div>

          <button style={styles.loginBtn} onClick={handleLogin}>
            {loading ? "LOADING..." : t(language, 'login.login')}
          </button>
          {error && (
            <div style={{ color: "#b00020", marginTop: "10px", fontSize: "12px" }}>
              {error}
            </div>
          )}

          <div style={styles.register}>
            {t(language, 'login.dontHaveAccount')}{" "}
            <Link to="/register" style={styles.registerLink}>
              {t(language, 'login.signUp')}
            </Link>
          </div>
        </div>
      </div>

      {/* Background Image */}
      <img src={backgroundImg} alt="Background" style={styles.background} />
      {/* Wave */}
      <div style={styles.waveContainer}>
        <img src={waveImg} alt="wave background" style={styles.wave} />
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div style={styles.modalOverlay} onClick={() => setShowForgotPassword(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {language === 'de' ? 'Passwort zurücksetzen' : 'Reset Password'}
              </h3>
              <button 
                style={styles.closeBtn} 
                onClick={() => setShowForgotPassword(false)}
                title={language === 'de' ? 'Schließen' : 'Close'}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleResetPassword}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  {language === 'de' ? 'Admin E-Mail' : 'Admin Email'}
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  style={styles.input}
                  placeholder="admin@example.com"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  {language === 'de' ? 'Neues Passwort' : 'New Password'}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={styles.input}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  {language === 'de' ? 'Passwort bestätigen' : 'Confirm Password'}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={styles.input}
                  placeholder="••••••••"
                  required
                />
              </div>

              {resetError && (
                <div style={styles.errorMessage}>
                  {resetError}
                </div>
              )}

              {resetSuccess && (
                <div style={styles.successMessage}>
                  {resetSuccess}
                </div>
              )}

              <div style={styles.modalActions}>
                <button 
                  type="submit" 
                  style={styles.resetBtn}
                  disabled={resetLoading}
                >
                  {resetLoading 
                    ? (language === 'de' ? 'Wird gespeichert...' : 'Saving...') 
                    : (language === 'de' ? 'Passwort zurücksetzen' : 'Reset Password')
                  }
                </button>
                <button 
                  type="button" 
                  style={styles.cancelBtn}
                  onClick={() => setShowForgotPassword(false)}
                >
                  {language === 'de' ? 'Abbrechen' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  page: {
    display: "flex",
    height: "100vh",
    overflow: "hidden",
    fontFamily: "'Poppins', sans-serif",
    position: "relative",
    backgroundColor: "#f6f7ff",
  },
  languageBtn: {
    position: "absolute",
    top: "20px",
    right: "20px",
    zIndex: 1000,
    background: "white",
    color: "#2e236c",
    border: "1px solid #ddd",
    borderRadius: "25px",
    padding: "8px 16px",
    cursor: "pointer",
    transition: "all 0.15s ease",
    fontWeight: 500,
    fontSize: "14px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  background: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    zIndex: -1,
    opacity: 0.25,
  },
  waveContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    textAlign: "center",
    zIndex: -1,
    pointerEvents: "none",
  },
  wave: { width: "100%", height: "auto", display: "block" },
  leftSection: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    color: "#3b2e91",
    textAlign: "center",
    padding: "40px",
  },
  logoImage: {
    width: "70%",
    maxWidth: "260px",
    marginBottom: "20px",
  },
  quote: {
    fontSize: "16px",
    lineHeight: "1.6",
    letterSpacing: "1px",
    fontWeight: "600",
    color: "#2e236c",
    maxWidth: "320px",
  },
  rightSection: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f6f7ff",
  },
  formBox: {
    backgroundColor: "#ffffff",
    padding: "40px",
    borderRadius: "16px",
    width: "350px",
    color: "#1b1b3a",
    boxShadow: "0 10px 40px rgba(15, 23, 42, 0.12)",
  },
  formTitle: {
    fontSize: "26px",
    fontWeight: "700",
    marginBottom: "30px",
    color: "#1b1b3a",
    textAlign: "center",
  },
  formGroup: { marginBottom: "20px" },
  label: {
    display: "block",
    fontSize: "12px",
    letterSpacing: "1px",
    fontWeight: "600",
    color: "#1b1b3a",
    marginBottom: "8px",
  },
  input: {
    width: "100%",
    padding: "10px 0",
    border: "none",
    borderBottom: "1px solid #1b1b3a",
    background: "transparent",
    fontSize: "14px",
    outline: "none",
  },
  forgotPassword: {
    textAlign: "right",
    marginBottom: "25px",
  },
  forgotLink: {
    fontSize: "12px",
    color: "#1b1b3a",
    textDecoration: "none",
    background: "none",
    border: "none",
    cursor: "pointer",
  },
  loginBtn: {
    backgroundColor: "#0477BF",
    color: "#fff",
    border: "none",
    borderRadius: "30px",
    padding: "12px 0",
    width: "100%",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
  },
  register: {
    marginTop: "20px",
    textAlign: "center",
    fontSize: "13px",
  },
  registerLink: {
    color: "#0477BF",
    fontWeight: "600",
    textDecoration: "none",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "30px",
    width: "90%",
    maxWidth: "450px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
  },
  modalTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#1b1b3a",
    margin: 0,
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "32px",
    color: "#666",
    cursor: "pointer",
    padding: 0,
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: "1",
  },
  errorMessage: {
    color: "#b00020",
    fontSize: "13px",
    marginTop: "10px",
    marginBottom: "10px",
    padding: "8px",
    backgroundColor: "#ffebee",
    borderRadius: "4px",
  },
  successMessage: {
    color: "#2e7d32",
    fontSize: "13px",
    marginTop: "10px",
    marginBottom: "10px",
    padding: "8px",
    backgroundColor: "#e8f5e9",
    borderRadius: "4px",
  },
  modalActions: {
    display: "flex",
    gap: "10px",
    marginTop: "20px",
  },
  resetBtn: {
    flex: 1,
    backgroundColor: "#0477BF",
    color: "#fff",
    border: "none",
    borderRadius: "30px",
    padding: "12px 0",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    color: "#666",
    border: "1px solid #ddd",
    borderRadius: "30px",
    padding: "12px 0",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
  },
};

export default LoginPage;
