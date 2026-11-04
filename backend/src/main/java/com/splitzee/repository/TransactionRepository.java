package com.splitzee.repository;


import com.splitzee.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, String> {
   Transaction findByTransactionId(String id);
   List<Transaction> findByGroupId(String groupId);

    List<Transaction> findByGroupIdAndStatus(String groupId, Transaction.Status status);
}
