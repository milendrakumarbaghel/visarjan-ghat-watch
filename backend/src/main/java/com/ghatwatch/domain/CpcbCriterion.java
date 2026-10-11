package com.ghatwatch.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** One row of the CPCB designated-best-use water quality criteria (classes A to E). */
@Entity
@Table(name = "cpcb_criterion")
public class CpcbCriterion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "water_class")
    private String waterClass;

    @Column(name = "designated_use")
    private String designatedUse;

    private String parameter;

    /** min, max or range. */
    @Column(name = "limit_type")
    private String limitType;

    /** As in the CSV: "5", or "6.5-8.5" for ranges. */
    @Column(name = "limit_text")
    private String limitText;

    private String unit;

    protected CpcbCriterion() {
    }

    public CpcbCriterion(String waterClass, String designatedUse, String parameter,
                         String limitType, String limitText, String unit) {
        this.waterClass = waterClass;
        this.designatedUse = designatedUse;
        this.parameter = parameter;
        this.limitType = limitType;
        this.limitText = limitText;
        this.unit = unit;
    }

    public Long getId() { return id; }
    public String getWaterClass() { return waterClass; }
    public String getDesignatedUse() { return designatedUse; }
    public String getParameter() { return parameter; }
    public String getLimitType() { return limitType; }
    public String getLimitText() { return limitText; }
    public String getUnit() { return unit; }
}
