const API_BASE = "http://127.0.0.1:8000/accounts";
const SESSION_KEY = "myclient_bank_account_num";
const AUTO_REFRESH_INTERVAL_MS = 3000;

class Account {
	constructor(name, account_num, password, balance, history = []) {
		this.name = name;
		this.account_num = account_num;
		this.password = password;
		this.balance = Number(balance) || 0;
		this.history = Array.isArray(history) ? history : [];
	}
}

let user = null;
let isBalanceMasked = false;
let isProfilePasswordVisible = false;
let autoRefreshEnabled = true;
let autoRefreshTimer = null;
let isSyncInFlight = false;
let isMutationInFlight = false;
let syncGeneration = 0;
let lastRenderedSnapshot = "";

// Auth DOM
const authShell = document.getElementById("authShell");
const dashboardShell = document.getElementById("dashboardShell");
const welcomeView = document.getElementById("welcomeView");
const registerView = document.getElementById("registerView");
const loginView = document.getElementById("loginView");

const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const registerMsg = document.getElementById("registerMsg");
const loginMsg = document.getElementById("loginMsg");

// Dashboard DOM
const toastContainer = document.getElementById("toastContainer");
const depositForm = document.getElementById("depositForm");
const withdrawForm = document.getElementById("withdrawForm");
const transferForm = document.getElementById("transferForm");
const depositMsg = document.getElementById("depositMsg");
const withdrawMsg = document.getElementById("withdrawMsg");
const transferMsg = document.getElementById("transferMsg");
const historySearch = document.getElementById("historySearch");

// --- Helpers ---
function formatCurrency(amount) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(Number(amount) || 0);
}

function setMessage(el, text, type = "") {
	el.textContent = text;
	el.className = `form-message${type ? ` ${type}` : ""}`;
}

function showToast(message, type = "info") {
	const toast = document.createElement("div");
	toast.className = `toast ${type}`;
	toast.textContent = message;
	toastContainer.appendChild(toast);
	setTimeout(() => {
		toast.remove();
	}, 3500);
}

function setButtonLoading(button, isLoading, loadingText) {
	if (!button.dataset.originalText) {
		button.dataset.originalText = button.textContent;
	}
	button.disabled = isLoading;
	button.textContent = isLoading ? loadingText : button.dataset.originalText;
}

function formatRequestError(action, err, fallbackMsg) {
	if (err && err.serverMessage) {
		return err.serverMessage;
	}
	if (err instanceof TypeError) {
		if (window.location.origin !== "http://127.0.0.1:8000") {
			const currentOrigin =
				window.location.origin === "null" ? "file://" : window.location.origin;
			return `${action} failed: Could not connect to http://127.0.0.1:8000 from ${currentOrigin}. Make sure the banking server is running.`;
		}
		return `${action} failed: Server is offline!`;
	}
	return fallbackMsg;
}

async function apiRequest(path, options = {}) {
	const fetchOptions = { ...options };
	if (fetchOptions.body) {
		fetchOptions.headers = {
			"Content-Type": "application/json",
			...(fetchOptions.headers || {}),
		};
	}

	const response = await fetch(`${API_BASE}${path}`, fetchOptions);
	const text = await response.text();
	let data = null;
	if (text) {
		try {
			data = JSON.parse(text);
		} catch {
			data = null;
		}
	}

	if (!response.ok) {
		const error = new Error(
			(data && data.error) || `HTTP ${response.status}`,
		);
		if (data && data.error) {
			error.serverMessage = data.error;
		}
		throw error;
	}

	if (data && data.error) {
		const error = new Error(data.error);
		error.serverMessage = data.error;
		throw error;
	}

	return data;
}

function toAccount(data) {
	if (!data || data.account_num === undefined) return null;
	return new Account(
		data.name,
		data.account_num,
		data.password,
		data.balance,
		data.history,
	);
}

function getAccountSnapshot(account) {
	if (!account) return "";
	return JSON.stringify({
		name: account.name,
		account_num: account.account_num,
		password: account.password,
		balance: account.balance,
		history: account.history,
	});
}

function updateAutoRefreshUI(state = autoRefreshEnabled ? "active" : "paused") {
	const toggleBtn = document.getElementById("autoRefreshToggleBtn");
	const label = document.getElementById("autoRefreshLabel");
	if (!toggleBtn || !label) return;

	toggleBtn.classList.remove("active", "paused", "offline");
	toggleBtn.classList.add(state);
	toggleBtn.setAttribute("aria-pressed", String(autoRefreshEnabled));

	if (!autoRefreshEnabled) {
		label.textContent = "Paused";
	} else if (state === "offline") {
		label.textContent = "Offline";
	} else {
		label.textContent = "Live (3s)";
	}
}

