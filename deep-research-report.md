# Executive Summary  
The Odisha State Road Transport Corporation (OSRTC) is a state-owned bus operator with roughly 2,000 vehicles serving 130+ cities and rural areas in Odisha.  Its recent finances are strained – e.g. OSRTC reported cumulative losses of ₹45.46 cr in FY22–23 and FY23–24, despite rising revenues.  Critically, 109 newly acquired buses are out of service due to mechanical issues, pointing to gaps in maintenance and data-driven management.  The OSFIC 2026 Problem Statement #182 (“OSRTC Operations Intelligence”) explicitly calls for an *“intelligent synthesis”* of OSRTC’s siloed data (ticketing, telematics, etc.) to enable demand forecasting, fleet-optimization, predictive maintenance and revenue-leakage detection (see *Problem Statement* below).  In short, OSRTC has modernized parts of its operations (e.g. e-ticketing and GPS tracking via its mobile app) but lacks an integrated analytics system for actionable insights. 

Our research finds **moderate evidence of a genuine need**: OSRTC’s performance awards for fuel efficiency and ticketing (SKOCH awards 2018–19) suggest some systems exist, but the financial losses and many inoperable buses indicate real inefficiencies.  We did not find any announced tender specifically for analytics or AI solutions in OSRTC, suggesting incumbents or in-house systems (like the “ITMS” platform) handle basic functions.  Known competitors include AI-driven fleet-management platforms (e.g. India’s Fleetx.io) that offer IoT data integration and predictive maintenance, but none appear tailored to an STU’s needs.  

**Conclusion:** PS#182 offers a feasible hackathon opportunity **if we focus narrowly**.  Rather than a broad dashboard, the highest-value demonstration would be a **data-driven decision-support workflow**.  For example, ingesting sample ticketing, GPS and maintenance logs to *detect a specific operational issue* (e.g. a revenue discrepancy or maintenance backlog), *explain why it happened*, and *suggest the next action*, with metrics showing improvement.  A successful hack prototype could dramatically differ from the status quo by combining multiple data sources and using simple analytics (forecasting or rules) with explainable outputs.  The main risks are **data access and integration** (real OSRTC data is needed to validate solutions) and **existing systems overlap** (OSRTC’s ITMS/ICCC might already address parts of this).  Next steps include verifying the precise data gaps with OSRTC/Dept officials, refining which outcome (revenue vs. demand vs. maintenance) is highest priority, and identifying any incumbent vendor solutions to avoid duplicating work.  

# Master Inventory Entry: PS #182 – OSRTC Operations Intelligence  
- **Original catalogue #:** 182  
- **Official Title:** *OSRTC Operations Intelligence* (Commerce & Transport Department)  
- **Description (quote):** “The Odisha State Road Transport Corporation (OSRTC) generates massive volumes of operational, ticketing, and telematics data that remain underutilized in silos. Without intelligent synthesis, management lacks real-time visibility to **predict passenger demand, optimize fleet deployment, prevent mechanical breakdowns, and plug revenue leakage**, leading to operational inefficiencies.”  
- **Department/Agency:** Department of Commerce & Transport (OSRTC)  
- **Target Stakeholders:** OSRTC executive leadership, operations planners, maintenance engineers, finance controllers; secondary: bus commuters, state transit regulators, and integration partners.  
- **Innovation Outcome (expected):** A data-driven decision-support system that provides visibility into OSRTC’s operations (e.g. forecasting, alerts for faults or revenue mismatches), leading to improved resource utilization and reduced losses.  
- **Source:** OSFIC 2026 Problem Catalogue (Commerce & Transport sector) *(from user-uploaded description)*.  
- **Source Notes:** Official OSFIC text; we also reference Odisha Transport Dept. data and media for context.  
- **Completeness:** Statement is concise (no attachments). It clearly lists four target problems.  
- **Overlap:** No obvious overlap; this is distinct from other OSFIC entries.  

# Requirements Matrix  

