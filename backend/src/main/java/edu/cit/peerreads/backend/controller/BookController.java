package edu.cit.peerreads.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import edu.cit.peerreads.backend.dto.BookRequest;
import edu.cit.peerreads.backend.dto.BookResponse;
import edu.cit.peerreads.backend.dto.BorrowRequest;
import edu.cit.peerreads.backend.service.BookService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
public class BookController {

    private final BookService bookService;

    @GetMapping
    public ResponseEntity<List<BookResponse>> listPublicBooks(
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "q", required = false) String search) {
        return ResponseEntity.ok(bookService.getPublicBooks(status, search));
    }

    @GetMapping("/mine")
    public ResponseEntity<List<BookResponse>> myBooks() {
        return ResponseEntity.ok(bookService.getMyBooks());
    }

    @PostMapping
    public ResponseEntity<BookResponse> create(@Validated @RequestBody BookRequest request) {
        return new ResponseEntity<>(bookService.create(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BookResponse> update(@PathVariable Long id, @Validated @RequestBody BookRequest request) {
        return ResponseEntity.ok(bookService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        bookService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/request")
    public ResponseEntity<BookResponse> requestBorrow(@PathVariable Long id,
            @Validated @RequestBody BorrowRequest request) {
        return ResponseEntity.ok(bookService.requestBorrow(id, request));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<BookResponse> approve(@PathVariable Long id) {
        return ResponseEntity.ok(bookService.approve(id));
    }

    @PostMapping("/{id}/decline")
    public ResponseEntity<BookResponse> decline(@PathVariable Long id) {
        return ResponseEntity.ok(bookService.decline(id));
    }

    @PostMapping("/{id}/return")
    public ResponseEntity<BookResponse> returnBook(@PathVariable Long id) {
        return ResponseEntity.ok(bookService.returnBook(id));
    }
}

