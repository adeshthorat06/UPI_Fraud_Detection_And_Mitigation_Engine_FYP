import { NavLink, useNavigate } from "react-router-dom";
import { clearSession, readSession } from "../api";

export default function AppLayout({ children, admin = false }) {
  const navigate = useNavigate();
  const session = readSession();
  const links = admin
    ? [
        ["/admin", "Dashboard"],
        ["/admin/transactions", "Transactions"],
        ["/admin/alerts", "Alerts"],
        ["/admin/model", "Model"],
        ["/dashboard", "User View"],
      ]
    : [
        ["/dashboard", "Dashboard"],
        ["/history", "History"],
        ["/alerts", "Alerts"],
      ];

  function logout() {
    clearSession();
    navigate("/login", { replace: true });
  }

  return (
    <div className={admin ? "admin-app" : "user-app"}>
      <header className="navbar">
        <div className="brand">
          <div className="brand-logo">U</div>
          <div className="brand-name">UPI Guard</div>
          <div className="brand-subtitle">{admin ? "Admin Console" : "Fraud prevention"}</div>
        </div>
        <nav className="nav-links" aria-label="Main navigation">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === "/admin" || to === "/dashboard"}>
              {label}
            </NavLink>
          ))}
          <button className="nav-logout" onClick={logout} type="button">
            Logout{session?.user?.name ? ` · ${session.user.name}` : ""}
          </button>
        </nav>
      </header>
      {children}
      <footer>
        UPI Guard — Prototype fraud detection environment. Simulated decisions do not block live UPI payments.
      </footer>
    </div>
  );
}
