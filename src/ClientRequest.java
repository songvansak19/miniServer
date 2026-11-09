import java.io.IOException;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;

public class ClientRequest {
    private static Gson gson = new GsonBuilder().setPrettyPrinting().create();
    private static String IP = "127.0.0.1";

    private static String processBuilder(String json, String rquest) throws IOException {
        Process process = new ProcessBuilder(
            "curl.exe",
            "-X", "POST",
            "http://" + IP + ":8000/accounts/" + rquest,
            "-d", json
        ).start();
        return new String(
            process.getInputStream().readAllBytes()
        );
    }

    public static void register(Account account) throws IOException {
        processBuilder(gson.toJson(account), "register");
    }

    public static Account login(long account_num, String password) throws IOException {
        JsonObject object = new JsonObject();
        object.addProperty("password", password);
        object.addProperty("account_num", account_num);
        String json = processBuilder(object.toString(), "login");
        if (json != null) {
            return gson.fromJson(json, Account.class);
        }
        return null;
    }

    public static Account deposit(double amount, long account_num) throws IOException {
        JsonObject object = new JsonObject();
        object.addProperty("amount", amount);
        object.addProperty("account_num", account_num);
        String json = processBuilder(object.toString(), "deposit");
        return gson.fromJson(json, Account.class);
    }

    public static Account withdraw(double amount, long account_num) throws IOException {
        JsonObject object = new JsonObject();
        object.addProperty("amount", amount);
        object.addProperty("account_num", account_num);
        String json = processBuilder(object.toString(), "withdraw");
        return gson.fromJson(json, Account.class);
    }

    public static Account update(long account_num) throws IOException {
        Process process = new ProcessBuilder(
            "curl.exe",
            "-X", "GET",
            "http://" + IP + ":8000/accounts/get/" + account_num
        ).start();

        String response = new String(
            process.getInputStream().readAllBytes()
        );
        return gson.fromJson(response, Account.class);
    }
}