| **Category**                 | **Requirement**                                                                                           | **Notes/Verification**                                                     |
|------------------------------|-----------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------|
| **Explicit (from PS text)**  | Forecast passenger demand (e.g. by route/time).                                                           | PS text: *“predict passenger demand”*. Needs time-series model.           |
|                              | Optimize fleet deployment (e.g. reassign buses to routes/times based on demand).                          | PS text: *“optimize fleet deployment”*. Requires integration with schedules.|
|                              | Predict/prevent mechanical breakdowns (predictive maintenance alerts).                                     | PS text: *“prevent mechanical breakdowns”*. Likely ML on maintenance logs. |
|                              | Plug revenue leakage (reconcile ticket sales vs. collection).                                              | PS text: *“plug revenue leakage”*. Match OPRS vs. on-board sales vs. cash.  |
| **Inferred (analysis)**      | Integrate data sources: online ticketing DB (OPRS), on-board ticket machines (ETM), bus GPS logs, maintenance logs, finance records. | Data is “siloed” per PS. Likely SQL or CSV exports needed.                |
|                              | Provide real-time or near-real-time analytics dashboard and alerts for OSRTC staff (planners, managers).  | “Real-time visibility” implies a UI or reports for managers.               |
|                              | Support historical analysis & automated reporting (e.g. weekly reports on KPIs).                           | Not explicitly stated, but common analytics need.                           |
|                              | Ensure data privacy/compliance (e.g. no personal passenger data misuse).                                   | Government context requires secure handling; not in PS but required.       |
| **Proposed (beyond PS)**     | Actionable recommendations (e.g. “reassign Bus #X to Route Y at 5pm because demand outstrips capacity”).   | Adds user guidance beyond PS requirements.                                 |
|                              | Explainable alerts (with evidence) rather than black-box predictions.                                      | Desirable for adoption; ensures users trust the system.                    |
|                              | Integration with existing OSRTC systems (e.g. ITMS, e-ticketing, ICCC) if possible.                        | To avoid duplicating interfaces, improve uptake.                           |
|                              | Mobile/field capability (e.g. SMS/email alerts or simple app for staff).                                  | OS context: field staff may need low-footprint access.                     |
| **Unverified Assumptions**   | Quality and completeness of underlying data (e.g. are ticket/maintenance logs digitized?).                | Assumes adequate data capture; must be confirmed with OSRTC/ITMS.         |
|                              | OSRTC’s current systems (ITMS, OPRS, etc.) allow data export or API access.                              | Needs checking; if systems are closed, integration may be hard.           |
|                              | Budget or stakeholder buy-in for new analytics (beyond hackathon pilot).                                  | PS is hackathon call; actual implementation would need capital.            |
|                              | Connectivity: buses/depot have reliable data links to upload ETM/GPS data daily.                         | Many rural routes have weak telecom; offline sync may be needed.           |
|                              | Stable definitions for “demand”, “breakdown”, “revenue leakage” exist.                                    | We’ll need to define metrics (e.g. what counts as a “leakage”).           |

# Current-State Workflow  

The end-to-end OSRTC process can be summarized as follows:

```mermaid
flowchart LR
    A[Route Scheduling & Bus Dispatch] --> B[Bus Departs on Scheduled Trip]
    B --> C{Ticketing \n(ODPRS, Counters, On-board)}
    subgraph Ticketing and Data Capture
        C --> D[Online Ticketing System (OPRS)] 
        C --> E[Counter Ticket Booking]
        C --> F[On-board ETM (Electronic Ticket Machine)]
    end
    B --> G[GPS Telemetry Recorded on Board]
    B --> H[Maintenance Events Logged (Post-trip)]
    D --> Z[Ticket Sales Data] 
    E --> Z
    F --> Z
    G --> Y[Vehicle Position/Speed Logs]
    H --> M[Maintenance Log Data]
    Z --> I[Data Consolidation & Reporting] 
    Y --> I
    M --> I
    I --> J[Analyst Review & Alerts]
    J --> K[Management Dashboard]
    K --> L[Decisions: e.g. Reassign Bus, Schedule Repairs]
    L -->|Feedback| A
```

- **Steps 1–3**: *Planning & Ticketing*. OSRTC planners create bus schedules and allocate vehicles (A). Tickets are sold via (i) the OSRTC Online Reservation system, (ii) depot counters, and (iii) on-board electronic ticket machines (ETMs). OSRTC’s app and system allow **real-time online booking and GPS tracking**, but ticket sales from ETMs (conductors) may sync later.
- **Steps 4–6**: *Operations & Data Generation*. During each trip, buses generate data: GPS telemetry for location/speed (G→Y), ticket and revenue data (from ETM and reservations) (C→Z), and any maintenance/repair events (H→M). Currently, these data streams are mostly siloed.
- **Steps 7–8**: *Post-Trip Consolidation*. Periodically (daily or weekly), collected data are manually consolidated (I). OSRTC staff may run **manual reports** (e.g. weekly route performance, revenue summaries) and identify exceptions (J). For example, they might notice a route’s revenue is lower than expected but tracing the cause requires manual cross-checks.
- **Steps 9–10**: *Decision & Feedback*. Managers see reports/dashboards (K). They may decide to reassign buses, schedule repairs, or investigate missing revenue. These decisions loop back to planning (L→A).

**Failure points and pain**: Manual consolidation causes delays and errors. For example, if a conductor’s handheld ETM loses connectivity, that trip’s revenue may not appear in timely reports (“leakage”). Forecasts are absent, so fleets may be under- or over-utilized. The minister’s report (Mar 2025) highlights 109 buses out of service, implying maintenance tracking is inadequate. Overall, the current workflow depends on human intervention at each stage, which leads to inefficiencies and missed opportunities to act proactively.

# Competitor and Solution Landscape  

No known commercial solution specifically targets *OSRTC-style* operations intelligence in Odisha. However, analogous products exist:

- **Fleetx.io (India)** – AI-powered fleet & logistics platform.  It ingests IoT and vehicle data to provide real-time analytics and predictive maintenance.  Fleetx touts use of ML to monitor vehicle health and optimize operations for *“logistics and transportation”*, explicitly listing **passenger transit** among its sectors.  Its features (data integration, AI, dashboards) overlap with PS#182 goals.  *Evidence*: (Startup profile).
- **Generic Fleet Management Systems** (international) – Companies like Geotab, Verizon Connect, TrakNTell, LocoNav etc. provide telematics and basic analytics for commercial fleets.  These typically focus on asset tracking, fuel usage, driver safety, and maintenance scheduling.  However, they rarely include public-transit-specific modules like demand forecasting or ticket-revenue reconciliation.  *Evidence*: Industry overviews (e.g. Geotab solves tracking/maintenance); no specific Odisha case found.
- **Transit Scheduling Software** – Products like Trapeze Group or TriMet’s TFS handle fixed-route scheduling, but OSRTC already has schedule data; the gap is analytics on usage.
- **Public-Sector Pilots** – No documented Odisha/India case of a pilot for bus-analytics (the OSRTC ITMS itself is a digital command center, but it appears focused on tracking and e-ticketing, not on predictive analytics). Some smart-city projects include transit data hubs, but adoption in Odisha is unclear.

**Competitive Gap**: Existing tools cover pieces (GPS tracking, e-ticketing) but not **integrated analytics with actionable recommendations**. Our solution can differentiate by proving specific ROI: e.g. *“we found a 10% revenue shortfall on Route X and traced it to unsynced ETM data, recommending a mobile router upgrade”*, whereas generic dashboards wouldn’t highlight the root cause. 

| **Competitor**    | **Product/Focus**                             | **Features**                                    | **Deployments/Evidence**                              | **Limitations**                           |
|-------------------|-----------------------------------------------|-------------------------------------------------|-------------------------------------------------------|-------------------------------------------|
| *Fleetx.io (India)* | Fleet management & predictive analytics (IoT platform) | ML-based maintenance alerts; real-time dashboard; cloud platform | Used by logistics fleets (no public transit case found) | Large-scale; likely costly; not tailored to bus transit specifics |
| *Geotab/Teletrac/etc.* (Global)    | Vehicle telematics (GPS + diagnostics)     | GPS tracking, engine data, driver safety, basic reports         | Widely used in trucking and municipal fleets         | Focus on commercial logistics; no transit demand modeling |
| *OSRTC’s ITMS/ICCC (internal)* | Internal OSRTC system for tracking & e-ticketing | GPS-based tracking; e-ticketing; grievances; scheduling     | Existing implementation in Odisha       | Appears not to include cross-data analytics or ML |
| *Custom In-House Solutions* | (Hypothetical)                                | Excel/PDF reports, manual KPIs                         | Common in many STUs                                    | Labor-intensive; error-prone; not data-driven |

*Note:* The above are illustrative. We found no public cases of a vendor specifically serving OSRTC or Odisha STUs with advanced analytics. 

# Procurement and Contracts  

We searched Odisha and national procurement portals (e-procurement Odisha, GeM, CPPP) for OSRTC or Odisha STU tenders related to telematics, analytics, or maintenance. **No direct tenders for a unified analytics solution were found**. OSRTC’s procurements recently focus on buses and components, rather than software (e.g. state‑run Volkswagen chassis contracts, GPS devices, etc.). It’s possible that OSRTC procures hardware (ETMs, GPS modules) under broader ICT tenders, but these are not publicly detailed. 

For example, the *Annual Report 2023-24* (Commerce & Transport Dept.) and news items emphasize fleet expansion and maintenance needs, but do not mention analytics procurements. No Odisha government contract award or GeM entry could be identified for AI or BI tools for OSRTC. This suggests either in-house development or partner-specific solutions for data handling. Further investigation (e.g. OSFIC contacts) is needed to learn if OSRTC plans any specific pilot or tender on this topic.

# Demand and Need Validation  

- **Confirmed problem existence:** OSRTC’s own statements show significant pain points. The losses and out-of-service buses confirm that inefficiencies in operations and maintenance have economic impact. The OSFIC challenge itself implies government attention to this gap.  
- **Recurring pain evidence:** The CAG report cited in the news highlighted rising costs (fuel, benefits) as factors, but underlying data systems are not specifically audited. No repeated public complaints about forecasting, but frequent delays or cancellations (109 bus failures) indicate breakdowns are common. The SKOCH awards (2018,2019) for ticketing and fuel efficiency suggest prior attempts at modernization, but the continued losses imply unmet needs.  
- **Economic impact:** OSRTC’s deficits (₹18.8–26.6 cr per year) dwarf its typical IT budget. Even small efficiency gains (e.g. reducing a few percent of wasted revenue) could justify a data solution. With ~₹156 cr revenue (FY23-24), a 1% revenue leakage is ₹1.5 cr. Detecting and preventing such leaks or maintenance issues could pay for the solution many times over.  
- **Willingness to invest:** The government is clearly concerned about OSRTC’s viability (Assembly questions, media coverage). If a hackathon team can show proof of value on a small scale, the Transport Dept. or OSRTC leadership might be motivated to pilot it. However, OSRTC’s existing adoption of GPS and e-ticketing suggests they are not resistant to tech, which bodes well.  

Overall, demand appears **moderate to high**: OSRTC has urgent problems, and the public sector benefits from improved service reliability. The main question is budgeting priority: cheaper fixes (more buses, staff) often get attention; analytics is a less obvious investment. But strong evidence like budget losses and bus downtime should make this a credible proposal.

# Barriers and Adoption Risks  

- **Data access and quality:** If OSRTC’s data (ticket logs, GPS, maintenance records) cannot be accessed (e.g. locked in proprietary systems), the solution cannot function. We have no evidence of open APIs; for example, OSRTC’s app shows data to customers, but backend access is unclear. *Mitigation:* Work with sample or synthetic data, validate approach conceptually, and if possible liaise with OSRTC IT staff to confirm data availability. *(Grade: Critical, unverified.)*

- **Connectivity & Infrastructure:** Some remote routes have poor mobile coverage. ETMs may not sync daily, GPS trackers may drop. This reduces “real-time” aspect. *Mitigation:* Design for offline/batch mode (e.g. allow input of delayed data; focus on strategic decisions not minute-by-minute tracking). *(Grade: High risk, common in STUs.)*

- **Procurement/Policy:** Government procurement rules (e.g. preferring certain firms or platforms) could favor in-house development or big vendors. Also, once an incumbent system (like ITMS) is in place, departments may resist a new solution unless clearly superior. *Mitigation:* Frame solution as a pilot or tool to augment existing systems, not replace them. Highlight open-source tools and in-house expertise to reduce procurement friction. *(Grade: Medium risk.)*

- **Technical feasibility:** Developing robust ML models (for forecasting or failure prediction) requires sufficient historical data. OSRTC’s data volume may be limited (e.g. only a few years of digitized records). Models may have low accuracy early on. *Mitigation:* Use explainable models and show conservative benefits (e.g. a rule-based flag or simple regression for initial demo). *(Grade: Medium.)*

- **User adoption:** OSRTC staff may be unfamiliar with data-driven workflows. If the prototype is too complex or “black box”, they may distrust it. *Mitigation:* Focus on transparency (show the data behind every alert) and train a pilot user group. *(Grade: Low, if solution is well-explained.)*

- **Competition:** A large startup or in-house ICT team could build a similar tool faster. However, we have found no direct evidence of a funded analytics project currently. The hackathon approach (small team, quick prototype) may outpace typical government pace. *(Grade: Low.)*

# Technology Landscape and Feasibility  

Potential tech approaches include:  
- **Data Platform:** Likely a relational database (PostgreSQL/MySQL) or data warehouse to consolidate ticket, trip, GPS and maintenance data. This can be fed via ETL scripts. For hackathon, a simple CSV-based prototype is sufficient.  
- **Analytics/ML:**  
  - *Demand Forecasting:* Time-series models (ARIMA, Prophet) or simple regression on historical ridership by route/time. This is moderate-maturity technology; many open-source libraries exist. Data needed: past ticket counts vs date/time/features. (Feasibility: Medium. If no data, can simulate a pattern.)  
  - *Fleet Optimization:* Linear programming or heuristic algorithms (e.g. adjust bus allocations based on forecast variance). Probably rule-based suggestions (e.g. “8 AM Route 12 is over capacity; add one bus”) since an exact solver is complex. (Feasibility: Medium; prototypes possible with OR-tools, but simplified may suffice.)  
  - *Predictive Maintenance:* With data on past breakdowns, mileage, etc., one could use classification (e.g. train decision tree to flag at-risk buses). In practice, STUs seldom have detailed sensor logs, but may have repair history. (Feasibility: Low to Medium, depends on data quality. Many STUs have limited predictive maintenance.)  
  - *Revenue Reconciliation:* This is straightforward rule-based logic: match OPRS sales vs ETM revenue vs cash. If mismatches exceed a threshold, flag. (Feasibility: High; minimal tech needed, just data merge.)  
- **UI/Integration:** A web dashboard (React/Next.js, or even Streamlit) to display schedules, alerts, and evidence behind them. This can run on a laptop or AWS. (Feasibility: High; plenty of tools, just design work.)  

**Key dependencies:** Access to representative datasets. If unavailable, we plan to use synthetic data patterned after typical STU numbers (guided by OSRTC’s scale and award reports). Connectivity is not an issue for a prototype (we simulate offline/online as needed). The main tech risk is scope creep – we must focus on one or two analytics capabilities for MVP. Deep learning is unnecessary; transparent methods are safer.

In summary, **technical feasibility is high** for a prototype addressing the core need. Required skills: data engineer, ML engineer, and a software developer. All tools (Python, Pandas, scikit-learn, SQL, JavaScript) are mature and accessible. We do *not* need cutting-edge AI; even basic statistical forecasting and rule-based logic will outperform the current manual approach.

# Innovation Gaps and Solution Differentiation  

Existing systems (ITMS, spreadsheets) handle individual tasks, but the **gap** is _combining_ them into a unified, actionable system. For each PS requirement:  

- *What’s done today?* OSRTC uses e-ticketing and ETMs for sales, and GPS units for tracking, but these run in parallel. After trips, managers manually reconcile financials and inspect schedules. Forecasting is likely ad hoc (based on planner experience).  
- *Remaining problem:* No automated cross-analysis. E.g. a bus might consistently run half-empty on certain days, but this is discovered only in hindsight. A conductor might sell fewer tickets than expected on a route, but discrepancies are spotted only after tallying cash. Maintenance is reactive rather than predictive.  
- *Evidence of gap:* The Rs45cr loss despite revenue growth implies costs or inefficiencies (e.g. idle buses, extra fuel use) remain hidden. 109 idle buses highlight lost revenue from maintenance gaps.  
- *Why not solved?* Possibly due to lack of integrated software and data analysis skills in-house. OSRTC’s ITMS focuses on front-end services (tracking, tickets) not on analytics. Commercial fleet solutions are generic. The problem is partly **institutional** (processes not structured for analytics) and partly **technical** (no tool).  
- *Needed improvements:* 1) **Data integration layer** – connect OPRS, ETM, GPS, maintenance systems. 2) **Analytical rules/ML** – to spot anomalies and forecast demand. 3) **Explainable alerts** – each flag comes with “evidence” (e.g. graphs, raw numbers). 4) **User workflow** – prioritize the most actionable insights (e.g. top 5 revenue leaks or fleet reassignments).
- *Measurable targets:* For example, reduce monthly unreconciled revenue by X%; increase vehicle utilization by Y%; reduce breakdowns by Z%.  (Precise numbers need real data; as targets we might say “in the prototype, demonstrate detection of at least 80% of injected anomalies.”)

