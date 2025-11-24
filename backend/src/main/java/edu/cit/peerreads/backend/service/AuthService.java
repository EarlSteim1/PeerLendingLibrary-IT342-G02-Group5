package edu.cit.peerreads.backend.service;

import java.time.LocalDate;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import edu.cit.peerreads.backend.dto.AuthResponse;
import edu.cit.peerreads.backend.dto.LoginRequest;
import edu.cit.peerreads.backend.dto.RegisterRequest;
import edu.cit.peerreads.backend.dto.UserDto;
import edu.cit.peerreads.backend.entity.Role;
import edu.cit.peerreads.backend.entity.User;
import edu.cit.peerreads.backend.exception.BadRequestException;
import edu.cit.peerreads.backend.repository.UserRepository;
import edu.cit.peerreads.backend.security.JwtTokenProvider;
import edu.cit.peerreads.backend.security.UserPrincipal;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserService userService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new BadRequestException("Email is already registered");
        }

        String candidateUsername = buildUsername(request.getEmail());
        if (userRepository.existsByUsernameIgnoreCase(candidateUsername)) {
            candidateUsername = candidateUsername + System.currentTimeMillis();
        }

        Role role = userRepository.count() == 0 ? Role.ADMIN : Role.USER;

        User user = User.builder()
                .fullName(request.getFullName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .username(candidateUsername.toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .joinedDate(LocalDate.now())
                .location("Philippines")
                .bio("Welcome to Peer Reads!")
                .profilePictureUrl("https://via.placeholder.com/120/ADD8E6/000000?text=👤")
                .build();
        userRepository.save(user);

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getEmail(), request.getPassword()));
        return buildAuthResponse(authentication);
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsernameOrEmail(), request.getPassword()));
        return buildAuthResponse(authentication);
    }

    private AuthResponse buildAuthResponse(Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        String token = tokenProvider.generateToken(principal);
        UserDto userDto = userService.toDto(principal.getId());
        return AuthResponse.builder()
                .token(token)
                .user(userDto)
                .build();
    }

    private String buildUsername(String email) {
        String[] parts = email.split("@");
        return parts[0].replaceAll("[^A-Za-z0-9]", "").toLowerCase();
    }
}

