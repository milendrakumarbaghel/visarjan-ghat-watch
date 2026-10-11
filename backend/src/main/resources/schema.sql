-- Visarjan Ghat Watch schema. Safe to run on every start.

CREATE TABLE IF NOT EXISTS ghat (
    id                    VARCHAR(40)  NOT NULL PRIMARY KEY,
    name                  VARCHAR(120) NOT NULL UNIQUE,
    name_hi               VARCHAR(120) NOT NULL,
    water_body            VARCHAR(80)  NOT NULL,
    water_body_hi         VARCHAR(80)  NOT NULL,
    site_match_confidence VARCHAR(10)  NOT NULL,
    note                  VARCHAR(500),
    note_hi               VARCHAR(500)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- One row per number (or blank) printed in an MPPCB visarjan report.
CREATE TABLE IF NOT EXISTS reading (
    id                    BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    ghat_id               VARCHAR(40)  NOT NULL,
    report_year           INT          NOT NULL,
    festival              VARCHAR(10)  NOT NULL,
    phase                 VARCHAR(10)  NOT NULL,
    parameter             VARCHAR(40)  NOT NULL,
    value                 DECIMAL(12, 4),
    unit_assumed          VARCHAR(20),
    flag                  VARCHAR(20),
    value_as_printed      VARCHAR(40),
    parameter_as_printed  VARCHAR(80),
    site_as_printed       VARCHAR(200),
    site_match_confidence VARCHAR(10),
    source_page           INT          NOT NULL,
    CONSTRAINT fk_reading_ghat FOREIGN KEY (ghat_id) REFERENCES ghat (id),
    INDEX idx_reading_ghat (ghat_id, report_year, festival)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cpcb_criterion (
    id                 BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    water_class        CHAR(1)      NOT NULL,
    designated_use     VARCHAR(200) NOT NULL,
    parameter          VARCHAR(80)  NOT NULL,
    limit_type         VARCHAR(10)  NOT NULL,
    limit_text         VARCHAR(20)  NOT NULL,
    unit               VARCHAR(20)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- The officer's decisions for this visarjan: one row per ghat.
CREATE TABLE IF NOT EXISTS action_plan (
    ghat_id       VARCHAR(40)  NOT NULL PRIMARY KEY,
    aeration      BOOLEAN      NOT NULL DEFAULT FALSE,
    cleaning      BOOLEAN      NOT NULL DEFAULT FALSE,
    extra_testing BOOLEAN      NOT NULL DEFAULT FALSE,
    note          VARCHAR(1000),
    updated_at    DATETIME(0)  NOT NULL,
    CONSTRAINT fk_plan_ghat FOREIGN KEY (ghat_id) REFERENCES ghat (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Readings typed in after a visarjan (e.g. from the MPPCB lab sheet for Durga 2026).
-- Kept apart from the report readings and always shown as "entered in Ghat Watch".
CREATE TABLE IF NOT EXISTS field_reading (
    id                    BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    ghat_id               VARCHAR(40)   NOT NULL,
    report_year           INT           NOT NULL,
    festival              VARCHAR(10)   NOT NULL,
    phase                 VARCHAR(10)   NOT NULL,
    parameter             VARCHAR(40)   NOT NULL,
    value                 DECIMAL(12, 4),
    flag                  VARCHAR(20),
    value_as_entered      VARCHAR(40)   NOT NULL,
    source_note           VARCHAR(300),
    entered_at            DATETIME(0)   NOT NULL,
    CONSTRAINT fk_field_reading_ghat FOREIGN KEY (ghat_id) REFERENCES ghat (id),
    CONSTRAINT uq_field_reading UNIQUE (ghat_id, report_year, festival, phase, parameter)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
