
import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../api";
import AppLayout from "../components/AppLayout";
import "../dashboard.css";

function riskClass(risk) {
  const value = Number(risk || 0);
  return value < 40 ? "risk-low" : value < 75 ? "risk-medium" : "risk-high";
}

function statusClass(status) {
  if (status === "Success" || status === "Safe") return "status-safe";
  if (status === "Step-up") return "status-stepup";
  return "status-blocked";
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function normalizeTransaction(tx) {
  const fraud = Number(tx.fraud ?? tx.is_fraud ?? 0) === 1;

  return {
    id: tx.transaction_id ?? tx.id ?? "N/A",
    recipient: tx.recipient ?? tx.receiver_upi_id ?? "Unknown",
    amount: Number(tx.amount ?? 0),
    risk: Number(tx.risk ?? (fraud ? 100 : 0)),
    status:
      tx.status ??
      (fraud
        ? "Flagged"
        : tx.transaction_status === "SUCCESS"
          ? "Success"
          : "Failed"),
    timestamp: tx.timestamp,
  };
}

function normalizeAlert(alert) {
  return {
    title:
      alert.title ??
      alert.reason ??
      alert.description ??
      "Historical fraud record",
    transaction:
      alert.transaction_id ??
      alert.transaction ??
      alert.id ??
      "N/A",
    risk: Number(alert.risk ?? alert.risk_score ?? 100),
    status: alert.status ?? "Flagged",
    time: formatDate(
      alert.timestamp ?? alert.created_at ?? alert.time
    ),
  };
}

export default function UserDashboard({ section = "dashboard" }) {
  const [apiData, setApiData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setApiError("");

      try {
        const [dashboardResult, transactionResult, alertResult] =
          await Promise.all([
            apiGet("/api/user/dashboard"),
            apiGet("/api/user/transactions?limit=100&offset=0"),
            apiGet("/api/user/alerts"),
          ]);

        if (!active) return;

        setApiData(dashboardResult);

        const transactionList =
          transactionResult.transactions ??
          dashboardResult.recent_transactions ??
          [];

        setTransactions(transactionList.map(normalizeTransaction));

        setAlerts(
          (alertResult.alerts ?? []).map(normalizeAlert)
        );
      } catch (error) {
        if (!active) return;
        setApiError(error.message || "Unable to load dashboard data.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    if (!apiData) {
      return {
        total: 0,
        fraud: 0,
        failed: 0,
        fraudRate: 0,
        totalAmount: 0,
      };
    }

    const total = Number(apiData.transactions ?? transactions.length);
    const fraud = Number(apiData.fraud_transactions ?? 0);
    const failed = Number(apiData.failed ?? 0);
    const totalAmount = Number(apiData.total_amount ?? 0);

    return {
      total,
      fraud,
      failed,
      fraudRate: total ? Math.round((fraud / total) * 100) : 0,
      totalAmount,
    };
  }, [apiData, transactions.length]);

  const shownTransactions =
    section === "history"
      ? [...transactions].reverse()
      : [...transactions].slice(-5).reverse();

  const shownAlerts =
    section === "alerts"
      ? [...alerts].reverse()
      : [...alerts].slice(-4).reverse();

  return (
    <AppLayout>
      <main className="dashboard-container">
        <section className="dashboard-header">
          <div>
            <h1>
              {section === "history"
                ? "Transaction history"
                : section === "alerts"
                  ? "Fraud alerts"
                  : "Monitoring dashboard"}
            </h1>
            <p>
              Your UPI transaction activity and historical fraud records.
            </p>
          </div>
        </section>

        {loading && (
          <div className="empty-state">Loading your account data...</div>
        )}

        {apiError && (
          <div className="empty-state">
            Unable to load backend data: {apiError}
          </div>
        )}

        {!loading && !apiError && (
          <>
            {section === "dashboard" && (
              <>
                <section className="stats-grid">
                  <div className="stat-card">
                    <span className="stat-title">TRANSACTIONS</span>
                    <strong>{stats.total.toLocaleString("en-IN")}</strong>
                  </div>

                  <div className="stat-card">
                    <span className="stat-title">FRAUD FLAGGED</span>
                    <strong className="blocked-number">
                      {stats.fraud.toLocaleString("en-IN")}
                    </strong>
                  </div>

                  <div className="stat-card">
                    <span className="stat-title">FAILED</span>
                    <strong className="stepup-number">
                      {stats.failed.toLocaleString("en-IN")}
                    </strong>
                  </div>

                  <div className="stat-card">
                    <span className="stat-title">FRAUD RATE</span>
                    <strong>{stats.fraudRate}%</strong>
                  </div>

                  <div className="stat-card">
                    <span className="stat-title">TOTAL AMOUNT</span>
                    <strong className="protected-number">
                      ₹{stats.totalAmount.toLocaleString("en-IN")}
                    </strong>
                  </div>
                </section>

                <section className="content-card">
                  <div className="section-header">
                    <div>
                      <h2>Recent Transaction History</h2>
                      <p>Latest transactions from your dataset account</p>
                    </div>
                    <a className="view-link" href="/history">
                      View history →
                    </a>
                  </div>

                  <TransactionTable transactions={shownTransactions} />
                </section>

                <section className="content-card alerts-card">
                  <div className="section-header">
                    <div>
                      <h2>Recent Alerts</h2>
                      <p>Historical fraud records associated with your account</p>
                    </div>
                    <a className="view-link" href="/alerts">
                      View alerts →
                    </a>
                  </div>

                  <AlertList alerts={shownAlerts} />
                </section>

                {apiData && (
                  <p className="api-note">
                    Dataset account: {apiData.user}
                  </p>
                )}
              </>
            )}

            {section === "history" && (
              <section className="content-card">
                <div className="section-header">
                  <div>
                    <h2>All Transactions</h2>
                    <p>Transaction records retrieved from the backend</p>
                  </div>
                </div>

                <TransactionTable transactions={shownTransactions} />
              </section>
            )}

            {section === "alerts" && (
              <section className="content-card alerts-card">
                <div className="section-header">
                  <div>
                    <h2>Fraud Alerts</h2>
                    <p>Historical fraud records for your account</p>
                  </div>
                </div>

                <AlertList alerts={shownAlerts} />
              </section>
            )}
          </>
        )}

        <p className="api-note">
          UPI Guard — Historical dataset records are shown here. Fraud labels
          represent existing dataset classifications, not live ML predictions
          or actual payment blocking.
        </p>
      </main>
    </AppLayout>
  );
}

function TransactionTable({ transactions }) {
  if (!transactions.length) {
    return (
      <div className="empty-state">
        No transaction records found for this account.
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>TRANSACTION</th>
            <th>RECIPIENT</th>
            <th>AMOUNT</th>
            <th>RISK</th>
            <th>STATUS</th>
          </tr>
        </thead>

        <tbody>
          {transactions.map((t) => (
            <tr key={t.id}>
              <td>
                <span className="transaction-id">{t.id}</span>
              </td>
              <td>
                <span className="recipient">{t.recipient}</span>
              </td>
              <td>
                <span className="amount">
                  ₹{Number(t.amount).toLocaleString("en-IN")}
                </span>
              </td>
              <td>
                <span className={riskClass(t.risk)}>
                  {t.risk}%
                </span>
              </td>
              <td>
                <span className={`status ${statusClass(t.status)}`}>
                  {t.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AlertList({ alerts }) {
  if (!alerts.length) {
    return <div className="empty-state">No fraud alerts found.</div>;
  }

  return (
    <div className="alerts-container">
      {alerts.map((alert, index) => (
        <div
          className="alert-item"
          key={`${alert.transaction}-${index}`}
        >
          <div>
            <div className="alert-title">{alert.title}</div>
            <div className="alert-subtitle">{alert.time}</div>
          </div>

          <div className="alert-transaction">
            {alert.transaction}
          </div>

          <div className={`alert-risk ${riskClass(alert.risk)}`}>
            {alert.risk}%
          </div>

          <div>
            <span className={`status ${statusClass(alert.status)}`}>
              {alert.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