The *most defensible gap* is **operational decision support**. We focus on the one capability that is hard today: e.g. real-time demand shifts + corresponding schedule adjustments. For instance, if on Monday mornings the actual boardings are 20% below forecast for a route, the system can flag underutilization and recommend cutting one trip. This is not easily done by current practice.  

# Solution Strategies  

We propose three progressive approaches (A → B → C):

## Strategy A – Minimal Viable Prototype (MVP)  
- **Scope:** Build a simple dashboard that loads sample data and generates one actionable output. E.g. focus on *revenue reconciliation*.  
- **Features:** Import CSVs of ticket sales (OPRS vs ETM) and report mismatches. Highlight any trip where `TicketsSold - (CashCollected + OnlinePayment)` ≠ 0. Provide drill-down on that trip’s data. Add one basic demand forecast chart (e.g. next-week projection vs last-week actual).  
- **Tech:** Python (Pandas) to process data; a simple Flask/Streamlit UI for display. No machine learning – just calculations.  
- **User Workflow:** A manager uploads or views the latest data and sees immediate flags like “Route 5, 14-Oct-2026: ₹2,000 unexplained revenue gap.”  
- **Differentiation:** Even this shows an improvement: current process would require manually comparing multiple records.  
- **Prototype effort:** ~2–3 person-weeks (1 dev, 1 data person). Uses hardcoded/simulated data.  

