import { useEffect, useState } from "react";
import "./CandidateDashboard.css";

function CandidateDashboard({
  goApplications,
  goJobs,
  goInterview,
  goLogout,
}) {
  // CURRENT LOGGED-IN USER
  const candidateId = Number(localStorage.getItem("userId")) || 2;
  const currentUsername = localStorage.getItem("currentUser") || "Candidate";

  // STATES
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [loadingApplications, setLoadingApplications] = useState(true);
  const [loadingInterviews, setLoadingInterviews] = useState(true);
  const [notificationLoading, setNotificationLoading] = useState(true);

  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  
// FETCH APPLICATIONS AND AUTO-REFRESH STATUS
useEffect(() => {
  let isMounted = true;

  const fetchApplications = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/jobs/applications/?candidate=${candidateId}`
      );

      if (!response.ok) {
        throw new Error("Unable to fetch applications");
      }

      const data = await response.json();

      if (isMounted && Array.isArray(data)) {
        setApplications(data);
      }
    } catch (error) {
      console.error("Applications fetch error:", error);
    } finally {
      if (isMounted) {
        setLoadingApplications(false);
      }
    }
  };

  fetchApplications();

  // Refresh application statuses every 5 seconds
  const intervalId = setInterval(fetchApplications, 5000);

  return () => {
    isMounted = false;
    clearInterval(intervalId);
  };
}, [candidateId]);


  // FETCH INTERVIEWS
  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/jobs/interviews/list/?candidate=${candidateId}`
        );

        const data = await response.json();

        if (response.ok && Array.isArray(data)) {
          setInterviews(data);
        } else {
          setInterviews([]);
        }
      } catch (error) {
        console.error("Interviews fetch error:", error);
        setInterviews([]);
      } finally {
        setLoadingInterviews(false);
      }
    };

    fetchInterviews();
  }, [candidateId]);

  // FETCH NOTIFICATIONS
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/notifications/?user=${candidateId}`
        );

        const data = await response.json();

        if (response.ok && Array.isArray(data)) {
          setNotifications(data);
        } else {
          setNotifications([]);
        }
      } catch (error) {
        console.error("Notification fetch error:", error);
        setNotifications([]);
      } finally {
        setNotificationLoading(false);
      }
    };

    fetchNotifications();
  }, [candidateId]);

  // MARK NOTIFICATION AS READ
  const markNotificationRead = async (notificationId) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/notifications/${notificationId}/read/?user=${candidateId}`,
        { method: "PATCH" }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? { ...notification, is_read: true }
              : notification
          )
        );

        setSelectedNotification((prev) =>
          prev?.id === notificationId
            ? { ...prev, is_read: true }
            : prev
        );
      }
    } catch (error) {
      console.error("Notification read error:", error);
    }
  };

  // INTERVIEW DATE HELPER
  const getInterviewDate = (interview) => {
    if (!interview.interview_date || !interview.interview_time) {
      return null;
    }

    const date = new Date(
      `${interview.interview_date}T${interview.interview_time}`
    );

    return Number.isNaN(date.getTime()) ? null : date;
  };

  // DASHBOARD STATISTICS
  const totalApplications = applications.length;

  const shortlistedCount = applications.filter(
    (app) => app.status === "shortlisted"
  ).length;

  const rejectedCount = applications.filter(
    (app) => app.status === "rejected"
  ).length;

  // TOTAL INTERVIEW RECORDS
  const interviewCount = interviews.length;

  // UNREAD NOTIFICATIONS
  const unreadNotifications = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  // AVERAGE AI SCORE
  const averageScore =
    applications.length > 0
      ? Math.round(
          applications.reduce(
            (total, app) => total + (Number(app.ai_score) || 0),
            0
          ) / applications.length
        )
      : 0;

  // UPCOMING INTERVIEWS
  const now = Date.now();

  const upcomingInterviews = interviews
    .filter((interview) => {
      const interviewDate = getInterviewDate(interview);

      return (
        interview.status === "scheduled" &&
        interviewDate !== null &&
        interviewDate.getTime() >= now
      );
    })
    .sort((a, b) => {
      return getInterviewDate(a).getTime() - getInterviewDate(b).getTime();
    });

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");

    if (goLogout) {
      goLogout();
    }
  };

  return (
    <div className="dashboard-layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">H</div>
          <span>
            Hire<strong>AI</strong>
          </span>
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
          <button className="nav-item active">
            <span className="nav-icon">📊</span> Dashboard
          </button>

          <button className="nav-item" onClick={goJobs}>
            <span className="nav-icon">💼</span> Jobs
          </button>

          <button className="nav-item" onClick={goApplications}>
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

      {/* MAIN CONTENT */}
      <main className="main-content">
        {/* TOPBAR */}
        <header className="topbar">
          <h2>Dashboard</h2>

          <div className="topbar-actions">
            <div className="notification-wrapper">
              <button
                className="notification-btn"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                🔔

                {unreadNotifications > 0 && (
                  <span className="badge">{unreadNotifications}</span>
                )}
              </button>

              {/* NOTIFICATION DROPDOWN */}
              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="dropdown-header">Notifications</div>

                  <div className="dropdown-body">
                    {notificationLoading ? (
                      <p className="empty-msg">Loading...</p>
                    ) : notifications.length === 0 ? (
                      <p className="empty-msg">No notifications</p>
                    ) : (
                      notifications.slice(0, 5).map((notification) => (
                        <div
                          key={notification.id}
                          className={`notification-item ${
                            notification.is_read ? "read" : "unread"
                          }`}
                          onClick={() => {
                            setSelectedNotification(notification);

                            if (!notification.is_read) {
                              markNotificationRead(notification.id);
                            }
                          }}
                        >
                          <strong>{notification.title}</strong>
                          <p>{notification.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="topbar-profile-pic">
              {currentUsername.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* DASHBOARD CONTENT */}
        <div className="dashboard-scrollable">
          {/* STATISTICS */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-info">
                <span>Applied Jobs</span>
                <h3>{totalApplications}</h3>
              </div>

              <div className="stat-icon blue-light">💼</div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <span>Shortlisted</span>
                <h3>{shortlistedCount}</h3>
              </div>

              <div className="stat-icon green-light">🛡️</div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <span>Interviews</span>
                <h3>{loadingInterviews ? "..." : interviewCount}</h3>
              </div>

              <div className="stat-icon purple-light">👥</div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <span>Rejected</span>
                <h3>{rejectedCount}</h3>
              </div>

              <div className="stat-icon red-light">❌</div>
            </div>
          </div>

          {/* DASHBOARD COLUMNS */}
          <div className="dashboard-columns">
            {/* RECENT APPLICATIONS */}
            <div className="column-left">
              <div className="section-header">
                <h3>Recent Applications</h3>

                <button
                  className="text-link"
                  onClick={goApplications}
                >
                  View All
                </button>
              </div>

              <div className="cards-list">
                {loadingApplications ? (
                  <p className="loading-text">Loading applications...</p>
                ) : applications.length === 0 ? (
                  <div className="empty-card">
                    <p>No applications yet.</p>

                    <button
                      className="btn-primary-small"
                      onClick={goJobs}
                    >
                      Find Jobs
                    </button>
                  </div>
                ) : (
                  applications.slice(0, 4).map((app) => (
                    <div className="job-action-card" key={app.id}>
                      <div className="card-logo blue">
                        {app.job_company
                          ? app.job_company.charAt(0)
                          : "C"}
                      </div>

                      <div className="card-details">
                        <h4>
                          {app.job_title || `Job #${app.job}`}
                        </h4>

                        <p>
                          {app.job_company || "Company Unavailable"} •{" "}
                          {app.job_location || "Location Unavailable"}
                        </p>

                        <div className="skills-row">
                          <span className="skill-pill">
                            AI Match: {app.ai_score || 0}%
                          </span>
                        </div>
                      </div>

                      <div className="card-action">
                        <span
                          className={`status-badge ${
                            app.status || "applied"
                          }`}
                        >
                          {app.status || "Applied"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* UPCOMING INTERVIEWS */}
            <div className="column-right">
              <div className="section-header">
                <h3>Upcoming Interviews</h3>

                <button
                  className="text-link"
                  onClick={goInterview}
                >
                  View All
                </button>
              </div>

              <div className="cards-list">
                {loadingInterviews ? (
                  <p className="loading-text">Loading interviews...</p>
                ) : upcomingInterviews.length === 0 ? (
                  <div className="empty-card">
                    <p>No upcoming interviews.</p>
                  </div>
                ) : (
                  upcomingInterviews.slice(0, 4).map((interview) => (
                    <div
                      className="interview-mini-card"
                      key={interview.id}
                    >
                      <div className="interview-date-box">
                        <strong>
                          {interview.interview_date
                            ? interview.interview_date.split("-")[2]
                            : "--"}
                        </strong>

                        <span>
                          {interview.interview_date
                            ? new Date(
                                `${interview.interview_date}T12:00:00`
                              ).toLocaleString("default", {
                                month: "short",
                              })
                            : "--"}
                        </span>
                      </div>

                      <div className="interview-info-mini">
                        <h4>Interview #{interview.id}</h4>

                        <p>Time: {interview.interview_time}</p>

                        {interview.meeting_link && (
                          <a
                            href={interview.meeting_link}
                            target="_blank"
                            rel="noreferrer"
                            className="join-link"
                          >
                            Join Link →
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* NOTIFICATION MODAL */}
      {selectedNotification && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedNotification(null)}
        >
          <div
            className="modal-content"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="close-btn"
              onClick={() => setSelectedNotification(null)}
            >
              ✕
            </button>

            <h2>{selectedNotification.title}</h2>
            <p>{selectedNotification.message}</p>

            <button
              className="btn-primary"
              onClick={() => setSelectedNotification(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CandidateDashboard;

