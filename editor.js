let allProblems = [];
let currentProblem = null;
let currentProblemIndex = -1;
let settings = null;

const searchBox = document.getElementById('problem-search');
const searchResults = document.getElementById('search-results');
const editorSection = document.getElementById('editor-section');
const attemptsList = document.getElementById('attempts-list');

// Load all problems and settings on page load
async function loadData() {
    const data = await chrome.storage.local.get(['problems', 'settings']);
    allProblems = data.problems || [];
    settings = data.settings || {
        growthFactor: 2.0,
        maxInterval: 40,
        maxStage: 8,
        baseInterval: 1,
        leechThreshold: 3,
        maxDailyReviews: 15,
        studyDays: [0, 1, 1, 1, 1, 1, 1],
        timeThresholds: {
            easy: { mastered: 5, high: 15, medium: 30 },
            medium: { mastered: 10, high: 25, medium: 45 },
            hard: { mastered: 20, high: 40, medium: 60 }
        }
    };
}

// Search and display results
searchBox.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();

    if (query.length < 2) {
        searchResults.innerHTML = '';
        return;
    }

    // Check if it's a URL
    let urlSlug = null;
    if (query.includes('leetcode.com/problems/')) {
        const match = query.match(/leetcode\.com\/problems\/([^/?#]+)/);
        if (match) {
            urlSlug = match[1];
        }
    }

    const filtered = allProblems.filter(p => {
        if (urlSlug) {
            return p.url.toLowerCase().includes(urlSlug);
        }
        return (p.title || '').toLowerCase().includes(query) ||
               (p.topic || '').toLowerCase().includes(query) ||
               (p.pattern || '').toLowerCase().includes(query);
    });

    displaySearchResults(filtered);
});

function displaySearchResults(results) {
    if (results.length === 0) {
        searchResults.innerHTML = '<div style="padding: 10px; text-align: center; color: #6c757d;">No problems found</div>';
        return;
    }

    searchResults.innerHTML = results.slice(0, 20).map((p, index) => {
        const actualIndex = allProblems.findIndex(prob => prob.url === p.url);
        return `
            <div class="search-result-item" data-index="${actualIndex}">
                <div class="result-title">${escapeHtml(p.title)}</div>
                <div class="result-meta">
                    ${escapeHtml(p.difficulty)} • ${escapeHtml(p.topic)} •
                    Stage ${p.srsStage || 0} •
                    ${p.attempts?.length || 0} attempt(s)
                </div>
            </div>
        `;
    }).join('');

    // Add click handlers
    document.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
            const index = parseInt(item.dataset.index);
            loadProblem(index);
        });
    });
}

function loadProblem(index) {
    currentProblemIndex = index;
    currentProblem = JSON.parse(JSON.stringify(allProblems[index])); // Deep clone

    // Show editor section
    editorSection.classList.add('active');

    // Update header
    document.getElementById('current-problem-title').textContent = currentProblem.title || 'Unknown Problem';
    document.getElementById('current-problem-link').href = currentProblem.url;

    // Update stats (read-only displays)
    updateStatsDisplay();

    // Load attempts
    renderAttempts();

    // Scroll to editor
    editorSection.scrollIntoView({ behavior: 'smooth' });
}

function updateStatsDisplay() {
    document.getElementById('stat-status').textContent = currentProblem.status || 'Not Started';
    document.getElementById('stat-stage').textContent = currentProblem.srsStage || 0;
    document.getElementById('stat-next-review').textContent = currentProblem.nextReviewDate || 'N/A';
    document.getElementById('stat-confidence').textContent = currentProblem.lastConfidence || 'None';
    document.getElementById('stat-lapses').textContent = currentProblem.lapses || 0;
    document.getElementById('stat-attempts').textContent = currentProblem.attempts?.length || 0;
}