## Strategy B – Enhanced Analytics Prototype  
- **Scope:** Add at least one predictive or optimization component. Extend MVP to include *demand forecasting* and/or *maintenance alerts*.  
- **Features:**  
  - Time-series forecasting for route demand: e.g. using Prophet to project ridership one week ahead. Display forecast vs actual.  
  - Vehicle utilization alert: identify buses that run below a threshold occupancy.  
  - (Optional) Basic maintenance risk: flag buses due for service based on mileage or age.  
  - The revenue reconciliation remains and is improved (e.g. auto-merge multiple trips, allow filtering by depot).  
- **Tech:** ML library (Prophet or statsmodels) for forecasts. Logic for usage metrics. Web UI updated (e.g. add charts).  
- **User Workflow:** Shows forecast charts (so planners can adjust schedules) plus prioritized alerts (e.g. top 3 revenue issues this week).  
- **Differentiation:** Demonstrates the “predictive” aspect. Explains each alert with data context.  
- **Prototype effort:** +2–4 person-weeks. Requires data simulation for training.  

## Strategy C – Production-Quality Design  
- **Scope:** Full product design for deployment in OSRTC. All MVP/B features plus infrastructure hardening.  
- **Features:**  
  - Data connectors/APIs to real systems (not just CSVs).  
  - User authentication and audit trail of actions.  
  - Integration with mobile (e.g. push alerts).  
  - Scalable to all routes and depots; more robust UI with filters.  
  - Possibly a basic optimization engine (e.g. suggest swapping buses between depots).  