function stopAutoRefresh() {
	if (autoRefreshTimer !== null) {
		clearInterval(autoRefreshTimer);
		autoRefreshTimer = null;
	}
}

function startAutoRefresh() {
	stopAutoRefresh();
	updateAutoRefreshUI(autoRefreshEnabled ? "active" : "paused");
	if (!autoRefreshEnabled || !user) return;

	autoRefreshTimer = setInterval(() => {
		if (!user || !autoRefreshEnabled || document.hidden || isMutationInFlight) {
			return;
		}
		syncAccountFromServer(user.account_num, { silent: true }).catch(() => {
			// Handled inside syncAccountFromServer via offline badge state
		});
	}, AUTO_REFRESH_INTERVAL_MS);
}

async function syncAccountFromServer(accountNum, { silent = false } = {}) {
	if (isSyncInFlight && silent) return user;

	const requestGeneration = syncGeneration;
	isSyncInFlight = true;

	try {
		const data = await apiRequest(`/get/${accountNum}`, { method: "GET" });
		const updated = toAccount(data);
		if (!updated) {
			throw new Error("Account not found");
		}

		// Ignore stale responses if the user logged out, switched accounts, or mutated data mid-flight
		if (!user || String(user.account_num) !== String(accountNum) || requestGeneration !== syncGeneration) {
			return user;
		}

		updateAutoRefreshUI(autoRefreshEnabled ? "active" : "paused");

		const nextSnapshot = getAccountSnapshot(updated);
		if (nextSnapshot !== lastRenderedSnapshot) {
			const previousBalance = user.balance;
			user = updated;
			renderDashboard();
			if (silent && updated.balance !== previousBalance) {
				showToast(`Balance updated: ${formatCurrency(updated.balance)}`, "info");
			}
		}
		return user;
	} catch (err) {
		if (silent && user && String(user.account_num) === String(accountNum)) {
			updateAutoRefreshUI("offline");
			return user;
		}
		throw err;
	} finally {
		isSyncInFlight = false;
	}
}

// --- Auth View Switching ---
function showAuthView(view) {
	welcomeView.classList.add("hidden");
	registerView.classList.add("hidden");
	loginView.classList.add("hidden");
	view.classList.remove("hidden");
	setMessage(registerMsg, "");
	setMessage(loginMsg, "");
}

function enterDashboard(account) {
	syncGeneration += 1;
	user = account;
	lastRenderedSnapshot = "";
	sessionStorage.setItem(SESSION_KEY, String(user.account_num));
	authShell.classList.add("hidden");
	dashboardShell.classList.remove("hidden");
	isProfilePasswordVisible = false;
	switchTab("overview");
	renderDashboard();
	startAutoRefresh();
}

function exitDashboard() {
	syncGeneration += 1;
	stopAutoRefresh();
	user = null;
	lastRenderedSnapshot = "";
	sessionStorage.removeItem(SESSION_KEY);
	dashboardShell.classList.add("hidden");
	authShell.classList.remove("hidden");
	loginForm.reset();
	registerForm.reset();
	depositForm.reset();
	withdrawForm.reset();
	transferForm.reset();
	showAuthView(welcomeView);
}

// --- Dashboard Rendering ---
function switchTab(tabName) {
	document.querySelectorAll(".nav-item").forEach((btn) => {
		btn.classList.toggle("active", btn.dataset.tab === tabName);
	});
	document.querySelectorAll(".tab-panel").forEach((panel) => {
		panel.classList.toggle("active", panel.id === `tab-${tabName}`);
	});

	setMessage(depositMsg, "");
	setMessage(withdrawMsg, "");
	setMessage(transferMsg, "");
}

function classifyLog(entry) {
	const lower = String(entry).toLowerCase();
	if (lower.includes("deposit") || lower.includes("receive")) {
		return { label: "Deposit", cls: "deposit" };
	}
	if (lower.includes("withdraw")) {
		return { label: "Withdraw", cls: "withdraw" };
	}
	if (lower.includes("transfer")) {
		return { label: "Transfer", cls: "transfer" };
	}
	return { label: "Account", cls: "" };
}

