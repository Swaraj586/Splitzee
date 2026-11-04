package com.splitzee.expenses.controller;


import com.splitzee.dto.ExpenseRequest;
import com.splitzee.expenses.service.ExpensesService;
import com.splitzee.expenses.service.SettlementService;
import com.splitzee.repository.GroupRepository;
import com.splitzee.repository.SplitRepository;
import com.splitzee.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
public class ExpensesController {

    @Autowired
    private GroupRepository repo;

    @Autowired
    private SplitRepository splitRepo;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private ExpensesService expService;
    @Autowired
    private SettlementService settlementService;

    @PostMapping(version="1.0", path="/group/{groupId}/add/expenses")
    public ResponseEntity<?> addExpense(@PathVariable("groupId") String groupId, @RequestBody ExpenseRequest req)
    {
        Map<String, Object> response = expService.addExp(groupId,req);
        return ResponseEntity.status((HttpStatus)response.get("status")).body((String)response.get("message"));

    }

    @GetMapping(version="1.0", path="/group/{groupId}/showExpenses")
    public ResponseEntity<?> getExpenses(@PathVariable("groupId") String groupId)
    {
        Map<String, Object> response = expService.getExp(groupId);
        return ResponseEntity.status((HttpStatus)response.get("status")).body(response.get("expenses"));

    }

    @GetMapping(version="1.0", path="/group/{groupId}/{expenseId}/showOneExpenses")
    public ResponseEntity<?> getOneExpense(@PathVariable("groupId") String groupId, @PathVariable("expenseId") String expenseId)
    {
        Map<String, Object> response = expService.getOneExp(groupId, expenseId);
        return ResponseEntity.status((HttpStatus)response.get("status")).body(response.get("body"));
    }

    @GetMapping(version = "1.0", path = "/group/{groupId}/settle")
    public ResponseEntity<?> settleGroup(@PathVariable("groupId") String groupId) {
        Map<String, Object> response = settlementService.settleGroup(groupId);
        return ResponseEntity.status((HttpStatus) response.get("status")).body(response.get("transactions"));
    }

    @PutMapping(version = "1.0", path = "/group/{groupId}/{expenseId}/edit")
    public ResponseEntity<?> editExpense(@PathVariable("groupId") String groupId, @PathVariable("expenseId") String expenseId, @RequestBody ExpenseRequest req) {
        Map<String, Object> response = expService.editExp(groupId, expenseId, req);
        return ResponseEntity.status((HttpStatus) response.get("status")).body(response.get("message"));
    }

    @PostMapping(version = "1.0", path = "/group/{transactionId}/executeTransaction")
    public ResponseEntity<?> executeTransaction(@PathVariable("transactionId") String transactionId, Authentication authentication) {
        String callerEmail = authentication.getName();
        Map<String, Object> response = settlementService.executeTransaction(transactionId, callerEmail);
        return ResponseEntity.status((HttpStatus) response.get("status")).body(response.get("message"));
    }

    @DeleteMapping(version = "1.0", path = "/group/{groupId}/{expenseId}/delete")
    public ResponseEntity<?> deleteExpense(@PathVariable("groupId") String groupId, @PathVariable("expenseId") String expenseId) {
        Map<String, Object> response = expService.deleteExp(groupId, expenseId);
        return ResponseEntity.status((HttpStatus) response.get("status")).body(response.get("message"));
    }

}
