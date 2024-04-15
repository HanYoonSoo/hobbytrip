package com.capstone.userservice.domain.user.dto;


import com.capstone.userservice.domain.user.entity.User;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserResponseDto {
    private Long userId;
    private String email;
    private String nickname;
    private String name;
    private String birthdate;
    private boolean notificationEnabled;
    private LocalDateTime createdAt;

    public static UserResponseDto of(User user) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        return UserResponseDto.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .name(user.getUsername())
                // Date를 String으로 변환
                .birthdate(user.getBirthdate() != null ? formatter.format(
                        user.getBirthdate().toInstant().atZone(ZoneId.systemDefault()).toLocalDate()) : null)
                .notificationEnabled(user.isNotificationEnabled())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