function renderHistoryList(listEl, entries) {
	listEl.innerHTML = "";
	if (!entries.length) {
		const empty = document.createElement("li");
		empty.className = "empty-state";
		empty.textContent = "No activity logs match your view.";
		listEl.appendChild(empty);
		return;
	}

	entries.forEach((entry) => {
		const li = document.createElement("li");
		li.className = "history-item";

		const text = document.createElement("span");
		text.className = "history-item-text";
		text.textContent = entry;

		const badgeInfo = classifyLog(entry);
		const badge = document.createElement("span");
		badge.className = `history-badge ${badgeInfo.cls}`.trim();
		badge.textContent = badgeInfo.label;

		li.appendChild(text);
		li.appendChild(badge);
		listEl.appendChild(li);
	});
}

function renderDashboard() {
	if (!user) return;
	lastRenderedSnapshot = getAccountSnapshot(user);

	const formattedBalance = formatCurrency(user.balance);
	document.getElementById("welcomeText").textContent = `Welcome back, ${user.name}`;
	document.getElementById("bannerBalance").textContent = isBalanceMasked
		? "••••••••"
		: formattedBalance;
	document.getElementById("toggleBalanceMaskBtn").textContent = isBalanceMasked
		? "Show"
		: "Hide";
	document.getElementById("bannerAccountNum").textContent = user.account_num;

	// Overview
	document.getElementById("overviewName").textContent = user.name;
	document.getElementById("overviewAccountNum").textContent = user.account_num;
	document.getElementById("overviewLogCount").textContent = String(user.history.length);

	const recent = [...user.history].reverse().slice(0, 5);
	renderHistoryList(document.getElementById("recentHistoryList"), recent);

	// History
	renderFilteredHistory();

	// Profile
	document.getElementById("profileName").textContent = user.name;
	document.getElementById("profileAccountNum").textContent = user.account_num;
	document.getElementById("profileBalance").textContent = formattedBalance;
	document.getElementById("profileLogCount").textContent = String(user.history.length);
	document.getElementById("profilePassword").textContent = isProfilePasswordVisible
		? user.password
		: "••••••••";
	document.getElementById("toggleProfilePasswordBtn").textContent =
		isProfilePasswordVisible ? "Hide" : "Show";
}

function renderFilteredHistory() {
	if (!user) return;
	const query = historySearch.value.trim().toLowerCase();
	const reversed = [...user.history].reverse();
	const filtered = query
		? reversed.filter((item) => String(item).toLowerCase().includes(query))
		: reversed;

	document.getElementById("historyCountText").textContent =
		`${filtered.length} of ${user.history.length} log(s)`;
	renderHistoryList(document.getElementById("fullHistoryList"), filtered);
}

// --- Event Listeners ---
document.getElementById("goRegisterBtn").onclick = () => showAuthView(registerView);
document.getElementById("goLoginBtn").onclick = () => showAuthView(loginView);
document.getElementById("returnRegisterBtn").onclick = () => showAuthView(welcomeView);
document.getElementById("returnLoginBtn").onclick = () => showAuthView(welcomeView);

document.querySelectorAll(".toggle-password").forEach((btn) => {
	btn.addEventListener("click", () => {
		const input = document.getElementById(btn.dataset.target);
		const show = input.type === "password";
		input.type = show ? "text" : "password";
		btn.textContent = show ? "Hide" : "Show";
	});
});

// Register
registerForm.addEventListener("submit", async (e) => {
	e.preventDefault();
	const name = document.getElementById("regUsername").value.trim();
	const accountNumRaw = document.getElementById("regAccountNumber").value.trim();
	const password = document.getElementById("regPassword").value;
	const balanceRaw = document.getElementById("regBalance").value.trim();
	const balance = Number(balanceRaw);

	if (!name || !accountNumRaw || !password || balanceRaw === "") {
		setMessage(registerMsg, "Please fill in all fields.", "error");
		return;
	}
	if (Number(accountNumRaw) <= 0 || !Number.isInteger(Number(accountNumRaw))) {
		setMessage(registerMsg, "Account number must be a positive whole number.", "error");
		return;
	}
	if (Number.isNaN(balance) || balance < 0) {
		setMessage(registerMsg, "Initial balance must be 0 or greater.", "error");
		return;
	}

	const newAccount = new Account(name, Number(accountNumRaw), password, balance, [
		"Account Created!",
		`Initial Balance: ${balance}`,
	]);

	const submitBtn = document.getElementById("submitRegisterBtn");
	setButtonLoading(submitBtn, true, "Registering...");
	setMessage(registerMsg, "");

	try {
		await apiRequest("/register", {
			method: "POST",
			body: JSON.stringify(newAccount),
		});
		showToast("Account created! Please log in.", "success");
		document.getElementById("loginAccountNumber").value = accountNumRaw;
		registerForm.reset();
		showAuthView(loginView);
	} catch (err) {
		setMessage(
			registerMsg,
			formatRequestError(
				"Register",
				err,
				"Register failed: Please check your input or account number.",
			),
			"error",
		);
	} finally {
		setButtonLoading(submitBtn, false);
	}
});

