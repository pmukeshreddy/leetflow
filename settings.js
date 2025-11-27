// Load current settings
async function loadSettings() {
    const { settings } = await chrome.storage.local.get('settings');

    if (settings) {
        // Load Google Sheet URL
        if (settings.sheetUrl) {
            document.getElementById('sheet-url').value = settings.sheetUrl;
        }

        document.getElementById('growth-factor').value = settings.growthFactor;
        document.getElementById('max-interval').value = settings.maxInterval;
        document.getElementById('base-interval').value = settings.baseInterval;
        document.getElementById('leech-threshold').value = settings.leechThreshold;
        document.getElementById('max-daily-reviews').value = settings.maxDailyReviews || 15;

        // Load study days
        settings.studyDays.forEach((checked, index) => {
            document.getElementById(`day-${index}`).checked = checked === 1;
        });

        // Load time thresholds
        if (settings.timeThresholds) {
            document.getElementById('easy-mastered').value = settings.timeThresholds.easy.mastered;
            document.getElementById('easy-high').value = settings.timeThresholds.easy.high;
            document.getElementById('easy-medium').value = settings.timeThresholds.easy.medium;

            document.getElementById('medium-mastered').value = settings.timeThresholds.medium.mastered;
            document.getElementById('medium-high').value = settings.timeThresholds.medium.high;
            document.getElementById('medium-medium').value = settings.timeThresholds.medium.medium;

            document.getElementById('hard-mastered').value = settings.timeThresholds.hard.mastered;
            document.getElementById('hard-high').value = settings.timeThresholds.hard.high;
            document.getElementById('hard-medium').value = settings.timeThresholds.hard.medium;
        }
    }

    checkUndoAvailability();
}

// Check if undo is available
async function checkUndoAvailability() {
    const { lastUndo } = await chrome.storage.local.get('lastUndo');
    const undoBtn = document.getElementById('undo-btn');
    const undoInfo = document.getElementById('undo-info');

    if (lastUndo && Date.now() - lastUndo.timestamp < 5 * 60 * 1000) {
        undoBtn.disabled = false;
        const minutesAgo = Math.floor((Date.now() - lastUndo.timestamp) / 60000);
        undoInfo.textContent = `Undo available (${minutesAgo} minute${minutesAgo !== 1 ? 's' : ''} ago)`;
    } else {
        undoBtn.disabled = true;
        undoInfo.textContent = 'No recent submission to undo (5 min limit).';
    }
}

// Save settings
document.getElementById('save-btn').addEventListener('click', async () => {
    const sheetUrl = document.getElementById('sheet-url').value.trim();
    const growthFactor = parseFloat(document.getElementById('growth-factor').value);
    const maxInterval = parseInt(document.getElementById('max-interval').value);
    const baseInterval = parseInt(document.getElementById('base-interval').value);
    const leechThreshold = parseInt(document.getElementById('leech-threshold').value);
    const maxDailyReviews = parseInt(document.getElementById('max-daily-reviews').value);

    // Validate Sheet URL
    if (!sheetUrl) {
        alert('Please provide a Google Sheet URL');
        return;
    }
    if (!sheetUrl.includes('docs.google.com/spreadsheets') || !sheetUrl.includes('output=csv')) {
        alert('Invalid Google Sheet URL. Make sure you:\n1. Published to web\n2. Selected CSV format\n3. Copied the published URL');
        return;
    }

    // Validate other inputs
    if (isNaN(growthFactor) || growthFactor < 1 || growthFactor > 5) {
        alert('Growth factor must be between 1 and 5');
        return;
    }
    if (isNaN(maxInterval) || maxInterval < 1 || maxInterval > 365) {
        alert('Max interval must be between 1 and 365 days');
        return;
    }
    if (isNaN(baseInterval) || baseInterval < 1 || baseInterval > 7) {
        alert('Base interval must be between 1 and 7 days');
        return;
    }
    if (isNaN(leechThreshold) || leechThreshold < 1 || leechThreshold > 20) {
        alert('Leech threshold must be between 1 and 20');
        return;
    }
    if (isNaN(maxDailyReviews) || maxDailyReviews < 1 || maxDailyReviews > 20) {
        alert('Max daily reviews must be between 1 and 20');
        return;
    }

    const settings = {
        sheetUrl,
        growthFactor,
        maxInterval,
        baseInterval,
        leechThreshold,
        maxDailyReviews,
        maxStage: 8,
        studyDays: []
    };

    // Collect study days
    for (let i = 0; i < 7; i++) {
        settings.studyDays.push(document.getElementById(`day-${i}`).checked ? 1 : 0);
    }

    // Collect time thresholds
    settings.timeThresholds = {
        easy: {
            mastered: parseInt(document.getElementById('easy-mastered').value),
            high: parseInt(document.getElementById('easy-high').value),
            medium: parseInt(document.getElementById('easy-medium').value)
        },
        medium: {
            mastered: parseInt(document.getElementById('medium-mastered').value),
            high: parseInt(document.getElementById('medium-high').value),
            medium: parseInt(document.getElementById('medium-medium').value)
        },
        hard: {
            mastered: parseInt(document.getElementById('hard-mastered').value),
            high: parseInt(document.getElementById('hard-high').value),
            medium: parseInt(document.getElementById('hard-medium').value)
        }
    };

    await chrome.storage.local.set({ settings });
    alert('Settings saved successfully! Click "Refresh List" in the popup to load problems from your sheet.');
});

