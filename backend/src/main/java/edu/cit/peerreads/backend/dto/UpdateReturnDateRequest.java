package edu.cit.peerreads.backend.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateReturnDateRequest {
    @NotNull(message = "Return date is required")
    private LocalDate returnDate;
}


