
import csv
import sqlite3
import hashlib
import hmac
import base64
import json
import os
import secrets

from pathlib import Path
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


# =========================================================
# CONFIGURATION
# =========================================================

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "upi_guard.db"
DATASET_PATH = BASE_DIR / "Raw-UPI-Dataset-Final.csv"

TOKEN_SECRET = os.getenv(
    "UPIGUARD_SECRET",
    "CHANGE_THIS_SECRET_BEFORE_DEPLOYMENT"
).encode()

TOKEN_TTL = 60 * 60 * 12


app = FastAPI(
    title="UPI Guard API",
    description="UPI Fraud Detection & Mitigation Engine",
    version="2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# =========================================================
# REQUEST MODELS
# =========================================================

class LoginBody(BaseModel):
    identifier: str
    password: str


class RegisterBody(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: str
    upi_id: str
    password: str = Field(min_length=8)


# =========================================================
# DATABASE CONNECTION
# =========================================================

def connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def initialize_database():

    with connect() as conn:

        conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            upi_id TEXT UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS transactions (
            transaction_id TEXT PRIMARY KEY,
            user_upi_id TEXT NOT NULL,
            receiver_upi_id TEXT,
            timestamp TEXT,
            amount REAL DEFAULT 0,
            transaction_type TEXT,
            status TEXT,
            sender_bank TEXT,
            receiver_bank TEXT,
            device_type TEXT,
            ip_address TEXT,
            isp TEXT,
            city TEXT,
            latitude REAL,
            longitude REAL,
            merchant_id TEXT,
            merchant_category TEXT,
            is_fraud INTEGER DEFAULT 0,
            FOREIGN KEY(user_upi_id)
                REFERENCES users(upi_id)
        );

        CREATE INDEX IF NOT EXISTS idx_tx_user_time
        ON transactions(user_upi_id, timestamp DESC);

        CREATE INDEX IF NOT EXISTS idx_tx_fraud
        ON transactions(is_fraud);

        CREATE TABLE IF NOT EXISTS fraud_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transaction_id TEXT NOT NULL UNIQUE,
            user_upi_id TEXT NOT NULL,
            title TEXT NOT NULL,
            severity TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(transaction_id)
                REFERENCES transactions(transaction_id),
            FOREIGN KEY(user_upi_id)
                REFERENCES users(upi_id)
        );
        """)

        # Create administrator account
        admin = conn.execute(
            "SELECT id FROM users WHERE email = ?",
            ("admin@upiguard.local",)
        ).fetchone()

        if not admin:
            conn.execute("""
                INSERT INTO users
                (name, email, upi_id, password_hash, role)
                VALUES (?, ?, ?, ?, ?)
            """, (
                "UPI Guard Admin",
                "admin@upiguard.local",
                None,
                hash_password("Admin@123"),
                "admin"
            ))

        # Import dataset only if database is empty
        count = conn.execute(
            "SELECT COUNT(*) FROM transactions"
        ).fetchone()[0]

        if count == 0:

            if not DATASET_PATH.exists():
                print("Dataset not found:", DATASET_PATH)
                return

            print("Importing UPI dataset. Please wait...")

            # First pass: create individual user accounts
            unique_users = set()

            with open(
                DATASET_PATH,
                "r",
                encoding="utf-8-sig",
                newline=""
            ) as file:

                reader = csv.DictReader(file)

                for row in reader:
                    upi = (row.get("user_upi_id") or "").strip().lower()

                    if upi:
                        unique_users.add(upi)

            demo_hash = hash_password("User@123")

            for upi in sorted(unique_users):

                conn.execute("""
                    INSERT OR IGNORE INTO users
                    (name, email, upi_id, password_hash, role)
                    VALUES (?, ?, ?, ?, 'user')
                """, (
                    upi.split("@")[0],
                    upi,
                    upi,
                    demo_hash
                ))

            # Second pass: import transactions
            with open(
                DATASET_PATH,
                "r",
                encoding="utf-8-sig",
                newline=""
            ) as file:

                reader = csv.DictReader(file)
                batch = []

                for row in reader:

                    upi = (row.get("user_upi_id") or "").strip().lower()

                    if not upi:
                        continue

                    batch.append((
                        row.get("transaction_id"),
                        upi,
                        row.get("receiver_upi_id"),
                        row.get("timestamp"),
                        float(row.get("amount") or 0),
                        row.get("transaction_type"),
                        row.get("status"),
                        row.get("sender_bank"),
                        row.get("receiver_bank"),
                        row.get("device_type"),
                        row.get("ip_address"),
                        row.get("isp"),
                        row.get("city"),
                        to_float(row.get("latitude")),
                        to_float(row.get("longitude")),
                        row.get("merchant_id") or None,
                        row.get("merchant_category") or None,
                        int(row.get("is_fraud") or 0)
                    ))

                    if len(batch) >= 2000:
                        insert_transactions(conn, batch)
                        batch.clear()

                if batch:
                    insert_transactions(conn, batch)

            # Generate historical fraud alerts
            conn.execute("""
                INSERT OR IGNORE INTO fraud_alerts
                (transaction_id, user_upi_id, title, severity)

                SELECT
                    transaction_id,
                    user_upi_id,
                    'Historical fraudulent transaction',
                    'High'

                FROM transactions
                WHERE is_fraud = 1
            """)

            print(
                "Dataset import completed:",
                conn.execute(
                    "SELECT COUNT(*) FROM transactions"
                ).fetchone()[0],
                "transactions"
            )

            print("User accounts created:", len(unique_users))


def to_float(value):
    try:
        return float(value) if value not in (None, "") else None
    except (ValueError, TypeError):
        return None


def insert_transactions(conn, rows):

    conn.executemany("""
        INSERT OR IGNORE INTO transactions
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, rows)


