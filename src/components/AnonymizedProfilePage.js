import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "./Layout";
import { useLanguage } from "../contexts/LanguageContext";
import useMediaQuery from "../hooks/useMediaQuery";
import { apiFetch, apiFetchRaw } from "../utils/api";

const AnonymizedProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isMobile = useMediaQuery("(max-width: 900px)");
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState([]);

  const notSpecified = language === 'de' ? 'Nicht angegeben' : 'Not specified';

  const fetchCandidateData = useCallback(async () => {
    setLoading(true);
    try {
      const [userData, applicationsData] = await Promise.all([
        apiFetch(`/api/users/${id}`),
        apiFetch(`/api/users/${id}/applications`),
      ]);

      const app = applicationsData.applications?.[0];
      const parsedRaw = app?.ai_parsed_data;
      let parsed = parsedRaw;
      if (typeof parsedRaw === "string") {
        try {
          parsed = JSON.parse(parsedRaw);
        } catch (_) {
          parsed = null;
        }
      }

      const yearsLabel = language === 'de' ? 'Jahre' : 'years';
      const skillsList = Array.isArray(parsed?.skills) ? parsed.skills : [];
      setCandidate({
        candidateId: userData.user?.id ? `#CND-${String(userData.user.id).padStart(3, '0')}` : `#CND-${String(id).padStart(3, '0')}`,
        experience: parsed?.experience_years ? `${parsed.experience_years} ${yearsLabel}` : notSpecified,
        education: parsed?.education || notSpecified,
        skills: skillsList,
      });
      setSkills(skillsList);
    } catch (err) {
      console.error("Error fetching candidate data:", err);
    } finally {
      setLoading(false);
    }
  }, [id, language, notSpecified]);

  useEffect(() => {
    fetchCandidateData();
  }, [fetchCandidateData]);

  const handleDownload = async () => {
    try {
      const res = await apiFetchRaw(`/api/users/${id}/anonymized-pdf`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `anonymized_profile_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert((language === 'de' ? 'PDF-Download fehlgeschlagen: ' : 'Failed to download PDF: ') + err.message);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={styles.container}>
          <div style={styles.loading}>{language === 'de' ? 'Anonymisiertes Profil wird geladen...' : 'Loading anonymized profile...'}</div>
        </div>
      </Layout>
    );
  }

  if (!candidate) {
    return (
      <Layout>
        <div style={styles.container}>
          <div style={styles.error}>{language === 'de' ? 'Kandidat nicht gefunden' : 'Candidate not found'}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.mainHeader}>{language === 'de' ? 'Anonymisiertes Profil' : 'Anonymized Profile'}</h2>
          <button style={styles.backBtn} onClick={() => navigate(`/candidates/${id}`)}>
            ← {language === 'de' ? 'Zurück zu Kandidatendetails' : 'Back to Candidate Details'}
          </button>
        </div>

        {/* Profile Info Card */}
        <div style={styles.profileCard}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>📋 {language === 'de' ? 'Profilinformationen' : 'Profile Information'}</h3>
          </div>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>{language === 'de' ? 'Kandidaten-ID:' : 'Candidate ID:'}</span>
              <span style={styles.infoValue}>{candidate.candidateId}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>{language === 'de' ? 'Erfahrung:' : 'Experience:'}</span>
              <span style={styles.infoValue}>{candidate.experience}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>{language === 'de' ? 'Bildung:' : 'Education:'}</span>
              <span style={styles.infoValue}>{candidate.education}</span>
            </div>
          </div>
        </div>

        {/* Skills Card */}
        <div style={styles.skillsCard}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>💼 {language === 'de' ? 'Fähigkeiten' : 'Skills'}</h3>
          </div>
          <div style={styles.skillsContainer}>
            {skills.length > 0 ? (
              skills.map((skill, index) => (
                <span key={index} style={styles.skillBadge}>
                  {skill}
                </span>
              ))
            ) : (
              <span style={styles.noSkills}>{language === 'de' ? 'Keine Fähigkeiten verfügbar' : 'No skills available'}</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          ...styles.actionsCard,
          flexDirection: isMobile ? "column" : "row",
        }}>
          <button style={styles.primaryBtn} onClick={handleDownload}>
            📥 {language === 'de' ? 'PDF herunterladen' : 'Download PDF'}
          </button>
        </div>
      </div>
    </Layout>
  );
};

const styles = {
  container: {
    padding: "20px 0",
  },
  header: {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: "30px",
    gap: "20px",
  },
  mainHeader: {
    fontSize: "28px",
    fontWeight: "bold",
    margin: 0,
    color: "#2e236c",
  },
  backBtn: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    backgroundColor: "white",
    color: "#666",
    fontWeight: "500",
    cursor: "pointer",
    fontSize: "14px",
  },
  profileCard: {
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    marginBottom: "25px",
    overflow: "hidden",
  },
  skillsCard: {
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    marginBottom: "25px",
    overflow: "hidden",
  },
  actionsCard: {
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    padding: "25px",
    display: "flex",
    gap: "15px",
  },
  cardHeader: {
    background: "linear-gradient(135deg, #f8f9ff 0%, #e8ebff 100%)",
    padding: "18px 25px",
    borderBottom: "2px solid #e0e6ff",
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "600",
    margin: 0,
    color: "#2e236c",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
    padding: "25px",
  },
  infoItem: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  infoLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  infoValue: {
    fontSize: "16px",
    fontWeight: "500",
    color: "#2e236c",
  },
  skillsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    padding: "25px",
  },
  skillBadge: {
    padding: "8px 16px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "500",
    backgroundColor: "#e3f2fd",
    color: "#1976d2",
    border: "1px solid #90caf9",
  },
  primaryBtn: {
    flex: 1,
    padding: "14px 28px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#0477BF",
    color: "white",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "15px",
    transition: "all 0.15s ease",
  },
  secondaryBtn: {
    flex: 1,
    padding: "14px 28px",
    borderRadius: "8px",
    border: "2px solid #0477BF",
    backgroundColor: "transparent",
    color: "#0477BF",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "15px",
    transition: "all 0.15s ease",
  },
  loading: {
    textAlign: "center",
    padding: "40px",
    fontSize: "16px",
    color: "#666",
  },
  error: {
    textAlign: "center",
    padding: "40px",
    fontSize: "16px",
    color: "#f44336",
  },
  noSkills: {
    color: "#999",
    fontStyle: "italic",
  },
};

export default AnonymizedProfilePage;