// Cancel button
document.getElementById('cancel-btn').addEventListener('click', () => {
    window.close();
});

// Export data
document.getElementById('export-btn').addEventListener('click', async () => {
    const data = await chrome.storage.local.get(null);
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const today = new Date().toISOString().split('T')[0];
    const filename = `leetcode-tracker-backup-${today}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
});

// Import data
document.getElementById('import-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const data = JSON.parse(event.target.result);

            if (confirm('This will replace all current data. Continue?')) {
                await chrome.storage.local.clear();
                await chrome.storage.local.set(data);
                alert('Import successful! Please reload the extension.');
                window.close();
            }
        } catch (error) {
            alert('Error importing file: ' + error.message);
        }
    };
    reader.readAsText(file);
});

// Soft reset
document.getElementById('soft-reset-btn').addEventListener('click', async () => {
    const { problems, settings } = await chrome.storage.local.get(['problems', 'settings']);

    if (!problems || problems.length === 0) {
        alert('No problems found. Refresh your problem list first.');
        return;
    }

    const today = new Date().toISOString().split('T')[0];

    const overdueProblems = problems.filter(p => p.nextReviewDate && p.nextReviewDate < today);

    if (overdueProblems.length === 0) {
        alert('No overdue problems to reschedule!');
        return;
    }

    if (!confirm(`Reschedule ${overdueProblems.length} overdue problems over the next 2-3 days?`)) {
        return;
    }

    // Reschedule each overdue problem to a random day in next 3-4 days
    overdueProblems.forEach(problem => {
        const daysAhead = Math.floor(Math.random() * 2) + 2; // 2-3 days
        const nextDate = getNextReviewDate(daysAhead, settings.studyDays || [0,1,1,1,1,1,1]);
        problem.nextReviewDate = nextDate;
    });

    await chrome.storage.local.set({ problems });
    alert(`${overdueProblems.length} problems rescheduled!`);
});

// Hard reset
let hardResetClicked = false;
document.getElementById('hard-reset-btn').addEventListener('click', async () => {
    if (!hardResetClicked) {
        hardResetClicked = true;
        document.getElementById('hard-reset-btn').textContent = '⚠️ Click Again to Confirm';
        document.getElementById('hard-reset-btn').style.backgroundColor = '#d32f2f';

        setTimeout(() => {
            hardResetClicked = false;
            document.getElementById('hard-reset-btn').textContent = '⚠️ Reset All Progress';
            document.getElementById('hard-reset-btn').style.backgroundColor = '';
        }, 5000);
        return;
    }

    if (!confirm('⚠️ FINAL WARNING: This will erase ALL progress permanently. Have you exported a backup?')) {
        return;
    }

    const { problems } = await chrome.storage.local.get('problems');

    if (!problems || problems.length === 0) {
        alert('No problems found. Nothing to reset.');
        return;
    }

    problems.forEach(p => {
        p.status = 'Not Started';
        p.attempts = [];
        p.lastConfidence = null;
        p.nextReviewDate = null;
        p.srsStage = 0;
        p.lapses = 0;
        p.consecutiveSuccesses = 0;
        p.isLeech = false;
    });

    await chrome.storage.local.set({ problems });
    alert('All progress has been reset.');
    window.close();
});

// Undo last submission
document.getElementById('undo-btn').addEventListener('click', async () => {
    const { lastUndo, problems } = await chrome.storage.local.get(['lastUndo', 'problems']);

    if (!lastUndo || Date.now() - lastUndo.timestamp > 5 * 60 * 1000) {
        alert('No recent submission to undo (5 min limit)');
        return;
    }

    const problemIndex = problems.findIndex(p => p.url === lastUndo.problemUrl);
    if (problemIndex !== -1) {
        problems[problemIndex] = lastUndo.previousState;
        await chrome.storage.local.set({ problems });
        await chrome.storage.local.remove('lastUndo');
        alert('Last submission undone!');
        checkUndoAvailability();
    }
});

// Helper function (duplicate from background.js for frontend use)
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

// Initialize
loadSettings();
setInterval(checkUndoAvailability, 10000); // Check every 10 seconds