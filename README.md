# Visarjan Ghat Watch · विसर्जन घाट वॉच

**Track 2: Visarjan Ghat Watch** · Claude Impact Lab × Cerebras Café Compute, Bhopal · 11 October 2026

| | |
|---|---|
| **Team** | _TEAM NAME_ |
| **Members** | Abhishek Rajput · Milendra Kumar Baghel · Tanisha Borana · Krishna Malviya · Srijan Tiwari |
| **The one user** | The Bhopal Municipal Corporation officer who plans Durga visarjan at the ghats and decides where to send extra cleaning, aeration and water testing |
| **The one outcome** | Before 20 October 2026: a ranked list of the 7 Bhopal ghats, a reason for each rank traced to the report page, a saved action plan, and a short Hindi + English brief to forward |

## What it does

Three years of MPPCB visarjan water tests (1,524 readings, 2023–2025) are checked against the CPCB bathing-water limits (class B). The officer then:

1. **Sees the ghats ranked by risk.** Each ghat shows its reasons in plain English or Hindi, for example *"Dissolved oxygen was below the bathing limit (5 mg/l or more) in 11 of 13 tests. Lowest: 0 mg/l (Ganesh 2023, one week after, 2023 report p.26). It read 0 mg/l 4 times."* Every number is a link that opens the original MPPCB PDF at that page.
2. **Checks the evidence.** For each ghat, a grid shows every reading against the limit. Cells that were not sampled are hatched and say "Not sampled", so they can never look clean. BDL shows as BDL. A missing table shows as "No table in report".
3. **Decides the actions.** Aeration, extra cleaning and extra water testing are pre-ticked from the data, with the reason for each. The officer changes the ticks, adds a note and saves. The plan is stored in MySQL.
4. **Forwards the brief.** A formatted brief in English and Hindi, built from the ranking and the saved plan, as an A4 PDF. The officer shares it on WhatsApp as a file, downloads it, prints it, or copies it as text.

The tool can also show only Durga tests, and the ranking downloads as a CSV.

## How to run it (5 steps)

You need Java 25, Maven 3.9+, Node 20+ and a running MySQL 8.

1. **Get the code:** `git clone <this repo>` and `cd` into it.
2. **Give the backend your MySQL login:** copy `backend/.env.example` to `backend/.env` and fill in `DB_USER` and `DB_PASSWORD`. The file is never committed. The backend creates the `ghat_watch` database and loads the data on first start.
3. **Build the frontend:** `cd frontend` then `npm install` then `npm run build`
4. **Start the tool:** `cd ../backend` then `mvn spring-boot:run`
5. **Open http://localhost:8080.** The app, the API and the source PDFs are all served from this one address.

**One file for a server:** after step 3, run `mvn package` in `backend`. Then run `java -jar target/ghat-watch-backend-1.0.0.jar` from the `backend` folder, so that it finds `.env`.

**Working on the code:** run `npm run dev` in `frontend` while the backend is running, and open http://localhost:5173. Changes then reload instantly.

**Optional settings** (in `backend/.env` or as environment variables): `DB_URL` (full JDBC URL), `PORT` (backend port), `ALLOWED_ORIGINS` (CORS, only for the dev server).

**No API keys are needed.** The tool connects to no government system. The only outside calls are:
- map tiles (OpenStreetMap / Esri), on the map page only;
- WhatsApp, when the officer chooses to share.

**Tests:** run `mvn test` in `backend`. They need no MySQL server: the API test runs on an in-memory database in MySQL mode.

## Checked against the source PDFs

We checked 29 readings against the page of the MPPCB report each one cites: 25 picked at random, plus all 4 dissolved-oxygen readings of 0 mg/l at Bairagarh. **All 29 match.**

In some tables, the PDF's text layer prints a column of values out of line with its row labels. There, we checked the values in row order against the 13 parameters. Example: the "After one week" column on 2023 report p.26.

## Why now

The National Green Tribunal has banned idol immersion in Bhopal's Upper and Lower Lakes, and Bhopal Municipal Corporation is building new ghats ([Free Press Journal, 26 Feb 2026](https://www.freepressjournal.in/amp/bhopal/mp-news-idol-immersion-to-shift-from-lakes-to-safer-sites-ngt-ban-pushes-bmc-to-build-4-dedicated-ghats)). The new ghats have no test history yet. This tool covers the 7 ghats that MPPCB has tested, and its "extra water testing" suggestion is the way to start a record for the new ones.

