// ═══════════════════════════════════════════════════════════════════════════
//  VAP 2026 — Google Apps Script
//  Paste this into: Google Sheet → Extensions → Apps Script → paste → Save
//  Then: Add trigger → onFormSubmit → From spreadsheet → On form submit
// ═══════════════════════════════════════════════════════════════════════════

// ── YOUR SUPABASE CONFIG ────────────────────────────────────────────────────
const SUPABASE_URL = 'https://ymprftmrojvmuvklyjay.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltcHJmdG1yb2p2bXV2a2x5amF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0NzIyMTgsImV4cCI6MjA1ODA0ODIxOH0.r7eFfUBDqM5PPhKm_dqSMD9mdGVPgPRw29MujyF6jQg';

// ── COLUMN MAPPING ──────────────────────────────────────────────────────────
// Based on your Google Sheet columns (adjust index if order differs):
// Col 0  = Timestamp
// Col 1  = Email Address (personal)
// Col 2  = Full Name
// Col 3  = Email Address (college/alternate)
// Col 4  = Contact Number
// Col 5  = USN / Registration Number
// Col 6  = Department
// Col 7  = Year of Study
// Col 8  = Are you from Biomedical/Signal Processing?
// Col 9  = Brief Description of Project & Title
// Col 10 = Project Status
// Col 11 = Prior knowledge in MATLAB?
// Col 12 = Topics comfortable with
// Col 13 = Interested Areas
// Col 14 = Willing to work on mini-project?
// Col 15 = Able to attend 3 days?
// Col 16 = Actively participate in hands-on?
// Col 17 = Declaration

function onFormSubmit(e) {
  try {
    const values = e.values; // Array of all column values in order

    const participant = {
      timestamp:        values[0]  || '',
      email:            values[1]  || '',
      name:             values[2]  || '',
      college_email:    values[3]  || '',
      phone:            values[4]  || '',
      usn:              (values[5] || '').toString().trim().toUpperCase(),
      department:       values[6]  || '',
      year:             values[7]  || '',
      biomedical_bg:    values[8]  || '',
      project_title:    values[9]  || '',
      project_status:   values[10] || '',
      matlab_knowledge: values[11] || '',
      topics:           values[12] || '',
      interested_areas: values[13] || '',
      willing_miniproj: values[14] || '',
      can_attend:       values[15] || '',
      hands_on:         values[16] || '',
      declaration:      values[17] || '',
      created_at:       new Date().toISOString(),
    };

    // Skip if USN is empty
    if (!participant.usn) {
      Logger.log('Skipped: No USN found');
      return;
    }

    // Push to Supabase (upsert — won't duplicate if same USN submits again)
    const response = UrlFetchApp.fetch(
      SUPABASE_URL + '/rest/v1/vap_participants',
      {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'apikey':         SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
          'Prefer':         'resolution=merge-duplicates', // upsert on USN conflict
        },
        payload: JSON.stringify(participant),
        muteHttpExceptions: true,
      }
    );

    const code = response.getResponseCode();
    Logger.log('Supabase response: ' + code + ' — ' + response.getContentText());

    if (code >= 200 && code < 300) {
      Logger.log('✅ Participant pushed: ' + participant.name + ' (' + participant.usn + ')');
    } else {
      Logger.log('❌ Failed to push participant. Code: ' + code);
    }

  } catch (err) {
    Logger.log('❌ Error in onFormSubmit: ' + err.toString());
  }
}

// ── MANUAL SYNC — run this once to push all existing rows ──────────────────
function syncAllExistingRows() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const data = sheet.getDataRange().getValues();

  // Skip header row (row 0)
  for (let i = 1; i < data.length; i++) {
    const values = data[i];
    if (!values[0]) continue; // skip empty rows

    const participant = {
      timestamp:        values[0]?.toString() || '',
      email:            values[1]  || '',
      name:             values[2]  || '',
      college_email:    values[3]  || '',
      phone:            values[4]  || '',
      usn:              (values[5] || '').toString().trim().toUpperCase(),
      department:       values[6]  || '',
      year:             values[7]  || '',
      biomedical_bg:    values[8]  || '',
      project_title:    values[9]  || '',
      project_status:   values[10] || '',
      matlab_knowledge: values[11] || '',
      topics:           values[12] || '',
      interested_areas: values[13] || '',
      willing_miniproj: values[14] || '',
      can_attend:       values[15] || '',
      hands_on:         values[16] || '',
      declaration:      values[17] || '',
      created_at:       new Date().toISOString(),
    };

    if (!participant.usn) continue;

    UrlFetchApp.fetch(
      SUPABASE_URL + '/rest/v1/vap_participants',
      {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'apikey':         SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
          'Prefer':         'resolution=merge-duplicates',
        },
        payload: JSON.stringify(participant),
        muteHttpExceptions: true,
      }
    );

    Logger.log('Pushed row ' + i + ': ' + participant.name);
    Utilities.sleep(300); // avoid rate limiting
  }

  Logger.log('✅ Sync complete. ' + (data.length - 1) + ' rows processed.');
}
