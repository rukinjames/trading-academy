# Trading Academy

A 12 week, exam gated path from zero to a tested day trading process. Static site, no build step, hosted on GitHub Pages. All progress lives in the browser's localStorage. Back it up from Settings.

## How it works

- **Entrance diagnostic.** 24 questions across all 12 weeks. Informational only, it never skips a week.
- **Each week.** Find your floor (5 ungraded questions), a long story driven lesson page, unlimited practice, tasks, and an exam.
- **The exam.** 15 questions drawn at random, one from every topic, at least 4 of them calculation questions with fresh numbers every time. Week 1's bank has 99 static questions and 20 generators, independently audited. 100% is required. After a miss you must clear those questions again before a brand new draw unlocks.
- **Unlocking.** Week N+1 unlocks when Week N's exam is passed, every task is ticked, and any journal requirements are met.
- **Journal.** Trades logged in R by mode (backtest, replay, sim, live). Expectancy, t statistic, 95% range, drawdown, streaks, adherence, equity curve, by setup breakdown, CSV import and export, daily loss and trade limits.
- **Real money gate.** Stays locked until all 12 weeks are done and sim results show at least 100 trades, a t statistic of 2 or more, and 95% rule adherence.

## Layout

```
index.html            the app shell
assets/app.js         router, exams, practice, journal, settings
assets/app.css
data/curriculum.js    the 12 week roadmap, tasks, journal gates, real money gate
data/bank-diagnostic.js
data/bank-wNN.js      one question bank per built week
lessons/weekNN.html   built lesson pages (single offline files)
src/weekNN/           lesson sources (lesson.py and content files) for the feynman lesson builder
```

## Adding a week (notes for Claude)

1. Write the lesson in `src/weekNN/` with the feynman skill's lesson page workflow and build it to `lessons/weekNN.html`. Keep the snippet at the end of EXTRA_JS that adds the Academy link to the lesson's top bar.
2. Write `data/bank-wNN.js` in the same format as `bank-w01.js`. Keep at least one topic generator only (Week 1 uses slippage), or compose() cannot guarantee 4 generators per exam. Static questions list the correct option first. Use generators for every calculation so retakes get new numbers. Give every question a topic, and make sure the exam size is at least the number of topics.
3. In `data/curriculum.js`, set the week's `lesson` path and add its `tasks`.
4. Add `<script src="data/bank-wNN.js"></script>` to `index.html`.
5. Aim the new week at the questions James missed most (his exported backup has per question miss counts under `qstats`).
