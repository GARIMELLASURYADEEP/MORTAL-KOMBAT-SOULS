const STORAGE_KEYS = {
  souls: 'mkm_soulsData',
  crystals: 'mkm_crystalData',
  koins: 'mkm_koinData',
  settings: 'mkm_settingsData',
  analytics: 'mkm_analyticsData',
  milestones: 'mkm_milestoneData',
  ui: 'mkm_uiPreferences'
};

let soulsData = [];
let crystalData = [];
let koinData = [];
let settingsData = { animations: true };
let milestoneData = { reached: [] };
let uiPreferences = { activeSection: 'dashboard', trackerMenuOpen: false };
let sourceChart, dailyChart, weeklyChart;
let editingSoulId = null;
let editingCrystalId = null;
let editingKoinId = null;

const dom = {
  pages: document.querySelectorAll('.page'),
  navButtons: document.querySelectorAll('[data-target]'),
  trackerMenuButton: document.getElementById('trackerMenuButton'),
  trackerDropdownMobile: document.getElementById('trackerDropdownMobile'),
  bottomNav: document.getElementById('bottomNav'),
  soulsForm: document.getElementById('soulsForm'),
  crystalForm: document.getElementById('crystalForm'),
  koinForm: document.getElementById('koinForm'),
  sourceSelect: document.getElementById('soulSource'),
  customSourceLabel: document.getElementById('soulCustomSourceLabel'),
  predictionForm: document.getElementById('predictionForm'),
  predictionCards: document.getElementById('predictionCards'),
  predictionNote: document.getElementById('predictionNote'),
  exportBackup: document.getElementById('exportBackup'),
  importBackup: document.getElementById('importBackup'),
  backupFile: document.getElementById('backupFile'),
  clearData: document.getElementById('clearData'),
  toggleAnimations: document.getElementById('toggleAnimations'),
  notificationPopup: document.getElementById('notificationPopup'),
  milestoneModal: document.getElementById('milestoneModal'),
  milestoneModalText: document.getElementById('milestoneModalText'),
  closeMilestone: document.getElementById('closeMilestone'),
  totals: {
    totalSouls: document.getElementById('totalSouls'),
    totalCrystals: document.getElementById('totalCrystals'),
    totalKoins: document.getElementById('totalKoins'),
    todayCollection: document.getElementById('todayCollection'),
    weeklySouls: document.getElementById('weeklySouls'),
    monthlySouls: document.getElementById('monthlySouls'),
    nextMilestone: document.getElementById('nextMilestone'),
    milestoneProgress: document.getElementById('milestoneProgress'),
    milestoneNote: document.getElementById('milestoneNote')
  },
  counts: {
    soulsCount: document.getElementById('soulsCount'),
    crystalCount: document.getElementById('crystalCount'),
    koinCount: document.getElementById('koinCount')
  },
  history: {
    soulsHistory: document.getElementById('soulsHistory'),
    crystalHistory: document.getElementById('crystalHistory'),
    koinHistory: document.getElementById('koinHistory'),
    recentActivity: document.getElementById('recentActivity')
  },
  charts: {
    sourceChartNote: document.getElementById('sourceChartNote'),
    dailyChartNote: document.getElementById('dailyChartNote'),
    weeklyChartNote: document.getElementById('weeklyChartNote')
  }
};

function loadData() {
  try {
    soulsData = JSON.parse(localStorage.getItem(STORAGE_KEYS.souls) || '[]');
    crystalData = JSON.parse(localStorage.getItem(STORAGE_KEYS.crystals) || '[]');
    koinData = JSON.parse(localStorage.getItem(STORAGE_KEYS.koins) || '[]');
    settingsData = JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) || JSON.stringify(settingsData));
    milestoneData = JSON.parse(localStorage.getItem(STORAGE_KEYS.milestones) || JSON.stringify(milestoneData));
    uiPreferences = JSON.parse(localStorage.getItem(STORAGE_KEYS.ui) || JSON.stringify(uiPreferences));
    if (typeof settingsData.animations !== 'boolean') settingsData.animations = true;
  } catch (error) {
    console.warn('Failed to load local data.', error);
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEYS.souls, JSON.stringify(soulsData));
  localStorage.setItem(STORAGE_KEYS.crystals, JSON.stringify(crystalData));
  localStorage.setItem(STORAGE_KEYS.koins, JSON.stringify(koinData));
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settingsData));
  localStorage.setItem(STORAGE_KEYS.milestones, JSON.stringify(milestoneData));
  localStorage.setItem(STORAGE_KEYS.ui, JSON.stringify(uiPreferences));
  localStorage.setItem(STORAGE_KEYS.analytics, JSON.stringify(calculateAnalytics()));
}

