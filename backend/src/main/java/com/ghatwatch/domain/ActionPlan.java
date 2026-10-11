package com.ghatwatch.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/** What the officer has decided to send to one ghat for this visarjan. */
@Entity
@Table(name = "action_plan")
public class ActionPlan {

    @Id
    @Column(name = "ghat_id")
    private String ghatId;

    private boolean aeration;

    private boolean cleaning;

    @Column(name = "extra_testing")
    private boolean extraTesting;

    private String note;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    protected ActionPlan() {
    }

    public ActionPlan(String ghatId) {
        this.ghatId = ghatId;
    }

    public void update(boolean aeration, boolean cleaning, boolean extraTesting, String note) {
        this.aeration = aeration;
        this.cleaning = cleaning;
        this.extraTesting = extraTesting;
        this.note = note;
        this.updatedAt = LocalDateTime.now();
    }

    public String getGhatId() { return ghatId; }
    public boolean isAeration() { return aeration; }
    public boolean isCleaning() { return cleaning; }
    public boolean isExtraTesting() { return extraTesting; }
    public String getNote() { return note; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