## How the ranking works

- **Limits:** CPCB class B, outdoor bathing. People stand and bathe in the water at a ghat during visarjan. The limits are dissolved oxygen 5 mg/l or more, BOD 3 mg/l or less, and pH 6.5 to 8.5. These are read from `cpcb_water_quality_criteria.csv`.
- **Severity per reading, from 0 to 1:**
  - Dissolved oxygen: 0 at 5 mg/l, 1 at 0 mg/l.
  - BOD: 0 at 3 mg/l, 1 at 12 mg/l (four times the limit).
  - pH: 0 inside the range, 1 when a full pH unit outside.
- **Risk score:** 100 × weighted mean severity. The weights are dissolved oxygen 50%, BOD 35%, pH 15%.
- **Tiers:** High from 30, Medium from 15, otherwise Lower. Tiers show priority among these ghats. A "Lower" ghat still breaches limits.
- **Missing data never lowers a score and never counts as clean.** Each gap is listed by festival and stage, and leads to an "extra water testing" suggestion.
- **BDL / ND** counts as a test with a very low value. It is not counted as zero or as missing.

The code is in [backend/src/main/java/com/ghatwatch/risk/RiskEngine.java](backend/src/main/java/com/ghatwatch/risk/RiskEngine.java) and [BathingLimits.java](backend/src/main/java/com/ghatwatch/risk/BathingLimits.java). [RiskEngineTest](backend/src/test/java/com/ghatwatch/risk/RiskEngineTest.java) checks the guide's headline figures against the real data: 42 of 116 dissolved-oxygen tests below 5, 100 of 112 BOD tests above 3, and four zero-oxygen readings at Bairagarh.

## What works and what doesn't

**Works**
- Ranking of all 7 ghats, using all festivals or Durga only, with reasons in English and Hindi and page-level links to the source PDFs.
- An evidence grid for every ghat, covering dissolved oxygen, BOD and pH plus all 13 parameters as printed. Missing, BDL and "no table" are each shown differently.
- Action plan saved to MySQL. It survives restarts and feeds the brief.
- Brief in English and Hindi as a formatted A4 PDF: letterhead, numbered sections, ranking table, sources and a sign-off block. **Share PDF on WhatsApp** sends the PDF file through the phone's or Windows' share menu. In browsers that cannot share files, the PDF downloads and WhatsApp opens so it can be attached. Download, print and copy-as-text are also available.
- CSV export of the ranking with reasons.
- Dashboard overview: KPI tiles, risk tiers by year (each year scored on its own readings; years with no test are hatched), a water-quality snapshot and the visarjan countdown.
- Water analytics: ghat comparison, year-wise trend, and Ganesh vs Durga for any parameter. Every chart has a table view, and averages leave out BDL and not-sampled readings.
- Evidence explorer: filter all 1,524 readings, then open the exact report page in a PDF preview next to the table.
- Map of the 7 ghats coloured by risk tier (positions approximate, see below).
- **Visarjan test schedule:** before (18 Oct), during (20 Oct) and one week after (27 Oct) for every ghat, with ghats that have data gaps first. It downloads as a calendar file (.ics), and the page suggests asking MPPCB to add total coliform.
- **Field sheets:** one A4 page per ghat for the ground team. Each has the risk and reasons, action tick boxes, the bathing limits, last year's results, and blank boxes for this year's readings. They download or share on WhatsApp as one PDF, or one ghat at a time.
- **New readings:** this visarjan's MPPCB results (e.g. Durga 2026) can be typed in, and the ranking, brief and trends update at once.
  - Typed-in readings are marked "Entered in Ghat Watch" with their source note, never shown as a report page.
  - A cell already printed in an MPPCB report cannot be overwritten.
  - Until a ghat's results are entered, the new festival shows as a data gap for that ghat.
- **Better or worse than last year:** an arrow on each ghat compares its latest tested year's risk score with the year before.
- A Settings & about page with the method, the data limits, the sources and all CPCB classes. The layout works on phones, with the sidebar becoming a menu.

