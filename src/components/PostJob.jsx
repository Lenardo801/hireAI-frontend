import { useState } from "react";

import "./PostJob.css";

function PostJob({ goBack }) {
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    experience: "",
    skills: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.title ||
      !formData.company ||
      !formData.location ||
      !formData.experience ||
      !formData.skills ||
      !formData.description
    ) {
      alert("Please fill all fields");
      return;
    }

    // Get logged-in recruiter ID
    const recruiterId = Number(
      localStorage.getItem("userId")
    );

    // Check recruiter ID
    if (!recruiterId) {
      alert("Recruiter login information not found. Please login again.");
      return;
    }

    console.log("Posting job as recruiter ID:", recruiterId);

    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/jobs/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recruiter: recruiterId,
            title: formData.title,
            company: formData.company,
            location: formData.location,
            experience: formData.experience,
            skills: formData.skills,
            description: formData.description,
          }),
        }
      );

      const data = await response.json();

      console.log("Post job response:", data);

      if (response.ok) {
        alert("Job posted successfully! 🎉");

        setFormData({
          title: "",
          company: "",
          location: "",
          experience: "",
          skills: "",
          description: "",
        });

        if (goBack) {
          goBack();
        }
      } else {
        console.error("Post job failed:", data);

        alert(
          data.detail ||
            data.message ||
            JSON.stringify(data)
        );
      }
    } catch (error) {
      console.error("Post job error:", error);

      alert("Backend server is not running");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-job-page">
      <header className="post-job-header">
        <div className="post-job-logo">
          Hire<span>AI</span>
        </div>

        <div>
          <p>RECRUITER PORTAL</p>

          <h1>Post a New Job</h1>

          <span>
            Find the right talent for your organization.
          </span>
        </div>
      </header>

      <main className="post-job-main">
        <div className="post-job-card">
          <div className="post-job-title">
            <p>JOB DETAILS</p>

            <h2>Create Job Opportunity</h2>

            <span>
              Add the details candidates need to know.
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">

              <div className="form-group">
                <label>Job Title</label>

                <input
                  type="text"
                  name="title"
                  placeholder="Example: Python Developer"
                  value={formData.title}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Company</label>

                <input
                  type="text"
                  name="company"
                  placeholder="Example: HireAI Technologies"
                  value={formData.company}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Location</label>

                <input
                  type="text"
                  name="location"
                  placeholder="Example: Chennai"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Experience</label>

                <input
                  type="text"
                  name="experience"
                  placeholder="Example: Fresher"
                  value={formData.experience}
                  onChange={handleChange}
                />
              </div>

            </div>

            <div className="form-group">
              <label>Required Skills</label>

              <input
                type="text"
                name="skills"
                placeholder="Example: Python, Django, SQL, React"
                value={formData.skills}
                onChange={handleChange}
              />

              <small>
                Separate skills using commas.
              </small>
            </div>

            <div className="form-group">
              <label>Job Description</label>

              <textarea
                name="description"
                rows="7"
                placeholder="Describe the job role, responsibilities and requirements..."
                value={formData.description}
                onChange={handleChange}
              ></textarea>
            </div>

            <div className="post-job-actions">

              <button
                type="button"
                className="cancel-job-btn"
                onClick={goBack}
              >
                ← Cancel
              </button>

              <button
                type="submit"
                className="submit-job-btn"
                disabled={loading}
              >
                {loading
                  ? "Posting..."
                  : "Post Job →"}
              </button>

            </div>
          </form>
        </div>
      </main>

      <footer className="post-job-footer">
        <strong>
          Hire<span>AI</span>
        </strong>

        <p>
          AI-powered recruitment platform connecting
          talent with opportunity.
        </p>

        <small>
          © 2026 HireAI. All rights reserved.
        </small>
      </footer>
    </div>
  );
}

export default PostJob;