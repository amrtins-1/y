package com.instituto.api.repository;

import com.instituto.api.model.MembershipPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MembershipPlanRepository extends JpaRepository<MembershipPlan, UUID> {}
