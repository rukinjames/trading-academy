/* Week 1 question bank. Static questions list the correct option FIRST. The app shuffles.
   Generators return a fresh question with new numbers every time they are drawn. */
window.TA = window.TA || {};
TA.BANKS = TA.BANKS || {};
(function () {
  function fp(p) { return p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function base(R) { return 5800 + R.int(0, 1600) * 0.25; }
  function tbl(rows) {
    // rows: [[bidSize, price, askSize]] from high price to low
    var h = '<table class="qbook"><tr><th>Bids</th><th>Price</th><th>Asks</th></tr>';
    rows.forEach(function (r) { h += "<tr><td>" + (r[0] || "") + "</td><td>" + fp(r[1]) + "</td><td>" + (r[2] || "") + "</td></tr>"; });
    return h + "</table>";
  }
  function askBook(R, levels) {
    var bid = base(R), ask = bid + 0.25 * R.int(1, 2), asks = [], bids = [];
    for (var i = 0; i < levels; i++) asks.push([ask + i * 0.25, R.int(3, 18)]);
    for (var j = 0; j < 2; j++) bids.push([bid - j * 0.25, R.int(3, 18)]);
    return { asks: asks, bids: bids, bid: bid, ask: ask };
  }
  function bidBook(R, levels) {
    var bid = base(R), ask = bid + 0.25 * R.int(1, 2), asks = [], bids = [];
    for (var i = 0; i < 2; i++) asks.push([ask + i * 0.25, R.int(3, 18)]);
    for (var j = 0; j < levels; j++) bids.push([bid - j * 0.25, R.int(3, 18)]);
    return { asks: asks, bids: bids, bid: bid, ask: ask };
  }
  function show(b) {
    var rows = [];
    b.asks.slice().reverse().forEach(function (a) { rows.push([0, a[0], a[1]]); });
    b.bids.forEach(function (x) { rows.push([x[1], x[0], 0]); });
    return tbl(rows);
  }
  function walk(levels, qty) {
    var left = qty, cost = 0, parts = [], last = null;
    for (var i = 0; i < levels.length && left > 0; i++) {
      var t = Math.min(left, levels[i][1]);
      left -= t; cost += t * levels[i][0]; last = levels[i][0]; parts.push(t + " at " + fp(levels[i][0]));
    }
    return { avg: cost / qty, cost: cost, parts: parts, last: last };
  }

  var items = [
    // ---------------- price
    { id: "p1", topic: "price", q: "What is the last price shown on a trading screen?",
      opts: ["The price of the most recent trade", "The exchange's estimate of fair value", "The average of the best bid and the best ask", "The price where the most contracts are waiting"],
      ex: "The last price is simply the most recent trade on the tape. Nobody calculates it. The average of best bid and best ask is the mid price, which may never trade." },
    { id: "p2", topic: "price", q: "A stock's last price is $50.00. Which statement must be true?",
      opts: ["The most recent trade happened at $50.00", "You can buy a share right now for $50.00", "The best bid is $50.00", "Most traders agree the stock is worth $50.00"],
      ex: "Last only tells you about the trade that already happened. To buy now you pay the best ask, which could be higher, and nobody had to agree on worth for one trade to print." },
    { id: "p3", topic: "price", q: "Which best describes the relationship between value and price?",
      opts: ["Price is a record of the last agreement between two orders. It usually sits near what people think things are worth, but nothing forces it to", "The exchange calculates price from the value of the company", "Price and value are two words for the same number", "Value is the last trade and price is the average trade"],
      ex: "Value is an opinion. Price is a fact about one trade. On May 6, 2010 Accenture's value did not change while its price went from about $40 to one cent and back." },
    { id: "p4", topic: "price", q: "Over a whole day of heavy buying, how does the number of contracts bought compare with the number sold?",
      opts: ["They are exactly equal", "More are bought than sold", "More are sold than bought", "It depends on whether the price rose"],
      ex: "Every trade has one buyer and one seller for the same quantity. What differs on a buying day is urgency. Buyers were crossing the spread more often than sellers were." },
    // ---------------- book
    { id: "b1", topic: "book", q: "What is a bid?",
      opts: ["A resting order to buy at a stated price or lower", "A resting order to sell at a stated price or higher", "The price of the last trade", "An order to buy immediately at any price"],
      ex: "A bid waits in the book to buy. The sell side equivalent is the ask, or offer. An order that buys immediately at any price is a market order." },
    { id: "b2", topic: "book", q: "In a resting order book, how do the bids and asks sit relative to each other?",
      opts: ["Every resting ask is above every resting bid", "Bids and asks are mixed together by time", "Every resting bid is above every resting ask", "The best bid and best ask are always at the same price"],
      ex: "If a bid ever reached an ask, the two would match and trade, so neither would be resting anymore. That is why a gap, the spread, always separates them." },
    { id: "b3", topic: "book", q: "What does the depth of an order book tell you?",
      opts: ["How much could trade before the price has to move to a new level", "How far the price will move today", "How many trades happened in the last minute", "How long orders have been waiting"],
      ex: "Depth is the size waiting behind the best prices. A deep book absorbs big market orders with little movement. A thin one lets them walk far." },
    { id: "b4", topic: "book", q: "Best bid 6,000.00, best ask 6,000.25. You send a limit sell for 2 at 6,000.50. What happens?",
      opts: ["It rests in the book above the best ask and waits for a buyer", "It trades immediately at 6,000.00", "It trades immediately at 6,000.50", "It is rejected because it is above the market"],
      ex: "No buyer is offering 6,000.50, so nothing can match. Your order joins the asks at 6,000.50 and waits." },
    { id: "b5", topic: "book", q: "Who can see your stop order in the order book before it is triggered?",
      opts: ["No other trader. It is not displayed in the book until it triggers", "Everyone, as a bar at its trigger price", "Only market makers", "Everyone, but only during US hours"],
      ex: "A stop sits outside the visible book. That is why a cluster of stops can surprise everyone when it turns into market orders all at once." },
    // ---------------- spread
    { id: "s1", topic: "spread", q: "Why is there always a gap between the best bid and the best ask in a resting book?",
      opts: ["If they met, the orders would trade at once, so they could not both still be resting", "The exchange sets a minimum gap by law", "Market makers are required to keep a gap", "The gap is the exchange's fee"],
      ex: "The matching engine trades any bid that reaches an ask. Whatever is left resting must therefore have a gap between the two sides." },
    { id: "s2", topic: "spread", q: "During normal US trading hours, how wide is the ES spread usually?",
      opts: ["One tick, 0.25 points", "One full point", "Five points", "It is always zero"],
      ex: "ES is so heavily traded that many participants compete at the front of the book, so the best bid and best ask are almost always one tick apart." },
    { id: "s3", topic: "spread", q: "What usually happens to the spread in the seconds before a major scheduled economic release?",
      opts: ["It tends to widen, because market makers pull or shrink their quotes", "It narrows to zero", "It stays exactly the same", "It becomes negative"],
      ex: "Market makers fear being run over by a sudden move, so they step back. Fewer orders at the front means the best bid and ask drift apart." },
    { id: "s4", topic: "spread", q: "You buy with a market order and immediately sell with a market order. The price never moves. Before fees, what is your result?",
      opts: ["You lose the spread", "You break even", "You gain the spread", "You lose double the spread"],
      ex: "You bought at the ask and sold at the bid. The gap between them is lost on every round trip made with market orders." },
    // ---------------- priority
    { id: "q1", topic: "priority", q: "On CME Globex, three traders are bidding 5,999.75 for ES. A market sell for 4 arrives. Who is filled first?",
      opts: ["The trader whose bid at 5,999.75 arrived earliest", "The trader with the largest order", "All three, split in proportion to size", "A random one of the three"],
      ex: "ES uses price time priority, also called first in, first out. Best price first, then earliest arrival at that price." },
    { id: "q2", topic: "priority", q: "You join the best bid with a limit buy. The price trades at your level, then rallies away. You never got filled. What is the most likely reason?",
      opts: ["You were behind other orders in line, and only the ones ahead of you traded", "Limit orders are always filled last regardless of time", "The exchange skipped you because your order was small", "Your order became a market order"],
      ex: "Joining a price puts you at the back of its line. Trades at your price can use up the orders ahead of you without ever reaching yours." },
    // ---------------- orders
    { id: "o1", topic: "orders", q: "What is the defining feature of a market order?",
      opts: ["It trades immediately against resting orders at whatever prices are available", "It guarantees the current last price", "It waits in the book until the market reaches it", "It can only be filled at the mid price"],
      ex: "A market order states only a quantity. It takes the best resting price, then the next, until filled. It never waits and never guarantees a price." },
    { id: "o2", topic: "orders", q: "When a new order matches a resting order, at what price does the trade happen?",
      opts: ["The resting order's price", "The new order's limit price", "Halfway between the two", "The previous last price"],
      ex: "The trader who waited set the price, and the trader who arrived accepted it. A buy limit of 6,001.00 meeting an ask of 6,000.50 trades at 6,000.50." },
    { id: "o3", topic: "orders", q: "In a trade, who is the maker?",
      opts: ["The side whose order was already resting in the book", "The side that crossed the spread", "The exchange", "Whoever had the larger order"],
      ex: "The maker's order made the market that the other trader hit. The trader who arrived and crossed is the taker." },
    { id: "o4", topic: "orders", q: "What is adverse selection for a resting limit buy order?",
      opts: ["It tends to fill when sellers are aggressive, which is often right before the price falls further", "The exchange selects the worst price for it", "It fills only at the end of the day", "It is more likely to fill when the price is rising"],
      ex: "Your bid fills because someone is in a hurry to sell. That urgency is itself evidence of falling prices, so the fills you get are skewed toward bad moments." },
    { id: "o5", topic: "orders", q: "Which statement about market and limit orders is correct?",
      opts: ["A market order pays the spread for certain execution. A limit order controls price but may not fill", "A limit order always gets a better result than a market order", "A market order always fills at the last price", "A limit order cannot ever take liquidity"],
      ex: "Neither is free. The market order's cost is known and paid every time. The limit order's cost is hidden in missed trades and adverse fills. And a limit priced through the other side does take liquidity." },
    { id: "o6", topic: "orders", q: "What does liquidity mean in an order book?",
      opts: ["The supply of resting orders that lets someone trade immediately", "The amount of cash in your account", "The number of trades per minute", "How quickly the price moves"],
      ex: "Makers provide liquidity by waiting in the book. Takers use it up. Volume, the number of trades, is a different thing." },
    // ---------------- stops
    { id: "t1", topic: "stops", q: "A stop sell has a trigger at 5,995.00. The price trades at 5,995.00. What happens to the stop?",
      opts: ["It becomes a market sell and trades against the bids at once", "It becomes a limit sell at 5,995.00 and waits", "It is cancelled because the price was reached", "It buys at 5,995.00"],
      ex: "A plain stop, also called a stop market order, turns into a market order when its trigger trades. It then fills against whatever bids remain." },
    { id: "t2", topic: "stops", q: "Why can a cluster of stop sells below an obvious low make the price drop very fast?",
      opts: ["Once triggered, they all become market sells at the same moment and eat through several levels of bids", "Stops are executed by the exchange at the low of the day", "Stops tell market makers to lower their prices", "The exchange moves the price down to the stop level"],
      ex: "Hidden stops are hidden future market orders. One small trade at the trigger releases them together, and their combined size walks down the bids." },
    { id: "t3", topic: "stops", q: "How does a stop limit sell differ from a stop market sell?",
      opts: ["Once triggered it becomes a limit order, so it cannot fill below its limit, but it might not fill at all", "It fills faster than a stop market", "It is visible in the book before it triggers", "It is always filled at exactly the trigger price"],
      ex: "The limit protects you from a terrible price. The cost is that in a fast drop the price can fall straight through your limit and leave you still in the trade." },
    { id: "t4", topic: "stops", q: "What did CME's Stop Logic do in ES at 2∶45∶28 pm on May 6, 2010?",
      opts: ["Paused trading for five seconds, which let buy orders arrive and refill the book", "Cancelled every stop order in the market", "Moved the price back up to where it was", "Closed the market for the rest of the day"],
      ex: "Stop Logic is designed to interrupt a cascade of triggered stops. The five second pause stopped market orders from hitting an empty book, buyers posted bids, and the price stabilized." },
    // ---------------- sides
    { id: "a1", topic: "sides", q: "The tape shows a large trade at the bid. Who was the aggressor?",
      opts: ["The seller, who crossed the spread to sell at the bid", "The buyer, who set the price", "Neither side", "The market maker"],
      ex: "A trade at the bid means a seller accepted a resting buy order's price. The buyer was waiting, so the seller was the aggressor." },
    { id: "a2", topic: "sides", q: "What makes a price go up, in terms of the order book?",
      opts: ["Buyers take the asks faster than new asks are added, so trades have to happen at higher levels", "More contracts are bought than sold", "The exchange raises the price when demand is high", "Sellers raise their asks for no reason"],
      ex: "The only way a price changes is that orders consume the levels in front of them. News matters only through the orders it causes." },
    { id: "a3", topic: "sides", q: "Someone says there are more buyers than sellers today. What is the accurate version?",
      opts: ["Buyers are more aggressive, crossing the spread more often than sellers are", "More contracts were bought than sold", "There are more people with buy orders than sell orders, so the volume is uneven", "Sellers have left the market"],
      ex: "Bought always equals sold. The imbalance is in urgency. Who is crossing the spread, and who is waiting for them." },
    // ---------------- market makers
    { id: "m1", topic: "makers", q: "How does a market maker earn money when things go as planned?",
      opts: ["By buying at its bid and selling at its ask, earning the spread", "By predicting the direction of the market", "By charging the exchange a fee", "By holding contracts for months"],
      ex: "Quoting both sides means one trader sells to the market maker's bid and another buys from its ask. The difference is the spread, earned without needing a direction." },
    { id: "m2", topic: "makers", q: "What is a market maker's main risk?",
      opts: ["Piling up inventory on one side while the price moves against it", "Being filled on both sides at once", "The spread being too wide", "Running out of contracts to sell"],
      ex: "In a one sided move its bid keeps getting filled, or its ask keeps getting lifted, and the position loses value. That is why market makers pull quotes in violent markets." },
    { id: "m3", topic: "makers", q: "What was a stub quote in 2010?",
      opts: ["A placeholder order far from the market, like a one cent bid, posted to meet a quoting obligation", "A quote for a fraction of a share", "A temporary price shown while the market is closed", "An order cancelled before it reached the exchange"],
      ex: "Some market makers had to keep quotes in the book, so when they did not want to trade they bid one cent and offered $100,000. On May 6 market sell orders hit those one cent bids. Stub quotes were banned later in 2010." },
    { id: "m4", topic: "makers", q: "What does HFT refer to?",
      opts: ["High frequency trading, firms whose programs react and trade in millionths of a second", "A type of order that fills at the high of the day", "A regulator that oversees futures", "Hedge fund trading of long term positions"],
      ex: "Most market making today is done by high frequency traders. Not every HFT is a market maker, but most market makers are HFTs." },
    // ---------------- zero sum
    { id: "z1", topic: "zerosum", q: "Why is ES zero sum before costs?",
      opts: ["Every contract has one side that gains and one that loses the same amount on any price move", "Because the S&P 500 never changes in the long run", "Because the exchange keeps all profits", "Because market makers always win"],
      ex: "A futures contract is an agreement between two sides. Whatever one gains on a move, the other loses. Add up everyone and the total is zero before fees." },
    { id: "z2", topic: "zerosum", q: "After commissions, fees and spreads, all ES traders taken together...",
      opts: ["Lose money in total, so the market is negative sum", "Break even exactly", "Make money as the economy grows", "Make money from the exchange"],
      ex: "Before costs the gains and losses cancel. Costs are then subtracted from everyone, so the total is negative. Your profit must come out of someone else's account." },
    { id: "z3", topic: "zerosum", q: "Which question should every day trading strategy you test be able to answer?",
      opts: ["Who is on the other side paying me, and why are they willing to?", "Which indicator does it use?", "How many trades does it take per day?", "Which famous trader uses it?"],
      ex: "In a negative sum market, a real edge has to be paid for by someone who is in more of a hurry, knows less, or trades for reasons unrelated to the next few minutes, like a hedger." },
    { id: "z4", topic: "zerosum", q: "Why is owning stocks for years not zero sum, even though trading ES for minutes is?",
      opts: ["Companies earn profits that flow to shareholders over time. Over a few minutes there is no such profit, only transfers between the two sides", "Stocks are regulated and futures are not", "Stocks cannot fall to zero", "Because stock trades have no spread"],
      ex: "Long term owners share in the businesses' earnings. A minutes long futures trade has no earnings to share, so one side's gain is the other's loss." },
    // ---------------- crash
    { id: "c1", topic: "crash", q: "What was the key instruction given to the 75,000 contract sell program on May 6, 2010?",
      opts: ["Sell at about 9% of the previous minute's volume, without regard to price or time", "Sell only if the price stays above a limit", "Sell everything in the first minute", "Sell only to market makers"],
      ex: "Without regard to price made it a pure taker. Tying speed to volume meant that when volume exploded, it sold faster." },
    { id: "c2", topic: "crash", q: "Why did hot potato trading among HFTs make things worse?",
      opts: ["It inflated volume, so the volume targeting sell program sold faster into a market with almost no real buyers", "HFTs refused to trade, so there was no volume", "It cancelled the sell program's orders", "It pushed the price up and triggered buy stops"],
      ex: "Between 2∶45∶13 and 2∶45∶27 HFTs traded over 27,000 contracts, about 49% of volume, while buying only about 200 net. The volume looked like liquidity but was not." },
    { id: "c3", topic: "crash", q: "What is the difference between volume and liquidity?",
      opts: ["Volume counts what traded. Liquidity is what is waiting in the book to absorb an order", "They are the same thing", "Liquidity counts what traded. Volume is what is waiting", "Volume is measured in dollars and liquidity in contracts"],
      ex: "May 6 had enormous volume and almost no liquidity. By 2∶45∶28 resting buy orders in ES were under 1% of their morning depth." },
    { id: "c4", topic: "crash", q: "Why did a share of Accenture trade at one cent?",
      opts: ["Real bids were pulled, and market sell orders hit a one cent stub quote, the best bid left", "The company announced bad news", "The exchange's computers malfunctioned and printed a wrong number", "A trader chose to sell at one cent on purpose"],
      ex: "A market order takes the best bid that exists. When liquidity providers withdrew, the best bid left was a placeholder at one cent. Nobody chose that price. The empty book chose it." },
    { id: "c5", topic: "crash", q: "What happened to the trades executed 60% or more away from their 2∶40 pm prices?",
      opts: ["The exchanges cancelled them after the close as clearly erroneous", "They stood, and the traders kept the gains and losses", "They were repriced to the closing price", "They were moved to the next day"],
      ex: "More than 20,000 trades in over 300 securities were broken. Note that ordinary slippage in a thin book is never cancelled. Only absurd prices are." },
    { id: "c6", topic: "crash", q: "On May 6, which order type would have protected a seller from selling at one cent?",
      opts: ["A limit sell", "A market sell", "A stop sell", "A larger market sell"],
      ex: "A limit sell cannot fill below its limit. The price of that protection is that if the market falls through your limit, you are still holding." },
    // ---------------- candles
    { id: "k1", topic: "candles", q: "What is the open of a 1 minute candle?",
      opts: ["The price of the first trade in that minute", "The best ask at the start of the minute", "The average price during the minute", "The close of the previous day"],
      ex: "Open is the first trade in the window, close is the last, and high and low are the extremes. Those four numbers are the whole candle." },
    { id: "k2", topic: "candles", q: "When is a candle drawn filled in the lesson, or red on TradingView?",
      opts: ["When its close is below its open", "When volume was mostly selling", "When its low is below the previous candle's low", "When the spread widened"],
      ex: "Color or fill compares only the close with the open of that same candle. It says nothing about who was aggressive." },
    { id: "k3", topic: "candles", q: "Which of these can you NOT know from a single candle?",
      opts: ["Whether the high happened before the low", "The highest price traded", "Whether it closed above its open", "The last trade in the window"],
      ex: "The path inside the window is thrown away. Two opposite minutes can produce the identical candle." },
    { id: "k4", topic: "candles", q: "What does the volume bar under a candle show?",
      opts: ["How many contracts traded during that candle's window", "How many orders were waiting in the book", "How far the price moved", "The difference between buyers and sellers"],
      ex: "Volume counts trades. It does not show the book, and as May 6 proved, it does not measure liquidity." },
    { id: "k5", topic: "candles", q: "What does a candle tell you about the order book during its minute?",
      opts: ["Nothing. A candle is built only from trades", "How deep the bids were", "Where the stops were", "Who the market makers were"],
      ex: "A chart summarizes the tape. The book, the stops and the aggressors are all invisible in it, which is why chart patterns have to be tested rather than believed." },

    // ================= generators =================
    { id: "g-avg", topic: "slippage", gen: function (R) {
        var b = askBook(R, 3), tot = b.asks[0][1] + b.asks[1][1] + b.asks[2][1];
        var qty = R.int(b.asks[0][1] + 1, tot), w = walk(b.asks, qty);
        return { type: "num", q: "Here is the book. You send a market buy for " + qty + " contracts. What is your average fill price? Answer to two decimals." + show(b),
          answer: Math.round(w.avg * 100) / 100, tol: 0.011,
          ex: "You fill " + w.parts.join(", then ") + ". Total cost " + fp(w.cost) + " divided by " + qty + " is " + w.avg.toFixed(3) + "." };
      } },
    { id: "g-slip", topic: "slippage", gen: function (R) {
        var b = bidBook(R, 3), tot = b.bids[0][1] + b.bids[1][1] + b.bids[2][1];
        var qty = R.int(b.bids[0][1] + 1, tot), w = walk(b.bids, qty), slip = b.bids[0][0] - w.avg;
        return { type: "num", q: "Here is the book. You send a market sell for " + qty + " contracts. Compared with the best bid, what is your slippage per contract in points? Answer to two decimals." + show(b),
          answer: Math.round(slip * 100) / 100, tol: 0.011,
          ex: "You sell " + w.parts.join(", then ") + ". Average " + w.avg.toFixed(3) + ". Best bid was " + fp(b.bids[0][0]) + ", so slippage is " + slip.toFixed(3) + " points per contract." };
      } },
    { id: "g-last", topic: "orders", gen: function (R) {
        var b = bidBook(R, 4), qty = R.int(b.bids[0][1] + b.bids[1][1] + 1, b.bids[0][1] + b.bids[1][1] + b.bids[2][1]), w = walk(b.bids, qty);
        var opts = [fp(w.last)];
        b.bids.forEach(function (x) { if (fp(x[0]) !== fp(w.last)) opts.push(fp(x[0])); });
        return { type: "mcq", q: "Here is the book. A trader sends a market sell for " + qty + ". What is the last price right after it finishes?" + show(b),
          opts: opts.slice(0, 4), ex: "The order sells " + w.parts.join(", then ") + ". The last of those trades is the new last price, " + fp(w.last) + "." };
      } },
    { id: "g-mid", topic: "spread", gen: function (R) {
        var bid = base(R), k = R.int(1, 4), ask = bid + 0.25 * k, sp = ask - bid, mid = (ask + bid) / 2;
        var opts = ["Spread " + sp.toFixed(2) + ", mid " + fp(mid), "Spread " + (sp + 0.25).toFixed(2) + ", mid " + fp(mid), "Spread " + sp.toFixed(2) + ", mid " + fp(ask), "Spread " + (k * 1).toFixed(2) + ", mid " + fp(mid + 0.25)];
        return { type: "mcq", q: "Best bid " + fp(bid) + ", best ask " + fp(ask) + ". What are the spread in points and the mid price?",
          opts: opts, ex: "Spread is " + fp(ask) + " minus " + fp(bid) + ", which is " + sp.toFixed(2) + " points, or " + k + " tick" + (k > 1 ? "s" : "") + ". The mid is halfway, " + fp(mid) + "." };
      } },
    { id: "g-round", topic: "spread", gen: function (R) {
        var n = R.int(2, 6), k = R.int(1, 3), sp = 0.25 * k, bid = base(R), ask = bid + sp;
        return { type: "num", q: "Best bid " + fp(bid) + ", best ask " + fp(ask) + ". You buy " + n + " contracts with a market order and immediately sell all " + n + " with a market order. The book does not change. Before fees, how many points did you lose in total across all contracts?",
          answer: Math.round(n * sp * 100) / 100, tol: 0.001,
          ex: "Each contract is bought at " + fp(ask) + " and sold at " + fp(bid) + ", losing " + sp.toFixed(2) + " points. Times " + n + " contracts is " + (n * sp).toFixed(2) + " points." };
      } },
    { id: "g-candle", topic: "candles", gen: function (R) {
        var n = R.int(3, 4), p = base(R), cs = [];
        for (var i = 0; i < n; i++) {
          var o = p, c = o + 0.25 * R.int(-8, 8), h = Math.max(o, c) + 0.25 * R.int(0, 5), l = Math.min(o, c) - 0.25 * R.int(0, 5);
          cs.push([o, h, l, c]); p = c;
        }
        var O = cs[0][0], C = cs[n - 1][3], H = Math.max.apply(null, cs.map(function (x) { return x[1]; })), Lo = Math.min.apply(null, cs.map(function (x) { return x[2]; }));
        var fmt = function (a) { return "O " + fp(a[0]) + "  H " + fp(a[1]) + "  L " + fp(a[2]) + "  C " + fp(a[3]); };
        var right = fmt([O, H, Lo, C]);
        var cand = [fmt([O, H, cs[n - 1][2], C]), fmt([cs[n - 1][0], H, Lo, C]), fmt([O, cs[n - 1][1], Lo, C]), fmt([O, H, Lo, cs[0][3]]), fmt([O, H - 0.25, Lo, C]), fmt([O, H + 0.25, Lo, C]), fmt([O, H, Lo - 0.25, C]), fmt([O, H, Lo, C + 0.25])];
        var opts = [right]; cand.forEach(function (x) { if (opts.indexOf(x) < 0 && opts.length < 4) opts.push(x); });
        var list = cs.map(function (x, i) { return "<li>" + fmt(x) + "</li>"; }).join("");
        return { type: "mcq", q: "These are " + n + " consecutive 1 minute candles. What is the single " + n + " minute candle they make?<ol class=\"qlist\">" + list + "</ol>",
          opts: opts, ex: "Open of the first, " + fp(O) + ". Highest high, " + fp(H) + ". Lowest low, " + fp(Lo) + ". Close of the last, " + fp(C) + "." };
      } },
    { id: "g-stop", topic: "stops", gen: function (R) {
        var b = bidBook(R, 4), first = b.bids[0][1], stops = R.int(b.bids[1][1] + 1, b.bids[1][1] + b.bids[2][1] + Math.floor(b.bids[3][1] / 2));
        var w = walk(b.bids.slice(1), stops), opts = [fp(w.last)];
        b.bids.forEach(function (x) { if (fp(x[0]) !== fp(w.last)) opts.push(fp(x[0])); });
        return { type: "mcq", q: "Here is the book. Hidden below it, stop sells totalling " + stops + " contracts have a trigger at " + fp(b.bids[0][0]) + ". A trader sends a market sell for " + first + ". Where is the last price once everything has finished trading?" + show(b),
          opts: opts.slice(0, 4), ex: "The " + first + " contract sale takes all of " + fp(b.bids[0][0]) + " and touches the trigger. The " + stops + " stop contracts become market sells and fill " + w.parts.join(", then ") + ". The last of those, " + fp(w.last) + ", is the price." };
      } },
    { id: "g-mkt", topic: "orders", gen: function (R) {
        var bid = base(R), ask = bid + 0.25, kind = R.int(0, 3), q, opts, ex;
        if (kind === 0) { var L = ask + 0.25 * R.int(1, 3);
          q = "Best bid " + fp(bid) + ", best ask " + fp(ask) + ". You send a limit buy for 1 at " + fp(L) + ". What happens?";
          opts = ["It trades at once at " + fp(ask), "It trades at once at " + fp(L), "It rests in the book at " + fp(L), "It is rejected"];
          ex = "Your limit reaches past the best ask, so it matches the resting seller immediately. Trades happen at the resting order's price, " + fp(ask) + ", which is better than your limit. It took liquidity."; }
        else if (kind === 1) { var L2 = bid - 0.25 * R.int(1, 3);
          q = "Best bid " + fp(bid) + ", best ask " + fp(ask) + ". You send a limit buy for 1 at " + fp(L2) + ". What happens?";
          opts = ["It rests in the book at " + fp(L2) + " and adds liquidity", "It trades at once at " + fp(ask), "It trades at once at " + fp(L2), "It replaces the best bid"];
          ex = "Nobody is selling that low, so the order waits in the book below the best bid. It made liquidity."; }
        else if (kind === 2) { var L3 = bid - 0.25 * R.int(0, 2);
          q = "Best bid " + fp(bid) + ", best ask " + fp(ask) + ". You send a limit sell for 1 at " + fp(L3) + ". What happens?";
          opts = ["It trades at once at " + fp(bid), "It trades at once at " + fp(L3) + (L3 === bid ? " after waiting in line" : ""), "It rests in the book at " + fp(L3), "It trades at the mid price"];
          if (L3 === bid) opts[1] = "It waits in line behind the other sellers at " + fp(bid);
          ex = "Your limit reaches the best bid, so it matches the waiting buyer immediately at the resting price, " + fp(bid) + ". A sell priced at or through the bid takes liquidity."; }
        else { var L4 = ask + 0.25 * R.int(0, 2);
          q = "Best bid " + fp(bid) + ", best ask " + fp(ask) + ". You send a limit sell for 1 at " + fp(L4) + ". What happens?";
          opts = ["It rests in the book at " + fp(L4) + " and adds liquidity", "It trades at once at " + fp(bid), "It trades at once at " + fp(L4), "It cancels the best ask"];
          ex = "No buyer will pay " + fp(L4) + ". The order waits among the asks" + (L4 === ask ? ", at the back of the line at the best ask" : "") + ". It made liquidity."; }
        return { type: "mcq", q: q, opts: opts, ex: ex };
      } }
  ];

  TA.BANKS[1] = {
    week: 1,
    examSize: 15,
    topics: { price: "What a price is", book: "The order book", spread: "Spread and mid", priority: "Price time priority", orders: "Order types", slippage: "Fills and slippage", stops: "Stop orders", sides: "Aggressors and price moves", makers: "Market makers and HFT", zerosum: "Who pays you", crash: "May 6, 2010", candles: "Candles" },
    items: items
  };
})();
