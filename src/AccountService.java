public class AccountService {
    public static boolean deposit(double amount, Account account) {
        if (amount > 0 && amount <= 10e6) {
            account.deposit(amount);
            return true;
        }
        return false;
    }

    public static boolean withdraw(double amount, Account account) {
        if (amount > 0 && amount <= account.getBalance()) {
            account.withdraw(amount);
            return true;
        }
        return false;
    }
}