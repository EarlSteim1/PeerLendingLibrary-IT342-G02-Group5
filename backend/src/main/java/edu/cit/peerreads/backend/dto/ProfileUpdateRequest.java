package edu.cit.peerreads.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ProfileUpdateRequest {

    @NotBlank
    private String fullName;

    @NotBlank
    @Email
    private String email;

    private String location;
    private String bio;
    private String profilePictureUrl;
}

