package com.ghatwatch.repository;

import com.ghatwatch.domain.FieldReading;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FieldReadingRepository extends JpaRepository<FieldReading, Long> {

    Optional<FieldReading> findByGhatIdAndYearAndFestivalAndPhaseAndParameter(
            String ghatId, int year, String festival, String phase, String parameter);
}
