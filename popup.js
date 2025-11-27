const problemListEl = document.getElementById('problem-list');
const refreshBtn = document.getElementById('refresh-btn');
const searchBox = document.getElementById('search-box');
const filterStatus = document.getElementById('filter-status');
const phaseFiltersEl = document.getElementById('phase-filters');

// --- NEW: Get references to the new dynamic dropdowns ---
const filterDifficulty = document.getElementById('filter-difficulty');
const filterTopic = document.getElementById('filter-topic');

let allProblems = [];
function showError(message) {
    problemListEl.innerHTML = `<li class="problem-item" style="color: red;">${message}</li>`;
}

function populatePhaseFilters() {
    const phases = [...new Set(allProblems.map(p => p.phase).filter(Boolean))].sort();
    phaseFiltersEl.innerHTML = '';
    phases.forEach(phase => {
        const checkboxContainer = document.createElement('div');
        checkboxContainer.className = 'checkbox-container';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `phase-${phase}`;
        checkbox.value = phase;
        checkbox.checked = true;
        const label = document.createElement('label');
        label.htmlFor = `phase-${phase}`;
        label.textContent = phase;
        checkboxContainer.appendChild(checkbox);
        checkboxContainer.appendChild(label);
        phaseFiltersEl.appendChild(checkboxContainer);
        checkbox.addEventListener('change', renderProblems);
    });
}

// --- NEW: Function to populate Difficulty and Topic filters from the sheet data ---
function populateDynamicFilters() {
    // --- Populate Difficulty Filter ---
    const difficulties = [...new Set(allProblems.map(p => p.difficulty).filter(Boolean))];
    // Custom sort to ensure 'Easy', 'Medium', 'Hard' order
    difficulties.sort((a, b) => {
        const order = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
        return (order[a] || 99) - (order[b] || 99);
    });
    filterDifficulty.innerHTML = '<option value="all">All Difficulties</option>'; // Reset
    difficulties.forEach(d => {
        const option = document.createElement('option');
        option.value = d;
        option.textContent = d;
        filterDifficulty.appendChild(option);
    });

    // --- Populate Topic Filter ---
    const topics = [...new Set(allProblems.map(p => p.topic).filter(Boolean))].sort();
    filterTopic.innerHTML = '<option value="all">All Topics</option>'; // Reset
    topics.forEach(t => {
        const option = document.createElement('option');
        option.value = t;
        option.textContent = t;
        filterTopic.appendChild(option);
    });
}

