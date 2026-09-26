/*!
 * Naam Smaran - app wiring
 * Connects NaamState (data/logic), NaamAudio (sound/haptics) and
 * NaamCertificate (canvas certificates) to the DOM.
 */
(function () {
  'use strict';

  var RING_R = 92;
  var RING_CIRC = 2 * Math.PI * RING_R;

  var GREETINGS = {
    'Radha': 'Radhe Radhe',
    'Krishna': 'Jai Shri Krishna',
    'Ram': 'Jai Shri Ram',
    'Siya Ram': 'Jai Siya Ram',
    'Hare Krishna': 'Hare Krishna Hare Ram',
    'Om': 'Om Shanti'
  };

  var QUOTES = [
    'Every repetition of the Naam is a quiet step toward peace.',
    'The mind that remembers the Divine finds rest in the middle of a busy day.',
    'A mala is only beads until devotion moves through it.',
    'Chant slowly, and let each Naam settle before the next begins.',
    'Stillness is not the absence of thought, but the presence of the Naam.',
    'One sincere Jap outweighs a thousand distracted ones.',
    'Let your breath and your Naam move together today.'
  ];

  var MILESTONE_ICONS = { 108: '🌸', 1008: '🪷', 10000: '🔔', 50000: '🌟', 100000: '👑' };

  // ---------------------------------------------------------------
  // Persistence adapter (localStorage), defensive against private-mode
  // browsers where storage can throw.
  // ---------------------------------------------------------------
  var persistence = {
    load: function () {
      try {
        var raw = window.localStorage.getItem(NaamState.STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) { return null; }
    },
    save: function (data) {
      try {
        window.localStorage.setItem(NaamState.STORAGE_KEY, JSON.stringify(data));
      } catch (e) { /* storage unavailable - app still works for this session */ }
    }
  };

  var store = NaamState.createStore(persistence);
  store.load();

  // ---------------------------------------------------------------
  // DOM shorthand
  // ---------------------------------------------------------------
  function $(id) { return document.getElementById(id); }
  function on(el, ev, fn) { if (el) el.addEventListener(ev, fn); }

  var els = {
    splash: $('splash'),
    setup: $('setup'),
    setupName: $('setupNameInput'),
    setupNaamGrid: $('setupNaamGrid'),
    setupContinue: $('setupContinueBtn'),

    screens: document.querySelectorAll('.screen'),
    navButtons: document.querySelectorAll('#bottom-nav button'),

    homeDate: $('homeDate'),
    greetLine: $('greetLine'),
    greetSub: $('greetSub'),
    homeNaamPill: $('homeNaamPill'),
    homeTodayJap: $('homeTodayJap'),
    homeTotalJap: $('homeTotalJap'),
    homeTotalMala: $('homeTotalMala'),
    homeBeginBtn: $('homeBeginBtn'),
    homeQuote: $('homeQuote'),

    japNaamLabel: $('japNaamLabel'),
    japCurrent: $('japCurrent'),
    japCircleBtn: $('japCircleBtn'),
    ringProgress: $('ringProgress'),
    japTotalJap: $('japTotalJap'),
    japTotalMala: $('japTotalMala'),
    japUndoBtn: $('japUndoBtn'),

    naamList: $('naamList'),
    customNaamInput: $('customNaamInput'),
    customNaamAddBtn: $('customNaamAddBtn'),
    customNaamHint: $('customNaamHint'),

    profileName: $('profileName'),
    profileNaam: $('profileNaam'),
    profileTotalJap: $('profileTotalJap'),
    profileTotalMala: $('profileTotalMala'),
    profileEditNameBtn: $('profileEditNameBtn'),
    profileChangeNaamBtn: $('profileChangeNaamBtn'),
    profileSoundToggle: $('profileSoundToggle'),
    profileHapticToggle: $('profileHapticToggle'),
    milestoneGrid: $('milestoneGrid'),
    certList: $('certList'),
    recordsList: $('recordsList'),

    modalBackdrop: $('modalBackdrop'),
    modalSheet: $('modalSheet'),

    celebrateOverlay: $('celebrateOverlay'),
    celebrateCard: $('celebrateCard'),
    celebrateEmoji: $('celebrateEmoji'),
    celebrateTitle: $('celebrateTitle'),
    celebrateSub: $('celebrateSub'),
    celebrateActions: $('celebrateActions'),

    toast: $('toast')
  };

  // ---------------------------------------------------------------
  // Small helpers
  // ---------------------------------------------------------------
  function fmt(n) { return Number(n || 0).toLocaleString('en-IN'); }

  function fmtDateLong(d) {
    d = d || new Date();
    return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  function fmtDateShort(iso) {
    var parts = (iso || '').split('-');
    if (parts.length !== 3) return iso || '';
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return parseInt(parts[2], 10) + ' ' + months[parseInt(parts[1], 10) - 1] + ' ' + parts[0];
  }

  function dayOfYear(d) {
    var start = new Date(d.getFullYear(), 0, 0);
    var diff = d - start;
    return Math.floor(diff / 86400000);
  }

  var toastTimer = null;
  function showToast(msg, ms) {
    els.toast.textContent = msg;
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { els.toast.classList.remove('show'); }, ms || 1900);
  }

  function playTapFeedback() {
    var d = store.getData();
    if (d.soundEnabled) NaamAudio.playClick();
    if (d.hapticEnabled) NaamAudio.vibrateTap();
  }

  // ---------------------------------------------------------------
  // Screen navigation
  // ---------------------------------------------------------------
  function setActiveScreen(name) {
    els.screens.forEach(function (s) { s.classList.toggle('active', s.id === 'screen-' + name); });
    els.navButtons.forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-screen') === name); });
    renderAll();
  }

  els.navButtons.forEach(function (btn) {
    on(btn, 'click', function () { setActiveScreen(btn.getAttribute('data-screen')); });
  });
  on(els.homeBeginBtn, 'click', function () { setActiveScreen('jap'); });
  on(els.profileChangeNaamBtn, 'click', function () { setActiveScreen('naam'); });

  // ---------------------------------------------------------------
  // Render: Home
  // ---------------------------------------------------------------
  function renderHome() {
    var d = store.getData();
    var now = new Date();
    els.homeDate.textContent = fmtDateLong(now);

    var greet = GREETINGS[d.selectedNaam] || ('Jai ' + d.selectedNaam);
    els.greetLine.textContent = greet + ' 🙏';

    var hour = now.getHours();
    var timeGreet = hour < 12 ? 'Good morning' : (hour < 17 ? 'Good afternoon' : 'Good evening');
    els.greetSub.textContent = d.userName ? (timeGreet + ', ' + d.userName + '.') : (timeGreet + '.');

    els.homeNaamPill.textContent = d.selectedNaam;
    els.homeTodayJap.textContent = fmt(store.todaysJap(now));
    els.homeTotalJap.textContent = fmt(d.totalJap);
    els.homeTotalMala.textContent = fmt(d.totalMala);

    els.homeQuote.textContent = '"' + QUOTES[dayOfYear(now) % QUOTES.length] + '"';
  }

  // ---------------------------------------------------------------
  // Render: Jap
  // ---------------------------------------------------------------
  function renderJap() {
    var d = store.getData();
    els.japNaamLabel.textContent = d.selectedNaam;
    els.japCurrent.textContent = d.currentCount;
    els.japTotalJap.textContent = fmt(d.totalJap);
    els.japTotalMala.textContent = fmt(d.totalMala);
    updateRing(d.currentCount);
  }

  function updateRing(count) {
    var offset = RING_CIRC * (1 - count / NaamState.JAP_PER_MALA);
    els.ringProgress.style.strokeDasharray = RING_CIRC.toFixed(2);
    els.ringProgress.style.strokeDashoffset = offset.toFixed(2);
  }

  // ---------------------------------------------------------------
  // Render: Naam screen
  // ---------------------------------------------------------------
  function renderNaamScreen() {
    var d = store.getData();
    var html = '';
    NaamState.BUILTIN_NAAMS.forEach(function (name) {
      html += naamRowHTML(name, d.selectedNaam === name, false, null);
    });
    d.customNaams.forEach(function (n) {
      html += naamRowHTML(n.name, d.selectedNaam === n.name, true, n.id);
    });
    els.naamList.innerHTML = html;

    els.naamList.querySelectorAll('.naam-row').forEach(function (row) {
      on(row, 'click', function (e) {
        if (e.target.closest('.mini-btn')) return;
        store.setSelectedNaam(row.getAttribute('data-name'));
        renderAll();
        showToast('Naam set to ' + row.getAttribute('data-name'));
      });
    });
    els.naamList.querySelectorAll('.mini-btn.edit').forEach(function (btn) {
      on(btn, 'click', function () { openEditCustomNaam(btn.getAttribute('data-id')); });
    });
    els.naamList.querySelectorAll('.mini-btn.danger').forEach(function (btn) {
      on(btn, 'click', function () { confirmDeleteCustomNaam(btn.getAttribute('data-id'), btn.getAttribute('data-name')); });
    });
  }

  function naamRowHTML(name, selected, isCustom, id) {
    var actions = '';
    if (isCustom) {
      actions =
        '<span class="row-actions">' +
        '<button class="mini-btn edit" data-id="' + id + '" aria-label="Edit">✎</button>' +
        '<button class="mini-btn danger" data-id="' + id + '" data-name="' + escapeHtml(name) + '" aria-label="Delete">🗑</button>' +
        '</span>';
    }
    return '<div class="naam-row' + (selected ? ' selected' : '') + '" data-name="' + escapeHtml(name) + '">' +
      '<span class="radio-dot"></span>' +
      '<span class="naam-name">' + escapeHtml(name) + '</span>' +
      actions +
      '</div>';
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  on(els.customNaamAddBtn, 'click', function () {
    var val = els.customNaamInput.value;
    var res = store.addCustomNaam(val);
    if (!res.ok) {
      els.customNaamHint.textContent = res.reason === 'duplicate'
        ? 'That Naam already exists.'
        : 'Please enter a Naam name.';
      return;
    }
    els.customNaamHint.textContent = '';
    els.customNaamInput.value = '';
    renderAll();
    showToast('Added "' + res.naam.name + '"');
  });

  function openEditCustomNaam(id) {
    var d = store.getData();
    var entry = d.customNaams.filter(function (n) { return n.id === id; })[0];
    if (!entry) return;
    openModal(
      '<h3>Rename Naam</h3>' +
      '<input class="text-input" id="renameNaamInput" type="text" maxlength="30" value="' + escapeHtml(entry.name) + '" />' +
      '<p class="form-hint" id="renameNaamHint"></p>' +
      '<div class="modal-actions">' +
      '<button class="cancel" id="renameCancelBtn">Cancel</button>' +
      '<button class="confirm" id="renameSaveBtn">Save</button>' +
      '</div>'
    );
    var input = $('renameNaamInput');
    input.focus();
    on($('renameCancelBtn'), 'click', closeModal);
    on($('renameSaveBtn'), 'click', function () {
      var res = store.editCustomNaam(id, input.value);
      if (!res.ok) {
        $('renameNaamHint').textContent = res.reason === 'duplicate' ? 'That name is already used.' : 'Please enter a name.';
        return;
      }
      closeModal();
      renderAll();
      showToast('Naam updated');
    });
  }

  function confirmDeleteCustomNaam(id, name) {
    openModal(
      '<h3>Delete "' + escapeHtml(name) + '"?</h3>' +
      '<p style="color:var(--cream-200); font-size:14px; margin:0 0 10px;">Past Jap records made with this Naam will be kept, but you will no longer be able to select it.</p>' +
      '<div class="modal-actions">' +
      '<button class="cancel" id="deleteCancelBtn">Cancel</button>' +
      '<button class="confirm" id="deleteConfirmBtn" style="background:linear-gradient(135deg,#ffb0a0,#e9c264);">Delete</button>' +
      '</div>'
    );
    on($('deleteCancelBtn'), 'click', closeModal);
    on($('deleteConfirmBtn'), 'click', function () {
      store.deleteCustomNaam(id);
      closeModal();
      renderAll();
      showToast('Naam deleted');
    });
  }

  // ---------------------------------------------------------------
  // Render: Profile
  // ---------------------------------------------------------------
  function renderProfile() {
    var d = store.getData();
    els.profileName.textContent = d.userName || 'Not set';
    els.profileNaam.textContent = d.selectedNaam;
    els.profileTotalJap.textContent = fmt(d.totalJap);
    els.profileTotalMala.textContent = fmt(d.totalMala);
    els.profileSoundToggle.textContent = d.soundEnabled ? 'On' : 'Off';
    els.profileHapticToggle.textContent = d.hapticEnabled ? 'On' : 'Off';

    renderMilestones(d);
    renderCertificates(d);
    renderRecords();
  }

  function renderMilestones(d) {
    var statuses = store.milestoneStatus();
    var html = '';
    statuses.forEach(function (m) {
      html += '<div class="milestone-badge' + (m.unlocked ? ' unlocked' : '') + '" data-milestone="' + m.value + '">' +
        '<span class="m-icon">' + (m.unlocked ? MILESTONE_ICONS[m.value] : '🔒') + '</span>' +
        '<span class="m-value">' + fmt(m.value) + '</span>' +
        '<span class="m-caption">' + (m.unlocked ? 'Jap' : 'Locked') + '</span>' +
        '</div>';
    });
    els.milestoneGrid.innerHTML = html;
    els.milestoneGrid.querySelectorAll('.milestone-badge.unlocked').forEach(function (badge) {
      on(badge, 'click', function () {
        var cert = d.certificates.filter(function (c) { return c.milestone === Number(badge.getAttribute('data-milestone')); })[0];
        if (cert) openCertificatePreview(cert);
      });
    });
  }

  function renderCertificates(d) {
    if (!d.certificates.length) {
      els.certList.innerHTML = '<p class="empty-note">Your first certificate unlocks at 108 Jap. Keep going 🙏</p>';
      return;
    }
    var sorted = d.certificates.slice().sort(function (a, b) { return b.milestone - a.milestone; });
    var html = '';
    sorted.forEach(function (c) {
      html += '<div class="cert-item" data-id="' + c.id + '">' +
        '<div class="cert-title">' + fmt(c.milestone) + ' Jap Milestone</div>' +
        '<div class="cert-sub">Achieved ' + fmtDateShort(c.date) + ' • ' + escapeHtml(c.naam) + '</div>' +
        '<div class="cert-actions"><button class="cert-view-btn">View Certificate</button></div>' +
        '</div>';
    });
    els.certList.innerHTML = html;
    els.certList.querySelectorAll('.cert-item').forEach(function (item) {
      on(item.querySelector('.cert-view-btn'), 'click', function () {
        var cert = sorted.filter(function (c) { return c.id === item.getAttribute('data-id'); })[0];
        openCertificatePreview(cert);
      });
    });
  }

  function renderRecords() {
    var recs = store.recordsSorted();
    if (!recs.length) {
      els.recordsList.innerHTML = '<p class="empty-note">Your Jap journey starts with a single tap.</p>';
      return;
    }
    var html = '';
    recs.forEach(function (r) {
      html += '<div class="record-item">' +
        '<div><div class="r-date">' + fmtDateShort(r.date) + '</div><div class="r-naam">' + escapeHtml(r.naam) + '</div></div>' +
        '<div class="r-counts">' + fmt(r.japCount) + ' Jap' + (r.malaCount ? ' • ' + r.malaCount + ' Mala' : '') + '</div>' +
        '</div>';
    });
    els.recordsList.innerHTML = html;
  }

  on(els.profileEditNameBtn, 'click', function () {
    var d = store.getData();
    openModal(
      '<h3>Edit Your Name</h3>' +
      '<input class="text-input" id="editNameInput" type="text" maxlength="40" value="' + escapeHtml(d.userName || '') + '" />' +
      '<div class="modal-actions">' +
      '<button class="cancel" id="editNameCancelBtn">Cancel</button>' +
      '<button class="confirm" id="editNameSaveBtn">Save</button>' +
      '</div>'
    );
    $('editNameInput').focus();
    on($('editNameCancelBtn'), 'click', closeModal);
    on($('editNameSaveBtn'), 'click', function () {
      store.setUserName($('editNameInput').value);
      closeModal();
      renderAll();
      showToast('Name updated');
    });
  });

  on(els.profileSoundToggle, 'click', function () {
    var on_ = store.setSoundEnabled(!store.getData().soundEnabled);
    els.profileSoundToggle.textContent = on_ ? 'On' : 'Off';
  });
  on(els.profileHapticToggle, 'click', function () {
    var on_ = store.setHapticEnabled(!store.getData().hapticEnabled);
    els.profileHapticToggle.textContent = on_ ? 'On' : 'Off';
  });

  // ---------------------------------------------------------------
  // Certificate preview modal
  // ---------------------------------------------------------------
  function openCertificatePreview(cert) {
    if (!cert) return;
    openModal(
      '<h3>' + fmt(cert.milestone) + ' Jap Certificate</h3>' +
      '<div class="cert-canvas-wrap"><canvas id="certCanvas" width="900" height="1272"></canvas></div>' +
      '<div class="modal-actions">' +
      '<button class="cancel" id="certSaveBtn">Save</button>' +
      '<button class="confirm" id="certShareBtn">Share</button>' +
      '</div>'
    );
    var canvas = $('certCanvas');
    NaamCertificate.render(canvas, cert);
    var filename = 'NaamSmaran_' + cert.milestone + '_Jap_Certificate.png';
    on($('certSaveBtn'), 'click', function () {
      NaamCertificate.download(canvas, filename);
      showToast('Certificate saved');
    });
    on($('certShareBtn'), 'click', function () {
      NaamCertificate.share(canvas, filename, fmt(cert.milestone) + ' Jap Certificate');
    });
  }

  // ---------------------------------------------------------------
  // Generic modal
  // ---------------------------------------------------------------
  function openModal(innerHtml) {
    els.modalSheet.innerHTML = innerHtml;
    els.modalBackdrop.classList.add('show');
  }
  function closeModal() {
    els.modalBackdrop.classList.remove('show');
  }
  on(els.modalBackdrop, 'click', function (e) {
    if (e.target === els.modalBackdrop) closeModal();
  });

  // ---------------------------------------------------------------
  // Celebrations (Mala complete / Milestone unlocked)
  // ---------------------------------------------------------------
  var celebrationQueue = [];
  var celebrating = false;

  function queueCelebration(item) {
    celebrationQueue.push(item);
    if (!celebrating) processQueue();
  }

  function spawnConfetti() {
    var colors = ['#e9c264', '#ff8a3d', '#fdf3de', '#f6dc9c'];
    for (var i = 0; i < 22; i++) {
      var piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = (Math.random() * 100) + '%';
      piece.style.top = '-20px';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      piece.style.animationDuration = (1.1 + Math.random() * 0.9) + 's';
      piece.style.animationDelay = (Math.random() * 0.3) + 's';
      els.celebrateCard.appendChild(piece);
      (function (p) { setTimeout(function () { p.remove(); }, 2400); })(piece);
    }
  }

  function processQueue() {
    if (!celebrationQueue.length) { celebrating = false; return; }
    celebrating = true;
    var item = celebrationQueue.shift();

    if (item.type === 'mala') {
      els.celebrateEmoji.textContent = '🙏';
      els.celebrateTitle.textContent = '1 Mala Complete';
      els.celebrateSub.textContent = '108 sacred repetitions of ' + item.naam + ' offered.';
      els.celebrateActions.innerHTML = '';
      var d = store.getData();
      if (d.soundEnabled) NaamAudio.playMalaComplete();
      if (d.hapticEnabled) NaamAudio.vibrateMala();
      showOverlay();
      spawnConfetti();
      setTimeout(function () { hideOverlay(); setTimeout(processQueue, 300); }, 2200);
    } else if (item.type === 'milestone') {
      var cert = item.cert;
      els.celebrateEmoji.textContent = MILESTONE_ICONS[cert.milestone] || '🏅';
      els.celebrateTitle.textContent = fmt(cert.milestone) + ' Jap Milestone!';
      els.celebrateSub.textContent = 'A beautiful certificate is ready in your Profile.';
      els.celebrateActions.innerHTML =
        '<div class="modal-actions" style="margin-top:4px;">' +
        '<button class="cancel" id="celebrateContinueBtn" style="flex:1;">Continue</button>' +
        '<button class="confirm" id="celebrateViewCertBtn" style="flex:1;">View Certificate</button>' +
        '</div>';
      var dd = store.getData();
      if (dd.soundEnabled) NaamAudio.playMilestone();
      if (dd.hapticEnabled) NaamAudio.vibrateMilestone();
      showOverlay();
      spawnConfetti();
      on($('celebrateContinueBtn'), 'click', function () { hideOverlay(); setTimeout(processQueue, 300); });
      on($('celebrateViewCertBtn'), 'click', function () {
        hideOverlay();
        setTimeout(function () { openCertificatePreview(cert); processQueue(); }, 300);
      });
    }
  }

  function showOverlay() { els.celebrateOverlay.classList.add('show'); }
  function hideOverlay() { els.celebrateOverlay.classList.remove('show'); }

  // ---------------------------------------------------------------
  // Tap handling
  // ---------------------------------------------------------------
  on(els.japCircleBtn, 'click', function () {
    playTapFeedback();
    var result = store.tap();
    els.japCurrent.textContent = result.currentCount;
    updateRing(result.currentCount);
    els.japTotalJap.textContent = fmt(result.totalJap);
    els.japTotalMala.textContent = fmt(result.totalMala);

    if (result.malaCompleted) {
      queueCelebration({ type: 'mala', naam: store.getData().selectedNaam });
    }
    result.newMilestones.forEach(function (cert) {
      queueCelebration({ type: 'milestone', cert: cert });
    });

    // Home/Profile stats may be stale once the user navigates there; a full
    // re-render on tap is cheap for an app this size and keeps every screen
    // truthful without extra bookkeeping.
    renderHome();
  });

  on(els.japUndoBtn, 'click', function () {
    var res = store.undoTap();
    if (!res.ok) { showToast('Nothing to undo'); return; }
    els.japCurrent.textContent = res.currentCount;
    updateRing(res.currentCount);
    els.japTotalJap.textContent = fmt(res.totalJap);
    renderHome();
    showToast('Last tap undone');
  });

  // ---------------------------------------------------------------
  // First-launch setup
  // ---------------------------------------------------------------
  var setupSelectedNaam = null;

  function renderSetupNaamGrid() {
    var html = '';
    NaamState.BUILTIN_NAAMS.forEach(function (name) {
      html += '<div class="naam-chip" data-name="' + escapeHtml(name) + '">' + escapeHtml(name) + '</div>';
    });
    els.setupNaamGrid.innerHTML = html;
    els.setupNaamGrid.querySelectorAll('.naam-chip').forEach(function (chip) {
      on(chip, 'click', function () {
        setupSelectedNaam = chip.getAttribute('data-name');
        els.setupNaamGrid.querySelectorAll('.naam-chip').forEach(function (c) { c.classList.remove('selected'); });
        chip.classList.add('selected');
        validateSetup();
      });
    });
  }

  function validateSetup() {
    var nameOk = els.setupName.value.trim().length > 0;
    els.setupContinue.disabled = !(nameOk && setupSelectedNaam);
  }

  on(els.setupName, 'input', validateSetup);
  on(els.setupContinue, 'click', function () {
    store.completeFirstLaunch(els.setupName.value, setupSelectedNaam);
    els.setup.style.display = 'none';
    renderAll();
    setActiveScreen('home');
  });

  // ---------------------------------------------------------------
  // Full render + boot sequence
  // ---------------------------------------------------------------
  function renderAll() {
    renderHome();
    renderJap();
    renderNaamScreen();
    renderProfile();
  }

  function boot() {
    var d = store.getData();
    setTimeout(function () {
      els.splash.style.display = 'none';
      if (!d.firstLaunchDone) {
        renderSetupNaamGrid();
        els.setup.style.display = 'flex';
      } else {
        renderAll();
      }
    }, 2000);
  }

  boot();

  // Register the offline app-shell service worker. Wrapped defensively -
  // some WebView / file:// contexts don't support it, and the app must
  // keep working either way.
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').catch(function () { /* offline shell just won't be pre-cached */ });
    });
  }
})();
