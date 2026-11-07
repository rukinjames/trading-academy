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
  function load() {
    try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 1) return s; } catch (e) {}
    return fresh();
  }
  var S = load();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); }
    catch (e) { toast("Could not save in this browser. Export a backup from Settings."); }
  }
  function W(n) {
    if (!S.weeks[n]) S.weeks[n] = { tasks: {}, teach: "", exams: [], review: null, passed: false, pretest: null };
    return S.weeks[n];
  }
  function week(n) { return TA.WEEKS.filter(function (w) { return w.n === n; })[0]; }
  function bank(n) { return TA.BANKS && TA.BANKS[n]; }

  // ------------------------------------------------------------------ helpers
  var R = {
    int: function (a, b) { return a + Math.floor(Math.random() * (b - a + 1)); },
    pick: function (a) { return a[Math.floor(Math.random() * a.length)]; },
    shuffle: function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function toast(msg) {
    var t = document.createElement("div"); t.className = "toast"; t.textContent = msg; document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  }
  function today() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function f2(x) { return (x >= 0 ? "+" : "−") + Math.abs(x).toFixed(2); }
  function pct(x) { return Math.round(x * 100) + "%"; }

  // ------------------------------------------------------------------ progress logic
  function tasksDone(n) {
    var w = week(n); if (!w.tasks) return false;
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
  function unlocked(n) { return n === 1 || completed(n - 1); }
  function currentWeek() { for (var n = 1; n <= 12; n++) if (!completed(n)) return n; return 12; }

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
    return String(inst.answer);
  }
  function stat(id, ok) {
    var s = S.qstats[id] || (S.qstats[id] = { seen: 0, miss: 0 });
    s.seen++; if (!ok) s.miss++;
  }
  function qHTML(inst, i, opts) {
    opts = opts || {};
    var h = '<div class="q" data-i="' + i + '"><p class="qn"><span>' + (opts.label || ("Question " + (i + 1))) + "</span>" + (opts.topic ? "<span>" + esc(opts.topic) + "</span>" : "") + "</p>";
    h += '<div class="qt">' + inst.q + "</div>";
    if (inst.type === "mcq") {
      h += '<div class="opts">' + inst.choices.map(function (c, k) { return '<button type="button" class="opt" data-k="' + k + '">' + esc(c.t) + "</button>"; }).join("") + "</div>";
    } else {
      h += '<div class="num"><input type="text" inputmode="decimal" autocomplete="off" placeholder="your answer" aria-label="Your answer"></div>';
    }
    return h + '<div class="fbx"></div></div>';
  }

  // ------------------------------------------------------------------ router
  var routes = {};
  function go(h) { location.hash = h; }
  function nav() {
    var h = location.hash.replace(/^#\/?/, "") || "home";
    var parts = h.split("/");
    document.querySelectorAll(".nav a").forEach(function (a) { a.classList.toggle("on", a.getAttribute("data-r") === parts[0]); });
    var fn = routes[parts[0]] || routes.home;
    window.scrollTo(0, 0);
    fn(parts.slice(1));
  }
  window.addEventListener("hashchange", nav);

  // ------------------------------------------------------------------ home
  routes.home = function () {
    var cur = currentWeek(), w = week(cur), st = W(cur);
    var h = '<p class="kicker">Week ' + cur + " of 12 · " + esc(TA.PHASES[w.phase - 1].name) + "</p>";
    h += "<h1>" + esc(w.title) + "</h1><p class=\"lede\">" + esc(w.topic) + ".</p>";
    h += '<div class="card hero">' + nextAction(cur) + "</div>";
    if (!S.diag) {
      h += '<div class="card"><h3>Take the entrance diagnostic</h3><p class="muted">24 questions across all 12 weeks. It does not let you skip anything, every week still needs its 100% exam. It shows where your picture of trading starts, so the lessons can start there too. Guess freely and be honest about it.</p><a class="btn" href="#/diagnostic">Start the diagnostic</a></div>';
    }
    h += "<h2>The roadmap</h2>";
    TA.PHASES.forEach(function (p) {
      h += '<div class="phase"><h3>Phase ' + p.id + ". " + esc(p.name) + "</h3><p>" + esc(p.blurb) + "</p></div>";
      TA.WEEKS.filter(function (x) { return x.phase === p.id; }).forEach(function (x) {
        var done = completed(x.n), un = unlocked(x.n), isCur = x.n === cur;
        var pill = done ? '<span class="pill done">Done</span>' : !un ? '<span class="pill lock">Locked</span>' : !x.lesson ? '<span class="pill cur">Not built yet</span>' : '<span class="pill cur">In progress</span>';
        h += '<a class="wk' + (un ? "" : " locked") + (isCur ? " current" : "") + '" href="#/week/' + x.n + '"><span class="num">' + x.n + '</span><span><span class="t">' + esc(x.title) + '</span><br><span class="s">' + esc(x.topic) + "</span></span>" + pill + "</a>";
      });
    });
    h += "<h2>The real money gate</h2>" + gatePanel();
    h += '<p class="foot">Progress is saved in this browser only. Back it up from Settings, especially before switching devices.</p>';
    app.innerHTML = h;
  };

  function nextAction(n) {
    var w = week(n), st = W(n);
    var line = function (title, body, btn) { return "<h3 style=\"margin-top:0\">" + title + '</h3><p class="muted">' + body + "</p>" + (btn || ""); };
    if (!w.lesson || !bank(n)) {
      return line("Week " + n + " is ready to be built", "You passed everything before it. Tell Claude <b>Build Week " + n + " of the trading academy</b>. It will be written around what you got wrong so far.", '<a class="btn" href="#/week/' + n + '">See what Week ' + n + " covers</a>");
    }
    if (!st.pretest) return line("Step 1. Find your floor", "Five questions before you read anything. Wrong answers are expected and useful.", '<a class="btn pri" href="#/pretest/' + n + '">Start 5 questions</a>');
    if (!st.tasks.read) return line("Step 2. Read the lesson", "Read every chapter and answer every green box. Then tick it off on the week page.", '<div class="row"><a class="btn pri" href="' + w.lesson + '">Open the lesson</a><a class="btn" href="#/week/' + n + '">Week page</a></div>');
    if (!tasksDone(n)) return line("Step 3. Finish this week's tasks", "Practice as much as you like while you work through them.", '<div class="row"><a class="btn pri" href="#/week/' + n + '">Open the tasks</a><a class="btn" href="#/practice/' + n + '">Practice questions</a></div>');
    if (st.review && st.review.length) return line("Clear your misses before retaking", st.review.length + " question" + (st.review.length > 1 ? "s" : "") + " from your last attempt, with fresh numbers.", '<a class="btn pri" href="#/review/' + n + '">Clear misses</a>');
    if (!st.passed) return line("Step 4. The Week " + n + " exam", bank(n).examSize + " questions drawn at random. You need every one right to unlock Week " + (n + 1) + ".", '<div class="row"><a class="btn pri" href="#/exam/' + n + '">Take the exam</a><a class="btn" href="#/practice/' + n + '">Practice first</a></div>');
    if (!gatesDone(n)) return line("Finish the journal requirements", "This week also needs logged trades. See the week page.", '<a class="btn pri" href="#/week/' + n + '">Week page</a>');
    return line("Week " + n + " complete", "Everything is done.", "");
  }

  // ------------------------------------------------------------------ week page
  routes.week = function (p) {
    var n = parseInt(p[0], 10) || 1, w = week(n); if (!w) return go("#/");
    var st = W(n), un = unlocked(n), b = bank(n);
    var h = '<p class="kicker">Week ' + n + " · " + esc(TA.PHASES[w.phase - 1].name) + "</p><h1>" + esc(w.title) + '</h1><p class="lede">' + esc(w.topic) + ".</p>";
    if (!un) h += '<div class="card warn"><b>Locked.</b> <span class="muted">Finish Week ' + (n - 1) + " first. Its exam needs 100%.</span></div>";
    h += '<div class="card"><h3 style="margin-top:0">By the end of this week you can</h3><ul>' + w.objectives.map(function (o) { return "<li>" + esc(o) + "</li>"; }).join("") + "</ul></div>";
    if (!w.lesson || !b) {
      h += '<div class="card"><h3 style="margin-top:0">Not built yet</h3><p class="muted">Each week is written when you reach it, aimed at your mistakes so far. When Week ' + (n - 1) + ' is done, tell Claude <b>Build Week ' + n + " of the trading academy</b>.</p></div>";
      app.innerHTML = h; return;
    }
    if (!un) { app.innerHTML = h; return; }
    // unlock checklist
    var reqs = [["Exam passed at 100%", st.passed], ["All tasks done", tasksDone(n)]];
    (w.gates || []).forEach(function (g) { var gs = gateStatus(g); reqs.push([g.label + " (" + gs.val + ")", gs.ok]); });
    h += '<div class="card"><h3 style="margin-top:0">To unlock Week ' + (n + 1) + '</h3><ul class="checks">' + reqs.map(function (r) { return '<li><span class="tick' + (r[1] ? " on" : "") + '">' + (r[1] ? "✓" : "") + "</span>" + esc(r[0]) + "</li>"; }).join("") + "</ul></div>";
    h += '<div class="card">';
    // step 1
    h += '<div class="step"><span class="sn">1</span><div><h3>Find your floor</h3><p class="muted small">Five questions before the lesson, so you know what is new. Not graded.</p>' +
      (st.pretest ? '<p class="small">Done. You got ' + st.pretest.score + " of " + st.pretest.n + '.</p><a class="btn sm" href="#/pretest/' + n + '">Do it again</a>' : '<a class="btn pri" href="#/pretest/' + n + '">Start</a>') + "</div></div>";
    // step 2
    h += '<div class="step"><span class="sn">2</span><div><h3>The lesson</h3><p class="muted small">The full story, with every interactive. Answer every green box.</p><a class="btn pri" href="' + w.lesson + '">Open the Week ' + n + " lesson</a></div></div>";
    // step 3
    h += '<div class="step"><span class="sn">3</span><div><h3>Practice</h3><p class="muted small">Unlimited questions from the exam bank, with explanations. Questions you miss come back more often. Calculation questions get new numbers every time.</p><a class="btn" href="#/practice/' + n + '">Practice</a></div></div>';
    // step 4 tasks
    h += '<div class="step"><span class="sn">4</span><div><h3>Tasks</h3><div class="tasks">';
    w.tasks.forEach(function (t) {
      h += '<div class="task"><input type="checkbox" data-task="' + t.id + '"' + (st.tasks[t.id] ? " checked" : "") + ' aria-label="Done"><div class="tt">' + esc(t.text) +
        (t.link ? ' <a href="' + t.link + '"' + (/^https?:/.test(t.link) ? ' target="_blank" rel="noopener"' : "") + ">" + esc(t.linkText || "Open") + "</a>" : "") +
        (t.teach ? '<textarea id="teach" placeholder="Explain it here, in your own words.">' + esc(st.teach) + '</textarea><div class="row" style="margin-top:.5rem"><button class="btn sm" id="copyTeach" type="button">Copy it to paste to Claude</button><span class="muted small" id="wc"></span></div>' : "") +
        "</div></div>";
    });
    h += "</div></div></div>";
    // step 5 exam
    var last = st.exams[st.exams.length - 1];
    h += '<div class="step"><span class="sn">5</span><div><h3>The exam</h3><p class="muted small">' + b.examSize + " questions, drawn at random from the bank, one from every topic. 100% to pass. After a miss you clear those questions again with fresh numbers, then retake a brand new draw.</p>";
    if (st.passed) h += '<p><span class="pill done">Passed</span></p>';
    else if (st.review && st.review.length) h += '<a class="btn pri" href="#/review/' + n + '">Clear your ' + st.review.length + " miss" + (st.review.length > 1 ? "es" : "") + " first</a>";
    else h += '<a class="btn pri" href="#/exam/' + n + '">' + (st.exams.length ? "Retake the exam" : "Take the exam") + "</a>";
    if (st.exams.length) h += '<p class="small muted" style="margin-top:.8rem">Attempts. ' + st.exams.map(function (e) { return e.score + "/" + e.n; }).join(", ") + (last ? ". Last on " + new Date(last.date).toLocaleDateString() : "") + ".</p>";
    h += "</div></div></div>";
    app.innerHTML = h;
    app.querySelectorAll("[data-task]").forEach(function (cb) {
      cb.addEventListener("change", function () { st.tasks[cb.getAttribute("data-task")] = cb.checked; save(); });
    });
    var ta = document.getElementById("teach");
    if (ta) {
      var wc = function () { var n2 = (ta.value.trim().match(/\S+/g) || []).length; document.getElementById("wc").textContent = n2 + " words"; };
      ta.addEventListener("input", function () { st.teach = ta.value; save(); wc(); }); wc();
      document.getElementById("copyTeach").addEventListener("click", function () {
        var txt = "Grade my Week " + n + " teach-back for the trading academy. Be strict, tell me what is right, wrong and missing.\n\n" + ta.value;
        (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { toast("Copied. Paste it to Claude."); }, function () { ta.select(); toast("Select all and copy it manually."); });
      });
    }
  };

  // ------------------------------------------------------------------ one at a time sessions (pretest, practice, review, diagnostic)
  function session(cfg) {
    // cfg: {title, sub, next(): instance or null, onAnswer(inst, ok), onEnd(), total (optional), back}
    var count = 0, right = 0, inst = null;
    function show() {
      inst = cfg.next();
      if (!inst) { cfg.onEnd(right, count); return; }
      count++;
      var h = '<p class="kicker">' + cfg.kicker + "</p><h1>" + cfg.title + "</h1>" + (cfg.sub ? '<p class="lede">' + cfg.sub + "</p>" : "");
      if (cfg.total) h += '<div class="bar" aria-hidden="true"><i style="width:' + ((count - 1) / cfg.total * 100) + '%"></i></div>';
      h += qHTML(inst, count - 1, { label: cfg.total ? "Question " + count + " of " + cfg.total : "Question " + count + (count > 1 ? " · " + right + " right so far" : ""), topic: cfg.topicName ? cfg.topicName(inst) : "" });
      h += '<div class="row"><button class="btn pri" id="nextq" type="button" hidden>Next</button>' + (cfg.back ? '<a class="btn" href="' + cfg.back + '">Stop</a>' : "") + "</div>";
      app.innerHTML = h;
      var q = app.querySelector(".q"), fbx = q.querySelector(".fbx"), nxt = document.getElementById("nextq");
      function done(ok, chosen) {
        if (ok) right++;
        cfg.onAnswer && cfg.onAnswer(inst, ok, chosen); save();
        fbx.innerHTML = '<p class="fb"><b class="' + (ok ? "ok" : "no") + '">' + (ok ? "Right." : "Not quite.") + "</b> " + (ok || inst.type === "mcq" ? "" : "The answer is " + esc(rightText(inst)) + ". ") + inst.ex + "</p>";
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

  routes.pretest = function (p) {
    var n = parseInt(p[0], 10) || 1, b = bank(n); if (!b || !unlocked(n)) return go("#/week/" + n);
    var items = R.shuffle(b.items).slice(0, 5), i = 0;
    session({ kicker: "Week " + n + " · Find your floor", title: "Five questions before the lesson", sub: "Answer from what you know now. Guessing is fine. This is not graded.", total: 5, back: "#/week/" + n,
      topicName: function (inst) { return b.topics[inst.topic]; },
      next: function () { return i < items.length ? instance(items[i++]) : null; },
      onAnswer: function (inst, ok) { stat(inst.id, ok); },
      onEnd: function (right, count) {
        W(n).pretest = { score: right, n: count, date: Date.now() }; save();
        app.innerHTML = '<p class="kicker">Week ' + n + '</p><h1>Floor found</h1><div class="card"><div class="score">' + right + "/" + count + '</div><p class="muted">' + (right >= 4 ? "You already have some of this. Read the lesson anyway, the exam asks for the mechanism, not the vocabulary." : "Good. That is what the lesson is for. Every one of those ideas is built from the ground up.") + '</p><div class="row"><a class="btn pri" href="' + week(n).lesson + '">Open the lesson</a><a class="btn" href="#/week/' + n + '">Week page</a></div></div>';
      } });
  };

  routes.practice = function (p) {
    var n = parseInt(p[0], 10) || 1, b = bank(n); if (!b || !unlocked(n)) return go("#/week/" + n);
    var lastId = null;
    session({ kicker: "Week " + n + " · Practice", title: "Practice", sub: "As many as you want. Missed questions come back more often. Stop whenever you like.", back: "#/week/" + n,
      topicName: function (inst) { return b.topics[inst.topic]; },
      next: function () {
        var pool = b.items.filter(function (it) { return it.id !== lastId; });
        var weights = pool.map(function (it) { var s = S.qstats[it.id]; return 1 + (s ? s.miss * 3 : 0) + (s ? 0 : 1); });
        var tot = weights.reduce(function (a, c) { return a + c; }, 0), r = Math.random() * tot, k = 0;
        while (r > weights[k]) { r -= weights[k]; k++; }
        lastId = pool[k].id; return instance(pool[k]);
      },
      onAnswer: function (inst, ok) { stat(inst.id, ok); },
      onEnd: function () {} });
  };

  routes.review = function (p) {
    var n = parseInt(p[0], 10) || 1, b = bank(n), st = W(n);
    if (!b || !st.review || !st.review.length) return go("#/week/" + n);
    var queue = st.review.slice(), cleared = 0, startN = queue.length;
    session({ kicker: "Week " + n + " · Clear your misses", title: "Get each one right", sub: "Each missed question comes back, with fresh numbers where it has numbers. A wrong answer sends it to the back of the line.", back: "#/week/" + n,
      topicName: function (inst) { return b.topics[inst.topic] + " · " + cleared + " of " + startN + " cleared"; },
      next: function () { if (!queue.length) return null; var it = itemById(b, queue[0]); return instance(it); },
      onAnswer: function (inst, ok) {
        stat(inst.id, ok);
        var id = queue.shift();
        if (ok) cleared++; else queue.push(id);
        st.review = queue.slice();
      },
      onEnd: function () {
        st.review = null; save();
        app.innerHTML = '<p class="kicker">Week ' + n + '</p><h1>Misses cleared</h1><div class="card"><p>The retake is unlocked. It will be a completely new draw from the bank.</p><div class="row"><a class="btn pri" href="#/exam/' + n + '">Retake the exam</a><a class="btn" href="#/practice/' + n + '">Practice more first</a></div></div>';
      } });
  };

  routes.diagnostic = function () {
    var items = TA.DIAGNOSTIC.slice(), i = 0, res = [];
    session({ kicker: "Entrance diagnostic", title: "Where your picture starts", sub: "24 questions across all 12 weeks. Later questions cover things you have not been taught yet, so expect to miss them.", total: items.length, back: "#/",
      topicName: function (inst) { return "Week " + inst.w; },
      next: function () { if (i >= items.length) return null; var it = items[i++]; var inst = prep({ type: "mcq", q: it.q, opts: it.opts, ex: it.ex }); inst.w = it.w; return inst; },
      onAnswer: function (inst, ok) { res.push({ w: inst.w, ok: ok }); },
      onEnd: function (right, count) {
        var byPhase = TA.PHASES.map(function (ph) {
          var ws = TA.WEEKS.filter(function (x) { return x.phase === ph.id; }).map(function (x) { return x.n; });
          var r = res.filter(function (x) { return ws.indexOf(x.w) >= 0; });
          return { name: ph.name, right: r.filter(function (x) { return x.ok; }).length, n: r.length };
        });
        S.diag = { score: right, n: count, byPhase: byPhase, date: Date.now() }; save();
        routes.diagresult();
      } });
  };
  routes.diagresult = function () {
    if (!S.diag) return go("#/");
    var h = '<p class="kicker">Entrance diagnostic</p><h1>' + S.diag.score + " of " + S.diag.n + '</h1><div class="card">';
    S.diag.byPhase.forEach(function (ph) {
      h += '<p style="margin:.6rem 0 .25rem"><b>' + esc(ph.name) + '</b> <span class="muted small">' + ph.right + " of " + ph.n + '</span></p><div class="bar"><i style="width:' + (ph.n ? ph.right / ph.n * 100 : 0) + '%"></i></div>';
    });
    h += '<p class="muted" style="margin-top:1rem">Paste this score to Claude so the first lessons can start at the right depth. Nothing is skipped. Every week still needs its 100% exam.</p><div class="row"><a class="btn pri" href="#/">Back to the academy</a><a class="btn" href="#/diagnostic">Retake</a></div></div>';
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
    var n = parseInt(p[0], 10) || 1, b = bank(n), st = W(n);
    if (!b || !unlocked(n)) return go("#/week/" + n);
    if (st.review && st.review.length) return go("#/review/" + n);
    var qs = compose(b), ans = new Array(qs.length);
    if (/debug/.test(location.search)) window.__exam = qs;
    var h = '<p class="kicker">Week ' + n + ' exam</p><h1>' + qs.length + ' questions. All of them right.</h1><p class="lede">No feedback until you submit. Work calculations on paper. Numeric answers accept commas.</p>';
    h += qs.map(function (q, i) { return qHTML(q, i, { topic: b.topics[q.topic] }); }).join("");
    h += '<div class="sticky-submit"><span class="muted small" id="answered">0 of ' + qs.length + ' answered</span><button class="btn pri" id="submit" type="button" disabled>Submit exam</button></div>';
    app.innerHTML = h;
    function upd() {
      var c = ans.filter(function (a) { return a != null && String(a).trim() !== ""; }).length;
      document.getElementById("answered").textContent = c + " of " + qs.length + " answered";
      document.getElementById("submit").disabled = c < qs.length;
    }
    app.querySelectorAll(".q").forEach(function (qe) {
      var i = +qe.getAttribute("data-i");
      qe.querySelectorAll(".opt").forEach(function (b2) {
        b2.addEventListener("click", function () { qe.querySelectorAll(".opt").forEach(function (o) { o.classList.remove("sel"); }); b2.classList.add("sel"); ans[i] = +b2.getAttribute("data-k"); upd(); });
      });
      var inp = qe.querySelector("input"); if (inp) inp.addEventListener("input", function () { ans[i] = inp.value; upd(); });
    });
    document.getElementById("submit").addEventListener("click", function () {
      var res = qs.map(function (q, i) { var ok = grade(q, ans[i]); stat(q.id, ok); return ok; });
      var score = res.filter(Boolean).length, passed = score === qs.length;
      var missed = []; qs.forEach(function (q, i) { if (!res[i]) missed.push(q.id); });
      st.exams.push({ date: Date.now(), score: score, n: qs.length, missed: missed, passed: passed });
      if (passed) { st.passed = true; st.review = null; } else st.review = missed;
      save();
      var o = '<p class="kicker">Week ' + n + ' exam</p><div class="card' + (passed ? " hero" : "") + '"><div class="score ' + (passed ? "pass" : "fail") + '">' + score + "/" + qs.length + "</div>";
      if (passed) {
        o += "<p><b>Passed.</b> " + (tasksDone(n) && gatesDone(n) ? "Week " + (n + 1) + " is unlocked." : "Finish the remaining tasks on the week page to unlock Week " + (n + 1) + ".") + '</p><div class="row"><a class="btn pri" href="#/week/' + n + '">Week page</a><a class="btn" href="#/">Academy</a></div>';
      } else {
        o += "<p>Not yet. You missed " + missed.length + ". Read each explanation below. Then clear those questions again, with fresh numbers, before a new exam draw unlocks.</p><a class=\"btn pri\" href=\"#/review/" + n + '">Clear your misses</a>';
      }
      o += "</div>";
      if (!passed) {
        o += "<h2>What you missed</h2>";
        qs.forEach(function (q, i) {
          if (res[i]) return;
          var yours = q.type === "mcq" ? (ans[i] != null ? q.choices[ans[i]].t : "") : ans[i];
          o += '<div class="q"><p class="qn"><span>Question ' + (i + 1) + "</span><span>" + esc(b.topics[q.topic]) + '</span></p><div class="qt">' + q.q + '</div><p class="small"><b style="color:var(--bad)">Your answer.</b> ' + esc(yours) + '</p><p class="small"><b style="color:var(--good)">Correct.</b> ' + esc(rightText(q)) + '</p><p class="fb">' + q.ex + "</p></div>";
        });
      }
      app.innerHTML = o; window.scrollTo(0, 0);
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
    var weeksDone = TA.WEEKS.filter(function (w) { return completed(w.n); }).length;
    var rows = [
      ["All 12 weeks complete", weeksDone + " of 12", weeksDone >= G.minWeeks],
      ["At least " + G.minTrades + " sim trades on your written setup", (s.n || 0) + " of " + G.minTrades, (s.n || 0) >= G.minTrades],
      ["Edge statistically real. t statistic of expectancy at least " + G.minT.toFixed(1), s.n > 1 ? s.t.toFixed(2) : "not enough trades", s.n > 1 && s.t >= G.minT],
      ["Rules followed on at least " + pct(G.minAdherence) + " of sim trades", s.n ? pct(s.adh) : "no trades", s.n && s.adh >= G.minAdherence]
    ];
    var all = rows.every(function (r) { return r[2]; });
    var h = '<div class="card' + (all ? " hero" : "") + '"><p class="muted small" style="margin-top:0">Real money stays locked until every line is green. In the largest studies of day traders, under 1% were reliably profitable after costs. This gate is how you find out which side of that line you are on, cheaply.</p>';
    rows.forEach(function (r) { h += '<div class="gate"><span class="tick' + (r[2] ? " on" : "") + '">' + (r[2] ? "✓" : "") + "</span><span>" + esc(r[0]) + '</span><span class="gv">' + esc(r[1]) + "</span></div>"; });
    if (s.need) h += '<p class="small muted" style="margin-bottom:0">At your current sim expectancy of ' + f2(s.mean) + "R per trade, roughly " + s.need + " trades are needed before luck stops being a good explanation.</p>";
    return h + "</div>";
  }

  // ------------------------------------------------------------------ journal page
  var jFilter = "all";
  routes.journal = function () {
    var all = sorted(), set = S.settings, td = today();
    var todays = all.filter(function (t) { return t.date === td && (t.mode === "sim" || t.mode === "live"); });
    var todayR = todays.map(rOf).filter(function (r) { return !isNaN(r); }).reduce(function (a, c) { return a + c; }, 0);
    var stop = todays.length >= set.maxTrades || todayR <= -set.dailyLossR;
    var h = '<p class="kicker">Journal</p><h1>Every trade, measured</h1><p class="lede">Log backtest, replay, sim and live trades separately. Results are in R, the amount you risked, so a trade risking 2 points that makes 4 is +2R.</p>';
    h += '<div class="card' + (stop ? " stop" : "") + '"><b>' + (stop ? "Done for today. Your rules say stop." : "Today") + '</b> <span class="muted">' + todays.length + " of " + set.maxTrades + " sim and live trades used. Net " + f2(todayR) + "R against a daily loss limit of −" + set.dailyLossR + "R.</span></div>";
    // form
    h += '<div class="card"><h3 style="margin-top:0">Log a trade</h3><div class="grid">' +
      fld("Date", '<input type="date" id="j_date" value="' + td + '">') +
      fld("Mode", sel("j_mode", [["sim", "Sim"], ["replay", "Replay"], ["backtest", "Backtest"], ["live", "Live"]])) +
      fld("Instrument", sel("j_inst", [["MES", "MES"], ["MNQ", "MNQ"], ["ES", "ES"], ["NQ", "NQ"], ["other", "Other"]])) +
      fld("Direction", sel("j_dir", [["long", "Long"], ["short", "Short"]])) +
      fld("Entry", '<input id="j_entry" inputmode="decimal">') + fld("Stop", '<input id="j_stop" inputmode="decimal">') + fld("Exit", '<input id="j_exit" inputmode="decimal">') +
      fld("Contracts", '<input id="j_qty" inputmode="numeric" value="1">') +
      fld("Setup name", '<input id="j_setup" list="setups" placeholder="e.g. NY open sweep">') +
      fld("Rules followed?", sel("j_fol", [["1", "Yes, every rule"], ["0", "No, I broke one"]])) +
      fld("R override (optional)", '<input id="j_rov" inputmode="decimal" placeholder="for backtest imports">') +
      '<div class="field wide"><label>Notes</label><input id="j_notes" placeholder="What did you see, what did you feel"></div></div>' +
      '<datalist id="setups">' + uniq(all.map(function (t) { return t.setup; })).map(function (s) { return '<option value="' + esc(s) + '">'; }).join("") + "</datalist>" +
      '<div class="row" style="margin-top:.8rem"><button class="btn pri" id="j_add" type="button">Add trade</button><span class="muted small" id="j_prev"></span></div></div>';
    // stats
    var modes = [["all", "All"], ["backtest", "Backtest"], ["replay", "Replay"], ["sim", "Sim"], ["live", "Live"]];
    var fl = jFilter === "all" ? all : all.filter(function (t) { return t.mode === jFilter; }), s = stats(fl);
    h += '<h2>Statistics</h2><div class="seg" id="j_seg">' + modes.map(function (m) { return '<button type="button" data-m="' + m[0] + '" class="' + (jFilter === m[0] ? "on" : "") + '">' + m[1] + "</button>"; }).join("") + "</div>";
    if (!s.n) h += '<p class="muted">No trades here yet.</p>';
    else {
      h += '<div class="stats">' + [
        ["Trades", s.n], ["Win rate", pct(s.win)], ["Expectancy", f2(s.mean) + "R", s.mean], ["Total", f2(s.total) + "R", s.total],
        ["Avg win", f2(s.avgW) + "R"], ["Avg loss", f2(s.avgL) + "R"], ["Profit factor", s.pf === Infinity ? "∞" : s.pf.toFixed(2)], ["Max drawdown", "−" + s.dd.toFixed(2) + "R"],
        ["Worst losing streak", s.streak], ["t statistic", s.n > 1 ? s.t.toFixed(2) : "n/a"], ["95% range of expectancy", s.n > 1 ? f2(s.lo) + " to " + f2(s.hi) : "n/a"], ["Rules followed", pct(s.adh)]
      ].map(function (x) { return '<div class="stat"><div class="k">' + x[0] + '</div><div class="v' + (x[2] != null ? (x[2] > 0 ? " pos" : x[2] < 0 ? " neg" : "") : "") + '">' + x[1] + "</div></div>"; }).join("") + "</div>";
      h += '<p class="small muted">' + verdict(s) + "</p>";
      h += curve(fl);
      var bySetup = {}; fl.forEach(function (t) { (bySetup[t.setup || "unnamed"] = bySetup[t.setup || "unnamed"] || []).push(t); });
      h += '<h3>By setup</h3><div class="scroll"><table class="tbl"><tr><th>Setup</th><th>Trades</th><th>Win rate</th><th>Expectancy</th><th>t</th></tr>' +
        Object.keys(bySetup).map(function (k) { var ss = stats(bySetup[k]); return "<tr><td>" + esc(k) + "</td><td>" + ss.n + "</td><td>" + (ss.n ? pct(ss.win) : "") + '</td><td class="r">' + (ss.n ? f2(ss.mean) + "R" : "") + "</td><td>" + (ss.n > 1 ? ss.t.toFixed(2) : "") + "</td></tr>"; }).join("") + "</table></div>";
    }
    // table
    h += '<h2>Trades</h2>';
    if (all.length) {
      h += '<div class="scroll"><table class="tbl"><tr><th>Date</th><th>Mode</th><th>Inst</th><th>Setup</th><th>Dir</th><th>R</th><th>Rules</th><th>Notes</th><th></th></tr>' +
        all.slice().reverse().map(function (t) { var r = rOf(t); return "<tr><td>" + esc(t.date) + "</td><td>" + esc(t.mode) + "</td><td>" + esc(t.inst) + "</td><td>" + esc(t.setup) + "</td><td>" + esc(t.dir) + '</td><td class="r" style="color:' + (r > 0 ? "var(--good)" : r < 0 ? "var(--bad)" : "inherit") + '">' + (isNaN(r) ? "?" : f2(r)) + "</td><td>" + (t.followed ? "yes" : "no") + "</td><td>" + esc(t.notes || "") + '</td><td><button class="btn sm" type="button" data-del="' + t.id + '" aria-label="Delete trade">Delete</button></td></tr>'; }).join("") + "</table></div>";
    } else h += '<p class="muted">Nothing logged yet.</p>';
    h += '<div class="row" style="margin-top:1rem"><button class="btn sm" id="j_csv" type="button">Export CSV</button><label class="btn sm">Import CSV<input type="file" id="j_imp" accept=".csv,text/csv" hidden></label></div><p class="small muted">CSV columns. date, mode, inst, setup, dir, entry, stop, exit, qty, r, followed, notes. Use the r column for backtest results already measured in R.</p>';
    app.innerHTML = h;

    function v(id) { return document.getElementById(id).value.trim(); }
    function readForm() { return { date: v("j_date"), mode: v("j_mode"), inst: v("j_inst"), dir: v("j_dir"), entry: v("j_entry"), stop: v("j_stop"), exit: v("j_exit"), qty: v("j_qty"), setup: v("j_setup"), followed: v("j_fol") === "1", rOverride: v("j_rov"), notes: v("j_notes") }; }
    function prev() { var r = rOf(readForm()); document.getElementById("j_prev").textContent = isNaN(r) ? "Enter entry, stop and exit to see R." : "This trade is " + f2(r) + "R."; }
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
        var id = +b.getAttribute("data-del"); S.journal = S.journal.filter(function (t) { return t.id !== id; }); save(); routes.journal();
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
  function fld(l, inner) { return '<div class="field"><label>' + l + "</label>" + inner + "</div>"; }
  function sel(id, opts) { return '<select id="' + id + '">' + opts.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + "</option>"; }).join("") + "</select>"; }
  function uniq(a) { var o = []; a.forEach(function (x) { if (x && o.indexOf(x) < 0) o.push(x); }); return o; }
  function verdict(s) {
    if (s.n < 30) return "Fewer than 30 trades. Any number above is mostly noise. Keep logging.";
    if (s.mean <= 0) return "Expectancy is zero or negative. As it stands this loses money, and more trades will not fix that by themselves.";
    if (s.t < 2) return "Positive so far, but a t statistic below 2 means luck explains it easily. Roughly " + s.need + " trades at this edge would settle it.";
    return "Positive expectancy with t above 2. That is evidence of an edge in this sample. It still has to hold on new data, in real time, after costs.";
  }
  function curve(trs) {
    var rs = trs.map(rOf).filter(function (r) { return !isNaN(r); }); if (rs.length < 2) return "";
    var pts = [0], c = 0; rs.forEach(function (r) { c += r; pts.push(c); });
    var Wd = 640, Ht = 220, pad = 34, mn = Math.min.apply(null, pts), mx = Math.max.apply(null, pts); if (mx === mn) { mx += 1; mn -= 1; }
    var X = function (i) { return pad + i / (pts.length - 1) * (Wd - pad - 10); }, Y = function (v) { return 10 + (mx - v) / (mx - mn) * (Ht - 40); };
    var d = pts.map(function (v, i) { return (i ? "L" : "M") + X(i).toFixed(1) + "," + Y(v).toFixed(1); }).join(" ");
    return '<h3>Equity curve, in R</h3><svg class="eq" viewBox="0 0 ' + Wd + " " + Ht + '" role="img" aria-label="Cumulative R over trades">' +
      '<line class="ax" x1="' + pad + '" y1="' + (Ht - 30) + '" x2="' + (Wd - 10) + '" y2="' + (Ht - 30) + '"/>' +
      '<line class="z" x1="' + pad + '" y1="' + Y(0) + '" x2="' + (Wd - 10) + '" y2="' + Y(0) + '"/>' +
      '<path class="ln" d="' + d + '"/>' +
      '<text x="' + (pad - 6) + '" y="' + (Y(mx) + 4) + '" text-anchor="end">' + mx.toFixed(1) + '</text><text x="' + (pad - 6) + '" y="' + (Y(mn) + 4) + '" text-anchor="end">' + mn.toFixed(1) + '</text>' +
      '<text x="' + X(pts.length - 1) + '" y="' + (Ht - 12) + '" text-anchor="end">trade ' + (pts.length - 1) + "</text></svg>";
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
    var h = '<p class="kicker">Settings</p><h1>Rules and backups</h1>';
    h += '<div class="card"><h3 style="margin-top:0">Daily trading limits</h3><p class="muted small">Set these before you trade, never during. The journal tells you to stop when you hit either one.</p><div class="grid">' +
      fld("Daily loss limit, in R", '<input id="s_loss" inputmode="decimal" value="' + set.dailyLossR + '">') + fld("Max trades per day", '<input id="s_max" inputmode="numeric" value="' + set.maxTrades + '">') +
      '</div><div class="row" style="margin-top:.8rem"><button class="btn pri" id="s_save" type="button">Save limits</button></div></div>';
    h += '<div class="card"><h3 style="margin-top:0">Backup</h3><p class="muted small">Everything lives in this browser. Export a file now and then, and import it on any other device.</p><div class="row"><button class="btn" id="s_exp" type="button">Export backup</button><label class="btn">Import backup<input type="file" id="s_imp" accept=".json,application/json" hidden></label></div></div>';
    h += '<div class="card warn"><h3 style="margin-top:0">Start over</h3><p class="muted small">Erases all progress, exams and journal trades in this browser. Export first.</p><button class="btn danger" id="s_reset" type="button">Erase everything</button></div>';
    app.innerHTML = h;
    document.getElementById("s_save").addEventListener("click", function () {
      var l = parseFloat(document.getElementById("s_loss").value), m = parseInt(document.getElementById("s_max").value, 10);
      if (!(l > 0) || !(m > 0)) { toast("Both limits must be positive."); return; }
      set.dailyLossR = l; set.maxTrades = m; save(); toast("Saved.");
    });
    document.getElementById("s_exp").addEventListener("click", function () { download("trading-academy-backup-" + today() + ".json", JSON.stringify(S, null, 1), "application/json"); });
    document.getElementById("s_imp").addEventListener("change", function (e) {
      var f = e.target.files[0]; if (!f) return;
      f.text().then(function (txt) { try { var o = JSON.parse(txt); if (o.v !== 1) throw 0; S = o; save(); toast("Backup restored."); go("#/"); } catch (er) { toast("That file is not an academy backup."); } });
    });
    var armed = false, rb = document.getElementById("s_reset");
    rb.addEventListener("click", function () {
      if (!armed) { armed = true; rb.textContent = "Press again to erase everything"; setTimeout(function () { armed = false; rb.textContent = "Erase everything"; }, 4000); return; }
      S = fresh(); save(); toast("Erased."); go("#/");
    });
  };

  nav();
})();
