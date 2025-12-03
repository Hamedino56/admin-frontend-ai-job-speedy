import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "./Layout";
import { useLanguage } from "../contexts/LanguageContext";
import useMediaQuery from "../hooks/useMediaQuery";
import { apiFetch } from "../utils/api";

const CandidateDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isMobile = useMediaQuery("(max-width: 900px)");

  const [candidate, setCandidate] = useState(null);
  const [applications, setApplications] = useState([]);
  const [selectedAppIdx, setSelectedAppIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [selectedResumeUrl, setSelectedResumeUrl] = useState(null);

  const fetchCandidateDetails = useCallback(async () => {
    setLoading(true);
    try {
      const [userData, applicationsData] = await Promise.all([
        apiFetch(`/api/users/${id}`),
        apiFetch(`/api/users/${id}/applications`),
      ]);

      setCandidate(userData.user);
      setApplications(Array.isArray(applicationsData.applications) ? applicationsData.applications : []);
    } catch (err) {
      console.error("Error fetching candidate details:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCandidateDetails();
  }, [fetchCandidateDetails]);

  const handleButtonClick = (action) => {
    if (action === "Anonymize") {
      navigate(`/candidates/${id}/anonymized`);
    }
  };

  const handleViewResume = (resumeUrl) => {
    if (!resumeUrl) return;
    setSelectedResumeUrl(resumeUrl);
    setShowResumeModal(true);
  };

  if (loading) {
    return (
      <Layout>
        <div style={styles.loading}>{language === 'de' ? 'Kandidatendetails werden geladen...' : 'Loading candidate details...'}</div>
      </Layout>
    );
  }

  if (!candidate) {
    return (
      <Layout>
        <div style={styles.error}>{language === 'de' ? 'Kandidat nicht gefunden' : 'Candidate not found'}</div>
      </Layout>
    );
  }

  const selectedApplication = applications[selectedAppIdx] || null;
  const parsedDataRaw = selectedApplication?.ai_parsed_data;
  let parsedData = parsedDataRaw;
  if (typeof parsedDataRaw === "string") {
    try {
      parsedData = JSON.parse(parsedDataRaw);
    } catch (_) {
      parsedData = null;
    }
  }

  return (
    <Layout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.mainHeader}>{language === 'de' ? 'Kandidatendetails' : 'Candidate Details'}</h2>
          <button style={styles.backBtn} onClick={() => navigate("/candidates")}>
            ← {language === 'de' ? 'Zurück zu Kandidaten' : 'Back to Candidates'}
          </button>
        </div>

        {/* Header Buttons */}
        <div style={styles.headerButtons}>
          <button
            style={styles.actionBtn}
            onClick={() => handleButtonClick("Anonymize")}
          >
            {language === 'de' ? 'Anonymisiertes Profil' : 'Anonymized Profile'}
          </button>
        </div>

        {/* Profile Info */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>{language === 'de' ? 'Profilinformationen' : 'Profile Information'}</h3>
          <div style={styles.infoGrid}>
            <div>
              <span style={styles.label}>{language === 'de' ? 'Name:' : 'Name:'}</span>
              <span style={styles.value}>{candidate.full_name}</span>
            </div>
            <div>
              <span style={styles.label}>{language === 'de' ? 'E-Mail:' : 'Email:'}</span>
              <span style={styles.value}>{candidate.email}</span>
            </div>
            <div>
              <span style={styles.label}>{language === 'de' ? 'Telefon:' : 'Phone:'}</span>
              <span style={styles.value}>{candidate.phone || (language === 'de' ? 'Nicht angegeben' : 'Not provided')}</span>
            </div>
          </div>
        </div>

        {/* Applications */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>{language === 'de' ? 'Bewerbungen' : 'Applications'}</h3>
          {applications.length === 0 ? (
            <p style={styles.noData}>{language === 'de' ? 'Keine Bewerbungen gefunden' : 'No applications found'}</p>
          ) : (
            <div style={{
              ...styles.appsLayout,
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            }}>
              <div style={styles.appsList}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>{language === 'de' ? 'Stelle' : 'Job'}</th>
                      <th style={styles.th}>{language === 'de' ? 'Bewerbungsdatum' : 'Applied Date'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((a, idx) => {
                      const appId = a.application_id || a.id;
                      const appliedDate = a.application_date || a.created_at;
                      return (
                        <tr key={appId} style={{ ...styles.tr, cursor: "pointer", background: idx === selectedAppIdx ? "#eef6ff" : "transparent" }} onClick={() => setSelectedAppIdx(idx)}>
                          <td style={styles.td}>{a.job_title || a.job?.title || '—'}</td>
                          <td style={styles.td}>{appliedDate ? new Date(appliedDate).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={styles.appDetail}>
                {selectedApplication ? (
                  <>
                    <div style={styles.detailSection}>
                      <h4 style={styles.detailTitle}>{language === 'de' ? 'Stellentitel' : 'Job Title'}</h4>
                      <p style={styles.detailText}>{selectedApplication.job_title || selectedApplication.job?.title || '—'}</p>
                    </div>
                    
                    <div style={styles.detailSection}>
                      <h4 style={styles.detailTitle}>{language === 'de' ? 'Stellenbeschreibung' : 'Job Description'}</h4>
                      <p style={styles.detailText}>{selectedApplication.job_description || selectedApplication.job?.description || 'N/A'}</p>
                    </div>
                    
                    <div style={styles.detailSection}>
                      <h4 style={styles.detailTitle}>{language === 'de' ? 'Lebenslauf' : 'Resume'}</h4>
                      {selectedApplication.resume_url ? (
                        <button
                          style={styles.viewResumeBtn}
                          onClick={() => handleViewResume(selectedApplication.resume_url)}
                        >
                          📄 {language === 'de' ? 'Lebenslauf ansehen' : 'View Resume'}
                        </button>
                      ) : (
                        <p style={styles.noData}>{language === 'de' ? 'Kein Lebenslauf hochgeladen' : 'No resume uploaded'}</p>
                      )}
                    </div>
                    
                    <div style={styles.detailSection}>
                      <h4 style={styles.detailTitle}>{language === 'de' ? 'KI-Analyse Daten' : 'AI Parsed Data'}</h4>
                      {parsedData ? (
                        <div style={styles.aiParsedData}>
                          {parsedData.skills && Array.isArray(parsedData.skills) && (
                            <div style={styles.aiField}>
                              <strong style={styles.aiLabel}>{language === 'de' ? 'Fähigkeiten:' : 'Skills:'}</strong>
                              <div style={styles.skillsContainer}>
                                {parsedData.skills.map((skill, idx) => (
                                  <span key={idx} style={styles.skillTag}>{skill}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {parsedData.experience_years && (
                            <div style={styles.aiField}>
                              <strong style={styles.aiLabel}>{language === 'de' ? 'Erfahrung:' : 'Experience:'}</strong>
                              <span style={styles.aiValue}>{parsedData.experience_years} {language === 'de' ? 'Jahre' : 'years'}</span>
                            </div>
                          )}
                          
                          {parsedData.education && (
                            <div style={styles.aiField}>
                              <strong style={styles.aiLabel}>{language === 'de' ? 'Bildung:' : 'Education:'}</strong>
                              <span style={styles.aiValue}>{parsedData.education}</span>
                            </div>
                          )}
                          
                          {parsedData.summary && (
                            <div style={styles.aiField}>
                              <strong style={styles.aiLabel}>{language === 'de' ? 'Zusammenfassung:' : 'Summary:'}</strong>
                              <p style={styles.aiValue}>{parsedData.summary}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p style={styles.noData}>{language === 'de' ? 'Keine KI-Analysedaten verfügbar' : 'No AI parsed data available'}</p>
                      )}
                    </div>
                  </>
                ) : (
                  <p style={styles.noData}>{language === 'de' ? 'Wählen Sie eine Bewerbung aus, um Details anzuzeigen' : 'Select an application to view details'}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Resume Modal */}
        {showResumeModal && selectedResumeUrl && (
          <div style={styles.modalOverlay} onClick={() => setShowResumeModal(false)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>{language === 'de' ? 'Lebenslauf anzeigen' : 'Resume View'}</h3>
                <button style={styles.closeModalBtn} onClick={() => setShowResumeModal(false)}>
                  ✕
                </button>
              </div>
              <iframe
                src={selectedResumeUrl}
                style={styles.pdfViewer}
                title={language === 'de' ? 'Lebenslauf PDF' : 'Resume PDF'}
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

const styles = {
  container: { padding: "20px 0" },
  header: { display: "flex", justifyContent: "flex-start", alignItems: "center", marginBottom: "30px", gap: "20px" },
  mainHeader: { fontSize: "28px", fontWeight: "bold", margin: 0, color: "#2e236c" },
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
  headerButtons: { display: "flex", gap: "15px", marginBottom: "30px" },
  actionBtn: { padding: "10px 20px", borderRadius: "8px", border: "none", backgroundColor: "#0477BF", color: "white", fontWeight: "bold", cursor: "pointer", transition: "all 0.15s ease" },
  section: { background: "white", padding: "25px", borderRadius: "12px", marginBottom: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  sectionTitle: { fontSize: "18px", fontWeight: "600", marginBottom: "20px", color: "#2e236c" },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "15px",
  },
  label: { display: "block", fontSize: "13px", fontWeight: "600", color: "#666", marginBottom: "4px" },
  value: { display: "block", fontSize: "15px", color: "#2e236c", fontWeight: "500" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    padding: "12px 16px",
    textAlign: "left",
    fontWeight: "600",
    fontSize: "14px",
    color: "#2e236c",
    borderBottom: "2px solid #e0e0e0",
    backgroundColor: "#f8f9fa",
  },
  tr: {
    transition: "background-color 0.15s",
  },
  td: {
    padding: "12px 16px",
    borderBottom: "1px solid #f0f0f0",
    fontSize: "14px",
  },
  appsLayout: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
  appsList: { overflowX: "auto" },
  appDetail: { background: "#f9fbff", padding: "20px", borderRadius: "8px", border: "1px solid #e6eefb" },
  detailSection: { marginBottom: "25px" },
  detailTitle: { fontSize: "16px", fontWeight: "600", color: "#2e236c", marginBottom: "10px", marginTop: 0 },
  detailText: { fontSize: "14px", color: "#555", lineHeight: "1.6", margin: 0 },
  viewResumeBtn: {
    padding: "10px 20px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#0477BF",
    color: "white",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "14px",
    transition: "all 0.15s ease",
  },
  aiParsedData: { display: "flex", flexDirection: "column", gap: "15px" },
  aiField: { display: "flex", flexDirection: "column", gap: "8px" },
  aiLabel: { fontSize: "14px", fontWeight: "600", color: "#666" },
  aiValue: { fontSize: "14px", color: "#555", margin: 0 },
  skillsContainer: { display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "5px" },
  skillTag: {
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "13px",
    backgroundColor: "#e3f2fd",
    color: "#1976d2",
    fontWeight: "500",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: "12px",
    width: "90%",
    height: "90%",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px",
    borderBottom: "1px solid #e0e0e0",
  },
  modalTitle: { fontSize: "20px", fontWeight: "600", margin: 0, color: "#2e236c" },
  closeModalBtn: {
    background: "none",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: "#666",
    padding: 0,
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  pdfViewer: {
    width: "100%",
    height: "100%",
    border: "none",
    flex: 1,
  },
  loading: { textAlign: "center", padding: "40px", fontSize: "16px", color: "#666" },
  error: { textAlign: "center", padding: "40px", fontSize: "16px", color: "#f44336" },
  noData: { color: "#999", fontStyle: "italic" },
};

export default CandidateDetailPage;
