/*
    UPI Guard Authentication

    Users are retrieved from:
    data/users.json

    Prototype only:
    Passwords are currently stored as plain text.
    In the final FastAPI implementation, passwords should be hashed.
*/


/* =========================
   ELEMENTS
========================= */

const loginSection =
    document.getElementById("loginSection");

const signupSection =
    document.getElementById("signupSection");


// Login
const loginForm =
    document.getElementById("loginForm");

const loginEmail =
    document.getElementById("loginEmail");

const loginPassword =
    document.getElementById("loginPassword");

const rememberMe =
    document.getElementById("rememberMe");

const loginMessage =
    document.getElementById("loginMessage");


// Signup
const signupForm =
    document.getElementById("signupForm");

const signupName =
    document.getElementById("signupName");

const signupEmail =
    document.getElementById("signupEmail");

const signupUpi =
    document.getElementById("signupUpi");

const signupPassword =
    document.getElementById("signupPassword");

const confirmPassword =
    document.getElementById("confirmPassword");

const signupMessage =
    document.getElementById("signupMessage");


// Navigation
const showSignup =
    document.getElementById("showSignup");

const showLogin =
    document.getElementById("showLogin");

const forgotPassword =
    document.getElementById("forgotPassword");


/* =========================
   LOAD USERS FROM JSON
========================= */

async function loadUsers() {

    try {

        const response =
            await fetch("data/users.json");

        if (!response.ok) {
            throw new Error("Unable to load users.json");
        }

        const data =
            await response.json();

        return data.users || [];

    } catch (error) {

        console.error(
            "User database error:",
            error
        );

        showMessage(
            loginMessage,
            "Unable to connect to user database.",
            "error"
        );

        return [];
    }
}


/* =========================
   MESSAGE
========================= */

function showMessage(element, text, type) {

    element.textContent = text;

    element.className =
        `message ${type}`;
}


/* =========================
   PASSWORD TOGGLE
========================= */

function setupPasswordToggle(input, button) {

    button.addEventListener("click", () => {

        const isPassword =
            input.type === "password";

        input.type =
            isPassword ? "text" : "password";

        button.textContent =
            isPassword ? "Hide" : "Show";

    });

}


setupPasswordToggle(
    loginPassword,
    document.getElementById("loginPasswordToggle")
);


setupPasswordToggle(
    signupPassword,
    document.getElementById("signupPasswordToggle")
);


/* =========================
   LOGIN / SIGNUP SWITCH
========================= */

showSignup.addEventListener("click", () => {

    loginSection.classList.add("hidden");

    signupSection.classList.remove("hidden");

    loginMessage.textContent = "";

});


showLogin.addEventListener("click", () => {

    signupSection.classList.add("hidden");

    loginSection.classList.remove("hidden");

    signupMessage.textContent = "";

});


/* =========================
   LOGIN
========================= */
/* =========================
   LOGIN
========================= */

loginForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const email =
            loginEmail.value
                .trim()
                .toLowerCase();

        const password =
            loginPassword.value;


        if (!email || !password) {

            showMessage(
                loginMessage,
                "Please enter your email and password.",
                "error"
            );

            return;
        }


        /*
            Retrieve users from JSON
        */

        const users =
            await loadUsers();


        /*
            Find matching user
        */

        const user =
            users.find(
                account =>
                    account.email.toLowerCase() === email &&
                    account.password === password
            );


        /*
            Invalid credentials
        */

        if (!user) {

            showMessage(
                loginMessage,
                "Invalid email or password.",
                "error"
            );

            return;
        }


        /*
            Create login session

            Notice:
            No UPI ID is stored here.
        */

        const session = {

            authenticated: true,

            user: {

                id: user.id,

                name: user.name,

                email: user.email,

                role: user.role

            },

            loginTime:
                new Date().toISOString()

        };


        /*
            Remember me
        */

        const storage =
            rememberMe.checked
                ? localStorage
                : sessionStorage;


        storage.setItem(
            "upiGuardSession",
            JSON.stringify(session)
        );


        showMessage(
            loginMessage,
            `Welcome back, ${user.name}!`,
            "success"
        );


        /*
            Redirect to dashboard
        */

        /* =========================
           ROLE-BASED REDIRECT
        ========================= */

        setTimeout(() => {

            if (user.role === "admin") {

                window.location.href =
                    "../Admin/admin.html";

            } else {

                window.location.href =
                    "../Dashboard/dashboard.html";

            }

        }, 700);

    }
);
/* =========================
   SIGN UP
========================= */

signupForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const name =
            signupName.value.trim();

        const email =
            signupEmail.value
                .trim()
                .toLowerCase();

        const password =
            signupPassword.value;

        const confirm =
            confirmPassword.value;


        if (
            !name ||
            !email ||
            !password ||
            !confirm
        ) {

            showMessage(
                signupMessage,
                "Please fill in all required fields.",
                "error"
            );

            return;
        }


        if (password.length < 8) {

            showMessage(
                signupMessage,
                "Password must contain at least 8 characters.",
                "error"
            );

            return;
        }


        if (password !== confirm) {

            showMessage(
                signupMessage,
                "Passwords do not match.",
                "error"
            );

            return;
        }


        /*
            Retrieve existing users
        */

        const users =
            await loadUsers();


        /*
            Check whether email already exists
        */

        const existingUser =
            users.find(
                user =>
                    user.email.toLowerCase() === email
            );


        if (existingUser) {

            showMessage(
                signupMessage,
                "An account with this email already exists.",
                "error"
            );

            return;
        }


        /*
            IMPORTANT:

            Browser JavaScript cannot write
            directly into users.json.

            Therefore persistent registration
            will be handled by FastAPI.

            For now we show the appropriate message.
        */

        showMessage(
            signupMessage,
            "Registration will be connected to the FastAPI backend.",
            "error"
        );

    }
);


/* =========================
   FORGOT PASSWORD
========================= */

forgotPassword.addEventListener(
    "click",
    (event) => {

        event.preventDefault();

        showMessage(
            loginMessage,
            "Password reset is not enabled in this prototype.",
            "error"
        );

    }
);