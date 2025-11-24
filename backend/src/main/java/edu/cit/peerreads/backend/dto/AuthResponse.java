package edu.cit.peerreads.backend.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AuthResponse {
    String token;
    UserDto user;
}

