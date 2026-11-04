package com.splitzee.expenses.service.impl;

import com.splitzee.dto.ExpenseRequest;
import com.splitzee.dto.SplitInput;
import com.splitzee.expenses.service.ExpensesService;
import com.splitzee.model.*;
import com.splitzee.repository.BalanceRepository;
import com.splitzee.repository.GroupRepository;
import com.splitzee.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


@Service
public class ExpensesServiceImpl implements ExpensesService {

    @Autowired
    GroupRepository groupRepo;

    @Autowired
    UserRepository userRepo;

    @Autowired
    BalanceRepository balRepo;


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


    @Override
    @Transactional
    public Map<String, Object> addExp(String groupId, ExpenseRequest req)
    {
        Map<String, Object> response = new HashMap<>();
        Group g = groupRepo.findById(groupId).orElse(null);
        if (g == null) {
            response.put("status", HttpStatus.NOT_FOUND);
            response.put("message", "Group not found");
            return response;
        }
        // 1. Amount validation
        if (req.getAmount() == null || req.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            response.put("status", HttpStatus.BAD_REQUEST);
            response.put("message", "Expense amount must be greater than zero");
            return response;
        }
        if (req.getSplit() == null || req.getSplit().isEmpty()) {
            response.put("status", HttpStatus.BAD_REQUEST);
            response.put("message", "Expense must have at least one split");
            return response;
        }
        List<Expenses> expenses = g.getExpenses();
        Expenses enew = new Expenses();
        enew.setGroup(g);
        enew.setTitle(req.getTitle());
        enew.setDescription(req.getDescription());
        enew.setAmount(req.getAmount());
        BigDecimal totalPaid = BigDecimal.ZERO;
        BigDecimal totalOwed = BigDecimal.ZERO;
        List<Split> splitEntities = new ArrayList<>();
        for (SplitInput s : req.getSplit()) {
            // 2. Non-negative checks
            if (s.getPaidAmount() == null || s.getPaidAmount().compareTo(BigDecimal.ZERO) < 0 ||
                    s.getOwedAmount() == null || s.getOwedAmount().compareTo(BigDecimal.ZERO) < 0) {
                response.put("status", HttpStatus.BAD_REQUEST);
                response.put("message", "Split amounts cannot be negative");
                return response;
            }
            // 3. Verify user exists and is a member of this group
            User u = userRepo.findByEmail(s.getUserEmail()).orElse(null);
            if (u == null) {
                response.put("status", HttpStatus.BAD_REQUEST);
                response.put("message", "User " + s.getUserEmail() + " not found");
                return response;
            }
            boolean isMember = g.getMembers().stream()
                    .anyMatch(member -> member.getEmail().equalsIgnoreCase(u.getEmail()));
            if (!isMember) {
                response.put("status", HttpStatus.BAD_REQUEST);
                response.put("message", "User " + s.getUserEmail() + " is not a member of this group");
                return response;
            }
            Split split = new Split();
            split.setExpense(enew);
            split.setUser(u);
            split.setPaidAmount(s.getPaidAmount());
            split.setOwedAmount(s.getOwedAmount());
            splitEntities.add(split);
            totalPaid = totalPaid.add(s.getPaidAmount());
            totalOwed = totalOwed.add(s.getOwedAmount());
        }
        // 4. Exact sum validation (no 0.05 tolerance drift)
        if (totalPaid.compareTo(req.getAmount()) != 0 || totalOwed.compareTo(req.getAmount()) != 0) {
            response.put("status", HttpStatus.BAD_REQUEST);
            response.put("message", "Total paid and total owed must exactly match the expense amount");
            return response;
        }
        enew.setSplits(splitEntities);
        expenses.add(enew);
        g.setExpenses(expenses);
        groupRepo.save(g);
        for (Split s : splitEntities) {
            User u = s.getUser();
            Balance b = balRepo.findByGroupIdAndUser(groupId, u).orElseGet(() -> newZeroBalance(groupId, u));
            b.setTotalPaid(b.getTotalPaid().add(s.getPaidAmount()));
            b.setTotalOwed(b.getTotalOwed().add(s.getOwedAmount()));
            balRepo.save(b);
        }
        response.put("status", HttpStatus.CREATED);
        response.put("message", "Added Successfully");
        return response;
    }

    @Override
    public Map<String, Object> getExp(String groupId)
    {
        Group g = groupRepo.findById(groupId).orElse(null);
        Map<String, Object> response = new HashMap<>();
        if(g != null)
        {
            List<Expenses> exp = g.getExpenses();
            response.put("status", HttpStatus.OK);
            response.put("expenses", exp);
            return response;
        }
        response.put("status", HttpStatus.NOT_FOUND);
        response.put("expenses", "Not found");
        return response;
    }

    @Override
    public Map<String, Object> getOneExp(String groupId, String expenseId)
    {
        Group g = groupRepo.findById(groupId).orElse(null);
        Map<String, Object> response = new HashMap<>();
        if(g != null)
        {
            List<Expenses> exp = g.getExpenses();
            for(Expenses e: exp)
            {
                if(expenseId.equals(e.getExpenseId()))
                {
                    response.put("status", HttpStatus.OK);
                    response.put("body",(Map.of("message", "Expense Found", "expense", e)));
                    return response;
                }
            }
            response.put("status", HttpStatus.NOT_FOUND);
            response.put("body", (Map.of("message", "Expense Not Found")));
            return response;
        }
        response.put("status", HttpStatus.NOT_FOUND);
        response.put("body", (Map.of("message", "Something went wrong")));
        return response;
    }

