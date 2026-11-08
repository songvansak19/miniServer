import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

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
            System.out.println("History: " + history);
        }
    }

    public static void main(String[] args) throws Exception {
        Account user;
        Scanner input = new Scanner(System.in);

        System.out.print("Enter your Account Number: ");
        int account_num = input.nextInt();
        input.nextLine();
        System.out.print("Enter your Password: ");
        String password = input.nextLine();
        input.close();

        Process process = new ProcessBuilder(
            "curl.exe",
            "-X", "PUT",
            "http://localhost:8000/accounts/" + account_num + "/" + password
        ).start();

        String response = new String(
            process.getInputStream().readAllBytes()
        );

        user = gson.fromJson(response, Account.class);
        user.display();
    }
}
