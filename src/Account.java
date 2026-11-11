import java.util.ArrayList;
import java.util.List;

public class Account {
    private String name;
    private long account_num;
    private String password;
    private double balance;
    private List<String> history = new ArrayList<>();

    public String getName() {
        return name;
    }

    public long getAccountNum() {
        return account_num;
    }

    public String getPassword() {
        return password;
    }

    public double getBalance() {
        return balance;
    }

    public List<String> getHistory() {
        return history;
    }

    public void deposit(double amount) {
        balance += amount;
    }

    public void withdraw(double amount) {
        balance -= amount;
    }

    public void addHistory(String log) {
        history.add(log);
    }

    public void transfer(double amount) {
        balance += amount;
    }
}