- **Tech:** Cloud deployment (AWS/GCP), microservices, secured DB. More advanced ML (anomaly detection, clustering).  
- **Differentiation:** Ready-for-operation – meets data security and usability standards.  
- **Effort:** +3–6 months and more developers/engineers. Likely beyond hackathon, but a roadmap exists.  

Each strategy is centered on one critical outcome. The **single most important capability** is an **Explainable Alert + Recommendation**.  For example, detecting a revenue gap on a trip and telling the user “Mismatch in Route 12 on 14th: ₹1500 missing because ETM sync failed; recommend manual review or a duplicate sale.” That explainability (with data evidence) is key to adoption.

# Implementation Plan (Stages and Timeline)  

**Team:** 1–2 developers (full-stack), 1 data engineer/analyst, and a domain lead. Optionally 1 UX designer for dashboards.

**Stages:**  
- *Stage 1: Requirement Validation (1–2 weeks).*   Verify with OSFIC/OSRTC contacts exactly which data fields are available, and refine use-case priority (e.g. demand vs. revenue). Identify any pilot partner (a depot manager).  Create a detailed spec.  
- *Stage 2: Proof of Concept (3–4 weeks).*   Use synthetic or open transit data (e.g. from a city bus dataset) to build core analytics. Test basic forecasting and reconciliation logic in Jupyter notebooks.  
- *Stage 3: Functional Prototype (4–6 weeks).*   Develop end-to-end system (combine backend and simple UI). Focus on Strategy A or B features (revenue and one predictive feature). Validate the prototype with a mock scenario (scripts simulate data anomalies to test alerts).  
- *Stage 4: Controlled Validation (2 weeks).*   Present prototype to potential users (OSFIC mentors or transit experts). Incorporate feedback on usability. If possible, pilot with a small OSRTC data sample (even anonymized).  
- *Stage 5: Pilot Deployment (4–6 weeks).*   (Conditional – beyond hackathon scope) Deploy on a test server; connect to live data from one depot if possible; measure actual improvements (e.g. cases detected).  
- *Stage 6: Production Hardening.*   Secure, scale, prepare documentation for OSRTC handover.  

