# 💧 Visarjan Ghat Watch · विसर्जन घाट वॉच

> **Three years of buried MPPCB water tests, turned into a ranked, evidence-backed action plan for Durga visarjan in Bhopal.**

**Track 2: Visarjan Ghat Watch** · Claude Impact Lab × Cerebras Café Compute, Bhopal · 11 October 2026

---

## 👥 Team

| | |
|---|---|
| **Team name** | _TEAM NAME_ |
| **Members** | Abhishek Rajput · Milendra Kumar Baghel · Tanisha Borana · Krishna Malviya · Srijan Tiwari |
| **Track** | Track 2 — Visarjan Ghat Watch |
| **The one user** | The **Bhopal Municipal Corporation officer who plans Durga visarjan** at the ghats and decides where to send extra cleaning, aeration and water testing |
| **The one outcome** | Before **20 October 2026**: a ranked list of the 7 Bhopal ghats, a reason for each rank traced to the report page, a saved action plan, and a Hindi + English brief to forward |

---

## 🚩 The problem

Every Ganesh and Durga festival, the MP Pollution Control Board (MPPCB) tests the water at Bhopal's immersion ghats three times: before, during and one week after immersion. The results sit in 90–120-page PDFs that nobody lines up against the legal limits. Inside them:

- **Dissolved oxygen read 0 mg/l four times** at Bairagarh (Sant Hirdaram) kund. The bathing standard asks for at least 5.
- **42 of 116** dissolved-oxygen tests were below 5 mg/l.
- **100 of 112** BOD tests were above the bathing limit of 3 mg/l.

