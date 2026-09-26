/*!
 * Naam Smaran - synthesized audio + haptics
 * No audio files are bundled - every sound is generated on the fly with the
 * Web Audio API, which keeps the app fully offline and light.
 */
(function (root) {
  'use strict';

  var ctx = null;
  function getCtx() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    // Some mobile browsers suspend the context until a user gesture; taps
    // are user gestures, so resume defensively every time we play.
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, startOffset, duration, type, peakGain) {
    var audioCtx = getCtx();
    if (!audioCtx) return;
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    var t0 = audioCtx.currentTime + (startOffset || 0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peakGain || 0.25, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }

  // A soft, short wooden "click" - like a bead moving on a mala string.
  function playClick() {
    tone(720, 0, 0.06, 'sine', 0.18);
    tone(340, 0.005, 0.05, 'sine', 0.08);
  }

  // A warm ascending bell/chime run, played when a Mala completes.
  function playMalaComplete() {
    var notes = [523.25, 659.25, 784.0, 1046.5]; // C5 E5 G5 C6
    notes.forEach(function (f, i) {
      tone(f, i * 0.11, 0.9, 'triangle', 0.2);
      tone(f * 2, i * 0.11, 0.5, 'sine', 0.05);
    });
  }

  // A brighter, longer fanfare for milestone / certificate unlocks.
  function playMilestone() {
    var notes = [392.0, 523.25, 659.25, 784.0, 1046.5, 1318.5];
    notes.forEach(function (f, i) {
      tone(f, i * 0.09, 1.1, 'triangle', 0.22);
    });
  }

  function vibrate(pattern) {
    try {
      if (navigator.vibrate) navigator.vibrate(pattern);
    } catch (e) { /* haptics unsupported - ignore */ }
  }

  root.NaamAudio = {
    playClick: playClick,
    playMalaComplete: playMalaComplete,
    playMilestone: playMilestone,
    vibrateTap: function () { vibrate(12); },
    vibrateMala: function () { vibrate([0, 40, 60, 40, 60, 80]); },
    vibrateMilestone: function () { vibrate([0, 30, 40, 30, 40, 30, 40, 100]); }
  };
})(typeof window !== 'undefined' ? window : this);
