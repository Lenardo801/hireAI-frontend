import { useState } from "react";

import Home from "./components/Home";
import Login from "./components/Login";
import Register from "./components/Register";
import Jobs from "./components/Jobs";
import RecruiterDashboard from "./components/RecruiterDashboard";
import RecruiterApplications from "./components/RecruiterApplications";
import PostJob from "./components/PostJob";
import InterviewSchedule from "./components/InterviewSchedule";
import InterviewList from "./components/InterviewList";
import CandidateDashboard from "./components/CandidateDashboard";
import Applications from "./components/Applications";
import AdminDashboard from "./components/AdminDashboard";

const VALID_PAGES = [
  "home",
  "login",
  "register",
  "dashboard",
  "applications",
  "jobs",
  "recruiter",
  "recruiterApplications",
  "postJob",
  "interview",
  "interviews",
  "admin",
];

function getInitialPage() {
  const savedPage = localStorage.getItem("currentPage");
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const role = localStorage.getItem("userRole");

  if (!savedPage || !VALID_PAGES.includes(savedPage)) {
    return "home";
  }

  if (["home", "login", "register"].includes(savedPage)) {
    return savedPage;
  }

  if (savedPage === "jobs") {
  return "jobs";
  }

  if (!isLoggedIn) {
    return "login";
  }

  if (savedPage === "dashboard" || savedPage === "applications") {
    return role === "candidate" ? savedPage : "home";
  }

  if (savedPage === "jobs" || savedPage === "interviews") {
    return savedPage;
  }

  if (
    [
      "recruiter",
      "recruiterApplications",
      "postJob",
      "interview",
    ].includes(savedPage)
  ) {
    return role === "recruiter" ? savedPage : "home";
  }

  if (savedPage === "admin") {
    return role === "admin" ? savedPage : "home";
  }

  return "home";
}

