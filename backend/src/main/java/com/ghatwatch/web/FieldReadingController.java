package com.ghatwatch.web;

import com.ghatwatch.domain.FieldReading;
import com.ghatwatch.service.FieldReadingService;
import com.ghatwatch.web.dto.FieldReadingRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Readings typed in after a visarjan (e.g. Durga 2026). They feed the ranking straight away. */
@RestController
@RequestMapping("/api/field-readings")
public class FieldReadingController {

    private final FieldReadingService service;

    public FieldReadingController(FieldReadingService service) {
        this.service = service;
    }

    @GetMapping
    public List<FieldReading> all() {
        return service.all();
    }

    @PostMapping
    public List<FieldReading> save(@Valid @RequestBody FieldReadingRequest request) {
        return service.save(request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
