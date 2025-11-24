package edu.cit.peerreads.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import edu.cit.peerreads.backend.entity.Book;
import edu.cit.peerreads.backend.entity.BookStatus;

public interface BookRepository extends JpaRepository<Book, Long> {

    List<Book> findByOwnerId(Long ownerId);

    List<Book> findByStatus(BookStatus status);

    List<Book> findByOwnerIdAndStatus(Long ownerId, BookStatus status);

    @Query("""
            SELECT b FROM Book b
            WHERE (:status IS NULL OR b.status = :status)
              AND (
                     :term IS NULL
                     OR LOWER(b.title) LIKE LOWER(CONCAT('%', :term, '%'))
                     OR LOWER(b.author) LIKE LOWER(CONCAT('%', :term, '%'))
                     OR LOWER(b.isbn) LIKE LOWER(CONCAT('%', :term, '%'))
                     OR LOWER(b.owner.fullName) LIKE LOWER(CONCAT('%', :term, '%'))
               )
            """)
    List<Book> search(@Param("status") BookStatus status, @Param("term") String term);

    long countByOwnerIdAndStatus(Long ownerId, BookStatus status);

    long countByStatus(BookStatus status);

    long countByBorrowerEmailIgnoreCaseAndStatus(String borrowerEmail, BookStatus status);

    Optional<Book> findByIdAndOwnerId(Long id, Long ownerId);
}

