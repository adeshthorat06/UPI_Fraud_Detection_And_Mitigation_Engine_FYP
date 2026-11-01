import { Navigate, Route, Routes } from "react-router-dom";
import { readSession } from "./api";
import Login from "./pages/Login";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";

function ProtectedRoute({ children, role }) {
  const session = readSession();
  if (!session?.authenticated || !session?.user) return <Navigate to="/login" replace />;
  if (role && session.user.role !== role) {
    return <Navigate to={session.user.role === "admin" ? "/admin" : "/dashboard"} replace />;
  }
  return children;
}

function HomeRedirect() {
  const session = readSession();
  if (!session?.authenticated) return <Navigate to="/login" replace />;
  return <Navigate to={session.user?.role === "admin" ? "/admin" : "/dashboard"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><UserDashboard section="history" /></ProtectedRoute>} />
      <Route path="/alerts" element={<ProtectedRoute><UserDashboard section="alerts" /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/transactions" element={<ProtectedRoute role="admin"><AdminDashboard section="transactions" /></ProtectedRoute>} />
      <Route path="/admin/alerts" element={<ProtectedRoute role="admin"><AdminDashboard section="alerts" /></ProtectedRoute>} />
      <Route path="/admin/model" element={<ProtectedRoute role="admin"><AdminDashboard section="model" /></ProtectedRoute>} />
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
