package edu.cit.peerreads.backend.dto;

import java.time.LocalDate;

import edu.cit.peerreads.backend.entity.BookStatus;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class BookResponse {
    Long id;
    String title;
    String author;
    String isbn;
    BookStatus status;
    String ownerName;
    Long ownerId;
    String borrowerName;
    String borrowerEmail;
    LocalDate dateRequested;
    LocalDate dateBorrowed;
    LocalDate dateAdded;
    String imageUrl;
}

