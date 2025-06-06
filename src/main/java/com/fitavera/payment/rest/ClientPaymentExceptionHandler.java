package com.fitavera.payment.rest;

import com.fitavera.common.rest.model.ErrorResponse;
import com.fitavera.payment.service.exception.ClientPaymentNotFoundException;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
public class ClientPaymentExceptionHandler {

    @ExceptionHandler(ClientPaymentNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handlePaymentNotFoundException(ClientPaymentNotFoundException e) {
        return ErrorResponse.of(e.getMessage());
    }
} 