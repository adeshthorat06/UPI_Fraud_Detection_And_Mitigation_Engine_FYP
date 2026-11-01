import pandas as pd
import numpy as np
from pathlib import Path

# ==============================
# 1. LOAD DATASET
# ==============================

BASE_DIR = Path(__file__).resolve().parent
df = pd.read_csv(BASE_DIR / "Raw-UPI-Dataset-Final.csv")

print("Original shape:", df.shape)


# ==============================
# 2. TIMESTAMP FEATURES
# ==============================

df["timestamp"] = pd.to_datetime(df["timestamp"])

df["hour"] = df["timestamp"].dt.hour

df["day"] = df["timestamp"].dt.day

df["day_of_week"] = df["timestamp"].dt.dayofweek

df["month"] = df["timestamp"].dt.month

df["is_weekend"] = (
    df["day_of_week"] >= 5
).astype(int)


# ==============================
# 3. AMOUNT FEATURES
# ==============================

df["amount_log"] = np.log1p(df["amount"])

df["amount_round"] = (
    df["amount"] % 100 == 0
).astype(int)


# ==============================
# 4. BANK FEATURES
# ==============================

df["same_bank"] = (
    df["sender_bank"] ==
    df["receiver_bank"]
).astype(int)


# ==============================
# 5. TRANSACTION FEATURES
# ==============================

df["is_p2p"] = (
    df["transaction_type"] == "P2P"
).astype(int)

df["is_p2m"] = (
    df["transaction_type"] == "P2M"
).astype(int)

df["is_success"] = (
    df["status"] == "SUCCESS"
).astype(int)


# ==============================
# 6. MERCHANT FEATURES
# ==============================

df["has_merchant"] = (
    df["merchant_id"].notna()
).astype(int)

df["has_merchant_category"] = (
    df["merchant_category"].notna()
).astype(int)


# ==============================
# 7. DEVICE / NETWORK FEATURES
# ==============================

df["has_ip"] = (
    df["ip_address"].notna()
).astype(int)

df["has_isp"] = (
    df["isp"].notna()
).astype(int)


# ==============================
# 8. LOCATION FEATURES
# ==============================

df["has_location"] = (
    df["city"].notna()
).astype(int)

df["has_coordinates"] = (
    df["latitude"].notna() &
    df["longitude"].notna()
).astype(int)


# ==============================
# 9. SELECT BASIC FEATURES
# ==============================

basic_features = [

    # Transaction
    "amount",
    "amount_log",
    "amount_round",

    # Time
    "hour",
    "day",
    "day_of_week",
    "month",
    "is_weekend",

    # Transaction type/status
    "is_p2p",
    "is_p2m",
    "is_success",

    # Banking
    "same_bank",

    # Merchant
    "has_merchant",
    "has_merchant_category",

    # Device/network
    "has_ip",
    "has_isp",

    # Location
    "has_location",
    "has_coordinates"
]


# ==============================
# 10. CREATE FEATURE DATASET
# ==============================

features = df[
    [
        "transaction_id",
        "user_upi_id",
        "receiver_upi_id",
        *basic_features,
        "is_fraud"
    ]
]


# ==============================
# 11. SAVE
# ==============================

features.to_csv(
    BASE_DIR / "basic_features.csv",
    index=False
)


# ==============================
# 12. DISPLAY
# ==============================

print("\nBasic feature extraction completed.")

print("Feature dataset shape:",
      features.shape)

print("\nExtracted features:")

for feature in basic_features:
    print("-", feature)

print("\nFirst 5 rows:")
print(features.head())