**Effort and Resources:** For hackathon prototype (Stages 1–4): roughly 3–4 person-months total. Use open-source tools (Python, Node/React, PostgreSQL). Minimal hardware (standard laptops or cloud free-tier). Emphasize modular code so Strategy B/C can build on it later.

**Costs:** Mostly labor (student time). No significant licensing fees. Cloud hosting could be done on free tiers or university servers. If funding available, some budget (~₹50k) for incidental services (e.g. AWS credits, data acquisition).

# Business Case and Market  

- **Primary Buyer:** Odisha Department of Commerce & Transport / OSRTC. The “budget owner” is state transit budget. OSRTC staff are daily users.  
- **Value Proposition:** Save costs by reducing avoidable trips, cutting breakdowns, and recovering lost revenue. Soft benefits: better service reliability (fewer cancellations) boosting ridership, less staff time spent on reports.  
- **Indian STU Market:** ~40+ State Transport Undertakings exist (e.g. APSRTC, KSRTC, etc.), many with similar issues. A solution productized beyond Odisha could serve others as well. Odisha may also have other local public fleets (city buses via Puri Cuttack MCM, etc.) who could be customers or pilot sites.  
- **Revenue Model:** For a startup, options include an outright sale to OSRTC (unlikely, given state budgets) or a SaaS/AMC model. More likely, an enterprise licensing with annual maintenance fee. If targeting multiple STUs, perhaps a Per-vehicle or Per-route fee.  
- **Addressable Customers in Odisha:** Primarily OSRTC (1), then e.g. Bhubaneswar BRTS (if any) and bus contractors. Nationally, APSRTC (10k+ buses) has even bigger scale, or private intercity operators.  
- **Procurement Path:** Likely via state ICT tender or direct negotiation if under an innovation scheme. OSFIC runs like this suggest even if hackathon wins, integration into OSRTC systems would need official approval.  
- **Barriers:** Long sales cycle (government), need to align with existing vendor (NIC’s e-ticket system maybe). But initial traction is easier as a **technology demonstration** via OSFIC.  
- **Market size (Odisha):** OSRTC revenue ₹156 cr (FY24). If analytics solution reduced costs by 1%, that’s ₹1.5 cr annual value. Adding improvement in service could drive more tickets (and state subsidy reduction). Extrapolate to India: Public transport vehicles ~50,000 (state+private), if even 10% adopt analytics, TAM could be tens of crores per year. But realistically start with Odisha/neighboring states.  

