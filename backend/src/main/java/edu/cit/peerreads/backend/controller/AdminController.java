package edu.cit.peerreads.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import edu.cit.peerreads.backend.dto.PromoteToAdminRequest;
import edu.cit.peerreads.backend.dto.UserDto;
import edu.cit.peerreads.backend.exception.ForbiddenException;
import edu.cit.peerreads.backend.service.UserService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;

    @PostMapping("/promote")
    public ResponseEntity<UserDto> promoteToAdmin(@Validated @RequestBody PromoteToAdminRequest request) {
        // Allow if no admins exist (for initial setup) OR if current user is admin
        if (!userService.hasAnyAdmin() || userService.isCurrentUserAdmin()) {
            UserDto promotedUser = userService.promoteToAdmin(request.getEmailOrUsername());
            return ResponseEntity.ok(promotedUser);
        }
        throw new ForbiddenException("Only administrators can promote users to admin");
    }
}