**Doesn't, or not yet**
- **Total coliform** is part of the bathing standard but is not in these reports, so the tool cannot check it.
- **The reports print no units**, so standard units are assumed.
- **Metals and the other parameters** (COD, solids, turbidity, conductivity, Cr, Pb, Zn, Cu) have no class B limit. They are shown but not scored.
- **Bairagarh and Malikhedi** have no Durga 2025 table, and their Ganesh 2025 tests are during-immersion only. Their ranks rest on less data and are flagged.
- **"Rani Kamlapati ghat / Kamla Park kund"** may be two places. The tool flags this and does not split the site.
- **The new BMC ghats** built after the NGT order have no test history, so they are not ranked.
- **Map pins are approximate.** They were placed by hand from the place names, and the map page says so. Teammates should check each pin on the ground, then correct it in [frontend/src/lib/ghats.ts](frontend/src/lib/ghats.ts). The map tiles come from OpenStreetMap and need internet; the pin list works offline.
- **Photos.** The home-page photo was supplied by the team ([frontend/public/images/](frontend/public/images/)). The pictures of the 7 ghats ([frontend/public/images/ghats/](frontend/public/images/ghats/)) were also supplied by the team. They are illustrative and may not show the exact sampling point; check them before official use. The home page has no official MPPCB, CPCB or BMC logos; it shows plain icons instead.
- **Government of Madhya Pradesh seal.** The browser tab icon and the dashboard sidebar logo both use the Government of Madhya Pradesh seal ([frontend/public/images/mp-emblem.png](frontend/public/images/mp-emblem.png)). The seal contains the State Emblem of India, whose use is limited by the State Emblem of India (Prohibition of Improper Use) Act, 2005. Confirm with the organisers or MPSeDC that it may be used. To remove it, change the three icon lines in [frontend/index.html](frontend/index.html) and remove `emblem` from `<Logo dark emblem />` in [frontend/src/components/AppShell.tsx](frontend/src/components/AppShell.tsx).
- **The statewide file** (`mp_immersion_sites_2023_2025.csv`) is not used. It is less checked, and this tool is for Bhopal only.
- **The weights and tier cut-offs are our judgement.** They are documented and can be changed in one place.
- **The Hindi text** was written by the team. A native-speaking BMC officer should review it before official use.
- **No login.** The tool is meant to run on one officer's machine or an internal server.

## Data used

All data comes from the event data pack. No extra data was added.

- `bhopal_ghats_2023_2025.csv` and `cpcb_water_quality_criteria.csv`, copied into [backend/src/main/resources/data/](backend/src/main/resources/data/).
- The three MPPCB visarjan reports, copied into [backend/src/main/resources/static/reports/](backend/src/main/resources/static/reports/) so that page links work offline:
  - [2023](https://www.mppcb.mp.gov.in/proc/mon/Idol_immer._Report_23_CPCB.pdf)
  - [2024](https://www.mppcb.mp.gov.in/proc/mon/Ganesh_and_Durga_visarjan_report-2024.pdf)
  - [2025](https://www.mppcb.mp.gov.in/proc/mon/Ganesh_and_Durga_visarjan_report-2025.pdf)
- CPCB water quality criteria: https://cpcb.gov.in/water-quality-criteria/

## Project layout

```
backend/   Spring Boot 4.1 (Java 25) + MySQL
  risk/      the ranking engine (pure Java, unit-tested)
  service/   ranking, plan, bilingual brief
  web/       REST API: /api/ranking, /api/ranking.csv, /api/ghats/{id}, /api/readings, /api/trend, /api/plan, /api/brief, /api/meta
  seed/      loads the CSVs into MySQL on first start
  resources/schema.sql   tables: ghat, reading, cpcb_criterion, action_plan
frontend/  React 19 + Vite + Tailwind CSS 4 (TypeScript), Recharts, Leaflet
  pages/     Landing · Overview · Rankings · Ghat detail · Map · Analytics · Evidence explorer · Action brief · Settings & about
  lib/       ghat positions and display order, chart colours (palette checked for colour-blind separation)
```

## License

[MIT](LICENSE). The code is offered to the Government of Madhya Pradesh through MPSeDC.
