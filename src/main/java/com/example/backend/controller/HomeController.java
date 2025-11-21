package com.example.backend.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.view.RedirectView;

@Controller
public class HomeController {

    @GetMapping("/")
    public RedirectView root() {
        return new RedirectView("/api/books");
    }

    @GetMapping("/hello")
    @ResponseBody
    public String hello() {
        return "Backend running. API base: /api/books";
    }
}
