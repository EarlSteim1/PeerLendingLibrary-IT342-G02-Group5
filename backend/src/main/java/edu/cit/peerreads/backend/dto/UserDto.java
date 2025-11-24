package edu.cit.peerreads.backend.dto;

import java.time.LocalDate;

import edu.cit.peerreads.backend.entity.Role;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class UserDto {
    Long id;
    String fullName;
    String username;
    String email;
    Role role;
    String location;
    String bio;
    String profilePictureUrl;
    LocalDate joinedDate;
}

