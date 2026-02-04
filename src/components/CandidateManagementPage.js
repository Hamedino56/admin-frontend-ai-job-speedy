import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./Layout";
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../utils/i18n";
import { apiFetch } from "../utils/api";

const CandidateManagementPage = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [candidates, setCandidates] = useState([]);
  const [allCandidates, setAllCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [applicationCounts, setApplicationCounts] = useState({});

  const normalize = (value = "") => value.toString().toLowerCase();

  const filterCandidates = useCallback((list, query) => {
    const trimmed = query.trim();
    if (!trimmed) return list;
    const q = normalize(trimmed);
    return list.filter(
      (c) =>
        normalize(c.full_name).includes(q) ||
        normalize(c.email).includes(q) ||
        normalize(c.phone || "").includes(q)
    );
  }, []);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const [usersData, applicationsData] = await Promise.all([
        apiFetch("/api/users"),
        apiFetch("/api/applications"),
      ]);

      const users = usersData.users || [];
      const applications = applicationsData.applications || [];

      const counts = applications.reduce((acc, app) => {
        if (!app.user_id) return acc;
        acc[app.user_id] = (acc[app.user_id] || 0) + 1;
        return acc;
      }, {});

      setApplicationCounts(counts);
      setAllCandidates(users);
      setCandidates(filterCandidates(users, search));
    } catch (err) {
      console.error("Error fetching candidates:", err);
    } finally {
      setLoading(false);
    }
  }, [search, filterCandidates]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  useEffect(() => {
    if (!search.trim()) {
      setCandidates(allCandidates);
    }
  }, [search, allCandidates]);

  const handleSearch = () => {
    setCandidates(filterCandidates(allCandidates, search));
  };


  const handleDelete = async (candidateId) => {
    if (!window.confirm(t(language, 'candidates.deleteConfirm'))) return;
    
    try {
      await apiFetch(`/api/users/${candidateId}`, {
        method: "DELETE",
      });
      await fetchCandidates();
    } catch (err) {
      console.error("Error deleting candidate:", err);
      alert(language === 'de' ? 'Löschen des Kandidaten fehlgeschlagen' : 'Failed to delete candidate');
    }
  };

  const handleActionClick = (action, candidateId) => {
    if (action === "View") {
      navigate(`/candidates/${candidateId}`);
    } else if (action === "Anonymize") {
      navigate(`/candidates/${candidateId}/anonymized`);
    } else if (action === "Edit") {
      // TODO: Implement edit modal or navigate to edit page
      alert(`Edit feature coming soon for Candidate ID: ${candidateId}`);
    }
  };

  return (
    <Layout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.mainHeader}>{t(language, 'candidates.title')}</h2>
          <span style={styles.candidateCount}>{candidates.length} {t(language, 'candidates.candidatesCount')}</span>
        </div>

        {/* Search and Filter Bar */}
        <div style={styles.filterBar}>
          <div style={styles.searchGroup}>
            <input
              type="text"
              placeholder={t(language, 'candidates.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              style={styles.searchInput}
            />
            <button style={styles.searchBtn} onClick={handleSearch}>
              🔍 {t(language, 'candidates.search')}
            </button>
            <button style={styles.clearBtn} onClick={() => { setSearch(""); }}>
              {t(language, 'candidates.clear')}
            </button>
          </div>
        </div>

        {/* Candidate Table */}
        {loading ? (
          <div style={styles.loading}>{language === 'de' ? 'Kandidaten werden geladen...' : 'Loading candidates...'}</div>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>{t(language, 'candidates.name')}</th>
                  <th style={styles.th}>{t(language, 'candidates.email')}</th>
                  <th style={styles.th}>{t(language, 'candidates.applications')}</th>
                  <th style={styles.th}>{t(language, 'candidates.joinedDate')}</th>
                  <th style={{...styles.th, textAlign: 'right'}}>{t(language, 'candidates.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {candidates.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={styles.noData}>
                      {t(language, 'candidates.noCandidates')}
                    </td>
                  </tr>
                ) : (
                  candidates.map((c) => (
                    <tr key={c.id} style={styles.tr}>
                      <td style={styles.td}>{c.full_name}</td>
                      <td style={styles.td}>{c.email}</td>
                      <td style={styles.td}>
                        <span style={styles.applicationBadge}>
                          {(applicationCounts[c.id] || 0)} {language === 'de' ? 'Stelle' : 'job'}{(applicationCounts[c.id] || 0) !== 1 ? (language === 'de' ? 'n' : 's') : ''}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {c.created_at ? new Date(c.created_at).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td style={{...styles.td, textAlign: 'right'}}>
                        <div style={styles.actionGroup}>
                          <button
                            style={styles.viewBtn}
                            onClick={() => handleActionClick("View", c.id)}
                            title={language === 'de' ? 'Details ansehen' : 'View Details'}
                          >
                             {t(language, 'candidates.view')}
                          </button>
                          <button
                            style={styles.deleteBtn}
                            onClick={() => handleDelete(c.id)}
                            title={t(language, 'candidates.delete')}
                          >
                            {t(language, 'candidates.delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
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
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },
  mainHeader: { 
    fontSize: "28px", 
    fontWeight: "bold",
    margin: 0,
    color: "#2e236c",
  },
  candidateCount: {
    fontSize: "16px",
    color: "#666",
    fontWeight: 500,
  },
  filterBar: {
    background: "white",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "25px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  searchGroup: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  searchInput: { 
    flex: "1 1 300px",
    padding: "12px 16px", 
    borderRadius: "8px", 
    border: "1px solid #ddd", 
    fontSize: "14px",
    transition: "all 0.2s",
  },
  searchInputFocus: {
    borderColor: "#0477BF",
    outline: "none",
  },
  statusSelect: {
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "14px",
    backgroundColor: "white",
    cursor: "pointer",
    minWidth: "140px",
  },
  searchBtn: { 
    padding: "12px 24px", 
    borderRadius: "8px", 
    border: "none", 
    backgroundColor: "#0477BF", 
    color: "#fff", 
    fontWeight: "600", 
    cursor: "pointer", 
    transition: "all 0.15s ease",
    fontSize: "14px",
  },
  clearBtn: {
    padding: "12px 24px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    backgroundColor: "white",
    color: "#666",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.15s ease",
    fontSize: "14px",
  },
  loading: {
    textAlign: "center",
    padding: "40px",
    fontSize: "16px",
    color: "#666",
  },
  tableContainer: { 
    overflowX: "auto", 
    background: "white", 
    borderRadius: "12px", 
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  table: { 
    width: "100%", 
    borderCollapse: "separate",
    borderSpacing: 0,
  },
  th: {
    padding: "16px",
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
    padding: "16px", 
    borderBottom: "1px solid #f0f0f0",
    fontSize: "14px",
  },
  noData: {
    textAlign: "center",
    padding: "40px",
    color: "#999",
  },
  skillsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
    alignItems: "center",
  },
  skillTag: {
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    backgroundColor: "#e3f2fd",
    color: "#1976d2",
    fontWeight: 500,
  },
  moreSkills: {
    fontSize: "12px",
    color: "#666",
    fontStyle: "italic",
  },
  scoreBadge: {
    padding: "4px 12px",
    borderRadius: "12px",
    color: "white",
    fontSize: "12px",
    fontWeight: "600",
  },
  statusBadge: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "none",
    color: "white",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  actionGroup: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  viewBtn: { 
    padding: "6px 12px", 
    borderRadius: "6px", 
    border: "none", 
    backgroundColor: "#0477BF", 
    color: "white", 
    fontWeight: "500", 
    cursor: "pointer", 
    transition: "all 0.15s ease",
    fontSize: "13px",
  },
  editBtn: {
    padding: "6px 10px",
    borderRadius: "6px",
    border: "1px solid #0477BF",
    backgroundColor: "transparent",
    color: "#0477BF",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.15s ease",
    fontSize: "13px",
  },
  deleteBtn: {
    padding: "6px 10px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#f44336",
    color: "white",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  applicationBadge: {
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: "600",
    backgroundColor: "#e3f2fd",
    color: "#1976d2",
  },
  activeStatus: {
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "600",
    backgroundColor: "#c8e6c9",
    color: "#2e7d32",
  },
  inactiveStatus: {
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "600",
    backgroundColor: "#fff3e0",
    color: "#e65100",
  },
};

export default CandidateManagementPage;
