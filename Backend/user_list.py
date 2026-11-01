
import sqlite3
import csv
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "upi_guard.db"
OUTPUT = Path(__file__).resolve().parent / "all_users.csv"

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row

users = conn.execute("""
    SELECT
        id,
        name,
        email,
        upi_id,
        role,
        created_at
    FROM users
    ORDER BY role, upi_id
""").fetchall()

with open(OUTPUT, "w", newline="", encoding="utf-8") as file:

    writer = csv.writer(file)

    writer.writerow([
        "User ID",
        "Username",
        "Email",
        "UPI ID",
        "Role",
        "Initial Demo Password",
        "Created At"
    ])

    for user in users:

        # Imported dataset accounts use the shared
        # initial demo password.
        # Registered accounts may have their own password.

        password_note = (
            "User@123 (initial demo password)"
            if user["role"] == "user"
            else "Admin@123 (initial demo password)"
        )

        writer.writerow([
            user["id"],
            user["name"],
            user["email"],
            user["upi_id"],
            user["role"],
            password_note,
            user["created_at"]
        ])

conn.close()

print(f"Total accounts: {len(users)}")
print(f"User list saved to: {OUTPUT}")
