package com.splitzee.dto;

import java.util.List;

public class CreateGroupRequest {

    String title;
    List<String> emails;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public List<String> getEmails() {
        return emails;
    }

    public void setEmails(List<String> emails) {
        this.emails = emails;
    }

    @Override
    public String toString() {
        return "CreateGroupRequest{" +
                "title='" + title + '\'' +
                ", emails=" + emails +
                '}';
    }
}
