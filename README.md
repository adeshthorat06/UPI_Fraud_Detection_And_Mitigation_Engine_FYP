# UPI Guard — React + FastAPI project

This project migrates the supplied HTML/CSS/JavaScript frontend into a React application while retaining the Python/FastAPI backend for dataset processing and API services.

## Project structure

```text
UPI-Guard/
├── frontend/
│   ├── public/data/users.json
│   ├── src/
│   │   ├── components/AppLayout.jsx
│   │   ├── pages/Login.jsx
│   │   ├── pages/UserDashboard.jsx
│   │   ├── pages/AdminDashboard.jsx
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── main.jsx
│   │   ├── auth.css
│   │   ├── dashboard.css
│   │   └── admin.css
│   ├── package.json
│   └── vite.config.js
└── backend/
    ├── main.py
    ├── feature_engineering.py
    ├── requirements.txt
    ├── Raw-UPI-Dataset-Final.csv
    └── basic_features.csv
```

## Run the backend (Python + FastAPI)

From the project root:

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload
```

FastAPI runs at `http://127.0.0.1:8000`. API documentation is available at `http://127.0.0.1:8000/docs`.

To regenerate the engineered feature file:

```bash
python feature_engineering.py
```

## Run the React frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL printed in the terminal (normally `http://localhost:5173`).

Vite proxies `/api` requests to the local FastAPI server.

## Demo accounts

The supplied prototype users are in `frontend/public/data/users.json`:

- Admin: `admin@upiguard.local` / `Admin@123`
- User: `user@upiguard.local` / `User@123`

These credentials are for local demonstration only.

## Converted functionality

- Login/signup interface and password visibility controls.
- Remember-me session storage and role-based routing.
- Protected user and admin routes.
- User dashboard with generated local demo transactions, transaction history, summary statistics and alerts.
- Admin dashboard populated from the existing FastAPI dataset endpoints.
- Admin transaction, fraud-record and model-status views.
- Original CSS styling retained and reused.
- FastAPI dashboard, transaction, fraud-statistics and user-dashboard endpoints retained.

## Important project status / limitations identified in the supplied source

1. The original `main.py` loads the engineered `basic_features.csv` and exposes dataset statistics and transaction records. It does **not** currently load a trained XGBoost model or provide a transaction prediction endpoint.
2. The admin HTML displayed XGBoost as the primary classifier, while its original JavaScript did not call a prediction endpoint. The React model page therefore labels model inference as pending rather than showing invented results.
3. Signup in the original project was intentionally not persisted because browser code cannot write to `users.json`. This behavior is retained as a clear FastAPI-integration notice.
4. The supplied login JSON stores demo passwords in plain text. This is not production-safe. Production authentication should be implemented server-side with password hashing, validation, and secure session/token handling.
5. The original user dashboard uses locally generated demo transactions and a hard-coded sample UPI ID for its dataset profile request. These are prototype behaviors, not live UPI integrations.
6. The synopsis states that the project detects, assesses, monitors and alerts; it does not directly block live banking transactions. This prototype keeps that boundary.

## What has been intentionally kept in Python

Python is not converted into React. React runs in the browser and cannot replace the backend's Pandas dataset processing, FastAPI REST API, or eventual XGBoost/SHAP pipeline. The Python backend is retained and connected to the React frontend, which is the architecture specified in the synopsis.
