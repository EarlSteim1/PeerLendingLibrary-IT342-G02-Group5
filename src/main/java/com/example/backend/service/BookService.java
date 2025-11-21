package com.example.backend.service;

import com.example.backend.model.Book;
import com.example.backend.repository.BookRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class BookService {
    private final BookRepository repo;

    public BookService(BookRepository repo) {
        this.repo = repo;
    }

    public List<Book> findAll() { return repo.findAll(); }

    public Optional<Book> findById(Long id) { return repo.findById(id); }

    public Book save(Book b) { return repo.save(b); }

    public void deleteById(Long id) { repo.deleteById(id); }
}