function renderAttempts() {
    const attempts = currentProblem.attempts || [];

    if (attempts.length === 0) {
        attemptsList.innerHTML = '<div style="padding: 10px; text-align: center; color: #6c757d;">No attempts yet. Add one to get started!</div>';
        return;
    }

    attemptsList.innerHTML = attempts.map((attempt, index) => {
        const date = new Date(attempt.date);
        const dateStr = date.toISOString().slice(0, 16); // Format for datetime-local input
        const timeMinutes = Math.floor(attempt.time / 60);

        // Calculate what confidence WOULD be based on time (for auto suggestion)
        const suggestedConfidence = SRSEngine.suggestConfidence(
            attempt.time,
            currentProblem.difficulty,
            settings
        );

        // Determine if this is auto or manual
        // If attempt.confidence exists, it's manual. If not, it's auto.
        const isManual = !!attempt.confidence;
        const currentConfidence = attempt.confidence || suggestedConfidence;

        return `
            <div class="attempt-item" data-index="${index}">
                <div class="attempt-field">
                    <label>📅 Date & Time</label>
                    <input
                        type="datetime-local"
                        class="attempt-date"
                        value="${dateStr}"
                        data-index="${index}"
                    >
                </div>
                <div class="attempt-field">
                    <label>⏱️ Time Spent</label>
                    <div class="time-input-wrapper">
                        <input
                            type="number"
                            class="attempt-time"
                            value="${timeMinutes}"
                            min="0"
                            placeholder="0"
                            data-index="${index}"
                        >
                        <span class="unit">minutes</span>
                    </div>
                </div>
                <div class="attempt-field">
                    <label>🎯 Confidence</label>
                    <select class="attempt-confidence" data-index="${index}">
                        <option value="auto" ${!isManual ? 'selected' : ''}>
                            Auto (${suggestedConfidence})
                        </option>
                        <option value="mastered" ${currentConfidence === 'mastered' && isManual ? 'selected' : ''}>
                            Mastered
                        </option>
                        <option value="high" ${currentConfidence === 'high' && isManual ? 'selected' : ''}>
                            High
                        </option>
                        <option value="medium" ${currentConfidence === 'medium' && isManual ? 'selected' : ''}>
                            Medium
                        </option>
                        <option value="low" ${currentConfidence === 'low' && isManual ? 'selected' : ''}>
                            Low
                        </option>
                    </select>
                </div>
                <div class="attempt-field">
                    <label>&nbsp;</label>
                    <button class="delete-attempt-btn" data-index="${index}">✕ Delete</button>
                </div>
            </div>
        `;
    }).join('');

    // Add event listeners for time changes (updates Auto suggestion text)
    document.querySelectorAll('.attempt-time').forEach(input => {
        input.addEventListener('input', (e) => {
            const index = parseInt(e.target.dataset.index);
            const timeMinutes = parseInt(e.target.value) || 0;
            const timeSeconds = timeMinutes * 60;

            const newConfidence = SRSEngine.suggestConfidence(
                timeSeconds,
                currentProblem.difficulty,
                settings
            );

            // Update the "Auto" option text to show new suggestion
            const confidenceSelect = e.target.closest('.attempt-item').querySelector('.attempt-confidence');
            const autoOption = confidenceSelect.querySelector('option[value="auto"]');
            autoOption.textContent = `Auto (${newConfidence})`;

            // If currently on Auto, update the preview immediately
            if (confidenceSelect.value === 'auto') {
                // Update time in memory
                currentProblem.attempts[index].time = timeSeconds;
                delete currentProblem.attempts[index].confidence; // Keep it auto

                // Recalculate preview
                const recalculated = SRSEngine.recalculateProblem(currentProblem, settings, allProblems);
                currentProblem = recalculated;
                updateStatsDisplay();
            }
        });
    });

    // Add event listeners for confidence changes (live preview)
    document.querySelectorAll('.attempt-confidence').forEach(select => {
        select.addEventListener('change', (e) => {
            const index = parseInt(e.target.dataset.index);
            const newConfidence = e.target.value;

            if (newConfidence === 'auto') {
                // User chose auto - delete manual override
                delete currentProblem.attempts[index].confidence;
            } else {
                // User chose manual - save it
                currentProblem.attempts[index].confidence = newConfidence;
            }

            // Recalculate preview immediately
            const recalculated = SRSEngine.recalculateProblem(currentProblem, settings, allProblems);
            currentProblem = recalculated;
            updateStatsDisplay();
            renderAttempts(); // Re-render to show updated stage/interval per attempt
        });
    });

    // Add delete handlers
    document.querySelectorAll('.delete-attempt-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            deleteAttempt(index);
        });
    });
}

function deleteAttempt(index) {
    if (!confirm('Delete this attempt?')) return;

    currentProblem.attempts.splice(index, 1);
    renderAttempts();

    // Recalculate stats preview
    const recalculated = SRSEngine.recalculateProblem(currentProblem, settings, allProblems);
    currentProblem = recalculated;
    updateStatsDisplay();
}

// Add new attempt
document.getElementById('add-attempt-btn').addEventListener('click', () => {
    if (!currentProblem.attempts) {
        currentProblem.attempts = [];
    }

    const now = new Date();
    currentProblem.attempts.push({
        date: now.toISOString(),
        time: 0, // Will be set by user
        // Don't set confidence - let it auto-calculate
        stage: 0,
        interval: 0
    });

    renderAttempts();

    // ✅ FIX: Recalculate preview (like deleteAttempt does)
    const recalculated = SRSEngine.recalculateProblem(currentProblem, settings, allProblems);
    currentProblem = recalculated;
    updateStatsDisplay();
});

