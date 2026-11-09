import java.util.ArrayList;
import java.util.List;

public class Account {
        private String name;
        private long account_num;
        private double balance;
        private String password;
        private List<String> history = new ArrayList<>();

        public Account(String name, long account_num, String password, double balance) {
            this.name = name;
            this.account_num = account_num;
            this.password = password;
            this.balance = balance;
        }

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

        public String getName() {return name;}
        public long getAccountNum() {return account_num;}
        public double getBalance() {return balance;}
        public String getPassword() {return password;}
        public List<String> getHistory() {return history;}
    }