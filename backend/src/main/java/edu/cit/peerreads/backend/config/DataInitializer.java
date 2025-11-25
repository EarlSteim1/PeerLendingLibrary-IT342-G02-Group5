package edu.cit.peerreads.backend.config;

import java.time.LocalDate;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import edu.cit.peerreads.backend.entity.Book;
import edu.cit.peerreads.backend.entity.BookStatus;
import edu.cit.peerreads.backend.entity.Role;
import edu.cit.peerreads.backend.entity.User;
import edu.cit.peerreads.backend.repository.BookRepository;
import edu.cit.peerreads.backend.repository.UserRepository;

@Configuration
public class DataInitializer {

    private static final String DEFAULT_ADMIN_EMAIL = "admin@peerreads.local";

    @Bean
    CommandLineRunner seedAdmin(UserRepository userRepository, BookRepository bookRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.findByEmailIgnoreCase(DEFAULT_ADMIN_EMAIL).isPresent()) {
                return;
            }

            User admin = User.builder()
                    .fullName("Peer Reads Admin")
                    .email(DEFAULT_ADMIN_EMAIL)
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .role(Role.ADMIN)
                    .location("Philippines")
                    .bio("System administrator")
                    .profilePictureUrl("https://via.placeholder.com/120/222/ffffff?text=PR")
                    .joinedDate(LocalDate.now())
                    .build();
            userRepository.save(admin);

            List<Book> starterBooks = List.of(
                    Book.builder()
                            .title("Atomic Habits")
                            .author("James Clear")
                            .isbn("9780735211292")
                            .status(BookStatus.AVAILABLE)
                            .owner(admin)
                            .dateAdded(LocalDate.now())
                            .imageUrl("https://covers.openlibrary.org/b/id/10523342-L.jpg")
                            .build(),
                    Book.builder()
                            .title("Deep Work")
                            .author("Cal Newport")
                            .isbn("9781455586691")
                            .status(BookStatus.AVAILABLE)
                            .owner(admin)
                            .dateAdded(LocalDate.now())
                            .imageUrl("https://covers.openlibrary.org/b/id/8231856-L.jpg")
                            .build());

            bookRepository.saveAll(starterBooks);
        };
    }
}

