package com.instituto.api.model;

import com.instituto.api.model.enums.TicketStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "contact_message")
public class ContactMessage {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private AppUser user;

    @NotBlank
    @Size(max = 120)
    private String name;

    @NotBlank
    @Email
    @Size(max = 180)
    private String email;

    @Size(max = 40)
    private String phone;

    @NotBlank
    @Size(max = 160)
    private String subject;

    @NotBlank
    @Column(columnDefinition = "text")
    private String message;

    @Size(max = 100)
    private String country;

    @Size(max = 100)
    private String state;

    @Size(max = 120)
    private String city;

    @Column(name = "is_manual_location", nullable = false)
    private Boolean isManualLocation = false;

    @Column(name = "newsletter_opt_in", nullable = false)
    private Boolean newsletterOptIn = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketStatus status = TicketStatus.NOVO;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public AppUser getUser() { return user; }
    public void setUser(AppUser user) { this.user = user; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public Boolean getIsManualLocation() { return isManualLocation; }
    public void setIsManualLocation(Boolean manualLocation) { isManualLocation = manualLocation; }
    public Boolean getNewsletterOptIn() { return newsletterOptIn; }
    public void setNewsletterOptIn(Boolean newsletterOptIn) { this.newsletterOptIn = newsletterOptIn; }
    public TicketStatus getStatus() { return status; }
    public void setStatus(TicketStatus status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
