# 🎯 LeetCode Spaced Repetition Tracker

A Chrome extension that helps you master LeetCode problems using **spaced repetition** — a scientifically-proven
learning technique that optimizes long-term retention.

![Extension Preview](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)
![Version](https://img.shields.io/badge/version-1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

### 🧠 **Intelligent Spaced Repetition System (SRS)**

- **Exponential scheduling**: Problems are reviewed at increasing intervals based on your confidence
- **Smart load balancing**: Automatically spreads reviews across study days to prevent overload
- **Leech detection**: Identifies problems you're struggling with (🩸 tag)
- **Adaptive stages**: 9 progression stages (0-8) with customizable growth factors

### ⏱️ **Time Tracking & Analytics**

- **On-page timer widget**: Tracks solve time for every problem
- **Auto-confidence suggestions**: Pre-selects confidence level based on your solve time
- **Performance analytics**: View fastest/slowest solves, average times, and trends
- **Submission history**: Complete log of all attempts with timestamps

### 📊 **Progress Dashboard**

- **Visual charts**: See your submission patterns over time (Chart.js)
- **Topic analysis**: Identify strong/weak areas by topic and pattern
- **Review forecast**: See upcoming reviews for today, this week, and this month
- **Daily breakdown**: Detailed calendar view of scheduled reviews

### 🎨 **Customizable Workflow**

- **Phase-based filtering**: Organize problems into learning phases
- **Multi-filter system**: Filter by difficulty, topic, status, and search by name
- **Study schedule**: Choose which days of the week you want to study
- **Configurable thresholds**: Adjust SRS parameters to match your learning style

### 💾 **Data Management**

- **Export/Import**: Backup and restore your progress as JSON files
- **Undo feature**: Reverse accidental submissions (5-minute window)
- **Soft reset**: Reschedule overdue reviews without losing progress
- **Hard reset**: Start fresh while keeping your problem list

---

## 📥 Installation

### **Method 1: Load Unpacked Extension (Recommended for Users)**

1. **Download the extension files**
    - Clone this repository or download as ZIP
   ```bash
   git clone https://github.com/yourusername/leetcode-tracker.git
   ```

2. **Open Chrome Extensions page**
    - Navigate to `chrome://extensions/`
    - Or click **Menu (⋮) → More Tools → Extensions**

3. **Enable Developer Mode**
    - Toggle the **Developer mode** switch in the top-right corner

4. **Load the extension**
    - Click **Load unpacked**
    - Select the `leetcode_extension` folder (the folder containing `manifest.json`)

5. **Verify installation**
    - You should see "My LeetCode Tracker" in your extensions list
    - The extension icon should appear in your Chrome toolbar

6. **Pin the extension** *(Optional but recommended)*
    - Click the puzzle piece icon (🧩) in Chrome toolbar
    - Find "My LeetCode Tracker" and click the pin icon

---

## ⚙️ Initial Setup

### **Step 1: Configure Your Problem List**

The extension pulls problems from a Google Sheet. You have two options:

#### **Option A: Use the Sample Sheet (Recommended for Beginners)**

1. **Open Settings**
    - Click the extension icon → Click **⚙️ Settings**

2. **Access the sample sheet**
    - Click the blue **"sample sheet"** link in the "Problem List Source" section
    - This will
      open: [Sample LeetCode Problem List](https://docs.google.com/spreadsheets/d/1pGW3xFPvF4BU9hV5V2R_G9bLsm9nNlQzLKBCvuHzqKk/edit?usp=sharing)

3. **Make a copy**
    - Click **File → Make a copy**
    - This creates your own editable version

4. **Publish your copy to the web**
    - In your copy, click **File → Share → Publish to web**
    - Under "Link", select **Entire Document**
    - Under "Published content & settings", select **Comma-separated values (.csv)**
    - Click **Publish**
    - Copy the generated URL (it will look like `https://docs.google.com/spreadsheets/d/e/2PACX-...`)

5. **Add URL to extension**
    - Paste the URL into the **Google Sheet URL** field in Settings
    - Click **💾 Save Settings**

6. **Load problems**
    - Click the extension icon
    - Click **🔄 Refresh List**
    - You should now see all problems from your sheet!

#### **Option B: Create Your Own Sheet**

1. **Create a new Google Sheet** with these exact column names (case-insensitive):

   | url | title | difficulty | topic | pattern | phase |
      |-----|-------|------------|-------|---------|-------|
   | https://leetcode.com/problems/two-sum/ | Two Sum | Easy | Array | Basic Operations | PHASE 1 |
   | https://leetcode.com/problems/add-two-numbers/ | Add Two Numbers | Medium | Linked List | Traversal | PHASE 1 |

   **Required columns:**
    - `url`: Full LeetCode problem URL
    - `title`: Problem name
    - `difficulty`: Easy, Medium, or Hard
    - `topic`: Main topic (e.g., "Array", "Graph")
    - `pattern`: Specific pattern (e.g., "Two Pointers", "BFS")
    - `phase`: Learning phase (e.g., "PHASE 1", "PHASE 2")

2. **Follow steps 4-6 from Option A** to publish and connect your sheet

---

### **Step 2: Customize Your Settings**

#### **📚 Spaced Repetition Parameters**

Navigate to **Settings** to configure:

1. **Growth Factor** (how quickly intervals increase)
    - **Conservative (1.5x)**: Review more frequently — better retention
    - **Balanced (1.7x)**: Middle ground
    - **Aggressive (2.0x)**: Review less often — cover more problems faster

   *Example*: Problem intervals with 2.0x growth: 1 day → 2 days → 4 days → 8 days → 16 days

2. **Maximum Review Interval**
    - Longest time between reviews (default: 40 days)
    - Even mastered problems will be reviewed at least once every X days
    - *Recommended: 30-40 days*

3. **Starting Interval**
    - How soon you review after first solving (default: 1 day)
    - *1 day = review tomorrow (best for retention)*
    - *3 days = if you're very confident*

4. **Leech Threshold**
    - Number of "Low" confidence failures before marking as 🩸 Leech
    - *Recommended: 3-5 failures*

5. **Max Reviews Per Day**
    - Prevents overload by spreading reviews across days
    - *Recommended: 10-20 problems*

#### **⏱️ Time-Based Confidence Suggestions**

Set time thresholds (in minutes) for each difficulty level:

| Difficulty | Mastered | High     | Medium   | Low     |
|------------|----------|----------|----------|---------|
| Easy       | < 5 min  | < 15 min | < 30 min | 30+ min |
| Medium     | < 10 min | < 25 min | < 45 min | 45+ min |
| Hard       | < 20 min | < 40 min | < 60 min | 60+ min |

When you submit a problem, the extension will **auto-suggest** a confidence level based on how long you took!

#### **📅 Study Schedule**

- Check the days you want to study
- Reviews will only be scheduled on selected days
- ⚠️ Must select at least one day

---

## 🚀 Usage Guide

### **On LeetCode Problem Pages**

When you open any LeetCode problem, you'll see a **Practice Tracker widget** in the bottom-right corner:

1. **Click "Start"** when you begin solving
2. **Timer runs** — you can pause/resume anytime
3. **Click "Submit"** when you finish
4. **Select confidence level**:
    - **Mastered**: Solved easily, no help needed
    - **High**: Solved with minor issues
    - **Medium**: Needed hints or struggled
    - **Low**: Couldn't solve or heavily relied on solutions

The extension will:

- ✅ Save your solve time
- ✅ Update your SRS stage
- ✅ Schedule the next review date
- ✅ Track this attempt in your history

### **In the Extension Popup**

Click the extension icon to:

#### **Filter Problems**

- **By Phase**: Toggle checkboxes to show/hide learning phases
- **By Difficulty**: Select Easy, Medium, Hard, or All
- **By Topic**: Filter by specific topics from your sheet
- **By Status**: Show all, due reviews, not started, or solved
- **By Name**: Search for specific problems

#### **View Problem Details**

Each problem shows:

- 🏷️ **Tags**: Difficulty, Topic > Pattern, Phase
- 🎯 **Stage**: Current SRS stage (0-8)
- 🩸 **Leech**: If you're struggling with it
- 📅 **Review Date**: When it's next due (red if overdue)
- 🔵 **Last Confidence**: Your last submission rating

#### **Quick Actions**

- **Click a problem** → Opens in new background tab
- **⚙️ Settings** → Configure all parameters
- **📊 Dashboard** → View analytics and stats
- **🔄 Refresh List** → Reload problems from Google Sheet

---

### **On the Dashboard**

Access via **📊 Dashboard** button to see:

#### **📈 Submissions Over Time**

- Line chart showing your problem-solving activity
- Tracks submissions by date

#### **💪 Strong Areas**

- Top topics by "Mastered" count
- Top patterns by "Mastered" count

#### **🧠 Weak Areas**

- Topics with most "Low" confidence submissions
- Patterns you're struggling with

#### **📅 Upcoming Reviews**

- **Total Due**: All problems needing review
- **Due Today**: What you should do today
- **Next 7 Days**: This week's workload
- **Next 30 Days**: Monthly overview
- **Daily Breakdown**: Calendar view of scheduled reviews

#### **⏱️ Time Statistics**

- **Average solve times** by difficulty
- **Fastest solves** (your speed records)
- **Slowest solves** (problems that took longest)
- **Monthly trends** (getting faster over time?)
- **Weekly trends** (this week vs last week)

---

## 🔄 Spaced Repetition Logic

### **How Confidence Levels Affect Scheduling**

| Confidence   | Effect                       | Next Review              |
|--------------|------------------------------|--------------------------|
| **Mastered** | ✅ Advance 1 stage            | Longer interval          |
| **High**     | ✅ Advance 1 stage            | Longer interval          |
| **Medium**   | ⏸️ Stay same or drop 1 stage | Similar/shorter interval |
| **Low**      | ⬇️ Reset to stage 1          | Review sooner (1 day)    |

### **Stage Progression Example**

Assuming **2.0x growth factor** and **1 day starting interval**:

| Stage | Interval         | Total Days Since Start |
|-------|------------------|------------------------|
| 0     | New problem      | 0                      |
| 1     | 1 day            | 1                      |
| 2     | 2 days           | 3                      |
| 3     | 4 days           | 7                      |
| 4     | 8 days           | 15                     |
| 5     | 16 days          | 31                     |
| 6     | 32 days          | 63                     |
| 7     | 40 days (capped) | 103                    |
| 8     | 40 days (capped) | 143                    |

### **Leech System**

A problem becomes a **🩸 Leech** when:

- You've submitted "Low" confidence ≥ threshold times (default: 3)
- AND you're still below Stage 3

**Leech forgiveness**: After 3 consecutive "High" or "Mastered" submissions, the leech counter resets!

### **Smart Load Balancing**

When scheduling reviews, the extension:

1. Calculates the ideal review date based on SRS stage
2. Checks if that day already has too many reviews (> max per day)
3. If overloaded, shifts to the next available day
4. Only schedules on your selected study days

This prevents "review avalanches" and keeps your workload manageable!

---

## 📝 Smart Problem Editor

### **What is it?**

The Smart Problem Editor is your command center for fixing mistakes and fine-tuning your progress. Think of it as the "undo/redo" feature for your LeetCode journey. Whether the timer widget glitched out or you realized you should've rated yourself differently after some reflection, the editor has your back.

The best part? It's **smart** — you just tweak the basics (time, confidence), and it handles all the complex SRS math automatically. Everything stays in perfect sync.

### **How to Access**

- From **⚙️ Settings** → Click **📝 Problem Editor** button (top right)
- From **Extension Popup** → Click **📝 Edit** link (header)

### **What You Can Edit**

1. ✅ **Time** for each attempt (in minutes)
2. ✅ **Confidence** for each attempt (auto or manual override)
3. ✅ **Date/timestamp** of each attempt
4. ✅ **Delete** individual attempts
5. ✅ **Add** new attempts manually
6. ✅ **Reset** problem to "Not Started" (nuclear option - deletes everything)

### **Auto vs Manual Confidence**

Here's where it gets cool. For each attempt, you can choose:

**Auto Mode** (default):
- The editor calculates confidence based on your time and difficulty
- Change time from 5 to 45 minutes → confidence automatically updates from "Mastered" to "Low"
- Uses your time thresholds from Settings

**Manual Override**:
- You pick the confidence yourself from a dropdown
- Maybe you took 45 minutes but felt super confident → select "High"
- Maybe you solved in 10 minutes but had to look up the pattern → select "Medium"
- Sometimes the time doesn't tell the whole story, y'know?

You can switch between auto and manual anytime. The "Auto" option even shows you what it *would* calculate, so you can compare.

### **Live Preview Magic**

This is the part I'm most proud of. As you edit **anything** in the editor, you see the results **instantly**:

- Change time → Stats update in real-time
- Change confidence → Stats update in real-time  
- Add attempt → Stats update in real-time
- Delete attempt → Stats update in real-time

No "save and pray" — you see exactly what's going to happen before you commit. It's like having a time machine preview.

### **What's Auto-Calculated**

Click **"Save & Recalculate"** and the editor computes:

- ✅ **Confidence** (if you're on auto mode)
- ✅ **SRS Stage** (replays all attempts through the algorithm)
- ✅ **Next Review Date** (with smart load balancing)
- ✅ **Lapses** (number of failures)
- ✅ **Consecutive Successes** (for leech forgiveness)
- ✅ **Leech Status** (🩸 tag)
- ✅ **Stage and Interval** for each attempt

### **Real-World Usage Examples**

#### **Scenario 1: "Oh crap, the timer broke"**

You spent 25 minutes on a problem but the widget never started:

1. Open editor, search for the problem
2. Click **"+ Add New Attempt"**
3. Enter "25" minutes
4. Watch it auto-calculate confidence to "Medium"
5. Or manually override to "High" if you felt good about it
6. Save
7. ✅ Like it never happened!

#### **Scenario 2: "I was too hard on myself"**

You logged a problem as "Low" but after sleeping on it, you realized you actually understood it well:

1. Search for the problem
2. Find that attempt
3. Change confidence dropdown from "Auto (low)" to "High"
4. Watch your SRS stage jump from 1 to 3 (instant preview!)
5. Save
6. ✅ Fixed without messing up your streak

#### **Scenario 3: "Wrong time, my bad"**

You finished in 45 minutes but accidentally logged 5:

1. Find the problem
2. Change "5" to "45" minutes  
3. Watch confidence change from "Mastered" to "Low" in real-time
4. See your next review date shift from 2 weeks out to tomorrow
5. Save
6. ✅ Back on track

#### **Scenario 4: "I want to start over on this problem"**

You have 5 messy attempts and just want a clean slate:

1. Find the problem
2. Click **"Mark as Not Started"**
3. Confirm
4. ✅ Problem reset, ready for a fresh attempt

### **How It Works Under the Hood**

The editor uses something called **event sourcing** (fancy term, simple concept):

1. Takes all your attempts as raw inputs (date, time, maybe confidence)
2. Deletes all the calculated stuff (stage, lapses, etc.)
3. Replays your attempts **in order** through the same SRS algorithm the timer widget uses
4. Recalculates everything from scratch

This guarantees 100% consistency — no weird edge cases, no drift between the timer and editor. They literally use the same code (`srsEngine.js`).

### **The Philosophy**

Manual confidence override breaks a rule I originally had: "confidence must always come from time." But here's the thing — sometimes you need to override the math. Maybe you're having a bad day. Maybe you got interrupted. Maybe the problem clicked 30 minutes in but you still took 60.

So now you get both: auto-calculation for consistency, manual override for when life happens. The editor is here to help you stay honest with yourself while giving you the flexibility to tell your own story.

---

## 💾 Data Management

### **Export Your Progress**

1. Go to **⚙️ Settings → 💾 Data Management**
2. Click **📥 Export Progress**
3. Saves `leetcode-tracker-backup-YYYY-MM-DD.json` to your Downloads

**Export before**:

- Resetting progress
- Switching computers
- Major setting changes
- Reinstalling the extension

### **Import a Backup**

1. Go to **⚙️ Settings → 💾 Data Management**
2. Click **📤 Import Progress**
3. Select your backup JSON file
4. ⚠️ **Warning**: This replaces ALL current data

### **Undo Last Submission**

Made a mistake? Click **↩️ Undo Last Submission** in Settings within **5 minutes** to reverse it!

### **Reschedule Overdue Reviews (Soft Reset)**

If you have too many overdue problems piled up:

1. Go to **⚙️ Settings → 💾 Data Management**
2. Click **🔄 Reschedule All Due Items**
3. Confirms before spreading them over the next 2-3 days
4. ✅ Your progress (stages, stats) stays intact

### **Reset All Progress (Hard Reset)**

**⚠️ NUCLEAR OPTION** — Start completely fresh:

1. Go to **⚙️ Settings → 💾 Data Management**
2. Click **⚠️ Reset All Progress**
3. Click again to confirm (within 5 seconds)
4. Final warning dialog
5. ❌ Erases ALL submissions, stages, and history

**ALWAYS export a backup first!**

---

## 🛠️ Troubleshooting

### **"No problems found" in popup**

**Solution**:

1. Check that your Google Sheet URL is set in Settings
2. Make sure you published the sheet as CSV (not HTML)
3. Click **🔄 Refresh List** in the popup
4. Check browser console for errors (`F12` → Console tab)

### **"Failed to fetch from Google Sheet" error**

**Causes**:

- Sheet URL is incorrect
- Sheet is not published to web
- Sheet columns are missing or misspelled
- Network connection issue

**Solution**:

1. Re-publish your Google Sheet to web as CSV
2. Copy the new URL
3. Update in Settings
4. Click Refresh List

### **Widget not showing on LeetCode**

**Solution**:

1. Make sure you're on a problem page (`leetcode.com/problems/...`)
2. Refresh the LeetCode page
3. Check if the extension is enabled in `chrome://extensions/`
4. Reload the extension

### **Emojis showing as boxes or question marks**

**Solution**:

1. Update Chrome to the latest version
2. The updated `popup.html` includes emoji font fixes
3. Clear browser cache and reload extension

### **Timer keeps resetting**

This happens when navigating between tabs on the same problem (e.g., Description → Solutions). This is intentional to
prevent confusion.

**Workaround**: Stay on one tab while solving.

### **Reviews not scheduling on my study days**

**Check**:

1. Go to Settings → Study Schedule
2. Make sure at least one day is checked
3. If all days are unchecked, the extension defaults to all days

### **Stats not updating when I edit in the editor**

This was a bug in earlier versions. Make sure you have the latest version with live preview:

1. Make any change (time, confidence, add/delete attempt)
2. Stats should update **immediately** (before you save)
3. If they don't, you might be on an old version — reload the extension

### **Confidence stuck on "Auto" or wrong value**

If you're editing an old attempt and the confidence dropdown doesn't seem right:

1. The dropdown shows "Auto (suggestion)" if no manual override is set
2. If you want to override, just select any other option
3. If you want pure auto-calculation, keep "Auto" selected
4. The "(suggestion)" text updates as you change time

### **Popup doesn't refresh after editing**

The latest version has auto-refresh! If your popup isn't updating:

1. Make sure you have the updated `popup.js` and `dashboard.js`
2. These files listen for storage changes and auto-refresh
3. You should see "Problems updated in storage, refreshing popup..." in console
4. If not, manually click "Refresh List" or close/reopen popup

---

## 📂 File Structure

```
leetcode_extension/
├── manifest.json          # Extension configuration
├── srsEngine.js           # ⭐ Shared SRS calculation engine (used by both timer & editor)
├── background.js          # Service worker (imports srsEngine.js)
├── contentScript.js       # Timer widget injected on LeetCode pages
├── popup.html             # Extension popup UI
├── popup.js               # Popup logic (auto-refreshes on storage changes)
├── settings.html          # Settings page UI
├── settings.js            # Settings logic (save/load, reset)
├── editor.html            # ⭐ Smart problem editor UI with manual confidence
├── editor.js              # ⭐ Editor logic with live preview (uses srsEngine.js)
├── dashboard.html         # Analytics dashboard UI
├── dashboard.js           # Dashboard logic (charts, stats, auto-refresh)
├── style.css              # Unified styles
├── chart.min.js           # Chart.js library (for graphs)
└── icon.png               # Extension icon
```

**⭐ = Files updated in recent version with manual confidence override & live preview**

---

## 🔐 Privacy & Permissions

### **Permissions Required**

- `storage`: Save your progress locally in Chrome
- `https://docs.google.com/*`: Fetch your problem list from Google Sheets
- `https://leetcode.com/problems/*`: Inject timer widget on problem pages

### **Data Storage**

- **All data is stored locally** in your browser's Chrome storage
- **Nothing is sent to external servers** (except fetching your Google Sheet)
- **No tracking or analytics** — your data is 100% private
- **No account required** — works completely offline after initial sheet fetch

---

## 🤝 Contributing

Contributions are welcome! Here are some ideas:

- [ ] Add keyboard shortcuts for confidence selection
- [ ] Dark mode support
- [ ] Sync across devices (using Chrome Sync)
- [ ] Export to Anki flashcards
- [ ] Mobile app version
- [ ] Support for other competitive programming sites (Codeforces, HackerRank)

### **How to Contribute**

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Spaced Repetition Algorithm** inspired by [Anki](https://apps.ankiweb.net/)
- **Chart.js** for beautiful graphs
- **LeetCode** for the amazing platform
- **Google Sheets** for free, easy data hosting
- **Claude (Anthropic)** for being an incredible development partner — this entire extension was built collaboratively with Claude's help, from architecture decisions to debugging gnarly edge cases

### **A Note on Development**

This extension was built with the help of Claude AI. Not in a "generate boilerplate code" way, but as a genuine collaborative process. Every feature, every bug fix, every design decision was discussed, debugged, and refined together.

Some highlights:
- Claude helped architect the shared `srsEngine.js` to keep timer widget and editor perfectly in sync
- We spent hours debugging why confidence wasn't recalculating (turns out, removing `if (!attempt.confidence)` was breaking manual overrides)
- The live preview feature? That was Claude's idea after noticing the inconsistency between "Delete" showing previews but "Add" not doing so
- The "Auto vs Manual" confidence system came from a back-and-forth about whether users should be able to override time-based calculations

Building with AI wasn't about replacing the thinking — it was about having a tireless pair-programming partner who could spot edge cases, suggest better approaches, and write clean code at 3 AM when my brain was mush.

If you're learning to code or building your own projects, I highly recommend trying this collaborative approach. It's like having a senior engineer who never gets tired of explaining things.

---

## 📧 Support

If you encounter issues:

1. Check the **Troubleshooting** section above
2. Open an issue on GitHub with:
    - Browser version
    - Extension version
    - Steps to reproduce
    - Error messages (from `F12` Console)

---

## 🌟 Star This Project

If this extension helped you ace your coding interviews, please ⭐ star this repository!

---

**Happy coding! 🚀**

*Master LeetCode one spaced repetition at a time.*