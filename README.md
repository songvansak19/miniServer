# Banking Client

Banking client applications for registering and managing accounts through an
HTTP banking service. The repository currently contains:

- A Java command-line client with account registration, login, balance checks,
  deposits, withdrawals, transfers, and transaction history.
- A browser frontend for account registration and login.
- A small `test` page containing frontend and JavaScript practice code.

Both clients expect the banking service to be available at
`http://127.0.0.1:8000`.

## Project structure

```text
src/       Java client source code
bin/       Compiled Java classes
lib/       Java dependencies (Gson and Javalin-related JARs)
frontend/  Browser banking interface
test/      Frontend practice page and scripts
start.bat  Compiles and starts the Java command-line client
```

## Requirements

- Java 17 or newer
- `curl.exe` available on Windows
- A compatible banking HTTP service running on port `8000`

The Java client uses Gson from `lib/gson-2.13.2.jar` to serialize and
deserialize account data. The banking server is not included in this
repository.

## Run the Java client

1. Start the compatible banking service on `127.0.0.1:8000`.
2. From the project root, run:

   ```bat
   start.bat
   ```

   Or run the equivalent commands manually:

   ```bat
   if not exist "bin" mkdir bin
   javac -cp "lib/*" -d bin src/*.java
   java -cp "bin;lib/*" Main
   ```

3. Use the menu to register or log in. After logging in, the client provides
   balance, deposit, withdrawal, transfer, history, and logout options.

## Run the browser frontend

Start the banking service first, then open
[`frontend/index.html`](frontend/index.html) in a browser. The frontend sends
registration and login requests to:

- `POST /accounts/register`
- `POST /accounts/login`

The remaining account action buttons are present in the interface but are not
implemented in `frontend/script.js` yet.

## HTTP endpoints used by the Java client

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/accounts/register` | Register an account |
| `POST` | `/accounts/login` | Authenticate an account |
| `POST` | `/accounts/deposit` | Deposit funds |
| `POST` | `/accounts/withdraw` | Withdraw funds |
| `POST` | `/accounts/transfer` | Transfer funds |
| `GET` | `/accounts/get/{account_num}` | Refresh account data |

The Java client sends JSON request bodies containing account numbers, passwords,
amounts, and transfer account numbers as appropriate.
