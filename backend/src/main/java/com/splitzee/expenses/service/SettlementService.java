package com.splitzee.expenses.service;

import java.util.Map;

public interface SettlementService {

    public Map<String, Object> settleGroup(String groupId);
    Map<String, Object> executeTransaction(String TransactionId, String callerEmail);
}
