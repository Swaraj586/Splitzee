package com.splitzee.constant;

public class ApplicationConstants {

    private ApplicationConstants(){
        throw new AssertionError("Utility class should not be instantiated");
    }

    public static final String JWT_SECRET = "JWT_SECRET_KEY";
    public static final String JWT_SECRET_DEFAULT_VALUE = "fsbvilsbvisisbawuehflweniubsdovinsdvlskdn";
    public static final String JWT_HEADER = "Authorization";
}
