package com.ghatwatch.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** A reading typed into Ghat Watch after a visarjan, not taken from an MPPCB report page. */
@Entity
@Table(name = "field_reading")
public class FieldReading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ghat_id")
    private String ghatId;

    @Column(name = "report_year")
    private int year;

    private String festival;

    private String phase;

    private String parameter;

    private BigDecimal value;

    private String flag;

    @Column(name = "value_as_entered")
    private String valueAsEntered;

    /** Where the number came from, e.g. "MPPCB lab sheet, 20 Oct". */
    @Column(name = "source_note")
    private String sourceNote;

    @Column(name = "entered_at")
    private LocalDateTime enteredAt;

    protected FieldReading() {
    }

    public FieldReading(String ghatId, int year, String festival, String phase, String parameter) {
        this.ghatId = ghatId;
        this.year = year;
        this.festival = festival;
        this.phase = phase;
        this.parameter = parameter;
    }

    public void set(BigDecimal value, String flag, String valueAsEntered, String sourceNote) {
        this.value = value;
        this.flag = flag;
        this.valueAsEntered = valueAsEntered;
        this.sourceNote = sourceNote;
        this.enteredAt = LocalDateTime.now();
    }

    /** The same reading in the form the risk engine reads. Its id is negative so it never clashes. */
    public Reading toReading(String unit) {
        return Reading.fieldEntry(-id, ghatId, year, festival, phase, parameter, value, unit, flag,
                valueAsEntered, sourceNote);
    }

    public Long getId() { return id; }
    public String getGhatId() { return ghatId; }
    public int getYear() { return year; }
    public String getFestival() { return festival; }
    public String getPhase() { return phase; }
    public String getParameter() { return parameter; }
    public BigDecimal getValue() { return value; }
    public String getFlag() { return flag; }
    public String getValueAsEntered() { return valueAsEntered; }
    public String getSourceNote() { return sourceNote; }
    public LocalDateTime getEnteredAt() { return enteredAt; }
}
