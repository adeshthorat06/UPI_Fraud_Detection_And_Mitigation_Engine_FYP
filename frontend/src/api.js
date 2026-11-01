
// =====================================================
// UPI GUARD - API CONFIGURATION
// =====================================================

const API_BASE =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";


// =====================================================
// COMMON API REQUEST HANDLER
// =====================================================

async function apiRequest(path, options = {}) {
  const session = readSession();

  const headers = {
    Accept: "application/json",
    ...options.headers,
  };

  // Attach authentication token to protected requests
  if (session?.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }

  // Add JSON content type when sending a request body
  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  // Safely parse the response
  let data;

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    if (response.status === 401) {
      console.error("Authentication failed. Check your session token.");
    }

    throw new Error(
      data.detail || `API request failed (${response.status})`
    );
  }

  return data;
}


// =====================================================
// POST REQUEST
// =====================================================

export async function apiPost(path, body) {
  return apiRequest(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}


// =====================================================
// USER LOGIN
// =====================================================

export async function login(identifier, password, rememberMe = false) {
  const data = await apiPost("/api/auth/login", {
    identifier: identifier.trim(),
    password,
  });

  // Clear previous session
  clearSession();

  // Create new authenticated session
  const session = {
    authenticated: true,
    token: data.access_token,
    token_type: data.token_type,
    user: data.user,
    loginTime: new Date().toISOString(),
  };

  // Remember me determines storage location
  const storage = rememberMe ? localStorage : sessionStorage;

  storage.setItem("upiGuardSession", JSON.stringify(session));

  return data.user;
}


// =====================================================
// USER REGISTRATION
// =====================================================

export async function registerUser(userData, rememberMe = false) {
  const data = await apiPost("/api/auth/register", {
    name: userData.name.trim(),
    email: userData.email.trim(),
    upi_id: userData.upi_id.trim(),
    password: userData.password,
  });

  // Clear previous session
  clearSession();

  // Save newly registered user's session
  const session = {
    authenticated: true,
    token: data.access_token,
    token_type: data.token_type,
    user: data.user,
    loginTime: new Date().toISOString(),
  };

  const storage = rememberMe ? localStorage : sessionStorage;

  storage.setItem("upiGuardSession", JSON.stringify(session));

  return data.user;
}


// =====================================================
// GET REQUEST
// =====================================================

export async function apiGet(path) {
  return apiRequest(path, {
    method: "GET",
  });
}


// =====================================================
// USER DASHBOARD
// =====================================================

export async function getUserDashboard() {
  return apiGet("/api/user/dashboard");
}


// =====================================================
// USER TRANSACTION HISTORY
// =====================================================

export async function getUserTransactions(limit = 50, offset = 0) {
  return apiGet(
    `/api/user/transactions?limit=${limit}&offset=${offset}`
  );
}


// =====================================================
// USER FRAUD ALERTS
// =====================================================

export async function getUserAlerts() {
  return apiGet("/api/user/alerts");
}


// =====================================================
// USER PROFILE
// =====================================================

export async function getUserProfile() {
  return apiGet("/api/user/profile");
}


// =====================================================
// ADMIN DASHBOARD
// =====================================================

export async function getAdminDashboard() {
  return apiGet("/api/admin/dashboard");
}


// =====================================================
// ADMIN TRANSACTIONS
// =====================================================

export async function getAdminTransactions(limit = 50, offset = 0) {
  return apiGet(
    `/api/admin/transactions?limit=${limit}&offset=${offset}`
  );
}


// =====================================================
// ADMIN FRAUD STATISTICS
// =====================================================

export async function getAdminFraudStats() {
  return apiGet("/api/admin/fraud-stats");
}


// =====================================================
// ADMIN USER MANAGEMENT
// =====================================================

export async function getAdminUsers(limit = 100) {
  return apiGet(`/api/admin/users?limit=${limit}`);
}


// =====================================================
// SESSION MANAGEMENT
// =====================================================

export function readSession() {
  try {
    const raw =
      localStorage.getItem("upiGuardSession") ||
      sessionStorage.getItem("upiGuardSession");

    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("Unable to read session:", error);
    return null;
  }
}


// =====================================================
// CURRENT LOGGED-IN USER
// =====================================================

export function getCurrentUser() {
  const session = readSession();
  return session?.user || null;
}


// =====================================================
// AUTHENTICATION CHECK
// =====================================================

export function isAuthenticated() {
  const session = readSession();

  return Boolean(
    session?.authenticated &&
    session?.token &&
    session?.user
  );
}


// =====================================================
// LOGOUT
// =====================================================

export function clearSession() {
  localStorage.removeItem("upiGuardSession");
  sessionStorage.removeItem("upiGuardSession");
}

export function logout() {
  clearSession();
  window.location.href = "/login";
}