// --- REWRITTEN: The core filtering logic is now precise and context-aware ---
function renderProblems() {
    const selectedPhaseCheckboxes = phaseFiltersEl.querySelectorAll('input[type="checkbox"]:checked');
    const selectedPhases = Array.from(selectedPhaseCheckboxes).map(cb => cb.value);

    // Get values from all filters
    const searchTerm = searchBox.value.toLowerCase();
    const statusFilter = filterStatus.value;
    const difficultyFilter = filterDifficulty.value;
    const topicFilter = filterTopic.value;
    const today = new Date().toISOString().split('T')[0];

    const filteredProblems = allProblems.filter(p => {
        // --- Phase Filter ---
        // This logic handles the case where no phases are selected (show nothing)
        if (phaseFiltersEl.children.length > 0 && selectedPhases.length === 0) return false;

        // REPLACE the matchesPhase line in renderProblems:
        const matchesPhase = selectedPhases.length === phaseFiltersEl.children.length ||
                             selectedPhases.includes(p.phase);

        // --- Precise Difficulty Filter ---
        const matchesDifficulty = (difficultyFilter === 'all' || p.difficulty === difficultyFilter);

        // --- Precise Topic Filter ---
        const matchesTopic = (topicFilter === 'all' || p.topic === topicFilter);

        // --- Status Filter (Unchanged) ---
        let matchesStatus = true;
        if (statusFilter === 'due') {
            matchesStatus = p.nextReviewDate && p.nextReviewDate <= today;
        } else if (statusFilter !== 'all') {
            matchesStatus = (p.status || 'Not Started').toLowerCase().replace(' ', '-') === statusFilter;
        }

        // --- Precise Search Filter (now only searches the title) ---
        const matchesSearch = (p.title || p.name).toLowerCase().includes(searchTerm);

        // Return true only if ALL conditions are met
        return matchesPhase && matchesDifficulty && matchesTopic && matchesStatus && matchesSearch;
    });

    // --- Rendering Logic (Unchanged, but now receives a much more accurate list) ---
    problemListEl.innerHTML = '';
    if (filteredProblems.length === 0) {
        problemListEl.innerHTML = '<li class="problem-item">No problems match your criteria.</li>';
        return;
    }

    filteredProblems.forEach(p => {
        const li = document.createElement('li');
        li.className = 'problem-item';

        // Escape HTML to prevent XSS
        const escapeHtml = (str) => {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        };

        const leechTag = p.isLeech ? '<span class="tag leech">🩸 Leech</span>' : '';
        let reviewText = '';
        if (p.nextReviewDate) {
            const isDue = p.nextReviewDate <= today;
            reviewText = `<span class="review-date ${isDue ? 'due' : ''}">Review: ${p.nextReviewDate}</span>`;
        }
        const stageTag = p.srsStage > 0 ? `<span class="tag stage">Stage ${p.srsStage}</span>` : '';

        li.innerHTML = `
            <div class="problem-info">
                <a href="#" class="problem-link" data-url="${escapeHtml(p.url)}">${escapeHtml(p.title)}</a>
                <div class="tags">
                    <span class="tag difficulty">${escapeHtml(p.difficulty)}</span>
                    <span class="tag topic">${escapeHtml(p.topic)} > ${escapeHtml(p.pattern)}</span>
                    <span class="tag phase">${escapeHtml(p.phase || 'N/A')}</span>
                    ${stageTag}
                    ${leechTag}
                </div>
            </div>
            <div class="problem-status">
                ${reviewText}
                <span class="status status-${(p.lastConfidence || 'none').toLowerCase()}">${escapeHtml(p.lastConfidence || p.status || 'Not Started')}</span>
            </div>
        `;
        problemListEl.appendChild(li);
    });

    // --- ADD EVENT LISTENERS TO ALL PROBLEM LINKS ---
    document.querySelectorAll('.problem-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            const url = e.target.getAttribute('data-url');
            // Open in new background tab - this keeps the popup open so you can open multiple problems
            chrome.tabs.create({ url: url, active: false }, (tab) => {
                if (chrome.runtime.lastError) {
                    console.error('Failed to open tab:', chrome.runtime.lastError);
                    alert('Failed to open problem. Please check extension permissions.');
                }
            });

        });
    });
}

// --- Event Listeners ---
refreshBtn.addEventListener('click', () => {
    problemListEl.innerHTML = '<li class="problem-item">Refreshing...</li>';
    chrome.runtime.sendMessage({ action: 'refreshProblems' }, (problems) => {
        if (chrome.runtime.lastError) {
            showError('Extension error: ' + chrome.runtime.lastError.message);
            return;
        }

        if (!problems || problems.length === 0) {
            showError('Failed to fetch problems. Check your Google Sheet URL in background.js');
            return;
        }
        allProblems = problems;
        populatePhaseFilters();
        populateDynamicFilters();
        renderProblems();
    });
});

// Add event listeners for the new filters
searchBox.addEventListener('input', renderProblems);
filterStatus.addEventListener('change', renderProblems);
filterDifficulty.addEventListener('change', renderProblems);
filterTopic.addEventListener('change', renderProblems);

// --- Initial Load ---
chrome.runtime.sendMessage({ action: 'getProblems' }, (problems) => {
    if (chrome.runtime.lastError) {
        showError('Extension error: ' + chrome.runtime.lastError.message);
        return;
    }
    if (!problems || problems.length === 0) {
        showError('No problems found. Click "Refresh List" to fetch from Google Sheet.');
        return;
    }
    allProblems = problems || [];
    populatePhaseFilters();
    populateDynamicFilters();
    renderProblems();
});