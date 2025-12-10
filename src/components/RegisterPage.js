import React, { useMemo, useState } from "react";
import backgroundImg from "../assets/background.png";
import waveImg from "../assets/wave.png";
import jobLogo from "../assets/job_logo.png";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../utils/i18n";
import useMediaQuery from "../hooks/useMediaQuery";
import { apiFetch } from "../utils/api";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (!agree) {
      alert(language === 'de' ? 'Bitte stimmen Sie den Allgemeinen Geschäftsbedingungen zu.' : 'Please agree to the terms & conditions.');
      return;
    }
    setError("");
    setLoading(true);
    try {
      const payload = { email: String(email).trim().toLowerCase(), password };
      const data = await apiFetch("/api/auth/register-admin", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      // Store token if provided
      const token = data.token || data.accessToken || data.authToken || data.data?.token;
      if (token) {
        try {
          localStorage.setItem('authToken', token);
          localStorage.setItem('token', token);
        } catch (_) {}
      }
      try {
        localStorage.setItem('isAuthenticated', 'true');
        window.dispatchEvent(new Event('storage'));
      } catch (_) {}
      navigate("/dashboard");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const isTablet = useMediaQuery("(max-width: 1024px)");
  const isMobile = useMediaQuery("(max-width: 640px)");

  const responsive = useMemo(() => ({
    page: {
      ...styles.page,
      flexDirection: isTablet ? "column" : "row",
      minHeight: "100vh",
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
          {t(language, 'register.quote')}
        </p>
      </div>

      {/* Right Side - Sign Up Form */}
      <div style={responsive.rightSection}>
        <div style={responsive.formBox}>
          <h2 style={styles.formTitle}>{t(language, 'register.title')}</h2>

          <div style={styles.formGroup}>
            <label style={styles.label}>{t(language, 'register.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="Enter your email"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>{t(language, 'register.password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="********"
            />
          </div>

          <div style={styles.checkboxGroup}>
            <input
              type="checkbox"
              checked={agree}
              onChange={() => setAgree(!agree)}
              style={{ marginRight: "8px" }}
            />
            <span style={styles.checkboxText}>
              {t(language, 'register.agreeTerms')}
            </span>
          </div>

          <div style={styles.buttonGroup}>
            <button style={styles.signupBtn} onClick={handleRegister}>
              {loading ? "SAVING..." : t(language, 'register.register')}
            </button>
            <Link to="/login" style={styles.loginBtn}>
              {t(language, 'register.login')}
            </Link>
          </div>
          {error && (
            <div style={{ color: "#b00020", marginTop: "10px", fontSize: "12px", textAlign: "center" }}>
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Background Image */}
      <img src={backgroundImg} alt="Background" style={styles.background} />
      {/* Wave */}
      <div style={styles.waveContainer}>
        <img src={waveImg} alt="wave background" style={styles.wave} />
      </div>
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
  checkboxGroup: {
    display: "flex",
    alignItems: "center",
    marginBottom: "25px",
  },
  checkboxText: {
    fontSize: "12px",
    color: "#1b1b3a",
  },
  buttonGroup: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
  },
  signupBtn: {
    backgroundColor: "#0477BF",
    color: "#fff",
    border: "none",
    borderRadius: "30px",
    padding: "12px 0",
    width: "50%",
    cursor: "pointer",
    fontWeight: "600",
  },
  loginBtn: {
    border: "2px solid #0477BF",
    borderRadius: "30px",
    padding: "10px 0",
    width: "50%",
    textAlign: "center",
    color: "#0477BF",
    fontWeight: "600",
    textDecoration: "none",
  },
};

export default RegisterPage;
