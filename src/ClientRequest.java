import java.io.IOException;
import java.net.ConnectException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

public class ClientRequest {
    private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();
    private static final String IP = "127.0.0.1";
    private static final int PORT = 8000;
    private static final String BASE_URL = "http://" + IP + ":" + PORT + "/accounts";
    private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    private static String lastError = "";
    private static boolean serverOffline = false;

    public static String getLastError() {
        return lastError;
    }

    public static boolean isServerOffline() {
        return serverOffline;
    }

    private static HttpResponse<String> sendPost(String endpoint, String jsonBody) {
        lastError = "";
        serverOffline = false;
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(BASE_URL + "/" + endpoint))
                    .timeout(Duration.ofSeconds(10))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();
            return HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (ConnectException e) {
            serverOffline = true;
            lastError = "Server is not running on " + BASE_URL + "!";
            return null;
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            serverOffline = true;
            lastError = "Could not connect to server: " + e.getMessage();
            return null;
        }
    }

    private static HttpResponse<String> sendGet(String endpoint) {
        lastError = "";
        serverOffline = false;
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(BASE_URL + "/" + endpoint))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();
            return HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (ConnectException e) {
            serverOffline = true;
            lastError = "Server is not running on " + BASE_URL + "!";
            return null;
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            serverOffline = true;
            lastError = "Could not connect to server: " + e.getMessage();
            return null;
        }
    }

    private static String extractErrorMessage(String body, String fallback) {
        if (body == null || body.isBlank()) {
            return fallback;
        }
        try {
            JsonElement parsed = JsonParser.parseString(body);
            if (parsed.isJsonObject()) {
                JsonObject obj = parsed.getAsJsonObject();
                if (obj.has("error") && !obj.get("error").isJsonNull()) {
                    return obj.get("error").getAsString();
                }
            }
        } catch (Exception ignored) {
        }
        return fallback;
    }

    private static Account parseAccountResponse(HttpResponse<String> response, String fallbackError) {
        if (response == null) {
            return null;
        }
        String body = response.body();
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            lastError = extractErrorMessage(body, fallbackError);
            return null;
        }
        if (body == null || body.isBlank()) {
            lastError = fallbackError;
            return null;
        }
        try {
            JsonElement parsed = JsonParser.parseString(body);
            if (parsed.isJsonObject()) {
                JsonObject obj = parsed.getAsJsonObject();
                if (obj.has("error")) {
                    lastError = obj.get("error").getAsString();
                    return null;
                }
            }
            Account account = GSON.fromJson(body, Account.class);
            if (account == null || account.getName() == null || account.getAccountNum() <= 0) {
                lastError = fallbackError;
                return null;
            }
            return account;
        } catch (Exception e) {
            lastError = fallbackError;
            return null;
        }
    }

    public static boolean register(Account account) {
        HttpResponse<String> response = sendPost("register", GSON.toJson(account));
        if (response == null) {
            return false;
        }
        if (response.statusCode() >= 200 && response.statusCode() < 300) {
            return true;
        }
        lastError = extractErrorMessage(response.body(), "Failed to register account.");
        return false;
    }

    public static Account login(long account_num, String password) {
        JsonObject object = new JsonObject();
        object.addProperty("password", password);
        object.addProperty("account_num", account_num);
        HttpResponse<String> response = sendPost("login", object.toString());
        return parseAccountResponse(response, "Invalid account number or password.");
    }

    public static Account deposit(double amount, long account_num) {
        JsonObject object = new JsonObject();
        object.addProperty("amount", amount);
        object.addProperty("account_num", account_num);
        HttpResponse<String> response = sendPost("deposit", object.toString());
        return parseAccountResponse(response, "Deposit failed.");
    }

    public static Account withdraw(double amount, long account_num) {
        JsonObject object = new JsonObject();
        object.addProperty("amount", amount);
        object.addProperty("account_num", account_num);
        HttpResponse<String> response = sendPost("withdraw", object.toString());
        return parseAccountResponse(response, "Withdrawal failed.");
    }

    public static Account transfer(double amount, long account_num, Account account) {
        JsonObject object = new JsonObject();
        object.addProperty("amount", amount);
        object.addProperty("receiver", account_num);
        object.addProperty("transferer", String.valueOf(account.getAccountNum()));
        HttpResponse<String> response = sendPost("transfer", GSON.toJson(object));
        return parseAccountResponse(response, "Transfer failed.");
    }

    public static Account update(long account_num) {
        HttpResponse<String> response = sendGet("get/" + account_num);
        return parseAccountResponse(response, "Could not fetch updated account details.");
    }
}
