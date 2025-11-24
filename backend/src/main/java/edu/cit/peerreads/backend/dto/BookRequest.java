package edu.cit.peerreads.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BookRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String author;

    private String isbn;

    private String imageUrl;
}

