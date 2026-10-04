# UPI Fraud Detection & Mitigation Engine

An AI/ML-based system designed to detect and mitigate fraudulent UPI transactions using **XGBoost** and behavioral deviation analysis.

## 📌 Project Overview

The **UPI Fraud Detection & Mitigation Engine** analyzes UPI transaction data and user behavioral patterns to identify potentially fraudulent transactions.

The system combines transaction-level features with behavioral deviation features and uses an **XGBoost classifier** to generate a fraud probability. Based on the predicted risk, the system can:

- ✅ Allow the transaction
- ⚠️ Request step-up verification
- 🚫 Block and flag the transaction

> **Note:** This is a college project prototype. It does not directly connect to NPCI or process real-money UPI transactions.

---

## 🎯 Objectives

- Detect fraudulent UPI transactions using machine learning.
- Analyze unusual user transaction behavior.
- Reduce false positives through behavioral profiling.
- Provide risk-based transaction decisions.
- Provide dashboards for users and administrators.
- Provide explainable transaction analysis for suspicious activity.
