/* The 12 week roadmap. A week's lesson and exam bank exist only once they are built.
   To add a week: set lesson to its page, add data/bank-wNN.js, and list it in index.html. */
window.TA = window.TA || {};
TA.PHASES = [
  { id: 1, name: "Foundations", blurb: "How the machine works, the contract you will trade, and the math that decides who survives." },
  { id: 2, name: "The TJR toolkit, as hypotheses", blurb: "Learn the concepts well enough to explain them better than the people who sell them, and write each one as an exact rule you can test." },
  { id: 3, name: "The lab", blurb: "Turn the rules into code, test them on years of data, and find out honestly whether any edge exists after costs." },
  { id: 4, name: "Forward test", blurb: "Trade the surviving rules in real time on a simulated account, with hard limits, and let the numbers deliver the verdict." }
];

TA.WEEKS = [
  { n: 1, phase: 1, title: "A share for one cent", topic: "How a market actually works",
    lesson: "lessons/week01.html",
    objectives: [
      "Explain what a price is and why it can disconnect from value",
      "Read an order book. Bids, asks, best bid and ask, spread, mid, depth",
      "Know exactly what limit, market, stop and stop limit orders do, and which ones make or take liquidity",
      "Compute the average fill and slippage of a market order walking the book",
      "Explain who is on the other side of your trades and why futures are zero sum",
      "Explain the 2010 flash crash mechanism step by step",
      "Build candles from trades, combine timeframes, and say what a candle hides"
    ],
    tasks: [
      { id: "read", text: "Read the whole Week 1 lesson and answer every green box in it.", link: "lessons/week01.html", linkText: "Open the lesson" },
      { id: "teach", text: "Teach it back. In the box below, explain how a forty dollar share traded for one cent to someone who has never heard of a bid, an ask, a spread, a limit order or a stop. Define each word as you use it. Then paste it to Claude to be graded.", teach: true },
      { id: "tv", text: "Open a free TradingView account and load MES1! (Micro E-mini S&P 500) on the 1 minute chart. Pick one candle and write down its open, high, low and close from the data window. Check that the candle's shape matches those four numbers." , link: "https://www.tradingview.com/chart/?symbol=CME_MINI%3AMES1%21", linkText: "Open MES1! on TradingView" },
      { id: "open", text: "Watch the first 15 minutes after the 9∶30 am New York open (8∶30 am in St. Louis) on a 1 minute MES chart, live or with replay if your plan allows it. Write down three things you notice about candle size and volume compared with the middle of the day." },
      { id: "report", text: "Read pages 1 to 8 of the official SEC and CFTC report on May 6, 2010. You will now understand almost every sentence.", link: "https://www.sec.gov/files/marketevents-report.pdf", linkText: "Open the report (PDF)" }
    ] },
  { n: 2, phase: 1, title: "The contract", topic: "Futures, ES and NQ, and what a point costs you",
    objectives: ["Why futures were invented and what you actually own", "ES, NQ, MES and MNQ specifications, ticks and the dollar value of a point", "Margin, leverage and daily mark to market", "Expiration, rollover and trading hours", "Sessions and scheduled news (CPI, jobs report, FOMC)", "Real costs per round trip. Commissions, exchange fees, spread, slippage"] },
  { n: 3, phase: 1, title: "The math of staying alive", topic: "Expected value, sizing and ruin",
    objectives: ["Expected value and R multiples", "Expectancy from win rate and payoff", "Position sizing that survives losing streaks", "Drawdown asymmetry and risk of ruin", "The Kelly criterion and why professionals bet a fraction of it", "How many trades it takes to tell skill from luck"] },
  { n: 4, phase: 2, title: "Structure", topic: "Swings, trends, break of structure",
    objectives: ["Define swing highs and lows as exact rules", "Trend, range, break of structure and change of character", "Higher timeframe bias", "Turn each idea into something a computer could detect"] },
  { n: 5, phase: 2, title: "Liquidity", topic: "Where the stops sit and why price goes there",
    objectives: ["Equal highs and lows, prior day and session highs and lows", "Sweeps and stop runs, explained with the Week 1 book", "Who needs that liquidity and why", "What part of the idea is mechanism and what part is story"] },
  { n: 6, phase: 2, title: "Gaps and zones", topic: "Fair value gaps, order blocks, premium and discount",
    objectives: ["Fair value gaps defined exactly", "Order blocks and supply and demand zones", "Premium and discount within a range", "For each idea, the result that would prove it false"] },
  { n: 7, phase: 2, title: "Time and the full model", topic: "Sessions, the New York open, and your first written strategy",
    objectives: ["Sessions and the hours that matter", "The full TJR style setup as a checklist", "Your first strategy spec, precise enough to code", "Pre committed risk rules"] },
  { n: 8, phase: 3, title: "Data and code", topic: "Getting data and coding the setups",
    objectives: ["Getting intraday futures data", "Python and pandas for bars", "Coding swing points, sweeps and gaps", "Cost and slippage models", "Look ahead bias and how it fakes results"] },
  { n: 9, phase: 3, title: "Testing honestly", topic: "Separating an edge from luck",
    objectives: ["In sample versus out of sample", "Walk forward testing", "Multiple testing and why the best of 500 backtests lies", "The t statistic of expectancy", "Monte Carlo on trade sequences"] },
  { n: 10, phase: 3, title: "Replay", topic: "Execution practice on past data",
    objectives: ["Manual bar replay with a strict checklist", "Execution and order type choice", "Journal discipline"],
    gates: [{ mode: "replay", min: 50, label: "50 replay trades logged in the journal" }] },
  { n: 11, phase: 4, title: "Live sim", topic: "Real time, fake money, real rules",
    objectives: ["Trading a simulated account in real time", "Tilt, revenge trading and FOMO, and the rules that stop them", "Hard daily limits that you cannot override"],
    gates: [{ mode: "sim", min: 50, label: "50 sim trades logged" }, { mode: "sim", adherence: 0.95, label: "Rules followed on at least 95% of sim trades" }] },
  { n: 12, phase: 4, title: "The verdict", topic: "Go, no go, or back to the lab",
    objectives: ["Analyze every trade. Expectancy, confidence interval, drawdown", "Compare live results with the backtest", "How prop firm evaluations really work, and their expected value", "A written decision you commit to"] }
];

/* The gate between practice and real money. Checked live against the journal. */
TA.REAL_MONEY_GATE = {
  minWeeks: 12,
  mode: "sim",
  minTrades: 100,
  minT: 2.0,
  minAdherence: 0.95
};
