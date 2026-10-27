# OSFIC 2026 Submission Deliverables Package — Drishti

This checklist maps each field of the **OSFIC 2026 Solution Submission Portal** directly to its corresponding file:

---

### Form Field 1: **Description \***
* **Constraint**: Max 15,000 characters
* **File to use**: [`docs/submission/DESCRIPTION.txt`](file:///e:/OSFIC/docs/submission/DESCRIPTION.txt)
* **Actual Character Count**: **10,918 characters** (well within limit)
* **Instructions**: Open [`DESCRIPTION.txt`](file:///e:/OSFIC/docs/submission/DESCRIPTION.txt), copy all content (`Ctrl+A`, `Ctrl+C`), and paste into the Description text box.

---

### Form Field 2: **Pitch Deck / Abstract & Approach Document (PPT/ PDF) \***
* **Constraint**: Max 5 MB
* **File to use**: [`docs/submission/pitch-deck.html`](file:///e:/OSFIC/docs/submission/pitch-deck.html)
* **File Size**: **35 KB** (renders under 2 MB when saved as PDF)
* **Instructions to convert to PDF**:
  1. Open [`pitch-deck.html`](file:///e:/OSFIC/docs/submission/pitch-deck.html) in any browser (Chrome / Edge / Firefox).
  2. Press `Ctrl + P` (or click the **"Export PDF"** button on the slide deck).
  3. Set Destination to **"Save as PDF"**, Layout to **"Landscape"**, check **"Background graphics"**.
  4. Save as `drishti-pitch-deck.pdf` and upload.

---

### Form Field 3: **Supporting Document (PDF)**
* **Constraint**: Max 5 MB
* **File to use**: [`docs/submission/SUPPORTING_DOCUMENT.md`](file:///e:/OSFIC/docs/submission/SUPPORTING_DOCUMENT.md)
* **Content**: Comprehensive 10-section report including Nygard-format ADRs (ADR-001 through ADR-004), Living Docs governance, Holt-Winters formulas, empirical scorecard, code tour, and implementation roadmap.
* **Instructions**: Can be converted to PDF via VS Code / Markdown PDF extension, or printed from browser/markdown reader.

---

### Form Field 4: **Image (.jpg, .png)**
* **Constraint**: Max 5 MB
* **Files provided (choose either)**:
  - **Option A (Live Dashboard Screenshot)**: [`docs/submission/hero-screenshot.png`](file:///e:/OSFIC/docs/submission/hero-screenshot.png) (376 KB)
  - **Option B (16:9 Dashboard Infographic Banner)**: [`docs/submission/hero-banner.jpg`](file:///e:/OSFIC/docs/submission/hero-banner.jpg) (690 KB)
* **Instructions**: Click "Choose File" on the portal and select either file.

---

### Form Field 5: **Video URL**
* **Guide & Script**: [`docs/submission/VIDEO_SUBMISSION_GUIDE.md`](file:///e:/OSFIC/docs/submission/VIDEO_SUBMISSION_GUIDE.md)
* **Instructions**:
  1. Record a quick 90-second screen capture following the script in [`VIDEO_SUBMISSION_GUIDE.md`](file:///e:/OSFIC/docs/submission/VIDEO_SUBMISSION_GUIDE.md).
  2. Upload to **YouTube** (set visibility to *Unlisted*) or **Google Drive** (set link sharing to *"Anyone with the link can view"*).
  3. Paste the URL into the form.

---

### Form Field 6: **Repository URL**
* **Local Repo Status**: Committed and clean (`master` branch).
* **Instructions to push to your GitHub**:
  ```bash
  # 1. Create a new repository on github.com (e.g. 'drishti-osrtc')
  # 2. Link your remote and push:
  git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
  git branch -M main
  git push -u origin main
  ```
  Then paste your GitHub repository link into the form.
