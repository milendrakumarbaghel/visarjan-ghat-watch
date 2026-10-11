package com.ghatwatch.web;

import com.ghatwatch.service.GhatWatchService;
import com.ghatwatch.web.dto.PlanRequest;
import com.ghatwatch.web.dto.PlanView;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** The officer's action plan: which ghats get aeration, extra cleaning or extra testing. */
@RestController
@RequestMapping("/api/plan")
public class PlanController {

    private final GhatWatchService ghatWatch;

    public PlanController(GhatWatchService ghatWatch) {
        this.ghatWatch = ghatWatch;
    }

    @GetMapping
    public Map<String, PlanView> all() {
        return ghatWatch.plans();
    }

    @PutMapping("/{ghatId}")
    public PlanView save(@PathVariable String ghatId, @Valid @RequestBody PlanRequest request) {
        return ghatWatch.savePlan(ghatId, request);
    }

    @DeleteMapping("/{ghatId}")
    public ResponseEntity<Void> clear(@PathVariable String ghatId) {
        ghatWatch.clearPlan(ghatId);
        return ResponseEntity.noContent().build();
    }
}
