package com.fitavera.common.rest;

import com.fitavera.common.rest.model.ErrorResponse;
import com.fitavera.common.rest.model.ValidationError;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.HttpStatus;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;

import java.util.List;
import java.util.stream.Collectors;

import static java.util.Comparator.comparing;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleValidationException(MethodArgumentNotValidException e) {
        List<ValidationError> validationErrors = e.getBindingResult()
                .getFieldErrors()
                .stream()
                .sorted(comparing(FieldError::getField))
                .map(error -> new ValidationError(
                        error.getField(),
                        error.getDefaultMessage()
                ))
                .collect(Collectors.toList());

        return ErrorResponse.of("Validation failed", validationErrors);
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleHandlerMethodValidationException(HandlerMethodValidationException e) {
        List<ValidationError> validationErrors = e.getParameterValidationResults()
                .stream()
                .sorted(comparing(error ->
                        StringUtils.trimToEmpty(error.getMethodParameter().getParameterName())))
                .map(error -> new ValidationError(
                        error.getMethodParameter().getParameterName(),
                        error.getResolvableErrors().getFirst().getDefaultMessage()
                ))
                .collect(Collectors.toList());

        return ErrorResponse.of("Validation failed", validationErrors);
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponse handleException(Exception e) {
        log.error(e.getMessage(), e);
        return ErrorResponse.of(e.getMessage());
    }
} 