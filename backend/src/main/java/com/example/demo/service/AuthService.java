package com.example.demo.service;

import com.example.demo.dto.AuthRequestDto;
import com.example.demo.dto.AuthResponseDto;
import com.example.demo.entity.SystemUser;
import com.example.demo.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthResponseDto authenticate(AuthRequestDto request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String token = jwtService.generateToken(userDetails.getUsername());

        String role = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .orElse("")
                .replace("ROLE_", "");

        // userDetails is now backed by the real SystemUser entity (see
        // UserDetailsConfig), so we can pull the actual department id
        // instead of always sending back null.
        Long departmentId = null;
        if (userDetails instanceof SystemUser systemUser && systemUser.getDepartment() != null) {
            departmentId = systemUser.getDepartment().getId();
        }

        return new AuthResponseDto(token, userDetails.getUsername(), role, departmentId);
    }
}
