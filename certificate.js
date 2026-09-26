/*!
 * Naam Smaran - certificate rendering
 * Draws a colourful spiritual achievement certificate on a <canvas> and
 * offers preview / share / save. No external images are used - every
 * decorative element is drawn with canvas primitives so it works fully
 * offline inside an Android WebView.
 */
(function (root) {
  'use strict';

  function fmtNumber(n) {
    return Number(n).toLocaleString('en-IN');
  }

  function fmtDate(iso) {
    var parts = (iso || '').split('-');
    if (parts.length !== 3) return iso || '';
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December'];
    var y = parts[0], m = parseInt(parts[1], 10) - 1, d = parseInt(parts[2], 10);
    return d + ' ' + months[m] + ' ' + y;
  }

  function roundedRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  // Simple 8-petal lotus-ish flourish, drawn with arcs - purely geometric,
  // no image assets required.
  function drawFlourish(c, cx, cy, radius, color) {
    c.save();
    c.translate(cx, cy);
    for (var i = 0; i < 8; i++) {
      c.rotate(Math.PI / 4);
      c.beginPath();
      c.fillStyle = color;
      c.globalAlpha = 0.85;
      c.ellipse(0, -radius * 0.55, radius * 0.28, radius * 0.55, 0, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1;
    c.beginPath();
    c.fillStyle = '#fff3d6';
    c.arc(0, 0, radius * 0.22, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  function renderCertificate(canvas, cert) {
    var W = canvas.width, H = canvas.height;
    var c = canvas.getContext('2d');

    // Background wash
    var bg = c.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#3a0a0f');
    bg.addColorStop(0.55, '#54121a');
    bg.addColorStop(1, '#2b070b');
    c.fillStyle = bg;
    c.fillRect(0, 0, W, H);

    // Soft radial glow behind the centre
    var glow = c.createRadialGradient(W / 2, H * 0.42, 40, W / 2, H * 0.42, W * 0.6);
    glow.addColorStop(0, 'rgba(255, 205, 110, 0.25)');
    glow.addColorStop(1, 'rgba(255, 205, 110, 0)');
    c.fillStyle = glow;
    c.fillRect(0, 0, W, H);

    // Outer gold border (thick, double rule)
    var pad = W * 0.035;
    c.strokeStyle = '#e9c264';
    c.lineWidth = W * 0.014;
    roundedRect(c, pad, pad, W - pad * 2, H - pad * 2, W * 0.03);
    c.stroke();

    var pad2 = pad + W * 0.022;
    c.strokeStyle = 'rgba(233, 194, 100, 0.55)';
    c.lineWidth = W * 0.004;
    roundedRect(c, pad2, pad2, W - pad2 * 2, H - pad2 * 2, W * 0.024);
    c.stroke();

    // Corner flourishes
    var fr = W * 0.05;
    drawFlourish(c, pad2 + fr * 0.6, pad2 + fr * 0.6, fr, '#e9c264');
    drawFlourish(c, W - pad2 - fr * 0.6, pad2 + fr * 0.6, fr, '#e9c264');
    drawFlourish(c, pad2 + fr * 0.6, H - pad2 - fr * 0.6, fr, '#e9c264');
    drawFlourish(c, W - pad2 - fr * 0.6, H - pad2 - fr * 0.6, fr, '#e9c264');

    // Centre lotus flourish above the title
    drawFlourish(c, W / 2, H * 0.155, W * 0.045, '#ffcf6e');

    var cx = W / 2;
    c.textAlign = 'center';

    // Eyebrow
    c.fillStyle = '#f3d38a';
    c.font = '600 ' + Math.round(W * 0.024) + 'px Georgia, "Times New Roman", serif';
    c.fillText('Certificate of Spiritual Achievement', cx, H * 0.225);

    // Title
    c.fillStyle = '#ffe9b8';
    c.font = '700 ' + Math.round(W * 0.075) + 'px Georgia, "Times New Roman", serif';
    c.fillText('Naam Smaran', cx, H * 0.31);

    // Divider
    c.strokeStyle = '#e9c264';
    c.lineWidth = W * 0.003;
    c.beginPath();
    c.moveTo(cx - W * 0.12, H * 0.335);
    c.lineTo(cx + W * 0.12, H * 0.335);
    c.stroke();

    // "This certifies that"
    c.fillStyle = '#f1dcb0';
    c.font = 'italic ' + Math.round(W * 0.026) + 'px Georgia, serif';
    c.fillText('This certifies that', cx, H * 0.395);

    // User name
    c.fillStyle = '#fff6df';
    c.font = '700 ' + Math.round(W * 0.055) + 'px Georgia, serif';
    c.fillText(cert.userName || 'A Devoted Practitioner', cx, H * 0.455);

    // Body line
    c.fillStyle = '#f1dcb0';
    c.font = Math.round(W * 0.026) + 'px Georgia, serif';
    c.fillText('has devotedly chanted the sacred Naam', cx, H * 0.505);

    c.fillStyle = '#ffd77a';
    c.font = '700 ' + Math.round(W * 0.042) + 'px Georgia, serif';
    c.fillText(cert.naam || 'Naam', cx, H * 0.56);

    // Milestone banner
    var bannerY = H * 0.615, bannerH = H * 0.1;
    roundedRect(c, W * 0.22, bannerY, W * 0.56, bannerH, bannerH * 0.35);
    var bandGrad = c.createLinearGradient(0, bannerY, 0, bannerY + bannerH);
    bandGrad.addColorStop(0, 'rgba(233,194,100,0.18)');
    bandGrad.addColorStop(1, 'rgba(233,194,100,0.05)');
    c.fillStyle = bandGrad;
    c.fill();
    c.strokeStyle = 'rgba(233,194,100,0.6)';
    c.lineWidth = W * 0.0025;
    c.stroke();

    c.fillStyle = '#fff6df';
    c.font = '700 ' + Math.round(W * 0.038) + 'px Georgia, serif';
    c.fillText(fmtNumber(cert.milestone) + ' Jap Milestone', cx, bannerY + bannerH * 0.62);

    // Stats row
    var statY = H * 0.755;
    c.font = Math.round(W * 0.023) + 'px Georgia, serif';
    c.fillStyle = '#f1dcb0';
    c.fillText('Total Jap: ' + fmtNumber(cert.totalJap) + '     •     Total Mala: ' + fmtNumber(cert.totalMala), cx, statY);

    // Completion date
    c.font = Math.round(W * 0.021) + 'px Georgia, serif';
    c.fillText('Completed on ' + fmtDate(cert.date), cx, H * 0.815);

    // Certificate ID
    c.fillStyle = 'rgba(241,220,176,0.75)';
    c.font = Math.round(W * 0.018) + 'px Georgia, serif';
    c.fillText('Certificate ID: ' + cert.id, cx, H * 0.9);

    // Om glyph watermark
    c.save();
    c.globalAlpha = 0.14;
    c.fillStyle = '#ffe9b8';
    c.font = '700 ' + Math.round(W * 0.09) + 'px Georgia, serif';
    c.fillText('\u0950', cx, H * 0.185);
    c.restore();
  }

  function canvasToBlob(canvas) {
    return new Promise(function (resolve) {
      canvas.toBlob(function (blob) { resolve(blob); }, 'image/png', 0.95);
    });
  }

  function downloadCanvas(canvas, filename) {
    var url = canvas.toDataURL('image/png');
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function shareCanvas(canvas, filename, title) {
    return canvasToBlob(canvas).then(function (blob) {
      if (!blob) return downloadCanvas(canvas, filename);
      var file = new File([blob], filename, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        return navigator.share({
          files: [file],
          title: title || 'Naam Smaran Certificate',
          text: 'My Naam Jap achievement certificate 🙏'
        }).catch(function () { /* user cancelled - ignore */ });
      }
      // Fallback: no native share sheet available, just save the file.
      downloadCanvas(canvas, filename);
    });
  }

  root.NaamCertificate = {
    render: renderCertificate,
    download: downloadCanvas,
    share: shareCanvas
  };
})(typeof window !== 'undefined' ? window : this);
