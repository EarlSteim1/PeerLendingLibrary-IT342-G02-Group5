package edu.cit.peerreads.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PromoteToAdminRequest {
    @NotBlank(message = "Email or username is required")
    private String emailOrUsername;
}


