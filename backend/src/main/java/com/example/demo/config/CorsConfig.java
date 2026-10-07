package com.example.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;


@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:3000"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}

/*
 * In SecurityConfig.java, add .cors(Customizer.withDefaults()) to the chain so
 * Spring Security picks up the bean above, e.g.:
 *
 *   http
 *       .cors(Customizer.withDefaults())
 *       .csrf(csrf -> csrf.disable())
 *       .authorizeHttpRequests(auth -> auth
 *           .requestMatchers("/login").permitAll()
 *           .anyRequest().authenticated());
 *
 * Without this, every request from the browser (not just POST/PUT) will fail
 * with a CORS error before it even reaches your controllers.
 */
