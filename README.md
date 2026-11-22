# Banking Client

Banking client applications for registering and managing accounts through the HTTP banking service. The repository contains:

- A **Java command-line client** (`src/`) with account registration, login, balance checks, deposits, withdrawals, transfers, and transaction history using Java's built-in `HttpClient`.
- A **browser frontend dashboard** (`frontend/`) with registration, login, balance overview, quick deposit/withdrawal/transfer forms, searchable transaction history, account profile view, and 3-second live auto-refresh.
- A small `test/` directory containing frontend and JavaScript practice code.

Both clients connect to the banking service at `http://127.0.0.1:8000`.

## Project structure

```text
src/       Java CLI client source code (Main, ClientRequest, Account)
bin/       Compiled Java classes
lib/       Java dependencies (Gson and Javalin-related JARs)
frontend/  Browser banking dashboard (index.html, script.js, style.css)
test/      Frontend practice page and scripts
start.sh   Compiles and starts the Java command-line client on Linux/macOS
start.bat  Compiles and starts the Java command-line client on Windows
```

## Requirements

- Java 17 or newer
- The banking HTTP server (`myServer`) running on port `8000`

## Run the Java CLI client

1. Start the banking service on `127.0.0.1:8000`.
2. From the project root, run:

   **Linux / macOS:**
   ```bash
   ./start.sh
   ```

   **Windows:**
   ```bat
   start.bat
   ```

3. Use the menu to register or log in. After logging in, the client provides balance, deposit, withdrawal, transfer, history, and logout options with detailed server error feedback.

## Run the browser frontend

Start the banking service first, then open [`frontend/index.html`](frontend/index.html) in a browser (directly or via any local static server). The frontend supports all banking operations and displays real-time error and status messages from the server.

## HTTP endpoints used by the clients

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/accounts/register` | Register a new account |
| `POST` | `/accounts/login` | Authenticate an account |
| `POST` | `/accounts/deposit` | Deposit funds |
| `POST` | `/accounts/withdraw` | Withdraw funds |
| `POST` | `/accounts/transfer` | Transfer funds between accounts |
| `GET` | `/accounts/get/{id}` | Fetch/refresh account data |
