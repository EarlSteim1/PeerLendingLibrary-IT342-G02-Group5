package edu.cit.peerreads.backend.service;

import org.springframework.stereotype.Service;

import edu.cit.peerreads.backend.dto.StatisticsResponse;
import edu.cit.peerreads.backend.entity.BookStatus;
import edu.cit.peerreads.backend.entity.User;
import edu.cit.peerreads.backend.repository.BookRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final BookRepository bookRepository;
    private final UserService userService;

    public StatisticsResponse getStats() {
        User user = userService.getCurrentUser();
        long lent = bookRepository.countByOwnerIdAndStatus(user.getId(), BookStatus.ON_LOAN);
        long borrowed = bookRepository.countByBorrowerEmailIgnoreCaseAndStatus(user.getEmail(), BookStatus.ON_LOAN);
        long pending = bookRepository.countByOwnerIdAndStatus(user.getId(), BookStatus.PENDING);
        long available = bookRepository.countByStatus(BookStatus.AVAILABLE);

        return StatisticsResponse.builder()
                .booksLent(lent)
                .booksBorrowed(borrowed)
                .pendingRequests(pending)
                .availableBooks(available)
                .build();
    }
}

