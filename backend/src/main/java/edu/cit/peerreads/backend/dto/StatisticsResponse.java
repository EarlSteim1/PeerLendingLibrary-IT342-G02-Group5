package edu.cit.peerreads.backend.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class StatisticsResponse {
    long booksLent;
    long booksBorrowed;
    long pendingRequests;
    long availableBooks;
}