function formatNumber(value) {
  return value.toLocaleString();
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getDateLabel(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function calculateTotals() {
  const today = getTodayKey();
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  let totalSouls = 0;
  let daySouls = 0;
  let weekSouls = 0;
  let monthSouls = 0;

  soulsData.forEach((entry) => {
    totalSouls += entry.amount;
    if (entry.date === today) daySouls += entry.amount;
    const date = new Date(entry.date);
    if (date >= weekStart) weekSouls += entry.amount;
    if (date >= monthStart) monthSouls += entry.amount;
  });

  const totalCrystals = crystalData.reduce((sum, entry) => sum + entry.amount, 0);
  const totalKoins = koinData.reduce((sum, entry) => sum + entry.amount, 0);

  return {
    totalSouls,
    totalCrystals,
    totalKoins,
    daySouls,
    weekSouls,
    monthSouls
  };
}

function calculateAnalytics() {
  const groupedSources = soulsData.reduce((acc, entry) => {
    const source = entry.source === 'Others' ? (entry.customSource || 'Others') : entry.source;
    acc[source] = (acc[source] || 0) + entry.amount;
    return acc;
  }, {});

  const byDate = soulsData.reduce((acc, entry) => {
    acc[entry.date] = (acc[entry.date] || 0) + entry.amount;
    return acc;
  }, {});

  const dailyDates = Object.keys(byDate).sort();
  const dailyValues = dailyDates.map((date) => byDate[date]);

  const weeklyTotals = {};
  soulsData.forEach((entry) => {
    const date = new Date(entry.date);
    const week = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${Math.ceil(date.getDate() / 7)}`;
    weeklyTotals[week] = (weeklyTotals[week] || 0) + entry.amount;
  });

  const weeklyLabels = Object.keys(weeklyTotals).sort();
  const weeklyValues = weeklyLabels.map((week) => weeklyTotals[week]);

  return {
    sourceDistribution: groupedSources,
    dailyTrend: { labels: dailyDates, values: dailyValues },
    weeklyGrowth: { labels: weeklyLabels, values: weeklyValues }
  };
}

function renderTotals() {
  const totals = calculateTotals();
  dom.totals.totalSouls.textContent = formatNumber(totals.totalSouls);
  dom.totals.totalCrystals.textContent = formatNumber(totals.totalCrystals);
  dom.totals.totalKoins.textContent = formatNumber(totals.totalKoins);
  dom.totals.todayCollection.textContent = formatNumber(totals.daySouls + totals.totalCrystals + totals.totalKoins);
  dom.totals.weeklySouls.textContent = formatNumber(totals.weekSouls);
  dom.totals.monthlySouls.textContent = formatNumber(totals.monthSouls);
}

function renderRecentActivity() {
  const allEntries = [...soulsData.map((entry) => ({ type: 'Souls', ...entry })),
    ...crystalData.map((entry) => ({ type: 'Crystals', ...entry })),
    ...koinData.map((entry) => ({ type: 'Koins', ...entry }))];
  const recent = allEntries.sort((a, b) => b.timestamp - a.timestamp).slice(0, 6);

  dom.history.recentActivity.innerHTML = recent.length ? recent.map((entry) => `
    <div class="history-item">
      <strong>${entry.type}: ${formatNumber(entry.amount)} • ${getDateLabel(entry.date)}</strong>
      <div>${entry.source || entry.reason || entry.customSource || 'No source'}</div>
      <div class="history-actions">
        <span>${entry.note || '-'}</span>
      </div>
    </div>
  `).join('') : '<div class="history-item"><strong>No recent entries yet.</strong><div>Start logging to build your command center.</div></div>';
}

function renderMilestone() {
  const totals = calculateTotals();
  const milestones = [1000, 5000, 10000, 25000, 50000, 100000];
  const next = milestones.find((value) => totals.totalSouls < value) || milestones[milestones.length - 1];
  const progress = Math.min(100, (totals.totalSouls / next) * 100);
  const nextLabel = totals.totalSouls >= next ? next : next;

  dom.totals.nextMilestone.textContent = formatNumber(nextLabel);
  dom.totals.milestoneProgress.style.width = `${progress}%`;
  dom.totals.milestoneNote.textContent = `You are ${formatNumber(next - totals.totalSouls)} souls away from the next milestone.`;

  if (totals.totalSouls >= next && !milestoneData.reached.includes(next)) {
    milestoneData.reached.push(next);
    saveData();
    showMilestoneModal(`Milestone achieved: ${formatNumber(next)} Souls. Keep the grind going.`);
  }
}

function showMilestoneModal(message) {
  dom.milestoneModalText.textContent = message;
  dom.milestoneModal.setAttribute('aria-hidden', 'false');
}

function closeMilestoneModal() {
  dom.milestoneModal.setAttribute('aria-hidden', 'true');
}

function showToast(message) {
  dom.notificationPopup.textContent = message;
  dom.notificationPopup.classList.add('show');
  setTimeout(() => dom.notificationPopup.classList.remove('show'), 2200);
}

function buildEntryMarkup(entry, type) {
  const actionButtons = [];
  if (type === 'souls') {
    actionButtons.push(`<button class="button button--soft" data-action="edit" data-id="${entry.id}" data-type="souls">Edit</button>`);
    actionButtons.push(`<button class="button button--soft" data-action="delete" data-id="${entry.id}" data-type="souls">Delete</button>`);
  }
  if (type === 'crystals') {
    actionButtons.push(`<button class="button button--soft" data-action="edit" data-id="${entry.id}" data-type="crystals">Edit</button>`);
    actionButtons.push(`<button class="button button--soft" data-action="delete" data-id="${entry.id}" data-type="crystals">Delete</button>`);
  }
  if (type === 'koins') {
    actionButtons.push(`<button class="button button--soft" data-action="edit" data-id="${entry.id}" data-type="koins">Edit</button>`);
    actionButtons.push(`<button class="button button--soft" data-action="delete" data-id="${entry.id}" data-type="koins">Delete</button>`);
  }

  return `
    <div class="history-item">
      <strong>${formatNumber(entry.amount)} • ${getDateLabel(entry.date)}</strong>
      <div>${entry.source || entry.reason || entry.customSource || 'No source'}${entry.source === 'Others' && entry.customSource ? ` • ${entry.customSource}` : ''}</div>
      <div>${entry.note || 'No note'}</div>
      <div class="history-actions">${actionButtons.join('')}</div>
    </div>
  `;
}

function renderHistory() {
  dom.history.soulsHistory.innerHTML = soulsData.length ? soulsData.slice().sort((a, b) => b.timestamp - a.timestamp).map((entry) => buildEntryMarkup(entry, 'souls')).join('') : '<div class="history-item"><strong>No souls entries yet.</strong><div>Add your first entry to begin tracking.</div></div>';
  dom.history.crystalHistory.innerHTML = crystalData.length ? crystalData.slice().sort((a, b) => b.timestamp - a.timestamp).map((entry) => buildEntryMarkup(entry, 'crystals')).join('') : '<div class="history-item"><strong>No crystal entries yet.</strong><div>Track every reward source here.</div></div>';
  dom.history.koinHistory.innerHTML = koinData.length ? koinData.slice().sort((a, b) => b.timestamp - a.timestamp).map((entry) => buildEntryMarkup(entry, 'koins')).join('') : '<div class="history-item"><strong>No koin entries yet.</strong><div>Use the tracker to keep koins under control.</div></div>';
}

function refreshCharts() {
  const analytics = calculateAnalytics();
  const sourceLabels = Object.keys(analytics.sourceDistribution);
  const sourceValues = Object.values(analytics.sourceDistribution);
  const topSource = sourceLabels.reduce((max, label, idx) => sourceValues[idx] > (analytics.sourceDistribution[max] || 0) ? label : max, sourceLabels[0] || 'No data');

  const dailyLabels = analytics.dailyTrend.labels;
  const dailyValues = analytics.dailyTrend.values;
  const weeklyLabels = analytics.weeklyGrowth.labels.map((week) => `W${week.split('-').pop()}`);
  const weeklyValues = analytics.weeklyGrowth.values;

  if (sourceChart) sourceChart.destroy();
  if (dailyChart) dailyChart.destroy();
  if (weeklyChart) weeklyChart.destroy();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: 'rgba(13, 17, 24, 0.95)', titleColor: '#fff', bodyColor: '#fff' }
    }
  };

  const sourceCtx = document.getElementById('sourceChart').getContext('2d');
  sourceChart = new Chart(sourceCtx, {
    type: 'doughnut',
    data: {
      labels: sourceLabels,
      datasets: [{
        data: sourceValues,
        backgroundColor: ['#5ecb82', '#ffbf4c', '#ff7d4a', '#f0666e', '#9b59b6', '#7f8c8d']
      }]
    },
    options: chartOptions
  });

  const dailyCtx = document.getElementById('dailyChart').getContext('2d');
  dailyChart = new Chart(dailyCtx, {
    type: 'line',
    data: {
      labels: dailyLabels,
      datasets: [{
        label: 'Souls',
        data: dailyValues,
        borderColor: '#5ecb82',
        backgroundColor: 'rgba(94, 203, 130, 0.16)',
        tension: 0.35,
        fill: true,
        pointRadius: 2
      }]
    },
    options: chartOptions
  });

  const weeklyCtx = document.getElementById('weeklyChart').getContext('2d');
  weeklyChart = new Chart(weeklyCtx, {
    type: 'bar',
    data: {
      labels: weeklyLabels,
      datasets: [{
        label: 'Weekly Souls',
        data: weeklyValues,
        backgroundColor: weeklyValues.map((_, idx) => idx % 2 ? '#ffbf4c' : '#5ecb82')
      }]
    },
    options: chartOptions
  });

  dom.charts.sourceChartNote.textContent = sourceLabels.length ? `Most souls come from ${topSource}. Fine-tune your routine around high-value sources.` : 'Add soul entries to unlock source breakdown insights.';
  dom.charts.dailyChartNote.textContent = dailyValues.length ? `Your daily soul pace is visible. Track streaks or adjust your grind if totals change.` : 'Daily trend charts update as you add more soul entries.';
  dom.charts.weeklyChartNote.textContent = weeklyValues.length ? `Weekly growth shows how stable your farming pattern is. Strong weeks reflect focused daily progress.` : 'Weekly insights appear once your tracker captures multiple entries.';
}

function renderPredictions() {
  const result = JSON.parse(localStorage.getItem('mkm_predictionData') || 'null');
  if (!result) {
    dom.predictionCards.innerHTML = '<div class="card wide-card"><p class="chart-note">Enter your average souls per day to see week, month, and year projections.</p></div>';
    return;
  }

  const projections = [
    { label: '7 Days', days: 7 },
    { label: '30 Days', days: 30 },
    { label: '60 Days', days: 60 },
    { label: '90 Days', days: 90 },
    { label: '180 Days', days: 180 },
    { label: '365 Days', days: 365 },
    { label: '5 Years', days: 1825 },
    { label: '10 Years', days: 3650 }
  ];

  const totalSouls = calculateTotals().totalSouls;
  dom.predictionCards.innerHTML = projections.map((projection) => {
    const projected = result.dailyAverage * projection.days;
    const total = projected + totalSouls;
    return `
      <article class="card prediction-card">
        <h3>${projection.label}</h3>
        <p class="card-value">${formatNumber(projected)}</p>
        <p class="chart-note">${formatNumber(total)} total souls if your pace remains stable.</p>
      </article>
    `;
  }).join('');
  dom.predictionNote.textContent = `Based on ${formatNumber(result.dailyAverage)} Souls/day, your next milestone is in reach with steady progress. Adjust your targets when your daily average changes.`;
}

function openSection(target) {
  dom.pages.forEach((page) => page.id === target ? page.classList.add('page--active') : page.classList.remove('page--active'));
  uiPreferences.activeSection = target;
  saveData();
}

function toggleTrackerDropdown() {
  const dropdown = dom.trackerDropdownMobile;
  dropdown.classList.toggle('open');
  uiPreferences.trackerMenuOpen = dropdown.classList.contains('open');
  saveData();
}

function closeTrackerDropdown() {
  dom.trackerDropdownMobile.classList.remove('open');
  uiPreferences.trackerMenuOpen = false;
  saveData();
}

function handleNavClick(event) {
  const target = event.currentTarget.dataset.target;
  if (!target) return;
  openSection(target);
  closeTrackerDropdown();
}

function handleDropdownSelection(event) {
  const target = event.currentTarget.dataset.target;
  if (!target) return;
  openSection(target);
  closeTrackerDropdown();
}

function handleSourceChange() {
  const isOthers = dom.sourceSelect.value === 'Others';
  dom.customSourceLabel.style.display = isOthers ? 'block' : 'none';
}

function findEntryById(type, id) {
  const list = type === 'souls' ? soulsData : type === 'crystals' ? crystalData : koinData;
  return list.find((entry) => entry.id === id);
}

function removeEntryById(type, id) {
  if (type === 'souls') soulsData = soulsData.filter((entry) => entry.id !== id);
  if (type === 'crystals') crystalData = crystalData.filter((entry) => entry.id !== id);
  if (type === 'koins') koinData = koinData.filter((entry) => entry.id !== id);
  saveData();
  renderAll();
}

function handleHistoryAction(event) {
  const button = event.target.closest('button');
  if (!button) return;
  const action = button.dataset.action;
  const id = button.dataset.id;
  const type = button.dataset.type;
  if (!action || !id || !type) return;

  if (action === 'delete') {
    removeEntryById(type, id);
    showToast('Entry deleted');
    return;
  }

  const entry = findEntryById(type, id);
  if (!entry) return;

  if (action === 'edit') {
    if (type === 'souls') {
      document.getElementById('soulAmount').value = entry.amount;
      document.getElementById('soulDate').value = entry.date;
      document.getElementById('soulSource').value = entry.source;
      document.getElementById('soulNote').value = entry.note || '';
      document.getElementById('soulCustomSource').value = entry.customSource || '';
      editingSoulId = entry.id;
      if (entry.source === 'Others') dom.customSourceLabel.style.display = 'block';
      dom.soulsSubmit.textContent = 'Update Entry';
    }
    if (type === 'crystals') {
      document.getElementById('crystalAmount').value = entry.amount;
      document.getElementById('crystalDate').value = entry.date;
      document.getElementById('crystalSource').value = entry.source;
      document.getElementById('crystalNote').value = entry.note || '';
      editingCrystalId = entry.id;
      dom.crystalSubmit.textContent = 'Update Entry';
    }
    if (type === 'koins') {
      document.getElementById('koinAmount').value = entry.amount;
      document.getElementById('koinDate').value = entry.date;
      document.getElementById('koinSource').value = entry.reason;
      document.getElementById('koinNote').value = entry.note || '';
      editingKoinId = entry.id;
      dom.koinSubmit.textContent = 'Update Entry';
    }
  }
}

function resetForm(form) {
  form.reset();
  if (form.id === 'soulsForm') {
    dom.customSourceLabel.style.display = 'none';
    dom.soulsSubmit.textContent = 'Save Entry';
    editingSoulId = null;
  }
  if (form.id === 'crystalForm') {
    dom.crystalSubmit.textContent = 'Save Entry';
    editingCrystalId = null;
  }
  if (form.id === 'koinForm') {
    dom.koinSubmit.textContent = 'Save Entry';
    editingKoinId = null;
  }
}

function handleSoulSubmit(event) {
  event.preventDefault();
  const amount = Number(document.getElementById('soulAmount').value);
  const date = document.getElementById('soulDate').value;
  const source = document.getElementById('soulSource').value;
  const customSource = document.getElementById('soulCustomSource').value.trim();
  const note = document.getElementById('soulNote').value.trim();

  if (!amount || !date) return;
  const entry = {
    id: editingSoulId || `soul-${Date.now()}`,
    amount,
    date,
    source,
    customSource,
    note,
    timestamp: Date.now()
  };

  if (editingSoulId) {
    soulsData = soulsData.map((item) => item.id === editingSoulId ? entry : item);
    showToast('Soul entry updated');
  } else {
    soulsData.push(entry);
    showToast('Soul entry added');
  }

  saveData();
  renderAll();
  resetForm(dom.soulsForm);
}

function handleCrystalSubmit(event) {
  event.preventDefault();
  const amount = Number(document.getElementById('crystalAmount').value);
  const date = document.getElementById('crystalDate').value;
  const source = document.getElementById('crystalSource').value.trim();
  const note = document.getElementById('crystalNote').value.trim();

  if (!amount || !date || !source) return;
  const entry = {
    id: editingCrystalId || `crystal-${Date.now()}`,
    amount,
    date,
    source,
    note,
    timestamp: Date.now()
  };

  if (editingCrystalId) {
    crystalData = crystalData.map((item) => item.id === editingCrystalId ? entry : item);
    showToast('Crystal entry updated');
  } else {
    crystalData.push(entry);
    showToast('Crystal entry added');
  }

  saveData();
  renderAll();
  resetForm(dom.crystalForm);
}

function handleKoinSubmit(event) {
  event.preventDefault();
  const amount = Number(document.getElementById('koinAmount').value);
  const date = document.getElementById('koinDate').value;
  const source = document.getElementById('koinSource').value.trim();
  const note = document.getElementById('koinNote').value.trim();

  if (!amount || !date || !source) return;
  const entry = {
    id: editingKoinId || `koin-${Date.now()}`,
    amount,
    date,
    reason: source,
    note,
    timestamp: Date.now()
  };

  if (editingKoinId) {
    koinData = koinData.map((item) => item.id === editingKoinId ? entry : item);
    showToast('Koin entry updated');
  } else {
    koinData.push(entry);
    showToast('Koin entry added');
  }

  saveData();
  renderAll();
  resetForm(dom.koinForm);
}

function handlePredictionSubmit(event) {
  event.preventDefault();
  const dailyAverage = Number(document.getElementById('predictionDaily').value);
  if (!dailyAverage || dailyAverage <= 0) return;
  const predictionData = { dailyAverage };
  localStorage.setItem('mkm_predictionData', JSON.stringify(predictionData));
  renderPredictions();
  showToast('Projection updated');
}

function syncSettings() {
  dom.toggleAnimations.checked = settingsData.animations;
  if (!settingsData.animations) {
    document.body.style.transition = 'none';
  } else {
    document.body.style.transition = '';
  }
}

function clearAllData() {
  if (!confirm('Clear all stored data and reset the app?')) return;
  soulsData = [];
  crystalData = [];
  koinData = [];
  milestoneData = { reached: [] };
  settingsData = { animations: settingsData.animations };
  uiPreferences = { activeSection: 'dashboard', trackerMenuOpen: false };
  localStorage.removeItem(STORAGE_KEYS.souls);
  localStorage.removeItem(STORAGE_KEYS.crystals);
  localStorage.removeItem(STORAGE_KEYS.koins);
  localStorage.removeItem(STORAGE_KEYS.analytics);
  localStorage.removeItem(STORAGE_KEYS.milestones);
  localStorage.removeItem(STORAGE_KEYS.ui);
  localStorage.removeItem('mkm_predictionData');
  saveData();
  renderAll();
  showToast('All data cleared');
}

function exportBackupFile() {
  const backup = {
    soulsData,
    crystalData,
    koinData,
    settingsData,
    milestoneData,
    uiPreferences,
    analyticsData: calculateAnalytics(),
    predictionData: JSON.parse(localStorage.getItem('mkm_predictionData') || 'null')
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'mk-mobile-tracker-backup.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast('Backup exported');
}

function importBackupFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      soulsData = Array.isArray(data.soulsData) ? data.soulsData : soulsData;
      crystalData = Array.isArray(data.crystalData) ? data.crystalData : crystalData;
      koinData = Array.isArray(data.koinData) ? data.koinData : koinData;
      settingsData = data.settingsData ? data.settingsData : settingsData;
      milestoneData = data.milestoneData ? data.milestoneData : milestoneData;
      uiPreferences = data.uiPreferences ? data.uiPreferences : uiPreferences;
      if (data.predictionData) localStorage.setItem('mkm_predictionData', JSON.stringify(data.predictionData));
      saveData();
      renderAll();
      showToast('Backup restored');
    } catch (error) {
      console.error(error);
      alert('Unable to import backup. The file may be invalid.');
    }
  };
  reader.readAsText(file);
}

function renderAll() {
  renderTotals();
  renderRecentActivity();
  renderMilestone();
  renderHistory();
  refreshCharts();
  renderPredictions();
  dom.counts.soulsCount.textContent = soulsData.length;
  dom.counts.crystalCount.textContent = crystalData.reduce((sum, entry) => sum + entry.amount, 0);
  dom.counts.koinCount.textContent = koinData.reduce((sum, entry) => sum + entry.amount, 0);
}

function attachEvents() {
  dom.navButtons.forEach((button) => button.addEventListener('click', handleNavClick));
  dom.trackerMenuButton.addEventListener('click', toggleTrackerDropdown);
  dom.trackerDropdownMobile.querySelectorAll('.dropdown-item').forEach((button) => button.addEventListener('click', handleDropdownSelection));
  dom.sourceSelect.addEventListener('change', handleSourceChange);
  dom.soulsForm.addEventListener('submit', handleSoulSubmit);
  dom.crystalForm.addEventListener('submit', handleCrystalSubmit);
  dom.koinForm.addEventListener('submit', handleKoinSubmit);
  dom.predictionForm.addEventListener('submit', handlePredictionSubmit);
  dom.exportBackup.addEventListener('click', exportBackupFile);
  dom.importBackup.addEventListener('click', () => dom.backupFile.click());
  dom.backupFile.addEventListener('change', (event) => importBackupFile(event.target.files[0]));
  dom.clearData.addEventListener('click', clearAllData);
  dom.toggleAnimations.addEventListener('change', () => {
    settingsData.animations = dom.toggleAnimations.checked;
    syncSettings();
    saveData();
    showToast('Animation preference saved');
  });
  document.body.addEventListener('click', (event) => {
    if (!dom.trackerDropdownMobile.contains(event.target) && event.target !== dom.trackerMenuButton) closeTrackerDropdown();
  });
  dom.history.soulsHistory.addEventListener('click', handleHistoryAction);
  dom.history.crystalHistory.addEventListener('click', handleHistoryAction);
  dom.history.koinHistory.addEventListener('click', handleHistoryAction);
  dom.closeMilestone.addEventListener('click', closeMilestoneModal);
}

function initializeActiveSection() {
  openSection(uiPreferences.activeSection || 'dashboard');
  if (uiPreferences.trackerMenuOpen) dom.trackerDropdownMobile.classList.add('open');
}

function initializeDates() {
  const today = getTodayKey();
  const soulDate = document.getElementById('soulDate');
  const crystalDate = document.getElementById('crystalDate');
  const koinDate = document.getElementById('koinDate');
  soulDate.value = soulDate.value || today;
  crystalDate.value = crystalDate.value || today;
  koinDate.value = koinDate.value || today;
}

function init() {
  loadData();
  initializeDates();
  syncSettings();
  attachEvents();
  initializeActiveSection();
  renderAll();
}

window.addEventListener('DOMContentLoaded', init);
