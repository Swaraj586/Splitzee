package com.splitzee.group.service;

import com.splitzee.dto.CreateGroupRequest;

import com.splitzee.model.Group;

import java.util.List;
import java.util.Map;

public interface GroupService {

    String createGroup(CreateGroupRequest request);
    Group createGroupEntity(CreateGroupRequest request);
    List<Group> getAllGroups();
    List<Group> getUserGroups(String email);
    Map<String, Object> showMem(String groupId);
    Map<String, Object> showGroup(String groupId);
    Map<String, Object> updateTitle(String groupId, String title);
    Map<String, Object> addMems(String groupId, List<String> emails);
    Map<String, Object> removeMem(String groupId, String email);
    Map<String, Object> deleteGroup(String groupId);
    Map<String, Object> getUserBalance(String groupId, String email);
    Map<String, Object> inviteMembers(String groupId, String inviterEmail, List<String> emails);
    Map<String, Object> acceptInvitation(String token, String acceptingUserEmail);
    Map<String, Object> getPendingInvitations(String GroupId);
    boolean isUserMemberOfGroup(String groupId, String userEmail);
    Group getOrCreateDirectGroup(String userEmail1, String userEmail2);
    List<Group> getUserDirectGroups(String email);
    Boolean isValidMember(String email);
}