# =========================================================
# PASSWORD SECURITY
# =========================================================

def hash_password(password):

    salt = secrets.token_bytes(16)

    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode(),
        salt,
        210000
    )

    return (
        base64.b64encode(salt).decode()
        + "$"
        + base64.b64encode(digest).decode()
    )


def verify_password(password, stored):

    try:
        salt_b64, digest_b64 = stored.split("$", 1)

        salt = base64.b64decode(salt_b64)
        expected = base64.b64decode(digest_b64)

        actual = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode(),
            salt,
            210000
        )

        return hmac.compare_digest(actual, expected)

    except Exception:
        return False


# =========================================================
# TOKEN AUTHENTICATION
# =========================================================

def b64(data):
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def create_token(user):

    now = int(datetime.now(timezone.utc).timestamp())

    payload = {
        "sub": user["id"],
        "role": user["role"],
        "iat": now,
        "exp": now + TOKEN_TTL
    }

    body = b64(
        json.dumps(payload, separators=(",", ":")).encode()
    )

    signature = b64(
        hmac.new(
            TOKEN_SECRET,
            body.encode(),
            hashlib.sha256
        ).digest()
    )

    return body + "." + signature


def decode_token(token):

    try:

        body, signature = token.split(".", 1)

        expected = b64(
            hmac.new(
                TOKEN_SECRET,
                body.encode(),
                hashlib.sha256
            ).digest()
        )

        if not hmac.compare_digest(signature, expected):
            raise ValueError()

        payload = json.loads(
            base64.urlsafe_b64decode(
                body + "=" * (-len(body) % 4)
            )
        )

        if payload["exp"] < int(
            datetime.now(timezone.utc).timestamp()
        ):
            raise ValueError()

        return payload

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session. Please sign in again."
        )


def current_user(authorization: str = Header(default="")):

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Authentication required."
        )

    payload = decode_token(authorization[7:])

    with connect() as conn:

        row = conn.execute("""
            SELECT id, name, email, upi_id, role
            FROM users
            WHERE id = ?
        """, (payload["sub"],)).fetchone()

    if not row:
        raise HTTPException(
            status_code=401,
            detail="Account no longer exists."
        )

    return dict(row)


