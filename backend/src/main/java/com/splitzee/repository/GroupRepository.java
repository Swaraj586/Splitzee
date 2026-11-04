package com.splitzee.repository;

import com.splitzee.model.Group;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupRepository extends JpaRepository<Group,String> {
    List<Group> findByMembersEmail(String email);

    @Query("""
    SELECT g FROM Group g 
    JOIN g.members m1 
    JOIN g.members m2 
    WHERE g.isDirect = true 
      AND m1.email = :email1 
      AND m2.email = :email2 
      AND SIZE(g.members) = 2
""")
    Optional<Group> findDirectGroupBetweenUsers(@Param("email1") String userEmail1, @Param("email2") String userEmail2);
}