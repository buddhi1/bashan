/* Site behaviour: theme toggle, mobile nav, publication + news rendering,
   publication search/filter, BibTeX copy, explainer-animation controls.
   No dependencies. Data comes from data/publications.js and data/news.js. */
(function () {
  "use strict";

  var SITE = window.SITE || {};
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- helpers ---------- */

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function formatDate(d) {
    var parts = String(d).split("-");
    if (parts.length < 2) return parts[0];
    var m = parseInt(parts[1], 10);
    return (MONTHS[m - 1] || "") + " " + parts[0];
  }

  /* ---------- theme ---------- */

  function currentTheme() {
    var attr = document.documentElement.getAttribute("data-theme");
    if (attr === "dark" || attr === "light") return attr;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("theme", theme); } catch (e) { /* storage unavailable */ }
    $all(".theme-toggle").forEach(function (b) {
      b.setAttribute("aria-label", "Switch to " + (theme === "dark" ? "light" : "dark") + " mode");
    });
  }

  $all(".theme-toggle").forEach(function (btn) {
    btn.setAttribute("aria-label", "Switch to " + (currentTheme() === "dark" ? "light" : "dark") + " mode");
    btn.addEventListener("click", function () {
      setTheme(currentTheme() === "dark" ? "light" : "dark");
    });
  });

  // The choice is stored in localStorage, which every page reads before first
  // paint (inline script in <head>). This keeps already-open tabs in sync too.
  window.addEventListener("storage", function (e) {
    if (e.key === "theme" && (e.newValue === "dark" || e.newValue === "light")) {
      document.documentElement.setAttribute("data-theme", e.newValue);
    }
  });

  /* ---------- back to top ---------- */

  var toTop = $(".to-top");
  if (toTop) {
    function updateToTop() {
      toTop.hidden = (window.scrollY || document.documentElement.scrollTop) < 480;
    }
    window.addEventListener("scroll", updateToTop, { passive: true });
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
    updateToTop();
  }

  /* ---------- mobile nav ---------- */

  var navToggle = $(".nav-toggle");
  var nav = $(".nav");
  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        nav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- publications ---------- */

  function authorsHtml(list) {
    return list.map(function (a) {
      if (a === SITE.me) return "<strong>" + escapeHtml(a) + "</strong>";
      if (a === "et al.") return "<em>et al.</em>";
      return escapeHtml(a);
    }).join(", ");
  }

  function pubHtml(p, opts) {
    opts = opts || {};
    var h = [];
    h.push('<article class="pub" data-key="' + escapeHtml(p.key) + '">');
    h.push('<span class="pub-key">' + escapeHtml(p.key) + "</span>");
    h.push('<div class="pub-body">');

    if (p.url) {
      h.push('<a class="pub-title" href="' + escapeHtml(p.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(p.title) + "</a>");
    } else {
      h.push('<span class="pub-title">' + escapeHtml(p.title) + "</span>");
    }
    h.push('<p class="pub-meta">' + authorsHtml(p.authors) + "." +
      (p.venue ? ' <span class="pub-venue">' + escapeHtml(p.venue) + "</span>" : "") + "</p>");

    // badges (award, acceptance rate, to appear, under review) share the links line
    var links = [];
    if (p.status) links.push('<span class="badge badge-soft">' + escapeHtml(p.status) + "</span>");
    (p.badges || []).forEach(function (b) {
      links.push('<span class="badge' + (b.award ? " badge-award" : "") + '">' + escapeHtml(b.text) + "</span>");
    });
    if (p.url) links.push('<a href="' + escapeHtml(p.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(p.urlLabel || "Publisher") + "</a>");
    if (p.doi && !opts.compact) links.push('<a href="https://doi.org/' + escapeHtml(p.doi) + '" target="_blank" rel="noopener noreferrer">DOI ' + escapeHtml(p.doi) + "</a>");
    if (p.bibtex) {
      links.push(
        '<details class="bib"><summary>BibTeX</summary>' +
        '<div class="bib-box"><button type="button" class="btn bib-copy">Copy</button>' +
        "<pre>" + escapeHtml(p.bibtex) + "</pre></div></details>"
      );
    }
    if (links.length) h.push('<div class="links">' + links.join("") + "</div>");

    h.push("</div></article>");
    return h.join("");
  }

  function wireBibCopy(root) {
    $all(".bib-copy", root).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var pre = btn.parentNode.querySelector("pre");
        var text = pre ? pre.textContent : "";
        function done(ok) {
          btn.textContent = ok ? "Copied" : "Copy failed";
          setTimeout(function () { btn.textContent = "Copy"; }, 1600);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
        } else {
          var range = document.createRange();
          range.selectNodeContents(pre);
          var sel = window.getSelection();
          sel.removeAllRanges(); sel.addRange(range);
          try { done(document.execCommand("copy")); } catch (e) { done(false); }
          sel.removeAllRanges();
        }
      });
    });
  }

  // data/publications.js is kept newest-first by hand; render in that order.
  var pubs = (SITE.publications || []).slice();

  // Home: selected publications
  var selectedEl = $("#selected-pubs");
  if (selectedEl) {
    selectedEl.innerHTML = pubs.filter(function (p) { return p.selected; })
      .map(function (p) { return pubHtml(p, { compact: true }); }).join("");
    wireBibCopy(selectedEl);
  }

  // Publications page: full list with search + filters
  var listEl = $("#pub-list");
  if (listEl) {
    var searchEl = $("#pub-search");
    var filterBtns = $all(".filters .btn");
    var emptyEl = $("#pub-empty");
    var activeType = "all";

    function matches(p, q) {
      if (activeType !== "all" && p.type !== activeType) return false;
      if (!q) return true;
      var hay = [p.key, p.title, p.venue, String(p.year), (p.status || "")]
        .concat(p.authors, p.keywords || [], (p.badges || []).map(function (b) { return b.text; }))
        .join(" ").toLowerCase();
      return q.split(/\s+/).every(function (term) { return term && hay.indexOf(term) !== -1; });
    }

    function render() {
      var q = (searchEl ? searchEl.value : "").trim().toLowerCase();
      var shown = pubs.filter(function (p) { return matches(p, q); });
      listEl.innerHTML = shown.map(function (p) { return pubHtml(p); }).join("");
      wireBibCopy(listEl);
      if (emptyEl) emptyEl.hidden = shown.length > 0;
    }

    if (searchEl) searchEl.addEventListener("input", render);
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        activeType = btn.getAttribute("data-type") || "all";
        filterBtns.forEach(function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
        render();
      });
    });
    render();
  }

  // Software and data
  var softEl = $("#software-list");
  if (softEl && SITE.software) {
    softEl.innerHTML = SITE.software.map(function (s) {
      return '<div class="card software' + (s.wide ? " wide" : "") + '">' +
        '<div class="software-head"><a href="' + escapeHtml(s.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(s.name) + "</a>" +
        '<span class="pub-key">' + escapeHtml(s.keys) + "</span></div>" +
        "<p>" + escapeHtml(s.text) + "</p></div>";
    }).join("");
  }

  /* ---------- news ---------- */

  var news = (SITE.news || []).slice().sort(function (a, b) {
    return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
  });

  function newsItemHtml(n) {
    return '<div class="news-item"><span class="mono">' + escapeHtml(formatDate(n.date)) + "</span><p>" + n.html + "</p></div>";
  }

  var latestEl = $("#news-latest");
  if (latestEl) {
    var limit = parseInt(latestEl.getAttribute("data-limit") || "6", 10);
    latestEl.innerHTML = news.slice(0, limit).map(newsItemHtml).join("");
  }

  var allNewsEl = $("#news-all");
  if (allNewsEl) {
    var byYear = {};
    var years = [];
    news.forEach(function (n) {
      var y = String(n.date).slice(0, 4);
      if (!byYear[y]) { byYear[y] = []; years.push(y); }
      byYear[y].push(n);
    });
    allNewsEl.innerHTML = years.map(function (y) {
      return '<section class="news-year"><h2>' + y + '</h2><div class="news-list">' +
        byYear[y].map(newsItemHtml).join("") + "</div></section>";
    }).join("");
  }

  /* ---------- explainer animations ---------- */

  $all(".anim").forEach(function (panel) {
    var playBtn = $(".anim-play", panel);
    var replayBtn = $(".anim-replay", panel);
    var steps = $all(".anim-step", panel);

    function setPlaying(playing) {
      panel.classList.toggle("paused", !playing);
      if (playBtn) playBtn.textContent = playing ? "Pause" : "Play";
    }

    // Restart the shared timeline from t = 0.
    function replay() {
      panel.style.setProperty("--seek", "0s");
      panel.classList.add("reset");
      void panel.offsetWidth; // force reflow so the animations restart
      panel.classList.remove("reset");
      setPlaying(true);
    }

    // Show the frame at `seconds` into the timeline and hold it.
    function seek(seconds) {
      panel.classList.add("reset");
      void panel.offsetWidth;
      panel.style.setProperty("--seek", "-" + seconds + "s");
      panel.classList.remove("reset");
      setPlaying(false);
    }

    if (playBtn) {
      playBtn.addEventListener("click", function () {
        setPlaying(panel.classList.contains("paused"));
      });
    }
    if (replayBtn) replayBtn.addEventListener("click", replay);

    steps.forEach(function (btn) {
      btn.addEventListener("click", function () {
        seek(parseFloat(btn.getAttribute("data-t") || "0"));
      });
    });

    if (reduceMotion) {
      seek(9); // hold the finished state; the controls still work
    } else {
      setPlaying(true);
    }
  });
})();
