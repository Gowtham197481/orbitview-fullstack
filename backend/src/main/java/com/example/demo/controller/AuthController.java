package com.example.demo.controller;

import com.example.demo.dto.AuthRequestDto;
import com.example.demo.dto.AuthResponseDto;
import com.example.demo.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(@Valid @RequestBody AuthRequestDto request) {
        return ResponseEntity.ok(authService.authenticate(request));
    }
}
