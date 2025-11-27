let timerInterval;
let startTime = null;
let pausedTime = 0;

function getElapsedSeconds() {
    if (!startTime) return pausedTime;
    return Math.floor((Date.now() - startTime) / 1000) + pausedTime;
}

function cleanupWidget() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    const oldWidget = document.getElementById('tracker-widget');
    if (oldWidget) {
        oldWidget.remove();
    }
}

function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

function createWidget() {
    // First, inject widget styles if not already present
    if (!document.getElementById('tracker-widget-styles')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'tracker-widget-styles';
        styleEl.textContent = `
            #tracker-widget {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 220px;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.15);
                z-index: 99999;
                font-size: 13px;
                overflow: hidden;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            #tracker-widget .widget-header {
                padding: 8px 10px;
                background-color: #343a40;
                color: #ffffff;
                font-weight: 600;
                text-align: center;
            }
            #tracker-widget .widget-timer {
                padding: 10px;
                text-align: center;
                font-family: "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
                font-size: 16px;
                color: #333333;  /* ← ADD THIS LINE! */
            }
            #tracker-widget .widget-controls {
                display: flex;
                justify-content: space-between;
                gap: 4px;
                padding: 8px 10px 10px;
            }
            #tracker-widget .widget-controls button {
                flex: 1;
                padding: 6px 10px;
                border-radius: 4px;
                border: none;
                font-size: 13px;
                font-weight: 500;
                color: white;
                cursor: pointer;
            }
            #tracker-widget #timer-start {
                background-color: #28a745;
            }
            #tracker-widget #timer-pause {
                background-color: #ffc107;
                color: #000;
            }
            #tracker-widget #timer-submit {
                background-color: #007bff;
            }
            #tracker-widget #timer-submit:disabled {
                background-color: #6c757d;
                opacity: 0.5;
                cursor: not-allowed;
            }
            #tracker-widget .widget-controls button:not(:disabled):hover {
                opacity: 0.9;
            }
            #tracker-widget .modal {
                padding: 8px 10px 10px;
                border-top: 1px solid #eeeeee;
                background-color: #f8f9fa;
                display: flex;          /* ← ADD */
                flex-direction: column; /* ← ADD */
            }
            #tracker-widget .modal-buttons {  /* ← ADD NEW STYLE */
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
            }
            #tracker-widget .modal h4 {
                margin: 0 0 6px;
                font-size: 13px;
                color: #333333;  /* ← ADD THIS! */
            }
            #tracker-widget .confidence-btn {
                flex: 1 1 45%;          /* ← 2 buttons per row */
                padding: 8px 12px;
                border-radius: 4px;
                border: 1px solid #ced4da;
                background-color: #ffffff;
                font-size: 13px;
                font-weight: 500;
                color: #333333;
                cursor: pointer;
                text-align: center;     /* ← Center text */
            }
            #tracker-widget .confidence-btn:hover {
                background-color: #e2e6ea;
            }
        `;
        document.head.appendChild(styleEl);
    }

    const widget = document.createElement('div');
    widget.id = 'tracker-widget';
    widget.innerHTML = `
        <div class="widget-header">Practice Tracker</div>
        <div class="widget-timer" id="widget-timer-display">00:00:00</div>
        <div class="widget-controls">
            <button id="timer-start">Start</button>
            <button id="timer-pause" style="display:none;">Pause</button>
            <button id="timer-submit" disabled>Submit</button>
        </div>
        <div id="confidence-modal" class="modal" style="display:none;">
            <h4>How did you feel?</h4>
            <div class="modal-buttons">
                <button class="confidence-btn" data-confidence="low">Low</button>
                <button class="confidence-btn" data-confidence="medium">Medium</button>
                <button class="confidence-btn" data-confidence="high">High</button>
                <button class="confidence-btn" data-confidence="mastered">Mastered</button>
            </div>
        </div>
    `;
    document.body.appendChild(widget);

    // --- Event Listeners ---
    const startBtn = document.getElementById('timer-start');
    const pauseBtn = document.getElementById('timer-pause');
    const submitBtn = document.getElementById('timer-submit');
    const modal = document.getElementById('confidence-modal');

    startBtn.addEventListener('click', () => {
        startBtn.style.display = 'none';
        pauseBtn.style.display = 'inline-block';
        submitBtn.disabled = false;
        startTime = Date.now();
        pausedTime = 0;
        timerInterval = setInterval(() => {
            document.getElementById('widget-timer-display').textContent = formatTime(getElapsedSeconds());
        }, 1000);
    });

    pauseBtn.addEventListener('click', () => {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
            pausedTime = getElapsedSeconds();
            startTime = null;
            pauseBtn.textContent = 'Resume';
        } else {
            pauseBtn.textContent = 'Pause';
            startTime = Date.now();
            timerInterval = setInterval(() => {
                document.getElementById('widget-timer-display').textContent = formatTime(getElapsedSeconds());
            }, 1000);
        }
    });

    submitBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        timerInterval = null;
        pauseBtn.disabled = true;  // Disable pause when submitting
        modal.style.display = 'flex';  // Show modal IMMEDIATELY

        // Run suggestion async (non-blocking)
        setTimeout(async () => {
            const cleanUrl = window.location.href.split('?')[0].split('#')[0]
                .replace(/\/(description|solutions|discuss|submissions|editorial|comments)(\/)?$/, '');

            try {
                const { problems, settings } = await chrome.storage.local.get(['problems', 'settings']);
                if (problems && settings?.timeThresholds) {
                    const normalizeUrl = (u) => u.replace(/\/$/, '');
                    const problem = problems.find(p => normalizeUrl(p.url) === normalizeUrl(cleanUrl));

                    if (problem?.difficulty) {
                        const diff = problem.difficulty.toLowerCase();
                        const timeMin = getElapsedSeconds() / 60;
                        const th = settings.timeThresholds[diff];

                        if (th) {
                            let sugg = timeMin < th.mastered ? 'mastered' :
                                       timeMin < th.high ? 'high' :
                                       timeMin < th.medium ? 'medium' : 'low';

                            document.querySelectorAll('.confidence-btn').forEach(btn => {
                                btn.style.backgroundColor = '#ffffff';
                                btn.style.border = '1px solid #ced4da';
                                btn.style.fontWeight = '500';
                            });

                            const suggBtn = document.querySelector(`.confidence-btn[data-confidence="${sugg}"]`);
                            if (suggBtn) {
                                suggBtn.style.backgroundColor = '#d4edda';
                                suggBtn.style.border = '2px solid #28a745';
                                suggBtn.style.fontWeight = '600';
                            }
                        }
                    }
                }
            } catch (e) {}
        }, 0);
    });

    document.querySelectorAll('.confidence-btn').forEach(btn => {
        // Add hover effect to clear suggestion styling
        btn.addEventListener('mouseenter', (e) => {
            e.target.style.backgroundColor = '#e2e6ea';
        });

        btn.addEventListener('mouseleave', (e) => {
            // Only reset if not the suggested button
            if (e.target.style.border !== '2px solid rgb(40, 167, 69)') {
                e.target.style.backgroundColor = '#ffffff';
            } else {
                e.target.style.backgroundColor = '#d4edda';
            }
        });

        btn.addEventListener('click', (e) => {
            const confidence = e.target.dataset.confidence;
        // Clean URL: remove query params, hash, and /description|solutions|discuss|etc
        let cleanUrl = window.location.href.split('?')[0].split('#')[0];
        // Remove trailing segments like /description/, /solutions/, /discuss/
        cleanUrl = cleanUrl.replace(/\/(description|solutions|discuss|submissions|editorial|comments)(\/)?$/, '');

        chrome.runtime.sendMessage({
            action: 'submitAttempt',
            data: {
                url: cleanUrl,
                time: getElapsedSeconds(),
                confidence: confidence
            }
        }, (response) => {
            if (chrome.runtime.lastError) {
                widget.innerHTML = `
                    <div class="widget-header">Error!</div>
                    <div style="padding: 10px; text-align: center; font-size: 12px; color: #333333;">
                        Failed to submit. Extension may have reloaded.
                    </div>
                `;
                setTimeout(() => widget.remove(), 4000);
                return;
            }

            if (response && response.success) {
                widget.innerHTML = `
                    <div class="widget-header">Complete!</div>
                    <div style="padding: 10px; text-align: center; color: #333333;">
                        <div style="margin-bottom: 4px;">Time: ${formatTime(getElapsedSeconds())}</div>
                        <div>Confidence: ${confidence}</div>
                    </div>
                `;
            } else {
                widget.innerHTML = `
                    <div class="widget-header">Error!</div>
                    <div style="padding: 10px; text-align: center; font-size: 12px; color: #333333;">
                        Problem not found in your list.
                    </div>
                `;
            }
            setTimeout(() => widget.remove(), 4000);
        });
        });
    });
}

// Function to extract just the problem slug from URL (ignore query params and hashes)
function getProblemSlug(url) {
    const match = url.match(/leetcode\.com\/problems\/([^/?#]+)/);
    return match ? match[1] : null;
}

let lastProblemSlug = getProblemSlug(location.href);

// Only observe URL changes, not all DOM mutations
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    const currentProblemSlug = getProblemSlug(location.href);

    if (currentProblemSlug && currentProblemSlug !== lastProblemSlug) {
      lastProblemSlug = currentProblemSlug;
      cleanupWidget();
      startTime = null;
      pausedTime = 0;
      createWidget();
    }
  }
}).observe(document, { subtree: true, childList: true });

// Initial page load
createWidget();