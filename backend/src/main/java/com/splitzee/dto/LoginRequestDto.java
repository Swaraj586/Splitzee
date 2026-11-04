package com.splitzee.dto;

public class LoginRequestDto{
    String username;
    String password;

    public LoginRequestDto(){}
    public LoginRequestDto(String username, String password) {
        this.username = username;
        this.password = password;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    @Override
    public String toString() {
        return "LoginRequestDto{" +
                "Username='" + username + '\'' +
                ", Password='" + password + '\'' +
                '}';
    }
}
