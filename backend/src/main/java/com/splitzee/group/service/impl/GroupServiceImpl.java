package com.splitzee.group.service.impl;


import com.splitzee.dto.CreateGroupRequest;
import com.splitzee.group.service.GroupService;
import com.splitzee.model.*;
import com.splitzee.repository.BalanceRepository;
import com.splitzee.repository.GroupInvitationRepo;
import com.splitzee.repository.GroupRepository;
import com.splitzee.repository.UserRepository;
import com.splitzee.resend.EmailService;
import com.splitzee.resend.EmailTemplateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.security.MessageDigest;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class GroupServiceImpl implements GroupService {

    @Autowired
    GroupRepository groupRepo;

    @Autowired
    UserRepository userRepo;

    @Autowired
    BalanceRepository balRepo;

    @Autowired
    GroupInvitationRepo invitationRepo;

    @Autowired
    EmailService emailService;

    @Autowired
    EmailTemplateService emailTemplateService;

    @Value("${frontend.url:${FRONTEND_URL:http://localhost:3000}}")
    private String frontendUrl;

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
    public String createGroup(CreateGroupRequest request)
    {
        Group g = createGroupEntity(request);
        return "Group created successfully";
    }

    @Override
    public Group createGroupEntity(CreateGroupRequest request) {
        String title = request.getTitle();
        List<String> emails = request.getEmails();
        List<User> members = new ArrayList<>();
        List<Expenses> expenses = new ArrayList<>();
        if (emails != null) {
            for (String s : emails) {
                User u = userRepo.findByEmail(s).orElse(null);
                if (u != null) {
                    members.add(u);
                }
            }
        }
        Group g = new Group();
        g.setTitle(title);
        g.setMembers(members);
        g.setExpenses(expenses);
        groupRepo.save(g);
        for (User u : members) {
            Balance b = newZeroBalance(g.getGroupId(), u);
            balRepo.save(b);
        }
        return g;
    }

    @Override
    public List<Group> getAllGroups() {
        return groupRepo.findAll();
    }

    @Override
    public List<Group> getUserGroups(String email) {
        if (email == null || email.isBlank()) {
            return Collections.emptyList();
        }
        return groupRepo.findByMembersEmail(email).stream()
                .filter(g -> !g.isDirect())
                .toList();
    }

    @Override
    public List<Group> getUserDirectGroups(String email) {
        return groupRepo.findByMembersEmail(email).stream()
                .filter(Group::isDirect)
                .toList();
    }

    @Override
    public Map<String, Object> showMem(String groupId)
    {
        List<String> members = new ArrayList<>();
        Map<String, Object> response = new HashMap<>();
        Group g = groupRepo.findById(groupId).orElse(null);
        if(g==null)
        {
            response.put("status", HttpStatus.NOT_FOUND);

        }
        if(g!=null) {

            response.put("status", HttpStatus.OK);
            List<User> gmem = g.getMembers();
            for (User u : gmem) {
                members.add(u.getEmail());
            }
        }
        response.put("members",members);

        return response;
    }

    @Override
    public Map<String, Object> showGroup(String groupId)
    {
        Map<String, Object> response = new HashMap<>();
        Group g = groupRepo.findById(groupId).orElse(null);
        if(g==null)
        {
            response.put("status",HttpStatus.NOT_FOUND);
        }
        if(g!=null)
        {
            response.put("status",HttpStatus.OK);
            response.put("group",g);
        }
        return response;
    }

    @Override
    public Map<String, Object> updateTitle(String groupId, String title)
    {
        Group g = groupRepo.findById(groupId).orElse(null);
        Map<String, Object> response = new HashMap<>();
        if(g==null)
        {
            response.put("status",HttpStatus.NOT_FOUND);
            response.put("message","Group does not exists");
            return response;
        }

        g.setTitle(title);
        groupRepo.save(g);
        response.put("status",HttpStatus.OK);
        response.put("message","Added Successfully");
        return response;


    }

    @Override
    public Map<String, Object> addMems(String groupId, List<String> emails)
    {

        Group g = groupRepo.findById(groupId).orElse(null);
        Map<String, Object> response = new HashMap<>();
        if (g.isDirect()) {
            response.put("status", HttpStatus.BAD_REQUEST);
            response.put("message", "Cannot add or remove members in a direct 1-on-1 split");
            return response;
        }
        if(g==null)
        {
            response.put("status", HttpStatus.NOT_FOUND);
            response.put("message", "Group does not exists");
            return response;
        }

            List<User> membs = g.getMembers();
            List<User> newMembs = new ArrayList<>();
            for(String email: emails)
            {
                User u = userRepo.findByEmail(email).orElse(null);
                if(u == null)
                {
                    response.put("status", HttpStatus.NOT_FOUND);
                    response.put("message", "User "+ email+" does not exists");
                    return response;
                }
                boolean alreadyMember = membs.stream()
                        .anyMatch(member -> member.getEmail().equalsIgnoreCase(email));

                if(!alreadyMember)
                {
                    membs.add(u);
                    newMembs.add(u);
                }
            }
            g.setMembers(membs);
            groupRepo.save(g);
            for(User u: newMembs)
            {
                Balance b = newZeroBalance(g.getGroupId(), u);
                balRepo.save(b);
            }
            response.put("status", HttpStatus.OK);
            response.put("message", "Added successfully");
            return response;

    }

    @Override
    public Map<String, Object> removeMem(String groupId, String email) {
        Group g = groupRepo.findById(groupId).orElse(null);
        Map<String, Object> response = new HashMap<>();
        if (g.isDirect()) {
            response.put("status", HttpStatus.BAD_REQUEST);
            response.put("message", "Cannot add or remove members in a direct 1-on-1 split");
            return response;
        }
        if (g == null) {
            response.put("status", HttpStatus.NOT_FOUND);
            response.put("message", "Group does not exists");
            return response;
        }

        boolean isMember = g.getMembers().stream()
                .anyMatch(member -> member.getEmail().equalsIgnoreCase(email));
        if (!isMember) {
            response.put("status", HttpStatus.NOT_FOUND);
            response.put("message", "User " + email + " is not a member of the group");
            return response;
        }
        Balance b = balRepo.findByGroupIdAndUser(groupId, userRepo.findByEmail(email).orElse(null)).orElse(null);
        if (b != null && b.getNetBalance().compareTo(BigDecimal.ZERO) != 0) {
            response.put("status", HttpStatus.BAD_REQUEST);
            response.put("message", "User " + email + " has unsettled balances and cannot be removed");
            return response;
        } else if (b != null) {
            balRepo.delete(b);
            g.getMembers().removeIf(member -> member.getEmail().equalsIgnoreCase(email));
            groupRepo.save(g);
            response.put("status", HttpStatus.OK);
            response.put("message", "Removed successfully");
            return response;
        }
        response.put("status", HttpStatus.Series.SERVER_ERROR);
        response.put("message", "Something went wrong");
        return response;


    }

    @Override
    public Map<String, Object> deleteGroup(String groupId) {
        Group g = groupRepo.findById(groupId).orElse(null);
        Map<String, Object> response = new HashMap<>();
        if (g == null) {
            response.put("status", HttpStatus.NOT_FOUND);
            response.put("message", "Group does not exist");
            return response;
        }

        List<User> members = g.getMembers();
        for (User u : members) {
            Balance b = balRepo.findByGroupIdAndUser(groupId, u).orElse(null);
            if (b != null) {
                balRepo.delete(b);
            }
        }

        groupRepo.delete(g);

        response.put("status", HttpStatus.OK);
        response.put("message", "Group deleted successfully");
        return response;
    }


    @Override
    public Map<String, Object> getUserBalance(String groupId, String email) {
        Map<String, Object> response = new HashMap<>();
        Group g = groupRepo.findById(groupId).orElse(null);
        if (g == null) {
            response.put("status", HttpStatus.NOT_FOUND);
            response.put("message", "Group does not exist");
            response.put("balance", BigDecimal.ZERO);
            return response;
        }

        User user = userRepo.findByEmail(email).orElse(null);
        if (user == null) {
            response.put("status", HttpStatus.NOT_FOUND);
            response.put("message", "User does not exist");
            response.put("balance", BigDecimal.ZERO);
            return response;
        }

        Balance balance = balRepo.findByGroupIdAndUser(groupId, user).orElseGet(() -> {
            Balance b = newZeroBalance(groupId, user);
            return balRepo.save(b);
        });

        response.put("status", HttpStatus.OK);
        response.put("message", "Balance retrieved successfully");
        response.put("balance", balance.getNetBalance() != null ? balance.getNetBalance() : BigDecimal.ZERO);
        return response;
    }

    @Override
    public Map<String, Object> inviteMembers(String groupId, String inviterEmail, List<String> emails) {
        Map<String, Object> response = new HashMap<>();

        Group g = groupRepo.findById(groupId).orElse(null);
        if (g.isDirect()) {
            response.put("status", HttpStatus.BAD_REQUEST);
            response.put("message", "Cannot add or remove members in a direct 1-on-1 split");
            return response;
        }
        if (g == null) {
            response.put("status", HttpStatus.NOT_FOUND);
            response.put("message", "Group does not exist");
            return response;
        }

        List<String> notFoundEmails = new ArrayList<>();
        List<String> alreadyMembers = new ArrayList<>();
        List<String> toInviteEmails = new ArrayList<>();

        for (String email : emails) {
            String trimmedEmail = (email != null) ? email.trim() : "";
            if (trimmedEmail.isEmpty()) {
                continue;
            }
            boolean alreadyMember = g.getMembers().stream()
                    .anyMatch(member -> member.getEmail().equalsIgnoreCase(trimmedEmail));
            if (alreadyMember) {
                alreadyMembers.add(trimmedEmail);
                continue;
            }
            Optional<User> u = userRepo.findByEmail(trimmedEmail);
            if (u.isEmpty()) {
                notFoundEmails.add(trimmedEmail);
            } else {
                toInviteEmails.add(trimmedEmail);
            }
        }

        if (!notFoundEmails.isEmpty()) {
            response.put("status", HttpStatus.NOT_FOUND);
            if (notFoundEmails.size() == 1) {
                response.put("message", "User " + notFoundEmails.get(0) + " does not have a Splitzee account. They must register first before joining a group.");
            } else {
                response.put("message", "The following user(s) do not have a Splitzee account: " + String.join(", ", notFoundEmails) + ". They must register first before joining a group.");
            }
            return response;
        }

        if (toInviteEmails.isEmpty()) {
            response.put("status", HttpStatus.BAD_REQUEST);
            if (!alreadyMembers.isEmpty()) {
                response.put("message", "User(s) " + String.join(", ", alreadyMembers) + " are already members of this group.");
            } else {
                response.put("message", "No valid email addresses provided to invite.");
            }
            return response;
        }

        List<String> invitedEmails = new ArrayList<>();
        String appBaseUrl = (frontendUrl != null && !frontendUrl.isBlank())
                ? frontendUrl.replaceAll("/+$", "")
                : "http://localhost:3000";

        for (String email : toInviteEmails) {
            // Generate token and hash
            byte[] randomBytes = new byte[32];
            new java.security.SecureRandom().nextBytes(randomBytes);
            String rawToken = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
            String tokenHash;
            try {
                tokenHash = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(rawToken.getBytes()));
            } catch (Exception e){
                throw new RuntimeException("Error hashing token: " + e.getMessage());
            }
            com.splitzee.model.GroupInvitation invite = new com.splitzee.model.GroupInvitation();
            invite.setGroupId(groupId);
            invite.setInvitedEmail(email);
            invite.setInvitedByEmail(inviterEmail);
            invite.setTokenHash(tokenHash);
            invite.setExpiresAt(java.time.Instant.now().plus(1, java.time.temporal.ChronoUnit.DAYS));
            invitationRepo.save(invite);

            // Dispatch email via Resend
            String joinUrl = appBaseUrl + "/invitations/accept?token=" + rawToken;
            String html = emailTemplateService.buildInvitationEmail(inviterEmail, g.getTitle(), joinUrl);

            emailService.sendEmail(email, "Invitation to join " + g.getTitle() + " on Splitzee", html);
            invitedEmails.add(email);
        }

        response.put("status", HttpStatus.OK);
        response.put("message", "Invitations sent successfully to: " + String.join(", ", invitedEmails));
        return response;
    }

    @Override
    public Map<String, Object> acceptInvitation(String token, String acceptingUserEmail) {
        Map<String, Object> response = new HashMap<>();
        String tokenHash;
        try {
            tokenHash = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes()));

        } catch (Exception e){
        throw new RuntimeException("Error hashing token: " + e.getMessage());
    }


        GroupInvitation invite = invitationRepo.findByTokenHash(tokenHash).orElse(null);
        if (invite == null || invite.getStatus() != GroupInvitation.InvitationStatus.PENDING || invite.isExpired()) {
            response.put("status", HttpStatus.BAD_REQUEST);
            response.put("message", "Invalid or expired invitation link");
            return response;
        }
        if (!invite.getInvitedEmail().equalsIgnoreCase(acceptingUserEmail)) {
            response.put("status", HttpStatus.FORBIDDEN);
            response.put("message", "This invitation was sent to a different email address.");
            return response;
        }
        Group g = groupRepo.findById(invite.getGroupId()).orElse(null);
        if (g == null) {
            response.put("status", HttpStatus.NOT_FOUND);
            response.put("message", "Group no longer exists");
            return response;
        }

        User user = userRepo.findByEmail(acceptingUserEmail).orElse(null);
        if (user == null) {
            response.put("status", HttpStatus.NOT_FOUND);
            response.put("message", "User not found. Please register or log in first.");
            return response;
        }

        // Add user to the group if not already present
        boolean alreadyMember = g.getMembers().stream()
                .anyMatch(member -> member.getEmail().equalsIgnoreCase(user.getEmail()));

        if (!alreadyMember) {
            g.getMembers().add(user);
            groupRepo.save(g);

            // Provision the initial 0.00 Balance record
            Balance b = newZeroBalance(g.getGroupId(), user);
            balRepo.save(b);
        }

        invite.setStatus(com.splitzee.model.GroupInvitation.InvitationStatus.ACCEPTED);
        invitationRepo.save(invite);

        response.put("status", HttpStatus.OK);
        response.put("message", "Joined group " + g.getTitle() + " successfully");
        return response;
    }

    @Override
    public Map<String, Object> getPendingInvitations(String groupId) {
        List<GroupInvitation> pendingInvites = invitationRepo.findByGroupIdAndStatus(
                groupId,
                GroupInvitation.InvitationStatus.PENDING
        ).orElse(null);
        if(pendingInvites == null || pendingInvites.isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", HttpStatus.OK);
            response.put("pendingInvitations", Collections.emptyList());
            return response;
        }
        List<String> pendingInvitationEmails = pendingInvites.stream()
                .map(GroupInvitation::getInvitedEmail)
                .toList();
        Map<String, Object> response = new HashMap<>();
        response.put("status", HttpStatus.OK);
        response.put("pendingInvitations", pendingInvitationEmails);

        return response;
    }


    @Override
    public boolean isUserMemberOfGroup(String groupId, String userEmail) {
        if (groupId == null || userEmail == null) return false;
        Group g = groupRepo.findById(groupId).orElse(null);
        if (g == null) return false;
        return g.getMembers().stream()
                .anyMatch(u -> u.getEmail().equalsIgnoreCase(userEmail));
    }

    @Override
    public Group getOrCreateDirectGroup(String userEmail1, String userEmail2) {
        return groupRepo.findDirectGroupBetweenUsers(userEmail1, userEmail2)
                .orElseGet(() -> {
                    User u1 = userRepo.findByEmail(userEmail1)
                            .orElseThrow(() -> new IllegalArgumentException("User " + userEmail1 + " not found"));
                    User u2 = userRepo.findByEmail(userEmail2)
                            .orElseThrow(() -> new IllegalArgumentException("User " + userEmail2 + " not found"));

                    Group directGroup = new Group();
                    directGroup.setTitle(u1.getName() + " & " + u2.getName());
                    directGroup.setDirect(true);
                    directGroup.setMembers(List.of(u1, u2));
                    directGroup.setExpenses(new ArrayList<>());
                    groupRepo.save(directGroup);

                    balRepo.save(newZeroBalance(directGroup.getGroupId(), u1)); //
                    balRepo.save(newZeroBalance(directGroup.getGroupId(), u2)); //

                    return directGroup;
                });
    }

    @Override
    public Boolean isValidMember(String email) {
        return userRepo.findByEmail(email).isPresent();
    }



}
