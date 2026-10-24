import { useEffect, useState } from "react";
import "./Applications.css";

function Applications({ goDashboard, goJobs, goInterview, goLogout }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // CURRENT LOGGED-IN USER
  const candidateId = Number(localStorage.getItem("userId")) || 2;
  const currentUsername = localStorage.getItem("currentUser") || "Candidate";

  // =========================================================
  // FETCH APPLICATIONS
  // =========================================================
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/jobs/applications/?candidate=${candidateId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch applications");
        }

        const data = await response.json();

        if (Array.isArray(data)) {
          setApplications(data);
        } else {
          setApplications([]);
        }
      } catch (error) {
        console.error("Applications error:", error);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [candidateId]);

  // =========================================================
  // STATUS TRACKER
  // =========================================================
  const renderStatusTracker = (status) => {
    const normalizedStatus = String(status || "applied").toLowerCase();

    // REJECTED STATUS
    if (normalizedStatus === "rejected") {
      return (
        <div className="status-tracker rejected-tracker">
          <div className="status-step completed">
            <span>✓</span>
            <small>Applied</small>
          </div>
          <div className="status-line rejected-line"></div>
          <div className="status-step rejected-step">
            <span>✕</span>
            <small>Rejected</small>
          </div>
        </div>
      );
    }

    const steps = [
      { label: "Applied", value: "applied" },
      { label: "Shortlisted", value: "shortlisted" },
      { label: "Interview", value: "interview" },
      { label: "Selected", value: "selected" },
    ];

    const statusOrder = {
      applied: 0,
      shortlisted: 1,
      interview: 2,
      selected: 3,
    };

    const currentStep = statusOrder[normalizedStatus] ?? 0;

    return (
      <div className="status-tracker">
        {steps.map((step, index) => {
          const completed = index <= currentStep;
          return (
            <div className="status-tracker-item" key={step.value}>
              <div className={`status-step ${completed ? "completed" : ""}`}>
                <span>{completed ? "✓" : ""}</span>
                <small>{step.label}</small>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`status-line ${index < currentStep ? "completed" : ""}`}
                ></div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // =========================================================
  // STATUS TEXT
  // =========================================================
  
  const getStatusText = (status) => {
    switch (String(status || "applied").trim().toLowerCase()) {
      case "applied":
        return "Applied 📄";

      case "shortlisted":
        return "Shortlisted ⭐";

      case "interview":
        return "Interview 📅";

      case "selected":
        return "Selected 🎉";

      case "rejected":
        return "Rejected ❌";

      default:
        return "Applied 📄";
    }
 };


  // =========================================================
  // FORMAT DATE
  // =========================================================
  const formatDate = (dateValue) => {
    if (!dateValue) return "Date not available";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "Date not available";
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    if (goLogout) goLogout();
  };

  // =========================================================
  // MAIN UI
  // =========================================================
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
            <span>Candidate</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className="nav-item" onClick={goDashboard}>
            <span className="nav-icon">📊</span> Dashboard
          </button>
          <button className="nav-item" onClick={goJobs}>
            <span className="nav-icon">💼</span> Jobs
          </button>
          <button className="nav-item active">
            <span className="nav-icon">📄</span> Applications
          </button>
          <button className="nav-item" onClick={goInterview}>
            <span className="nav-icon">📅</span> Interviews
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
          <h2>My Applications</h2>
          <div className="topbar-actions">
            <div className="topbar-profile-pic">
              {currentUsername.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="dashboard-scrollable">
          
          <div className="page-header-row">
            <div>
              <h3>Application Tracking</h3>
              <p>Monitor your application status, AI match score, and uploaded resumes.</p>
            </div>
            <div className="count-badge">
              {applications.length} Total Applications
            </div>
          </div>

          {/* LOADING */}
          {loading ? (
            <div className="empty-state-box">
              <div className="empty-icon">⏳</div>
              <h3>Loading applications...</h3>
              <p>Please wait while we fetch your data.</p>
            </div>
          ) : applications.length === 0 ? (
            /* EMPTY STATE */
            <div className="empty-state-box">
              <div className="empty-icon">📋</div>
              <h3>No applications yet</h3>
              <p>Apply for jobs and your applications will appear here.</p>
              <button className="btn-primary" onClick={goJobs} style={{ marginTop: '15px' }}>
                Find Jobs
              </button>
            </div>
          ) : (
            /* APPLICATION LIST */
            <div className="applications-grid-list">
              {applications.map((application) => {
                const score = Math.max(0, Math.min(Number(application.ai_score) || 0, 100));
                const status = String(application.status || "applied")
                .trim()
                .toLowerCase();
                const companyInitial = application.job_company ? application.job_company.charAt(0).toUpperCase() : "C";

                return (
                  <div className="application-modern-card" key={application.id}>
                    
                    {/* JOB INFORMATION */}
                    <div className="app-job-col">
                      <div className="app-logo blue">{companyInitial}</div>
                      <div className="app-job-details">
                        <h3>{application.job_title || `Job #${application.job}`}</h3>
                        <p className="app-company">{application.job_company || "Company Unavailable"}</p>
                        <div className="app-meta">
                          <span>📍 {application.job_location || "Location Unavailable"}</span>
                          <span>📄 App #{application.id}</span>
                        </div>
                        <small className="app-date">Applied on {formatDate(application.applied_at)}</small>
                      </div>
                    </div>

                    {/* AI SCORE */}
                    <div className="app-score-col">
                      <div className="score-header-row">
                        <span>🤖 AI MATCH</span>
                        <strong>{score}%</strong>
                      </div>
                      <div className="score-progress-bar">
                        <div className="score-progress-fill" style={{ width: `${score}%` }}></div>
                      </div>
                      <small>Resume & Job Match</small>
                    </div>

                    {/* APPLICATION STATUS */}
                    <div className="app-status-col">
                      <span className="status-label-top">APPLICATION STATUS</span>
                      
                      <div className="tracker-wrapper">
                         {renderStatusTracker(status)}
                      </div>

                      <div className={`status-text-current ${status}`}>
                        Current Status: <strong>{getStatusText(status)}</strong>
                      </div>
                    </div>

                    {/* ACTION / RESUME */}
                    <div className="app-action-col">
                      {application.resume ? (
                        <a
                          href={
                            application.resume.startsWith("http")
                              ? application.resume
                              : `http://127.0.0.1:8000${
                                  application.resume.startsWith("/")
                                    ? application.resume
                                    : `/${application.resume}`
                                }`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-outline-blue"
                        >
                          📄 View Resume
                        </a>
                      ) : (
                        <span className="no-resume-text">No Resume</span>
                      )}
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

export default Applications;