/* ==========================================
   UPI GUARD — ADMIN DASHBOARD
========================================== */


/* =========================
   CONFIGURATION
========================= */

const API_URL = "http://127.0.0.1:8000";


/* =========================
   SESSION
========================= */

function getSession() {

    try {

        const localSession =
            localStorage.getItem("upiGuardSession");

        const sessionSession =
            sessionStorage.getItem("upiGuardSession");

        const storedSession =
            localSession || sessionSession;

        if (!storedSession) {
            return null;
        }

        return JSON.parse(storedSession);

    } catch (error) {

        console.error(
            "Session error:",
            error
        );

        return null;
    }
}


/* =========================
   ADMIN ACCESS CHECK
========================= */

function checkAdminAccess() {

    const session = getSession();


    /* No login session */

    if (!session) {

        window.location.href =
            "../Login/login.html";

        return false;
    }


    /* Session exists but user data missing */

    if (!session.user) {

        console.error(
            "Invalid session: user data missing."
        );

        window.location.href =
            "../Login/login.html";

        return false;
    }


    /* Check role */

    if (session.user.role !== "admin") {

        alert(
            "Admin access required."
        );

        /*
            User is authenticated,
            but does not have admin privileges.
        */

        window.location.href =
            "../Dashboard/dashboard.html";

        return false;
    }


    /* Admin authenticated */

    console.log(
        "Admin authenticated:",
        session.user.email
    );

    return true;
}


/* =========================
   LOAD DASHBOARD DATA
========================= */

async function loadDashboard() {

    try {

        console.log(
            "Connecting to FastAPI..."
        );


        const response =
            await fetch(
                `${API_URL}/api/admin/dashboard`
            );


        if (!response.ok) {

            throw new Error(
                `FastAPI request failed: ${response.status}`
            );
        }


        const data =
            await response.json();


        console.log(
            "Dashboard data:",
            data
        );


        updateDashboard(data);

    }

    catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

        showAPIError();
    }
}


/* =========================
   UPDATE DASHBOARD
========================= */

function updateDashboard(data) {


    /* Dataset records */

    const datasetRecords =
        document.getElementById(
            "datasetRecords"
        );

    if (datasetRecords) {

        datasetRecords.textContent =
            Number(
                data.dataset_records || 0
            ).toLocaleString();
    }


    /* Total transactions */

    const totalTransactions =
        document.getElementById(
            "totalTransactions"
        );

    if (totalTransactions) {

        totalTransactions.textContent =
            Number(
                data.dataset_records ||
                data.total_transactions ||
                0
            ).toLocaleString();
    }


    /* Fraud cases */

    const fraudCases =
        document.getElementById(
            "fraudCases"
        );

    if (fraudCases) {

        fraudCases.textContent =
            Number(
                data.fraud_cases || 0
            ).toLocaleString();
    }


    /* Fraud rate */

    const fraudRate =
        document.getElementById(
            "fraudRate"
        );

    if (fraudRate) {

        fraudRate.textContent =
            `${data.fraud_rate || 0}%`;
    }
}


/* =========================
   API ERROR
========================= */

function showAPIError() {

    console.warn(
        "Could not connect to FastAPI."
    );


    const status =
        document.querySelector(
            ".system-status"
        );


    if (status) {

        status.innerHTML = `
            <span
                class="status-dot"
                style="background:#d62828">
            </span>

            API Offline
        `;
    }
}


/* =========================
   LOAD TRANSACTIONS
========================= */

async function loadRecentTransactions() {

    try {

        const response =
            await fetch(
                `${API_URL}/api/admin/transactions?limit=10`
            );


        if (!response.ok) {

            throw new Error(
                `Transaction API failed: ${response.status}`
            );
        }


        const data =
            await response.json();


        console.log(
            "Transactions:",
            data
        );


        displayTransactions(
            data.transactions || []
        );

    }

    catch (error) {

        console.error(
            "Transaction loading error:",
            error
        );
    }
}


/* =========================
   DISPLAY TRANSACTIONS
========================= */

function displayTransactions(
    transactions
) {

    const table =
        document.getElementById(
            "transactionTable"
        );


    if (!table) {
        return;
    }


    table.innerHTML = "";


    transactions.forEach(
        transaction => {


            const row =
                document.createElement(
                    "tr"
                );


            /* Amount */

            const amount =
                Number(
                    transaction.amount || 0
                ).toLocaleString(
                    "en-IN",
                    {
                        minimumFractionDigits: 2
                    }
                );


            /* Fraud */

            const isFraud =
                transaction.fraud === 1 ||
                transaction.fraud === true;


            row.innerHTML = `

                <td>
                    <strong>
                        ${transaction.transaction_id || "—"}
                    </strong>
                </td>


                <td>
                    ${transaction.user || "—"}
                </td>


                <td>
                    ${transaction.recipient || "—"}
                </td>


                <td>
                    ₹${amount}
                </td>


                <td class="
                    ${isFraud
                        ? "danger-text"
                        : "safe-text"}
                ">

                    ${isFraud
                        ? "Fraud"
                        : "Normal"}

                </td>


                <td>

                    <span class="
                        status
                        ${isFraud
                            ? "danger"
                            : "safe"}
                    ">

                        ${isFraud
                            ? "FLAGGED"
                            : "ALLOW"}

                    </span>

                </td>

            `;


            table.appendChild(row);
        }
    );
}


/* =========================
   INITIALIZE ADMIN DASHBOARD
========================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        /*
            STEP 1
            Check whether user is logged in
            AND whether user is admin.
        */

        if (!checkAdminAccess()) {
            return;
        }


        /*
            STEP 2
            Load admin dashboard.
        */

        loadDashboard();


        /*
            STEP 3
            Load recent transactions.
        */

        loadRecentTransactions();
    }
);