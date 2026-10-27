Add-Type -AssemblyName System.Speech

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = 0  # Standard clear speaking pace

# Select a voice (David or Zira)
$voices = $synth.GetInstalledVoices()
foreach ($v in $voices) {
    if ($v.VoiceInfo.Name -like "*David*" -or $v.VoiceInfo.Name -like "*Zira*") {
        $synth.SelectVoice($v.VoiceInfo.Name)
        Write-Host "Selected Voice: $($v.VoiceInfo.Name)"
        break
    }
}

$prompt = New-Object System.Speech.Synthesis.PromptBuilder

# -------------------------------------------------------------
# SCENE 1: 0:00 – 0:22 | Command Center
# -------------------------------------------------------------
$prompt.AppendText("Welcome to Drishti, the operations intelligence console engineered for the Odisha State Road Transport Corporation.")
$prompt.AppendBreak([TimeSpan]::FromSeconds(1))
$prompt.AppendText("OSRTC's ticketing, remittance, GPS telemetry, and workshop logs traditionally operate in disconnected silos. Drishti joins them into a single, trip-level truth: 5.76 crore rupees of revenue over 30 days, 3.45 lakh rupees at risk, and alerts ranked strictly by rupee impact rather than arbitrary frequency.")
$prompt.AppendBreak([TimeSpan]::FromSeconds(5))

# -------------------------------------------------------------
# SCENE 2: ~0:25 – ~0:55 | Revenue Integrity
# -------------------------------------------------------------
$prompt.AppendText("Moving to Revenue Integrity. Our core operational law is: every alert shows its rows, its rule, and its rupees.")
$prompt.AppendBreak([TimeSpan]::FromSeconds(1))
$prompt.AppendText("Clicking the top alert opens the audit evidence drawer: raw GPS breadcrumbs proving the bus operated the route, the missing ETM shift, the exact boolean rule trace, and 4,260 rupees fare loss, with injected ground truth proving 100 percent precision.")
$prompt.AppendBreak([TimeSpan]::FromSeconds(6))

# -------------------------------------------------------------
# SCENE 3: ~1:00 – ~1:25 | Case Management Workflow
# -------------------------------------------------------------
$prompt.AppendText("An alert nobody owns is just a chart. Drishti incorporates an actionable case workflow.")
$prompt.AppendBreak([TimeSpan]::FromSeconds(1))
$prompt.AppendText("Here, the case is moved to Acknowledged, assigned to a depot recovery officer, and saved immutably. Crucially, closing a case never mutates the underlying telemetry or financial detection data.")
$prompt.AppendBreak([TimeSpan]::FromSeconds(7))

# -------------------------------------------------------------
# SCENE 4: ~1:30 – ~2:00 | Demand Intelligence
# -------------------------------------------------------------
$prompt.AppendText("Next, Demand Intelligence.")
$prompt.AppendBreak([TimeSpan]::FromSeconds(1))
$prompt.AppendText("Drishti executes an additive Holt-Winters seasonal forecasting model in pure TypeScript, backtested on a 14-day holdout. Tomorrow's forecast predicts 383 boardings against 320 seats on Route 204, triggering an automated advisory to add two departures and capture 1.13 lakh rupees in fare demand.")
$prompt.AppendBreak([TimeSpan]::FromSeconds(6))

# -------------------------------------------------------------
# SCENE 5: ~2:05 – ~2:30 | Fleet Maintenance Risk
# -------------------------------------------------------------
$prompt.AppendText("In Predictive Maintenance, instead of waiting for roadside breakdowns on state highways, our risk engine computes an explainable 0 to 100 score: 30 percent service overdue, 25 percent breakdown history, 20 percent fleet age, 15 percent repeat repairs, and 10 percent recent faults.")
$prompt.AppendBreak([TimeSpan]::FromSeconds(1))
$prompt.AppendText("Supervisors prioritize bay overhauls before on-road failures occur.")
$prompt.AppendBreak([TimeSpan]::FromSeconds(6))

# -------------------------------------------------------------
# SCENE 6: ~2:35 – End | Data Quality & Verification
# -------------------------------------------------------------
$prompt.AppendText("Finally, the Data Quality console benchmarks our engines against 2,040 labeled ground-truth anomalies in real time: 100 percent precision, 100 percent recall, 96.9 percent rupee recall, and 9.76 lakh rupees detected. All 26 unit tests pass with zero network dependencies.")
$prompt.AppendBreak([TimeSpan]::FromSeconds(1))
$prompt.AppendText("Drishti delivers an explainable, trustworthy operations console for the Government of Odisha.")

$audioOutput = Join-Path $PSScriptRoot "..\docs\submission\drishti-narration.wav"
$synth.SetOutputToWaveFile($audioOutput)
$synth.Speak($prompt)
$synth.Dispose()

Write-Host "Narration successfully synthesized at: $audioOutput"
