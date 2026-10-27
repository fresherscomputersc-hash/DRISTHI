# Demo — 90 seconds

Six screens, one story: **every alert shows its rows, its rule, and its rupees.**

## Before you start

```bash
npm run seed     # once; ~35 s
npm run dev      # or: npm run build && npm start
```

Open `http://localhost:3000` in a full-screen browser at ~1280px wide. The dataset is fixed, so
every number below reproduces exactly. Keep `docs/DEMO.md` closed during the run.

---

## 0:00 — Command Center

> "OSRTC's ticketing, remittance, telemetry and workshop data live in separate systems. Drishti joins
> them into one trip-level truth. This is the morning read: ₹5.76 crore of revenue over 30 days,
> ₹3.45 lakh at risk, and the alerts ranked by rupees — not by count."

Point at the **Demand outlook** strip.

> "Tomorrow: 30,661 boardings forecast across 192 routes — 18 routes short of seats, 42 running light,
> ₹1.13 lakh a day at stake. That's the prediction surfaced before you open the demand module."

Point at the **Synthetic** badge and the freshness strip.

> "It says the data is synthetic. A judge should never have to wonder."

## 0:15 — Revenue Integrity: the evidence panel

Click the top alert row.

> "This is a trip flagged for an unrecorded run. Here are the telemetry rows, the rule that fired, the
> expected fare, the confidence, and the rupee impact. Nothing in this panel is computed in the browser —
> it's the same rows the detector read."

Point at **Why this fired** → **Injected ground truth**.

> "Because the generator labels what it corrupts, we can show the truth next to the estimate. That's how
> precision and recall are measured, not claimed."

## 0:35 — Case workflow

In the drawer: set **Status** to *Acknowledged*, pick an assignee, add a note, **Save case**.

> "An alert nobody owns is a chart. The case moves to a person, and the ledger shows its state. Cases are
> stored separately from detections, so closing a case never changes the detection result."

## 0:50 — Demand

Go to **Demand**. The top route is already the highest-priority gap.

> "Holt-Winters with a weekly season, fitted per route, backtested on a 14-day hold-out. Tomorrow's
> forecast is 383 boardings against 320 seats — add two trips. Across the network: 18 routes short of
> seats, 42 running light, ₹1.13 lakh a day of fare value at stake."

Point at the **Model card** and the error band.

> "Where history is too thin, the model refuses instead of guessing."

## 1:05 — Fleet

Go to **Fleet**, open the top-risk vehicle.

> "This score is not a black box: service interval 30, breakdowns 25, age 20, repeat repairs 15, last fault
> 10. The drawer shows the arithmetic and the workshop events behind it, and what to do next."

## 1:20 — Data Quality

Go to **Data Quality**.

> "2,040 labelled revenue anomalies injected; 2,040 detected; zero false positives on a ₹25 tolerance;
> ₹9.76 lakh identified, 96.9% rupee recall. Rupee recall is under 100% because an unrecorded trip has no
> ticket row to read — we estimate it from fare and distance. That's the only honest number to show."

---

## If they ask

**"100% recall is suspicious."**
> "Correct — and it's in the README. We inject the same failure mechanisms the rules encode, so on this
> dataset the rules are exact by construction. The real test is a pilot, where remittance lag produces
> false positives until the tolerance and lag window are recalibrated. The scorecard exists so that
> conversation is possible."

**"What does it save?"**
> "₹9.76 lakh of leakage in 90 days on synthetic data — the point is the method and the evidence path, not
> the number. In a pilot the same ledger runs on real remittances and the number becomes real."

**"Why SQLite?"**
> "The demo must run on a laptop with no network, no keys, no services. 123,300 trips is small; SQLite is
> faster than the network hop to a server would be, and the file ships deterministically."

**"How does it scale?"**
> "The reconciliation reads a pre-aggregated `trip_finance` table — one indexed pass over 123k rows in about
> 110 ms — instead of joining 540k detail rows per page. The ingestion contract is modelled; the ETM/OPRS
> connectors are the pilot's first deliverable."

**"What is not built?"**
> "Live ingestion, authentication, and holiday regressors in the forecast. All three are stated on the Data
> Quality page rather than implied."
