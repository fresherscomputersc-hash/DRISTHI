# Drishti — Video Submission & Demonstration Guide
**Odisha State Fast Impact Challenge (OSFIC 2026) · Problem Statement #182**

---

## 1. Quick Instructions for the "Video URL" Form Field

For the **Video URL** field in the OSFIC submission portal, provide a publicly accessible video link:
- **Recommended Option A**: **YouTube (Unlisted or Public)**  
  *Upload the video to YouTube, set visibility to "Unlisted", and paste the link.*
- **Recommended Option B**: **Google Drive**  
  *Upload the video, set Share Permissions to "Anyone with the link can view", and paste the link.*

---

## 2. 90-Second Walkthrough Video Script

Follow this structured, high-impact demonstration sequence (tested against the Drishti console):

### **0:00 – 0:15 | Command Center Overview**
* **On Screen**: `http://localhost:3001/` (Command Center)
* **Action**: Show top KPI cards (Fleet Availability 88%, Active Leakage ₹3.45L, Tomorrow Boardings 30,661), scroll past the alert feed, and hover over the **Synthetic Data Disclaimer Badge**.
* **Narration**:  
  > *"OSRTC's ticketing, remittance, GPS telemetry, and workshop logs traditionally operate in disconnected silos. Drishti joins them into a single, trip-level truth. This is the morning read: ₹5.76 Crore of revenue over 30 days, ₹3.45 Lakh currently at risk, and alerts ranked strictly by rupee impact rather than arbitrary frequency. The synthetic data badge guarantees transparent attribution—a judge never has to wonder."*

---

### **0:15 – 0:35 | Revenue Integrity & Audit Evidence Drawer**
* **On Screen**: `http://localhost:3001/revenue?days=90`
* **Action**: Click on the top alert row (e.g., *Trip #TR-89211 — Unrecorded Trip*). The Evidence Drawer slides out from the right.
* **Narration**:  
  > *"Our core law is: 'Every alert shows its rows, its rule, and its rupees.' Clicking any alert opens the audit evidence drawer. Here are the raw GPS breadcrumbs proving the bus operated the route, the missing ETM shift, the exact boolean rule that triggered, and the ₹4,260 fare loss. Next to the estimate is the injected ground truth—proving our 100% precision and 96.9% rupee recall are measured, not claimed."*

---

### **0:35 – 0:50 | Actionable Case Management Workflow**
* **On Screen**: Inside the open Evidence Drawer
* **Action**: Change Status dropdown to *Acknowledged*, select an Assignee, type a short note ("Depot recovery initiated"), and click **Save Case**. Show the confirmation banner.
* **Narration**:  
  > *"An alert nobody owns is just a chart. Drishti includes an operational case ledger. The case is assigned to a depot recovery officer, and the action is recorded immutably. Crucially, closing a case never alters the underlying detection data."*

---

### **0:50 – 1:05 | Demand Forecasting & Capacity Balancing**
* **On Screen**: `http://localhost:3001/demand`
* **Action**: Point to the top route surge card, show the Holt-Winters 7-day forecast chart with 80% confidence bands, and show the capacity shortage alert.
* **Narration**:  
  > *"The demand engine runs an additive Holt-Winters model in pure TypeScript with weekly seasonality, backtested on a 14-day holdout. Tomorrow's forecast predicts 383 boardings against 320 seats on Route 204—a 63-passenger deficit. Drishti automatically alerts planners to add two extra departures, capturing ₹1.13 Lakh in daily fare demand."*

---

### **1:05 – 1:20 | Fleet Breakdown Risk Roster**
* **On Screen**: `http://localhost:3001/fleet`
* **Action**: Click the highest-risk vehicle (e.g. Risk Score: 88/100). The vehicle breakdown drawer opens.
* **Narration**:  
  > *"Instead of waiting for buses to break down on highways like NH-16, our risk engine computes an explainable 0 to 100 score: 30% for service mileage overdue, 25% for breakdown history, 20% fleet age, 15% repeat repairs, and 10% recent faults. Workshop supervisors see exactly why the score is high and can schedule bay overhauls before on-road failures happen."*

---

### **1:20 – 1:30 | Data Quality & Verification Scorecard**
* **On Screen**: `http://localhost:3001/data-quality`
* **Action**: Highlight the scorecard (2,040 anomalies, 100% precision, 100% recall, 96.9% rupee recall, ₹9.76L detected).
* **Narration**:  
  > *"Finally, the Data Quality console benchmarks our engines against 2,040 labeled anomalies in real time. 26 of 26 automated unit tests are green. Drishti provides OSRTC with an explainable, deterministic, zero-network intelligence console to maximize revenue and serve the citizens of Odisha."*

---

## 3. Video Technical Specifications
- **Ideal Duration**: 90 seconds (Max: 2–3 minutes)
- **Resolution**: 1080p (1920×1080) or 720p (1280×720)
- **Audio**: Clear narration matching the script above
