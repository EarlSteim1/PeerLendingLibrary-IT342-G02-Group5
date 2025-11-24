package edu.cit.peerreads.backend.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import edu.cit.peerreads.backend.dto.ProfileUpdateRequest;
import edu.cit.peerreads.backend.dto.UserDto;
import edu.cit.peerreads.backend.entity.User;
import edu.cit.peerreads.backend.exception.BadRequestException;
import edu.cit.peerreads.backend.exception.ResourceNotFoundException;
import edu.cit.peerreads.backend.repository.UserRepository;
import edu.cit.peerreads.backend.security.UserPrincipal;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new BadRequestException("No authenticated user found");
        }
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public UserDto toDto(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return toDto(user);
    }

    public UserDto toDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .location(user.getLocation())
                .bio(user.getBio())
                .profilePictureUrl(user.getProfilePictureUrl())
                .joinedDate(user.getJoinedDate())
                .build();
    }

    @Transactional
    public UserDto update(ProfileUpdateRequest request) {
        User user = getCurrentUser();

        if (!user.getEmail().equalsIgnoreCase(request.getEmail())
                && userRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new BadRequestException("Email already in use");
        }

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail().toLowerCase());
        user.setLocation(request.getLocation());
        user.setBio(request.getBio());
        user.setProfilePictureUrl(request.getProfilePictureUrl());

        userRepository.save(user);
        return toDto(user);
    }
}