# Risks and Uncertainties (Evidence Grades)  

| **Claim / Question**                                    | **Source / Evidence**                                 | **Grade** | **Confidence** | **Notes**                                    |
|---------------------------------------------------------|-------------------------------------------------------|-----------|--------------|----------------------------------------------|
| OSRTC fleet: 577 mainline + 1422 rural buses | Wikipedia (Govt data)                                | B         | High         | Official numbers (cited in Annual Report)    |
| OSRTC revenue: ₹156.43cr (FY23-24)         | Odisha TV (quotes Minister’s data)        | A         | High         | News quoting official reply                   |
| OSRTC losses: ₹45.46cr over two years     | Odisha TV                                             | A         | High         | Verified by Assembly reply                   |
| 109 buses inoperable (past decade)         | Odisha TV                                             | A         | High         | Assembly reply                              |
| ITMS system provides tracking & e-ticketing | Wikipedia (Citing Govt sources)                      | B         | Medium       | Official initiative but not deeply documented |
| OSRTC app features: e-booking + live GPS    | Google Play (official app description)                | C         | High         | Confirms functionalities, but marketing-only |
| Need for demand forecasting (OSFIC text)                | OSFIC problem statement (user-supplied)              | A (given)  | High         | Directly stated                           |
| Existing solutions (Fleetx) use AI/IoT for fleets | Startup profile on IndiaAI (semi-official)          | B         | Medium       | Self-reported                              |
| OSRTC's problems not already solved                     | Inference from above                                   | C         | Medium       | No conflicting sources found                |
| Data availability (ticketing, GPS, maintenance)         | *Unknown in sources*                                  | D         | Low          | We must verify; possible gap                 |
| State support for innovation                            | OSFIC program evidence                                | B         | High         | State launched OSFIC challenge              |

