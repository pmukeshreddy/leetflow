// Default settings (including default sheet URL)
const DEFAULT_SETTINGS = {
  sheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQNlOGHAZnG-51FtCEeJdG6WLCwlZXM6yE0WL2glIP9t8MJA00XSraGJy5-8GheEglFSSjokeo3NY0X/pub?output=csv',
  growthFactor: 2.0,
  maxInterval: 40,
  maxStage: 8,
  baseInterval: 1,
  leechThreshold: 3,
  maxDailyReviews: 15,
  studyDays: [0, 1, 1, 1, 1, 1, 1],
  // Time thresholds (in minutes) for auto-suggesting confidence
  timeThresholds: {
    easy: { mastered: 5, high: 15, medium: 30 },    // < 5min = Mastered, 5-15 = High, etc.
    medium: { mastered: 10, high: 25, medium: 45 },
    hard: { mastered: 20, high: 40, medium: 60 }
  }
};

// Initialize settings on first run
async function initializeSettings() {
  const { settings } = await chrome.storage.local.get('settings');
  if (!settings) {
    await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  }
}

// Migrate old data to new SRS format
async function migrateToSRS() {
  const { problems, migrated } = await chrome.storage.local.get(['problems', 'migrated']);

  if (migrated) return; // Already migrated

  if (!problems) {
    await chrome.storage.local.set({ migrated: true });
    return;
  }

  problems.forEach(p => {
    // Add new properties if they don't exist
    if (p.srsStage === undefined) p.srsStage = 0;
    if (p.lapses === undefined) p.lapses = 0;
    if (p.consecutiveSuccesses === undefined) p.consecutiveSuccesses = 0;
    if (p.isLeech === undefined) p.isLeech = false;
  });

  await chrome.storage.local.set({ problems, migrated: true });
  console.log('Migration to SRS completed');
}

// SINGLE initialization listener - removed duplicates
chrome.runtime.onInstalled.addListener(async () => {
  await initializeSettings();
  await migrateToSRS();
  await updateProblemList();
});

chrome.runtime.onStartup.addListener(updateProblemList);

// --- CORE FUNCTIONS ---

// Fetch problems from Google Sheet and merge with stored progress
async function updateProblemList() {
    // Get the sheet URL from settings
    const { settings } = await chrome.storage.local.get('settings');
    const GOOGLE_SHEET_URL = settings?.sheetUrl || DEFAULT_SETTINGS.sheetUrl;

    if (!GOOGLE_SHEET_URL || GOOGLE_SHEET_URL.trim() === '') {
        console.error('ERROR: No Google Sheet URL configured. Please set it in Settings.');
        return [];
    }

    try {
        const response = await fetch(GOOGLE_SHEET_URL);
        const csvText = await response.text();
        const sheetProblems = parseCSV(csvText);

        const { problems: storedProblems = [] } = await chrome.storage.local.get('problems');

        // Normalize URLs by removing trailing slashes
        const normalizeUrl = (urlStr) => urlStr.replace(/\/$/, '');

        // FIX: Proper merge with URL normalization
        const mergedProblems = sheetProblems.map(sheetProblem => {
            const existingProblem = storedProblems.find(p =>
                normalizeUrl(p.url) === normalizeUrl(sheetProblem.url)
            );

            if (existingProblem) {
                // Take sheet data but preserve user progress
                return {
                    ...sheetProblem,  // All sheet metadata (title, difficulty, topic, etc.)
                    // Preserve only progress properties:
                    srsStage: existingProblem.srsStage,
                    lapses: existingProblem.lapses,
                    consecutiveSuccesses: existingProblem.consecutiveSuccesses,
                    isLeech: existingProblem.isLeech,
                    status: existingProblem.status,
                    attempts: existingProblem.attempts,
                    lastConfidence: existingProblem.lastConfidence,
                    nextReviewDate: existingProblem.nextReviewDate
                };
            }
            return sheetProblem;
        });

        await chrome.storage.local.set({ problems: mergedProblems });
        console.log('Problem list updated successfully.');
        return mergedProblems;
    } catch (error) {
        console.error('Failed to fetch from Google Sheet:', error);
        return [];
    }
}

