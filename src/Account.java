import java.util.ArrayList;
import java.util.List;

public class Account {
    private String name;
    private long account_num;
    private double balance;
    private String password;
    private List<String> history = new ArrayList<>();

    public Account() {
    }

    public Account(String name, long account_num, String password, double balance) {
        this.name = name;
        this.account_num = account_num;
        this.password = password;
        this.balance = balance;
        this.history = new ArrayList<>();
        this.history.add("Account Created!");
        this.history.add("Initial Balance: " + balance);
    }

    public String getName() {
        return name;
    }

    public long getAccountNum() {
        return account_num;
    }

    public double getBalance() {
        return balance;
    }

    public String getPassword() {
        return password;
    }

    public List<String> getHistory() {
        if (history == null) {
            history = new ArrayList<>();
        }
        return history;
    }
}