// Reset to "Not Started"
document.getElementById('reset-btn').addEventListener('click', () => {
    if (!confirm(`⚠️ Reset "${currentProblem.title}" to "Not Started"?\n\nThis will delete all attempts and progress.`)) {
        return;
    }

    currentProblem.status = 'Not Started';
    currentProblem.attempts = [];
    currentProblem.lastConfidence = null;
    currentProblem.nextReviewDate = null;
    currentProblem.srsStage = 0;
    currentProblem.lapses = 0;
    currentProblem.consecutiveSuccesses = 0;
    currentProblem.isLeech = false;

    renderAttempts();
    updateStatsDisplay();
});

// Save changes with full recalculation
document.getElementById('save-btn').addEventListener('click', async () => {
    console.log('=== SAVE & RECALCULATE STARTED ===');
    console.log('Philosophy: Recalculate EVERYTHING from scratch. No shortcuts.');

    // Step 1: Update attempts with edited values from form
    const attemptItems = document.querySelectorAll('.attempt-item');
    attemptItems.forEach((item, index) => {
        if (!currentProblem.attempts[index]) return;

        const dateInput = item.querySelector('.attempt-date').value;
        const timeMinutes = parseInt(item.querySelector('.attempt-time').value) || 0;
        const confidenceValue = item.querySelector('.attempt-confidence').value;

        // Update the raw data (date and time - these are always inputs)
        currentProblem.attempts[index].date = new Date(dateInput).toISOString();
        currentProblem.attempts[index].time = timeMinutes * 60; // Convert to seconds

        // Handle confidence: auto vs manual
        if (confidenceValue === 'auto') {
            // User chose auto - delete so it gets recalculated from time
            delete currentProblem.attempts[index].confidence;
        } else {
            // User chose manual override - save it
            currentProblem.attempts[index].confidence = confidenceValue;
        }

        // Delete remaining calculated fields (they'll be recalculated)
        delete currentProblem.attempts[index].stage;      // Will be recalculated by SRS
        delete currentProblem.attempts[index].interval;   // Will be recalculated by SRS

        console.log(`Attempt ${index + 1} input:`, {
            date: currentProblem.attempts[index].date,
            timeMinutes: timeMinutes,
            timeSeconds: timeMinutes * 60,
            confidence: confidenceValue === 'auto' ? 'auto (will calculate)' : confidenceValue + ' (manual)',
            note: 'Stage and interval will be recalculated'
        });
    });

    console.log('Before recalculation:', {
        status: currentProblem.status,
        srsStage: currentProblem.srsStage,
        lapses: currentProblem.lapses,
        lastConfidence: currentProblem.lastConfidence,
        nextReviewDate: currentProblem.nextReviewDate,
        consecutiveSuccesses: currentProblem.consecutiveSuccesses,
        isLeech: currentProblem.isLeech
    });

    // Step 2: Recalculate EVERYTHING from scratch using SRS engine
    // This will:
    // - Reset problem to clean state
    // - Replay all attempts through SRS algorithm
    // - For each attempt:
    //   * If confidence exists: use it (manual override)
    //   * If confidence missing: calculate from time (auto)
    // - Recalculate: status, stage, lapses, consecutive successes,
    //                leech status, last confidence, next review date
    // - Recalculate for each attempt: stage, interval
    const recalculated = SRSEngine.recalculateProblem(currentProblem, settings, allProblems);

    console.log('After recalculation:', {
        status: recalculated.status,
        srsStage: recalculated.srsStage,
        lapses: recalculated.lapses,
        lastConfidence: recalculated.lastConfidence,
        nextReviewDate: recalculated.nextReviewDate,
        consecutiveSuccesses: recalculated.consecutiveSuccesses,
        isLeech: recalculated.isLeech
    });

    console.log('Attempt details after recalculation:');
    recalculated.attempts.forEach((att, idx) => {
        console.log(`  Attempt ${idx + 1}:`, {
            time: `${Math.floor(att.time / 60)} min`,
            confidence: att.confidence,
            confidenceSource: currentProblem.attempts[idx].confidence ? 'manual' : 'auto',
            stage: att.stage,
            interval: `${att.interval} days`
        });
    });

    // Step 3: Save to storage
    allProblems[currentProblemIndex] = recalculated;
    await chrome.storage.local.set({ problems: allProblems });

    console.log('=== SAVED TO STORAGE ===');
    alert('✅ Changes saved and recalculated using SRS algorithm!');

    // Step 4: Reload UI to show updated stats
    currentProblem = recalculated;
    updateStatsDisplay();
    renderAttempts();
});

// Cancel
document.getElementById('cancel-btn').addEventListener('click', () => {
    if (!confirm('Discard changes?')) return;

    // Reload original data
    if (currentProblemIndex >= 0) {
        loadProblem(currentProblemIndex);
    }
});

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

// Initialize
loadData();