def require_admin(user=Depends(current_user)):

    if user["role"] != "admin":
        raise HTTPException(
            status_code=403,
            detail="Administrator access required."
        )

    return user


# =========================================================
# STARTUP
# =========================================================

@app.on_event("startup")
def startup():
    initialize_database()


# =========================================================
# GENERAL API
# =========================================================

@app.get("/")
def root():

    return {
        "project": "UPI Guard",
        "message": "UPI Fraud Detection & Mitigation Engine API",
        "status": "online"
    }


@app.get("/api/health")
def health():

    with connect() as conn:

        transactions = conn.execute(
            "SELECT COUNT(*) FROM transactions"
        ).fetchone()[0]

        users = conn.execute(
            "SELECT COUNT(*) FROM users WHERE role='user'"
        ).fetchone()[0]

    return {
        "status": "online",
        "database": "connected",
        "transactions": transactions,
        "users": users
    }


# =========================================================
# AUTHENTICATION APIs
# =========================================================

@app.post("/api/auth/login")
def login(body: LoginBody):

    identifier = body.identifier.strip().lower()

    with connect() as conn:

        row = conn.execute("""
            SELECT *
            FROM users
            WHERE lower(email) = ?
               OR lower(upi_id) = ?
        """, (identifier, identifier)).fetchone()

    if not row or not verify_password(
        body.password,
        row["password_hash"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid UPI ID/email or password."
        )

    user = {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "upi_id": row["upi_id"],
        "role": row["role"]
    }

    return {
        "access_token": create_token(user),
        "token_type": "bearer",
        "user": user
    }


@app.post("/api/auth/register")
def register(body: RegisterBody):

    email = body.email.strip().lower()
    upi = body.upi_id.strip().lower()

    with connect() as conn:

        exists = conn.execute("""
            SELECT id FROM users
            WHERE lower(email) = ?
               OR lower(upi_id) = ?
        """, (email, upi)).fetchone()

        if exists:
            raise HTTPException(
                status_code=409,
                detail="Email or UPI ID already registered."
            )

        known = conn.execute("""
            SELECT 1
            FROM transactions
            WHERE lower(user_upi_id) = ?
            LIMIT 1
        """, (upi,)).fetchone()

        if not known:
            raise HTTPException(
                status_code=400,
                detail="UPI ID not found in the dataset."
            )

        conn.execute("""
            INSERT INTO users
            (name, email, upi_id, password_hash, role)
            VALUES (?, ?, ?, ?, 'user')
        """, (
            body.name.strip(),
            email,
            upi,
            hash_password(body.password)
        ))

        row = conn.execute("""
            SELECT id, name, email, upi_id, role
            FROM users
            WHERE email = ?
        """, (email,)).fetchone()

    user = dict(row)

    return {
        "access_token": create_token(user),
        "token_type": "bearer",
        "user": user
    }


@app.get("/api/auth/me")
def me(user=Depends(current_user)):
    return {"user": user}


# =========================================================
# USER DASHBOARD
# =========================================================

@app.get("/api/user/dashboard")
def user_dashboard(user=Depends(current_user)):

    if user["role"] != "user":
        raise HTTPException(
            status_code=403,
            detail="User account required."
        )

    upi = user["upi_id"]

    with connect() as conn:

        stats = conn.execute("""
            SELECT
                COUNT(*) AS total,
                COALESCE(SUM(amount), 0) AS total_amount,

                SUM(CASE
                    WHEN status='SUCCESS' THEN 1 ELSE 0
                END) AS successful,

                SUM(CASE
                    WHEN status='FAILED' THEN 1 ELSE 0
                END) AS failed,

                SUM(is_fraud) AS fraud_count,

                COALESCE(AVG(amount), 0) AS average_amount

            FROM transactions
            WHERE user_upi_id = ?
        """, (upi,)).fetchone()

        recent = conn.execute("""
            SELECT *
            FROM transactions
            WHERE user_upi_id = ?
            ORDER BY timestamp DESC
            LIMIT 10
        """, (upi,)).fetchall()

        alert_count = conn.execute("""
            SELECT COUNT(*)
            FROM fraud_alerts
            WHERE user_upi_id = ?
        """, (upi,)).fetchone()[0]

    return {
        "user": upi,
        "name": user["name"],
        "transactions": stats["total"],
        "total_amount": round(stats["total_amount"], 2),
        "successful": stats["successful"] or 0,
        "failed": stats["failed"] or 0,
        "fraud_transactions": stats["fraud_count"] or 0,
        "alerts": alert_count,
        "average_amount": round(stats["average_amount"], 2),
        "recent_transactions": [
            tx_dict(row) for row in recent
        ]
    }


# =========================================================
# USER TRANSACTION HISTORY
# =========================================================

@app.get("/api/user/transactions")
def user_transactions(
    limit: int = 50,
    offset: int = 0,
    user=Depends(current_user)
):

    if user["role"] != "user":
        raise HTTPException(
            status_code=403,
            detail="User account required."
        )

    limit = max(1, min(limit, 200))
    offset = max(0, offset)

    with connect() as conn:

        rows = conn.execute("""
            SELECT *
            FROM transactions
            WHERE user_upi_id = ?
            ORDER BY timestamp DESC
            LIMIT ? OFFSET ?
        """, (user["upi_id"], limit, offset)).fetchall()

        total = conn.execute("""
            SELECT COUNT(*)
            FROM transactions
            WHERE user_upi_id = ?
        """, (user["upi_id"],)).fetchone()[0]

    return {
        "transactions": [tx_dict(r) for r in rows],
        "total": total,
        "limit": limit,
        "offset": offset
    }


# =========================================================
# USER FRAUD ALERTS
# =========================================================

@app.get("/api/user/alerts")
def user_alerts(
    limit: int = 100,
    user=Depends(current_user)
):

    if user["role"] != "user":
        raise HTTPException(
            status_code=403,
            detail="User account required."
        )

    with connect() as conn:

        rows = conn.execute("""
            SELECT
                a.*,
                t.amount,
                t.receiver_upi_id,
                t.timestamp AS transaction_timestamp

            FROM fraud_alerts a

            JOIN transactions t
            ON a.transaction_id = t.transaction_id

            WHERE a.user_upi_id = ?

            ORDER BY t.timestamp DESC
            LIMIT ?
        """, (
            user["upi_id"],
            max(1, min(limit, 200))
        )).fetchall()

    return {
        "alerts": [dict(r) for r in rows]
    }


# =========================================================
# USER PROFILE
# =========================================================

@app.get("/api/user/profile")
def user_profile(user=Depends(current_user)):

    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "upi_id": user["upi_id"],
        "role": user["role"]
    }


