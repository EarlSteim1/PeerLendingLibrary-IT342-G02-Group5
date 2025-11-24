package edu.cit.peerreads.backend.service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import edu.cit.peerreads.backend.dto.BookRequest;
import edu.cit.peerreads.backend.dto.BookResponse;
import edu.cit.peerreads.backend.dto.BorrowRequest;
import edu.cit.peerreads.backend.entity.Book;
import edu.cit.peerreads.backend.entity.BookStatus;
import edu.cit.peerreads.backend.entity.Role;
import edu.cit.peerreads.backend.entity.User;
import edu.cit.peerreads.backend.exception.BadRequestException;
import edu.cit.peerreads.backend.exception.ForbiddenException;
import edu.cit.peerreads.backend.exception.ResourceNotFoundException;
import edu.cit.peerreads.backend.repository.BookRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BookService {

    private final BookRepository bookRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public List<BookResponse> getPublicBooks(String status, String search) {
        BookStatus resolvedStatus = parseStatus(status);
        String searchTerm = StringUtils.hasText(search) ? search.trim() : null;
        List<Book> books = bookRepository.search(resolvedStatus, searchTerm);
        return books.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BookResponse> getMyBooks() {
        User user = userService.getCurrentUser();
        return bookRepository.findByOwnerId(user.getId()).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public BookResponse create(BookRequest request) {
        User owner = userService.getCurrentUser();
        if (owner.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Only administrators may add books");
        }

        Book book = Book.builder()
                .title(request.getTitle().trim())
                .author(request.getAuthor().trim())
                .isbn(StringUtils.hasText(request.getIsbn()) ? request.getIsbn().trim() : null)
                .imageUrl(request.getImageUrl())
                .owner(owner)
                .dateAdded(LocalDate.now())
                .status(BookStatus.AVAILABLE)
                .build();
        bookRepository.save(book);
        return toResponse(book);
    }

    @Transactional
    public BookResponse update(Long id, BookRequest request) {
        Book book = getOwnedBook(id);
        book.setTitle(request.getTitle().trim());
        book.setAuthor(request.getAuthor().trim());
        book.setIsbn(StringUtils.hasText(request.getIsbn()) ? request.getIsbn().trim() : null);
        book.setImageUrl(request.getImageUrl());
        return toResponse(bookRepository.save(book));
    }

    @Transactional
    public void delete(Long id) {
        Book book = getOwnedBook(id);
        bookRepository.delete(book);
    }

    @Transactional
    public BookResponse requestBorrow(Long id, BorrowRequest request) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found"));

        if (book.getStatus() != BookStatus.AVAILABLE) {
            throw new BadRequestException("Book is not available");
        }

        if (book.getOwner().getEmail().equalsIgnoreCase(request.getBorrowerEmail())) {
            throw new BadRequestException("You already own this book");
        }

        book.setStatus(BookStatus.PENDING);
        book.setBorrowerName(request.getBorrowerName());
        book.setBorrowerEmail(request.getBorrowerEmail().toLowerCase());
        book.setDateRequested(LocalDate.now());
        bookRepository.save(book);
        return toResponse(book);
    }

    @Transactional
    public BookResponse approve(Long id) {
        Book book = getOwnedBook(id);
        if (book.getStatus() != BookStatus.PENDING) {
            throw new BadRequestException("Only pending requests can be approved");
        }
        book.setStatus(BookStatus.ON_LOAN);
        book.setDateBorrowed(LocalDate.now());
        bookRepository.save(book);
        return toResponse(book);
    }

    @Transactional
    public BookResponse decline(Long id) {
        Book book = getOwnedBook(id);
        if (book.getStatus() != BookStatus.PENDING) {
            throw new BadRequestException("Only pending requests can be declined");
        }
        clearBorrower(book);
        book.setStatus(BookStatus.AVAILABLE);
        bookRepository.save(book);
        return toResponse(book);
    }

    @Transactional
    public BookResponse returnBook(Long id) {
        Book book = getOwnedBook(id);
        if (book.getStatus() != BookStatus.ON_LOAN) {
            throw new BadRequestException("Book is not currently on loan");
        }
        clearBorrower(book);
        book.setStatus(BookStatus.AVAILABLE);
        bookRepository.save(book);
        return toResponse(book);
    }

    private void clearBorrower(Book book) {
        book.setBorrowerName(null);
        book.setBorrowerEmail(null);
        book.setDateRequested(null);
        book.setDateBorrowed(null);
    }

    private Book getOwnedBook(Long id) {
        User user = userService.getCurrentUser();
        boolean isAdmin = user.getRole() == Role.ADMIN;
        if (isAdmin) {
            return bookRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Book not found"));
        }
        return bookRepository.findByIdAndOwnerId(id, user.getId())
                .orElseThrow(() -> new ForbiddenException("You do not manage this book"));
    }

    private BookStatus parseStatus(String status) {
        if (!StringUtils.hasText(status)) {
            return null;
        }
        try {
            return BookStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Unknown status: " + status);
        }
    }

    private BookResponse toResponse(Book book) {
        return BookResponse.builder()
                .id(book.getId())
                .title(book.getTitle())
                .author(book.getAuthor())
                .isbn(book.getIsbn())
                .status(book.getStatus())
                .ownerId(book.getOwner() != null ? book.getOwner().getId() : null)
                .ownerName(book.getOwner() != null ? book.getOwner().getFullName() : null)
                .borrowerName(book.getBorrowerName())
                .borrowerEmail(book.getBorrowerEmail())
                .dateRequested(book.getDateRequested())
                .dateBorrowed(book.getDateBorrowed())
                .dateAdded(book.getDateAdded())
                .imageUrl(book.getImageUrl())
                .build();
    }
}

