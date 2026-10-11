package com.ghatwatch.repository;

import com.ghatwatch.domain.ActionPlan;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActionPlanRepository extends JpaRepository<ActionPlan, String> {
}