_Grades:_ A = official government or equivalent; B = reputable journalism or institutional source; C = vendor claims or wiki; D = hypothesis/inference.  

# Recommendations and Next Steps  

Based on the above, **Problem #182 is a promising OSFIC challenge** with clear real-world need. We recommend:

1. **Focus the hackathon prototype on a single high-impact use-case.**  Likely **revenue reconciliation** or **fleet utilization alert**. For example: “detect a persistent revenue shortfall on specific routes”. This can be fully demonstrated with fake data and shows clear business value (money on the table).  

2. **Build an explainable dashboard as the deliverable.**  Show raw data (trip lists, GPS logs) behind each alert.  Keep the user interface simple (web app or PowerBI).  

3. **Prepare data samples and edge-case scenarios.**  Since real OSRTC data is unavailable without partnership, the team should simulate data that include anomalies: e.g. an ETM that drops tickets, a bus that breaks down, weekend vs. weekday demand patterns.  Justify these scenarios with references (e.g. Odisha TV report on breakdowns).  

4. **Verify critical assumptions ASAP.**  Contact OSRTC/Dept officials to confirm (a) what data exist, (b) whether they perceive demand forecasting or revenue leakage as a priority, and (c) if any competitors or pilots are known internally.  This will guard against building irrelevant features.  

5. **Plan for feasibility in 30 days:**  
   - Weeks 1–2: Finalize problem focus; generate sample dataset; sketch system design.  
   - Weeks 3–4: Develop backend analytics (rules/forecasts) and a minimal UI; iterate quickly.  
   - At each stage, seek feedback from mentors or domain experts (e.g. transport planners).  

If the proof-of-concept demonstrates a clear advantage (e.g. “our system caught X% more lost revenue than manual checks”), we can approach OSRTC for a pilot or mentorship via OSFIC.  Otherwise, we will have at least a strong showcase of analytics capabilities. 

**Critical reminder:** This solution is **data-driven**, not just AI-for-AI’s-sake. Every claim in the prototype must be linked to data evidence. Do *not* over-promise; for instance, avoid unsubstantiated AI predictions. Emphasize how even simple analytics (e.g. “80% accuracy in forecasting” with synthetic tests) improve on current practice. 

# References  

- OSRTC background: *“Odisha State Road Transport Corporation (OSRTC)… connecting major cities…”*.  
- Official problem context: OSFIC 2026 problem catalogue (Government of Odisha) – *Problem statement #182 text (user-supplied)*.  
- OSRTC finances: “OSRTC faces Rs 45.46 crore loss over two years… revenue rising from Rs 145cr to Rs 156.43cr.” – *Odisha TV news (Mar 2025)*.  
- Inoperable buses: *“Mechanical failures have rendered 109 buses inoperable”* (Assembly reply quoted in Odisha TV).  
- Existing IT systems: *“ITMS… real-time fleet tracking, e-ticketing, automated scheduling…”* (OSRTC Wiki).  
- OSRTC App features: *“OSRTC OPRS Online Ticket Booking… Live Tracking Long/Short journey Buses”* (Google Play description).  
- Competitor Fleetx: *“Fleetx.io is an AI-driven fleet management… platform… for logistics and passenger transit”* (startup profile).  
- SKOCH Awards: OSRTC won “Web-based Ticketing System…” and “ETM ticketing” awards, indicating partial digital modernization.  
- Government procurement: No specific tender found; OSFIC portal (Govt of Odisha) requires login (not accessible publicly) – *verification pending*. 

All sources accessed Oct 2026. Sources are grade A/B/C as noted above. Unverified points have been flagged for further confirmation.