# =========================================================
# ADMIN DASHBOARD
# =========================================================

@app.get("/api/admin/dashboard")
def admin_dashboard(admin=Depends(require_admin)):

    with connect() as conn:

        row = conn.execute("""
            SELECT
                COUNT(*) AS total,
                SUM(is_fraud) AS fraud,

                SUM(CASE
                    WHEN is_fraud=0 THEN 1 ELSE 0
                END) AS normal,

                COUNT(DISTINCT user_upi_id) AS users,
                COUNT(DISTINCT receiver_upi_id) AS recipients,

                COALESCE(SUM(amount), 0) AS total_amount,
                COALESCE(AVG(amount), 0) AS average_amount

            FROM transactions
        """).fetchone()

    total = row["total"] or 0
    fraud = row["fraud"] or 0

    return {
        "dataset_records": total,
        "fraud_cases": fraud,
        "normal_cases": row["normal"] or 0,
        "fraud_rate": round(fraud / total * 100, 2) if total else 0,
        "unique_users": row["users"] or 0,
        "unique_recipients": row["recipients"] or 0,
        "total_amount": round(row["total_amount"], 2),
        "average_amount": round(row["average_amount"], 2),
        "model": "XGBoost (integration pending)"
    }


# =========================================================
# ADMIN TRANSACTIONS
# =========================================================

