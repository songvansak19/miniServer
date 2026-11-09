import java.util.ArrayList;
import java.util.List;

public class Account {
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