// Login
loginForm.addEventListener("submit", async (e) => {
	e.preventDefault();
	const accountNumRaw = document.getElementById("loginAccountNumber").value.trim();
	const password = document.getElementById("loginPassword").value;

	if (!accountNumRaw || !password) {
		setMessage(loginMsg, "Please enter your account number and password.", "error");
		return;
	}

	const submitBtn = document.getElementById("submitLoginBtn");
	setButtonLoading(submitBtn, true, "Logging in...");
	setMessage(loginMsg, "");

	try {
		const data = await apiRequest("/login", {
			method: "POST",
			body: JSON.stringify({
				account_num: Number(accountNumRaw),
				password,
			}),
		});
		const loggedIn = toAccount(data);
		if (!loggedIn) {
			setMessage(loginMsg, "Login failed: invalid account number or password!", "error");
			return;
		}
		showToast(`Welcome back, ${loggedIn.name}!`, "success");
		enterDashboard(loggedIn);
	} catch (err) {
		setMessage(
			loginMsg,
			formatRequestError(
				"Login",
				err,
				"Login failed: invalid account number or password!",
			),
			"error",
		);
	} finally {
		setButtonLoading(submitBtn, false);
	}
});

// Navigation & Quick Actions
document.querySelectorAll(".nav-item").forEach((btn) => {
	btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});

document.querySelectorAll("[data-goto]").forEach((btn) => {
	btn.addEventListener("click", () => switchTab(btn.dataset.goto));
});

document.querySelectorAll(".quick-chips .chip[data-amount]").forEach((chip) => {
	chip.addEventListener("click", () => {
		const targetId = chip.parentElement.dataset.target;
		const input = document.getElementById(targetId);
		input.value = chip.dataset.amount;
		input.focus();
	});
});

document.getElementById("withdrawMaxBtn").addEventListener("click", () => {
	if (!user) return;
	const input = document.getElementById("withdrawAmount");
	input.value = user.balance;
	input.focus();
});

document.getElementById("toggleBalanceMaskBtn").addEventListener("click", () => {
	isBalanceMasked = !isBalanceMasked;
	renderDashboard();
});

document.getElementById("toggleProfilePasswordBtn").addEventListener("click", () => {
	isProfilePasswordVisible = !isProfilePasswordVisible;
	renderDashboard();
});

async function copyAccountNumber() {
	if (!user) return;
	try {
		await navigator.clipboard.writeText(String(user.account_num));
		showToast("Account number copied to clipboard.", "success");
	} catch {
		showToast(`Account #${user.account_num}`, "info");
	}
}

document.getElementById("copyAccountNumBtn").addEventListener("click", copyAccountNumber);
document.getElementById("profileCopyBtn").addEventListener("click", copyAccountNumber);

// Refresh, Auto-Refresh & Logout
document.getElementById("autoRefreshToggleBtn").addEventListener("click", () => {
	autoRefreshEnabled = !autoRefreshEnabled;
	if (autoRefreshEnabled) {
		startAutoRefresh();
		if (user) {
			syncAccountFromServer(user.account_num, { silent: true }).catch(() => {});
		}
		showToast("Live auto-refresh enabled (every 3s).", "info");
	} else {
		stopAutoRefresh();
		updateAutoRefreshUI("paused");
		showToast("Live auto-refresh paused.", "info");
	}
});

document.addEventListener("visibilitychange", () => {
	if (!document.hidden && user && autoRefreshEnabled && !isMutationInFlight) {
		syncAccountFromServer(user.account_num, { silent: true }).catch(() => {});
	}
});

document.getElementById("refreshAccountBtn").addEventListener("click", async (e) => {
	if (!user) return;
	const btn = e.currentTarget;
	setButtonLoading(btn, true, "Syncing...");
	try {
		await syncAccountFromServer(user.account_num);
		showToast("Account synced.", "success");
	} catch {
		showToast("Could not reach server to refresh.", "error");
	} finally {
		setButtonLoading(btn, false);
	}
});

document.getElementById("logoutBtn").addEventListener("click", () => {
	exitDashboard();
	showToast("You have been logged out.", "info");
});

