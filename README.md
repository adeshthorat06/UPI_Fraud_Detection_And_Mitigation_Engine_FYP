
# UPI Guard — UPI Fraud Detection & Mitigation Engine

An AI/ML-based UPI fraud detection and mitigation prototype built using React, Python, FastAPI, and transaction-level behavioral analysis.

## 1. Project Overview

UPI Guard analyzes UPI transaction records and user behavioral patterns to identify potentially fraudulent transactions.

The project aims to combine transaction-level features with behavioral deviation analysis to assess suspicious activity and support risk-based decisions.

The intended risk-based actions are:

- **Allow:** Permit transactions assessed as low risk.
- **Step-up Verification:** Request additional verification for suspicious transactions.
- **Block and Flag:** Flag or block transactions assessed as high risk.

> **Project status:** This is an academic prototype. It does not connect to NPCI, UPI banking infrastructure, or process real-money transactions. Live transaction blocking and trained-model inference are not currently implemented.

## 2. Objectives

- Detect potentially fraudulent UPI transactions using machine learning.
- Analyze unusual user transaction behavior.
- Reduce false positives through behavioral profiling.
- Support risk-based transaction decisions.
- Provide dashboards for users and administrators.
- Present suspicious transaction records and fraud-related statistics.
- Develop an explainable fraud detection and mitigation workflow.

## 3. Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js |
| Frontend tooling | Vite |
| Backend | Python, FastAPI |
| Database | SQLite |
| Data processing | Pandas |
| Machine Learning (planned) | XGBoost |
| Behavioral analysis | Feature Engineering |
| API communication | REST API |

## 4. Project Structure

```text
UPI-Guard/
├── Backend/
│   ├── main.py
│   ├── feature_engineering.py
│   ├── requirements.txt
│   ├── Raw-UPI-Dataset-Final.csv
│   ├── basic_features.csv
│   ├── all_users.csv
│   └── user_list.py
│
├── frontend/
│   ├── public/
│   │   └── data/
│   │       └── users.json
│   ├── src/
│   │   ├── components/
│   │   │   └── AppLayout.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── UserDashboard.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── main.jsx
│   │   ├── auth.css
│   │   ├── dashboard.css
│   │   └── admin.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

## 5. Running the Backend

Open a terminal in the project root:

```bash
cd Backend

python -m venv .venv
```

Activate the virtual environment.

**Windows PowerShell:**

```powershell
.venv\Scripts\Activate.ps1
```

**Windows CMD:**

```cmd
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start FastAPI:

```bash
uvicorn main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

To regenerate engineered features:

```bash
python feature_engineering.py
```

## 6. Running the React Frontend

Open a second terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL displayed in the terminal, normally:

```text
http://localhost:5173
```

The frontend communicates with the FastAPI backend through REST API requests.

## 7. Authentication and User Roles

The application supports two primary roles:

- **Administrator:** Access to administrative dashboards, transaction records, and fraud statistics.
- **User:** Access to an individual dashboard, transaction history, alerts, and profile information.

The backend provides authentication and role-based API access.

Dataset sender accounts are created during database initialization. The initial demonstration password for imported dataset users is `User@123`.

Administrator demonstration credentials:

```text
Email: admin@upiguard.local
Password: Admin@123
```

These are local demonstration credentials and should be changed before any production deployment.

## 8. Main Features

### User Dashboard

- Individual user authentication.
- Transaction history.
- Transaction summary and statistics.
- Historical fraud alerts.
- User profile information.

### Administrator Dashboard

- Overall transaction statistics.
- Historical fraud transaction records.
- Fraud-related statistics.
- User account information.
- Model and system status information.

### Backend and Data Processing

- FastAPI REST API.
- SQLite database integration.
- Dataset import and processing.
- Feature engineering.
- User authentication and role-based access.

## 9. Machine Learning and Fraud Detection

The proposed fraud detection pipeline uses transaction-level features and behavioral deviation analysis.

XGBoost is part of the planned machine learning approach. However, the current application does not yet provide a trained XGBoost prediction endpoint.

The existing fraud labels and alerts are derived from historical dataset records. They should not be interpreted as live model predictions.

Future development includes:

- Training and evaluating an XGBoost classifier.
- Integrating behavioral deviation analysis.
- Generating transaction-level fraud probabilities.
- Adding risk-based transaction decisions.
- Integrating explainability using SHAP.
- Developing a transaction mitigation workflow.

## 10. Important Project Limitations

1. The current application uses historical UPI transaction data rather than a live banking connection.
2. Historical fraud labels are used for displaying previously identified fraud records.
3. A trained XGBoost model and live prediction API are still pending.
4. Real-time transaction blocking is not implemented.
5. The application is an academic prototype and is not connected to NPCI or any actual UPI payment gateway.
6. Production deployment requires additional security hardening, authentication controls, validation, and operational monitoring.

## 11. Future Scope

- Integrate a trained XGBoost fraud detection model.
- Implement real-time behavioral anomaly detection.
- Introduce SHAP-based explainability.
- Develop transaction risk scoring and mitigation.
- Improve user notification and alert mechanisms.
- Strengthen authentication and security.
- Explore integration with authorized payment simulation environments.

## 12. Project Architecture

The application follows a frontend-backend architecture.

- **React:** Handles the user interface and dashboards.
- **FastAPI:** Provides authentication, REST APIs, and backend processing.
- **SQLite:** Stores user accounts, transaction records, and fraud alerts.
- **Python:** Handles dataset processing and feature engineering.
- **Machine Learning:** Planned integration for fraud prediction and risk assessment.

React does not replace the Python backend. The backend remains responsible for dataset processing, database operations, API services, and future machine learning integration.
