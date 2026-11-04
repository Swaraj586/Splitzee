package com.splitzee.expenses.service;


import com.splitzee.dto.ExpenseRequest;

import java.util.Map;

public interface ExpensesService {

    Map<String, Object> addExp(String groupId, ExpenseRequest req);
    Map<String, Object> getExp(String groupId);
    Map<String, Object> getOneExp(String groupId, String expenseId);
    Map<String, Object> editExp(String groupId, String expenseId, ExpenseRequest req);
    Map<String, Object> deleteExp(String groupId, String expenseId);

}
