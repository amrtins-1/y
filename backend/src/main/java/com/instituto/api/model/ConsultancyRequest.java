package com.instituto.api.model;

import com.instituto.api.model.enums.ConsultationConflictStatus;
import com.instituto.api.model.enums.TicketStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "consultancy_request")
public class ConsultancyRequest extends AuditableEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private AppUser user;

    @NotBlank
    @Size(max = 120)
    @Column(name = "requester_name", nullable = false)
    private String requesterName;

    @NotBlank
    @Email
    @Size(max = 180)
    @Column(name = "requester_email", nullable = false)
    private String requesterEmail;

    @NotBlank
    @Size(max = 40)
    @Column(name = "requester_phone", nullable = false)
    private String requesterPhone;

    @NotBlank
    @Size(max = 180)
    @Column(name = "farm_name", nullable = false)
    private String farmName;

    @Size(max = 100)
    private String country = "Brasil";

    @Size(max = 100)
    private String state;

    @Size(max = 120)
    private String city;

    @Column(name = "is_manual_location", nullable = false)
    private Boolean isManualLocation = false;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "conflict_status", nullable = false)
    private ConsultationConflictStatus conflictStatus;

    @NotBlank
    @Size(max = 160)
    @Column(name = "involved_group", nullable = false)
    private String involvedGroup;

    @NotBlank
    @Column(name = "case_report", nullable = false, columnDefinition = "text")
    private String caseReport;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketStatus status = TicketStatus.NOVO;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public AppUser getUser() { return user; }
    public void setUser(AppUser user) { this.user = user; }
    public String getRequesterName() { return requesterName; }
    public void setRequesterName(String requesterName) { this.requesterName = requesterName; }
    public String getRequesterEmail() { return requesterEmail; }
    public void setRequesterEmail(String requesterEmail) { this.requesterEmail = requesterEmail; }
    public String getRequesterPhone() { return requesterPhone; }
    public void setRequesterPhone(String requesterPhone) { this.requesterPhone = requesterPhone; }
    public String getFarmName() { return farmName; }
    public void setFarmName(String farmName) { this.farmName = farmName; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public Boolean getIsManualLocation() { return isManualLocation; }
    public void setIsManualLocation(Boolean manualLocation) { isManualLocation = manualLocation; }
    public ConsultationConflictStatus getConflictStatus() { return conflictStatus; }
    public void setConflictStatus(ConsultationConflictStatus conflictStatus) { this.conflictStatus = conflictStatus; }
    public String getInvolvedGroup() { return involvedGroup; }
    public void setInvolvedGroup(String involvedGroup) { this.involvedGroup = involvedGroup; }
    public String getCaseReport() { return caseReport; }
    public void setCaseReport(String caseReport) { this.caseReport = caseReport; }
    public TicketStatus getStatus() { return status; }
    public void setStatus(TicketStatus status) { this.status = status; }
}
