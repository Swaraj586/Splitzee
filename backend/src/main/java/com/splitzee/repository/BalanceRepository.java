package com.splitzee.repository;

import com.splitzee.model.Balance;
import com.splitzee.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BalanceRepository extends JpaRepository<Balance, Long> {
    Optional<Balance> findByGroupIdAndUser(String groupId, User user);

    List<Balance> findByGroupId(String groupId);
}
