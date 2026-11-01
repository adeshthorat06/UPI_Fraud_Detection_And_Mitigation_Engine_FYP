import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./../auth.css";

const API_BASE = "http://127.0.0.1:8000";
export default function Login() {
  const navigate = useNavigate();
  const [view, setView] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [upi, setUpi] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [signupMessage, setSignupMessage] = useState({ text: "", type: "" });

  async function loadUsers() {
    const response = await fetch("/data/users.json");
    if (!response.ok) throw new Error("Unable to load users.json");
    const data = await response.json();
    return data.users || [];
  }

  
async function submitLogin(event) {
  event.preventDefault();
  setMessage({ text: "", type: "" });

  if (!email.trim() || !password) {
    setMessage({
      text: "Please enter your UPI ID/email and password.",
      type: "error"
    });
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        identifier: email.trim(),
        password: password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Invalid email or password.");
    }

    // Save the actual backend authentication token
    const session = {
      authenticated: true,
      token: data.access_token,
      user: data.user,
      loginTime: new Date().toISOString()
    };

    // Clear any old session
    localStorage.removeItem("upiGuardSession");
    sessionStorage.removeItem("upiGuardSession");

    // Save according to Remember Me
    const storage = remember
      ? window.localStorage
      : window.sessionStorage;

    storage.setItem("upiGuardSession", JSON.stringify(session));

    setMessage({
      text: `Welcome back, ${data.user.name}!`,
      type: "success"
    });

    // Redirect according to account role
    window.setTimeout(() => {
      navigate(
        data.user.role === "admin" ? "/admin" : "/dashboard",
        { replace: true }
      );
    }, 500);

  } catch (error) {
    console.error("Login error:", error);

    setMessage({
      text: error.message || "Unable to connect to FastAPI.",
      type: "error"
    });
  }
}

async function submitSignup(event) {
  event.preventDefault();

  setSignupMessage({ text: "", type: "" });

  if (
    !name.trim() ||
    !signupEmail.trim() ||
    !upi.trim() ||
    !signupPassword ||
    !confirm
  ) {
    setSignupMessage({
      text: "Please fill in all required fields.",
      type: "error"
    });
    return;
  }

  if (signupPassword.length < 8) {
    setSignupMessage({
      text: "Password must contain at least 8 characters.",
      type: "error"
    });
    return;
  }

  if (signupPassword !== confirm) {
    setSignupMessage({
      text: "Passwords do not match.",
      type: "error"
    });
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        name: name.trim(),
        email: signupEmail.trim(),
        upi_id: upi.trim(),
        password: signupPassword
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Registration failed.");
    }

    const session = {
      authenticated: true,
      token: data.access_token,
      user: data.user,
      loginTime: new Date().toISOString()
    };

    localStorage.removeItem("upiGuardSession");
    sessionStorage.removeItem("upiGuardSession");

    const storage = remember
      ? localStorage
      : sessionStorage;

    storage.setItem("upiGuardSession", JSON.stringify(session));

    setSignupMessage({
      text: "Account created successfully!",
      type: "success"
    });

    window.setTimeout(() => {
      navigate("/dashboard", { replace: true });
    }, 500);

  } catch (error) {
    console.error("Signup error:", error);

    setSignupMessage({
      text: error.message || "Unable to register account.",
      type: "error"
    });
  }
}

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand">
          <div className="brand-icon">U</div>
          <div><h1>UPI Guard</h1><p>Fraud prevention</p></div>
        </div>

        {view === "login" ? (
          <>
            <div className="auth-heading">
              <h2>Welcome back</h2>
              <p>Sign in to access your fraud monitoring dashboard.</p>
            </div>
            <form onSubmit={submitLogin} noValidate>
              <label htmlFor="loginEmail">Email</label>
              <input id="loginEmail" type="email" placeholder="you@example.com" autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
              <label htmlFor="loginPassword">Password</label>
              <div className="password-wrap">
                <input id="loginPassword" type={showPassword ? "text" : "password"}
                  placeholder="Enter your password" autoComplete="current-password"
                  value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" className="password-toggle" onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <div className="login-options">
                <label className="remember" htmlFor="rememberMe">
                  <input id="rememberMe" type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  <span>Remember me</span>
                </label>
                <a href="#" onClick={(e) => { e.preventDefault(); setMessage({ text: "Password reset is not enabled in this prototype.", type: "error" }); }}>
                  Forgot password?
                </a>
              </div>
              <button className="login-btn" type="submit">Sign in</button>
              <p className={`message ${message.type}`} role="status">{message.text}</p>
            </form>
            <div className="switch-auth">
              <span>Don't have an account?</span>
              <button type="button" onClick={() => { setView("signup"); setMessage({ text: "", type: "" }); }}>Sign Up</button>
            </div>
          </>
        ) : (
          <>
            <div className="auth-heading">
              <h2>Create account</h2>
              <p>Create your UPI Guard account to get started.</p>
            </div>
            <form onSubmit={submitSignup} noValidate>
              <label htmlFor="signupName">Full Name</label>
              <input id="signupName" type="text" placeholder="Enter your full name" value={name} onChange={(e) => setName(e.target.value)} required />
              <label htmlFor="signupEmail">Email</label>
              <input id="signupEmail" type="email" placeholder="you@example.com" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required />
              <label htmlFor="signupUpi">UPI ID</label>
              <input id="signupUpi" type="text" placeholder="name@upi" value={upi} onChange={(e) => setUpi(e.target.value)} required />
              <label htmlFor="signupPassword">Password</label>
              <div className="password-wrap">
                <input id="signupPassword" type={showSignupPassword ? "text" : "password"} placeholder="Create a password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required />
                <button type="button" className="password-toggle" onClick={() => setShowSignupPassword((v) => !v)}>{showSignupPassword ? "Hide" : "Show"}</button>
              </div>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input id="confirmPassword" type="password" placeholder="Confirm your password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              <button className="login-btn" type="submit">Create Account</button>
              <p className={`message ${signupMessage.type}`} role="status">{signupMessage.text}</p>
            </form>
            <div className="switch-auth">
              <span>Already have an account?</span>
              <button type="button" onClick={() => { setView("login"); setSignupMessage({ text: "", type: "" }); }}>Sign In</button>
            </div>
          </>
        )}

        <div className="demo-box">
          <strong>Prototype login</strong>
          <span>Admin: <b>admin@upiguard.local</b> / <b>Admin@123</b></span>
          <span>
  Dataset User: <b>Use your registered UPI ID</b> / <b>User@123</b>
</span>
        </div>
        <p className="security-note">Prototype authentication only — do not use real payment credentials.</p>
      </section>
    </main>
  );
}
