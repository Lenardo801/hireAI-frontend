import { useEffect, useState } from "react";
import "./Jobs.css";

function Jobs({ goHome, goDashboard, goLogin }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("");

  // Temporary test candidate
  const candidateId = Number(localStorage.getItem("userId")) || 2;

  // Store AI result for each job
  const [aiResults, setAiResults] = useState({});

  // Track which job is being submitted
  const [applyingJobId, setApplyingJobId] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/jobs/")
      .then((response) => response.json())
      .then((data) => {
        setJobs(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Jobs error:", error);
        setLoading(false);
      });
  }, []);

  // Filter Jobs Logic
  const filteredJobs = jobs.filter((job) => {
    const matchSearch =
      job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.skills?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchLocation = locationFilter
      ? job.location?.toLowerCase().includes(locationFilter.toLowerCase())
      : true;

    const matchExperience = experienceFilter
      ? job.experience?.toLowerCase().includes(experienceFilter.toLowerCase())
      : true;

    return matchSearch && matchLocation && matchExperience;
  });

  // ==============================
  // APPLY FOR JOB
  // ==============================
  
const handleApply = async (jobId) => {
  // Check whether the candidate is logged in
  const isLoggedIn =
    localStorage.getItem("isLoggedIn") === "true";

  const role = localStorage.getItem("userRole");
  const storedUserId = localStorage.getItem("userId");

  // Login is required to apply
  if (!isLoggedIn || role !== "candidate" || !storedUserId) {
    alert("Please login as a candidate to apply for this job.");

    if (typeof goLogin === "function") {
      goLogin();
    }

    return;
  }

  const candidateId = Number(storedUserId);

  const resumeInput = document.getElementById(`resume-${jobId}`);
  const resumeFile = resumeInput?.files?.[0];

  if (!resumeFile) {
    alert("Please upload your resume (PDF/DOCX) before applying.");
    return;
  }

  const formData = new FormData();
  formData.append("candidate", candidateId);
  formData.append("job", jobId);
  formData.append("resume", resumeFile);

  setApplyingJobId(jobId);

  try {
    const response = await fetch(
      "http://127.0.0.1:8000/api/jobs/apply/",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (response.ok) {
      setAiResults((previousResults) => ({
        ...previousResults,
        [jobId]: {
          score: data.ai_score || 0,
          matchedSkills: data.matched_skills || [],
          missingSkills: data.missing_skills || [],
        },
      }));

      alert(
        `Application submitted successfully! 🎉\n\nAI Match Score: ${data.ai_score}%`
      );
    } else {
      alert(
        data.error ||
        data.detail ||
        JSON.stringify(data)
      );
    }
  } catch (error) {
    console.error("Application error:", error);
    alert("Backend server is not running or the request failed.");
  } finally {
    setApplyingJobId(null);
  }
};


  return (
    <div className="jobs-layout-container">
      
      {/* ==============================
          HEADER (Search Area)
      ============================== */}
      <header className="jobs-top-header">
        <div className="jobs-brand" onClick={goHome} style={{ cursor: 'pointer' }}>
          <div className="brand-icon">H</div>
          <span>Hire<strong>AI</strong></span>
        </div>
        
        <div className="jobs-search-wrapper">
          <div className="search-bar-main">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search jobs, skills or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="jobs-header-actions" style={{ display: 'flex', gap: '12px' }}>
           <button className="btn-outline" onClick={goHome}>Home</button>
           <button 
             className="btn-outline" 
             style={{ background: '#111827', color: 'white', borderColor: '#111827' }} 
             onClick={goDashboard}
           >
             Dashboard
           </button>
        </div>
      </header>

      {/* ==============================
          MAIN LAYOUT (Sidebar + Grid)
      ============================== */}
      <div className="jobs-body-wrapper">
        
        {/* SIDEBAR FILTERS */}
        <aside className="jobs-sidebar-filters">
          <div className="filter-header">
            <h3>Filters</h3>
            <button 
              className="clear-filters-btn" 
              onClick={() => {
                setSearchTerm("");
                setLocationFilter("");
                setExperienceFilter("");
              }}
            >
              Clear All
            </button>
          </div>

          <div className="filter-group">
            <label>Location</label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            >
              <option value="">All Locations</option>
              <option value="chennai">Chennai</option>
              <option value="bangalore">Bangalore</option>
              <option value="hyderabad">Hyderabad</option>
              <option value="remote">Remote</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Experience</label>
            <select
              value={experienceFilter}
              onChange={(e) => setExperienceFilter(e.target.value)}
            >
              <option value="">Any Experience</option>
              <option value="fresher">Fresher (0 yrs)</option>
              <option value="1-3">1-3 Years</option>
              <option value="3-5">3-5 Years</option>
              <option value="5+">5+ Years</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Job Type</label>
            <select defaultValue="">
              <option value="">All Types</option>
              <option value="full-time">Full Time</option>
              <option value="part-time">Part Time</option>
              <option value="contract">Contract</option>
            </select>
          </div>
          
          <button className="btn-filter-apply">Apply Filters</button>
        </aside>

        {/* JOBS LISTING AREA */}
        <main className="jobs-list-area">
          <div className="jobs-list-header">
            <h2>Recommended Jobs</h2>
            <span>Showing {filteredJobs.length} results</span>
          </div>

          {loading ? (
            <div className="jobs-empty-state">
              <span className="empty-icon">⏳</span>
              <h3>Loading jobs...</h3>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="jobs-empty-state">
              <span className="empty-icon">🔎</span>
              <h3>No jobs found</h3>
              <p>Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="jobs-cards-grid">
              {filteredJobs.map((job) => {
                const result = aiResults[job.id];
                const companyInitial = job.company ? job.company.charAt(0).toUpperCase() : "C";

                return (
                  <div className="job-card-modern" key={job.id}>
                    {/* Job Header */}
                    <div className="card-top-row">
                      <div className="company-logo-badge blue">
                        {companyInitial}
                      </div>
                      {result ? (
                        <div className="ai-score-badge">
                          {result.score}% Match
                        </div>
                      ) : (
                        <span className="job-badge">Full Time</span>
                      )}
                    </div>

                    {/* Job Info */}
                    <h3 className="job-title-modern">{job.title}</h3>
                    <p className="job-company-modern">{job.company}</p>
                    
                    <div className="job-meta-modern">
                      <span>📍 {job.location || "Location N/A"}</span>
                      <span>💼 {job.experience || "Experience N/A"}</span>
                    </div>

                    {/* Skills */}
                    <div className="job-skills-modern">
                      {job.skills && job.skills.split(",").slice(0, 4).map((skill, index) => (
                        <span key={index}>{skill.trim()}</span>
                      ))}
                      {job.skills && job.skills.split(",").length > 4 && <span>+more</span>}
                    </div>

                    {/* Action Area */}
                    {!result ? (
                      <div className="job-action-modern">
                        <div className="upload-wrapper">
                          <label htmlFor={`resume-${job.id}`} className="upload-label">
                            📄 Upload Resume
                          </label>
                          <input
                            id={`resume-${job.id}`}
                            type="file"
                            accept=".pdf,.doc,.docx"
                            className="hidden-file-input"
                          />
                        </div>
                        <button
                          className="btn-apply-modern"
                          onClick={() => handleApply(job.id)}
                          disabled={applyingJobId === job.id}
                        >
                          {applyingJobId === job.id ? "Applying..." : "Apply Now"}
                        </button>
                      </div>
                    ) : (
                      /* AI Analysis View */
                      <div className="ai-analysis-view">
                        <div className="ai-stats-row">
                          <div className="ai-skill-col matched">
                            <strong>✓ Matched ({result.matchedSkills.length})</strong>
                            <p>{result.matchedSkills.slice(0, 3).join(", ") || "None"}</p>
                          </div>
                          <div className="ai-skill-col missing">
                            <strong>✕ Missing ({result.missingSkills.length})</strong>
                            <p>{result.missingSkills.slice(0, 3).join(", ") || "None"}</p>
                          </div>
                        </div>
                        <button className="btn-applied-success" disabled>
                          ✓ Application Submitted
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Jobs;