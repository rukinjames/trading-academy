/* Trading Academy. All progress lives in this browser's localStorage. Export from Settings to back up. */
(function () {
  "use strict";
  var KEY = "ta.v1";
  var app = document.getElementById("app");

  // ------------------------------------------------------------------ state
  function fresh() {
    return { v: 1, created: Date.now(), diag: null, weeks: {}, journal: [], qstats: {},
      settings: { dailyLossR: 3, maxTrades: 4 } };
  }
  // Older saves keyed weeks 1, 2, 3 and question stats by bare id. Both now belong to the trading track.
  function migrate(s) {
    if (!s || s.v !== 1) return s;
    if (!s.mig) {
      var w2 = {}; Object.keys(s.weeks || {}).forEach(function (k) { w2[/^\d+$/.test(k) ? "t" + k : k] = s.weeks[k]; }); s.weeks = w2;
      var q2 = {}; Object.keys(s.qstats || {}).forEach(function (k) { q2[k.indexOf(":") < 0 ? "t1:" + k : k] = s.qstats[k]; }); s.qstats = q2;
      s.mig = 2;
    }
    s.deleted = s.deleted || [];
    s.updated = s.updated || s.created || Date.now();
    return s;
  }
  function load() {
    try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 1) return migrate(s); } catch (e) {}
    return migrate(fresh());
  }
  var S = load();
  function save(quiet) {
    S.updated = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(S)); }
    catch (e) { toast("Could not save in this browser. Export a backup from Settings."); }
    if (!quiet) Sync.schedule();
  }
  function W(id) {
    if (!S.weeks[id]) S.weeks[id] = { tasks: {}, teach: "", exams: [], review: null, passed: false, pretest: null };
    return S.weeks[id];
  }
  function week(id) { return TA.WEEKS.filter(function (w) { return w.id === id; })[0]; }
  function bank(id) { return TA.BANKS && TA.BANKS[id]; }
  function track(t) { return TA.TRACKS.filter(function (x) { return x.id === t; })[0]; }
  function trackWeeks(t) { return TA.WEEKS.filter(function (w) { return w.track === t; }); }
  function lbl(id) { var w = week(id); return track(w.track).short + " Week " + w.n; }
  function phaseOf(w) { return track(w.track).phases[w.phase - 1]; }
  function wid(p) { var k = (p && p[0]) || "t1"; return /^\d+$/.test(k) ? "t" + k : k; }
  function sib(id, d) { var w = week(id); return w ? week(w.track + (w.n + d)) : null; }
  function qkey(id, itemId) { return id + ":" + itemId; }

  // ------------------------------------------------------------------ helpers
  var R = {
    int: function (a, b) { return a + Math.floor(Math.random() * (b - a + 1)); },
    pick: function (a) { return a[Math.floor(Math.random() * a.length)]; },
    shuffle: function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function toast(msg) {
    var t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg; document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  }
  function today() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function f2(x) { return (x >= 0 ? "+" : "−") + Math.abs(x).toFixed(2); }
  function pct(x) { return Math.round(x * 100) + "%"; }
  var LETTERS = "ABCDEFGH";
  var CHECK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.4l3 3 6-6.6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var LOCK = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3.2" y="7" width="9.6" height="7" rx="1.6" fill="currentColor"/><path d="M5.3 7V5.2a2.7 2.7 0 0 1 5.4 0V7" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';


  // ------------------------------------------------------------------ cloud sync
  // Progress is stored under a long random sync code. The database only ever sees a hash of the code,
  // and the two functions below are the only way in. Anyone with the code can read and write that progress.
  var SYNC_URL = "https://jnfksxaswtxpgsgfmpdm.supabase.co/rest/v1/rpc/";
  var SYNC_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpuZmtzeGFzd3R4cGdzZ2ZtcGRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MTYzNDYsImV4cCI6MjA5NDA5MjM0Nn0.LS_VoUvoBN4PwsVdxubaYEXqxY8u3eGT1DXRZ94iKa4";
  function merge(a, b) {
    if (!b) return a; if (!a) return b;
    var newer = (b.updated || 0) > (a.updated || 0) ? b : a, older = newer === a ? b : a;
    var o = JSON.parse(JSON.stringify(newer));
    var keys = {}; Object.keys(a.weeks || {}).concat(Object.keys(b.weeks || {})).forEach(function (k) { keys[k] = 1; });
    o.weeks = {};
    Object.keys(keys).forEach(function (k) {
      var x = (newer.weeks || {})[k], y = (older.weeks || {})[k];
      if (!x || !y) { o.weeks[k] = JSON.parse(JSON.stringify(x || y)); return; }
      var w = JSON.parse(JSON.stringify(x));
      w.tasks = w.tasks || {};
      Object.keys(y.tasks || {}).forEach(function (t) { if (y.tasks[t]) w.tasks[t] = true; });
      var seen = {};
      w.exams = (x.exams || []).concat(y.exams || []).filter(function (e) { if (seen[e.date]) return false; seen[e.date] = 1; return true; }).sort(function (p, q) { return p.date - q.date; });
      w.passed = !!(x.passed || y.passed);
      if (w.passed) w.review = null;
      if (!x.pretest || (y.pretest && y.pretest.date > x.pretest.date)) w.pretest = y.pretest || x.pretest;
      if (!w.teach && y.teach) w.teach = y.teach;
      o.weeks[k] = w;
    });
    var del = {}; (a.deleted || []).concat(b.deleted || []).forEach(function (id) { del[id] = 1; });
    o.deleted = Object.keys(del).map(Number);
    var j = {}; (newer.journal || []).concat(older.journal || []).forEach(function (t) { if (!del[t.id] && !j[t.id]) j[t.id] = t; });
    o.journal = Object.keys(j).map(function (k) { return j[k]; });
    o.qstats = {};
    [a.qstats || {}, b.qstats || {}].forEach(function (q) { Object.keys(q).forEach(function (k) { var c = o.qstats[k] || { seen: 0, miss: 0 }; c.seen = Math.max(c.seen, q[k].seen || 0); c.miss = Math.max(c.miss, q[k].miss || 0); o.qstats[k] = c; }); });
    o.diag = (a.diag && b.diag) ? (a.diag.date >= b.diag.date ? a.diag : b.diag) : (a.diag || b.diag || null);
    o.created = Math.min(a.created || Date.now(), b.created || Date.now());
    o.updated = Math.max(a.updated || 0, b.updated || 0);
    return o;
  }
  var Sync = (function () {
    var SK = "ta.sync", timer = null, busy = false, again = false, info = {};
    try { info = JSON.parse(localStorage.getItem(SK)) || {}; } catch (e) { info = {}; }
    function keep() { try { localStorage.setItem(SK, JSON.stringify(info)); } catch (e) {} }
    function rpc(fn, body) {
      return fetch(SYNC_URL + fn, { method: "POST", headers: { apikey: SYNC_KEY, Authorization: "Bearer " + SYNC_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) })
        .then(function (r) { if (!r.ok) throw new Error("the sync server answered " + r.status); return r.json(); });
    }
    function newCode() {
      var al = "abcdefghjkmnpqrstuvwxyz23456789", a = new Uint8Array(20), out = "";
      crypto.getRandomValues(a);
      for (var i = 0; i < a.length; i++) { out += al[a[i] % al.length]; if (i % 5 === 4 && i < 19) out += "-"; }
      return "ta-" + out;
    }
    function footer() {
      if (!info.code) return "Saved in this browser only. Turn on cloud sync in Settings to keep your progress across devices.";
      if (info.err) return "Cloud sync could not reach the server, so changes are saved in this browser and will sync when it can.";
      return "Synced to the cloud" + (info.last ? ", last at " + new Date(info.last).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).replace(":", "\u2236") : "") + ".";
    }
    function upd() { var f = document.getElementById("syncfoot"); if (f) f.textContent = footer(); var g = document.getElementById("syncstat"); if (g) g.textContent = footer(); }
    function push() {
      if (!info.code) return Promise.resolve();
      if (busy) { again = true; return Promise.resolve(); }
      busy = true;
      return rpc("academy_put", { code: info.code, payload: S }).then(function () { info.last = Date.now(); info.err = null; }, function (e) { info.err = String(e.message || e); })
        .then(function () { keep(); upd(); busy = false; if (again) { again = false; return push(); } });
    }
    function now() {
      if (!info.code) return Promise.resolve(false);
      return rpc("academy_get", { code: info.code }).then(function (remote) {
        var before = JSON.stringify(S);
        if (remote && remote.v === 1) S = merge(S, migrate(remote));
        var changed = JSON.stringify(S) !== before;
        save(true);
        return push().then(function () { return changed; });
      }, function (e) { info.err = String(e.message || e); keep(); upd(); return false; });
    }
    return {
      on: function () { return !!info.code; },
      code: function () { return info.code || ""; },
      footer: footer,
      schedule: function () { if (!info.code) return; clearTimeout(timer); timer = setTimeout(push, 1200); },
      now: now,
      enable: function () { info = { code: newCode() }; keep(); return push(); },
      link: function (code) {
        code = String(code || "").trim().toLowerCase();
        if (!/^ta(-[a-z0-9]{5}){4}$/.test(code)) return Promise.reject(new Error("That does not look like a sync code. It starts with ta- and has four groups of five characters."));
        return rpc("academy_get", { code: code }).then(function (remote) {
          if (!remote) throw new Error("No progress is stored under that code. Check it and try again.");
          info = { code: code }; keep();
          S = merge(S, migrate(remote)); save(true);
          return push();
        });
      },
      off: function () { info = {}; keep(); }
    };
  })();

  // ------------------------------------------------------------------ progress logic
  function tasksDone(n) {
    var w = week(n); if (!w || !w.tasks) return false;
    var st = W(n);
    return w.tasks.every(function (t) { return st.tasks[t.id]; });
  }
  function gateStatus(g) {
    var trades = S.journal.filter(function (t) { return t.mode === g.mode; });
    if (g.min) return { ok: trades.length >= g.min, val: trades.length + " of " + g.min };
    if (g.adherence) {
      if (!trades.length) return { ok: false, val: "no trades" };
      var a = trades.filter(function (t) { return t.followed; }).length / trades.length;
      return { ok: a >= g.adherence, val: pct(a) };
    }
    return { ok: false, val: "" };
  }
  function gatesDone(n) { var w = week(n); return !w.gates || w.gates.every(function (g) { return gateStatus(g).ok; }); }
  function completed(n) { var w = week(n); return !!(w && w.lesson && bank(n) && W(n).passed && tasksDone(n) && gatesDone(n)); }
  function unlocked(n) { var w = week(n); return !!w && (w.n === 1 || completed(sib(n, -1).id)); }
  function currentWeek(t) { var ws = trackWeeks(t); for (var i = 0; i < ws.length; i++) if (!completed(ws[i].id)) return ws[i].id; return ws[ws.length - 1].id; }

  // The five steps of a week, for display. Practice is open at any time and never blocks.
  function steps(n) {
    var w = week(n), st = W(n), b = bank(n);
    var seen = b ? b.items.filter(function (it) { return S.qstats[qkey(n, it.id)]; }).length : 0;
    var s = [
      { k: "floor", label: "Find your floor", done: !!st.pretest, href: "#/pretest/" + n },
      { k: "lesson", label: "Lesson", done: !!st.tasks.read, href: w.lesson || ("#/week/" + n) },
      { k: "practice", label: "Practice", open: true, href: "#/practice/" + n, note: b ? (seen + " of " + b.items.length + " seen") : "" },
      { k: "tasks", label: "Tasks", done: tasksDone(n), href: "#/week/" + n },
      { k: "exam", label: "Exam", done: !!st.passed, href: "#/exam/" + n }
    ];
    var cur = s.filter(function (x) { return !x.open && !x.done; })[0];
    if (cur) cur.now = true;
    return s;
  }
  function pathHTML(n) {
    return '<ol class="path" aria-label="This week\'s steps">' + steps(n).map(function (s) {
      var cls = s.done ? "done" : s.now ? "now" : s.open ? "open" : "todo";
      var state = s.done ? "done" : s.now ? "you are here" : s.open ? "any time" : "not yet";
      return '<li class="' + cls + '"><span class="node" aria-hidden="true">' + (s.done ? CHECK : "") + '</span><span class="pl">' + s.label + '</span><span class="sr"> ' + state + "</span></li>";
    }).join("") + "</ol>";
  }

  // ------------------------------------------------------------------ question instances
  function prep(g) {
    if (g.type === "mcq") g.choices = R.shuffle(g.opts.map(function (t, i) { return { t: t, ok: i === 0 }; }));
    return g;
  }
  function instance(item) {
    if (item.gen) { var g = item.gen(R); g.id = item.id; g.topic = item.topic; return prep(g); }
    return prep({ id: item.id, topic: item.topic, type: "mcq", q: item.q, opts: item.opts, ex: item.ex });
  }
  function itemById(b, id) { return b.items.filter(function (i) { return i.id === id; })[0]; }
  function grade(inst, ans) {
    if (inst.type === "mcq") return ans != null && inst.choices[ans] && inst.choices[ans].ok;
    var x = parseFloat(String(ans == null ? "" : ans).replace(/,/g, "").replace(/−/g, "-"));
    return !isNaN(x) && Math.abs(x - inst.answer) <= inst.tol;
  }
  function rightText(inst) {
    if (inst.type === "mcq") return inst.choices.filter(function (c) { return c.ok; })[0].t;
    var x = inst.answer, d = Math.abs(x * 100 - Math.round(x * 100)) < 1e-9 ? 2 : Math.abs(x * 1000 - Math.round(x * 1000)) < 1e-9 ? 3 : 2;
    return Number.isInteger(x) ? x.toLocaleString("en-US") : x.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function stat(id, ok) {
    var s = S.qstats[id] || (S.qstats[id] = { seen: 0, miss: 0 });
    s.seen++; if (!ok) s.miss++;
  }
  function qHTML(inst, i, opts) {
    opts = opts || {};
    var h = '<article class="q" data-i="' + i + '"><header class="qn"><span class="qnum">' + (opts.label || ("Question " + (i + 1))) + "</span>" + (opts.topic ? '<span class="qtopic">' + esc(opts.topic) + "</span>" : "") + "</header>";
    h += '<div class="qt">' + inst.q + "</div>";
    if (inst.type === "mcq") {
      h += '<div class="opts">' + inst.choices.map(function (c, k) { return '<button type="button" class="opt" data-k="' + k + '"><span class="ol" aria-hidden="true">' + LETTERS[k] + '</span><span class="ot">' + esc(c.t) + "</span></button>"; }).join("") + "</div>";
    } else {
      h += '<div class="num"><input type="text" inputmode="decimal" autocomplete="off" placeholder="Your answer" aria-label="Your answer"></div>';
    }
    return h + '<div class="fbx" aria-live="polite"></div></article>';
  }

  // ------------------------------------------------------------------ router
  var routes = {};
  function go(h) { location.hash = h; }
  function nav() {
    var h = location.hash.replace(/^#\/?/, "") || "home";
    var parts = h.split("/");
    var section = { week: "home", pretest: "home", practice: "home", review: "home", exam: "home", diagnostic: "home", diagresult: "home" }[parts[0]] || parts[0];
    document.querySelectorAll(".nav a").forEach(function (a) { a.classList.toggle("on", a.getAttribute("data-r") === section); });
    var fn = routes[parts[0]] || routes.home;
    window.scrollTo(0, 0);
    fn(parts.slice(1));
  }
  window.addEventListener("hashchange", nav);

  function head(where, title, lede) {
    return '<header class="pagehead"><p class="where">' + where + "</p><h1>" + title + "</h1>" + (lede ? '<p class="lede">' + lede + "</p>" : "") + "</header>";
  }

  // ------------------------------------------------------------------ home
  routes.home = function () {
    var h = head("Trading Academy", "Two tracks, one rule", "Day trading and investing run side by side. Each week in each track needs a 100% exam before the next one opens. Study whichever you like on a given day.");
    TA.TRACKS.forEach(function (T) {
      var cur = currentWeek(T.id), w = week(cur);
      h += '<section class="next track-' + T.id + '" aria-label="' + esc(T.name) + ' next step"><p class="trackname">' + esc(T.name) + ", week " + w.n + " of " + trackWeeks(T.id).length + '</p><h2 class="tt2">' + esc(w.title) + "</h2>" + (w.lesson && bank(cur) ? pathHTML(cur) : "") + '<div class="nextbody">' + nextAction(cur) + "</div></section>";
    });
    if (!S.diag) {
      h += '<aside class="diag"><div><h2>Take the trading diagnostic</h2><p>24 questions across all 12 trading weeks. It never lets you skip a week. It shows where your picture of trading starts, so the lessons can start there too. Guess freely and be honest about it.</p></div><a class="btn" href="#/diagnostic">Start the diagnostic</a></aside>';
    } else {
      h += '<aside class="diag done"><div><h2>Trading diagnostic, ' + S.diag.score + " of " + S.diag.n + '</h2><p>Every week still needs its 100% exam.</p></div><a class="btn ghost" href="#/diagresult">See the breakdown</a></aside>';
    }
    TA.TRACKS.forEach(function (T) {
      var ws = trackWeeks(T.id), cur = currentWeek(T.id);
      var done = ws.filter(function (x) { return completed(x.id); }).length;
      h += '<section class="road track-' + T.id + '"><div class="sechead"><h2>' + esc(T.road) + '</h2><p class="count">' + done + " of " + ws.length + ' weeks done</p></div><p class="roadblurb">' + esc(T.blurb) + "</p>";
      T.phases.forEach(function (p) {
        var pw = ws.filter(function (x) { return x.phase === p.id; });
        h += '<div class="phase"><div class="phasehead"><h3>Phase ' + p.id + ". " + esc(p.name) + "</h3><p>" + esc(p.blurb) + '</p></div><ol class="rail">';
        pw.forEach(function (x) {
          var isDone = completed(x.id), un = unlocked(x.id), isCur = x.id === cur && !isDone;
          var cls = isDone ? "done" : isCur ? "now" : un ? "todo" : "locked";
          var status = isDone ? "Done" : isCur ? (x.lesson ? "You are here" : "Ready to be built") : !un ? "Locked" : "Open";
          h += '<li class="' + cls + '"><a href="#/week/' + x.id + '"><span class="node" aria-hidden="true">' + (isDone ? CHECK : !un ? LOCK : "") + '</span><span class="wn">' + x.n + '</span><span class="wt"><b>' + esc(x.title) + "</b><span>" + esc(x.topic) + '</span></span><span class="ws">' + status + "</span></a></li>";
        });
        h += "</ol></div>";
      });
      h += "</section>";
      if (T.id === "t") h += gatePanel();
    });
    h += '<p class="foot" id="syncfoot">' + Sync.footer() + "</p>";
    app.innerHTML = h;
  };

  function nextAction(n) {
    var w = week(n), st = W(n);
    var line = function (title, body, btn) { return '<h2 class="nt">' + title + '</h2><p class="nb">' + body + "</p>" + (btn ? '<div class="row">' + btn + "</div>" : ""); };
    if (!w.lesson || !bank(n)) {
      return line(lbl(n) + " is ready to be built", (w.n > 1 ? "You passed everything before it. " : "") + "Tell Claude <b>Build " + lbl(n) + "</b>. It will be written around what you got wrong so far.", '<a class="btn" href="#/week/' + n + '">See what it covers</a>');
    }
    if (!st.pretest) return line("Find your floor", "Five questions before you read anything. Wrong answers are expected and useful, they show where the lesson should start for you.", '<a class="btn pri" href="#/pretest/' + n + '">Start 5 questions</a>');
    if (!st.tasks.read) return line("Read the lesson", "Read every chapter and answer every green box. Then tick it off on the week page.", '<a class="btn pri" href="' + w.lesson + '">Open the lesson</a><a class="btn" href="#/week/' + n + '">Week page</a>');
    if (!tasksDone(n)) return line("Finish this week's tasks", "Practice as much as you like while you work through them.", '<a class="btn pri" href="#/week/' + n + '">Open the tasks</a><a class="btn" href="#/practice/' + n + '">Practice questions</a>');
    if (st.review && st.review.length) return line("Clear your misses before retaking", st.review.length + " question" + (st.review.length > 1 ? "s" : "") + " from your last attempt, with fresh numbers.", '<a class="btn pri" href="#/review/' + n + '">Clear misses</a>');
    if (!st.passed) return line("Take the " + lbl(n) + " exam", bank(n).examSize + " questions drawn at random. You need every one right to " + (sib(n, 1) ? "unlock " + lbl(sib(n, 1).id) : "finish the track") + ".", '<a class="btn pri" href="#/exam/' + n + '">Take the exam</a><a class="btn" href="#/practice/' + n + '">Practice first</a>');
    if (!gatesDone(n)) return line("Finish the journal requirements", "This week also needs logged trades. See the week page.", '<a class="btn pri" href="#/week/' + n + '">Week page</a>');
    return line(lbl(n) + " complete", "Everything is done.", "");
  }

  // ------------------------------------------------------------------ week page
  routes.week = function (p) {
    var n = wid(p), w = week(n); if (!w) return go("#/");
    var st = W(n), un = unlocked(n), b = bank(n), prev = sib(n, -1), next = sib(n, 1);
    var h = '<a class="back" href="#/">All weeks</a>' + head(esc(lbl(n)) + ", " + esc(phaseOf(w).name), esc(w.title), esc(w.topic) + ".");
    if (!un) h += '<div class="notice warn"><span class="ic">' + LOCK + "</span><p><b>Locked.</b> Finish " + esc(lbl(prev.id)) + " first. Its exam needs 100%.</p></div>";
    h += '<section class="objectives"><h2>By the end of this week you can</h2><ul>' + w.objectives.map(function (o) { return "<li>" + esc(o) + "</li>"; }).join("") + "</ul></section>";
    if (!w.lesson || !b) {
      h += '<div class="notice"><p><b>Not built yet.</b> Each week is written when you reach it, aimed at your mistakes so far. ' + (prev ? "When " + esc(lbl(prev.id)) + " is done, tell" : "Tell") + " Claude <b>Build " + esc(lbl(n)) + "</b>.</p></div>";
      app.innerHTML = h; return;
    }
    if (!un) { app.innerHTML = h; return; }
    // unlock checklist
    var reqs = [["Exam passed at 100%", st.passed], ["All tasks done", tasksDone(n)]];
    (w.gates || []).forEach(function (g) { var gs = gateStatus(g); reqs.push([g.label + " (" + gs.val + ")", gs.ok]); });
    var met = reqs.filter(function (r) { return r[1]; }).length;
    h += '<section class="unlock"><h2>' + (next ? "To unlock " + esc(lbl(next.id)) : "To finish the " + esc(track(w.track).name.toLowerCase()) + " track") + '</h2><p class="count">' + met + " of " + reqs.length + ' met</p><ul class="checks">' + reqs.map(function (r) { return '<li class="' + (r[1] ? "ok" : "") + '"><span class="tick">' + (r[1] ? CHECK : "") + "</span>" + esc(r[0]) + "</li>"; }).join("") + "</ul></section>";

    var S5 = steps(n), last = st.exams[st.exams.length - 1];
    function stepCls(i) { var s = S5[i]; return s.done ? "done" : s.now ? "now" : s.open ? "open" : "todo"; }
    function stepHead(i, title, sub) {
      return '<li class="' + stepCls(i) + '"><span class="node" aria-hidden="true">' + (S5[i].done ? CHECK : "") + '</span><div class="sbody"><h3>' + title + (S5[i].now ? '<span class="here">You are here</span>' : "") + "</h3>" + (sub ? '<p class="ssub">' + sub + "</p>" : "");
    }
    h += '<section class="weekpath"><h2>This week, step by step</h2><ol class="vrail">';
    // 1 floor
    h += stepHead(0, "Find your floor", "Five questions before the lesson, so you know what is new. Not graded.") +
      (st.pretest ? '<p class="sdone">Done. You got ' + st.pretest.score + " of " + st.pretest.n + '.</p><a class="btn sm" href="#/pretest/' + n + '">Do it again</a>' : '<a class="btn pri" href="#/pretest/' + n + '">Start</a>') + "</div></li>";
    // 2 lesson
    h += stepHead(1, "Read the lesson", "The full story, with every interactive. Answer every green box, then tick the first task below.") + '<a class="btn' + (S5[1].now ? " pri" : "") + '" href="' + w.lesson + '">Open the ' + esc(lbl(n)) + " lesson</a></div></li>";
    // 3 practice
    h += stepHead(2, "Practice, any time", "Unlimited questions from the exam bank, with explanations. Questions you miss come back more often, and calculation questions get new numbers every time.") + '<div class="row"><a class="btn" href="#/practice/' + n + '">Practice</a><span class="meta">' + S5[2].note + "</span></div></div></li>";
    // 4 tasks
    var td = w.tasks.filter(function (t) { return st.tasks[t.id]; }).length;
    h += stepHead(3, "Tasks", td + " of " + w.tasks.length + " done.") + '<div class="tasks">';
    w.tasks.forEach(function (t) {
      h += '<label class="task' + (st.tasks[t.id] ? " checked" : "") + '"><input type="checkbox" data-task="' + t.id + '"' + (st.tasks[t.id] ? " checked" : "") + '><span class="box" aria-hidden="true">' + CHECK + '</span><span class="tt">' + esc(t.text) +
        (t.link ? ' <a href="' + t.link + '"' + (/^https?:/.test(t.link) ? ' target="_blank" rel="noopener"' : "") + ">" + esc(t.linkText || "Open") + "</a>" : "") + "</span></label>" +
        (t.teach ? '<div class="teach"><textarea id="teach" placeholder="Explain it here, in your own words.">' + esc(st.teach) + '</textarea><div class="row"><button class="btn sm" id="copyTeach" type="button">Copy it to paste to Claude</button><span class="meta" id="wc"></span></div></div>' : "");
    });
    h += "</div></div></li>";
    // 5 exam
    h += stepHead(4, "The exam", b.examSize + " questions, drawn at random from the bank, one from every topic. 100% to pass. After a miss you clear those questions again with fresh numbers, then retake a brand new draw.");
    if (st.passed) h += '<p class="sdone">Passed.</p>';
    else if (st.review && st.review.length) h += '<a class="btn pri" href="#/review/' + n + '">Clear your ' + st.review.length + " miss" + (st.review.length > 1 ? "es" : "") + " first</a>";
    else h += '<a class="btn' + (S5[4].now ? " pri" : "") + '" href="#/exam/' + n + '">' + (st.exams.length ? "Retake the exam" : "Take the exam") + "</a>";
    if (st.exams.length) h += '<p class="meta attempts">Attempts so far ' + st.exams.map(function (e) { return '<span class="att' + (e.passed ? " ok" : "") + '">' + e.score + "/" + e.n + "</span>"; }).join("") + (last ? " Last on " + new Date(last.date).toLocaleDateString() + "." : "") + "</p>";
    h += "</div></li></ol></section>";
    app.innerHTML = h;
    app.querySelectorAll("[data-task]").forEach(function (cb) {
      cb.addEventListener("change", function () { st.tasks[cb.getAttribute("data-task")] = cb.checked; cb.closest(".task").classList.toggle("checked", cb.checked); save(); });
    });
    var ta = document.getElementById("teach");
    if (ta) {
      var wc = function () { var n2 = (ta.value.trim().match(/\S+/g) || []).length; document.getElementById("wc").textContent = n2 + " words"; };
      ta.addEventListener("input", function () { st.teach = ta.value; save(); wc(); }); wc();
      document.getElementById("copyTeach").addEventListener("click", function () {
        var txt = "Grade my " + lbl(n) + " teach-back for the trading academy. Be strict, tell me what is right, wrong and missing.\n\n" + ta.value;
        (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { toast("Copied. Paste it to Claude."); }, function () { ta.select(); toast("Select all and copy it manually."); });
      });
    }
  };

  // ------------------------------------------------------------------ one at a time sessions (pretest, practice, review, diagnostic)
  function session(cfg) {
    var count = 0, right = 0, inst = null;
    function show() {
      inst = cfg.next();
      if (/debug/.test(location.search)) window.__cur = inst;
      if (!inst) { cfg.onEnd(right, count); return; }
      count++;
      var h = '<div class="focus">' + (cfg.back ? '<a class="back" href="' + cfg.back + '">Stop</a>' : "") + head(cfg.kicker, cfg.title, cfg.sub || "");
      if (cfg.total) h += '<div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="' + cfg.total + '" aria-valuenow="' + (count - 1) + '"><i style="width:' + ((count - 1) / cfg.total * 100) + '%"></i></div>';
      else if (count > 1) h += '<p class="tally">' + right + " of " + (count - 1) + " right this session</p>";
      h += qHTML(inst, count - 1, { label: cfg.total ? "Question " + count + " of " + cfg.total : "Question " + count, topic: cfg.topicName ? cfg.topicName(inst) : "" });
      h += '<div class="row qnext"><button class="btn pri" id="nextq" type="button" hidden>Next question</button></div></div>';
      app.innerHTML = h;
      var q = app.querySelector(".q"), fbx = q.querySelector(".fbx"), nxt = document.getElementById("nextq");
      function done(ok, chosen) {
        if (ok) right++;
        cfg.onAnswer && cfg.onAnswer(inst, ok, chosen); save();
        q.classList.add(ok ? "is-right" : "is-wrong");
        fbx.innerHTML = '<div class="fb ' + (ok ? "ok" : "no") + '"><p class="verdict">' + (ok ? "Right." : "Not quite.") + "</p><p>" + (ok || inst.type === "mcq" ? "" : "The answer is " + esc(rightText(inst)) + ". ") + inst.ex + "</p></div>";
        nxt.hidden = false; nxt.focus();
      }
      if (inst.type === "mcq") {
        q.querySelectorAll(".opt").forEach(function (b) {
          b.addEventListener("click", function () {
            var k = +b.getAttribute("data-k"), ok = inst.choices[k].ok;
            q.querySelectorAll(".opt").forEach(function (o, i) { o.disabled = true; if (inst.choices[i].ok) o.classList.add("right"); });
            if (!ok) b.classList.add("wrong");
            done(ok, k);
          });
        });
      } else {
        var inp = q.querySelector("input"), chk = document.createElement("button");
        chk.className = "btn"; chk.type = "button"; chk.textContent = "Check"; q.querySelector(".num").appendChild(chk);
        var fire = function () { if (!inp.value.trim()) return; var ok = grade(inst, inp.value); inp.disabled = true; chk.disabled = true; inp.classList.add(ok ? "right" : "wrong"); done(ok, inp.value); };
        chk.addEventListener("click", fire);
        inp.addEventListener("keydown", function (e) { if (e.key === "Enter") fire(); });
        inp.focus();
      }
      nxt.addEventListener("click", show);
    }
    show();
  }
  function endCard(where, title, big, body, btns) {
    return '<div class="focus">' + head(where, title) + '<section class="result">' + (big ? '<p class="score">' + big + "</p>" : "") + "<p>" + body + '</p><div class="row">' + btns + "</div></section></div>";
  }

  routes.pretest = function (p) {
    var n = wid(p), b = bank(n); if (!b || !unlocked(n)) return go("#/week/" + n);
    var items = R.shuffle(b.items).slice(0, 5), i = 0;
    session({ kicker: lbl(n) + ", find your floor", title: "Five questions before the lesson", sub: "Answer from what you know now. Guessing is fine. This is not graded.", total: 5, back: "#/week/" + n,
      topicName: function (inst) { return b.topics[inst.topic]; },
      next: function () { return i < items.length ? instance(items[i++]) : null; },
      onAnswer: function (inst, ok) { stat(qkey(n, inst.id), ok); },
      onEnd: function (right, count) {
        W(n).pretest = { score: right, n: count, date: Date.now() }; save();
        app.innerHTML = endCard(lbl(n), "Floor found", right + " of " + count, right >= 4 ? "You already have some of this. Read the lesson anyway, the exam asks for the mechanism, not the vocabulary." : "Good. That is what the lesson is for. Every one of those ideas is built from the ground up.",
          '<a class="btn pri" href="' + week(n).lesson + '">Open the lesson</a><a class="btn" href="#/week/' + n + '">Week page</a>');
      } });
  };

  routes.practice = function (p) {
    var n = wid(p), b = bank(n); if (!b || !unlocked(n)) return go("#/week/" + n);
    var lastId = null;
    session({ kicker: lbl(n) + ", practice", title: "Practice", sub: "As many as you want. Missed questions come back more often. Stop whenever you like.", back: "#/week/" + n,
      topicName: function (inst) { return b.topics[inst.topic]; },
      next: function () {
        var pool = b.items.filter(function (it) { return it.id !== lastId; });
        var weights = pool.map(function (it) { var s = S.qstats[qkey(n, it.id)]; return 1 + (s ? s.miss * 3 : 0) + (s ? 0 : 1); });
        var tot = weights.reduce(function (a, c) { return a + c; }, 0), r = Math.random() * tot, k = 0;
        while (r > weights[k]) { r -= weights[k]; k++; }
        lastId = pool[k].id; return instance(pool[k]);
      },
      onAnswer: function (inst, ok) { stat(qkey(n, inst.id), ok); },
      onEnd: function () {} });
  };

  routes.review = function (p) {
    var n = wid(p), b = bank(n), st = W(n);
    if (!b || !st.review || !st.review.length) return go("#/week/" + n);
    var queue = st.review.slice(), cleared = 0, startN = queue.length;
    session({ kicker: lbl(n) + ", clear your misses", title: "Get each one right", sub: "Each missed question comes back, with fresh numbers where it has numbers. A wrong answer sends it to the back of the line.", back: "#/week/" + n,
      topicName: function (inst) { return b.topics[inst.topic] + ", " + cleared + " of " + startN + " cleared"; },
      next: function () { if (!queue.length) return null; var it = itemById(b, queue[0]); return instance(it); },
      onAnswer: function (inst, ok) {
        stat(qkey(n, inst.id), ok);
        var id = queue.shift();
        if (ok) cleared++; else queue.push(id);
        st.review = queue.slice();
      },
      onEnd: function () {
        st.review = null; save();
        app.innerHTML = endCard(lbl(n), "Misses cleared", "", "The retake is unlocked. It will be a completely new draw from the bank.",
          '<a class="btn pri" href="#/exam/' + n + '">Retake the exam</a><a class="btn" href="#/practice/' + n + '">Practice more first</a>');
      } });
  };

  routes.diagnostic = function () {
    var items = TA.DIAGNOSTIC.slice(), i = 0, res = [];
    session({ kicker: "Trading diagnostic", title: "Where your picture starts", sub: "24 questions across all 12 trading weeks. Later questions cover things you have not been taught yet, so expect to miss them.", total: items.length, back: "#/",
      topicName: function (inst) { return "Trading Week " + inst.w; },
      next: function () { if (i >= items.length) return null; var it = items[i++]; var inst = prep({ type: "mcq", q: it.q, opts: it.opts, ex: it.ex }); inst.w = it.w; return inst; },
      onAnswer: function (inst, ok) { res.push({ w: inst.w, ok: ok }); },
      onEnd: function (right, count) {
        var byPhase = track("t").phases.map(function (ph) {
          var ws = trackWeeks("t").filter(function (x) { return x.phase === ph.id; }).map(function (x) { return x.n; });
          var r = res.filter(function (x) { return ws.indexOf(x.w) >= 0; });
          return { name: ph.name, right: r.filter(function (x) { return x.ok; }).length, n: r.length };
        });
        S.diag = { score: right, n: count, byPhase: byPhase, date: Date.now() }; save();
        routes.diagresult();
      } });
  };
  routes.diagresult = function () {
    if (!S.diag) return go("#/");
    var h = '<div class="focus">' + head("Trading diagnostic", S.diag.score + " of " + S.diag.n + " right") + '<section class="result"><ul class="phasebars">';
    S.diag.byPhase.forEach(function (ph, i) {
      h += '<li><span class="pbn">Phase ' + (i + 1) + ". " + esc(ph.name) + '</span><span class="pbv">' + ph.right + " of " + ph.n + '</span><span class="meter"><i style="width:' + (ph.n ? ph.right / ph.n * 100 : 0) + '%"></i></span></li>';
    });
    h += '</ul><p>Paste this score to Claude so the first lessons can start at the right depth. Nothing is skipped. Every week still needs its 100% exam.</p><div class="row"><a class="btn pri" href="#/">Back to the academy</a><a class="btn" href="#/diagnostic">Retake</a></div></section></div>';
    app.innerHTML = h;
  };

  // ------------------------------------------------------------------ the exam
  function compose(b) {
    var by = {}; b.items.forEach(function (it) { (by[it.topic] = by[it.topic] || []).push(it); });
    var picked = [], used = {};
    R.shuffle(Object.keys(by)).forEach(function (t) { if (picked.length < b.examSize) { var it = R.pick(by[t]); picked.push(it); used[it.id] = 1; } });
    var rest = R.shuffle(b.items.filter(function (it) { return !used[it.id]; }));
    var gens = picked.filter(function (it) { return it.gen; }).length;
    rest.filter(function (it) { return it.gen; }).forEach(function (it) { if (gens < 4 && picked.length < b.examSize) { picked.push(it); used[it.id] = 1; gens++; } });
    rest.forEach(function (it) { if (picked.length < b.examSize && !used[it.id]) { picked.push(it); used[it.id] = 1; } });
    return R.shuffle(picked).map(instance);
  }

  routes.exam = function (p) {
    var n = wid(p), b = bank(n), st = W(n);
    if (!b || !unlocked(n)) return go("#/week/" + n);
    if (st.review && st.review.length) return go("#/review/" + n);
    var qs = compose(b), ans = new Array(qs.length);
    if (/debug/.test(location.search)) window.__exam = qs;
    var h = '<div class="focus exam"><a class="back" href="#/week/' + n + '">Leave without submitting</a>' + head(lbl(n) + " exam", qs.length + " questions. Every one right.", "No feedback until you submit. Work calculations on paper. Numeric answers accept commas.");
    h += qs.map(function (q, i) { return qHTML(q, i, { topic: b.topics[q.topic], label: "Question " + (i + 1) + " of " + qs.length }); }).join("");
    h += '<div class="submitbar"><div class="sbin"><span class="meter"><i id="ansbar" style="width:0%"></i></span><span class="meta" id="answered">0 of ' + qs.length + ' answered</span><button class="btn pri" id="submit" type="button" disabled>Submit exam</button></div></div></div>';
    app.innerHTML = h;
    function upd() {
      var c = ans.filter(function (a) { return a != null && String(a).trim() !== ""; }).length;
      document.getElementById("answered").textContent = c + " of " + qs.length + " answered";
      document.getElementById("ansbar").style.width = (c / qs.length * 100) + "%";
      document.getElementById("submit").disabled = c < qs.length;
    }
    app.querySelectorAll(".q").forEach(function (qe) {
      var i = +qe.getAttribute("data-i");
      qe.querySelectorAll(".opt").forEach(function (b2) {
        b2.addEventListener("click", function () { qe.querySelectorAll(".opt").forEach(function (o) { o.classList.remove("sel"); o.setAttribute("aria-pressed", "false"); }); b2.classList.add("sel"); b2.setAttribute("aria-pressed", "true"); qe.classList.add("answered"); ans[i] = +b2.getAttribute("data-k"); upd(); });
      });
      var inp = qe.querySelector("input"); if (inp) inp.addEventListener("input", function () { ans[i] = inp.value; qe.classList.toggle("answered", !!inp.value.trim()); upd(); });
    });
    document.getElementById("submit").addEventListener("click", function () {
      var res = qs.map(function (q, i) { var ok = grade(q, ans[i]); stat(qkey(n, q.id), ok); return ok; });
      var score = res.filter(Boolean).length, passed = score === qs.length;
      var missed = []; qs.forEach(function (q, i) { if (!res[i]) missed.push(q.id); });
      st.exams.push({ date: Date.now(), score: score, n: qs.length, missed: missed, passed: passed });
      if (passed) { st.passed = true; st.review = null; } else st.review = missed;
      save();
      var o = '<div class="focus">' + head(lbl(n) + " exam", passed ? "Passed" : "Not yet") + '<section class="result ' + (passed ? "pass" : "fail") + '"><p class="score">' + score + "/" + qs.length + "</p>";
      if (passed) {
        var nx = sib(n, 1), nxl = nx ? lbl(nx.id) : "the end of the track";
        o += "<p>" + (tasksDone(n) && gatesDone(n) ? (nx ? nxl + " is unlocked." : "You have finished the track.") : "Finish the remaining tasks on the week page to " + (nx ? "unlock " + nxl : "finish the track") + ".") + '</p><div class="row"><a class="btn pri" href="#/week/' + n + '">Week page</a><a class="btn" href="#/">Academy</a></div>';
      } else {
        o += "<p>You missed " + missed.length + ". Read each explanation below. Then clear those questions again, with fresh numbers, before a new exam draw unlocks.</p><div class=\"row\"><a class=\"btn pri\" href=\"#/review/" + n + '">Clear your misses</a></div>';
      }
      o += "</section>";
      if (!passed) {
        o += '<h2 class="missedh">What you missed</h2>';
        qs.forEach(function (q, i) {
          if (res[i]) return;
          var yours = q.type === "mcq" ? (ans[i] != null ? q.choices[ans[i]].t : "") : ans[i];
          o += '<article class="q missed"><header class="qn"><span class="qnum">Question ' + (i + 1) + '</span><span class="qtopic">' + esc(b.topics[q.topic]) + '</span></header><div class="qt">' + q.q + '</div><dl class="ans"><dt class="no">Your answer</dt><dd>' + esc(yours) + '</dd><dt class="ok">Correct answer</dt><dd>' + esc(rightText(q)) + '</dd></dl><div class="fb"><p>' + q.ex + "</p></div></article>";
        });
      }
      app.innerHTML = o + "</div>"; window.scrollTo(0, 0);
    });
  };

  // ------------------------------------------------------------------ journal math
  function rOf(t) {
    if (t.rOverride !== "" && t.rOverride != null && !isNaN(parseFloat(t.rOverride))) return parseFloat(t.rOverride);
    var e = +t.entry, s = +t.stop, x = +t.exit, risk = Math.abs(e - s);
    if (!risk || isNaN(risk) || isNaN(x)) return NaN;
    return t.dir === "long" ? (x - e) / risk : (e - x) / risk;
  }
  function stats(trs) {
    var rs = trs.map(rOf).filter(function (r) { return !isNaN(r); }), n = rs.length;
    var o = { n: n };
    if (!n) return o;
    var wins = rs.filter(function (r) { return r > 0; }), losses = rs.filter(function (r) { return r < 0; });
    var mean = rs.reduce(function (a, c) { return a + c; }, 0) / n;
    var sd = n > 1 ? Math.sqrt(rs.reduce(function (a, c) { return a + (c - mean) * (c - mean); }, 0) / (n - 1)) : 0;
    var se = n > 1 ? sd / Math.sqrt(n) : 0;
    var cum = 0, peak = 0, dd = 0, streak = 0, worst = 0;
    rs.forEach(function (r) { cum += r; peak = Math.max(peak, cum); dd = Math.max(dd, peak - cum); if (r < 0) { streak++; worst = Math.max(worst, streak); } else streak = 0; });
    var gw = wins.reduce(function (a, c) { return a + c; }, 0), gl = -losses.reduce(function (a, c) { return a + c; }, 0);
    o.mean = mean; o.sd = sd; o.se = se; o.t = se ? mean / se : 0; o.lo = mean - 1.96 * se; o.hi = mean + 1.96 * se;
    o.win = wins.length / n; o.avgW = wins.length ? gw / wins.length : 0; o.avgL = losses.length ? -gl / losses.length : 0;
    o.pf = gl ? gw / gl : (gw ? Infinity : 0); o.total = cum; o.dd = dd; o.streak = worst;
    o.adh = trs.filter(function (t) { return t.followed; }).length / trs.length;
    o.need = mean > 0 && sd ? Math.ceil(Math.pow(2 * sd / mean, 2)) : null;
    return o;
  }
  function sorted() { return S.journal.slice().sort(function (a, b) { return (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")) || a.id - b.id; }); }

  function gatePanel() {
    var G = TA.REAL_MONEY_GATE, trs = sorted().filter(function (t) { return t.mode === G.mode; }), s = stats(trs);
    var weeksDone = trackWeeks("t").filter(function (w) { return completed(w.id); }).length;
    var rows = [
      ["All 12 trading weeks complete", weeksDone + " of 12", weeksDone >= G.minWeeks],
      ["At least " + G.minTrades + " sim trades on your written setup", (s.n || 0) + " of " + G.minTrades, (s.n || 0) >= G.minTrades],
      ["Edge statistically real, with a t statistic of expectancy of at least " + G.minT.toFixed(1), s.n > 1 ? s.t.toFixed(2) : "not enough trades", s.n > 1 && s.t >= G.minT],
      ["Rules followed on at least " + pct(G.minAdherence) + " of sim trades", s.n ? pct(s.adh) : "no trades", s.n && s.adh >= G.minAdherence]
    ];
    var met = rows.filter(function (r) { return r[2]; }).length, all = met === rows.length;
    var h = '<section class="vault' + (all ? " open" : "") + '"><div class="vhead"><span class="vlock">' + LOCK + '</span><div><h2>Real money</h2><p class="vstate">' + (all ? "Unlocked. Start with one micro contract." : "Locked. " + met + " of " + rows.length + " conditions met.") + "</p></div></div>";
    h += '<p class="vnote">In the largest studies of day traders, under 1% were reliably profitable after costs. This gate is how you find out which side of that line you are on, cheaply.</p><ul class="vrows">';
    rows.forEach(function (r) { h += '<li class="' + (r[2] ? "ok" : "") + '"><span class="tick">' + (r[2] ? CHECK : "") + '</span><span class="vl">' + esc(r[0]) + '</span><span class="vv">' + esc(r[1]) + "</span></li>"; });
    h += "</ul>";
    if (s.need) h += '<p class="vnote">At your current sim expectancy of ' + f2(s.mean) + "R per trade, roughly " + s.need + " trades are needed before luck stops being a good explanation.</p>";
    return h + "</section>";
  }

  // ------------------------------------------------------------------ journal page
  var jFilter = "all";
  routes.journal = function () {
    var all = sorted(), set = S.settings, td = today();
    var todays = all.filter(function (t) { return t.date === td && (t.mode === "sim" || t.mode === "live"); });
    var todayR = todays.map(rOf).filter(function (r) { return !isNaN(r); }).reduce(function (a, c) { return a + c; }, 0);
    var stop = todays.length >= set.maxTrades || todayR <= -set.dailyLossR;
    var h = head("Journal", "Every trade, measured", "Log backtest, replay, sim and live trades separately. Results are in R, the amount you risked, so a trade risking 2 points that makes 4 is +2R.");
    // today's desk strip
    var segs = ""; for (var i = 0; i < set.maxTrades; i++) segs += '<i class="' + (i < todays.length ? "used" : "") + '"></i>';
    var lossFrac = Math.min(1, Math.max(0, -todayR) / set.dailyLossR);
    h += '<section class="desk' + (stop ? " stop" : "") + '"><div class="dhead"><h2>' + (stop ? "Done for today. Your rules say stop." : "Today") + '</h2><p class="meta">' + todays.length + " of " + set.maxTrades + " sim and live trades used. Net " + f2(todayR) + "R against a daily loss limit of −" + set.dailyLossR + 'R.</p></div><div class="dgrid">' +
      '<div class="dcell"><span class="dk">Trades used</span><span class="dv">' + todays.length + "<small>/" + set.maxTrades + '</small></span><span class="segs">' + segs + "</span></div>" +
      '<div class="dcell"><span class="dk">Net today</span><span class="dv ' + (todayR > 0 ? "pos" : todayR < 0 ? "neg" : "") + '">' + f2(todayR) + '<small>R</small></span><span class="lossbar" title="Share of the daily loss limit used"><i style="width:' + (lossFrac * 100) + '%"></i></span><span class="dfoot">' + Math.round(lossFrac * 100) + "% of the −" + set.dailyLossR + "R limit used</span></div></div></section>";
    // form
    h += '<section class="logform"><h2>Log a trade</h2><div class="grid">' +
      fld("Date", '<input type="date" id="j_date" value="' + td + '">') +
      fld("Mode", sel("j_mode", [["sim", "Sim"], ["replay", "Replay"], ["backtest", "Backtest"], ["live", "Live"]])) +
      fld("Instrument", sel("j_inst", [["MES", "MES"], ["MNQ", "MNQ"], ["ES", "ES"], ["NQ", "NQ"], ["other", "Other"]])) +
      fld("Direction", sel("j_dir", [["long", "Long"], ["short", "Short"]])) +
      fld("Entry", '<input id="j_entry" inputmode="decimal">') + fld("Stop", '<input id="j_stop" inputmode="decimal">') + fld("Exit", '<input id="j_exit" inputmode="decimal">') +
      fld("Contracts", '<input id="j_qty" inputmode="numeric" value="1">') +
      fld("Setup name", '<input id="j_setup" list="setups" placeholder="e.g. NY open sweep">', "wide2") +
      fld("Rules followed?", sel("j_fol", [["1", "Yes, every rule"], ["0", "No, I broke one"]]), "wide2") +
      fld("R override (optional)", '<input id="j_rov" inputmode="decimal" placeholder="for backtest imports">', "wide2") +
      '<div class="field wide2"><label for="j_notes">Notes</label><input id="j_notes" placeholder="What did you see, what did you feel"></div></div>' +
      '<datalist id="setups">' + uniq(all.map(function (t) { return t.setup; })).map(function (s) { return '<option value="' + esc(s) + '">'; }).join("") + "</datalist>" +
      '<div class="row formfoot"><button class="btn pri" id="j_add" type="button">Add trade</button><span class="rprev" id="j_prev"></span></div></section>';
    // stats
    var modes = [["all", "All"], ["backtest", "Backtest"], ["replay", "Replay"], ["sim", "Sim"], ["live", "Live"]];
    var fl = jFilter === "all" ? all : all.filter(function (t) { return t.mode === jFilter; }), s = stats(fl);
    h += '<section class="statsec"><div class="sechead"><h2>Statistics</h2><div class="seg" id="j_seg" role="group" aria-label="Filter by mode">' + modes.map(function (m) { return '<button type="button" data-m="' + m[0] + '" class="' + (jFilter === m[0] ? "on" : "") + '" aria-pressed="' + (jFilter === m[0]) + '">' + m[1] + "</button>"; }).join("") + "</div></div>";
    if (!s.n) h += '<p class="empty">No trades here yet. Log one above and the numbers appear here.</p>';
    else {
      var sc = function (k, v, sign, big) { return '<div class="stat' + (big ? " big" : "") + '"><div class="k">' + k + '</div><div class="v' + (sign != null ? (sign > 0 ? " pos" : sign < 0 ? " neg" : "") : "") + '">' + v + "</div></div>"; };
      h += '<div class="stats primary">' + sc("Expectancy per trade", f2(s.mean) + "R", s.mean, 1) + sc("t statistic", s.n > 1 ? s.t.toFixed(2) : "n/a", null, 1) + sc("Trades", s.n, null, 1) + "</div>";
      h += '<p class="jverdict">' + verdict(s) + "</p>";
      h += '<div class="stats">' + [
        sc("Win rate", pct(s.win)), sc("Total", f2(s.total) + "R", s.total), sc("Avg win", f2(s.avgW) + "R"), sc("Avg loss", f2(s.avgL) + "R"),
        sc("Profit factor", s.pf === Infinity ? "∞" : s.pf.toFixed(2)), sc("Max drawdown", "−" + s.dd.toFixed(2) + "R"), sc("Worst losing streak", s.streak), sc("Rules followed", pct(s.adh)),
        sc("95% range of expectancy", s.n > 1 ? f2(s.lo) + " to " + f2(s.hi) : "n/a")
      ].join("") + "</div>";
      h += curve(fl);
      var bySetup = {}; fl.forEach(function (t) { (bySetup[t.setup || "unnamed"] = bySetup[t.setup || "unnamed"] || []).push(t); });
      h += '<h3>By setup</h3><div class="scroll"><table class="tbl"><thead><tr><th>Setup</th><th class="n">Trades</th><th class="n">Win rate</th><th class="n">Expectancy</th><th class="n">t</th></tr></thead><tbody>' +
        Object.keys(bySetup).map(function (k) { var ss = stats(bySetup[k]); return "<tr><td>" + esc(k) + '</td><td class="n">' + ss.n + '</td><td class="n">' + (ss.n ? pct(ss.win) : "") + '</td><td class="n r ' + (ss.mean > 0 ? "pos" : ss.mean < 0 ? "neg" : "") + '">' + (ss.n ? f2(ss.mean) + "R" : "") + '</td><td class="n">' + (ss.n > 1 ? ss.t.toFixed(2) : "") + "</td></tr>"; }).join("") + "</tbody></table></div>";
    }
    h += "</section>";
    // table
    h += '<section class="tradesec"><h2>Trades</h2>';
    if (all.length) {
      h += '<div class="scroll"><table class="tbl"><thead><tr><th>Date</th><th>Mode</th><th>Inst</th><th>Setup</th><th>Dir</th><th class="n">R</th><th>Rules</th><th>Notes</th><th></th></tr></thead><tbody>' +
        all.slice().reverse().map(function (t) { var r = rOf(t); return "<tr><td>" + esc(t.date) + '</td><td><span class="mode m-' + esc(t.mode) + '">' + esc(t.mode) + "</span></td><td>" + esc(t.inst) + "</td><td>" + esc(t.setup) + "</td><td>" + esc(t.dir) + '</td><td class="n r ' + (r > 0 ? "pos" : r < 0 ? "neg" : "") + '">' + (isNaN(r) ? "?" : f2(r)) + "</td><td>" + (t.followed ? "yes" : '<span class="neg">no</span>') + '</td><td class="notes">' + esc(t.notes || "") + '</td><td><button class="btn sm" type="button" data-del="' + t.id + '" aria-label="Delete trade">Delete</button></td></tr>'; }).join("") + "</tbody></table></div>";
    } else h += '<p class="empty">Nothing logged yet.</p>';
    h += '<div class="row csvrow"><button class="btn sm" id="j_csv" type="button">Export CSV</button><label class="btn sm">Import CSV<input type="file" id="j_imp" accept=".csv,text/csv" hidden></label></div><p class="meta">CSV columns are date, mode, inst, setup, dir, entry, stop, exit, qty, r, followed and notes. Use the r column for backtest results already measured in R.</p></section>';
    app.innerHTML = h;

    function v(id) { return document.getElementById(id).value.trim(); }
    function readForm() { return { date: v("j_date"), mode: v("j_mode"), inst: v("j_inst"), dir: v("j_dir"), entry: v("j_entry"), stop: v("j_stop"), exit: v("j_exit"), qty: v("j_qty"), setup: v("j_setup"), followed: v("j_fol") === "1", rOverride: v("j_rov"), notes: v("j_notes") }; }
    function prev() {
      var r = rOf(readForm()), el = document.getElementById("j_prev");
      el.className = "rprev" + (isNaN(r) ? "" : r > 0 ? " pos" : r < 0 ? " neg" : "");
      el.textContent = isNaN(r) ? "Enter entry, stop and exit to see R." : "This trade is " + f2(r) + "R.";
    }
    ["j_entry", "j_stop", "j_exit", "j_rov", "j_dir"].forEach(function (id) { document.getElementById(id).addEventListener("input", prev); document.getElementById(id).addEventListener("change", prev); });
    prev();
    document.getElementById("j_add").addEventListener("click", function () {
      var t = readForm(); if (isNaN(rOf(t))) { toast("Need entry, stop and exit, or an R override."); return; }
      if (!t.date) { toast("Need a date."); return; }
      t.id = Date.now(); S.journal.push(t); save(); toast("Logged " + f2(rOf(t)) + "R"); routes.journal();
    });
    document.getElementById("j_seg").addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) { jFilter = b.getAttribute("data-m"); routes.journal(); } });
    app.querySelectorAll("[data-del]").forEach(function (b) {
      var armed = false;
      b.addEventListener("click", function () {
        if (!armed) { armed = true; b.textContent = "Sure?"; b.classList.add("danger"); setTimeout(function () { armed = false; b.textContent = "Delete"; b.classList.remove("danger"); }, 3000); return; }
        var id = +b.getAttribute("data-del"); S.journal = S.journal.filter(function (t) { return t.id !== id; }); S.deleted = (S.deleted || []).concat([id]); save(); routes.journal();
      });
    });
    document.getElementById("j_csv").addEventListener("click", function () {
      var cols = ["date", "mode", "inst", "setup", "dir", "entry", "stop", "exit", "qty", "r", "followed", "notes"];
      var lines = [cols.join(",")].concat(sorted().map(function (t) {
        var row = { date: t.date, mode: t.mode, inst: t.inst, setup: t.setup, dir: t.dir, entry: t.entry, stop: t.stop, exit: t.exit, qty: t.qty, r: isNaN(rOf(t)) ? "" : rOf(t).toFixed(4), followed: t.followed ? "yes" : "no", notes: t.notes };
        return cols.map(function (c) { var x = String(row[c] == null ? "" : row[c]); return /[",\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x; }).join(",");
      }));
      download("journal.csv", lines.join("\n"), "text/csv");
    });
    document.getElementById("j_imp").addEventListener("change", function (e) {
      var f = e.target.files[0]; if (!f) return;
      f.text().then(function (txt) {
        var rows = parseCSV(txt); if (rows.length < 2) { toast("No rows found."); return; }
        var hd = rows[0].map(function (x) { return x.trim().toLowerCase(); }), added = 0, base = Date.now();
        rows.slice(1).forEach(function (r, i) {
          if (r.length < 2) return;
          var g = function (k) { var j = hd.indexOf(k); return j >= 0 ? (r[j] || "").trim() : ""; };
          var t = { id: base + i, date: g("date") || today(), mode: (g("mode") || "backtest").toLowerCase(), inst: g("inst") || g("instrument") || "", setup: g("setup"), dir: (g("dir") || g("direction") || "long").toLowerCase(), entry: g("entry"), stop: g("stop"), exit: g("exit"), qty: g("qty") || "1", rOverride: g("r"), followed: !/^(no|0|false)$/i.test(g("followed") || "yes"), notes: g("notes") };
          if (!isNaN(rOf(t))) { S.journal.push(t); added++; }
        });
        save(); toast("Imported " + added + " trades."); routes.journal();
      });
    });
  };
  var fid = 0;
  function fld(l, inner, cls) {
    var m = inner.match(/id="([^"]+)"/), id = m ? m[1] : "f" + (fid++);
    return '<div class="field' + (cls ? " " + cls : "") + '"><label for="' + id + '">' + l + "</label>" + inner + "</div>";
  }
  function sel(id, opts) { return '<select id="' + id + '">' + opts.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + "</option>"; }).join("") + "</select>"; }
  function uniq(a) { var o = []; a.forEach(function (x) { if (x && o.indexOf(x) < 0) o.push(x); }); return o; }
  function verdict(s) {
    if (s.n < 30) return "Fewer than 30 trades. Any number here is mostly noise. Keep logging.";
    if (s.mean <= 0) return "Expectancy is zero or negative. As it stands this loses money, and more trades will not fix that by themselves.";
    if (s.t < 2) return "Positive so far, but a t statistic below 2 means luck explains it easily. Roughly " + s.need + " trades at this edge would settle it.";
    return "Positive expectancy with t above 2. That is evidence of an edge in this sample. It still has to hold on new data, in real time, after costs.";
  }
  function curve(trs) {
    var rs = trs.map(rOf).filter(function (r) { return !isNaN(r); }); if (rs.length < 2) return "";
    var pts = [0], c = 0; rs.forEach(function (r) { c += r; pts.push(c); });
    var Wd = 640, Ht = 220, pad = 40, mn = Math.min.apply(null, pts), mx = Math.max.apply(null, pts); if (mx === mn) { mx += 1; mn -= 1; }
    var X = function (i) { return pad + i / (pts.length - 1) * (Wd - pad - 12); }, Y = function (v) { return 14 + (mx - v) / (mx - mn) * (Ht - 46); };
    var d = pts.map(function (v, i) { return (i ? "L" : "M") + X(i).toFixed(1) + "," + Y(v).toFixed(1); }).join(" ");
    var area = d + " L" + X(pts.length - 1).toFixed(1) + "," + Y(0).toFixed(1) + " L" + X(0).toFixed(1) + "," + Y(0).toFixed(1) + " Z";
    var dots = pts.slice(1).map(function (v, i) { return '<circle cx="' + X(i + 1).toFixed(1) + '" cy="' + Y(v).toFixed(1) + '" r="3" class="' + (rs[i] > 0 ? "up" : rs[i] < 0 ? "dn" : "") + '"/>'; }).join("");
    return '<h3>Equity curve, in R</h3><figure class="eqf"><svg class="eq" viewBox="0 0 ' + Wd + " " + Ht + '" role="img" aria-label="Cumulative R over trades">' +
      '<line class="ax" x1="' + pad + '" y1="' + (Ht - 30) + '" x2="' + (Wd - 12) + '" y2="' + (Ht - 30) + '"/>' +
      '<line class="z" x1="' + pad + '" y1="' + Y(0) + '" x2="' + (Wd - 12) + '" y2="' + Y(0) + '"/>' +
      '<path class="area" d="' + area + '"/><path class="ln" d="' + d + '"/>' + (pts.length <= 80 ? dots : "") +
      '<text x="' + (pad - 8) + '" y="' + (Y(mx) + 4) + '" text-anchor="end">' + mx.toFixed(1) + '</text><text x="' + (pad - 8) + '" y="' + (Y(mn) + 4) + '" text-anchor="end">' + mn.toFixed(1) + '</text><text x="' + (pad - 8) + '" y="' + (Y(0) + 4) + '" text-anchor="end">0</text>' +
      '<text x="' + X(pts.length - 1) + '" y="' + (Ht - 10) + '" text-anchor="end">trade ' + (pts.length - 1) + "</text></svg><figcaption>Each dot is one trade. The dashed line is where you started.</figcaption></figure>";
  }
  function parseCSV(txt) {
    var rows = [], row = [], f = "", q = false;
    for (var i = 0; i < txt.length; i++) {
      var ch = txt[i];
      if (q) { if (ch === '"') { if (txt[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; }
      else if (ch === '"') q = true; else if (ch === ",") { row.push(f); f = ""; } else if (ch === "\n" || ch === "\r") { if (ch === "\r" && txt[i + 1] === "\n") i++; row.push(f); rows.push(row); row = []; f = ""; } else f += ch;
    }
    if (f || row.length) { row.push(f); rows.push(row); }
    return rows.filter(function (r) { return r.join("").trim(); });
  }
  function download(name, text, type) {
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: type })); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  // ------------------------------------------------------------------ settings
  routes.settings = function () {
    var set = S.settings;
    var h = head("Settings", "Sync, rules and backups");
    if (Sync.on()) {
      h += '<section class="panel sync"><h2>Cloud sync is on</h2><p class="meta" id="syncstat">' + esc(Sync.footer()) + '</p><p>To use the academy on another device, open it there, go to Settings, and paste this code under Link this device. Keep it private, anyone with it can see and change your progress.</p><p class="code" id="s_code">' + esc(Sync.code()) + '</p><div class="row"><button class="btn" id="s_copy" type="button">Copy the code</button><button class="btn" id="s_now" type="button">Sync now</button><button class="btn ghost" id="s_off" type="button">Turn off on this device</button></div></section>';
    } else {
      h += '<section class="panel sync"><h2>Cloud sync</h2><p class="meta">Right now your progress lives only in this browser. Turn on sync to keep it safe and use it on your laptop and your iPad.</p><div class="row"><button class="btn pri" id="s_on" type="button">Turn on cloud sync</button></div><h3>Link this device</h3><p class="meta">Already turned it on somewhere else? Paste that sync code here. Progress from both places is combined.</p><div class="row"><input id="s_link" class="codein" placeholder="ta-xxxxx-xxxxx-xxxxx-xxxxx" autocomplete="off" autocapitalize="off" spellcheck="false"><button class="btn" id="s_linkbtn" type="button">Link</button></div></section>';
    }
    h += '<section class="panel"><h2>Daily trading limits</h2><p class="meta">Set these before you trade, never during. The journal tells you to stop when you hit either one.</p><div class="grid">' +
      fld("Daily loss limit, in R", '<input id="s_loss" inputmode="decimal" value="' + set.dailyLossR + '">') + fld("Max trades per day", '<input id="s_max" inputmode="numeric" value="' + set.maxTrades + '">') +
      '</div><div class="row"><button class="btn pri" id="s_save" type="button">Save limits</button></div></section>';
    h += '<section class="panel"><h2>Backup file</h2><p class="meta">A file copy of everything, as a second safety net. Import it on any device to restore.</p><div class="row"><button class="btn" id="s_exp" type="button">Export backup</button><label class="btn">Import backup<input type="file" id="s_imp" accept=".json,application/json" hidden></label></div></section>';
    h += '<section class="panel danger"><h2>Start over</h2><p class="meta">Erases all progress, exams and journal trades in this browser and turns sync off here. The cloud copy is kept. Export first.</p><button class="btn danger" id="s_reset" type="button">Erase everything</button></section>';
    app.innerHTML = h;
    function el(id) { return document.getElementById(id); }
    if (el("s_on")) el("s_on").addEventListener("click", function () { el("s_on").disabled = true; Sync.enable().then(function () { toast("Cloud sync is on."); routes.settings(); }); });
    if (el("s_linkbtn")) el("s_linkbtn").addEventListener("click", function () {
      el("s_linkbtn").disabled = true;
      Sync.link(el("s_link").value).then(function () { toast("Linked. Your progress is combined."); routes.settings(); }, function (e) { el("s_linkbtn").disabled = false; toast(e.message || "Could not link."); });
    });
    if (el("s_copy")) el("s_copy").addEventListener("click", function () { (navigator.clipboard ? navigator.clipboard.writeText(Sync.code()) : Promise.reject()).then(function () { toast("Code copied."); }, function () { toast("Select the code and copy it by hand."); }); });
    if (el("s_now")) el("s_now").addEventListener("click", function () { Sync.now().then(function () { toast("Synced."); routes.settings(); }); });
    if (el("s_off")) el("s_off").addEventListener("click", function () { Sync.off(); toast("Sync is off on this device. Your progress stays here."); routes.settings(); });
    document.getElementById("s_save").addEventListener("click", function () {
      var l = parseFloat(document.getElementById("s_loss").value), m = parseInt(document.getElementById("s_max").value, 10);
      if (!(l > 0) || !(m > 0)) { toast("Both limits must be positive."); return; }
      set.dailyLossR = l; set.maxTrades = m; save(); toast("Limits saved.");
    });
    document.getElementById("s_exp").addEventListener("click", function () { download("trading-academy-backup-" + today() + ".json", JSON.stringify(S, null, 1), "application/json"); });
    document.getElementById("s_imp").addEventListener("change", function (e) {
      var f = e.target.files[0]; if (!f) return;
      f.text().then(function (txt) { try { var o = JSON.parse(txt); if (o.v !== 1) throw 0; S = migrate(o); save(); toast("Backup restored."); go("#/"); } catch (er) { toast("That file is not an academy backup."); } });
    });
    var armed = false, rb = document.getElementById("s_reset");
    rb.addEventListener("click", function () {
      if (!armed) { armed = true; rb.textContent = "Press again to erase everything"; setTimeout(function () { armed = false; rb.textContent = "Erase everything"; }, 4000); return; }
      Sync.off(); S = migrate(fresh()); save(); toast("Erased. Cloud sync is off on this device."); go("#/");
    });
  };

  // Pull from the cloud before the first render, but never wait more than four seconds.
  var SAFE = ["home", "week", "journal", "settings", "diagresult"];
  function safeRoute() { return SAFE.indexOf((location.hash.replace(/^#\/?/, "") || "home").split("/")[0]) >= 0; }
  if (Sync.on()) {
    app.innerHTML = '<p class="loading">Syncing your progress.</p>';
    var rendered = false;
    var t0 = setTimeout(function () { if (!rendered) { rendered = true; nav(); } }, 4000);
    Sync.now().then(function (changed) {
      clearTimeout(t0);
      if (!rendered) { rendered = true; nav(); } else if (changed && safeRoute()) nav();
    });
  } else nav();
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible" && Sync.on() && safeRoute()) Sync.now().then(function (ch) { if (ch && safeRoute()) nav(); });
  });
})();