    @Override
    @Transactional
    public Map<String, Object> editExp(String groupId, String expenseId, ExpenseRequest req) {
        Group g = groupRepo.findById(groupId).orElse(null);
        Map<String, Object> response = new HashMap<>();
        if (g == null) {
            response.put("status", HttpStatus.NOT_FOUND);
            response.put("message", "Group Not Found");
            return response;
        }
        // Amount validation
        if (req.getAmount() == null || req.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            response.put("status", HttpStatus.BAD_REQUEST);
            response.put("message", "Expense amount must be greater than zero");
            return response;
        }
        if (req.getSplit() == null || req.getSplit().isEmpty()) {
            response.put("status", HttpStatus.BAD_REQUEST);
            response.put("message", "Expense must have at least one split");
            return response;
        }
        List<Expenses> exp = g.getExpenses();
        for (Expenses e : exp) {
            if (expenseId.equals(e.getExpenseId())) {
                // Validate new splits first before applying changes
                BigDecimal totalPaid = BigDecimal.ZERO;
                BigDecimal totalOwed = BigDecimal.ZERO;
                List<Split> newSplits = new ArrayList<>();
                for (SplitInput s : req.getSplit()) {
                    if (s.getPaidAmount() == null || s.getPaidAmount().compareTo(BigDecimal.ZERO) < 0 ||
                            s.getOwedAmount() == null || s.getOwedAmount().compareTo(BigDecimal.ZERO) < 0) {
                        response.put("status", HttpStatus.BAD_REQUEST);
                        response.put("message", "Split amounts cannot be negative");
                        return response;
                    }
                    User u = userRepo.findByEmail(s.getUserEmail()).orElse(null);
                    if (u == null) {
                        response.put("status", HttpStatus.BAD_REQUEST);
                        response.put("message", "User " + s.getUserEmail() + " not found");
                        return response;
                    }
                    boolean isMember = g.getMembers().stream()
                            .anyMatch(member -> member.getEmail().equalsIgnoreCase(u.getEmail()));
                    if (!isMember) {
                        response.put("status", HttpStatus.BAD_REQUEST);
                        response.put("message", "User " + s.getUserEmail() + " is not a member of this group");
                        return response;
                    }
                    Split split = new Split();
                    split.setExpense(e);
                    split.setUser(u);
                    split.setPaidAmount(s.getPaidAmount());
                    split.setOwedAmount(s.getOwedAmount());
                    newSplits.add(split);
                    totalPaid = totalPaid.add(s.getPaidAmount());
                    totalOwed = totalOwed.add(s.getOwedAmount());
                }
                if (totalPaid.compareTo(req.getAmount()) != 0 || totalOwed.compareTo(req.getAmount()) != 0) {
                    response.put("status", HttpStatus.BAD_REQUEST);
                    response.put("message", "Total paid and total owed must exactly match the expense amount");
                    return response;
                }
                // Reverse old balances
                for (Split oldSplit : e.getSplits()) {
                    Balance b = balRepo.findByGroupIdAndUser(groupId, oldSplit.getUser()).orElse(null);
                    if (b != null) {
                        b.setTotalPaid(b.getTotalPaid().subtract(oldSplit.getPaidAmount()));
                        b.setTotalOwed(b.getTotalOwed().subtract(oldSplit.getOwedAmount()));
                        balRepo.save(b);
                    }
                }
                // Update expense details
                e.setTitle(req.getTitle());
                e.setDescription(req.getDescription());
                e.setAmount(req.getAmount());
                e.getSplits().clear();
                e.getSplits().addAll(newSplits);
                // Apply new balances
                for (Split newSplit : newSplits) {
                    Balance b = balRepo.findByGroupIdAndUser(groupId, newSplit.getUser())
                            .orElseGet(() -> newZeroBalance(groupId, newSplit.getUser()));
                    b.setTotalPaid(b.getTotalPaid().add(newSplit.getPaidAmount()));
                    b.setTotalOwed(b.getTotalOwed().add(newSplit.getOwedAmount()));
                    balRepo.save(b);
                }
                groupRepo.save(g);
                response.put("status", HttpStatus.OK);
                response.put("message", "Expense Updated Successfully");
                return response;
            }
        }
        response.put("status", HttpStatus.NOT_FOUND);
        response.put("message", "Expense Not Found");
        return response;

    }

    @Override
    @Transactional
    public Map<String, Object> deleteExp(String groupId, String expenseId) {
        Group g = groupRepo.findById(groupId).orElse(null);
        Map<String, Object> response = new HashMap<>();
        if (g != null) {
            List<Expenses> exp = g.getExpenses();
            for (Expenses e : exp) {
                if (expenseId.equals(e.getExpenseId())) {
                    for(Split oldSplit: e.getSplits()) {
                        Balance b = balRepo.findByGroupIdAndUser(groupId, oldSplit.getUser()).orElse(null);
                        if (b != null) {
                            b.setTotalPaid(b.getTotalPaid().subtract(oldSplit.getPaidAmount()));
                            b.setTotalOwed(b.getTotalOwed().subtract(oldSplit.getOwedAmount()));
                            balRepo.save(b);
                        }
                    }
                    exp.remove(e);
                    groupRepo.save(g);

                    response.put("status", HttpStatus.NO_CONTENT);
                    response.put("message", "Expense Deleted Successfully");
                    return response;
                }
            }
            response.put("status", HttpStatus.NOT_FOUND);
            response.put("message", "Expense Not Found");
            return response;
        }
        response.put("status", HttpStatus.NOT_FOUND);
        response.put("message", "Something went wrong");
        return response;
    }
}