function parseCSV(text) {
    const rows = text.split('\n').filter(row => row.trim() !== '');

    // Parse header row using the same logic as data rows
    const headerRow = rows[0];
    const headers = [];
    let current = '';
    let inQuote = false;

    for (let i = 0; i < headerRow.length; i++) {
        const char = headerRow[i];

        if (char === '"') {
            if (!inQuote) {
                inQuote = true;
            } else {
                // Check if next char is also a quote (escaped quote)
                if (headerRow[i + 1] === '"') {
                    current += '"';
                    i++; // Skip the next quote
                } else {
                    inQuote = false;
                }
            }
        } else if (char === ',' && !inQuote) {
            headers.push(current.trim().toLowerCase());
            current = '';
        } else {
            current += char;
        }
    }
    headers.push(current.trim().toLowerCase());

    const problems = [];

    for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex];
        if (!row.trim()) continue;

        const values = [];
        current = '';
        inQuote = false;

        for (let i = 0; i < row.length; i++) {
            const char = row[i];

            if (char === '"') {
                if (!inQuote) {
                    inQuote = true;
                } else {
                    // Check if next char is also a quote (escaped quote)
                    if (row[i + 1] === '"') {
                        current += '"';
                        i++; // Skip the next quote
                    } else {
                        inQuote = false;
                    }
                }
            } else if (char === ',' && !inQuote) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());

        if (values.length === headers.length) {
            let problem = { status: 'Not Started', attempts: [] };
            headers.forEach((header, index) => {
                const value = values[index].startsWith('"') && values[index].endsWith('"')
                            ? values[index].slice(1, -1)
                            : values[index];
                problem[header] = value;
            });

            // Validation: only add if required fields exist
            if (problem.url && problem.title) {
                problems.push(problem);
            } else {
                console.warn('Skipped invalid row:', values);
            }
        }
    }
    return problems;
}

// Get next review date that falls on a study day
function getNextReviewDate(daysFromNow, studyDays) {
  // Check if ANY study days are selected
  const hasStudyDays = studyDays.some(day => day === 1);

  // If no study days selected, default to all days
  if (!hasStudyDays) {
    studyDays = [1, 1, 1, 1, 1, 1, 1];
  }

  let date = new Date();
  date.setDate(date.getDate() + daysFromNow);

  let attempts = 0;
  while (!studyDays[date.getDay()] && attempts < 14) {
    date.setDate(date.getDate() + 1);
    attempts++;
  }

  return date.toISOString().split('T')[0];
}

// --- MESSAGE LISTENER (from contentScript and popup) ---

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getProblems') {
        chrome.storage.local.get('problems').then(data => sendResponse(data.problems || []));
        return true; // Indicates async response
    }
    if (request.action === 'refreshProblems') {
        updateProblemList().then(problems => sendResponse(problems));
        return true; // Indicates async response
    }