async function executeAccountTransaction({
	actionLabel,
	button,
	loadingText,
	msgEl,
	form,
	endpoint,
	payload,
	failMsg,
	successMsg,
	toastMsg,
}) {
	setButtonLoading(button, true, loadingText);
	setMessage(msgEl, "");
	isMutationInFlight = true;
	syncGeneration += 1;

	try {
		const res = await apiRequest(endpoint, {
			method: "POST",
			body: JSON.stringify(payload),
		});
		if (!res) {
			setMessage(msgEl, failMsg, "error");
			return;
		}
		syncGeneration += 1;
		await syncAccountFromServer(user.account_num);
		form.reset();
		setMessage(msgEl, successMsg, "success");
		showToast(toastMsg, "success");
	} catch (err) {
		setMessage(msgEl, formatRequestError(actionLabel, err, failMsg), "error");
	} finally {
		isMutationInFlight = false;
		setButtonLoading(button, false);
	}
}

// Deposit
depositForm.addEventListener("submit", async (e) => {
	e.preventDefault();
	if (!user) return;
	const amount = Number(document.getElementById("depositAmount").value);
	if (Number.isNaN(amount) || amount <= 0) {
		setMessage(depositMsg, "Please enter a deposit amount greater than $0.", "error");
		return;
	}

	await executeAccountTransaction({
		actionLabel: "Deposit",
		button: document.getElementById("submitDepositBtn"),
		loadingText: "Depositing...",
		msgEl: depositMsg,
		form: depositForm,
		endpoint: "/deposit",
		payload: { amount, account_num: user.account_num },
		failMsg: "Deposit failed. Please try again.",
		successMsg: `Deposited ${formatCurrency(amount)} successfully!`,
		toastMsg: `Deposited ${formatCurrency(amount)}`,
	});
});

// Withdraw
withdrawForm.addEventListener("submit", async (e) => {
	e.preventDefault();
	if (!user) return;
	const amount = Number(document.getElementById("withdrawAmount").value);
	if (Number.isNaN(amount) || amount <= 0) {
		setMessage(withdrawMsg, "Please enter a withdrawal amount greater than $0.", "error");
		return;
	}
	if (amount > user.balance) {
		setMessage(withdrawMsg, "Insufficient balance for this withdrawal.", "error");
		return;
	}

	await executeAccountTransaction({
		actionLabel: "Withdrawal",
		button: document.getElementById("submitWithdrawBtn"),
		loadingText: "Withdrawing...",
		msgEl: withdrawMsg,
		form: withdrawForm,
		endpoint: "/withdraw",
		payload: { amount, account_num: user.account_num },
		failMsg: "Withdrawal failed. Please check your balance.",
		successMsg: `Withdrew ${formatCurrency(amount)} successfully!`,
		toastMsg: `Withdrew ${formatCurrency(amount)}`,
	});
});

// Transfer
transferForm.addEventListener("submit", async (e) => {
	e.preventDefault();
	if (!user) return;
	const receiverRaw = document.getElementById("transferReceiver").value.trim();
	const receiver = Number(receiverRaw);
	const amount = Number(document.getElementById("transferAmount").value);

	if (!receiverRaw || Number.isNaN(receiver) || receiver <= 0) {
		setMessage(transferMsg, "Please enter a valid recipient account number.", "error");
		return;
	}
	if (String(receiver) === String(user.account_num)) {
		setMessage(transferMsg, "You cannot transfer funds to your own account.", "error");
		return;
	}
	if (Number.isNaN(amount) || amount <= 0) {
		setMessage(transferMsg, "Please enter a transfer amount greater than $0.", "error");
		return;
	}
	if (amount > user.balance) {
		setMessage(transferMsg, "Insufficient balance for this transfer.", "error");
		return;
	}

	await executeAccountTransaction({
		actionLabel: "Transfer",
		button: document.getElementById("submitTransferBtn"),
		loadingText: "Sending...",
		msgEl: transferMsg,
		form: transferForm,
		endpoint: "/transfer",
		payload: {
			amount,
			receiver,
			transferer: String(user.account_num),
		},
		failMsg: "Transfer failed. Verify the recipient account number and balance.",
		successMsg: `Transferred ${formatCurrency(amount)} to #${receiver}.`,
		toastMsg: `Transferred ${formatCurrency(amount)} to #${receiver}`,
	});
});

// History search
historySearch.addEventListener("input", renderFilteredHistory);

// Restore session on page reload if server is reachable
window.addEventListener("DOMContentLoaded", async () => {
	const savedAccount = sessionStorage.getItem(SESSION_KEY);
	if (!savedAccount) return;
	try {
		const data = await apiRequest(`/get/${savedAccount}`, { method: "GET" });
		const restored = toAccount(data);
		if (restored) {
			enterDashboard(restored);
		} else {
			sessionStorage.removeItem(SESSION_KEY);
		}
	} catch {
		sessionStorage.removeItem(SESSION_KEY);
	}
});
