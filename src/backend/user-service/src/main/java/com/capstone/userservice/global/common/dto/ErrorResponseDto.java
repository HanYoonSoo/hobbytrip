package com.capstone.userservice.global.common.dto;

import com.capstone.userservice.global.exception.Code;

public class ErrorResponseDto extends ResponseDto {

    private ErrorResponseDto(Code errorCode) {
        super(false, errorCode.getCode(), errorCode.getMessage());
    }

    private ErrorResponseDto(Code errorCode, Exception e) {
        super(false, errorCode.getCode(), errorCode.getMessage(e));
    }

    private ErrorResponseDto(Code errorCode, String message) {
        super(false, errorCode.getCode(), errorCode.getMessage(message));
    }


    public static ErrorResponseDto of(Code errorCode) {
        return new ErrorResponseDto(errorCode);
    }

    public static ErrorResponseDto of(Code errorCode, Exception e) {
        return new ErrorResponseDto(errorCode, e);
    }

    public static ErrorResponseDto of(Code errorCode, String message) {
        return new ErrorResponseDto(errorCode, message);
    }
}