The National Green Tribunal has banned immersion in the Upper and Lower Lakes, and BMC is building new ghats ([Free Press Journal, 26 Feb 2026](https://www.freepressjournal.in/amp/bhopal/mp-news-idol-immersion-to-shift-from-lakes-to-safer-sites-ngt-ban-pushes-bmc-to-build-4-dedicated-ghats)). Until now, where to send help was decided from memory.

---

## ✅ What the officer can do

| Step | Screen | What happens |
|---|---|---|
| 1 | **Dashboard** | Headline figures, risk tiers by year, a water-quality snapshot and a countdown to visarjan |
| 2 | **Ghat rankings** | All 7 ghats ranked by risk, each with its reason in plain English or Hindi and a better-or-worse-than-last-year arrow |
| 3 | **Ghat detail** | Every reading against the CPCB limit. Click any number to open the **MPPCB PDF at that exact page** |
| 4 | **Evidence explorer** | Filter all 1,524 readings and preview the source page next to the table |
| 5 | **Action brief** | Aeration, cleaning and testing are suggested from the data. The officer confirms, adds notes and saves |
| 6 | **Brief PDF** | A formatted A4 brief in English and Hindi, **shared on WhatsApp as a PDF**, downloaded or printed |
| 7 | **Test schedule** | Test dates for 18, 20 and 27 Oct, ghats with data gaps first, as a calendar file. **One field sheet per ghat** for the ground team |
| 8 | **New readings** | This visarjan's results are typed in after the tests, and the ranking updates at once |

Also included: water analytics (ghat, year and festival comparison), a map of the ghats, CSV export, a Durga-only view, and the full interface in Hindi.

**An example of a reason the officer sees:**
> *Dissolved oxygen was below the bathing limit (5 mg/l or more) in 11 of 13 tests. Lowest: 0 mg/l (Ganesh 2023, one week after, 2023 report p.26). It read 0 mg/l 4 times.*

---

## 🚀 How to run it (5 steps)

**You need:** Java 25 · Maven 3.9+ · Node 20+ · MySQL 8

1. **Get the code:** `git clone <this repo>` and `cd` into it.
2. **Add your MySQL login:** copy `backend/.env.example` to `backend/.env` and fill in `DB_USER` and `DB_PASSWORD`. The file is never committed.
3. **Build the frontend:** `cd frontend` → `npm install` → `npm run build`
4. **Start the tool:** `cd ../backend` → `mvn spring-boot:run`
5. **Open http://localhost:8080**

On first start the backend creates the `ghat_watch` database and loads all the data. The app, the API and the source PDFs are all served from that one address.

**More options**

| Need | How |
|---|---|
| One file for a server | After step 3, run `mvn package` in `backend`, then `java -jar target/ghat-watch-backend-1.0.0.jar` from the `backend` folder |
| Work on the code | Run `npm run dev` in `frontend` while the backend runs, and open http://localhost:5173 |
| Change settings | In `backend/.env`: `DB_URL`, `PORT`, `ALLOWED_ORIGINS` (CORS, dev server only) |
| Run the tests | `mvn test` in `backend`. No MySQL needed: tests use an in-memory database in MySQL mode |

**No API keys or secrets** are in the code. The tool connects to **no government system**. The only outside calls are map tiles (OpenStreetMap / Esri, map page only) and WhatsApp, when the officer chooses to share.

---

## 🧮 How the ranking works

**Limits — CPCB class B (outdoor bathing).** People stand and bathe at a ghat during visarjan, so the bathing standard is the right fit. The limits are read from `cpcb_water_quality_criteria.csv`.

| Parameter | Bathing limit | Severity 0 | Severity 1 | Weight |
|---|---|---|---|---|
| Dissolved oxygen | 5 mg/l or more | 5 mg/l | 0 mg/l | 50% |
| BOD | 3 mg/l or less | 3 mg/l | 12 mg/l (4 × the limit) | 35% |
| pH | 6.5 to 8.5 | inside the range | a full pH unit outside | 15% |

- **Risk score** = 100 × the weighted average of each parameter's mean severity.
- **Tiers:** High from 30, Medium from 15, otherwise Lower. Tiers show priority among these 7 ghats: a "Lower" ghat can still breach the limits.
- **Why these weights:** oxygen reached 0 mg/l, and BOD breaches most often.

**Honesty rules built into the code**
- ❌ **Missing is never clean.** A test that was not done is shown hatched as "Not sampled". It never lowers a score, and it leads to an "extra water testing" suggestion.
- 🔬 **BDL / ND** counts as a test with a very low value, not as zero and not as missing.
- 📄 **Every claim is traceable** to its report and page. Readings typed in later are marked "Entered in Ghat Watch".
- 🩺 **No health claims.** The tool compares readings with limits only.

The engine is in [RiskEngine.java](backend/src/main/java/com/ghatwatch/risk/RiskEngine.java) and [BathingLimits.java](backend/src/main/java/com/ghatwatch/risk/BathingLimits.java).

---

## 🔍 Checked against the source PDFs

- **Automated tests** ([RiskEngineTest](backend/src/test/java/com/ghatwatch/risk/RiskEngineTest.java)) reproduce the guide's headline figures from the data: 42/116 oxygen tests, 100/112 BOD tests, and four 0 mg/l readings at Bairagarh.
- **Manual spot-check:** we checked 29 readings (25 random, plus all 4 zero-oxygen readings) against the report page each one cites. **All 29 match.**
  - In some tables the PDF's text layer prints a column out of line with its labels. There, we checked the values in row order (e.g. the "After one week" column, 2023 report p.26).

---

## 📋 What works and what doesn't

### ✅ Works
- Ranking of all 7 ghats (all festivals or Durga only), with reasons in English and Hindi and page-level links to the PDFs
- Evidence grid per ghat. Missing, BDL and "no table in report" each look different
- Action plan saved in MySQL. It survives restarts and feeds the brief and field sheets
- Brief as an A4 PDF in English and Hindi: letterhead, numbered sections, ranking table, sources, sign-off
- **Share PDF on WhatsApp** through the phone or Windows share menu. Where a browser can't share files, the PDF downloads and WhatsApp opens
- Test schedule with a calendar file, and a field sheet per ghat (PDF)
- New readings entry: validated, can't overwrite report values, and updates the ranking at once
- Better/worse-than-last-year indicator
- Dashboard, analytics (every chart has a table view), evidence explorer with PDF preview, map, CSV export
- Works on phones; the full interface is in Hindi
- Backend tests: the engine on the real data, and the full API end to end

### ⚠️ Doesn't, or not yet
| Limit | Detail |
|---|---|
| **Total coliform** | Part of the bathing standard but not tested in the reports, so it can't be checked. The test schedule suggests asking MPPCB to add it |
| **Units** | The reports print no units; standard units are assumed |
| **Metals & other parameters** | COD, solids, turbidity, conductivity, Cr, Pb, Zn and Cu have no class B limit. They are shown, not scored |
| **Bairagarh & Malikhedi** | No Durga 2025 table, and Ganesh 2025 was sampled during immersion only. Ranked on less data, and flagged |
| **Rani Kamlapati / Kamla Park** | May be two places (the reports use two names). Flagged, not split |
| **New BMC ghats** | No test history, so not ranked. Their readings can be added in **New readings** once tested |
| **Map pins** | Approximate, placed from place names. Verify them and correct [ghats.ts](frontend/src/lib/ghats.ts). Map tiles need internet |
| **Photos** | The home and ghat pictures were supplied by the team and are illustrative. No official MPPCB, CPCB or BMC logos are used |
| **Government of MP seal** | Used as the tab icon and sidebar logo. It contains the State Emblem of India (restricted by the State Emblem of India (Prohibition of Improper Use) Act, 2005), so confirm use with the organisers or MPSeDC. To remove it, edit the icon lines in [index.html](frontend/index.html) and remove `emblem` from `<Logo dark emblem />` in [AppShell.tsx](frontend/src/components/AppShell.tsx) |
| **PDF text** | The PDF brief is drawn as images so Hindi renders correctly. Its text can't be searched; "Copy text" gives a text version |
| **Weights & tiers** | Our judgement, documented and changeable in one place |
| **Hindi** | Written by the team; a native-speaking officer should review it |
| **Statewide file** | `mp_immersion_sites_2023_2025.csv` is not used: it is less checked, and this tool is for Bhopal |
| **Login** | None. The tool is meant for one officer's machine or an internal server |

---

## 📚 Data used

**All data comes from the event data pack. No extra data was added.**

| Source | Where in this repo | Link |
|---|---|---|
| Bhopal ghat readings 2023–2025 (1,524 rows) | [backend/src/main/resources/data/](backend/src/main/resources/data/) | Event data pack |
| CPCB water quality criteria (classes A–E) | [backend/src/main/resources/data/](backend/src/main/resources/data/) | [cpcb.gov.in](https://cpcb.gov.in/water-quality-criteria/) |
| MPPCB Idol Immersion Report 2023 | [static/reports/](backend/src/main/resources/static/reports/) | [mppcb.mp.gov.in](https://www.mppcb.mp.gov.in/proc/mon/Idol_immer._Report_23_CPCB.pdf) |
| MPPCB Ganesh & Durga Visarjan Report 2024 | [static/reports/](backend/src/main/resources/static/reports/) | [mppcb.mp.gov.in](https://www.mppcb.mp.gov.in/proc/mon/Ganesh_and_Durga_visarjan_report-2024.pdf) |
| MPPCB Ganesh & Durga Visarjan Report 2025 | [static/reports/](backend/src/main/resources/static/reports/) | [mppcb.mp.gov.in](https://www.mppcb.mp.gov.in/proc/mon/Ganesh_and_Durga_visarjan_report-2025.pdf) |
| NGT ban and new BMC ghats (context only) | — | [Free Press Journal](https://www.freepressjournal.in/amp/bhopal/mp-news-idol-immersion-to-shift-from-lakes-to-safer-sites-ngt-ban-pushes-bmc-to-build-4-dedicated-ghats) |

The report PDFs are bundled so that every page link works offline.

---

## 🏗️ Technology and project layout

| Part | Built with |
|---|---|
| Backend | Spring Boot 4.1 · Java 25 · Spring Data JPA · MySQL 8 |
| Frontend | React 19 · TypeScript · Vite · Tailwind CSS 4 · Recharts · Leaflet |
| PDF brief and field sheets | html-to-image + jsPDF, made in the browser (keeps Hindi shaping correct) |

```
backend/
  risk/       ranking engine (pure Java, unit-tested)
  service/    ranking, action plan, bilingual brief, new readings
  web/        REST API: /api/ranking, /api/ranking.csv, /api/ghats/{id}, /api/readings,
              /api/trend, /api/plan, /api/brief, /api/field-readings, /api/meta
  seed/       loads the CSVs into MySQL on first start
  resources/  schema.sql (ghat, reading, cpcb_criterion, action_plan, field_reading), data, report PDFs
frontend/
  pages/      Home · Dashboard · Rankings · Ghat detail · Map · Analytics · Evidence ·
              Action brief · Test schedule · New readings · Settings & about
  components/ shared UI, charts, PDF brief, field sheet
  lib/        ghat positions, chart colours (checked for colour-blind separation), PDF builder
```

---

## 🧾 How this meets the requirements

| Requirement | Where |
|---|---|
| Team name, members, track, the one user | [Team](#-team) |
| How to run it in 5 steps or fewer | [How to run it](#-how-to-run-it-5-steps) |
| What works and what doesn't | [What works and what doesn't](#-what-works-and-what-doesnt) |
| Extra data, with links | [Data used](#-data-used) (none added) |
| LICENSE file | [MIT](LICENSE) |
| No API keys or secrets | Database login in `backend/.env`, which is git-ignored |

| Track 2 jury check | How the tool meets it |
|---|---|
| Ranking traceable to readings and CPCB limits | Every reason links to its report page; the method is published above |
| Missing data shows as missing, never clean | Hatched "Not sampled" cells; gaps listed per ghat; gaps never lower a score |
| Short brief, readable in Hindi and English | A4 PDF brief in both languages, shareable on WhatsApp |
| Honest about what the data doesn't cover | [The limits table above](#-what-works-and-what-doesnt), also shown in the app and in every brief |

---

## 📄 License

[MIT](LICENSE). The code is offered to the Government of Madhya Pradesh through MPSeDC.
