/*!
 * Naam Smaran - core state & business logic
 * Pure logic module: no DOM access here, so it can be unit-tested under
 * Node and reused as-is in the browser bundle.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NaamState = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var STORAGE_KEY = 'naamSmaran.data.v1';
  var JAP_PER_MALA = 108;
  var MILESTONES = [108, 1008, 10000, 50000, 100000];
  var BUILTIN_NAAMS = ['Radha', 'Krishna', 'Ram', 'Siya Ram', 'Hare Krishna', 'Om'];
  var DEFAULT_NAAM = BUILTIN_NAAMS[0];

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function dateStr(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function timeStr(d) {
    d = d || new Date();
    return pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
  }

  function uid(prefix) {
    return prefix + '-' + Date.now().toString(36).toUpperCase() +
      Math.floor(Math.random() * 1296).toString(36).toUpperCase().padStart(2, '0');
  }

  function defaultData() {
    return {
      version: 1,
      firstLaunchDone: false,
      userName: '',
      selectedNaam: DEFAULT_NAAM,
      customNaams: [],          // [{id, name}]
      currentCount: 0,          // 0..107, resets to 0 on completing a mala
      totalJap: 0,
      totalMala: 0,
      records: [],              // [{date, naam, japCount, malaCount}]
      malaLog: [],              // [{id, date, time, naam, malaNumber}]
      unlockedMilestones: [],   // [number]
      certificates: [],         // [{id, milestone, naam, userName, totalJap, totalMala, date}]
      soundEnabled: true,
      hapticEnabled: true,
      createdAt: dateStr()
    };
  }

  // Merge a loaded object onto a fresh default so older/partial saves never
  // crash the app - any missing key just falls back to its default.
  function migrate(loaded) {
    var d = defaultData();
    if (!loaded || typeof loaded !== 'object') return d;
    Object.keys(d).forEach(function (k) {
      if (Object.prototype.hasOwnProperty.call(loaded, k) && loaded[k] !== undefined && loaded[k] !== null) {
        d[k] = loaded[k];
      }
    });
    return d;
  }

  function createStore(persistence) {
    persistence = persistence || {};
    var data = null;

    function persist() {
      if (typeof persistence.save === 'function') persistence.save(data);
    }

    function load() {
      var loaded = null;
      try {
        loaded = typeof persistence.load === 'function' ? persistence.load() : null;
      } catch (e) {
        loaded = null;
      }
      data = migrate(loaded);
      return data;
    }

    function getData() {
      return data;
    }

    function allNaams() {
      var list = BUILTIN_NAAMS.slice();
      data.customNaams.forEach(function (n) { list.push(n.name); });
      return list;
    }

    function findOrCreateRecord(ds, naam) {
      for (var i = 0; i < data.records.length; i++) {
        var r = data.records[i];
        if (r.date === ds && r.naam === naam) return r;
      }
      var rec = { date: ds, naam: naam, japCount: 0, malaCount: 0 };
      data.records.push(rec);
      return rec;
    }

    function checkMilestones(now) {
      var unlocked = [];
      MILESTONES.forEach(function (m) {
        if (data.totalJap >= m && data.unlockedMilestones.indexOf(m) === -1) {
          data.unlockedMilestones.push(m);
          var cert = {
            id: uid('NS'),
            milestone: m,
            naam: data.selectedNaam,
            userName: data.userName,
            totalJap: data.totalJap,
            totalMala: data.totalMala,
            date: dateStr(now)
          };
          data.certificates.push(cert);
          unlocked.push(cert);
        }
      });
      return unlocked;
    }

    // --- setup -------------------------------------------------------
    function completeFirstLaunch(userName, selectedNaam) {
      data.userName = (userName || '').trim();
      if (selectedNaam) data.selectedNaam = selectedNaam;
      data.firstLaunchDone = true;
      persist();
      return data;
    }

    function setUserName(name) {
      data.userName = (name || '').trim();
      persist();
      return data.userName;
    }

    function setSelectedNaam(name) {
      if (allNaams().indexOf(name) === -1) return false;
      data.selectedNaam = name;
      persist();
      return true;
    }

    function setSoundEnabled(on) {
      data.soundEnabled = !!on;
      persist();
      return data.soundEnabled;
    }

    function setHapticEnabled(on) {
      data.hapticEnabled = !!on;
      persist();
      return data.hapticEnabled;
    }

    // --- custom naams --------------------------------------------------
    function addCustomNaam(name) {
      name = (name || '').trim();
      if (!name) return { ok: false, reason: 'empty' };
      var existing = allNaams().map(function (n) { return n.toLowerCase(); });
      if (existing.indexOf(name.toLowerCase()) !== -1) return { ok: false, reason: 'duplicate' };
      var entry = { id: uid('CN'), name: name };
      data.customNaams.push(entry);
      persist();
      return { ok: true, naam: entry };
    }

    function editCustomNaam(id, newName) {
      newName = (newName || '').trim();
      if (!newName) return { ok: false, reason: 'empty' };
      var entry = data.customNaams.filter(function (n) { return n.id === id; })[0];
      if (!entry) return { ok: false, reason: 'not-found' };
      var dup = allNaams().some(function (n) {
        return n.toLowerCase() === newName.toLowerCase() && n.toLowerCase() !== entry.name.toLowerCase();
      });
      if (dup) return { ok: false, reason: 'duplicate' };
      var oldName = entry.name;
      entry.name = newName;
      if (data.selectedNaam === oldName) data.selectedNaam = newName;
      // keep historical records pointing at the old label intact; only the
      // active naam going forward changes, so past date-wise records still
      // read correctly under the name they were logged with.
      persist();
      return { ok: true };
    }

    function deleteCustomNaam(id) {
      var idx = data.customNaams.findIndex(function (n) { return n.id === id; });
      if (idx === -1) return { ok: false, reason: 'not-found' };
      var removed = data.customNaams[idx];
      data.customNaams.splice(idx, 1);
      if (data.selectedNaam === removed.name) {
        data.selectedNaam = DEFAULT_NAAM;
      }
      persist();
      return { ok: true };
    }

    // --- counting --------------------------------------------------
    function tap(now) {
      now = now || new Date();
      var ds = dateStr(now);
      var naam = data.selectedNaam;

      data.currentCount += 1;
      data.totalJap += 1;

      var rec = findOrCreateRecord(ds, naam);
      rec.japCount += 1;

      var malaCompleted = false;
      var malaEntry = null;

      if (data.currentCount === JAP_PER_MALA) {
        data.totalMala += 1;
        rec.malaCount += 1;
        malaEntry = {
          id: uid('M'),
          date: ds,
          time: timeStr(now),
          naam: naam,
          malaNumber: data.totalMala
        };
        data.malaLog.push(malaEntry);
        data.currentCount = 0;
        malaCompleted = true;
      }

      var newMilestones = checkMilestones(now);
      persist();

      return {
        currentCount: data.currentCount,
        totalJap: data.totalJap,
        totalMala: data.totalMala,
        malaCompleted: malaCompleted,
        malaEntry: malaEntry,
        newMilestones: newMilestones
      };
    }

    // Corrects an accidental tap. Only steps back within the current,
    // still-open cycle - once a mala has completed and rolled over, that
    // record is final and cannot be undone (matches a real mala count).
    function undoTap(now) {
      now = now || new Date();
      if (data.currentCount === 0 || data.totalJap === 0) return { ok: false };
      var ds = dateStr(now);
      var naam = data.selectedNaam;
      data.currentCount -= 1;
      data.totalJap -= 1;
      var rec = findOrCreateRecord(ds, naam);
      if (rec.japCount > 0) rec.japCount -= 1;
      persist();
      return { ok: true, currentCount: data.currentCount, totalJap: data.totalJap };
    }

    // --- derived views --------------------------------------------------
    function todaysJap(now) {
      var ds = dateStr(now);
      return data.records
        .filter(function (r) { return r.date === ds; })
        .reduce(function (sum, r) { return sum + r.japCount; }, 0);
    }

    function recordsSorted() {
      return data.records.slice().sort(function (a, b) {
        return a.date < b.date ? 1 : (a.date > b.date ? -1 : 0);
      });
    }

    function milestoneStatus() {
      return MILESTONES.map(function (m) {
        var cert = data.certificates.filter(function (c) { return c.milestone === m; })[0];
        return {
          value: m,
          unlocked: data.unlockedMilestones.indexOf(m) !== -1,
          date: cert ? cert.date : null,
          certificateId: cert ? cert.id : null
        };
      });
    }

    return {
      load: load,
      getData: getData,
      persist: persist,
      allNaams: allNaams,
      completeFirstLaunch: completeFirstLaunch,
      setUserName: setUserName,
      setSelectedNaam: setSelectedNaam,
      setSoundEnabled: setSoundEnabled,
      setHapticEnabled: setHapticEnabled,
      addCustomNaam: addCustomNaam,
      editCustomNaam: editCustomNaam,
      deleteCustomNaam: deleteCustomNaam,
      tap: tap,
      undoTap: undoTap,
      todaysJap: todaysJap,
      recordsSorted: recordsSorted,
      milestoneStatus: milestoneStatus
    };
  }

  return {
    STORAGE_KEY: STORAGE_KEY,
    JAP_PER_MALA: JAP_PER_MALA,
    MILESTONES: MILESTONES,
    BUILTIN_NAAMS: BUILTIN_NAAMS,
    DEFAULT_NAAM: DEFAULT_NAAM,
    defaultData: defaultData,
    migrate: migrate,
    createStore: createStore,
    dateStr: dateStr,
    timeStr: timeStr,
    uid: uid
  };
});
