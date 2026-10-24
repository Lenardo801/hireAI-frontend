import { useState } from "react";
import "./Login.css";

function Login({ onLogin, goRegister, goHome }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeRole, setActiveRole] = useState("candidate"); // UI Toggle State ("candidate" | "recruiter" | "admin")

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/users/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Login response:", data);

        // If backend doesn't explicitly send role, fallback to the user-selected activeRole
        const userRole = data.role;

        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("currentUser", data.username || username);
        localStorage.setItem("userEmail", data.email || "");
        localStorage.setItem("userRole", userRole);
        localStorage.setItem("userId", data.user_id || "");

        alert(`Login successful! Welcome ${data.username || username} 👋`);

        if (onLogin) {
          onLogin(userRole);
        }
      } else {
        alert(data.message || "Invalid username or password");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Backend server is not running");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <button className="back-btn" onClick={goHome}>
        ← Back to Home
      </button>

      <div className="login-box">
        {/* Logo */}
        <div className="login-brand" onClick={goHome}>
          <div className="brand-icon">H</div>
          <span>Hire<strong>AI</strong></span>
        </div>

        <h1>Welcome Back!</h1>
        <p className="subtitle">Login to your account to continue</p>

        {/* Role Toggle (Candidate, Recruiter, Admin) */}
        <div className="role-toggle" style={{ display: "flex", gap: "5px" }}>
          {/* <button
            type="button"
            className={activeRole === "candidate" ? "active" : ""}
            onClick={() => setActiveRole("candidate")}
          >
            Candidate
          </button>
          <button
            type="button"
            className={activeRole === "recruiter" ? "active" : ""}
            onClick={() => setActiveRole("recruiter")}
          >
            Recruiter
          </button>
          <button
            type="button"
            className={activeRole === "admin" ? "active" : ""}
            onClick={() => setActiveRole("admin")}
          >
            Admin
          </button> */}
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email or Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-wrapper">
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span className="eye-icon">👁️</span>
            </div>
            <div className="forgot-password">
              <a href="#">Forgot password?</a>
            </div>
          </div>

          <button
            type="submit"
            className="btn-login-submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <div className="social-login-group">
          <button type="button" className="btn-social">
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" width="18" />
            Continue with Google
          </button>
          <button type="button" className="btn-social">
            <img src="https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg" alt="GitHub" width="18" />
            Continue with GitHub
          </button>
        </div>

        <p className="signup-link">
          Don't have an account? <strong onClick={goRegister}>Sign Up</strong>
        </p>
      </div>
    </div>
  );
}

export default Login;