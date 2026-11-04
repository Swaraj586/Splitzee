package com.splitzee.repository;

import com.splitzee.model.GroupInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;


@Repository
public interface GroupInvitationRepo extends JpaRepository<GroupInvitation, Long> {

    Optional<GroupInvitation> findByTokenHash(String tokenHash);
    Optional<GroupInvitation> findByGroupIdAndInvitedEmailAndStatus(String groupId, String invitedEmail, GroupInvitation.InvitationStatus status);
    Optional<List<GroupInvitation>> findByGroupIdAndStatus(String groupId, GroupInvitation.InvitationStatus status);
}