function App() {
  const [page, setPage] = useState(getInitialPage);

  const [selectedJobId, setSelectedJobId] = useState(() => {
    const savedId = localStorage.getItem("selectedJobId");
    return savedId ? Number(savedId) : null;
  });

  const [selectedApplicationId, setSelectedApplicationId] = useState(
    () => {
      const savedId = localStorage.getItem("selectedApplicationId");
      return savedId ? Number(savedId) : null;
    }
  );

  const navigateTo = (newPage) => {
    localStorage.setItem("currentPage", newPage);
    setPage(newPage);
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");

    localStorage.removeItem("selectedJobId");
    localStorage.removeItem("selectedApplicationId");

    localStorage.setItem("currentPage", "home");

    setSelectedJobId(null);
    setSelectedApplicationId(null);
    setPage("home");
  };

  const handleLogin = (role) => {
    console.log("Logged in role:", role);

    if (role === "admin") {
      navigateTo("admin");
    } else if (role === "recruiter") {
      navigateTo("recruiter");
    } else {
      navigateTo("dashboard");
    }
  };

  const loginPage = (
    <Login
      onLogin={handleLogin}
      goRegister={() => navigateTo("register")}
      goHome={() => navigateTo("home")}
    />
  );

  // HOME
  if (page === "home") {
    return (
      <Home
        goLogin={() => navigateTo("login")}
        goRegister={() => navigateTo("register")}
        goJobs={() => navigateTo("jobs")}
        goRecruiter={() => {
          const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
          const role = localStorage.getItem("userRole");
          navigateTo(
            isLoggedIn && role === "recruiter" ? "recruiter" : "login"
          );
        }}
        goInterview={() => {
          const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
          navigateTo(isLoggedIn ? "interviews" : "login");
        }}
      />
    );
  }

  // LOGIN
  if (page === "login") {
    return loginPage;
  }

  // REGISTER
  if (page === "register") {
    return (
      <>
        <Register goLogin={() => navigateTo("login")} />
        <div className="page-navigation">
          <button onClick={() => navigateTo("home")}>
            ← Back to Home
          </button>
        </div>
      </>
    );
  }

  // ADMIN DASHBOARD
  if (page === "admin") {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const role = localStorage.getItem("userRole");

    if (!isLoggedIn || role !== "admin") {
      return loginPage;
    }

    return <AdminDashboard goLogout={handleLogout} />;
  }

  // CANDIDATE DASHBOARD
  if (page === "dashboard") {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const role = localStorage.getItem("userRole");

    if (!isLoggedIn || role !== "candidate") {
      return loginPage;
    }

    return (
      <CandidateDashboard
        goApplications={() => navigateTo("applications")}
        goJobs={() => navigateTo("jobs")}
        goInterview={() => navigateTo("interviews")}
        goLogout={handleLogout}
      />
    );
  }

  // CANDIDATE APPLICATIONS
  if (page === "applications") {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const role = localStorage.getItem("userRole");

    if (!isLoggedIn || role !== "candidate") {
      return loginPage;
    }

    return (
      <>
        <Applications />
        <div className="page-navigation">
          <button onClick={() => navigateTo("dashboard")}>
            ← Back to Dashboard
          </button>
        </div>
      </>
    );
  }

  // JOBS
if (page === "jobs") {
  return (
    <Jobs
      goHome={() => navigateTo("home")}
      goLogin={() => navigateTo("login")}
      goDashboard={() => {
        const isLoggedIn =
          localStorage.getItem("isLoggedIn") === "true";

        const role = localStorage.getItem("userRole");

        if (!isLoggedIn) {
          navigateTo("login");
          return;
        }

        if (role === "admin") {
          navigateTo("admin");
        } else if (role === "recruiter") {
          navigateTo("recruiter");
        } else {
          navigateTo("dashboard");
        }
      }}
    />
  );
}
  // RECRUITER DASHBOARD
  if (page === "recruiter") {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const role = localStorage.getItem("userRole");

    if (!isLoggedIn || role !== "recruiter") {
      return loginPage;
    }

    return (
      <>
        <RecruiterDashboard
          goApplications={(jobId) => {
            setSelectedJobId(jobId);
            localStorage.setItem("selectedJobId", String(jobId));
            navigateTo("recruiterApplications");
          }}
          goPostJob={() => navigateTo("postJob")}
          goLogout={handleLogout}
        />
        <div className="page-navigation">
          <button onClick={() => navigateTo("home")}>
            ← Back to Home
          </button>
        </div>
      </>
    );
  }

  // RECRUITER APPLICATIONS
  if (page === "recruiterApplications") {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const role = localStorage.getItem("userRole");

    if (!isLoggedIn || role !== "recruiter") {
      return loginPage;
    }

    return (
      <>
        <RecruiterApplications
          jobId={selectedJobId}
          goScheduleInterview={(applicationId) => {
            setSelectedApplicationId(applicationId);
            localStorage.setItem(
              "selectedApplicationId",
              String(applicationId)
            );
            navigateTo("interview");
          }}
        />
        <div className="page-navigation">
          <button onClick={() => navigateTo("recruiter")}>
            ← Back to Recruiter Dashboard
          </button>
        </div>
      </>
    );
  }

  // POST JOB
  if (page === "postJob") {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const role = localStorage.getItem("userRole");

    if (!isLoggedIn || role !== "recruiter") {
      return loginPage;
    }

    return (
      <PostJob
        goBack={() => navigateTo("recruiter")}
      />
    );
  }

  // SCHEDULE INTERVIEW
  if (page === "interview") {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const role = localStorage.getItem("userRole");

    if (!isLoggedIn || role !== "recruiter") {
      return loginPage;
    }

    return (
      <>
        <InterviewSchedule
          applicationId={selectedApplicationId}
          goBack={() => navigateTo("recruiterApplications")}
        />
        <div className="page-navigation">
          <button onClick={() => navigateTo("recruiterApplications")}>
            ← Back to Applications
          </button>
          <button onClick={() => navigateTo("interviews")}>
            View Interviews
          </button>
        </div>
      </>
    );
  }

  // INTERVIEW LIST
  if (page === "interviews") {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

    if (!isLoggedIn) {
      return loginPage;
    }

    return (
      <>
        <InterviewList />
        <div className="page-navigation">
          <button
            onClick={() => {
              const role = localStorage.getItem("userRole");
              if (role === "admin") navigateTo("admin");
              else navigateTo(role === "recruiter" ? "recruiter" : "dashboard");
            }}
          >
            ← Back to Dashboard
          </button>
          <button onClick={() => navigateTo("jobs")}>
            🔎 Find Jobs
          </button>
        </div>
      </>
    );
  }

  // FALLBACK
  return (
    <Home
      goLogin={() => navigateTo("login")}
      goRegister={() => navigateTo("register")}
      goJobs={() => navigateTo("jobs")}
      goRecruiter={() => navigateTo("recruiter")}
      goInterview={() => navigateTo("interviews")}
    />
  );
}

export default App;