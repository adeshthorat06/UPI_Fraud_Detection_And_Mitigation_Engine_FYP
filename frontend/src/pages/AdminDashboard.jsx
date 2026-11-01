
import { useEffect, useState } from "react";
import { apiGet } from "../api";
import AppLayout from "../components/AppLayout";
import "../admin.css";

const initialStats = {
  dataset_records: 0,
  fraud_cases: 0,
  normal_cases: 0,
  fraud_rate: 0,
  unique_users: 0,
  unique_recipients: 0,
  total_amount: 0,
  average_amount: 0,
};

export default function AdminDashboard({ section = "dashboard" }) {
  const [stats, setStats] = useState(initialStats);
  const [transactions, setTransactions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [fraudStats, setFraudStats] = useState(null);
  const [apiStatus, setApiStatus] = useState("Connecting to API");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadAdminData() {
      setLoading(true);
      setError("");

      try {
        const requests = [
          apiGet("/api/admin/dashboard"),
          apiGet("/api/admin/transactions?limit=10&offset=0"),
          apiGet("/api/admin/fraud-stats"),
        ];

        if (section === "transactions") {
          requests.push(
            apiGet("/api/admin/transactions?limit=100&offset=0")
          );
        }

        if (section === "alerts") {
          requests.push(apiGet("/api/admin/transactions?limit=100&offset=0"));
        }

        const results = await Promise.all(requests);

        if (!active) return;

        const dashboard = results[0];
        const recentTransactions = results[1];
        const fraudStatistics = results[2];

        setStats({
          ...initialStats,
          ...dashboard,
        });

        setFraudStats(fraudStatistics);

        const transactionList =
          recentTransactions.transactions ?? [];

        if (section === "transactions" || section === "alerts") {
          const fullList = results[3]?.transactions ?? transactionList;
          setTransactions(fullList);
        } else {
          setTransactions(transactionList);
        }

        setApiStatus("System Online");
      } catch (err) {
        if (!active) return;

        setApiStatus("API Offline");
        setError(err.message || "Unable to connect to FastAPI.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAdminData();

    return () => {
      active = false;
    };
  }, [section]);

  const number = (value) =>
    Number(value || 0).toLocaleString("en-IN");

  const currency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  const fraudTransactions = transactions.filter(
    (transaction) => Number(transaction.fraud) === 1
  );

  return (
    <AppLayout admin>
      <main className="admin-container">
        <section className="page-header">
          <div>
            <h1>
              {section === "model"
                ? "Model overview"
                : section === "transactions"
                  ? "Transaction records"
                  : section === "alerts"
                    ? "Fraud alerts"
                    : "Admin dashboard"}
            </h1>
            <p>Monitor the UPI Guard fraud detection system.</p>
          </div>

          <div className="system-status">
            <span
              className="status-dot"
              style={
                apiStatus === "API Offline"
                  ? { background: "#d62828" }
                  : {}
              }
            />
            {apiStatus}
          </div>
        </section>

        {error && (
          <div className="api-error">
            FastAPI connection: {error}
          </div>
        )}

        {loading && (
          <div className="empty-state">
            Loading admin data...
          </div>
        )}

        {!loading && !error && (
          <>
            {section === "dashboard" && (
              <>
                <section className="stats-grid">
                  <Stat
                    title="DATASET RECORDS"
                    value={number(stats.dataset_records)}
                    description="Transactions loaded"
                  />
                  <Stat
                    title="FRAUD CASES"
                    value={number(stats.fraud_cases)}
                    description="Dataset fraud records"
                    danger
                  />
                  <Stat
                    title="NORMAL CASES"
                    value={number(stats.normal_cases)}
                    description="Legitimate dataset records"
                  />
                  <Stat
                    title="FRAUD RATE"
                    value={`${stats.fraud_rate}%`}
                    description="Historical dataset"
                  />
                  <Stat
                    title="MODEL"
                    value="Pending"
                    description="XGBoost integration"
                    model
                  />
                </section>

                <section className="two-column">
                  <div className="panel">
                    <PanelHeader
                      title="Dataset overview"
                      subtitle="Current fraud detection dataset"
                      badge="Loaded"
                    />

                    <div className="dataset-grid">
                      <DatasetItem
                        label="Total records"
                        value={number(stats.dataset_records)}
                      />
                      <DatasetItem
                        label="Fraud transactions"
                        value={number(stats.fraud_cases)}
                        danger
                      />
                      <DatasetItem
                        label="Normal transactions"
                        value={number(stats.normal_cases)}
                      />
                      <DatasetItem
                        label="Fraud rate"
                        value={`${stats.fraud_rate}%`}
                      />
                      <DatasetItem
                        label="Unique users"
                        value={number(stats.unique_users)}
                      />
                      <DatasetItem
                        label="Unique recipients"
                        value={number(stats.unique_recipients)}
                      />
                      <DatasetItem
                        label="Total transaction value"
                        value={currency(stats.total_amount)}
                      />
                      <DatasetItem
                        label="Average amount"
                        value={currency(stats.average_amount)}
                      />
                    </div>
                  </div>

                  <div className="panel">
                    <PanelHeader
                      title="ML pipeline"
                      subtitle="Current implementation status"
                    />

                    <div className="pipeline">
                      {[
                        ["Dataset", "Raw UPI transaction data", "Ready", true],
                        ["Preprocessing", "Data cleaning & preparation", "Ready", true],
                        ["Feature Engineering", "Transaction features", "Ready", true],
                        ["Behavioral Analysis", "DA · DF · DG · DT · BDS", "Pending", false],
                        ["XGBoost", "Fraud classification", "Pending", false],
                      ].map(([title, subtitle, status, ready]) => (
                        <div className="pipeline-item" key={title}>
                          <div className={`pipeline-icon ${ready ? "" : "pending"}`}>
                            {ready ? "✓" : "•"}
                          </div>
                          <div>
                            <strong>{title}</strong>
                            <span>{subtitle}</span>
                          </div>
                          <span className={ready ? "complete" : "pending-text"}>
                            {status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="panel behavioral-panel">
                  <PanelHeader
                    title="Behavioral analysis"
                    subtitle="Features described in the project concept"
                  />

                  <div className="behavior-grid">
                    <Behavior
                      code={<>D<sub>A</sub></>}
                      title="Amount Deviation"
                      text="Measures how unusual the transaction amount is compared with the user's historical pattern."
                    />
                    <Behavior
                      code={<>D<sub>F</sub></>}
                      title="Frequency Deviation"
                      text="Measures unusual transaction frequency compared with the user's normal activity."
                    />
                    <Behavior
                      code={<>D<sub>G</sub></>}
                      title="Graph Deviation"
                      text="Identifies unusual or previously unseen recipient connections."
                    />
                    <Behavior
                      code={<>D<sub>T</sub></>}
                      title="Time-Gap Deviation"
                      text="Measures unusual timing between consecutive transactions."
                    />
                  </div>

                  <div className="bds-box">
                    <div>
                      <span>Behavioral Deviation Score</span>
                      <strong>BDS = (Dₐ + Df + Dg + Dt) / 4</strong>
                    </div>
                    <span className="range">0 — 1</span>
                  </div>
                </section>

                <section className="panel">
                  <PanelHeader
                    title="Recent transactions"
                    subtitle="Latest dataset records returned by FastAPI"
                  />
                  <AdminTransactions transactions={transactions.slice(0, 5)} />
                </section>
              </>
            )}

            {section === "transactions" && (
              <section className="panel">
                <PanelHeader
                  title="Dataset transactions"
                  subtitle="Transaction records retrieved from the backend"
                />
                <AdminTransactions transactions={transactions} />
              </section>
            )}

            {section === "alerts" && (
              <section className="panel">
                <PanelHeader
                  title="Historical fraud records"
                  subtitle="Transactions labelled as fraudulent in the dataset"
                />
                <AdminTransactions transactions={fraudTransactions} />
              </section>
            )}

            {section === "model" && (
              <section className="panel model-panel">
                <PanelHeader
                  title="XGBoost model"
                  subtitle="Model integration status"
                />

                <div className="model-copy">
                  <p>
                    <strong>Synopsis target:</strong> XGBoost-based UPI fraud
                    classification and risk assessment.
                  </p>
                  <p>
                    <strong>Current status:</strong> The backend currently
                    loads the dataset and provides aggregate and transaction
                    APIs. A trained XGBoost model and prediction endpoint
                    have not yet been integrated.
                  </p>
                  <p>
                    {fraudStats
                      ? "Historical fraud statistics are available from the backend."
                      : "Model evaluation metrics will appear after model training and integration."}
                  </p>
                </div>
              </section>
            )}
          </>
        )}

        <p className="api-note">
          UPI Guard — Dataset fraud labels are historical classifications.
          They do not represent live ML predictions or actual payment blocking.
        </p>
      </main>
    </AppLayout>
  );
}

function Stat({ title, value, description, danger, model }) {
  return (
    <div className="stat-card">
      <span className="stat-title">{title}</span>
      <strong className={danger ? "danger-number" : model ? "model-status" : ""}>
        {value}
      </strong>
      <span className="stat-description">{description}</span>
    </div>
  );
}

function PanelHeader({ title, subtitle, badge }) {
  return (
    <div className="panel-header">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {badge && <span className="badge">{badge}</span>}
    </div>
  );
}

function DatasetItem({ label, value, danger }) {
  return (
    <div className="dataset-item">
      <span>{label}</span>
      <strong className={danger ? "danger-text" : ""}>{value}</strong>
    </div>
  );
}

function Behavior({ code, title, text }) {
  return (
    <div className="behavior-card">
      <div className="behavior-code">{code}</div>
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </div>
  );
}

function AdminTransactions({ transactions }) {
  if (!transactions.length) {
    return (
      <div className="empty-state">
        No transaction records available.
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>TRANSACTION</th>
            <th>USER</th>
            <th>RECIPIENT</th>
            <th>AMOUNT</th>
            <th>CLASSIFICATION</th>
            <th>DECISION</th>
          </tr>
        </thead>

        <tbody>
          {transactions.map((t) => {
            const fraud = Number(t.fraud) === 1;

            return (
              <tr key={t.transaction_id}>
                <td><strong>{t.transaction_id || "—"}</strong></td>
                <td>{t.user || "—"}</td>
                <td>{t.recipient || "—"}</td>
                <td>
                  ₹{Number(t.amount || 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </td>
                <td className={fraud ? "danger-text" : "safe-text"}>
                  {fraud ? "Fraud" : "Normal"}
                </td>
                <td>
                  <span className={`status ${fraud ? "danger" : "safe"}`}>
                    {fraud ? "FLAGGED (DATASET)" : "NORMAL (DATASET)"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
