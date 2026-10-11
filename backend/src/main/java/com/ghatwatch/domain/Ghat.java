package com.ghatwatch.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** One Bhopal immersion ghat, under the standard name used in the data pack. */
@Entity
@Table(name = "ghat")
public class Ghat {

    @Id
    private String id;

    private String name;

    @Column(name = "name_hi")
    private String nameHi;

    @Column(name = "water_body")
    private String waterBody;

    @Column(name = "water_body_hi")
    private String waterBodyHi;

    /** "high" or "medium": how sure the data pack is that all printed names mean this one place. */
    @Column(name = "site_match_confidence")
    private String siteMatchConfidence;

    private String note;

    @Column(name = "note_hi")
    private String noteHi;

    protected Ghat() {
    }

    public Ghat(String id, String name, String nameHi, String waterBody, String waterBodyHi,
                String siteMatchConfidence, String note, String noteHi) {
        this.id = id;
        this.name = name;
        this.nameHi = nameHi;
        this.waterBody = waterBody;
        this.waterBodyHi = waterBodyHi;
        this.siteMatchConfidence = siteMatchConfidence;
        this.note = note;
        this.noteHi = noteHi;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getNameHi() { return nameHi; }
    public String getWaterBody() { return waterBody; }
    public String getWaterBodyHi() { return waterBodyHi; }
    public String getSiteMatchConfidence() { return siteMatchConfidence; }
    public String getNote() { return note; }
    public String getNoteHi() { return noteHi; }
}
