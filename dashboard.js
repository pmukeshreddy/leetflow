document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
});

async function initializeDashboard() {
    try {
        const { problems } = await chrome.storage.local.get('problems');
        if (!problems || problems.length === 0) {
            document.querySelector('.dashboard-container').innerHTML =
                '<h1>No data available. Solve some problems first!</h1>';
            return;
        }

    const dailySubmissions = processSubmissionsData(problems);
    const confidenceStats = processConfidenceData(problems);
    const timeStats = processTimeData(problems);
    const reviewForecast = processReviewForecast(problems);

    renderChart(dailySubmissions);
    renderStats(confidenceStats);
    renderReviewForecast(reviewForecast);
    renderTimeStats(timeStats);

    } catch (error) {
        console.error('Dashboard initialization error:', error);
        document.querySelector('.dashboard-container').innerHTML =
            '<h1>Error loading dashboard. Please refresh.</h1>';
    }
}

// Process unique problems per day (UPDATED)
function processSubmissionsData(problems) {
    const uniqueProblemsPerDay = {};

    problems.forEach(problem => {
        if (problem.attempts && problem.attempts.length > 0) {
            // Track the FIRST submission date for this problem
            const firstAttempt = problem.attempts[0];
            if (firstAttempt.date) {
                const date = firstAttempt.date.split('T')[0];
                if (!uniqueProblemsPerDay[date]) {
                    uniqueProblemsPerDay[date] = new Set();
                }
                uniqueProblemsPerDay[date].add(problem.url);
            }
        }
    });

    // Convert Sets to counts
    const counts = {};
    for (const [date, problemSet] of Object.entries(uniqueProblemsPerDay)) {
        counts[date] = problemSet.size;
    }

    return counts;
}

function processConfidenceData(problems) {
    const stats = {
        weak: { topics: {}, patterns: {} },
        strong: { topics: {}, patterns: {} }
    };

    problems.forEach(p => {
        if (p.lastConfidence === 'low') {
            if (p.topic) stats.weak.topics[p.topic] = (stats.weak.topics[p.topic] || 0) + 1;
            if (p.pattern) stats.weak.patterns[p.pattern] = (stats.weak.patterns[p.pattern] || 0) + 1;
        } else if (p.lastConfidence === 'mastered') {
            if (p.topic) stats.strong.topics[p.topic] = (stats.strong.topics[p.topic] || 0) + 1;
            if (p.pattern) stats.strong.patterns[p.pattern] = (stats.strong.patterns[p.pattern] || 0) + 1;
        }
    });

    const sortData = (data) => Object.entries(data).sort((a, b) => b[1] - a[1]);

    return {
        weakTopics: sortData(stats.weak.topics),
        weakPatterns: sortData(stats.weak.patterns),
        strongTopics: sortData(stats.strong.topics),
        strongPatterns: sortData(stats.strong.patterns),
    };
}

// NEW: Process time statistics
function processTimeData(problems) {
    const timesByDifficulty = { easy: [], medium: [], hard: [] };
    const allSolves = [];

    problems.forEach(p => {
        if (p.attempts && p.attempts.length > 0) {
            // Get first attempt (original solve)
            const firstAttempt = p.attempts[0];
            if (firstAttempt.time && p.difficulty) {
                const difficulty = p.difficulty.toLowerCase();
                const timeInMinutes = firstAttempt.time / 60;

                if (timesByDifficulty[difficulty]) {
                    timesByDifficulty[difficulty].push(timeInMinutes);
                }

                allSolves.push({
                    title: p.title,
                    difficulty: p.difficulty,
                    time: timeInMinutes,
                    date: firstAttempt.date
                });
            }
        }
    });

    // Calculate averages
    const averages = {};
    for (const [difficulty, times] of Object.entries(timesByDifficulty)) {
        if (times.length > 0) {
            const avg = times.reduce((sum, t) => sum + t, 0) / times.length;
            averages[difficulty] = Math.round(avg);
        }
    }

    // Get fastest and slowest
    allSolves.sort((a, b) => a.time - b.time);
    const fastest = allSolves.slice(0, 5);
    const slowest = allSolves.slice(-5).reverse();

    // Calculate trends (last 30 days vs previous 30 days)
    const trends = calculateTrends(allSolves);
    const weeklyTrends = calculateWeeklyTrends(allSolves);  // ADD THIS
    return { averages, fastest, slowest, trends, weeklyTrends };  // ADD weeklyTrends
}

function calculateTrends(allSolves) {
    if (allSolves.length < 5) return null;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recent = allSolves.filter(s => new Date(s.date) >= thirtyDaysAgo);
    const previous = allSolves.filter(s => {
        const date = new Date(s.date);
        return date >= sixtyDaysAgo && date < thirtyDaysAgo;
    });

    if (recent.length === 0 || previous.length === 0) return null;

    const recentAvg = recent.reduce((sum, s) => sum + s.time, 0) / recent.length;
    const previousAvg = previous.reduce((sum, s) => sum + s.time, 0) / previous.length;

    const percentChange = ((recentAvg - previousAvg) / previousAvg) * 100;

    return {
        recentAvg: Math.round(recentAvg),
        previousAvg: Math.round(previousAvg),
        percentChange: Math.round(percentChange),
        improving: percentChange < 0 // Negative means faster (better)
    };
}

