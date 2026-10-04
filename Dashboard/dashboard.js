const API_URL = "http://127.0.0.1:8000";

async function loadUserDashboard() {

    const userUPI =
        "user665_6433@okaxis";

    try {

        const response = await fetch(
            `${API_URL}/api/user/dashboard?user_upi_id=${encodeURIComponent(userUPI)}`
        );

        const data =
            await response.json();

        console.log(
            "User Dashboard:",
            data
        );

    } catch (error) {

        console.error(
            "Dashboard API error:",
            error
        );

    }
}

/* ==========================================
   UPI GUARD DASHBOARD
========================================== */


let transactions =
    JSON.parse(localStorage.getItem("upiGuardTransactions")) || [];

let alerts =
    JSON.parse(localStorage.getItem("upiGuardAlerts")) || [];


/* ==========================================
   INITIAL LOAD
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    updateDashboard();

});


/* ==========================================
   UPDATE DASHBOARD
========================================== */

function updateDashboard() {

    updateStatistics();

    renderTransactions();

    renderAlerts();

}


/* ==========================================
   STATISTICS
========================================== */

function updateStatistics() {

    const total = transactions.length;

    const blocked =
        transactions.filter(
            transaction => transaction.status === "Blocked"
        ).length;

    const stepUp =
        transactions.filter(
            transaction => transaction.status === "Step-up"
        ).length;


    let averageRisk = 0;

    if (total > 0) {

        const totalRisk =
            transactions.reduce(
                (sum, transaction) =>
                    sum + Number(transaction.risk),
                0
            );

        averageRisk = Math.round(totalRisk / total);

    }


    const protectedAmount =
        transactions
            .filter(
                transaction =>
                    transaction.status === "Blocked" ||
                    transaction.status === "Step-up"
            )
            .reduce(
                (sum, transaction) =>
                    sum + Number(transaction.amount),
                0
            );


    document.getElementById("totalTransactions")
        .textContent = total;

    document.getElementById("blockedTransactions")
        .textContent = blocked;

    document.getElementById("stepUpTransactions")
        .textContent = stepUp;

    document.getElementById("averageRisk")
        .textContent = averageRisk + "%";

    document.getElementById("amountProtected")
        .textContent =
        "₹" + protectedAmount.toLocaleString("en-IN");

}


/* ==========================================
   TRANSACTION TABLE
========================================== */

function renderTransactions() {

    const table =
        document.getElementById("transactionTable");

    const empty =
        document.getElementById("noTransactions");


    table.innerHTML = "";


    if (transactions.length === 0) {

        empty.classList.remove("hidden");

        return;

    }


    empty.classList.add("hidden");


    const recentTransactions =
        transactions.slice(-5).reverse();


    recentTransactions.forEach(transaction => {

        const row =
            document.createElement("tr");


        const riskClass =
            getRiskClass(transaction.risk);


        const statusClass =
            getStatusClass(transaction.status);


        row.innerHTML = `

            <td>
                <span class="transaction-id">
                    ${transaction.id}
                </span>
            </td>

            <td>
                <span class="recipient">
                    ${transaction.recipient}
                </span>
            </td>

            <td>
                <span class="amount">
                    ₹${Number(transaction.amount).toLocaleString("en-IN")}
                </span>
            </td>

            <td>
                <span class="${riskClass}">
                    ${transaction.risk}%
                </span>
            </td>

            <td>
                <span class="status ${statusClass}">
                    ${transaction.status}
                </span>
            </td>

        `;


        table.appendChild(row);

    });

}


/* ==========================================
   ALERTS
========================================== */

function renderAlerts() {

    const container =
        document.getElementById("alertsContainer");

    const empty =
        document.getElementById("noAlerts");


    container.innerHTML = "";


    if (alerts.length === 0) {

        empty.classList.remove("hidden");

        return;

    }


    empty.classList.add("hidden");


    const recentAlerts =
        alerts.slice(-4).reverse();


    recentAlerts.forEach(alert => {

        const item =
            document.createElement("div");

        item.className = "alert-item";


        const riskClass =
            getRiskClass(alert.risk);


        item.innerHTML = `

            <div>
                <div class="alert-title">
                    ${alert.title}
                </div>

                <div class="alert-subtitle">
                    ${alert.time}
                </div>
            </div>

            <div class="alert-transaction">
                ${alert.transaction}
            </div>

            <div class="alert-risk ${riskClass}">
                ${alert.risk}%
            </div>

            <div>
                <span class="status ${getStatusClass(alert.status)}">
                    ${alert.status}
                </span>
            </div>

        `;


        container.appendChild(item);

    });

}


/* ==========================================
   RISK CLASS
========================================== */

function getRiskClass(risk) {

    risk = Number(risk);


    if (risk < 40) {

        return "risk-low";

    }

    if (risk < 75) {

        return "risk-medium";

    }

    return "risk-high";

}


/* ==========================================
   STATUS CLASS
========================================== */

function getStatusClass(status) {

    if (status === "Safe") {

        return "status-safe";

    }

    if (status === "Step-up") {

        return "status-stepup";

    }

    return "status-blocked";

}


/* ==========================================
   GENERATE DEMO DATA
========================================== */

function generateDemoData() {

    const recipients = [

        "rahul@upi",
        "shop@upi",
        "amazon@upi",
        "merchant@upi",
        "amit@upi",
        "store@upi",
        "travel@upi"

    ];


    const titles = [

        "Unusual amount deviation",
        "New recipient detected",
        "Abnormal transaction frequency",
        "Unusual time-gap detected",
        "Multiple risk indicators detected"

    ];


    transactions = [];
    alerts = [];


    for (let i = 1; i <= 40; i++) {

        const amount =
            Math.floor(Math.random() * 15000) + 100;


        const risk =
            Math.floor(Math.random() * 100);


        let status;


        if (risk >= 80) {

            status = "Blocked";

        }
        else if (risk >= 50) {

            status = "Step-up";

        }
        else {

            status = "Safe";

        }


        const transaction = {

            id:
                "TXN" +
                String(i).padStart(4, "0"),

            recipient:
                recipients[
                    Math.floor(
                        Math.random() *
                        recipients.length
                    )
                ],

            amount: amount,

            risk: risk,

            status: status

        };


        transactions.push(transaction);


        /* Create alert for risky transactions */

        if (risk >= 50) {

            alerts.push({

                title:
                    titles[
                        Math.floor(
                            Math.random() *
                            titles.length
                        )
                    ],

                transaction:
                    transaction.id,

                risk:
                    risk,

                status:
                    status,

                time:
                    getRandomTime()

            });

        }

    }


    localStorage.setItem(
        "upiGuardTransactions",
        JSON.stringify(transactions)
    );


    localStorage.setItem(
        "upiGuardAlerts",
        JSON.stringify(alerts)
    );


    updateDashboard();

}


/* ==========================================
   RANDOM TIME
========================================== */

function getRandomTime() {

    const minutes =
        Math.floor(Math.random() * 60) + 1;


    if (minutes === 1) {

        return "1 minute ago";

    }


    return minutes + " minutes ago";

}