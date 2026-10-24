import { useEffect, useState, useCallback } from "react";
import "./RecruiterDashboard.css";

const API = "http://127.0.0.1:8000/api/jobs";

function RecruiterDashboard({ goApplications, goPostJob, goLogout }) {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  console.log("Dashboard Loading:", loading);
  console.log("Dashboard Jobs:", jobs.length);
  console.log("Dashboard Applications:", applications.length);
  console.log("Dashboard Interviews:", interviews.length);
  const [updatingInterview, setUpdatingInterview] = useState(null);
  const [updatingApplication, setUpdatingApplication] = useState(null);
  

  const [interviewMessage, setInterviewMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  const [form, setForm] = useState({
    application: "",
    interview_date: "",
    interview_time: "",
    interview_type: "online",
    meeting_link: "",
    location: "",
    notes: "",
  });

  const recruiterId = Number(localStorage.getItem("userId")) || 1;
  const currentUsername = localStorage.getItem("currentUser") || "Recruiter";

  const showMessage = (message, type = "success") => {
    setInterviewMessage(message);
    setMessageType(type);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const jobsResponse = await fetch(`${API}/`);

      if (!jobsResponse.ok) {
        throw new Error("Unable to fetch jobs.");
      }

      const jobsData = await jobsResponse.json();
      console.log("Logged-in Recruiter ID:", recruiterId);
      console.log("Jobs API Response:", jobsData);

      const recruiterJobs = Array.isArray(jobsData)
        ? jobsData.filter(
            (job) => Number(job.recruiter) === recruiterId
          )
        : [];


      console.log("Filtered Recruiter Jobs:", recruiterJobs);

      setJobs(recruiterJobs);

      const applicationResponses = await Promise.all(
        recruiterJobs.map(async (job) => {
          const response = await fetch(
            `${API}/applications/?job=${job.id}`
          );

          if (!response.ok) {
            console.error(`Unable to fetch applications for job ${job.id}`);
            return [];
          }

          const data = await response.json();
          console.log("Applications for Job:", job.id);
          console.log("Applications API Response:", data);
          return Array.isArray(data) ? data : [];
        })
      );

      const applicationMap = new Map();

      applicationResponses.flat().forEach((application) => {
        applicationMap.set(Number(application.id), application);
      });

      const uniqueApplications = Array.from(applicationMap.values());

      setApplications(uniqueApplications);

      const interviewResponse = await fetch(
        `${API}/interviews/list/`
      );

      if (!interviewResponse.ok) {
        throw new Error("Unable to fetch interviews.");
      }

      const interviewData = await interviewResponse.json();
      console.log("Interviews API Response:", interviewData);
      console.log("Applications Loaded:", uniqueApplications);

      const recruiterApplicationIds = new Set(
        uniqueApplications.map((application) => Number(application.id))
      );

      const recruiterInterviews = Array.isArray(interviewData)
        ? interviewData.filter((interview) =>
            recruiterApplicationIds.has(Number(interview.application))
          )
        : [];

      console.log("Recruiter Interviews:", recruiterInterviews);

      setInterviews(recruiterInterviews);
      console.log("Final Applications Count:", uniqueApplications.length);
      console.log("Final Recruiter Jobs Count:", recruiterJobs.length);
    } 
    catch (error) {
      console.error("Recruiter dashboard error:", error);
      showMessage(
        error.message || "Unable to load dashboard data.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [recruiterId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const averageScore =
    applications.length > 0
      ? Math.round(
          applications.reduce(
            (total, application) =>
              total + Number(application.ai_score || 0),
            0
          ) / applications.length
        )
      : 0;

  const shortlistedCount = applications.filter(
    (application) =>
      application.status === "shortlisted" ||
      application.status === "selected"
  ).length;


  const recentCandidates = [
  ...new Map(
    [...applications]
      .sort(
        (a, b) =>
          new Date(b.applied_at || 0).getTime() -
          new Date(a.applied_at || 0).getTime()
      )
      .map((application) => [
        Number(application.candidate),
        application,
      ])
  ).values(),
].slice(0, 5);

  const scheduledApplicationIds = new Set(
    interviews.map((interview) => Number(interview.application))
  );

  const availableApplications = applications.filter(
    (application) =>
      !scheduledApplicationIds.has(Number(application.id)) &&
      !["rejected", "interview"].includes(application.status)
  );

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  


const handleApplicationStatus = async (applicationId, newStatus) => {
  setUpdatingApplication(applicationId);
  setInterviewMessage("");
  setMessageType("");

  try {
    const response = await fetch(
      `${API}/applications/${applicationId}/status/`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
          data.detail ||
          "Unable to update application status."
      );
    }

    const updatedApplication = data.application || data;

    setApplications((previous) =>
      previous.map((application) =>
        Number(application.id) === Number(applicationId)
          ? {
              ...application,
              ...updatedApplication,
              status: updatedApplication.status || newStatus,
            }
          : application
      )
    );

    showMessage(
      `Application #${applicationId} updated to ${formatStatus(newStatus)}.`,
      "success"
    );

    await fetchData();
  } catch (error) {
    console.error("Application status update error:", error);

    showMessage(
      error.message || "Unable to update application status.",
      "error"
    );
  } finally {
    setUpdatingApplication(null);
  }
};



  const handleScheduleInterview = async (event) => {
    event.preventDefault();

    setInterviewMessage("");
    setMessageType("");

    if (!form.application) {
      showMessage("Please select a candidate application.", "error");
      return;
    }

    if (!form.interview_date || !form.interview_time) {
      showMessage("Please select the interview date and time.", "error");
      return;
    }

    if (
      form.interview_type === "online" &&
      !form.meeting_link.trim()
    ) {
      showMessage("Please enter the online meeting link.", "error");
      return;
    }

    if (
      form.interview_type === "offline" &&
      !form.location.trim()
    ) {
      showMessage("Please enter the interview location.", "error");
      return;
    }

    setScheduling(true);

    try {
      const payload = {
        application: Number(form.application),
        interview_date: form.interview_date,
        interview_time: form.interview_time,
        interview_type: form.interview_type,
        meeting_link:
          form.interview_type === "online"
            ? form.meeting_link.trim()
            : "",
        location:
          form.interview_type === "offline"
            ? form.location.trim()
            : "",
        notes: form.notes.trim(),
      };

      const response = await fetch(
        `${API}/interviews/create/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.error ||
          data.detail ||
          Object.entries(data)
            .map(([field, errors]) => {
              const message = Array.isArray(errors)
                ? errors.join(", ")
                : String(errors);

              return `${field}: ${message}`;
            })
            .join(" | ") ||
          "Unable to schedule interview.";

        throw new Error(errorMessage);
      }

      setForm({
        application: "",
        interview_date: "",
        interview_time: "",
        interview_type: "online",
        meeting_link: "",
        location: "",
        notes: "",
      });

      setShowScheduleForm(false);

      showMessage("Interview scheduled successfully!", "success");

      await fetchData();
    } catch (error) {
      console.error("Schedule interview error:", error);

      showMessage(
        error.message || "Unable to schedule interview.",
        "error"
      );
    } finally {
      setScheduling(false);
    }
  };

  const handleInterviewStatus = async (interviewId, newStatus) => {
    setUpdatingInterview(interviewId);
    setInterviewMessage("");
    setMessageType("");

    try {
      const response = await fetch(
        `${API}/interviews/${interviewId}/update/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recruiter_id: recruiterId,
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.detail ||
            "Unable to update interview status."
        );
      }

      const updatedInterview = data.interview || data;

      setInterviews((previous) =>
        previous.map((interview) =>
          Number(interview.id) === Number(interviewId)
            ? {
                ...interview,
                ...updatedInterview,
                status: updatedInterview.status || newStatus,
              }
            : interview
        )
      );

      showMessage(
        `Interview #${interviewId} status updated to ${newStatus}.`,
        "success"
      );
    } catch (error) {
      console.error("Interview status update error:", error);

      showMessage(
        error.message || "Unable to update interview status.",
        "error"
      );
    } finally {
      setUpdatingInterview(null);
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

  const formatStatus = (status) => {
    if (!status) return "Unknown";

    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const selectedApplication = applications.find(
    (application) =>
      Number(application.id) === Number(form.application)
  );

  return (
    <div className="dashboard-layout">
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
            <span>Recruiter</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className="nav-item active">
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

      <main className="main-content">
        <header className="topbar">
          <h2>Recruiter Overview</h2>

          <div className="topbar-actions">
            <div className="topbar-profile-pic">
              {currentUsername.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="dashboard-scrollable">
          <div className="page-header-row">
            <div>
              <h3>Manage Your Hiring</h3>
              <p>
                Find candidates, manage jobs, and track interview progress.
              </p>
            </div>
          </div>

          {interviewMessage && (
            <div
              className={`form-message ${messageType}`}
              role="status"
              aria-live="polite"
            >
              {interviewMessage}
            </div>
          )}

          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-info">
                <span>Total Jobs</span>
                <h3>{loading ? "..." : jobs.length}</h3>
              </div>
              <div className="stat-icon blue-light">💼</div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <span>Total Applications</span>
                <h3>{loading ? "..." : applications.length}</h3>
              </div>
              <div className="stat-icon purple-light">👥</div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <span>Average AI Score</span>
                <h3>{loading ? "..." : `${averageScore}%`}</h3>
              </div>
              <div className="stat-icon orange-light">🤖</div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <span>Shortlisted</span>
                <h3>{loading ? "..." : shortlistedCount}</h3>
              </div>
              <div className="stat-icon green-light">⭐</div>
            </div>
          </section>

          <section className="dashboard-full-section">
            <div className="section-header-flex">
              <h3>Your Job Postings</h3>

              <button className="btn-primary-small" onClick={goPostJob}>
                + Post New Job
              </button>
            </div>

            {loading ? (
              <div className="empty-state-box">
                <span className="empty-icon">⏳</span>
                <h3>Loading jobs...</h3>
              </div>
            ) : jobs.length === 0 ? (
              <div className="empty-state-box">
                <span className="empty-icon">💼</span>
                <h3>No jobs posted yet</h3>
                <p>Post your first job to start receiving applications.</p>
              </div>
            ) : (
              <div className="r-jobs-grid">
                {jobs.map((job) => {
                  const jobApplications = applications.filter(
                    (application) =>
                      Number(application.job) === Number(job.id)
                  );

                  const jobAverageScore =
                    jobApplications.length > 0
                      ? Math.round(
                          jobApplications.reduce(
                            (total, application) =>
                              total + Number(application.ai_score || 0),
                            0
                          ) / jobApplications.length
                        )
                      : 0;

                  return (
                    <div className="r-job-card" key={job.id}>
                      <div className="r-job-header">
                        <div className="r-job-icon">💼</div>

                        <div className="r-job-title">
                          <h4>{job.title}</h4>
                          <p>
                            {job.company} • {job.location}
                          </p>
                        </div>
                      </div>

                      <div className="r-job-metrics">
                        <div className="r-metric">
                          <strong>{jobApplications.length}</strong>
                          <span>Candidates</span>
                        </div>

                        <div className="r-metric">
                          <strong>{jobAverageScore}%</strong>
                          <span>Avg Score</span>
                        </div>
                      </div>

                      <button
                        className="btn-outline-blue w-100"
                        onClick={() => goApplications(job.id)}
                      >
                        View Applications →
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <div className="dashboard-columns">
            <div className="column-left">
  <div className="section-header-flex">
    <h3>Recent Candidates</h3>
  </div>

  {loading ? (
    <div className="empty-state-box small">
      <span className="empty-icon">⏳</span>
      <p>Loading candidates...</p>
    </div>
  ) : recentCandidates.length === 0 ? (
    <div className="empty-state-box small">
      <span className="empty-icon">📋</span>
      <p>No applications yet.</p>
    </div>
  ) : (
    <div className="r-cards-list">
      {recentCandidates.map((application) => (
        <div
          className="r-candidate-card"
          key={application.id}
        >
          <div className="r-cand-avatar">👤</div>

          <div className="r-cand-info">
            <h4>Candidate #{application.candidate}</h4>
            <p>App for Job #{application.job}</p>
          </div>

          <div className="r-cand-score">
            <strong>
              {Number(application.ai_score || 0)}%
            </strong>
            <span>AI Match</span>
          </div>


        
<div className="r-candidate-status">
  <span
    className={`status-badge-small ${
      application.status || "applied"
    }`}
  >
    {formatStatus(application.status)}
  </span>

  <label htmlFor={`application-status-${application.id}`}>
    Update Status
  </label>

  <select
    id={`application-status-${application.id}`}
    className="status-select"
    value={application.status || "applied"}
    disabled={
      Number(updatingApplication) === Number(application.id)
    }
    onChange={(event) =>
      handleApplicationStatus(
        application.id,
        event.target.value
      )
    }
  >
    <option value="applied">Applied</option>
    <option value="shortlisted">Shortlisted</option>
    <option value="interview">Interview</option>
    <option value="selected">Selected</option>
    <option value="rejected">Rejected</option>
  </select>

  {Number(updatingApplication) === Number(application.id) && (
    <span className="updating-text">Updating...</span>
  )}
</div>






          
        </div>
      ))}
    </div>
  )}
</div>
            <div className="column-right">
              <div className="section-header-flex">
                <h3>Interview Management</h3>

                <button
                  type="button"
                  className="btn-primary-small"
                  onClick={() => {
                    setShowScheduleForm((previous) => !previous);
                    setInterviewMessage("");
                    setMessageType("");
                  }}
                >
                  {showScheduleForm ? "✕ Close" : "+ Schedule Interview"}
                </button>
              </div>

              {showScheduleForm && (
                <form
                  className="hireai-interview-form"
                  onSubmit={handleScheduleInterview}
                >
                  <h4>📅 Schedule a New Interview</h4>
                  <p>Select a candidate and enter the interview details.</p>

                  <label htmlFor="interview-application">
                    Candidate Application *
                  </label>

                  <select
                    id="interview-application"
                    name="application"
                    value={form.application}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select candidate application</option>

                    {availableApplications.map((application) => (
                      <option key={application.id} value={application.id}>
                        Candidate #{application.candidate} —{" "}
                        {application.job_title || `Job #${application.job}`}{" "}
                        (App #{application.id})
                      </option>
                    ))}
                  </select>

                  {availableApplications.length === 0 && (
                    <small>
                      No eligible applications are available for scheduling.
                    </small>
                  )}

                  {selectedApplication && (
                    <div className="hireai-selected-candidate">
                      <strong>
                        {selectedApplication.job_title ||
                          `Job #${selectedApplication.job}`}
                      </strong>
                      <span>
                        Candidate #{selectedApplication.candidate} · AI Match{" "}
                        {Number(selectedApplication.ai_score || 0)}%
                      </span>
                    </div>
                  )}

                  <div className="hireai-form-grid">
                    <div>
                      <label htmlFor="interview-date">Interview Date *</label>
                      <input
                        id="interview-date"
                        type="date"
                        name="interview_date"
                        value={form.interview_date}
                        onChange={handleFormChange}
                        min={new Date().toLocaleDateString("en-CA")}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="interview-time">Interview Time *</label>
                      <input
                        id="interview-time"
                        type="time"
                        name="interview_time"
                        value={form.interview_time}
                        onChange={handleFormChange}
                        required
                      />
                    </div>
                  </div>

                  <label htmlFor="interview-type">Interview Type *</label>

                  <select
                    id="interview-type"
                    name="interview_type"
                    value={form.interview_type}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                  </select>

                  {form.interview_type === "online" ? (
                    <>
                      <label htmlFor="meeting-link">Meeting Link *</label>
                      <input
                        id="meeting-link"
                        type="url"
                        name="meeting_link"
                        placeholder="https://meet.google.com/..."
                        value={form.meeting_link}
                        onChange={handleFormChange}
                        required
                      />
                    </>
                  ) : (
                    <>
                      <label htmlFor="interview-location">
                        Interview Location *
                      </label>
                      <input
                        id="interview-location"
                        type="text"
                        name="location"
                        placeholder="Office address or venue"
                        value={form.location}
                        onChange={handleFormChange}
                        required
                      />
                    </>
                  )}

                  <label htmlFor="interview-notes">
                    Notes / Instructions
                  </label>

                  <textarea
                    id="interview-notes"
                    name="notes"
                    rows="3"
                    placeholder="Example: Please join 10 minutes early."
                    value={form.notes}
                    onChange={handleFormChange}
                  />

                  <div className="hireai-form-actions">
                    <button
                      type="button"
                      className="btn-outline-blue"
                      onClick={() => setShowScheduleForm(false)}
                      disabled={scheduling}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="btn-primary-small"
                      disabled={
                        scheduling || availableApplications.length === 0
                      }
                    >
                      {scheduling ? "Scheduling..." : "✓ Schedule Interview"}
                    </button>
                  </div>
                </form>
              )}

              {loading ? (
                <div className="empty-state-box small">
                  <span className="empty-icon">⏳</span>
                  <p>Loading interviews...</p>
                </div>
              ) : interviews.length === 0 ? (
                <div className="empty-state-box small">
                  <span className="empty-icon">📅</span>
                  <p>No interviews scheduled yet.</p>
                </div>
              ) : (
                <div className="r-cards-list">
                  {interviews.map((interview) => (
                    <div className="r-interview-card" key={interview.id}>
                      <div className="r-int-details">
                        <h4>Interview #{interview.id}</h4>

                        <p>
                          Application #{interview.application} •{" "}
                          {interview.interview_type || "N/A"}
                        </p>

                        <span className="r-int-date">
                          📅 {interview.interview_date || "--"} | ⏰{" "}
                          {interview.interview_time || "--"}
                        </span>

                        {interview.interview_type === "online" &&
                          interview.meeting_link && (
                            <p>
                              <a
                                href={interview.meeting_link}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Join Meeting ↗
                              </a>
                            </p>
                          )}

                        {interview.interview_type === "offline" &&
                          interview.location && (
                            <p>📍 {interview.location}</p>
                          )}

                        {interview.notes && <p>{interview.notes}</p>}
                      </div>

                      <div className="r-int-actions">
                        <label htmlFor={`status-${interview.id}`}>
                          Update Status
                        </label>

                        <select
                          id={`status-${interview.id}`}
                          className={`status-select ${
                            interview.status || "scheduled"
                          }`}
                          value={interview.status || "scheduled"}
                          disabled={
                            Number(updatingInterview) === Number(interview.id)
                          }
                          onChange={(event) =>
                            handleInterviewStatus(
                              interview.id,
                              event.target.value
                            )
                          }
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>

                        {Number(updatingInterview) ===
                          Number(interview.id) && (
                          <span className="updating-text">Updating...</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <footer className="hireai-dashboard-footer">
            <strong>HireAI</strong>
            <p>AI-powered recruitment platform connecting talent with opportunity.</p>
            <span>© 2026 HireAI. All rights reserved.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default RecruiterDashboard;

