package edu.cit.peerreads.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BorrowRequest {

    @NotBlank
    private String borrowerName;

    @NotBlank
    @Email
    private String borrowerEmail;
}

