import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./Layout";
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../utils/i18n";
import { apiFetch } from "../utils/api";
import useMediaQuery from "../hooks/useMediaQuery";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [stats, setStats] = useState({
    totalCandidates: 0,
    totalJobs: 0,
    activeClients: 0,
    totalApplications: 0,
  });
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");
  const [distribution, setDistribution] = useState(null);
  const isMobile = useMediaQuery("(max-width: 900px)");

  // Transform API trend data to chart format
  // Backend returns: [{date: "2024-11-25", count: 12}, ...]
  const transformTrendData = useCallback((trendArray = []) => {
    if (!trendArray || !Array.isArray(trendArray) || trendArray.length === 0) {
      return [];
    }
    
    return trendArray.map((item) => {
      // Handle both formats: {date, count} or {date, applications}
      const dateStr = item.date || item.dateString || "";
      const count = Number(item.count || item.applications || 0);
      
      if (!dateStr) {
        console.warn("Invalid trend item (missing date):", item);
        return null;
      }

      try {
        const date = new Date(dateStr);
        if (Number.isNaN(date.getTime())) {
          console.warn("Invalid date format:", dateStr);
          return null;
        }

        return {
          date: dateStr,
          applications: count,
          label: date.toLocaleDateString(language === "de" ? "de-DE" : "en-US", {
            month: "short",
            day: "numeric",
          }),
        };
      } catch (err) {
        console.warn("Error parsing date:", dateStr, err);
        return null;
      }
    }).filter(item => item !== null); // Remove invalid items
  }, [language]);

  // Fallback: Aggregate weekly applications from raw data (backward compatibility)
  const aggregateWeeklyApplications = useCallback((applications = []) => {
    const buckets = new Map();
    applications.forEach((app) => {
      const raw =
        app.created_at ||
        app.applied_at ||
        app.application_date ||
        app.updated_at;
      if (!raw) return;
      const date = new Date(raw);
      if (Number.isNaN(date.getTime())) return;
      const weekStart = new Date(date);
      const day = weekStart.getDay();
      weekStart.setHours(0, 0, 0, 0);
      weekStart.setDate(weekStart.getDate() - day);
      const key = weekStart.toISOString().slice(0, 10);
      const value = buckets.get(key) || {
        label: weekStart.toLocaleDateString(language === "de" ? "de-DE" : "en-US", {
          month: "short",
          day: "numeric",
        }),
        applications: 0,
      };
      value.applications += 1;
      buckets.set(key, value);
    });
    return Array.from(buckets.entries())
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .map(([, value]) => value)
      .slice(-6);
  }, [language]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Try unified dashboard endpoint first (recommended)
      const queryParam = period !== "all" ? `?period=${period}` : "";
      const dashboardData = await apiFetch(`/api/admin/dashboard${queryParam}`);

      // Verify response structure matches backend API
      if (dashboardData && dashboardData.stats) {
        // Set KPI stats from backend response
        setStats({
          totalCandidates: Number(dashboardData.stats.totalCandidates) || 0,
          totalJobs: Number(dashboardData.stats.totalJobs) || 0,
          activeClients: Number(dashboardData.stats.activeClients) || 0,
          totalApplications: Number(dashboardData.stats.totalApplications) || 0,
        });

        // Use trend data from API - backend returns array with {date, count}
        if (dashboardData.applicationsTrend && Array.isArray(dashboardData.applicationsTrend) && dashboardData.applicationsTrend.length > 0) {
          setTrendData(transformTrendData(dashboardData.applicationsTrend));
        } else {
          // Empty trend data if not available
          setTrendData([]);
        }

        // Store distribution data if available (for pie chart)
        if (dashboardData.distribution) {
          setDistribution(dashboardData.distribution);
        } else {
          // Use stats as fallback for distribution
          setDistribution(dashboardData.stats);
        }

        // Log for debugging (remove in production if needed)
        console.log("Dashboard KPIs loaded:", {
          stats: dashboardData.stats,
          trendCount: dashboardData.applicationsTrend?.length || 0,
          period: dashboardData.period || period,
          distribution: dashboardData.distribution || dashboardData.stats,
        });
      } else {
        // Invalid response structure
        console.error("Invalid dashboard API response structure:", dashboardData);
        throw new Error("Unified endpoint returned unexpected format");
      }
    } catch (err) {
      console.warn("Unified dashboard endpoint failed, falling back to individual endpoints:", err.message);
      
      // Fallback: Use individual endpoints (backward compatibility)
      try {
        const [usersData, jobsData, clientsData, applicationsData] = await Promise.all([
          apiFetch("/api/users"),
          apiFetch("/api/jobs"),
          apiFetch("/api/clients"),
          apiFetch("/api/applications"),
        ]);

        const users = usersData.users || [];
        const jobs = jobsData.jobs || [];
        const clients = clientsData.clients || [];
        const applications = applicationsData.applications || [];

        setStats({
          totalCandidates: users.length,
          totalJobs: jobs.length,
          activeClients: clients.length,
          totalApplications: applications.length,
        });

        setTrendData(aggregateWeeklyApplications(applications));
      } catch (fallbackErr) {
        console.error("Error fetching dashboard data (fallback):", fallbackErr);
        // Set default values on complete failure
        setStats({
          totalCandidates: 0,
          totalJobs: 0,
          activeClients: 0,
          totalApplications: 0,
        });
        setTrendData([]);
      }
    } finally {
      setLoading(false);
    }
  }, [period, transformTrendData, aggregateWeeklyApplications]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleCardClick = (page) => {
    navigate(`/${page}`);
  };

  const widgets = [
    { title: t(language, 'dashboard.totalCandidates'), value: stats.totalCandidates, route: "candidates" },
    { title: t(language, 'dashboard.totalJobs'), value: stats.totalJobs, route: "jobs" },
    { title: t(language, 'dashboard.activeClients'), value: stats.activeClients, route: "clients" },
    { title: t(language, 'dashboard.totalApplications'), value: stats.totalApplications, route: "candidates" },
  ];

  const maxValue = trendData.length > 0 ? Math.max(...trendData.map(d => d.applications), 1) : 100;

  // Pie data for summary (candidates, jobs, clients, applications)
  // Use distribution data from backend if available, otherwise use stats
  const pieData = [
    { 
      label: t(language, 'dashboard.totalCandidates'), 
      value: Number(distribution?.candidates ?? stats.totalCandidates) || 0, 
      color: '#6aa4ff' 
    },
    { 
      label: t(language, 'dashboard.totalJobs'), 
      value: Number(distribution?.jobs ?? stats.totalJobs) || 0, 
      color: '#4CAF50' 
    },
    { 
      label: t(language, 'dashboard.activeClients'), 
      value: Number(distribution?.clients ?? stats.activeClients) || 0, 
      color: '#FF9800' 
    },
    { 
      label: t(language, 'dashboard.totalApplications'), 
      value: Number(distribution?.applications ?? stats.totalApplications) || 0, 
      color: '#f44336' 
    },
  ];
  const pieTotal = pieData.reduce((s, d) => s + (Number.isFinite(d.value) ? d.value : 0), 0) || 1;
  let acc = 0;
  const pieGradient = pieData.map(d => {
    const start = (acc / pieTotal) * 100;
    acc += d.value;
    const end = (acc / pieTotal) * 100;
    return `${d.color} ${start}% ${end}%`;
  }).join(', ');

  return (
    <Layout>
      <>
        <h2 style={styles.mainHeader}>{t(language, 'dashboard.title')}</h2>

        {/* Widgets */}
        <div style={styles.widgetsContainer}>
          {widgets.map((widget) => (
            <div
              key={widget.title}
              style={styles.widget}
              onClick={() => handleCardClick(widget.route)}
              onMouseOver={(e) => {
                e.currentTarget.style.background =
                  "linear-gradient(135deg, #a2d2ff, #6aa4ff)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(106,76,255,0.25)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background =
                  "linear-gradient(135deg, #cce6ff, #a2d2ff)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
              }}
            >
              <p style={styles.widgetValue}>{loading ? "..." : widget.value}</p>
              <p style={styles.widgetTitle}>{widget.title}</p>
            </div>
          ))}
        </div>

        {/* Graphs Container */}
        <div style={{
          ...styles.graphsContainer,
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        }}>
          {/* Applications Trend Chart */}
          <div style={styles.graphCard}>
            <div style={styles.graphHeader}>
              <h3 style={styles.graphTitle}>{t(language, 'dashboard.applicationsTrend')}</h3>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                style={styles.timeFilter}
              >
                <option value="all">{language === 'de' ? 'Alle Zeit' : 'All Time'}</option>
                <option value="week">{language === 'de' ? 'Letzte Woche' : 'Last Week'}</option>
                <option value="month">{language === 'de' ? 'Letzter Monat' : 'Last Month'}</option>
                <option value="year">{language === 'de' ? 'Letztes Jahr' : 'Last Year'}</option>
              </select>
            </div>
            <div style={styles.graphWrapper}>
              <div style={styles.yAxis}>
                {[0, Math.ceil(maxValue * 0.25), Math.ceil(maxValue * 0.5), Math.ceil(maxValue * 0.75), Math.ceil(maxValue)].map((value) => (
                  <span key={value} style={styles.yAxisLabel}>{value}</span>
                ))}
              </div>
              <div style={styles.graphContainer}>
                {trendData.length > 0 ? (
                  <>
                    {/* Grid lines */}
                    <div style={styles.gridLines}>
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} style={styles.gridLine} />
                      ))}
                    </div>
                    {/* Bars */}
                    <div style={styles.barsContainer}>
                      {trendData.map((item, index) => (
                        <div key={index} style={styles.barGroup}>
                          <div style={styles.labelContainer}>
                            <span style={styles.valueBubble}>{item.applications}</span>
                          </div>
                          <div style={styles.barContainer}>
                            <div
                              style={{
                                ...styles.bar,
                                height: `${Math.max((item.applications / maxValue) * 220, 10)}px`,
                                backgroundColor: "#6aa4ff",
                              }}
                            />
                          </div>
                          <span style={styles.weekLabel}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p style={styles.noData}>{language === 'de' ? 'Keine Bewerbungsdaten verfügbar' : 'No application data available'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Summary Pie Chart */}
          <div style={styles.graphCard}>
            <div style={styles.graphHeader}>
              <h3 style={styles.graphTitle}>{t(language, 'dashboard.overallDistribution')}</h3>
            </div>
            <div style={styles.pieRow}>
              <div style={{ ...styles.pieChart, backgroundImage: `conic-gradient(${pieGradient})` }} />
              <div style={styles.legend}>
                {pieData.map((d) => (
                  <div key={d.label} style={styles.legendItem}>
                    <span style={{ ...styles.legendSwatch, backgroundColor: d.color }} />
                    <span style={styles.legendLabel}>{d.label}</span>
                    <span style={styles.legendValue}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    </Layout>
  );
};

const styles = {
  mainHeader: { fontSize: "24px", marginBottom: "20px", fontWeight: "bold", color: "#2e236c" },
  widgetsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    marginBottom: "30px",
  },
  widget: {
    background: "linear-gradient(135deg, #cce6ff, #a2d2ff)",
    borderRadius: "12px",
    padding: "25px",
    textAlign: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontWeight: "500",
  },
  widgetValue: { fontSize: "32px", fontWeight: "600", marginBottom: "5px", color: "#2e236c" },
  widgetTitle: { fontSize: "16px", fontWeight: "500", color: "#555" },
  graphsContainer: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    marginBottom: "30px",
  },
  graphCard: {
    background: "white",
    borderRadius: "16px",
    padding: "30px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    marginBottom: "30px",
  },
  graphHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
  },
  graphTitle: {
    fontSize: "20px",
    fontWeight: "600",
    margin: 0,
    color: "#2e236c",
  },
  timeFilter: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "1px solid #e0e0e0",
    backgroundColor: "white",
    fontSize: "14px",
    color: "#666",
    cursor: "pointer",
  },
  graphWrapper: {
    display: "flex",
    gap: "15px",
  },
  pieRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "20px",
  },
  pieChart: {
    width: "200px",
    height: "200px",
    borderRadius: "50%",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  legend: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  legendSwatch: {
    width: "12px",
    height: "12px",
    borderRadius: "3px",
    display: "inline-block",
  },
  legendLabel: { fontSize: "14px", color: "#2e236c", minWidth: 110 },
  legendValue: { fontSize: "14px", fontWeight: 600, color: "#333" },
  yAxis: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    height: "250px",
    paddingTop: "20px",
    paddingBottom: "20px",
    minWidth: "40px",
  },
  yAxisLabel: {
    fontSize: "12px",
    color: "#999",
    fontWeight: "500",
  },
  graphContainer: {
    flex: 1,
    position: "relative",
    height: "290px",
    padding: "20px 10px 30px 10px",
  },
  gridLines: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    bottom: 30,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  gridLine: {
    width: "100%",
    height: "1px",
    backgroundColor: "#f0f0f0",
  },
  barsContainer: {
    position: "relative",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: "100%",
    zIndex: 1,
  },
  barGroup: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
    gap: "5px",
    position: "relative",
  },
  labelContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "35px",
    marginBottom: "5px",
  },
  valueBubble: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#2e236c",
    backgroundColor: "#e3f2fd",
    border: "1px solid #90caf9",
    borderRadius: "50%",
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  barContainer: {
    width: "100%",
    height: "220px",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  bar: {
    width: "55%",
    maxWidth: "45px",
    borderRadius: "6px 6px 0 0",
    transition: "all 0.3s ease",
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(106, 164, 255, 0.2)",
  },
  weekLabel: {
    fontSize: "12px",
    fontWeight: "500",
    color: "#666",
    marginTop: "8px",
  },
  noData: {
    textAlign: "center",
    color: "#999",
    fontSize: "16px",
    padding: "40px",
  },
};

export default AdminDashboard;
