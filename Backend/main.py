from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os


# =========================================================
# FASTAPI APPLICATION
# =========================================================

app = FastAPI(
    title="UPI Guard API",
    description="UPI Fraud Detection & Mitigation Engine",
    version="1.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# DATASET
# =========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATASET_PATH = os.path.join(
    BASE_DIR,
    "basic_features.csv"
)

try:
    df = pd.read_csv(DATASET_PATH)

    print("======================================")
    print("UPI GUARD BACKEND")
    print("======================================")
    print(f"Dataset loaded successfully")
    print(f"Records : {len(df)}")
    print(f"Columns : {len(df.columns)}")
    print("======================================")

except Exception as error:

    print("Dataset loading error:")
    print(error)

    df = pd.DataFrame()


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():

    return {
        "project": "UPI Guard",
        "message": "UPI Fraud Detection & Mitigation Engine API",
        "status": "online"
    }


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/api/health")
def health():

    return {
        "status": "online",
        "dataset_loaded": not df.empty,
        "records": len(df)
    }


# =========================================================
# ADMIN DASHBOARD
# =========================================================

@app.get("/api/admin/dashboard")
def admin_dashboard():

    if df.empty:
        raise HTTPException(
            status_code=500,
            detail="Dataset is not loaded."
        )

    total_records = len(df)

    fraud_cases = int(
        df["is_fraud"].sum()
    )

    normal_cases = total_records - fraud_cases

    fraud_rate = (
        fraud_cases / total_records
    ) * 100

    unique_users = (
        df["user_upi_id"].nunique()
    )

    unique_recipients = (
        df["receiver_upi_id"].nunique()
    )

    total_amount = (
        df["amount"].sum()
    )

    average_amount = (
        df["amount"].mean()
    )

    return {

        "dataset_records": total_records,

        "fraud_cases": fraud_cases,

        "normal_cases": normal_cases,

        "fraud_rate": round(
            fraud_rate,
            2
        ),

        "unique_users": unique_users,

        "unique_recipients": unique_recipients,

        "total_amount": round(
            float(total_amount),
            2
        ),

        "average_amount": round(
            float(average_amount),
            2
        ),

        "model": "XGBoost",

        "behavioral_features": [
            "D_A",
            "D_F",
            "D_G",
            "D_T",
            "BDS"
        ]
    }


# =========================================================
# ADMIN TRANSACTIONS
# =========================================================

@app.get("/api/admin/transactions")
def admin_transactions(limit: int = 10):

    if df.empty:
        raise HTTPException(
            status_code=500,
            detail="Dataset is not loaded."
        )

    transactions = df.head(limit)

    result = []

    for _, row in transactions.iterrows():

        result.append({

            "transaction_id":
                str(row["transaction_id"]),

            "user":
                str(row["user_upi_id"]),

            "recipient":
                str(row["receiver_upi_id"]),

            "amount":
                float(row["amount"]),

            "fraud":
                int(row["is_fraud"])
        })

    return {
        "transactions": result
    }


# =========================================================
# FRAUD STATISTICS
# =========================================================

@app.get("/api/admin/fraud-stats")
def fraud_statistics():

    if df.empty:
        raise HTTPException(
            status_code=500,
            detail="Dataset is not loaded."
        )

    fraud = int(
        df["is_fraud"].sum()
    )

    normal = len(df) - fraud

    return {

        "fraud": fraud,

        "normal": normal,

        "total": len(df),

        "fraud_percentage": round(
            (fraud / len(df)) * 100,
            2
        )
    }


# =========================================================
# USER DASHBOARD
# =========================================================

@app.get("/api/user/dashboard")
def user_dashboard(user_upi_id: str):

    if df.empty:
        raise HTTPException(
            status_code=500,
            detail="Dataset is not loaded."
        )

    user_data = df[
        df["user_upi_id"] == user_upi_id
    ]

    if user_data.empty:

        return {
            "user": user_upi_id,
            "transactions": 0,
            "fraud_transactions": 0,
            "total_amount": 0,
            "recent_transactions": []
        }

    fraud_transactions = int(
        user_data["is_fraud"].sum()
    )

    total_amount = float(
        user_data["amount"].sum()
    )

    recent = user_data.head(10)

    transactions = []

    for _, row in recent.iterrows():

        transactions.append({

            "transaction_id":
                str(row["transaction_id"]),

            "recipient":
                str(row["receiver_upi_id"]),

            "amount":
                float(row["amount"]),

            "fraud":
                int(row["is_fraud"])
        })

    return {

        "user": user_upi_id,

        "transactions":
            len(user_data),

        "fraud_transactions":
            fraud_transactions,

        "total_amount":
            round(total_amount, 2),

        "recent_transactions":
            transactions
    }