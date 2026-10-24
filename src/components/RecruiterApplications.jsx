import { useEffect, useState } from "react";
import "./RecruiterApplications.css";

const API_BASE = "http://127.0.0.1:8000";

function RecruiterApplications({ jobId, goScheduleInterview, goDashboard, goPostJob, goLogout }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  const currentUsername = localStorage.getItem("currentUser") || "Recruiter";

  useEffect(() => {
    let isMounted = true;

    const fetchApplications = async () => {
      setLoading(true);
      setError("");

      try {
        if (!jobId) {
          if (isMounted) {
            setApplications([]);
            setError("Please select a job to view applications.");
            setLoading(false);
          }
          return;
        }

        const response = await fetch(
          `${API_BASE}/api/jobs/applications/?job=${jobId}`
        );

        if (!response.ok) {
          throw new Error("Failed to load applications.");
        }

        const data = await response.json();

        if (isMounted) {
          setApplications(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Applications error:", err);
        if (isMounted) {
          setError(err.message || "Something went wrong.");
          setApplications([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchApplications();

    return () => {
      isMounted = false;
    };
  }, [jobId]);

  const updateStatus = async (applicationId, nextStatus) => {
    try {
      setUpdatingId(applicationId);
      setError("");

      const response = await fetch(
        `${API_BASE}/api/jobs/applications/${applicationId}/status/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || data.detail || "Failed to update application status."
        );
      }

      const updatedStatus = data.application?.status || data.status || nextStatus;

      setApplications((previous) =>
        previous.map((application) =>
          application.id === applicationId
            ? { ...application, status: updatedStatus }
            : application
        )
      );

      const messages = {
        shortlisted: "Candidate shortlisted successfully!",
        selected: "Candidate selected successfully!",
        rejected: "Candidate rejected.",
      };
      window.alert(messages[nextStatus] || "Application status updated.");
    } catch (err) {
      console.error("Status update error:", err);
      setError(err.message || "Unable to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleScheduleInterview = (applicationId) => {
    if (!applicationId) {
      window.alert("Application ID is missing.");
      return;
    }

    if (typeof goScheduleInterview !== "function") {
      window.alert("Navigation callback is missing. Please check App.jsx.");
      return;
    }

    goScheduleInterview(applicationId);
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "Not available";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "Not available";
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    if (goLogout) goLogout();
  };

  return (
    <div className="dashboard-layout">
      {/* ================= SIDEBAR ================= */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">H</div>
          <span>Hire<strong>AI</strong></span>
        </div>

        <div className="sidebar-profile">
          <div className="profile-avatar">
            {currentUsername.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <h4>{currentUsername}</h4>
            <span>Recruiter</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className="nav-item active" onClick={goDashboard}>
            <span className="nav-icon">📊</span> Dashboard
          </button>
          <button className="nav-item" onClick={goPostJob}>
            <span className="nav-icon">✍️</span> Post a Job
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <span className="nav-icon">🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button className="back-btn-modern" onClick={goDashboard}>
               ← Back
            </button>
            <h2>Review Applications</h2>
          </div>
          <div className="topbar-actions">
            <div className="topbar-profile-pic">
              {currentUsername.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="dashboard-scrollable">
          
          <div className="page-header-row">
            <div>
              <h3>Applicants for Job #{jobId}</h3>
              <p>Review resumes, check AI match scores, and update candidate status.</p>
            </div>
            <div className="count-badge">
              {applications.length} {applications.length === 1 ? "Applicant" : "Applicants"}
            </div>
          </div>

          {error && (
            <div className="error-banner">
              <strong>Notice:</strong> {error}
            </div>
          )}

          {loading ? (
             <div className="empty-state-box">
               <span className="empty-icon">⏳</span>
               <h3>Loading applications...</h3>
               <p>Please wait while we load candidates for this job.</p>
             </div>
          ) : !error && applications.length === 0 ? (
             <div className="empty-state-box">
               <span className="empty-icon">📋</span>
               <h3>No applications found</h3>
               <p>There are no applications for this job yet.</p>
             </div>
          ) : (
            <div className="ra-list-modern">
              {applications.map((application) => {
                const status = String(application.status || "applied").toLowerCase();
                const score = Math.min(100, Math.max(0, Number(application.ai_score) || 0));
                const busy = updatingId === application.id;
                const isRejected = status === "rejected";
                const isSelected = status === "selected";

                return (
                  <div className="ra-card-modern" key={application.id}>
                    
                    {/* Candidate Info Col */}
                    <div className="ra-cand-col">
                      <div className="ra-avatar-md">👤</div>
                      <div className="ra-info">
                        <h3>Candidate #{application.candidate}</h3>
                        <p>App ID: #{application.id}</p>
                        <small>Applied: {formatDate(application.applied_at)}</small>
                      </div>
                    </div>

                    {/* AI Score Col */}
                    <div className="ra-score-col">
                      <div className="score-header">
                        <span>🤖 AI MATCH</span>
                        <strong>{score.toFixed(0)}%</strong>
                      </div>
                      <div className="score-progress">
                        <div className="score-fill" style={{ width: `${score}%` }}></div>
                      </div>
                      <small>Resume & Job Compatibility</small>
                    </div>

                    {/* Status & Resume Col */}
                    <div className="ra-status-col">
                      <div className="status-row">
                        <span className="label">Current Status:</span>
                        <span className={`status-badge-modern ${status}`}>{status}</span>
                      </div>
                      
                      <div className="resume-row">
                        {application.resume ? (
                          <a
                            href={
                              application.resume.startsWith("http")
                                ? application.resume
                                : `${API_BASE}${application.resume.startsWith("/") ? "" : "/"}${application.resume}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-outline-blue-small"
                          >
                            📄 View Resume
                          </a>
                        ) : (
                          <span className="no-resume-text">No Resume</span>
                        )}
                      </div>
                    </div>

                    {/* Actions Row (Bottom spanning) */}
                    <div className="ra-actions-row">
                       {!isRejected && !isSelected && (
                         <div className="action-buttons-group">
                           {status !== "shortlisted" && (
                             <button
                               className="btn-action shortlist"
                               disabled={busy}
                               onClick={() => updateStatus(application.id, "shortlisted")}
                             >
                               {busy ? "..." : "✓ Shortlist"}
                             </button>
                           )}
                           <button
                             className="btn-action select"
                             disabled={busy}
                             onClick={() => updateStatus(application.id, "selected")}
                           >
                             {busy ? "..." : "★ Select"}
                           </button>
                           <button
                             className="btn-action reject"
                             disabled={busy}
                             onClick={() => updateStatus(application.id, "rejected")}
                           >
                             {busy ? "..." : "✕ Reject"}
                           </button>
                         </div>
                       )}

                       {status === "shortlisted" && (
                         <button
                           className="btn-action schedule"
                           onClick={() => handleScheduleInterview(application.id)}
                         >
                           📅 Schedule Interview
                         </button>
                       )}

                       {isSelected && <div className="result-text success">🎉 Candidate selected</div>}
                       {isRejected && <div className="result-text error">✕ Application rejected</div>}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default RecruiterApplications;