package com.splitzee.expenses.service.impl;

import com.splitzee.expenses.service.SettlementService;
import com.splitzee.model.*;
import com.splitzee.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.math.BigDecimal;


@Service
public class SettlementServiceImpl implements SettlementService {

    @Autowired
    private ExpenseRepository expRepo;

    @Autowired
    private GroupRepository grpRepo;

    @Autowired
    private BalanceRepository balRepo;

    @Autowired
    private TransactionRepository txnRepo;

    @Autowired
    private UserRepository userRepo;

    private static class DebtNode {
        String email;
        BigDecimal amount;

        public DebtNode(String email, BigDecimal amount) {
            this.email = email;
            this.amount = amount;
        }
    }

    public Map<String, BigDecimal> computeNet(List<Split> allExpSplits, String groupId)
    {
        Map<String, BigDecimal> net = new HashMap<>();
        List<Balance> balances = balRepo.findByGroupId(groupId);
        if (balances != null) {
            for (Balance b : balances) {
                if (b.getUser() != null && b.getUser().getEmail() != null) {
                    net.put(b.getUser().getEmail(), b.getNetBalance() != null ? b.getNetBalance() : BigDecimal.ZERO);
                }
            }
        }
        return net;
    }

    public List<Split> allSplits(String groupId)
    {
        Group g = grpRepo.findById(groupId).orElse(null);
        if (g == null) return new ArrayList<>();

        List<Split> allExpSplits = new ArrayList<>();
        if (g.getExpenses() != null) {
            for (Expenses exp : g.getExpenses()) {
                if (exp.getSplits() != null) {
                    allExpSplits.addAll(exp.getSplits());
                }
            }
        }
        return allExpSplits;
    }

    public List<Transaction> settle(Map<String, BigDecimal> net, String groupId)
    {
        Deque<DebtNode> debtors = new ArrayDeque<>();
        Deque<DebtNode> creditors = new ArrayDeque<>();

        for (Map.Entry<String, BigDecimal> entry : net.entrySet()) {
            if (entry.getValue() != null && entry.getValue().compareTo(BigDecimal.ZERO) < 0) {
                debtors.push(new DebtNode(entry.getKey(), entry.getValue().abs()));
            } else if (entry.getValue() != null && entry.getValue().compareTo(BigDecimal.ZERO) > 0) {
                creditors.push(new DebtNode(entry.getKey(), entry.getValue()));
            }
        }

        List<Transaction> pendingTxns = txnRepo.findByGroupIdAndStatus(groupId, Transaction.Status.PENDING);
        if (pendingTxns != null && !pendingTxns.isEmpty()) {
            txnRepo.deleteAll(pendingTxns);
        }

        List<Transaction> transactions = new ArrayList<>();
        while (!debtors.isEmpty() && !creditors.isEmpty()) {
            DebtNode debtor = debtors.pop();
            DebtNode creditor = creditors.pop();

            BigDecimal amount = debtor.amount.min(creditor.amount);
            User fromUser = userRepo.findByEmail(debtor.email).orElse(null);
            User toUser = userRepo.findByEmail(creditor.email).orElse(null);

            if (fromUser != null && toUser != null) {
                Transaction txn = new Transaction();
                txn.setGroupId(groupId);
                txn.setFromUser(fromUser);
                txn.setToUser(toUser);
                txn.setAmount(amount);
                txn.setStatus(Transaction.Status.PENDING);
                transactions.add(txn);
                txnRepo.save(txn);
            }

            if (debtor.amount.compareTo(amount) > 0) {
                debtors.push(new DebtNode(debtor.email, debtor.amount.subtract(amount)));
            }
            if (creditor.amount.compareTo(amount) > 0) {
                creditors.push(new DebtNode(creditor.email, creditor.amount.subtract(amount)));
            }
        }

        return txnRepo.findByGroupId(groupId);
    }

    public Map<String, Object> txnByUser(List<Transaction> transactions)
    {
        Map<String, Object> result = new HashMap<>();
        result.put("transactions", transactions != null ? transactions : new ArrayList<>());
        result.put("status", HttpStatus.OK);
        return result;
    }

    @Override
    @Transactional
    public Map<String, Object> settleGroup(String groupId)
    {
        Group g = grpRepo.findById(groupId).orElse(null);
        Map<String, Object> result = new HashMap<>();
        if (g == null) {
            result.put("status", HttpStatus.NOT_FOUND);
            result.put("transactions", new ArrayList<Transaction>());
            return result;
        }

        List<Split> allExpSplits = allSplits(groupId);
        Map<String, BigDecimal> net = computeNet(allExpSplits, groupId);
        List<Transaction> transactions = settle(net, groupId);

        return txnByUser(transactions);
    }

    @Override
    @Transactional
    public Map<String, Object> executeTransaction(String TransactionId, String callerEmail)
    {
        Map<String, Object> result = new HashMap<>();
        Transaction txn = txnRepo.findByTransactionId(TransactionId);
        if(txn == null)
        {
            result.put("status", HttpStatus.NOT_FOUND);
            result.put("message", "Transaction not found");
            return result;
        }
        boolean isReceiver = txn.getToUser() != null && txn.getToUser().getEmail().equalsIgnoreCase(callerEmail);
        if (!isReceiver) {
            result.put("status", HttpStatus.FORBIDDEN);
            result.put("message", "Access denied: Only the payee receiving the payment can confirm this transaction as completed");
            return result;
        }
        if(txn.getStatus() != Transaction.Status.PENDING)
        {
            result.put("status", HttpStatus.BAD_REQUEST);
            result.put("message", "Transaction is already completed");
            return result;
        }

        txn.setStatus(Transaction.Status.COMPLETED);
        txnRepo.save(txn);

        User fromUser = txn.getFromUser();
        User toUser = txn.getToUser();
        BigDecimal amount = txn.getAmount();
        String groupId = txn.getGroupId();

        Balance balanceFrom = balRepo.findByGroupIdAndUser(groupId, fromUser).orElseGet(() -> newZeroBalance(groupId, fromUser));
        Balance balanceTo = balRepo.findByGroupIdAndUser(groupId, toUser).orElseGet(() -> newZeroBalance(groupId, toUser));

        balanceFrom.setTotalSettledOut(balanceFrom.getTotalSettledOut().add(amount));
        balanceTo.setTotalSettledIn(balanceTo.getTotalSettledIn().add(amount));
        balRepo.save(balanceFrom);
        balRepo.save(balanceTo);

        result.put("status", HttpStatus.OK);
        result.put("message", "Transaction executed successfully");
        return result;
    }

    private Balance newZeroBalance(String groupId, User user) {
        Balance b = new Balance();
        b.setGroupId(groupId);
        b.setUser(user);
        b.setTotalPaid(BigDecimal.ZERO);
        b.setTotalOwed(BigDecimal.ZERO);
        b.setTotalSettledOut(BigDecimal.ZERO);
        b.setTotalSettledIn(BigDecimal.ZERO);
        b.setNetBalance(BigDecimal.ZERO);
        return b;
    }




}
