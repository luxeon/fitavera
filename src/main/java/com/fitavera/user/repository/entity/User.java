package com.fitavera.user.repository.entity;

import com.fitavera.tenant.repository.entity.Tenant;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Data
@Entity
@Table(name = "users")
@ToString(exclude = {"roles", "tenants"})
@EqualsAndHashCode(exclude = {"roles", "tenants"})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private UUID id;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private Locale locale;

    @Column
    private String password;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "email_confirmed", nullable = false)
    private boolean emailConfirmed;

    @Column(name = "confirmation_token")
    private String confirmationToken;

    @Column(name = "confirmation_token_expires_at")
    private OffsetDateTime confirmationTokenExpiresAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false,
            updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
            name = "User_Roles",
            joinColumns = {@JoinColumn(name = "user_id")},
            inverseJoinColumns = {@JoinColumn(name = "role_id")}
    )
    private Set<UserRole> roles = new HashSet<>();

    @ManyToMany(mappedBy = "users")
    private Set<Tenant> tenants = new HashSet<>();

}