if (request.action === 'submitAttempt') {
    const { url, time, confidence } = request.data;

    chrome.storage.local.get(['problems', 'settings']).then(data => {
            const problems = data.problems || [];
            const settings = data.settings || DEFAULT_SETTINGS;

            // Normalize URLs by removing trailing slashes for comparison
            const normalizeUrl = (urlStr) => urlStr.replace(/\/$/, '');
            const problemIndex = problems.findIndex(p => normalizeUrl(p.url) === normalizeUrl(url));

            if (problemIndex !== -1) {
                const problem = problems[problemIndex];

                // Save state for undo
                const undoState = {
                    problemUrl: url,
                    previousState: JSON.parse(JSON.stringify(problem)),
                    timestamp: Date.now()
                };

                // Update status
                problem.status = 'Solved';

                // Calculate new stage based on confidence
                let newStage = problem.srsStage || 0;

                if (confidence === 'low') {
                    // Reset to stage 1 (not 0, give them a small boost)
                    newStage = 1;

                    // Increment lapses if they've attempted before
                    if (problem.attempts && problem.attempts.length > 0) {
                        problem.lapses = (problem.lapses || 0) + 1;
                    }
                    problem.consecutiveSuccesses = 0;

                } else if (confidence === 'medium') {
                    // FIX ISSUE 2: Medium at Stage 0 advances to Stage 1
                    if (newStage === 0) {
                        // First time, give them a boost
                        newStage = 1;
                    } else if (newStage >= 2) {
                        // At higher stages, drop back one
                        newStage = newStage - 1;
                    }
                    // At Stage 1, stay at Stage 1
                    problem.consecutiveSuccesses = 0;

                } else { // high or mastered
                    // Advance one stage (but not above max)
                    newStage = Math.min(newStage + 1, settings.maxStage);

                    // Track consecutive successes for leech forgiveness
                    problem.consecutiveSuccesses = (problem.consecutiveSuccesses || 0) + 1;

                    // Forgive lapses after 3 consecutive successes
                    if (problem.consecutiveSuccesses >= 3) {
                        problem.lapses = 0;
                        problem.consecutiveSuccesses = 0;
                    }
                }

// Calculate interval with exponential backoff and cap
// Calculate interval with exponential backoff and cap
                const exponentialInterval = settings.baseInterval *
                                           Math.pow(settings.growthFactor, newStage);
                const cappedInterval = Math.min(exponentialInterval, settings.maxInterval);
                let intervalDays = Math.round(cappedInterval);

                // SMART LOAD BALANCING: Find a day with capacity
                const MAX_REVIEWS_PER_DAY = settings.maxDailyReviews || 15;
                let attempts = 0;
                let foundSlot = false;
                let candidateDate = null;

                while (attempts < 14 && !foundSlot) {
                    candidateDate = getNextReviewDate(intervalDays + attempts, settings.studyDays);

                    // Double-check this is actually a study day
                    const candidateDayOfWeek = new Date(candidateDate + 'T00:00:00').getDay();
                    if (!settings.studyDays[candidateDayOfWeek]) {
                        attempts++;
                        continue; // Skip non-study days
                    }

                    // Count how many problems already due on this date
                    const reviewsOnDate = problems.filter(p =>
                        p.nextReviewDate === candidateDate &&
                        normalizeUrl(p.url) !== normalizeUrl(url)
                    ).length;

                    if (reviewsOnDate < MAX_REVIEWS_PER_DAY) {
                        foundSlot = true;
                    } else {
                        attempts++;
                    }
                }

                // If all days full (unlikely), fallback
                if (!foundSlot) {
                    candidateDate = getNextReviewDate(intervalDays + Math.floor(Math.random() * 3), settings.studyDays);
                }

                // Final date (already validated as study day)
                const nextDate = candidateDate;

                // Update problem
                problem.srsStage = newStage;
                problem.nextReviewDate = nextDate;
                problem.lastConfidence = confidence;

                // Check if it's a leech
                problem.isLeech = (problem.lapses >= settings.leechThreshold &&
                                  problem.srsStage < 3);

                // Add attempt to history
                const now = new Date();
                problem.attempts.push({
                    date: now.toISOString(),
                    time,
                    confidence,
                    stage: newStage,
                    interval: intervalDays
                });

                // Save everything
                chrome.storage.local.set({
                    problems,
                    lastUndo: undoState
                }).then(() => {
                    sendResponse({ success: true });
                });

                // Clear undo after 5 minutes
                setTimeout(() => {
                    chrome.storage.local.remove('lastUndo');
                }, 5 * 60 * 1000);
            }
            else{
                // Problem not found
                sendResponse({ success: false, error: 'Problem not found' });
            }
        });
        return true;
    }
});