package com.splitzee.repository;


import com.splitzee.model.PendingRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PendingRegiRepo extends JpaRepository<PendingRegistration, Long> {

    Optional<PendingRegistration> findByTokenHash(String tokenHash);
    Optional<PendingRegistration> findByEmail(String email);
    void deleteByEmail(String email);

}
