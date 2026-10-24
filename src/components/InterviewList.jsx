import { useEffect, useState } from "react";
import "./InterviewList.css";

function InterviewList({
  goDashboard,
  goJobs,
  goApplications,
  goLogout,
}) {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // CURRENT LOGGED-IN USER
  const candidateId = Number(localStorage.getItem("userId")) || 2;
  const currentUsername =
    localStorage.getItem("currentUser") || "Candidate";

  // FETCH INTERVIEWS
  const fetchInterviews = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/jobs/interviews/list/?candidate=${candidateId}`
      );

      const data = await response.json();

      if (response.ok && Array.isArray(data)) {
        setInterviews(data);
      } else {
        console.error("Unable to fetch interviews:", data);
        setInterviews([]);
      }
    } catch (error) {
      console.error("Error fetching interviews:", error);
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

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

  // CATEGORIZE INTERVIEWS
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
    .sort(
      (a, b) =>
        getInterviewDate(a).getTime() -
        getInterviewDate(b).getTime()
    );

  const pastInterviews = interviews
    .filter((interview) => {
      const interviewDate = getInterviewDate(interview);

      return (
        interview.status === "completed" ||
        interview.status === "cancelled" ||
        (
          interview.status === "scheduled" &&
          interviewDate !== null &&
          interviewDate.getTime() < now
        )
      );
    })
    .sort(
      (a, b) =>
        (getInterviewDate(b)?.getTime() || 0) -
        (getInterviewDate(a)?.getTime() || 0)
    );

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

  // RENDER INTERVIEW CARD
  const renderInterviewCard = (interview, isPast = false) => {
    const isOnline =
      interview.interview_type === "online" ||
      interview.interview_type === "Video Call";

    const day = interview.interview_date
      ? interview.interview_date.split("-")[2]
      : "--";

    const month = interview.interview_date
      ? new Date(
          `${interview.interview_date}T12:00:00`
        ).toLocaleString("en", { month: "short" })
      : "--";

    return (
      <div
        className={`interview-modern-card ${
          isPast ? "past-card" : ""
        }`}
        key={interview.id}
      >
        {/* CARD HEADER */}
        <div className="card-header-row">
          <div
            className={`type-badge ${
              isOnline ? "online" : "offline"
            }`}
          >
            {isOnline ? "🟢 ONLINE" : "🏢 OFFLINE"}
          </div>

          {isPast && (
            <span
              className={`status-badge-small ${
                interview.status || "completed"
              }`}
            >
              {interview.status || "Completed"}
            </span>
          )}
        </div>

        {/* INTERVIEW DETAILS */}
        <div className="interview-body-row">
          <div className="date-block">
            <strong>{day}</strong>
            <span>{month}</span>
          </div>

          <div className="info-block">
            <h3>Interview #{interview.id}</h3>

            <p>Application #{interview.application}</p>

            <div className="time-loc-row">
              <span>
                ⏰ {interview.interview_time || "TBA"}
              </span>

              {!isOnline && interview.location && (
                <span>📍 {interview.location}</span>
              )}
            </div>
          </div>
        </div>

        {/* INTERVIEW NOTES */}
        {interview.notes && (
          <div className="notes-block">
            <small>📝 Notes</small>
            <p>{interview.notes}</p>
          </div>
        )}

        {/* ACTIONS */}
        <div className="action-block">
          {isPast ? (
            <button
              className="btn-past-disabled"
              disabled
            >
              {interview.status === "cancelled"
                ? "Cancelled"
                : interview.status === "completed"
                ? "Interview Completed"
                : "Interview Date Passed"}
            </button>
          ) : isOnline && interview.meeting_link ? (
            <a
              href={interview.meeting_link}
              target="_blank"
              rel="noreferrer"
              className="btn-join-meeting"
            >
              Join Meeting →
            </a>
          ) : null}
        </div>
      </div>
    );
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
          <button
            className="nav-item"
            onClick={goDashboard}
          >
            <span className="nav-icon">📊</span>
            Dashboard
          </button>

          <button
            className="nav-item"
            onClick={goJobs}
          >
            <span className="nav-icon">💼</span>
            Jobs
          </button>

          <button
            className="nav-item"
            onClick={goApplications}
          >
            <span className="nav-icon">📄</span>
            Applications
          </button>

          <button className="nav-item active">
            <span className="nav-icon">📅</span>
            Interviews
          </button>
        </nav>

        <div className="sidebar-footer">
          <button
            className="nav-item logout-btn"
            onClick={handleLogout}
          >
            <span className="nav-icon">🚪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        {/* TOPBAR */}
        <header className="topbar">
          <h2>My Interviews</h2>

          <div className="topbar-actions">
            <div className="topbar-profile-pic">
              {currentUsername.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="dashboard-scrollable">
          <div className="page-header-row">
            <div>
              <h3>Interview Schedule</h3>
              <p>
                View and manage your upcoming meeting details.
              </p>
            </div>

            <div className="count-badge">
              {upcomingInterviews.length} Upcoming
            </div>
          </div>

          {loading ? (
            <div className="empty-state-box">
              <div className="empty-icon">⏳</div>
              <h3>Loading interviews...</h3>
            </div>
          ) : (
            <>
              {/* UPCOMING INTERVIEWS */}
              <div className="interview-section-header">
                <h4>Upcoming Interviews</h4>
              </div>

              {upcomingInterviews.length === 0 ? (
                <div className="empty-state-box">
                  <div className="empty-icon">📅</div>
                  <h3>No interviews scheduled</h3>
                  <p>
                    Your upcoming interviews will appear here.
                  </p>
                </div>
              ) : (
                <div className="interviews-grid-modern">
                  {upcomingInterviews.map((interview) =>
                    renderInterviewCard(interview, false)
                  )}
                </div>
              )}

              {/* PAST INTERVIEWS */}
              {pastInterviews.length > 0 && (
                <div className="past-interviews-container">
                  <div
                    className="interview-section-header"
                    style={{ marginTop: "40px" }}
                  >
                    <h4>Past Interviews</h4>
                  </div>

                  <div className="interviews-grid-modern">
                    {pastInterviews.map((interview) =>
                      renderInterviewCard(interview, true)
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default InterviewList;

