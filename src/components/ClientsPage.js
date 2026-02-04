import React, { useEffect, useState, useCallback } from "react";
import Layout from "./Layout";
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../utils/i18n";
import { apiFetch } from "../utils/api";

const ClientsPage = () => {
  const { language } = useLanguage();
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ company: "", contact_person: "", email: "" });
  const [search, setSearch] = useState("");

  const fetchClients = useCallback(async () => {
    try {
      const data = await apiFetch('/api/clients');
      setClients(data.clients || []);
    } catch (_) {
      // Error handled silently
    }
  }, []);

  useEffect(() => { 
    fetchClients(); 
  }, [fetchClients]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/clients${editing ? '/' + editing.id : ''}`, {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify(formData),
      });
      setShowForm(false); setEditing(null); setFormData({ company: "", contact_person: "", email: "" });
      await fetchClients();
    } catch (e2) { alert(e2.message); }
  };

  const normalized = (v) => (v || "").toString().toLowerCase();
  const displayedClients = clients.filter((c) => {
    if (!search.trim()) return true;
    const q = normalized(search);
    return (
      normalized(c.company).includes(q) ||
      normalized(c.contact_person).includes(q) ||
      normalized(c.email).includes(q)
    );
  });

  const handleDelete = async (id) => {
    if (!window.confirm(language === 'de' ? 'Diesen Kunden löschen?' : 'Delete this client?')) return;
    try {
      await apiFetch(`/api/clients/${id}`, { method: 'DELETE' });
      await fetchClients();
    } catch (e) { alert(e.message); }
  };

  return (
    <Layout>
      <>
        <div style={styles.headerRow}>
          <h2 style={styles.mainHeader}>{t(language, 'clients.title')}</h2>
          <button style={styles.addBtn} onClick={() => { setEditing(null); setFormData({ company: "", contact_person: "", email: "" }); setShowForm(true); }}>
            + {t(language, 'clients.addClient')}
          </button>
        </div>

        {/* Search aligned to the right half */}
        <div style={styles.searchRow}>
          <div style={styles.searchGroup}>
            <input
              type="text"
              placeholder={language === 'de' ? 'Nach Unternehmen, Kontakt oder E-Mail suchen...' : 'Search by company, contact, or email...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
              style={styles.searchInput}
            />
            <button style={styles.searchBtn} onClick={() => setSearch(search)}>{t(language, 'clients.search')}</button>
          </div>
        </div>

        {/* Add Client Form */}
        {showForm && (
          <div style={styles.formContainer}>
            <h3 style={styles.formHeader}>{language === 'de' ? 'Neuen Kunden hinzufügen' : 'Add New Client'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={styles.formRow}>
                <input
                  type="text"
                          name="company"
                          placeholder={`${t(language, 'clients.company')} *`}
                          value={formData.company}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder={`${t(language, 'clients.email')} *`}
                  value={formData.email}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formRow}>
                        <input type="text" name="contact_person" placeholder={t(language, 'clients.contactPerson')} value={formData.contact_person} onChange={handleInputChange} style={styles.input} />
              </div>
              <div style={styles.formActions}>
                <button type="submit" style={styles.submitBtn}>
                          {editing ? (language === 'de' ? 'Änderungen speichern' : 'Save Changes') : t(language, 'clients.addClient')}
                </button>
                        <button type="button" onClick={() => setShowForm(false)} style={styles.cancelBtn}>
                  {t(language, 'jobs.cancel')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* removed old search bar */}

        {/* Clients Table */}
        <div style={styles.tableContainer}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.headerRowStrip}>
                        <th style={{...styles.th, width: '32%'}}>{t(language, 'clients.company')}</th>
                        <th style={{...styles.th, width: '22%'}}>{t(language, 'clients.contactPerson')}</th>
                        <th style={{...styles.th, width: '28%'}}>{t(language, 'clients.email')}</th>
                        <th style={{...styles.th, width: '10%', textAlign: 'center'}}>{t(language, 'clients.totalJobs')}</th>
                        <th style={{...styles.th, width: '8%', textAlign: 'right'}}>{t(language, 'clients.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedClients.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ ...styles.td, textAlign: 'center', color: '#999' }}>
                            {t(language, 'clients.noClients')}
                          </td>
                        </tr>
                      ) : displayedClients.map((c) => (
                        <tr key={c.id} style={styles.row}>
                          <td style={styles.td}><div style={styles.cellTitle}>{c.company}</div></td>
                          <td style={styles.td}>{c.contact_person || '—'}</td>
                          <td style={styles.td}><a href={`mailto:${c.email || ''}`} style={styles.link}>{c.email || '—'}</a></td>
                          <td style={{...styles.td, textAlign: 'center'}}>
                            <span style={styles.countPill}>{c.jobs_count || 0}</span>
                          </td>
                          <td style={{...styles.td}}>
                            <div style={styles.actionsCell}>
                              <button style={styles.actionBtn} onClick={() => { setEditing(c); setFormData({ company: c.company, contact_person: c.contact_person || '', email: c.email || '' }); setShowForm(true); }}>{t(language, 'clients.edit')}</button>
                              <button style={styles.dangerBtn} onClick={() => handleDelete(c.id)}>{t(language, 'clients.delete')}</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
        </div>
      </>
    </Layout>
  );
};

const styles = {
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    gap: "12px",
    flexWrap: "wrap",
  },
  searchRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '12px'
  },
  searchGroup: {
    display: 'flex',
    gap: '10px',
    width: '100%',
    maxWidth: 520,
    flexWrap: 'wrap'
  },
  searchInput: { flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' },
  searchBtn: { padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#0477BF', color: '#fff', fontWeight: 600, cursor: 'pointer' },
  mainHeader: { fontSize: "24px", fontWeight: "bold" },
  addBtn: {
    padding: "10px 20px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#0477BF",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  formContainer: {
    background: "white",
    padding: "25px",
    borderRadius: "12px",
    marginBottom: "30px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
  formHeader: {
    fontSize: "20px",
    fontWeight: "bold",
    marginBottom: "20px",
  },
  formRow: {
    display: "flex",
    gap: "15px",
    flexWrap: "wrap",
    marginBottom: "15px",
  },
  input: {
    flex: 1,
    minWidth: 220,
    padding: "10px 15px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "16px",
  },
  formActions: {
    display: "flex",
    gap: "15px",
    marginTop: "20px",
  },
  submitBtn: {
    padding: "10px 25px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#0477BF",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
  cancelBtn: {
    padding: "10px 25px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    backgroundColor: "white",
    color: "#666",
    fontWeight: "bold",
    cursor: "pointer",
  },
  
  tableContainer: {
    overflowX: "auto",
    background: "white",
    borderRadius: "12px",
    padding: "16px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
  table: { width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: "16px" },
  headerRowStrip: { background: "#f8f9fb" },
  th: { textAlign: 'left', padding: '14px 16px', fontSize: 14, color: '#2e236c' },
  td: { padding: '14px 16px', fontSize: 14, color: '#333', verticalAlign: 'middle' },
  statusBadge: {
    padding: "5px 12px",
    borderRadius: "15px",
    color: "white",
    fontSize: "14px",
    fontWeight: "bold",
  },
  row: { transition: 'background 0.15s', borderBottom: '1px solid #f0f0f0' },
  cellTitle: { fontWeight: 600, color: '#2e236c' },
  actionBtn: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "1px solid #0477BF",
    backgroundColor: "transparent",
    color: "#0477BF",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  dangerBtn: { padding: "6px 12px", borderRadius: "6px", border: "none", backgroundColor: "#f44336", color: "white", fontWeight: "bold", cursor: "pointer" },
  actionsCell: { display: 'flex', justifyContent: 'flex-end', gap: 8 },
  link: { color: '#2e236c', textDecoration: 'none' },
  badge: { background: "#eef2ff", color: "#3347b0", padding: "4px 10px", borderRadius: 14, fontSize: 12, fontWeight: 600 },
  countPill: { background: '#eef2ff', color: '#3347b0', padding: '6px 10px', borderRadius: 12, display: 'inline-block', minWidth: 26, textAlign: 'center', fontWeight: 700 },
};

export default ClientsPage;

