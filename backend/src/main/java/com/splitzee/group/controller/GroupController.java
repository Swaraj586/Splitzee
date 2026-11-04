package com.splitzee.group.controller;


import com.splitzee.dto.CreateGroupRequest;
import com.splitzee.dto.IndividualDto;
import com.splitzee.group.service.GroupService;
import com.splitzee.model.Group;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class GroupController {

    @Autowired
    private GroupService groupService;

    @PostMapping(version="1.0", path="/group/create")
    public ResponseEntity<Group> create_group(@RequestBody CreateGroupRequest request)
    {
        Group response = groupService.createGroupEntity(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping(version="1.0", path="/group/createIndividual")
    public ResponseEntity<Group> create_individual(@RequestBody IndividualDto individual, Authentication authentication)
    {
        Group response = groupService.getOrCreateDirectGroup(authentication.getName(), individual.email());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping(version="1.0", path="/group/{email}/checkValidMember")
    public ResponseEntity<String> checkValidMember(@PathVariable("email") String email)
    {
        boolean isValidMember = groupService.isValidMember(email);
        if (isValidMember) {
            return ResponseEntity.ok("Valid member");
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Invalid member");
        }
    }

//    @GetMapping(version="1.0", path="/group/all")

//    public ResponseEntity<List<Group>> getAllGroups()
//    {
//        List<Group> groups = groupService.getAllGroups();
//        return ResponseEntity.ok(groups);
//    }

    @GetMapping(version="1.0", path="/group/getUser/group")
    public ResponseEntity<List<Group>> getUserGroups(Authentication authentication)
    {
        String email = authentication.getName();
        List<Group> groups = groupService.getUserGroups(email);
        return ResponseEntity.ok(groups);
    }

    @GetMapping(version="1.0", path="/group/getUser/individual")
    public ResponseEntity<List<Group>> getIndividuals(Authentication authentication)
    {
        String email = authentication.getName();
        List<Group> groups = groupService.getUserDirectGroups(email);
        return ResponseEntity.ok(groups);
    }

    @GetMapping(version="1.0", path="/group/{groupId}/getmembers")
    public ResponseEntity<?> getMembers(@PathVariable("groupId") String groupId, Authentication authentication)
    {
        String callerEmail = authentication.getName();
        if (!groupService.isUserMemberOfGroup(groupId, callerEmail)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied: You are not a member of this group");
        }
        Map<String, Object> response = groupService.showMem(groupId);
        List<String> members = (List<String>) response.get("members");

        return ResponseEntity.status((HttpStatus)response.get("status")).body(members);
    }

    @PostMapping(version="1.0", path="/group/{groupId}/addmembers")
    public ResponseEntity addMembers(@PathVariable("groupId") String groupId, @RequestBody List<String> emails, Authentication authentication)
    {
        String callerEmail = authentication.getName();
        if (!groupService.isUserMemberOfGroup(groupId, callerEmail)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied: You are not a member of this group");
        }
        Map<String, Object> response = groupService.addMems(groupId, emails);
        return ResponseEntity.status((HttpStatus)response.get("status")).body((String) response.get("message"));
    }

    @PatchMapping(version="1.0", path = "/group/{groupId}/updateGroupTitle")
    public ResponseEntity<String> updateGroupTitle(@PathVariable("groupId") String groupId, @RequestBody String title, Authentication authentication)
    {
        String callerEmail = authentication.getName();
        if (!groupService.isUserMemberOfGroup(groupId, callerEmail)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied: You are not a member of this group");
        }
        Map<String, Object> response = groupService.updateTitle(groupId, title);
        return ResponseEntity.status((HttpStatus)response.get("status")).body((String) response.get("message"));
    }

    @GetMapping(version = "1.0", path = "/group/{groupId}/showGroup")
    public ResponseEntity<?> showGroup(@PathVariable("groupId") String groupId, Authentication authentication)
    {
        String callerEmail = authentication.getName();
        if (!groupService.isUserMemberOfGroup(groupId, callerEmail)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied: You are not a member of this group");
        }
        Map<String, Object> response = groupService.showGroup(groupId);
        Group g = (Group) response.get("group");

        return ResponseEntity.status((HttpStatus)response.get("status")).body(g);
    }

    @DeleteMapping(version = "1.0", path = "/group/{groupId}/removeMember")
    public ResponseEntity<String> removeMember(@PathVariable("groupId") String groupId, @RequestBody String email, Authentication authentication)
    {
        String callerEmail = authentication.getName();
        if (!groupService.isUserMemberOfGroup(groupId, callerEmail)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied: You are not a member of this group");
        }
        Map<String, Object> response = groupService.removeMem(groupId, email);
        return ResponseEntity.status((HttpStatus)response.get("status")).body((String) response.get("message"));
    }

    @DeleteMapping(version = "1.0", path = "/group/{groupId}/deleteGroup")
    public ResponseEntity<String> deleteGroup(@PathVariable("groupId") String groupId, Authentication authentication)
    {
        String callerEmail = authentication.getName();
        if (!groupService.isUserMemberOfGroup(groupId, callerEmail)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied: You are not a member of this group");
        }
        Map<String, Object> response = groupService.deleteGroup(groupId);
        return ResponseEntity.status((HttpStatus)response.get("status")).body((String) response.get("message"));
    }

    @GetMapping(version = "1.0", path = "/group/{groupId}/getUserBalance")
    public ResponseEntity<String> getUserBalance(@PathVariable("groupId") String groupId, @RequestParam String email, Authentication authentication) {
        String callerEmail = authentication.getName();
        if (!groupService.isUserMemberOfGroup(groupId, callerEmail)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied: You are not a member of this group");
        }
        Map<String, Object> response = groupService.getUserBalance(groupId, email);
        return ResponseEntity.status((HttpStatus) response.get("status")).body(String.valueOf(response.get("balance")));
    }

    @PostMapping(version = "1.0", path = "/group/{groupId}/invite")
    public ResponseEntity<String> inviteMembers(
            @PathVariable("groupId") String groupId,
            @RequestBody List<String> emails,
            java.security.Principal principal, Authentication authentication) {
        String callerEmail = authentication.getName();
        if (!groupService.isUserMemberOfGroup(groupId, callerEmail)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied: You are not a member of this group");
        }
        String inviterEmail = (principal != null) ? principal.getName() : "A group member";
        Map<String, Object> response = groupService.inviteMembers(groupId, inviterEmail, emails);
        return ResponseEntity.status((HttpStatus) response.get("status")).body((String) response.get("message"));
    }

    @PostMapping(version = "1.0", path = "/group/invitations/accept")
    public ResponseEntity<String> acceptInvite(
            @RequestParam("token") String token,
            java.security.Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("You must be logged in to accept an invitation.");
        }
        Map<String, Object> response = groupService.acceptInvitation(token, principal.getName());
        return ResponseEntity.status((HttpStatus) response.get("status")).body((String) response.get("message"));
    }

    @GetMapping(version = "1.0", path = "/group/{groupId}/invitations/pending")
    public ResponseEntity<?> getPendingInvitations(@PathVariable("groupId") String groupId, Authentication authentication) {
        String callerEmail = authentication.getName();
        if (!groupService.isUserMemberOfGroup(groupId, callerEmail)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied: You are not a member of this group");
        }
        Map<String, Object> response = groupService.getPendingInvitations(groupId);
        List<String> pendingInvitations =(List<String>) response.get("pendingInvitations");
        return ResponseEntity.status((HttpStatus) response.get("status")).body(pendingInvitations);
    }




}
