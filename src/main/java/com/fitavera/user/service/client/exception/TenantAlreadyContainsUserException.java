package com.fitavera.user.service.client.exception;

import java.util.UUID;

public class TenantAlreadyContainsUserException extends RuntimeException {

    public TenantAlreadyContainsUserException(UUID tenantId, UUID userId) {
        super("User is already a member of this club");
    }
}
