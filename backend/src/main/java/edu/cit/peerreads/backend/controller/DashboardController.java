package edu.cit.peerreads.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import edu.cit.peerreads.backend.dto.StatisticsResponse;
import edu.cit.peerreads.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<StatisticsResponse> getStats() {
        return ResponseEntity.ok(dashboardService.getStats());
    }
}

