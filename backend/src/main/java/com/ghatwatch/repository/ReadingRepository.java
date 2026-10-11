package com.ghatwatch.repository;

import com.ghatwatch.domain.Reading;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReadingRepository extends JpaRepository<Reading, Long> {

    List<Reading> findByGhatId(String ghatId);

    boolean existsByGhatIdAndYearAndFestivalAndPhaseAndParameter(
            String ghatId, int year, String festival, String phase, String parameter);
}
