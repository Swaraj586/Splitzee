package com.splitzee.dto;


public class LoginResponseDto {

    String message;
    UserDto user;
    String jwtToken;


    public LoginResponseDto(String message, UserDto user, String jwtToken) {
        this.message = message;
        this.user = user;
        this.jwtToken = jwtToken;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public UserDto getUser() {
        return user;
    }

    public void setUser(UserDto user) {
        this.user = user;
    }

    public String getJwtToken() {
        return jwtToken;
    }

    public void setJwtToken(String jwtToken) {
        this.jwtToken = jwtToken;
    }

    @Override
    public String toString() {
        return "LoginResponseDto{" +
                "message='" + message + '\'' +
                ", user=" + user +
                ", jwtToken='" + jwtToken + '\'' +
                '}';
    }
}
