/**
 * MK MOBILE TRACKER - MAIN APPLICATION
 * Refreshed production-ready orchestration layer
 */

'use strict';

const app = {
  settings: {
    analyticsDebounceMs: 200,
  },

  async init() {
    console.info('🔧 MK Mobile Tracker initializing...');
    try {
      this.bindUIElements();
      this.setupEventDelegation();
      this.switchPage('dashboard');
      UIManager.setTodayDate('soulDate');
      UIManager.setTodayDate('crystalDate');
      UIManager.setTodayDate('koinDate');
      this.updateAllUI();
      // Render charts lazily if analytics page is active
      if (document.getElementById('analytics')?.classList.contains('page--active')) {
        AnalyticsEngine.renderAllCharts();
      }
      console.info('✅ MK Mobile Tracker ready');
    } catch (err) {
      console.error('Initialization error:', err);
      UIManager.showToast('Initialization failed — see console', 'error');
    }
  },

  bindUIElements() {
    this.appRoot = document.getElementById('app');
    this.toastContainer = document.getElementById('toastContainer');
    this.forms = {
      souls: document.getElementById('soulsForm'),
      crystals: document.getElementById('crystalForm'),
      koins: document.getElementById('koinForm'),
      predictions: document.getElementById('predictionForm'),
    };
  },

  setupEventDelegation() {
    // Navigation buttons
    document.addEventListener('click', (e) => {
      const nav = e.target.closest('[data-page]');
      if (nav) {
        e.preventDefault();
        const page = nav.getAttribute('data-page');
        this.switchPage(page);
        return;
      }

      // Tracker dropdown toggles
      if (e.target.id === 'trackerMenuDesktop') {
        const dd = document.getElementById('trackerDropdownDesktop');
        dd?.setAttribute('aria-hidden', dd.getAttribute('aria-hidden') === 'true' ? 'false' : 'true');
      }

      if (e.target.id === 'trackerMenuMobile') {
        document.getElementById('mobileTrackerMenu')?.setAttribute('aria-hidden', 'false');
      }

      if (e.target.classList.contains('mobile-menu-overlay') || e.target.id === 'mobileMenuClose') {
        document.getElementById('mobileTrackerMenu')?.setAttribute('aria-hidden', 'true');
      }

      // Export / clear / import
      if (e.target.id === 'exportBtn') this.exportBackup();
      if (e.target.id === 'clearBtn') this.confirmClearData();
      if (e.target.closest('.btn--file')) return; // file input handled separately
    });

    // Forms
    this.forms.souls?.addEventListener('submit', (e) => this.handleSoulSubmit(e));
    this.forms.crystals?.addEventListener('submit', (e) => this.handleCrystalSubmit(e));
    this.forms.koins?.addEventListener('submit', (e) => this.handleKoinSubmit(e));
    this.forms.predictions?.addEventListener('submit', (e) => this.handlePredictionSubmit(e));

    // Soul source custom
    document.getElementById('soulSource')?.addEventListener('change', (e) => {
      const customGroup = document.getElementById('soulCustomGroup');
      customGroup && (customGroup.style.display = e.target.value === 'Others' ? 'flex' : 'none');
    });

    // Import file
    document.getElementById('importFile')?.addEventListener('change', (e) => this.importBackup(e));

    // Modal cancel
    document.getElementById('confirmNo')?.addEventListener('click', () => UIManager.closeModal());
  },

  switchPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('page--active'));
    const page = document.getElementById(pageName);
    if (!page) return;
    page.classList.add('page--active');

    // update nav active state
    document.querySelectorAll('[data-page]').forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-page') === pageName));

    // close menus
    document.getElementById('trackerDropdownDesktop')?.setAttribute('aria-hidden', 'true');
    document.getElementById('mobileTrackerMenu')?.setAttribute('aria-hidden', 'true');

    // page-specific hooks
    if (pageName === 'analytics') {
      // slight delay to ensure canvas dimensions
      setTimeout(() => AnalyticsEngine.renderAllCharts(), 80);
    }

    this.updateAllUI();
  },

  /* ---------- FORM HANDLERS ---------- */
  handleSoulSubmit(e) {
    e.preventDefault();
    try {
      const form = this.forms.souls;
      const amount = parseInt(form.querySelector('#soulAmount').value || 0, 10);
      const date = form.querySelector('#soulDate').value;
      let source = form.querySelector('#soulSource').value || '';
      const customSource = form.querySelector('#soulCustom')?.value || '';
      const note = form.querySelector('#soulNote')?.value || '';

      if (source === 'Others' && customSource) source = customSource;
      if (!amount || !date || !source) return UIManager.showToast('Please fill all required fields', 'error');

      StorageManager.addSoul({ amount, date, source, note });
      UIManager.showToast(`Added ${amount} souls`, 'success');
      form.reset();
      UIManager.setTodayDate('soulDate');
      this.updateAllUI();
      AnalyticsEngine.renderAllCharts();
    } catch (err) {
      console.error(err);
      UIManager.showToast('Could not add soul entry', 'error');
    }
  },

  handleCrystalSubmit(e) {
    e.preventDefault();
    try {
      const form = this.forms.crystals;
      const amount = parseInt(form.querySelector('#crystalAmount').value || 0, 10);
      const date = form.querySelector('#crystalDate').value;
      const source = form.querySelector('#crystalSource').value || '';
      const note = form.querySelector('#crystalNote')?.value || '';

      if (!amount || !date || !source) return UIManager.showToast('Please fill all required fields', 'error');

      StorageManager.addCrystal({ amount, date, source, note });
      UIManager.showToast(`Added ${amount} crystals`, 'success');
      form.reset();
      UIManager.setTodayDate('crystalDate');
      this.updateAllUI();
      AnalyticsEngine.renderAllCharts();
    } catch (err) {
      console.error(err);
      UIManager.showToast('Could not add crystal entry', 'error');
    }
  },

  handleKoinSubmit(e) {
    e.preventDefault();
    try {
      const form = this.forms.koins;
      const amount = parseInt(form.querySelector('#koinAmount').value || 0, 10);
      const date = form.querySelector('#koinDate').value;
      const source = form.querySelector('#koinSource').value || '';
      const note = form.querySelector('#koinNote')?.value || '';

      if (!amount || !date || !source) return UIManager.showToast('Please fill all required fields', 'error');

      StorageManager.addKoin({ amount, date, source, note });
      UIManager.showToast(`Added ${amount} koins`, 'success');
      form.reset();
      UIManager.setTodayDate('koinDate');
      this.updateAllUI();
    } catch (err) {
      console.error(err);
      UIManager.showToast('Could not add koin entry', 'error');
    }
  },

  handlePredictionSubmit(e) {
    e.preventDefault();
    const dailyAverage = parseInt(document.getElementById('predictionDaily').value || 0, 10);
    if (!dailyAverage || dailyAverage <= 0) return UIManager.showToast('Enter a valid daily average', 'error');
    PredictionsEngine.renderProjections(dailyAverage);
  },

  /* ---------- DELETIONS ---------- */
  deleteSoulEntry(id) {
    UIManager.showConfirm('Delete Entry', 'Delete this soul entry?', () => {
      StorageManager.deleteSoul(id);
      UIManager.showToast('Soul entry deleted', 'success');
      this.updateAllUI();
      AnalyticsEngine.renderAllCharts();
    });
  },

  deleteCrystalEntry(id) {
    UIManager.showConfirm('Delete Entry', 'Delete this crystal entry?', () => {
      StorageManager.deleteCrystal(id);
      UIManager.showToast('Crystal entry deleted', 'success');
      this.updateAllUI();
      AnalyticsEngine.renderAllCharts();
    });
  },

  deleteKoinEntry(id) {
    UIManager.showConfirm('Delete Entry', 'Delete this koin entry?', () => {
      StorageManager.deleteKoin(id);
      UIManager.showToast('Koin entry deleted', 'success');
      this.updateAllUI();
    });
  },

  exportBackup() {
    try {
      const data = StorageManager.exportBackup();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mk-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      UIManager.showToast('Backup exported', 'success');
    } catch (err) {
      console.error(err);
      UIManager.showToast('Export failed', 'error');
    }
  },

  importBackup(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const ok = StorageManager.importBackup(ev.target.result);
        if (ok) {
          UIManager.showToast('Backup imported', 'success');
          this.updateAllUI();
          AnalyticsEngine.renderAllCharts();
        } else {
          UIManager.showToast('Invalid backup file', 'error');
        }
      } catch (err) {
        console.error(err);
        UIManager.showToast('Import failed', 'error');
      }
    };
    reader.readAsText(file);
  },

  confirmClearData() {
    UIManager.showConfirm('Clear All Data', 'This will permanently delete all data. Proceed?', () => {
      StorageManager.clearAllData();
      UIManager.showToast('All data cleared', 'success');
      this.updateAllUI();
      AnalyticsEngine.destroyAllCharts();
    });
  },

  updateAllUI() {
    UIManager.updateDashboard();
    UIManager.updateSoulsHistory();
    UIManager.updateCrystalsHistory();
    UIManager.updateKoinsHistory();
  },
};

// expose for inline handlers
window.app = app;

document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
