// src/components/Home.jsx
import "./Home.css";
import heroImage from "../assets/hero.jpeg";

function Home({
  goLogin,
  goRegister,
  goJobs,
  goRecruiter,
  goInterview,
}) {
  return (
    <div className="home-container">
      {/* ================= HERO & NAVBAR WRAPPER ================= */}
      <div className="hero-wrapper">

        {/* Navbar */}
        <nav className="hireai-navbar">
          <div className="nav-logo">
            <div className="logo-icon">H</div>
            <span>Hire<strong>AI</strong></span>
          </div>

          <div className="nav-menu">
            <a href="#home" className="active">Home</a>
            <a href="#jobs" onClick={(e) => { e.preventDefault(); goJobs(); }}>Jobs</a>
            <a href="#companies">Companies</a>
            <a href="#about">About</a>
          </div>

          <div className="nav-auth">
            <button className="btn-text" onClick={goLogin}>Login</button>
            <button className="btn-primary" onClick={goRegister}>Sign Up</button>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="hero-content">
          <div className="hero-text-section">
            <h1>Find Your Dream Job</h1>
            <p>Connect with top companies and take the next step in your career. HireAI helps you find the right opportunities, faster.</p>

            {/* Search Bar */}
            <div className="hero-search-box">
              <div className="search-input-group">
                <span className="search-icon">🔍</span>
                <input type="text" placeholder="Job title, skills or company" />
              </div>
              <div className="search-divider"></div>
              <div className="search-input-group">
                <span className="search-icon">📍</span>
                <select defaultValue="">
                  <option value="" disabled>All Locations</option>
                  <option value="chennai">Chennai</option>
                  <option value="bangalore">Bangalore</option>
                  <option value="remote">Remote</option>
                </select>
              </div>
              <button className="btn-search" onClick={goJobs}>Search Jobs</button>
            </div>

            {/* Features Tags */}
            <div className="hero-tags">
              <div className="tag">
                <span className="tag-icon">🏢</span>
                <div className="tag-text">
                  <strong>Top Companies</strong>
                  <span>Work with leading brands</span>
                </div>
              </div>
              <div className="tag">
                <span className="tag-icon">🤖</span>
                <div className="tag-text">
                  <strong>Smart Matching</strong>
                  <span>AI powered job matching</span>
                </div>
              </div>
              <div className="tag">
                <span className="tag-icon">⚡</span>
                <div className="tag-text">
                  <strong>Easy Apply</strong>
                  <span>Apply in just a few clicks</span>
                </div>
              </div>
            </div>
          </div>

         
          <div className="hero-image-section">
            <div className="hero-illustration">
              <img
                src={heroImage}
                alt="HireAI Career Opportunities"
                className="hero-image"
              />

              {/* <div className="floating-badge">
                Better<br />
                Opportunities<br />
                Bigger Dreams
              </div> */}
            </div>
          </div>
          

        </div>
      </div>

      {/* ================= LATEST JOBS SECTION ================= */}
      <section className="latest-jobs-section" id="jobs">
        <div className="section-header">
          <h2>Latest Jobs</h2>
          <button className="view-all-btn" onClick={goJobs}>View All Jobs →</button>
        </div>

        <div className="jobs-grid">
          {/* Job Card 1 */}
          <div className="job-card">
            <div className="job-card-header">
              <div className="company-logo blue-logo">A</div>
              <span className="featured-badge">Featured</span>
            </div>
            <h3>Python Developer</h3>
            <p className="company-name">ABC Technologies</p>
            <p className="job-meta">Chennai, India • Fresher</p>
            <div className="job-skills">
              <span>Python</span>
              <span>Django</span>
              <span>SQL</span>
            </div>
          </div>

          {/* Job Card 2 */}
          <div className="job-card">
            <div className="job-card-header">
              <div className="company-logo green-logo">W</div>
              <span className="featured-badge">Featured</span>
            </div>
            <h3>Frontend Developer</h3>
            <p className="company-name">WebX Solutions</p>
            <p className="job-meta">Bangalore, India • 0-2 yrs</p>
            <div className="job-skills">
              <span>React</span>
              <span>JavaScript</span>
              <span>CSS</span>
            </div>
          </div>

          {/* Job Card 3 */}
          <div className="job-card">
            <div className="job-card-header">
              <div className="company-logo purple-logo">T</div>
              <span className="featured-badge">Featured</span>
            </div>
            <h3>Full Stack Developer</h3>
            <p className="company-name">TechNova</p>
            <p className="job-meta">Hyderabad, India • 1-3 yrs</p>
            <div className="job-skills">
              <span>React</span>
              <span>Node.js</span>
              <span>MongoDB</span>
            </div>
          </div>

          {/* Job Card 4 */}
          <div className="job-card">
            <div className="job-card-header">
              <div className="company-logo pink-logo">D</div>
              <span className="featured-badge">Featured</span>
            </div>
            <h3>UI/UX Designer</h3>
            <p className="company-name">DesignHub</p>
            <p className="job-meta">Remote • 0-2 yrs</p>
            <div className="job-skills">
              <span>Figma</span>
              <span>UI/UX</span>
              <span>Design</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

export default Home;