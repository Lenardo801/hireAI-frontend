import { useState } from "react";
import "./Register.css";

function Register({ goLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("candidate"); // "candidate" | "recruiter" | "admin"
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/users/register/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            email,
            password,
            role,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Registration successful! You can now login.");
        if (goLogin) goLogin(); 
      } else {
        alert(JSON.stringify(data));
      }
    } catch (error) {
      console.error(error);
      alert("Backend server is not running");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-box">
        {/* Logo */}
        <div className="register-brand">
          <div className="brand-icon">H</div>
          <span>Hire<strong>AI</strong></span>
        </div>

        <h1>Create Your Account</h1>
        <p className="subtitle">Join HireAI and get started</p>

        {/* Role Toggle (Candidate, Recruiter, Admin) */}
        <div className="role-toggle" style={{ display: "flex", gap: "5px" }}>
          <button
            type="button"
            className={role === "candidate" ? "active" : ""}
            onClick={() => setRole("candidate")}
          >
            Candidate
          </button>
          <button
            type="button"
            className={role === "recruiter" ? "active" : ""}
            onClick={() => setRole("recruiter")}
          >
            Recruiter
          </button>
          <button
            type="button"
            className={role === "admin" ? "active" : ""}
            onClick={() => setRole("admin")}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Full Name (Username)</label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-wrapper">
              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span className="eye-icon">👁️</span>
            </div>
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <div className="password-wrapper">
              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-register-submit"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className="login-link">
          Already have an account? <strong onClick={goLogin}>Login</strong>
        </p>
      </div>
    </div>
  );
}

export default Register;