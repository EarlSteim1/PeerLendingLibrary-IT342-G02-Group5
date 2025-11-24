package edu.cit.peerreads.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import edu.cit.peerreads.backend.dto.ProfileUpdateRequest;
import edu.cit.peerreads.backend.dto.UserDto;
import edu.cit.peerreads.backend.service.UserService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
public class ProfileController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<UserDto> currentProfile() {
        return ResponseEntity.ok(userService.toDto(userService.getCurrentUser()));
    }

    @PutMapping
    public ResponseEntity<UserDto> updateProfile(@Validated @RequestBody ProfileUpdateRequest request) {
        return ResponseEntity.ok(userService.update(request));
    }
}