@app.get("/api/admin/transactions")
def admin_transactions(
    limit: int = 50,
    offset: int = 0,
    admin=Depends(require_admin)
):

    limit = max(1, min(limit, 200))
    offset = max(0, offset)

    with connect() as conn:

        rows = conn.execute("""
            SELECT *
            FROM transactions
            ORDER BY timestamp DESC
            LIMIT ? OFFSET ?
        """, (limit, offset)).fetchall()

    return {
        "transactions": [tx_dict(r) for r in rows]
    }


# =========================================================
# ADMIN FRAUD STATISTICS
# =========================================================

@app.get("/api/admin/fraud-stats")
def fraud_statistics(admin=Depends(require_admin)):

    with connect() as conn:

        row = conn.execute("""
            SELECT
                COUNT(*) AS total,
                SUM(is_fraud) AS fraud
            FROM transactions
        """).fetchone()

    total = row["total"] or 0
    fraud = row["fraud"] or 0

    return {
        "fraud": fraud,
        "normal": total - fraud,
        "total": total,
        "fraud_percentage": round(
            fraud / total * 100, 2
        ) if total else 0
    }


# =========================================================
# ADMIN USER MANAGEMENT / MONITORING
# =========================================================

@app.get("/api/admin/users")
def admin_users(
    limit: int = 100,
    admin=Depends(require_admin)
):

    with connect() as conn:

        rows = conn.execute("""
            SELECT
                u.id,
                u.name,
                u.email,
                u.upi_id,

                COUNT(t.transaction_id) AS transactions,

                COALESCE(SUM(t.is_fraud), 0)
                    AS fraud_transactions

            FROM users u

            LEFT JOIN transactions t
            ON t.user_upi_id = u.upi_id

            WHERE u.role = 'user'

            GROUP BY u.id

            ORDER BY u.upi_id

            LIMIT ?
        """, (max(1, min(limit, 1000)),)).fetchall()

    return {
        "users": [dict(r) for r in rows]
    }



# =========================================================
# ADMIN ALERTS
# =========================================================

@app.get("/api/admin/alerts")
def admin_alerts(limit: int = 100, admin=Depends(require_admin)):
    with connect() as conn:
        rows = conn.execute("""
            SELECT
                a.id, a.transaction_id, a.user_upi_id, a.title,
                a.severity, a.created_at, t.amount,
                t.receiver_upi_id, t.timestamp AS transaction_timestamp
            FROM fraud_alerts a
            LEFT JOIN transactions t
                ON t.transaction_id = a.transaction_id
            ORDER BY t.timestamp DESC
            LIMIT ?
        """, (max(1, min(limit, 500)),)).fetchall()

    return {"alerts": [dict(row) for row in rows]}


# =========================================================
# ADMIN MODEL STATUS
# =========================================================

@app.get("/api/admin/model")
def admin_model(admin=Depends(require_admin)):
    return {
        "model": "XGBoost",
        "status": "pending",
        "message": "Model inference is not connected yet.",
        "behavioral_analysis": "not_implemented"
    }


# =========================================================
# TRANSACTION RESPONSE FORMAT
# =========================================================

def tx_dict(row):

    r = dict(row)

    return {
        "transaction_id": r["transaction_id"],
        "user": r["user_upi_id"],
        "recipient": r["receiver_upi_id"],
        "amount": r["amount"],
        "timestamp": r["timestamp"],
        "type": r["transaction_type"],
        "transaction_status": r["status"],
        "device": r["device_type"],
        "city": r["city"],
        "fraud": r["is_fraud"],
        "risk": 100 if r["is_fraud"] else 0,

        "status": (
            "Flagged" if r["is_fraud"]
            else "Success" if r["status"] == "SUCCESS"
            else "Failed"
        )
    }
