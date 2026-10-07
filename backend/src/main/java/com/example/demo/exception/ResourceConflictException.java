package com.example.demo.exception;

public class ResourceConflictException extends RuntimeException {
    public ResourceConflictException(String message) {
        super(message);
    }
}
