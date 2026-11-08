import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;

public class createAcc {
    static Gson gson = new GsonBuilder().setPrettyPrinting().create();

    public static class Account {
        private String name;
        private int account_num;
        private double balance;
        private String password;
        private List<String> history = new ArrayList<>();

        public void display() {
            System.out.println("Name: " + name);
            System.out.println("Account Number: " + account_num);
            System.out.println("Balance: " + balance);
            System.out.println("Password: " + password);
            System.out.println("History | " + history.size() + " log(s)");
            System.out.println("=".repeat(30));
            for (String log : history) {
                System.out.println("- " + log);
            }
            System.out.println("=".repeat(30));
        }
    }

    public static void main(String[] args) throws Exception {
        Account user = new Account();
        Scanner input = new Scanner(System.in);
        String IP = "127.0.0.1";

        System.out.print("Enter your Account Number: ");
        int account_num = input.nextInt();
        input.nextLine();
        System.out.print("Enter your Password: ");
        String password = input.nextLine();
        input.close();

        JsonObject json = new JsonObject();
        json.addProperty("account_num", account_num);
        json.addProperty("password", password);

        Process process = new ProcessBuilder(
            "curl.exe",
            "-X", "POST",
            "http://" + IP + ":8000/accounts/login",
            "-d", json.toString()
        ).start();

        String response = new String(
            process.getInputStream().readAllBytes()
        );

        try {
            user = gson.fromJson(response, Account.class);
            user.display();
        } catch (Exception e) {
            System.out.println("=".repeat(30));
            System.out.println("Account not found!!");
            System.out.println("=".repeat(30));
        }
    }
}
