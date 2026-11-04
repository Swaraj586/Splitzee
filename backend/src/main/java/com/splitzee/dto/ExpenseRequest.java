package com.splitzee.dto;

import java.math.BigDecimal;
import java.util.List;

public class ExpenseRequest {

    private String title;
    private String description;
    private BigDecimal amount;
    private List<String> emails;
    private List<SplitInput> split;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public List<String> getEmails() {
        return emails;
    }

    public void setEmails(List<String> emails) {
        this.emails = emails;
    }

    public List<SplitInput> getSplit() {
        return split;
    }

    public void setSplit(List<SplitInput> split) {
        this.split = split;
    }
}
