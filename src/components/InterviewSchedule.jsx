import { useState } from "react";
import "./InterviewSchedule.css";

function InterviewSchedule({ applicationId, goBack, goDashboard, goPostJob, goLogout }) {
  const [formData, setFormData] = useState({
    interview_date: "",
    interview_time: "",
    interview_type: "online",
    meeting_link: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const currentUsername = localStorage.getItem("currentUser") || "Recruiter";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!applicationId) {
      setError("Application ID is missing. Please select a candidate again.");
      return;
    }

    if (!formData.interview_date || !formData.interview_time) {
      setError("Please select the interview date and time.");
      return;
    }

    if (
      formData.interview_type === "online" &&
      !formData.meeting_link.trim()
    ) {
      setError("Please enter the online meeting link.");
      return;
    }

    const payload = {
      application: Number(applicationId),
      interview_date: formData.interview_date,
      interview_time: formData.interview_time,
      interview_type: formData.interview_type,
      meeting_link:
        formData.interview_type === "online"
          ? formData.meeting_link.trim()
          : "",
    };

    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/jobs/interviews/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          data.detail ||
          data.error ||
          Object.values(data).flat().join(" ") ||
          "Unable to schedule the interview.";

        throw new Error(message);
      }

      setSuccess("Interview scheduled successfully! 🎉");
      setFormData({
        interview_date: "",
        interview_time: "",
        interview_type: "online",
        meeting_link: "",
      });
    } catch (requestError) {
      console.error("Interview scheduling error:", requestError);
      setError(
        requestError.message || "Unable to connect to the backend server."
      );
    } finally {
      setLoading(false);
    }
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
          <button className="nav-item" onClick={goDashboard}>
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
            <button className="back-btn-modern" onClick={goBack}>
               ← Back
            </button>
            <h2>Schedule Interview</h2>
          </div>
          <div className="topbar-actions">
            <div className="topbar-profile-pic">
              {currentUsername.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="dashboard-scrollable">
          <section className="schedule-card-modern">
            <div className="schedule-card-heading">
              <div>
                <p>INTERVIEW DETAILS</p>
                <h2>Create Interview Schedule</h2>
              </div>

              <span className="application-badge">
                Application #{applicationId || "N/A"}
              </span>
            </div>

            {error && (
              <div className="schedule-message error-message">
                {error}
              </div>
            )}

            {success && (
              <div className="schedule-message success-message">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="schedule-field">
                <label htmlFor="interview_date">Interview Date</label>
                <input
                  id="interview_date"
                  type="date"
                  name="interview_date"
                  value={formData.interview_date}
                  min={new Date().toLocaleDateString("en-CA")}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="schedule-field">
                <label htmlFor="interview_time">Interview Time</label>
                <input
                  id="interview_time"
                  type="time"
                  name="interview_time"
                  value={formData.interview_time}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="schedule-field">
                <label htmlFor="interview_type">Interview Type</label>
                <select
                  id="interview_type"
                  name="interview_type"
                  value={formData.interview_type}
                  onChange={handleChange}
                  required
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                </select>
              </div>

              {formData.interview_type === "online" && (
                <div className="schedule-field">
                  <label htmlFor="meeting_link">Meeting Link</label>
                  <input
                    id="meeting_link"
                    type="url"
                    name="meeting_link"
                    placeholder="https://meet.google.com/..."
                    value={formData.meeting_link}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}

              {formData.interview_type === "offline" && (
                <div className="schedule-info">
                  <span>📍</span>
                  <p>
                    This interview is marked as offline. Confirm the interview location with the candidate separately.
                  </p>
                </div>
              )}

              <div className="schedule-actions">
                <button
                  type="button"
                  className="schedule-back-button"
                  onClick={goBack}
                  disabled={loading}
                >
                  ← Back to Applications
                </button>

                <button
                  type="submit"
                  className="schedule-submit-button"
                  disabled={loading || !applicationId}
                >
                  {loading ? "Scheduling..." : "Schedule Interview"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

export default InterviewSchedule;