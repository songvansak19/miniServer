const container1 = document.getElementById("container1");
const registerContainer = document.getElementById("registerContainer");
const loginContainer = document.getElementById("loginContainer");
const homepageContainer = document.getElementById("homepage");

const loginButton = document.getElementById("login");
const registerButton = document.getElementById("register");

const returnRegister = document.getElementById("returnRegister");
const returnLogin = document.getElementById("returnLogin");

class Account {
	constructor(name, account_num, password, balance, history = []) {
		this.name = name;
		this.account_num = account_num;
		this.password = password;
		this.balance = balance;
		this.history = history;
	}
}

let user;

registerButton.onclick = function () {
	registerContainer.style.display = "block";
	container1.style.display = "none";
};

loginButton.onclick = function () {
	loginContainer.style.display = "block";
	container1.style.display = "none";
};

function returnFunc() {
	registerContainer.style.display = "none";
	loginContainer.style.display = "none";
	container1.style.display = "block";
}

function homepage() {
	loginContainer.style.display = "none";
	homepageContainer.style.display = "block";
	document.getElementById("welcomeText").textContent =
		`Welcome back, ${user.name}`;
}

returnRegister.onclick = returnFunc;
returnLogin.onclick = returnFunc;

document.getElementById("submitRegister").onclick = async function () {
	user = new Account(
		document.getElementById("username").value,
		document.getElementById("accountNumber").value,
		document.getElementById("password").value,
		Number(document.getElementById("balance").value),
		[
			"Account Created!",
			`Initial Balance: ${Number(document.getElementById("balance").value)}`,
		],
	);
	const jsonString = JSON.stringify(user);

	try {
		const request = await fetch("http://127.0.0.1:8000/accounts/register", {
			method: "POST",
			body: jsonString,
		});

		if (!request.ok) {
			document.getElementById("errorRegisterMsg").textContent =
				"Register failed: Please check your input again!!";
			return;
		} else {
			document.getElementById("errorRegisterMsg").textContent =
				"Register successful!";
			returnFunc();
		}

		const response = await request.json();
		user = new Account(
			response.name,
			response.account_num,
			response.password,
			response.balance,
			response.history,
		);
	} catch (error) {
		document.getElementById("errorRegisterMsg").textContent =
			"Register failed: Server is offline!";
	}
};

document.getElementById("submitLogin").onclick = async function () {
	const accountNumber = document.getElementById("loginAccountNumber").value;
	const password = document.getElementById("loginPassword").value;
	const jsonString = JSON.stringify({
		account_num: accountNumber,
		password: password,
	});

	try {
		const request = await fetch("http://127.0.0.1:8000/accounts/login", {
			method: "POST",
			body: jsonString,
		});

		if (!request.ok) {
			document.getElementById("errorLoginMsg").textContent =
				"Login failed: invalid account number or password!!";
			return;
		}

        const response = await request.json();
        user = new Account(
            response.name,
            response.account_num,
            response.password,
            response.balance,
            response.history,
        );

        document.getElementById("errorLoginMsg").textContent =
            "Login successful!";
        homepage();
	} catch (error) {
		document.getElementById("errorLoginMsg").textContent =
			"Login failed: Server is offline!";
	}
};
