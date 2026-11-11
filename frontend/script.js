// 2. Typed DOM elements and nullable Account holder
const loginBtn = document.getElementById("login");
let currentAccount = null;
// 3. Strongly typed Account class
class Account {
    username;
    password;
    account_num;
    balance;
    history;
    constructor(username, password, account_num, balance, history) {
        this.username = username;
        this.password = password;
        this.account_num = account_num;
        this.balance = balance;
        this.history = history;
    }
}
// 4. Safely attach the event listener (only if loginBtn exists in the HTML)
loginBtn?.addEventListener("click", async function (event) {
    event.preventDefault(); // Prevents page reload if button is inside a <form>
    const accountInput = document.getElementById("account_num");
    const passwordInput = document.getElementById("password");
    const account_num = accountInput.value;
    const password = passwordInput.value;
    try {
        const response = await fetch("http://127.0.0.1:8000/accounts/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ account_num, password })
        });
        if (!response.ok) {
            throw new Error(`Login failed: ${response.status}`);
        }
        // Certify the JSON response with your LoginResponse interface
        const data = await response.json();
        // Populate your Account class with the server's response
        currentAccount = new Account(data.name, data.password, data.account_num, data.balance, data.history);
        console.log("Logged in account:", currentAccount);
    }
    catch (error) {
        if (error instanceof Error) {
            console.error("Error:", error.message);
        }
    }
});