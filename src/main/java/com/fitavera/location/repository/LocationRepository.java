package com.fitavera.location.repository;

import com.fitavera.location.repository.entity.Location;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface LocationRepository extends JpaRepository<Location, UUID> {

    Page<Location> findByTenantId(UUID tenantId, Pageable pageable);

    Optional<Location> findByTenantIdAndId(UUID tenantId, UUID id);
}