function calculateWeeklyTrends(allSolves) {
    if (allSolves.length < 2) return null;
    const now = new Date();
    const week1 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const week2 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const recent = allSolves.filter(s => new Date(s.date) >= week1);
    const prev = allSolves.filter(s => new Date(s.date) >= week2 && new Date(s.date) < week1);
    if (recent.length === 0 || prev.length === 0) return null;
    const recentAvg = recent.reduce((sum, s) => sum + s.time, 0) / recent.length;
    const prevAvg = prev.reduce((sum, s) => sum + s.time, 0) / prev.length;
    const percentChange = ((recentAvg - prevAvg) / prevAvg) * 100;
    return { recentAvg: Math.round(recentAvg), previousAvg: Math.round(prevAvg),
             percentChange: Math.round(percentChange), improving: percentChange < 0 };
}

let chartInstance = null;
function renderChart(dailySubmissions) {
    if (chartInstance) {
        chartInstance.destroy();
    }

    if (Object.keys(dailySubmissions).length === 0) {
        document.querySelector('.chart-container').innerHTML =
            '<h2>Submissions Over Time</h2><p>No submission data yet. Complete some problems to see your progress!</p>';
        return;
    }

    if (typeof Chart === 'undefined') {
        document.querySelector('.chart-container').innerHTML =
            '<h2>Submissions Over Time</h2><p>Error: Chart library failed to load. Please refresh the page.</p>';
        return;
    }

    const ctx = document.getElementById('submissions-chart').getContext('2d');
    const sortedDates = Object.keys(dailySubmissions).sort((a, b) => new Date(a) - new Date(b));
    const chartData = sortedDates.map(date => dailySubmissions[date]);

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedDates,
            datasets: [{
                label: 'Unique Problems Solved',
                data: chartData,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function renderStats(stats) {
    const createListItems = (data, limit = 5) => {
        if(data.length === 0) return '<li>No data yet.</li>';

        const escapeHtml = (str) => {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        };

        return data.slice(0, limit)
            .map(([name, count]) => `<li>${escapeHtml(name)} <span>${escapeHtml(count.toString())}</span></li>`)
            .join('');
    };

    const elements = {
        'strong-topics': stats.strongTopics,
        'strong-patterns': stats.strongPatterns,
        'weak-topics': stats.weakTopics,
        'weak-patterns': stats.weakPatterns
    };

    for (const [id, data] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = createListItems(data);
        } else {
            console.error(`Element with id '${id}' not found`);
        }
    }
}

// Render review forecast
function renderReviewForecast(forecast) {
    document.getElementById('total-due').textContent = forecast.totalDue;
    document.getElementById('due-today').textContent = forecast.dueToday;
    document.getElementById('due-week').textContent = forecast.dueWeek;
    document.getElementById('due-month').textContent = forecast.dueMonth;

    const breakdown = document.getElementById('daily-breakdown');
    if (forecast.next30Days.length > 0) {
        let html = '<h3>📆 Daily Breakdown</h3>';
        forecast.next30Days.forEach(day => {
            const date = new Date(day.date + 'T00:00:00'); // Add time to force local timezone
            const dateLabel = day.isToday ? 'Today' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const countClass = day.count > 20 ? 'overdue' : '';
            html += `
                <div class="day-row">
                    <span class="day-date">${dateLabel}</span>
                    <span class="day-count ${countClass}">${day.count} reviews</span>
                </div>
            `;
        });
        breakdown.innerHTML = html;
    } else {
        breakdown.innerHTML = '<p style="text-align:center; color:#6c757d;">No reviews scheduled in next 30 days.</p>';
    }
}

// NEW: Render time statistics
function renderTimeStats(timeStats) {
    const escapeHtml = (str) => {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };

    const formatTime = (minutes) => {
        if (minutes < 60) {
            return `${Math.round(minutes)} min`;
        } else {
            const hours = Math.floor(minutes / 60);
            const mins = Math.round(minutes % 60);
            return `${hours}h ${mins}m`;
        }
    };

    // Average times
    const avgTimesEl = document.getElementById('avg-times');
    if (Object.keys(timeStats.averages).length > 0) {
        let html = '';
        for (const [difficulty, avgTime] of Object.entries(timeStats.averages)) {
            const capitalizedDiff = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
            html += `
                <div class="time-stat-item">
                    <span class="time-stat-label">${escapeHtml(capitalizedDiff)}:</span>
                    <span class="time-stat-value">${formatTime(avgTime)}</span>
                </div>
            `;
        }
        avgTimesEl.innerHTML = html;
    } else {
        avgTimesEl.innerHTML = '<p>No data yet.</p>';
    }

    // Fastest solves
    const fastestEl = document.getElementById('fastest-solves');
    if (timeStats.fastest.length > 0) {
        let html = '<ol style="margin: 0; padding-left: 20px;">';
        timeStats.fastest.forEach(solve => {
            html += `<li style="margin-bottom: 4px;">${escapeHtml(solve.title)} (${formatTime(solve.time)})</li>`;
        });
        html += '</ol>';
        fastestEl.innerHTML = html;
    } else {
        fastestEl.innerHTML = '<p>No data yet.</p>';
    }

    // Slowest solves
    const slowestEl = document.getElementById('slowest-solves');
    if (timeStats.slowest.length > 0) {
        let html = '<ol style="margin: 0; padding-left: 20px;">';
        timeStats.slowest.forEach(solve => {
            html += `<li style="margin-bottom: 4px;">${escapeHtml(solve.title)} (${formatTime(solve.time)})</li>`;
        });
        html += '</ol>';
        slowestEl.innerHTML = html;
    } else {
        slowestEl.innerHTML = '<p>No data yet.</p>';
    }

    // Monthly trends
    const trendsEl = document.getElementById('time-trends');
    if (timeStats.trends) {
        const { recentAvg, previousAvg, percentChange, improving } = timeStats.trends;
        const trendClass = improving ? 'trend-positive' : percentChange === 0 ? 'trend-neutral' : 'trend-negative';
        const trendIcon = improving ? '📈 ↓' : percentChange === 0 ? '➡️' : '📉 ↑';
        const trendText = improving ? 'faster' : percentChange === 0 ? 'same' : 'slower';

        trendsEl.innerHTML = `
            <div class="time-stat-item">
                <span class="time-stat-label">Last 30 days:</span>
                <span class="time-stat-value">${formatTime(recentAvg)}</span>
            </div>
            <div class="time-stat-item">
                <span class="time-stat-label">Previous 30 days:</span>
                <span class="time-stat-value">${formatTime(previousAvg)}</span>
            </div>
            <div class="time-stat-item">
                <span class="time-stat-label">Change:</span>
                <span class="${trendClass}">${trendIcon} ${Math.abs(percentChange)}% ${trendText}</span>
            </div>
        `;
    } else {
        trendsEl.innerHTML = '<p>Need submissions from both months.</p>';
    }

    // Weekly trends
    const weeklyEl = document.getElementById('weekly-trends');
    if (timeStats.weeklyTrends) {
        const { recentAvg, previousAvg, percentChange, improving } = timeStats.weeklyTrends;
        const cls = improving ? 'trend-positive' : percentChange === 0 ? 'trend-neutral' : 'trend-negative';
        const icon = improving ? '📈 ↓' : percentChange === 0 ? '➡️' : '📉 ↑';
        const txt = improving ? 'faster' : percentChange === 0 ? 'same' : 'slower';
        weeklyEl.innerHTML = `
            <div class="time-stat-item"><span class="time-stat-label">Last 7 days:</span><span class="time-stat-value">${formatTime(recentAvg)}</span></div>
            <div class="time-stat-item"><span class="time-stat-label">Previous 7 days:</span><span class="time-stat-value">${formatTime(previousAvg)}</span></div>
            <div class="time-stat-item"><span class="time-stat-label">Change:</span><span class="${cls}">${icon} ${Math.abs(percentChange)}% ${txt}</span></div>`;
    } else {
        weeklyEl.innerHTML = '<p>Need data from both weeks.</p>';
    }
}

// Process review forecast
function processReviewForecast(problems) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const reviewsByDate = {};
    let totalDue = 0;
    let dueToday = 0;
    let dueWeek = 0;
    let dueMonth = 0;

    problems.forEach(p => {
        if (p.nextReviewDate && p.status === 'Solved') {
            const reviewDate = new Date(p.nextReviewDate + 'T00:00:00');
            reviewDate.setHours(0, 0, 0, 0);
            const dateStr = p.nextReviewDate;

            reviewsByDate[dateStr] = (reviewsByDate[dateStr] || 0) + 1;

            const diffDays = Math.floor((reviewDate - today) / (1000 * 60 * 60 * 24));

            if (diffDays <= 0) {
                totalDue++;
                dueToday++;
            }
            if (diffDays > 0 && diffDays <= 7) {
                dueWeek++;
            }
            if (diffDays > 7 && diffDays <= 30) {
                dueMonth++;
            }
        }
    });

    // Get next 30 days
    const next30Days = [];
    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const count = reviewsByDate[dateStr] || 0;
        if (count > 0 || i === 0) {
            next30Days.push({
                date: dateStr,
                count,
                isToday: i === 0,
                isOverdue: i === 0 && count > 0
            });
        }
    }

    return {
        totalDue,
        dueToday,
        dueWeek,
        dueMonth,
        next30Days: next30Days.slice(0, 15)
    };
}