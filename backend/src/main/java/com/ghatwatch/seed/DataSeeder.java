package com.ghatwatch.seed;

import com.ghatwatch.domain.CpcbCriterion;
import com.ghatwatch.domain.Ghat;
import com.ghatwatch.domain.Reading;
import com.ghatwatch.repository.CpcbCriterionRepository;
import com.ghatwatch.repository.GhatRepository;
import com.ghatwatch.repository.ReadingRepository;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Loads the data pack into MySQL on first start. Tables that already hold rows are left alone,
 * so the officer's saved action plan survives restarts.
 */
@Component
public class DataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    static final String READINGS_CSV = "data/bhopal_ghats_2023_2025.csv";
    static final String CRITERIA_CSV = "data/cpcb_water_quality_criteria.csv";

    private final GhatRepository ghats;
    private final ReadingRepository readings;
    private final CpcbCriterionRepository criteria;

    public DataSeeder(GhatRepository ghats, ReadingRepository readings, CpcbCriterionRepository criteria) {
        this.ghats = ghats;
        this.readings = readings;
        this.criteria = criteria;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws IOException {
        if (ghats.count() == 0) {
            ghats.saveAll(GhatCatalog.GHATS);
            log.info("Seeded {} ghats", GhatCatalog.GHATS.size());
        }
        if (criteria.count() == 0) {
            List<CpcbCriterion> rows = new ArrayList<>();
            for (CSVRecord r : parse(CRITERIA_CSV)) {
                rows.add(new CpcbCriterion(r.get("class"), r.get("designated_best_use"), r.get("parameter"),
                        r.get("limit_type"), r.get("limit"), blankToNull(r.get("unit"))));
            }
            criteria.saveAll(rows);
            log.info("Seeded {} CPCB criteria", rows.size());
        }
        if (readings.count() == 0) {
            Map<String, String> idByName = ghats.findAll().stream()
                    .collect(Collectors.toMap(Ghat::getName, Ghat::getId, (a, b) -> a));
            List<Reading> rows = new ArrayList<>();
            for (CSVRecord r : parse(READINGS_CSV)) {
                String ghatId = idByName.get(r.get("site"));
                if (ghatId == null) {
                    throw new IllegalStateException("Unknown site in " + READINGS_CSV + ": " + r.get("site"));
                }
                rows.add(toReading(ghatId, r));
            }
            readings.saveAll(rows);
            log.info("Seeded {} readings", rows.size());
        }
    }

    private static Reading toReading(String ghatId, CSVRecord r) {
        String value = r.get("value");
        return new Reading(ghatId,
                Integer.parseInt(r.get("year")),
                r.get("festival"),
                r.get("phase"),
                r.get("parameter"),
                value.isBlank() ? null : new BigDecimal(value),
                blankToNull(r.get("unit_assumed")),
                blankToNull(r.get("flag")),
                r.get("value_as_printed"),
                r.get("parameter_as_printed"),
                r.get("site_as_printed"),
                r.get("site_match_confidence"),
                Integer.parseInt(r.get("source_page")));
    }

    private static List<CSVRecord> parse(String path) throws IOException {
        CSVFormat format = CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).get();
        try (Reader in = new InputStreamReader(new ClassPathResource(path).getInputStream(), StandardCharsets.UTF_8)) {
            return format.parse(in).getRecords();
        }
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s;
    }
}
