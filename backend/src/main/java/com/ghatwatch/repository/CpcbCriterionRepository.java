package com.ghatwatch.repository;

import com.ghatwatch.domain.CpcbCriterion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CpcbCriterionRepository extends JpaRepository<CpcbCriterion, Long> {

    List<CpcbCriterion> findByWaterClass(String waterClass);
}
