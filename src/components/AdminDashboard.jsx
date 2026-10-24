import React, { useEffect, useMemo, useState } from "react";
import "./AdminDashboard.css";
import "./AdminDashboardPremium.css";

const API = "http://127.0.0.1:8000";

function getToken() {
  return (
    localStorage.getItem("access") ||
    localStorage.getItem("token") ||
    ""
  );
}

function getHeaders() {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("") || "U";
}

function formatDate(date) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("Dashboard");

  const [users, setUsers] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);

  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [userSearch, setUserSearch] = useState("");
  const [userRole, setUserRole] = useState("all");
  const [recruiterSearch, setRecruiterSearch] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  // Dashboard data loading
  useEffect(() => {
    let cancelled = false;

    async function loadDashboardData() {
      setLoading(true);
      setError("");

      const requests = [
        {
          name: "users",
          url: `${API}/api/users/admin/users/`,
        },
        {
          name: "recruiters",
          url: `${API}/api/users/admin/recruiters/`,
        },
        {
          name: "jobs",
          url: `${API}/api/jobs/`,
        },
        {
          name: "applications",
          url: `${API}/api/jobs/applications/`,
        },
        {
          name: "analytics",
          url: `${API}/api/jobs/api/admin/analytics/`,
        },
      ];

      try {
        const results = await Promise.all(
          requests.map(async (request) => {
            const response = await fetch(request.url, {
              headers: getHeaders(),
            });

            if (!response.ok) {
              throw new Error(
                `${request.name} request failed (${response.status})`
              );
            }

            return {
              name: request.name,
              data: await response.json(),
            };
          })
        );

        if (cancelled) return;

        results.forEach(({ name, data }) => {
          if (name === "users") {
            setUsers(Array.isArray(data) ? data : data.results || data.users || []);
          }

          if (name === "recruiters") {
            setRecruiters(
              Array.isArray(data)
                ? data
                : data.results || data.recruiters || []
            );
          }

          if (name === "jobs") {
            setJobs(Array.isArray(data) ? data : data.results || []);
          }

          if (name === "applications") {
            setApplications(
              Array.isArray(data) ? data : data.results || []
            );
          }

          if (name === "analytics") {
            setAnalytics(data || {});
          }
        });
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load dashboard data.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // User search and role filter
  const filteredUsers = useMemo(() => {
    const search = userSearch.trim().toLowerCase();

    return users.filter((user) => {
      const name =
        user.username ||
        user.full_name ||
        user.name ||
        user.email ||
        "";

      const email = user.email || "";
      const role = (user.role || user.user_type || "candidate").toLowerCase();

      const matchesSearch =
        !search ||
        name.toLowerCase().includes(search) ||
        email.toLowerCase().includes(search);

      const matchesRole =
        userRole === "all" || role === userRole;

      return matchesSearch && matchesRole;
    });
  }, [users, userSearch, userRole]);

  // Recruiter search
  const filteredRecruiters = useMemo(() => {
    const search = recruiterSearch.trim().toLowerCase();

    return recruiters.filter((recruiter) => {
      const name =
        recruiter.username ||
        recruiter.full_name ||
        recruiter.name ||
        "";

      const email = recruiter.email || "";

      return (
        !search ||
        name.toLowerCase().includes(search) ||
        email.toLowerCase().includes(search)
      );
    });
  }, [recruiters, recruiterSearch]);


    // Dashboard statistics
  const totalUsers = users.length;
  const totalRecruiters = recruiters.length;
  const totalJobs = jobs.length;
  const totalApplications = applications.length;

  const shortlistedApplications = applications.filter(
    (application) =>
      String(application.status || "").toLowerCase() === "shortlisted"
  ).length;

  const recentApplications = useMemo(() => {
    return [...applications]
      .sort(
        (a, b) =>
          new Date(b.created_at || b.applied_at || 0) -
          new Date(a.created_at || a.applied_at || 0)
      )
      .slice(0, 5);
  }, [applications]);

  const navigationItems = [
    { name: "Dashboard", icon: "▦" },
    { name: "Users", icon: "♙" },
    { name: "Recruiters", icon: "♧" },
    { name: "Jobs", icon: "▤" },
    { name: "Applications", icon: "▣" },
    { name: "Reports", icon: "▥" },
    { name: "Settings", icon: "⚙" },
  ];

  function handleLogout() {
    localStorage.removeItem("access");
    localStorage.removeItem("token");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("currentUser");
    window.location.href = "/";
  }

  function refreshDashboard() {
    setRefreshKey((previous) => previous + 1);
  }

  function renderStatCard(title, value, icon, description) {
    return (
      <div className="admin-stat-card" key={title}>
        <div className="admin-stat-top">
          <span className="admin-stat-label">{title}</span>
          <span className="admin-stat-icon">{icon}</span>
        </div>

        <h2 className="admin-stat-value">{value}</h2>

        <p className="admin-stat-description">{description}</p>
      </div>
    );
  }

  function renderDashboard() {
    return (
      <>
        <div className="admin-page-heading">
          <div>
            <p className="admin-eyebrow">OVERVIEW</p>
            <h1>Admin Dashboard</h1>
            <p>Monitor your HireAI recruitment platform.</p>
          </div>

          <button
            className="admin-primary-button"
            onClick={refreshDashboard}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>

        {error && (
          <div className="admin-error-message">
            <strong>Unable to load some dashboard data.</strong>
            <p>{error}</p>
            <button onClick={refreshDashboard}>Try again</button>
          </div>
        )}

        <div className="admin-stats-grid">
          {renderStatCard(
            "Total Users",
            analytics.total_users ?? totalUsers,
            "♙",
            "Registered platform users"
          )}

          {renderStatCard(
            "Recruiters",
            analytics.total_recruiters ?? totalRecruiters,
            "♧",
            "Recruiter accounts"
          )}

          {renderStatCard(
            "Total Jobs",
            analytics.total_jobs ?? totalJobs,
            "▤",
            "Jobs posted on HireAI"
          )}

          {renderStatCard(
            "Applications",
            analytics.total_applications ?? totalApplications,
            "▣",
            "Applications received"
          )}
        </div>

        <div className="admin-content-grid">
          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <h2>Recent Applications</h2>
                <p>Latest candidate activity</p>
              </div>

              <button
                className="admin-text-button"
                onClick={() => setActiveTab("Applications")}
              >
                View all →
              </button>
            </div>

            {recentApplications.length === 0 ? (
              <div className="admin-empty-state">
                <span>▣</span>
                <h3>No applications yet</h3>
                <p>New applications will appear here.</p>
              </div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Job</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentApplications.map((application) => (
                      <tr key={application.id}>
                        <td>
                          {application.candidate_name ||
                            application.candidate?.username ||
                            application.candidate?.email ||
                            `Candidate #${application.candidate}`}
                        </td>

                        <td>
                          {application.job_title ||
                            application.job?.title ||
                            `Job #${application.job}`}
                        </td>

                        <td>
                          <span
                            className={`admin-status-badge ${String(
                              application.status || "applied"
                            )
                              .toLowerCase()
                              .replace(/\s+/g, "-")}`}
                          >
                            {application.status || "Applied"}
                          </span>
                        </td>

                        <td>
                          {formatDate(
                            application.created_at || application.applied_at
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="admin-panel admin-quick-actions">
            <div className="admin-panel-heading">
              <div>
                <h2>Quick Navigation</h2>
                <p>Manage your platform</p>
              </div>
            </div>

            {[
              ["Users", "Manage candidate accounts", "♙"],
              ["Recruiters", "View recruiter profiles", "♧"],
              ["Jobs", "Review posted jobs", "▤"],
              ["Applications", "Track applications", "▣"],
            ].map(([name, description, icon]) => (
              <button
                className="admin-quick-action"
                key={name}
                onClick={() => setActiveTab(name)}
              >
                <span className="admin-quick-icon">{icon}</span>

                <span className="admin-quick-text">
                  <strong>{name}</strong>
                  <small>{description}</small>
                </span>

                <span className="admin-quick-arrow">→</span>
              </button>
            ))}

            <div className="admin-mini-stat">
              <span>Shortlisted Applications</span>
              <strong>{shortlistedApplications}</strong>
            </div>
          </section>
        </div>
      </>
    );
  }


    function renderUsers() {
    return (
      <>
        <div className="admin-page-heading">
          <div>
            <p className="admin-eyebrow">USER MANAGEMENT</p>
            <h1>Users</h1>
            <p>Manage and monitor all registered user accounts.</p>
          </div>

          <div className="admin-heading-badge">
            <span className="admin-online-dot"></span>
            {users.length} Total Users
          </div>
        </div>

        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>All Users</h2>
              <p>Search users and filter by account role.</p>
            </div>

            <button
              className="admin-secondary-button"
              onClick={refreshDashboard}
              disabled={loading}
            >
              ↻ Refresh
            </button>
          </div>

          <div className="admin-toolbar">
            <div className="admin-search-box">
              <span>⌕</span>

              <input
                type="search"
                placeholder="Search by name or email..."
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
              />

              {userSearch && (
                <button
                  type="button"
                  onClick={() => setUserSearch("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            <select
              className="admin-filter-select"
              value={userRole}
              onChange={(event) => setUserRole(event.target.value)}
              aria-label="Filter users by role"
            >
              <option value="all">All Roles</option>
              <option value="candidate">Candidates</option>
              <option value="recruiter">Recruiters</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          <div className="admin-results-info">
            Showing <strong>{filteredUsers.length}</strong> of{" "}
            <strong>{users.length}</strong> users
          </div>

          {loading && users.length === 0 ? (
            <div className="admin-empty-state">
              <span className="admin-loading-spinner">◌</span>
              <h3>Loading users...</h3>
              <p>Please wait while we fetch user accounts.</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="admin-empty-state">
              <span>♙</span>
              <h3>No users found</h3>
              <p>
                {userSearch || userRole !== "all"
                  ? "Try changing your search or filter."
                  : "Registered users will appear here."}
              </p>

              {(userSearch || userRole !== "all") && (
                <button
                  className="admin-primary-button"
                  onClick={() => {
                    setUserSearch("");
                    setUserRole("all");
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="admin-profile-grid">
              {filteredUsers.map((user) => {
                const name =
                  user.full_name ||
                  user.username ||
                  user.name ||
                  "Unnamed User";

                const role = (
                  user.role ||
                  user.user_type ||
                  "candidate"
                ).toLowerCase();

                const isActive = user.is_active !== false;

                return (
                  <article className="admin-profile-card" key={user.id}>
                    <div className="admin-profile-card-top">
                      <div className="admin-avatar">
                        {getInitials(name)}
                      </div>

                      <span
                        className={`admin-role-badge ${role}`}
                      >
                        {role}
                      </span>
                    </div>

                    <h3 className="admin-profile-name">{name}</h3>

                    <p className="admin-profile-email">
                      {user.email || "No email provided"}
                    </p>

                    <div className="admin-profile-divider"></div>

                    <div className="admin-profile-detail">
                      <span>Account ID</span>
                      <strong>#{user.id ?? "—"}</strong>
                    </div>

                    <div className="admin-profile-detail">
                      <span>Account Status</span>

                      <span
                        className={`admin-status-badge ${
                          isActive ? "active" : "inactive"
                        }`}
                      >
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="admin-profile-detail">
                      <span>Joined</span>
                      <strong>
                        {formatDate(
                          user.date_joined || user.created_at
                        )}
                      </strong>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </>
    );
  }



    function renderRecruiters() {
    return (
      <>
        <div className="admin-page-heading">
          <div>
            <p className="admin-eyebrow">RECRUITER MANAGEMENT</p>
            <h1>Recruiters</h1>
            <p>Manage recruiter accounts and monitor their profiles.</p>
          </div>

          <div className="admin-heading-badge">
            <span className="admin-online-dot"></span>
            {recruiters.length} Total Recruiters
          </div>
        </div>

        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>All Recruiters</h2>
              <p>View recruiter information and account status.</p>
            </div>

            <button
              className="admin-secondary-button"
              onClick={refreshDashboard}
              disabled={loading}
            >
              ↻ Refresh
            </button>
          </div>

          <div className="admin-toolbar">
            <div className="admin-search-box">
              <span>⌕</span>

              <input
                type="search"
                placeholder="Search recruiters by name or email..."
                value={recruiterSearch}
                onChange={(event) =>
                  setRecruiterSearch(event.target.value)
                }
              />

              {recruiterSearch && (
                <button
                  type="button"
                  onClick={() => setRecruiterSearch("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="admin-results-info">
            Showing <strong>{filteredRecruiters.length}</strong> of{" "}
            <strong>{recruiters.length}</strong> recruiters
          </div>

          {loading && recruiters.length === 0 ? (
            <div className="admin-empty-state">
              <span className="admin-loading-spinner">◌</span>
              <h3>Loading recruiters...</h3>
              <p>Please wait while we fetch recruiter accounts.</p>
            </div>
          ) : filteredRecruiters.length === 0 ? (
            <div className="admin-empty-state">
              <span>♧</span>
              <h3>No recruiters found</h3>
              <p>
                {recruiterSearch
                  ? "Try another name or email."
                  : "Registered recruiters will appear here."}
              </p>

              {recruiterSearch && (
                <button
                  className="admin-primary-button"
                  onClick={() => setRecruiterSearch("")}
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="admin-profile-grid">
              {filteredRecruiters.map((recruiter) => {
                const name =
                  recruiter.full_name ||
                  recruiter.username ||
                  recruiter.name ||
                  "Unnamed Recruiter";

                const isActive = recruiter.is_active !== false;

                return (
                  <article
                    className="admin-profile-card recruiter-card"
                    key={recruiter.id}
                  >
                    <div className="admin-profile-card-top">
                      <div className="admin-avatar recruiter-avatar">
                        {getInitials(name)}
                      </div>

                      <span className="admin-role-badge recruiter">
                        Recruiter
                      </span>
                    </div>

                    <h3 className="admin-profile-name">{name}</h3>

                    <p className="admin-profile-email">
                      {recruiter.email || "No email provided"}
                    </p>

                    <div className="admin-profile-divider"></div>

                    <div className="admin-profile-detail">
                      <span>Recruiter ID</span>
                      <strong>#{recruiter.id ?? "—"}</strong>
                    </div>

                    <div className="admin-profile-detail">
                      <span>Account Status</span>

                      <span
                        className={`admin-status-badge ${
                          isActive ? "active" : "inactive"
                        }`}
                      >
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="admin-profile-detail">
                      <span>Joined</span>
                      <strong>
                        {formatDate(
                          recruiter.date_joined ||
                            recruiter.created_at
                        )}
                      </strong>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </>
    );
  }



    function renderJobs() {
    return (
      <>
        <div className="admin-page-heading">
          <div>
            <p className="admin-eyebrow">JOB MANAGEMENT</p>
            <h1>Jobs</h1>
            <p>Monitor job postings available on HireAI.</p>
          </div>

          <div className="admin-heading-badge">
            {jobs.length} Total Jobs
          </div>
        </div>

        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>All Job Postings</h2>
              <p>Review job titles, companies and locations.</p>
            </div>

            <button
              className="admin-secondary-button"
              onClick={refreshDashboard}
              disabled={loading}
            >
              ↻ Refresh
            </button>
          </div>

          {jobs.length === 0 ? (
            <div className="admin-empty-state">
              <span>▤</span>
              <h3>No jobs available</h3>
              <p>Job postings will appear here.</p>
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Job Details</th>
                    <th>Company</th>
                    <th>Location</th>
                    <th>Experience</th>
                    <th>Posted Date</th>
                  </tr>
                </thead>

                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id}>
                      <td>
                        <div className="admin-job-title">
                          <strong>{job.title || "Untitled Job"}</strong>
                          <small>Job ID: #{job.id}</small>
                        </div>
                      </td>

                      <td>{job.company || "—"}</td>

                      <td>{job.location || "Not specified"}</td>

                      <td>{job.experience || "—"}</td>

                      <td>{formatDate(job.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </>
    );
  }


    function renderApplications() {
    return (
      <>
        <div className="admin-page-heading">
          <div>
            <p className="admin-eyebrow">APPLICATION MANAGEMENT</p>
            <h1>Applications</h1>
            <p>Track candidate applications and their current status.</p>
          </div>

          <div className="admin-heading-badge">
            {applications.length} Total Applications
          </div>
        </div>

        <div className="admin-stats-grid">
          {renderStatCard(
            "Total Applications",
            applications.length,
            "▣",
            "All submitted applications"
          )}

          {renderStatCard(
            "Shortlisted",
            applications.filter(
              (item) =>
                String(item.status || "").toLowerCase() ===
                "shortlisted"
            ).length,
            "⭐",
            "Candidates shortlisted"
          )}

          {renderStatCard(
            "Interviews",
            applications.filter(
              (item) =>
                String(item.status || "").toLowerCase() ===
                "interview"
            ).length,
            "📅",
            "Applications in interview stage"
          )}

          {renderStatCard(
            "Rejected",
            applications.filter(
              (item) =>
                String(item.status || "").toLowerCase() ===
                "rejected"
            ).length,
            "×",
            "Rejected applications"
          )}
        </div>

        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>All Applications</h2>
              <p>Candidate applications and AI matching scores.</p>
            </div>

            <button
              className="admin-secondary-button"
              onClick={refreshDashboard}
              disabled={loading}
            >
              ↻ Refresh
            </button>
          </div>

          {applications.length === 0 ? (
            <div className="admin-empty-state">
              <span>▣</span>
              <h3>No applications found</h3>
              <p>Submitted applications will appear here.</p>
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Job</th>
                    <th>AI Match</th>
                    <th>Status</th>
                    <th>Applied Date</th>
                  </tr>
                </thead>

                <tbody>
                  {applications.map((application) => {
                    const status = String(
                      application.status || "applied"
                    ).toLowerCase();

                    const score = Number(application.ai_score);

                    return (
                      <tr key={application.id}>
                        <td>
                          <div className="admin-job-title">
                            <strong>
                              {application.candidate_name ||
                                application.candidate?.username ||
                                application.candidate?.email ||
                                `Candidate #${application.candidate ?? "—"}`}
                            </strong>

                            <small>
                              Application #{application.id}
                            </small>
                          </div>
                        </td>

                        <td>
                          {application.job_title ||
                            application.job?.title ||
                            `Job #${application.job ?? "—"}`}
                        </td>

                        <td>
                          <span className="admin-ai-score">
                            {Number.isFinite(score)
                              ? `${score}%`
                              : "—"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`admin-status-badge ${status.replace(
                              /\s+/g,
                              "-"
                            )}`}
                          >
                            {status.charAt(0).toUpperCase() +
                              status.slice(1)}
                          </span>
                        </td>

                        <td>
                          {formatDate(
                            application.created_at ||
                              application.applied_at
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </>
    );
  }


    function renderReports() {
    const statusCounts = {
      Applied: applications.filter(
        (item) => String(item.status).toLowerCase() === "applied"
      ).length,
      Shortlisted: applications.filter(
        (item) => String(item.status).toLowerCase() === "shortlisted"
      ).length,
      Interview: applications.filter(
        (item) => String(item.status).toLowerCase() === "interview"
      ).length,
      Rejected: applications.filter(
        (item) => String(item.status).toLowerCase() === "rejected"
      ).length,
    };

    return (
      <>
        <div className="admin-page-heading">
          <div>
            <p className="admin-eyebrow">PLATFORM INSIGHTS</p>
            <h1>Reports & Analytics</h1>
            <p>Review recruitment activity across HireAI.</p>
          </div>

          <button
            className="admin-primary-button"
            onClick={refreshDashboard}
          >
            ↻ Refresh Reports
          </button>
        </div>

        <div className="admin-stats-grid">
          {renderStatCard("Total Users", totalUsers, "♙", "Registered users")}
          {renderStatCard("Recruiters", totalRecruiters, "♧", "Recruiter accounts")}
          {renderStatCard("Job Postings", totalJobs, "▤", "Available jobs")}
          {renderStatCard("Applications", totalApplications, "▣", "Applications received")}
        </div>

        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>Application Status Report</h2>
              <p>Breakdown of current application statuses.</p>
            </div>
          </div>

          <div className="admin-report-list">
            {Object.entries(statusCounts).map(([status, count]) => {
              const percentage =
                totalApplications > 0
                  ? Math.round((count / totalApplications) * 100)
                  : 0;

              return (
                <div className="admin-report-row" key={status}>
                  <div className="admin-report-label">
                    <span>{status}</span>
                    <strong>{count}</strong>
                  </div>

                  <div className="admin-progress-track">
                    <div
                      className="admin-progress-fill"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <small>{percentage}%</small>
                </div>
              );
            })}
          </div>
        </section>
      </>
    );
  }


    function renderSettings() {
    return (
      <>
        <div className="admin-page-heading">
          <div>
            <p className="admin-eyebrow">PREFERENCES</p>
            <h1>Settings</h1>
            <p>View your HireAI administration settings.</p>
          </div>
        </div>

        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>Platform Information</h2>
              <p>Basic information about your recruitment platform.</p>
            </div>
          </div>

          <div className="admin-settings-list">
            <div className="admin-setting-row">
              <div>
                <strong>Platform Name</strong>
                <p>The name displayed across your application.</p>
              </div>

              <span className="admin-setting-value">HireAI</span>
            </div>

            <div className="admin-setting-row">
              <div>
                <strong>Application Type</strong>
                <p>Recruitment and talent management platform.</p>
              </div>

              <span className="admin-setting-value">Recruitment</span>
            </div>

            <div className="admin-setting-row">
              <div>
                <strong>Frontend</strong>
                <p>User interface technology.</p>
              </div>

              <span className="admin-setting-value">React.js</span>
            </div>

            <div className="admin-setting-row">
              <div>
                <strong>Backend</strong>
                <p>Server-side application technology.</p>
              </div>

              <span className="admin-setting-value">Django REST</span>
            </div>

            <div className="admin-setting-row">
              <div>
                <strong>Database</strong>
                <p>Application data storage.</p>
              </div>

              <span className="admin-setting-value">SQL</span>
            </div>
          </div>
        </section>

        <section className="admin-panel admin-danger-panel">
          <div>
            <h2>Account Actions</h2>
            <p>Sign out of the administration dashboard.</p>
          </div>

          <button
            className="admin-danger-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </section>
      </>
    );
  }



    function renderActivePage() {
    switch (activeTab) {
      case "Dashboard":
        return renderDashboard();

      case "Users":
        return renderUsers();

      case "Recruiters":
        return renderRecruiters();

      case "Jobs":
        return renderJobs();

      case "Applications":
        return renderApplications();

      case "Reports":
        return renderReports();

      case "Settings":
        return renderSettings();

      default:
        return renderDashboard();
    }
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-icon">H</div>

          <div>
            <h2>HireAI</h2>
            <span>ADMIN PORTAL</span>
          </div>
        </div>

        <div className="admin-sidebar-section">
          <p className="admin-sidebar-label">MAIN MENU</p>

          <nav className="admin-navigation">
            {navigationItems.map((item) => (
              <button
                type="button"
                key={item.name}
                className={`admin-nav-item ${
                  activeTab === item.name ? "active" : ""
                }`}
                onClick={() => setActiveTab(item.name)}
              >
                <span className="admin-nav-icon">{item.icon}</span>
                <span>{item.name}</span>

                {activeTab === item.name && (
                  <span className="admin-nav-indicator" />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-avatar">A</div>

          <div className="admin-sidebar-user">
            <strong>Administrator</strong>
            <span>System Admin</span>
          </div>

          <button
            type="button"
            className="admin-logout-icon"
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
          >
            ↗
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-breadcrumb">
            <span>HireAI</span>
            <span>/</span>
            <strong>{activeTab}</strong>
          </div>

          <div className="admin-topbar-right">
            <span className="admin-system-status">
              <span className="admin-online-dot"></span>
              Admin Portal
            </span>

            <button
              type="button"
              className="admin-topbar-refresh"
              onClick={refreshDashboard}
              title="Refresh dashboard"
              aria-label="Refresh dashboard"
            >
              ↻
            </button>

            <div className="admin-topbar-avatar">A</div>
          </div>
        </header>

        <div className="admin-page-content">
          {renderActivePage()}
        </div>

        <footer className="admin-footer">
          <span>© {new Date().getFullYear()} HireAI</span>
          <span>AI-Powered Recruitment Platform</span>
        </footer>
      </main>
    </div>
  );
}

export default AdminDashboard;