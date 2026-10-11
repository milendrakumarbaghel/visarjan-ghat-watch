package com.ghatwatch.service;

import com.ghatwatch.domain.FieldReading;
import com.ghatwatch.repository.FieldReadingRepository;
import com.ghatwatch.repository.GhatRepository;
import com.ghatwatch.repository.ReadingRepository;
import com.ghatwatch.web.dto.FieldReadingRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Set;

/** Saves readings typed in after a visarjan, so the ranking can use this year's tests. */
@Service
public class FieldReadingService {

    private static final Set<String> FESTIVALS = Set.of("Ganesh", "Durga");
    private static final Set<String> PHASES = Set.of("pre", "during", "after");

    private final FieldReadingRepository fieldReadings;
    private final ReadingRepository reportReadings;
    private final GhatRepository ghats;

    public FieldReadingService(FieldReadingRepository fieldReadings, ReadingRepository reportReadings, GhatRepository ghats) {
        this.fieldReadings = fieldReadings;
        this.reportReadings = reportReadings;
        this.ghats = ghats;
    }

    public List<FieldReading> all() {
        return fieldReadings.findAll().stream()
                .sorted(Comparator.comparing(FieldReading::getEnteredAt).reversed())
                .toList();
    }

    /**
     * Saves one ghat's readings for one festival stage. Blank values are skipped; an existing typed
     * reading for the same cell is replaced. A cell already printed in an MPPCB report cannot be overwritten.
     */
    @Transactional
    public List<FieldReading> save(FieldReadingRequest request) {
        if (!ghats.existsById(request.ghatId())) {
            throw new NoSuchElementException("No ghat " + request.ghatId());
        }
        if (!FESTIVALS.contains(request.festival()) || !PHASES.contains(request.phase())) {
            throw new IllegalArgumentException("Festival must be Ganesh or Durga, and stage pre, during or after.");
        }
        String note = request.sourceNote() == null || request.sourceNote().isBlank() ? null : request.sourceNote().strip();

        List<FieldReading> saved = new ArrayList<>();
        for (Map.Entry<String, String> entry : request.values().entrySet()) {
            String parameter = entry.getKey();
            String raw = entry.getValue() == null ? "" : entry.getValue().strip();
            if (raw.isEmpty()) {
                continue;
            }
            if (!Units.PARAMETERS.contains(parameter)) {
                throw new IllegalArgumentException("Unknown parameter: " + parameter);
            }
            if (reportReadings.existsByGhatIdAndYearAndFestivalAndPhaseAndParameter(
                    request.ghatId(), request.year(), request.festival(), request.phase(), parameter)) {
                throw new IllegalArgumentException(parameter + " for " + request.festival() + " " + request.year()
                        + " (" + request.phase() + ") is already in the MPPCB report and cannot be changed here.");
            }

            BigDecimal value = null;
            String flag = null;
            String upper = raw.toUpperCase();
            if (upper.equals("BDL") || upper.equals("ND")) {
                flag = upper;
            } else {
                try {
                    value = new BigDecimal(raw);
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException(parameter + ": \"" + raw + "\" is not a number, BDL or ND.");
                }
                if (value.signum() < 0) {
                    throw new IllegalArgumentException(parameter + " cannot be negative.");
                }
            }

            FieldReading reading = fieldReadings
                    .findByGhatIdAndYearAndFestivalAndPhaseAndParameter(
                            request.ghatId(), request.year(), request.festival(), request.phase(), parameter)
                    .orElseGet(() -> new FieldReading(request.ghatId(), request.year(), request.festival(),
                            request.phase(), parameter));
            reading.set(value, flag, raw, note);
            saved.add(fieldReadings.save(reading));
        }
        if (saved.isEmpty()) {
            throw new IllegalArgumentException("Enter at least one value.");
        }
        return saved;
    }

    @Transactional
    public void delete(long id) {
        fieldReadings.deleteById(id);
    }
}
