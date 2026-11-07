/* Week 1 question bank. Static questions list the correct option FIRST. The app shuffles.
   Generators return a fresh question with new numbers every time they are drawn.
   Audited and extended. See review/bank-review.md for every change. */
window.TA = window.TA || {};
TA.BANKS = TA.BANKS || {};
(function () {
  // ---------------- helpers (prices are ES points, always multiples of 0.25)
  function fp(p) { return p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  // exact price, with a third decimal only when needed (mids like 6,000.375)
  function fpx(p) { return Math.round(p * 1000) % 10 === 0 ? fp(p) : p.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 }); }
  function f4(x) { return x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 }); }
  function pts(x) { return x.toFixed(2) + " points"; }
  function base(R) { return 5800 + R.int(0, 1600) * 0.25; }
  function tick(n) { return n + " tick" + (n === 1 ? "" : "s"); }
  function res(x) { return x > 0 ? "a gain of " + pts(x) : x < 0 ? "a loss of " + pts(-x) : "exactly zero"; }
  function tbl(rows) {
    // rows. [[bidSize, price, askSize]] from high price to low. 0 shows an empty cell.
    var h = '<table class="qbook"><tr><th>Bids</th><th>Price</th><th>Asks</th></tr>';
    rows.forEach(function (r) { h += "<tr><td>" + (r[0] || "") + "</td><td>" + fp(r[1]) + "</td><td>" + (r[2] || "") + "</td></tr>"; });
    return h + "</table>";
  }
  // asks ascending from the best ask, bids descending from the best bid
  function mkBook(R, nA, nB, lo, hi, gap) {
    var bid = base(R), ask = bid + 0.25 * (gap || R.int(1, 2)), asks = [], bids = [];
    for (var i = 0; i < nA; i++) asks.push([ask + i * 0.25, R.int(lo, hi)]);
    for (var j = 0; j < nB; j++) bids.push([bid - j * 0.25, R.int(lo, hi)]);
    return { asks: asks, bids: bids, bid: bid, ask: ask };
  }
  // the full price ladder, every tick from the highest ask to the lowest bid, like the lesson draws it
  function show(b) {
    var am = {}, bm = {}, rows = [];
    b.asks.forEach(function (a) { am[a[0].toFixed(2)] = a[1]; });
    b.bids.forEach(function (x) { bm[x[0].toFixed(2)] = x[1]; });
    var top = b.asks.length ? b.asks[b.asks.length - 1][0] : b.bids[0][0];
    var bot = b.bids.length ? b.bids[b.bids.length - 1][0] : b.asks[0][0];
    for (var k = Math.round(top * 4); k >= Math.round(bot * 4); k--) { var p = k / 4, key = p.toFixed(2); rows.push([bm[key] || 0, p, am[key] || 0]); }
    return tbl(rows);
  }
  function walk(levels, qty) {
    var left = qty, cost = 0, parts = [], costs = [], last = null, filled = 0;
    for (var i = 0; i < levels.length && left > 0; i++) {
      if (levels[i][1] <= 0) continue;
      var t = Math.min(left, levels[i][1]);
      left -= t; filled += t; cost += t * levels[i][0]; last = levels[i][0];
      parts.push(t + " at " + fp(levels[i][0])); costs.push(fp(t * levels[i][0]));
    }
    return { cost: cost, parts: parts, costs: costs, last: last, filled: filled, left: left };
  }
  function cum(levels, n) { var s = 0; for (var i = 0; i < n; i++) s += levels[i][1]; return s; }
  function ohlc(c) { return "O " + fp(c[0]) + "  H " + fp(c[1]) + "  L " + fp(c[2]) + "  C " + fp(c[3]); }
  function validC(c) { return c[1] >= Math.max(c[0], c[3]) && c[2] <= Math.min(c[0], c[3]); }
  function clock(s) { return "10∶41∶" + (s < 10 ? "0" : "") + s; }

  var items = [
    // ================= price
    { id: "p1", topic: "price", q: "What is the last price shown on a trading screen?",
      opts: ["The price of the most recent trade", "The exchange's running estimate of fair value", "The midpoint between the best bid and best ask", "The price where the most contracts are waiting"],
      ex: "The last price is simply the most recent trade on the tape. Nobody calculates it. The midpoint of the best bid and best ask is the mid price, which is arithmetic and may never trade. The price with the most contracts waiting is just a big level in the book." },
    { id: "p2", topic: "price", q: "A stock's last price is $50.00. Which statement must be true?",
      opts: ["The most recent trade happened at $50.00", "You can buy a share right now for $50.00", "The best bid right now is $50.00", "Most traders agree the stock is worth $50.00"],
      ex: "Last describes a trade that already happened. To buy now you pay the best ask and to sell now you get the best bid, and either can sit away from $50.00 because the book keeps changing after a trade. And one trade needs only two people to agree, not most traders." },
    { id: "p3", topic: "price", q: "Which statement about price and value is correct?",
      opts: ["Price is the last agreement between two orders. It usually sits near value, but nothing forces it to", "The exchange computes the price from the company's value and posts it", "Price and value are the same number, just measured at different moments", "Price always equals value, because informed traders close any gap at once"],
      ex: "Value is an opinion about worth. Price is a fact about one trade. They are usually close because people trade near what they think things are worth, but on May 6, 2010 Accenture's value did not change while its price went from about $40 to one cent and back. Only people choosing to trade pull price back toward value." },
    { id: "p4", topic: "price", q: "Over a whole day of heavy buying, how does the number of contracts bought compare with the number sold?",
      opts: ["They are exactly equal", "More are bought than sold", "More are sold than bought", "It depends on whether the price rose that day"],
      ex: "Each trade has one buyer and one seller for the same quantity, so the totals match every day, whatever the price did. What differs on a buying day is urgency. Buyers were crossing the spread more often than sellers were." },
    { id: "p5", topic: "price", q: "What is the time and sales list, also called the tape?",
      opts: ["A running record of every trade, with its time, price and size", "A list of every order waiting to trade, sorted by price", "A record of every order sent, including the cancelled ones", "The exchange's official price for each minute of the day"],
      ex: "The tape records trades, things that already happened. The list of orders waiting to trade, sorted by price, is the order book, a different object. The last price on your screen is simply the newest row of the tape." },
    { id: "p6", topic: "price", q: "ES last traded at 6,000.00. Since then no trade has happened, but the best bid has risen to 6,000.25 and the best ask to 6,000.50. What is the last price now?",
      opts: ["6,000.00", "6,000.25", "6,000.375", "6,000.50"],
      ex: "The last price changes only when a new trade prints. Bids and asks can move all they like without a trade, and the last price stays at the most recent trade, 6,000.00. The number 6,000.375 is the mid, which is arithmetic, not a trade." },
    { id: "p7", topic: "price", q: "Which of these events, by itself, changes the last price?",
      opts: ["A trade prints at a different price from the trade before it", "A new bid arrives between the best bid and the best ask", "A large order resting at the best ask is cancelled", "A news headline about the S&P 500 appears"],
      ex: "The last price is the most recent trade, so only a new trade at a new price changes it. A new bid inside the spread and a cancelled ask both change the book, and news changes what people might do, but none of them is a trade." },

    // ================= book
    { id: "b1", topic: "book", q: "What is a bid?",
      opts: ["A resting order to buy at a stated price or lower", "A resting order to sell at a stated price or higher", "An order to buy immediately at whatever price is available", "The price at which the most recent trade happened"],
      ex: "A bid waits in the book to buy. The sell side version is the ask, or offer. An order that buys immediately at whatever price is there is a market order, and the most recent trade is the last price." },
    { id: "b2", topic: "book", q: "In a resting order book, how do the bids and asks sit relative to each other?",
      opts: ["Every resting ask is above every resting bid", "Bids and asks interleave, sorted by arrival time", "Every resting bid is above every resting ask", "The best bid and best ask sit at the same price"],
      ex: "If a bid ever reached an ask, the two would match and trade, so neither would still be resting. That is why a gap, the spread, always separates the two sides." },
    { id: "b3", topic: "book", q: "What does the depth of an order book tell you?",
      opts: ["How much size waits behind the best prices, so how far a big order must walk", "How far the price is likely to travel today, based on recent ranges", "How many contracts traded in the last minute, which is the volume", "How long the orders at the best prices have been waiting in line"],
      ex: "Depth is the size resting at and behind the best prices. A deep book absorbs a big market order with little movement. A thin one lets it walk through many levels. Volume, what already traded, is a different thing, a lesson May 6 made painfully clear." },
    { id: "b4", topic: "book", q: "Best bid 6,000.00, best ask 6,000.25. You send a limit sell for 2 at 6,000.50. What happens?",
      opts: ["It rests in the book above the best ask and waits for a buyer", "It trades immediately at the best bid, 6,000.00", "It trades immediately at 6,000.50, its own price", "It is rejected because it is above the market"],
      ex: "A sell limit at 6,000.50 means sell at 6,000.50 or higher. The highest buyer only pays 6,000.00, so nothing can match. The order joins the asks at 6,000.50 and waits. Limit orders away from the market are accepted. That is exactly what a resting order is." },
    { id: "b5", topic: "book", q: "Before it is triggered, who can see your stop order in the ES order book?",
      opts: ["No other trader. It is held outside the book until it triggers", "Everyone, as a bar at its trigger price", "Only the market makers quoting ES", "Everyone, but only during US trading hours"],
      ex: "A stop is not a resting order. It is held outside the visible book, waiting for its trigger. That is why a cluster of stops can surprise everyone when it turns into market orders all at once." },
    { id: "b6", topic: "book", q: "For one minute, buy limit orders arrive priced below the best ask at that moment, sell limit orders arrive priced above the best bid at that moment, and some orders are cancelled. How many trades happen in that minute?",
      opts: ["None, because no order reached the other side", "One for every order that arrived", "One every time the best bid or best ask changed", "One for every pair of buy and sell orders"],
      ex: "A trade needs an arriving order whose price reaches a waiting order on the other side. These orders all stop short, so they only wait, and cancels just remove waiting orders. A book can be busy and still print no trades, exactly like the first four stages of the build a book stepper." },
    { id: "b7", topic: "book", q: "Which statement about a resting limit order is true?",
      opts: ["It can be cancelled at any moment before it fills, and no reason is needed", "Once posted it must stay until it fills or the session ends", "It can be cancelled only if the price moves away from it", "Cancelling it needs the approval of the exchange's market makers"],
      ex: "Nobody is obliged to keep an order in the book. That is why liquidity can vanish in an instant. On May 6 the firms that normally kept bids in the book simply pulled them, and the depth behind the price disappeared." },
    { id: "b8", topic: "book", q: "Here is part of an ES book. What is the best bid?" + tbl([[0, 6001.00, 40], [0, 6000.75, 5], [0, 6000.50, 0], [3, 6000.25, 0], [60, 6000.00, 0], [12, 5999.75, 0]]),
      opts: ["6,000.25", "6,000.00", "6,000.75", "6,000.50"],
      ex: "The best bid is the highest price anyone is willing to pay, 6,000.25, however small the order there is. The 60 contracts at 6,000.00 are the biggest bar, but a seller gets the better price from the 3 contracts at 6,000.25 first. 6,000.75 is the best ask, and nobody is waiting at 6,000.50." },
    { id: "b9", topic: "book", q: "ES prices move in ticks of 0.25 points. At which of these prices can an ES trade happen?",
      opts: ["6,000.75", "6,000.10", "6,000.30", "6,000.125"],
      ex: "Every ES order and trade sits on a multiple of 0.25, so the decimals can only be .00, .25, .50 or .75. That is also why a mid price like 6,000.125 can be computed but never traded." },
    { id: "b10", topic: "book", q: "A new buy limit order reaches the CME matching engine for ES. What does the engine do with it?",
      opts: ["Trades it against waiting sells at its price or better, and rests what is left", "Holds it until CME staff find a seller and agree a price", "Fills all of it at the last price, whatever the book shows", "Passes it to a market maker, who decides whether to fill it"],
      ex: "Globex keeps the list of waiting orders and matches any two that agree on price, the instant they agree. If the new order reaches waiting sellers it trades at their prices. Anything left over waits in the book as a bid. No person or market maker approves trades." },

    // ================= spread
    { id: "s1", topic: "spread", q: "Why is there always a gap between the best bid and the best ask in a resting book?",
      opts: ["If they met, the orders would trade at once, so both could not still be resting", "The exchange enforces a minimum gap of one tick by rule", "Market makers are required to keep their bid and ask apart", "The gap is the fee the exchange charges on each trade"],
      ex: "The matching engine trades any bid that reaches an ask. Whatever is left resting must therefore have a gap between the two sides. The one tick minimum is just the smallest gap that can exist when prices come in steps of 0.25." },
    { id: "s2", topic: "spread", q: "During normal US trading hours, how wide is the ES spread usually?",
      opts: ["One tick, 0.25 points", "One full point, four ticks", "Half a tick, 0.125 points", "Five points"],
      ex: "ES is so heavily traded that many participants compete at the front of the book, so the best bid and best ask are almost always one tick apart. Half a tick is impossible, because no price exists between two ticks." },
    { id: "s3", topic: "spread", q: "What usually happens to the spread in the seconds before a major scheduled economic release?",
      opts: ["It tends to widen, because market makers pull or shrink their quotes", "It narrows, because traders rush to get positioned", "It stays fixed, because the exchange sets it", "It disappears, because bids and asks meet at the mid"],
      ex: "Market makers fear being run over by a sudden move, so they step back. Fewer orders at the front means the best bid and best ask drift apart. Rushing traders who cross the spread use liquidity, they do not narrow the gap." },
    { id: "s4", topic: "spread", q: "You buy one contract with a market order and immediately sell it with a market order. The book does not change in between. Before fees, what is your result?",
      opts: ["You lose the spread", "You break even, because the price did not move", "You gain the spread", "You lose twice the spread"],
      ex: "You bought at the ask and sold at the bid. The gap between them is lost on every round trip made with market orders, even when nothing moves. The spread is the price of being in a hurry." },
    { id: "s5", topic: "spread", q: "Best bid 6,000.25, best ask 6,000.50. Can a trade happen at the mid price?",
      opts: ["No. The mid is 6,000.375, not a multiple of 0.25, so no order can sit there", "Yes. The exchange matches leftover orders at the mid each minute", "Yes, whenever a market buy and a market sell arrive at the same moment", "Yes, but only for orders of a single contract"],
      ex: "The mid is halfway between the best bid and best ask, here 6,000.375. Every ES price must be a multiple of 0.25, so nobody can even post an order there, and a trade only happens when an arriving order meets a resting one at the resting order's price. Even when the mid does land on a tick, nothing makes trades happen there. It is arithmetic." },
    { id: "s6", topic: "spread", q: "The bids are 3 contracts at 5,999.75, all from one market maker, nothing at 5,999.50, and 20 at 5,999.25. The best ask is 6,000.00. The market maker cancels its bid. What is the spread now?",
      opts: ["0.75 points, three ticks", "0.25 points, one tick", "0.50 points, two ticks", "Zero, because the bid and ask now meet"],
      ex: "With the 5,999.75 bid gone, the best bid is 5,999.25, so the spread is 6,000.00 minus 5,999.25, which is 0.75 points. Nothing traded. One order leaving the front was enough to triple the spread. That is how spreads widen when market makers step back." },
    { id: "s7", topic: "spread", q: "The ES spread is two ticks, best bid 5,999.75 and best ask 6,000.25. A market maker wants its bid to be first in line. What can it do?",
      opts: ["Bid 6,000.00, inside the gap, becoming the only order at a new best bid", "Join the bid at 5,999.75 and ask to be moved to the front", "Send a market buy, which puts it at the front of the bid line", "Nothing, because the exchange fixes the spread at two ticks"],
      ex: "A bid at 6,000.00 does not reach the ask at 6,000.25, so it rests, and it is now the highest bid, alone at the front of a brand new line. This is why the ES spread is almost always one tick. Whenever a gap opens, someone improves the price to get priority, and the gap closes to the minimum. A market buy does not rest at all, it trades." },

    // ================= priority
    { id: "q1", topic: "priority", q: "On CME Globex, three traders are bidding 5,999.75 for ES, and 5,999.75 is the best bid. A market sell for 4 arrives. Who is filled first?",
      opts: ["The trader whose bid at 5,999.75 arrived earliest", "The trader with the largest order at 5,999.75", "All three, split in proportion to their sizes", "The trader with the smallest order at 5,999.75"],
      ex: "ES uses price time priority, also called first in, first out. Best price first, then earliest arrival at that price. Splitting in proportion to size, called pro rata, is used for some interest rate futures, not for ES or NQ." },
    { id: "q2", topic: "priority", q: "You join the best bid with a limit buy. The price trades at your level, then rallies away. You never got filled. What is the most likely reason?",
      opts: ["You were behind other orders in line, and only the ones ahead of you traded", "Limit orders are always filled after market orders, whatever the time", "The exchange skips small orders when larger ones are waiting", "Your order turned into a market order and missed the price"],
      ex: "Joining a price puts you at the back of its line. Trades at your price can use up the orders ahead of you without ever reaching yours, and then the price can leave." },
    { id: "q3", topic: "priority", q: "Three sellers wait at 6,000.25, the best ask. A arrived first with 4 contracts, then B with 3, then C with 5. A market buy for 6 arrives. What happens?",
      opts: ["A sells 4, B sells 2, C sells nothing", "A, B and C each sell 2", "C sells 5 and A sells 1, because C is the largest", "A sells 2, B sells 1 and C sells 3, roughly in proportion to size"],
      ex: "Price time priority fills the line in arrival order. The buy takes all 4 of A's contracts, then 2 of B's 3. C offered exactly the same price and sold nothing, purely because C arrived last." },
    { id: "q4", topic: "priority", q: "Trader X has bid 5,999.75 for an hour. Trader Y bid 6,000.00 a second ago, and nobody is selling below 6,000.25. A market sell for 1 contract arrives. Who buys it?",
      opts: ["Y, because a better price comes before earlier time", "X, because X has been waiting the longest", "X and Y split it, since both are bidding", "Whichever of them has the larger order"],
      ex: "Price time priority means price first, then time. A market sell takes the highest bid, 6,000.00, so Y trades even though X has waited an hour. Time only breaks ties between orders at the same price." },
    { id: "q5", topic: "priority", q: "You are bidding at the best bid with 300 contracts ahead of you in line. Then 120 of those 300 are cancelled. Where are you now?",
      opts: ["180 contracts from the front, since you keep your place and those ahead left", "At the back of the line, because the line is rebuilt after cancels", "Still 300 contracts from the front, since cancels do not affect you", "At the very front, because any cancel resets the line"],
      ex: "Your place depends only on the orders that arrived before yours and are still there. When 120 of them leave, only 180 remain ahead of you. Nothing about your own order changed." },
    { id: "q6", topic: "priority", q: "Why do some market making firms spend millions to save millionths of a second on their orders?",
      opts: ["Under price time priority the first order at a price fills first, so speed wins fills", "Faster orders get better prices than slower orders at the same level", "The exchange charges lower fees to the fastest firms", "Faster firms can see stop orders before they trigger"],
      ex: "In a first in, first out market, being first in line at the best price is worth money, because that order trades first when an aggressor arrives. Speed does not change the price you get at a level, and nobody can see untriggered stops in the book." },

    // ================= orders
    { id: "o1", topic: "orders", q: "What is the defining feature of a market order?",
      opts: ["It trades at once against resting orders, at whatever prices are there", "It guarantees a fill at the last price shown on your screen", "It waits in the book until the market comes to its price", "It is filled at the mid price between best bid and best ask"],
      ex: "A market order states only a quantity. It takes the best resting price, then the next, until it is filled. It never waits and never guarantees a price." },
    { id: "o2", topic: "orders", q: "When a new order matches a resting order, at what price does the trade happen?",
      opts: ["The resting order's price", "The arriving order's limit price", "Halfway between the two prices", "The previous last price"],
      ex: "The trader who waited set the price, and the trader who arrived accepted it. A buy limit of 6,001.00 meeting an ask of 6,000.50 trades at 6,000.50. A limit is the worst price you accept, not the price you must pay." },
    { id: "o3", topic: "orders", q: "In a trade, who is the maker?",
      opts: ["The side whose order was already resting in the book", "The side that arrived and crossed the spread", "Whichever side had the larger order", "The exchange, which makes every match"],
      ex: "The maker's order made the market that the other trader traded against. The trader who arrived and crossed is the taker." },
    { id: "o4", topic: "orders", q: "What is adverse selection for a resting limit buy order?",
      opts: ["It tends to fill when sellers are aggressive, often just before the price falls further", "The exchange matches it at the worst price available in the book", "It fills only near the end of the trading day, after the best moves", "It mostly fills when the price is rising, so it misses the dips"],
      ex: "Your bid fills because someone is in a hurry to sell. That urgency is itself evidence of falling prices, so the fills you get are skewed toward bad moments, and the moves that go your way tend to leave without you." },
    { id: "o5", topic: "orders", q: "Which statement about market and limit orders is correct?",
      opts: ["A market order pays the spread for a fill now. A limit order controls price but may not fill", "A limit order always gets a better result than a market order", "A market order always fills at the last price shown", "A limit order can never take liquidity, whatever its price"],
      ex: "Neither is free. The market order's cost is known and paid every time. The limit order's cost is hidden in missed trades and adverse fills. And a limit priced through the other side does take liquidity." },
    { id: "o6", topic: "orders", q: "What does liquidity mean in an order book?",
      opts: ["The supply of resting orders that lets someone trade immediately", "The amount of cash sitting in your trading account", "The number of contracts that traded in the last minute", "How quickly the price is moving right now"],
      ex: "Makers provide liquidity by waiting in the book. Takers use it up. Volume, the number of contracts traded, is a different thing." },
    { id: "o7", topic: "orders", q: "The best bid is 6,000.00 with 8 contracts. The asks are 4 contracts at 6,000.25 and 9 at 6,000.50. You send a limit buy for 6 at 6,000.25. Right after, what are the best bid and best ask?",
      opts: ["Best bid 6,000.25, best ask 6,000.50", "Best bid 6,000.00, best ask 6,000.50", "Best bid 6,000.00, best ask 6,000.25", "Best bid 6,000.25, best ask 6,000.25"],
      ex: "Your limit reaches the 4 contracts at 6,000.25, so they trade at once. Your limit forbids paying 6,000.50, so the other 2 contracts cannot trade. They wait in the book as a bid at 6,000.25, the new best bid. The asks at 6,000.25 are used up, so the best ask is 6,000.50. A bid and an ask at the same price is impossible, since they would trade." },
    { id: "o8", topic: "orders", q: "Best bid 5,999.75, best ask 6,000.00. Which of these limit orders takes liquidity?",
      opts: ["A limit buy at 6,000.25", "A limit buy at 5,999.75", "A limit sell at 6,000.25", "A limit sell at 6,000.00"],
      ex: "The buy at 6,000.25 reaches the sellers waiting at 6,000.00, so it trades at once, at 6,000.00, and takes liquidity. The buy at 5,999.75 joins the bid line, the sell at 6,000.25 rests above the ask, and the sell at 6,000.00 joins the ask line. Those three wait, so they make liquidity. The word limit does not decide it. Whether the price reaches the other side does." },
    { id: "o9", topic: "orders", q: "If you always use limit orders, which two costs do you pay instead of the spread?",
      opts: ["Missed trades when price leaves without you, and fills that cluster before moves against you", "Slippage on every fill, plus a higher exchange fee than market orders pay", "The full spread twice, once when you get in and once when you get out", "A stop cascade that is set off every time one of your limit orders fills"],
      ex: "A resting order may never fill, and you can watch the price leave without you. When it does fill, it is usually because someone in a hurry hit you, which often happens right before the price moves further against you. That second cost is adverse selection." },
    { id: "o10", topic: "orders", q: "You bought 2 ES contracts and news just proved your idea wrong. You must sell both right now. Which order fits, and what does it cost?",
      opts: ["A market sell. It fills now at the bid, paying the spread plus any slippage", "A limit sell at the best ask. It fills now and earns the spread", "A limit sell above the best ask, which fills now at a better price", "A stop limit sell, which fills now with no slippage at all"],
      ex: "Only a taker order fills now. A market sell hits the bids at once, and you pay the spread plus slippage if 2 contracts are more than the best bid holds. A limit sell at or above the best ask rests and waits for a buyer, which is exactly what you cannot afford. A stop limit does nothing until its trigger trades, and then may not fill at all." },

    // ================= slippage questions now live in other topics (the slippage topic is generator only, see the note at the bottom)
    { id: "sl1", topic: "orders", q: "What is slippage on a market order?",
      opts: ["How much worse your average fill is than the best price showing when you sent it", "The gap between the best bid and the best ask at that moment", "The commission your broker charges on each contract you trade", "The difference between the last price and the mid price"],
      ex: "Slippage measures how far your order walked. If you bought 25 contracts and averaged 6,000.45 while the best ask was 6,000.25, your slippage is 0.20 points per contract. The spread is a separate cost that you pay even on a one contract order." },
    { id: "sl2", topic: "orders", q: "ES best bid 5,999.75 with 300 contracts, best ask 6,000.00 with 250. You send a market buy for 1 contract. What is your slippage?",
      opts: ["Zero. One contract fills entirely at the best ask, though you still crossed the spread", "One tick, because a market order always pays one extra tick", "Half the spread, because you pay the mid plus slippage", "It depends on the last price, which you have not been told"],
      ex: "Your contract takes one of the 250 waiting at 6,000.00, the best price showing, so your average equals the best ask and slippage is zero. Crossing the spread is a different cost. Slippage only appears when an order is bigger than the size at the best level and has to walk." },
    { id: "sl3", topic: "book", q: "The same 30 contract market buy is sent into two ES books. Book A has 400 contracts at each of its first three ask levels. Book B has 5 contracts at each ask level. What happens?",
      opts: ["In A it fills at the best ask. In B it walks six levels and moves the price", "Both fill at the best ask, because it is the same contract", "Both walk six levels, because the order size is the same", "In B it fills better, because fewer sellers means less competition"],
      ex: "In A, 30 contracts fit inside the 400 at the best ask, so nothing moves. In B, 30 contracts need six levels of 5, so the average is worse and the last price ends at the sixth level, five ticks above the starting best ask. Same contract, same order. Only the depth differed." },
    { id: "sl4", topic: "sides", q: "Why does a market buy that is bigger than the size at the best ask raise the last price?",
      opts: ["Its final fills happen at higher ask levels, and the newest trade is the price", "The exchange raises the price to reward heavy buying", "Its average fill price is posted as the new last price", "Market makers must raise their asks after any large buy"],
      ex: "A market buy takes the best ask, then the next level up, and so on. Each fill is a trade, and the last one happened at the highest level it reached, so that becomes the last price. You did not just pay the price. You moved it." },
    { id: "sl5", topic: "crash", q: "Your market sell in a thin ES book fills 1 point below the best bid you saw when you sent it. Will the exchange cancel the trade?",
      opts: ["No. Only absurd prices get cancelled as clearly erroneous. Normal slippage is your cost", "Yes, every fill worse than the displayed bid is reversed", "Yes, if you complain before the end of the trading day", "Only if a market maker agrees to take the other side instead"],
      ex: "Exchanges cancel trades only at clearly erroneous prices, like the May 6 stock trades 60 percent or more away from where they had been. A few ticks of slippage in a thin book is the ordinary cost of a market order, and it is yours every time." },
    { id: "sl6", topic: "spread", q: "Why are market orders most expensive in the seconds around a major scheduled economic release?",
      opts: ["Market makers pull or shrink quotes, so the spread widens and the book thins", "The exchange adds a surcharge to orders sent near scheduled news", "Market orders are held until the number is released", "Limit orders are rejected then, so market orders must queue"],
      ex: "Market makers fear being run over by a sudden move, so they step back. A wider spread and thinner levels mean every market order pays more to cross and walks further through the book." },
    { id: "sl7", topic: "sides", q: "A pension fund needs to sell 2,000 ES contracts to hedge its stocks. Why does it feed the order in small slices with an execution algorithm?",
      opts: ["One 2,000 contract market sell would walk deep into the bids and pay huge slippage", "Exchanges charge a penalty fee on any order over 100 contracts", "Small orders are cheaper because their commissions round down to zero", "Slicing keeps the trades off the tape, so nobody records them"],
      ex: "The fund's order is far bigger than the size waiting at any one price. Sent all at once it would eat level after level of bids and push the price down against itself. Slicing it over time lets new bids arrive between slices. On May 6 the slicing was tied to volume instead of price, and that is what broke." },

    // ================= stops
    { id: "t1", topic: "stops", q: "A stop sell has a trigger at 5,995.00. A trade prints at 5,995.00. What happens to the stop?",
      opts: ["It becomes a market sell and trades against the bids at once", "It becomes a limit sell at 5,995.00 and waits in the book", "It is cancelled, because its price was reached", "It turns into a buy order at 5,995.00"],
      ex: "A plain stop, also called a stop market order, turns into a market order when its trigger trades, and then fills against whatever bids remain. The version that turns into a limit order is the stop limit." },
    { id: "t2", topic: "stops", q: "Why can a cluster of stop sells below an obvious low make the price drop very fast?",
      opts: ["Triggered together, they become one burst of market sells that eats several bid levels", "The exchange moves the price down to the level of the stops", "Stops are filled at the low of the day, dragging the price there", "Stops signal market makers to lower their bids by agreement"],
      ex: "Hidden stops are hidden future market orders. One small trade at the trigger releases them together, and their combined size walks down the bids." },
    { id: "t3", topic: "stops", q: "How does a stop limit sell differ from a stop market sell?",
      opts: ["When triggered it becomes a limit order, so it never fills below its limit, but may not fill at all", "It fills faster than a stop market order in a fast drop, at a better price", "It rests visibly in the book at its limit price before it is triggered", "It always fills exactly at the trigger price, however fast the market moves"],
      ex: "The limit protects you from a terrible price. The cost is that in a fast drop the price can fall straight through your limit and leave you still in the trade." },
    { id: "t4", topic: "stops", q: "What did CME's Stop Logic do in ES at 2∶45∶28 pm on May 6, 2010?",
      opts: ["It paused ES for five seconds, and buy orders arrived to refill the book", "It cancelled every stop order waiting in the market", "It reset the price to where it was at 2∶40 pm", "It closed ES for the rest of the trading day"],
      ex: "Stop Logic is designed to interrupt a cascade of triggered stops. The five second pause stopped market orders from hitting an empty book, buyers posted bids, and when trading resumed at 2∶45∶33 prices stabilized." },
    { id: "t5", topic: "stops", q: "Your stop sell on CME has a trigger at 5,997.00. The best bid drops to 5,997.00, but no trade prints there, and then trades print higher again. What happened to your stop?",
      opts: ["Nothing. It triggers only when a trade prints at the trigger, so it is still waiting", "It sold at 5,997.00 the moment the best bid touched its trigger price", "It became a limit sell resting at 5,997.00, waiting for a buyer", "It was cancelled automatically, because the price came back above it"],
      ex: "A stop is triggered by a trade at its trigger price, not by a quote. A bid sitting at 5,997.00 is just a waiting order. Until somebody actually trades there, your stop stays asleep outside the book." },
    { id: "t6", topic: "stops", q: "Once your stop sell is triggered, does it make or take liquidity?",
      opts: ["It takes, because it becomes a market order that sells to the waiting bids", "It makes, because it was placed in advance and waited", "It makes, because a stop always becomes a limit order", "Neither, because the exchange fills stops from its own inventory"],
      ex: "Waiting outside the book is not the same as resting in it. A stop provides nothing to anyone while it sleeps, and when it wakes it becomes a market order that crosses the spread. Stops are takers." },
    { id: "t7", topic: "stops", q: "Why do stop sells tend to bunch just below an obvious recent low?",
      opts: ["Many traders who bought pick the same obvious place to protect themselves", "The exchange requires stops to be placed below the day's low", "Market makers move everyone's stops to the same level", "Stops placed anywhere else are rejected by the matching engine"],
      ex: "Traders who bought near the same price reason the same way and park their protection just under the same visible level. The result is a hidden cluster of future market sells at one price. One trade there can release them all." },
    { id: "t8", topic: "stops", q: "A fund needs to buy 500 ES contracts without pushing the price up. Why might it welcome the price reaching a cluster of stop sells below?",
      opts: ["The triggered stops become a burst of market sells that it can buy from", "The stops get cancelled, removing sellers from the book", "Stop orders give buyers a discount from the exchange", "The stops turn into bids that push the price back up"],
      ex: "Someone who needs to buy a lot needs a lot of selling. Triggered stops supply it all at once, and those market sells must take whatever bids exist, including the fund's. Clusters of stops are clusters of future market orders, and Week 5 comes back to this." },

    // ================= sides
    { id: "a1", topic: "sides", q: "The tape shows a large trade at the bid. Who was the aggressor?",
      opts: ["The seller, who crossed the spread to sell at the bid", "The buyer, whose bid set the trade price", "Neither, since both sides agreed on the price", "The market maker, who is always the aggressor"],
      ex: "A trade at the bid means a seller accepted a resting buy order's price. The buyer was waiting, so the seller was the aggressor. Market makers mostly wait, so they are usually the passive side." },
    { id: "a2", topic: "sides", q: "What makes the last price go up, in terms of the order book?",
      opts: ["Buy orders use up the asks faster than new asks arrive, so trades print higher", "More contracts are bought than sold, so the price must rise", "The exchange raises the price when demand is high", "Sellers are required to raise their asks after each trade"],
      ex: "The last price only rises when a trade prints at a higher level. That happens when buyers use up the asks at the current level, or sellers pull them, so the next trade has to happen higher. News matters only through the orders it causes, and bought always equals sold, so an imbalance in amounts cannot be the cause." },
    { id: "a3", topic: "sides", q: "Someone says there are more buyers than sellers today. What is the accurate version?",
      opts: ["Buyers are crossing the spread more often than sellers are", "More contracts were bought than sold today", "Buy orders outnumber sell orders, so volume is lopsided", "Sellers have left the market for the day"],
      ex: "Bought always equals sold. The imbalance is in urgency, who is crossing the spread and who is waiting for them." },
    { id: "a4", topic: "sides", q: "Strong earnings news comes out, but for one minute nobody sends, changes or cancels an order. What happens to the last price in that minute?",
      opts: ["Nothing. It only changes when a trade prints at a new price", "It jumps at once to reflect the news", "The exchange adjusts it to the new fair value", "It drifts up as the book reprices itself"],
      ex: "News moves prices only through the orders people send because of it. With no new orders nothing can trade, and the last price stays exactly where it was." },
    { id: "a5", topic: "sides", q: "A trader says buyers are in control. What is the honest translation in terms of the book?",
      opts: ["Buy orders are taking asks faster than sellers are adding new ones", "There are more buyers than sellers in the market", "More contracts are being bought than sold", "Big bids resting below the price are holding it up"],
      ex: "Bought always equals sold, so counting buyers cannot be the story. What is unbalanced is urgency. When buyers keep crossing the spread and eating the asks faster than new asks arrive, trades print higher and higher. Resting bids are patient. They absorb selling, they do not push." },
    { id: "a6", topic: "sides", q: "In one minute the tape shows 500 contracts traded at the ask and 100 at the bid, with the quote unchanged. Which statement is true?",
      opts: ["Buyers were aggressors for 500 contracts, sellers for 100, and 600 were bought and sold", "500 contracts were bought and 100 were sold", "Sellers were the aggressors for 500, since they set the ask", "Buyers and sellers were each the aggressor for 300"],
      ex: "A trade at the ask is a buyer crossing the spread, so buyers were the aggressors for 500 contracts. A trade at the bid is a seller crossing, 100 contracts. Every one of the 600 contracts still had a buyer and a seller. Aggression can be lopsided. Quantity never is." },

    // ================= market makers
    { id: "m1", topic: "makers", q: "How does a market maker earn money when things go as planned?",
      opts: ["Buying at its bid and selling at its ask, earning the spread", "Predicting the market's direction better than others", "Charging other traders a fee on each trade", "Holding contracts for months as prices drift up"],
      ex: "Quoting both sides means one trader sells to the market maker's bid and another buys from its ask. The difference is the spread, earned without needing a direction." },
    { id: "m2", topic: "makers", q: "What is a market maker's main risk?",
      opts: ["Piling up inventory on one side while the price moves against it", "Being filled on both its bid and its ask at once", "Its spread being one tick instead of two", "Being forced to hold every contract until expiry"],
      ex: "Being filled on both sides is the plan, it is how the spread gets earned. The danger is a one sided move. Its bid keeps getting hit, or its ask keeps getting lifted, and the pile of contracts loses value. That is why market makers pull quotes in violent markets." },
    { id: "m3", topic: "makers", q: "What was a stub quote in 2010?",
      opts: ["A placeholder quote far from the market, like a one cent bid, to meet a quoting rule", "A quote for a fraction of a single share, used for very expensive stocks", "A temporary price shown on screens while the market is closed overnight", "An order that was cancelled before it ever reached the exchange's book"],
      ex: "Some market makers had to keep quotes in the book, so when they did not want to trade they bid one cent and offered $100,000. On May 6 market sell orders hit those one cent bids. Stub quotes were banned later in 2010." },
    { id: "m4", topic: "makers", q: "What does HFT refer to?",
      opts: ["High frequency trading, firms whose programs trade in millionths of a second", "A type of order that is filled only at the highest price of the day", "The US regulator that oversees futures markets and the exchanges", "Hedge funds that build large positions and hold them for years"],
      ex: "Most market making today is done by high frequency traders. Not every HFT is a market maker, but most market making is high frequency." },
    { id: "m5", topic: "makers", q: "Why is a market maker's liquidity described as a choice, not a promise?",
      opts: ["It can widen, shrink or cancel its quotes at any moment, above all when markets turn violent", "It must quote at all times by CME rule, so it never leaves", "Its quotes are locked in for the whole day once posted", "It only quotes when the exchange asks it to"],
      ex: "A market maker earns the spread only while buys and sells arrive in balance, so when the market turns one sided it protects itself by stepping back. In ES nothing obliges an ordinary market maker to stay. The book is only as deep as the people choosing to wait in it." },
    { id: "m6", topic: "makers", q: "Why does a market maker's bid tend to get filled most heavily just before the price falls?",
      opts: ["Sellers in a hurry hit bids hardest when prices are about to drop", "The exchange routes falling market orders to market makers first", "Market makers raise their bids when they expect a fall", "Bids only fill when the spread is wider than one tick"],
      ex: "This is adverse selection at industrial scale. The orders that fill a market maker's bid come from people in a hurry to sell, and that hurry is itself a sign the price is heading lower. Its inventory grows exactly when holding it hurts." },
    { id: "m7", topic: "makers", q: "Which statement about high frequency traders and market makers is accurate?",
      opts: ["Most market making today is high frequency, but not every HFT is a market maker", "Every high frequency trader is a market maker, by definition of the term", "High frequency traders are not allowed to make markets in ES at all", "Market makers quote by hand, and only HFTs use computer programs"],
      ex: "Market making today is mostly done by programs reacting in millionths of a second, so most of it is high frequency. But speed is a tool, not a job description. Some HFTs take liquidity rather than provide it." },

    // ================= zero sum
    { id: "z1", topic: "zerosum", q: "Why is ES zero sum before costs?",
      opts: ["Every contract has one side that gains what the other loses on any price move", "The S&P 500 never changes over the long run", "The exchange keeps all the profits from trading", "Market makers always win what everyone else loses"],
      ex: "A futures contract is an agreement between two sides. Whatever one gains on a move, the other loses. Add up everyone and the total is zero before fees." },
    { id: "z2", topic: "zerosum", q: "Add up the results of everyone trading ES after exchange fees and broker commissions. What is the total?",
      opts: ["Below zero, so the market is negative sum", "Exactly zero, the same as before costs", "Above zero, because the economy grows", "Above zero, because the exchange pays traders"],
      ex: "Before costs, every point one side gains the other loses, so the total is exactly zero. Fees and commissions leave the system to the exchange and brokers, so after them the total is below zero. The spread is different. It moves points from takers to makers inside the system, so it is a real cost for you as a taker, but it cancels out in the grand total." },
    { id: "z3", topic: "zerosum", q: "Which question should every day trading strategy you test be able to answer?",
      opts: ["Who is on the other side paying me, and why are they willing to?", "Which indicator gives the signal for each trade?", "How many trades does it take per day?", "Which famous trader uses the same setup?"],
      ex: "In a negative sum market a real edge has to be paid for by someone who is in more of a hurry, knows less, or trades for reasons unrelated to the next few minutes, like a hedger." },
    { id: "z4", topic: "zerosum", q: "Why is owning stocks for years not zero sum, even though trading ES for minutes is?",
      opts: ["Companies earn profits for owners over years. Over minutes there is none, only transfers", "Stocks are regulated by the SEC, while futures have no regulator at all", "Stocks cannot fall to zero, but futures prices can go all the way down", "Stock trades have no spread, so nothing is lost when you trade them"],
      ex: "Long term owners share in the businesses' earnings. A trade lasting minutes has no earnings to share, so one side's gain is the other's loss." },
    { id: "z5", topic: "zerosum", q: "Your backtest shows a profitable ES strategy, but you cannot say who loses the money you make. Why is that a warning sign?",
      opts: ["Every gain is someone's loss, so an edge with no payer may be luck or a testing error", "It is not a warning sign, since profits come from the market rising", "It only matters for strategies that use market orders", "Backtests already include the other side, so nobody needs naming"],
      ex: "Over minutes there are no company profits to share. If you make a point, someone else lost it. A real edge comes with a story, someone in more of a hurry, someone who knows less, or a hedger trading for reasons unrelated to the next ten minutes. No story often means no edge." },
    { id: "z6", topic: "zerosum", q: "A fund sells ES to protect its stock portfolio and does not care much about the next ten minutes. In the lesson's model, what role can it play for a day trader?",
      opts: ["One of the people who pays the day trader, since it trades for reasons besides short term price", "None, because hedgers only trade after the close", "A guaranteed loser on every trade the day trader takes against it", "A market maker, earning the spread from day traders"],
      ex: "A hedger is paying for protection, not trying to win the next ten minutes, so it will accept a slightly worse price to get its job done. That kind of trader's losses can fund someone else's short term gains. It is a model, not a guarantee." },

    // ================= May 6, 2010
    { id: "c1", topic: "crash", q: "What was the key instruction given to the 75,000 contract sell program on May 6, 2010?",
      opts: ["Sell at about 9% of the previous minute's volume, with no regard to price or time", "Sell only while the price stayed above a limit set at the start of the day", "Sell all 75,000 contracts as one market order in the first minute", "Sell only to designated market makers, never to other traders"],
      ex: "Without regard to price made it a pure taker that would sell into whatever bids existed. Tying its speed to volume meant that when volume exploded, it sold faster." },
    { id: "c2", topic: "crash", q: "Why did hot potato trading among HFTs make things worse?",
      opts: ["It inflated volume, so the volume tied sell program sold faster into almost no real buyers", "HFTs refused to trade with anyone, so volume dried up and prices froze", "It cancelled the sell program's remaining orders before they could fill", "It pushed prices up sharply and set off a wave of stop buy orders"],
      ex: "Between 2∶45∶13 and 2∶45∶27 HFTs traded over 27,000 contracts, about 49 percent of volume, while buying only about 200 net. The volume looked like liquidity but was not." },
    { id: "c3", topic: "crash", q: "What is the difference between volume and liquidity?",
      opts: ["Volume counts what traded. Liquidity is what is waiting in the book to absorb an order", "They are two names for the same thing", "Liquidity counts what traded. Volume is what is waiting", "Volume is measured in dollars and liquidity in contracts"],
      ex: "May 6 had enormous volume and almost no liquidity. By 2∶45∶28 resting buy orders in ES were under 1 percent of their depth at the start of the day." },
    { id: "c4", topic: "crash", q: "Why did a share of Accenture trade at one cent?",
      opts: ["Real bids were pulled, and market sells hit a one cent stub quote, the best bid left", "The company announced bad news that afternoon", "A computer glitch printed a number that never really traded", "A trader chose to sell at one cent on purpose"],
      ex: "A market order takes the best bid that exists. When liquidity providers withdrew, the best bid left was a placeholder at one cent. Nobody chose that price. The empty book chose it. The trades were real, which is why they had to be cancelled afterward." },
    { id: "c5", topic: "crash", q: "What happened to the stock trades executed 60% or more away from their 2∶40 pm prices?",
      opts: ["The exchanges cancelled them after the close as clearly erroneous", "They stood, and the traders kept the gains and losses", "They were repriced to the day's closing price", "They were moved to settle on the next day"],
      ex: "More than 20,000 trades in over 300 securities were broken. Ordinary slippage in a thin book is not cancelled. Only absurd prices are." },
    { id: "c6", topic: "crash", q: "On May 6, which order type would have protected a seller from selling at one cent?",
      opts: ["A limit sell", "A market sell", "A stop sell that becomes a market order", "A larger market sell, to finish quickly"],
      ex: "A limit sell cannot fill below its limit. The price of that protection is that if the market falls through your limit and keeps falling, you are still holding." },
    { id: "c7", topic: "crash", q: "The same seller once took more than five hours to sell 75,000 ES contracts. On May 6 its program sold them in about twenty minutes. What made the difference?",
      opts: ["This program watched only volume, not price or time, so rising volume sped it up", "ES contracts were cheaper on May 6, so it could sell more at once", "The exchange gave the program priority over other orders", "High frequency traders refused to trade with anyone else"],
      ex: "The earlier sale used methods that took price, time and volume into account. This one targeted 9 percent of the previous minute's volume and nothing else. When hot potato trading made volume explode, the program read it as liquidity and sold faster into a book that was emptying." },
    { id: "c8", topic: "crash", q: "What is CME's Stop Logic designed to watch for?",
      opts: ["A burst of triggered stop orders about to push the price too far, too fast", "Traders who place too many stop orders in one day", "Stop orders placed at prices that are not on a tick", "Market makers who pull their quotes before news"],
      ex: "Stop Logic watches for the stop cascade from Chapter 4, triggered stops turning into market orders that would drive the price beyond a set range in an instant. When that is about to happen it pauses the market for a few seconds so new orders can arrive. On May 6 it paused ES at 2∶45∶28 pm for five seconds." },
    { id: "c9", topic: "crash", q: "Which two changes did regulators make later in 2010 because of May 6?",
      opts: ["They banned stub quotes and added five minute pauses for stocks moving 10% in five minutes", "They banned high frequency trading and required every order to be a limit order", "They banned stop orders and capped how many contracts can trade per day", "They closed ES each afternoon at 2∶30 pm and banned execution algorithms"],
      ex: "Stub quotes were the one cent bids that market sells hit, so they were banned. Single stock pauses stop a falling stock long enough for buyers to come back, the same idea as the five second Stop Logic pause in ES." },
    { id: "c10", topic: "crash", q: "By 2∶45∶28 pm on May 6, how much resting buy interest was left in ES, according to the joint SEC and CFTC report?",
      opts: ["Fewer than 1,050 contracts, under 1% of the depth at the start of the day", "About half of the depth at the start of the day", "About 75,000 contracts, the size of the sell program", "None at all, the bid side was completely empty"],
      ex: "Under 1 percent. The waiting room had almost emptied, so each market sell walked a long way down. That is how ES fell 1.7 percent in fifteen seconds to its low of 1,056." },
    { id: "c11", topic: "crash", q: "At first HFTs absorbed much of the selling on May 6. What did they do next, and why?",
      opts: ["Sold about 2,000 contracts back as aggressors, to shed inventory in a falling market", "Kept buying steadily until the sell program had finished all 75,000", "Stopped trading completely and stayed out until after 3∶00 pm", "Bought another 75,000 contracts to match the seller and stop the fall"],
      ex: "HFTs built a net position of about 3,300 contracts bought. They do not want to hold inventory in a falling market, so between 2∶41 and 2∶44 pm they sold about 2,000 back by crossing the spread. The buyers of the first wave became sellers." },
    { id: "c12", topic: "crash", q: "A friend says the flash crash proves Accenture's real value dropped for a few minutes. What is the best correction?",
      opts: ["The price is only the last trade. Bids vanished and market sells hit a one cent placeholder", "Correct, because the market is always right about value", "The price never reached one cent. It was only a data error", "Value and price are the same, so both fell and recovered"],
      ex: "The trades really happened, which is why they had to be cancelled afterward. But they reflected an empty book, not an opinion about the company. Price and value came apart because the machinery of waiting orders broke down." },

    // ================= candles
    { id: "k1", topic: "candles", q: "What is the open of a 1 minute candle?",
      opts: ["The price of the first trade in that minute", "The best ask at the start of the minute", "The average price of all trades in the minute", "The close of the previous trading day"],
      ex: "The open is the first trade in the window, the close is the last, and the high and low are the extremes. Those four numbers are the whole candle." },
    { id: "k2", topic: "candles", q: "When is a candle drawn filled in the lesson, or red on a standard TradingView candle chart?",
      opts: ["When its close is below its open", "When most of its volume was aggressive selling", "When its low is below the previous candle's low", "When its range is wider than the candle before it"],
      ex: "The fill or color compares only the close with the open of that same candle. It says nothing about who was aggressive or about the candles around it." },
    { id: "k3", topic: "candles", q: "In general, which of these can you NOT tell from a single candle?",
      opts: ["Whether the high happened before the low", "The highest price traded in the window", "Whether it closed above its open", "The price of the last trade in the window"],
      ex: "The path inside the window is thrown away. Two opposite minutes can produce the identical candle. The high, the open versus close comparison, and the last trade are exactly the numbers a candle keeps." },
    { id: "k4", topic: "candles", q: "What does the volume bar under a candle show?",
      opts: ["How many contracts traded during that candle's window", "How many contracts were waiting in the book", "How far the price moved during the window", "How many more contracts were bought than sold"],
      ex: "Volume counts what traded. It does not show the book, and as May 6 proved, it does not measure liquidity. Bought always equals sold, so it cannot be a count of extra buying." },
    { id: "k5", topic: "candles", q: "What does a candle tell you about the order book during its window?",
      opts: ["Nothing directly. A candle is built only from trades", "How deep the bids were at each price", "Where the stop orders were waiting", "Which market makers were quoting"],
      ex: "A chart summarizes the tape. The book, the stops and the aggressors are all invisible in it, which is why chart patterns have to be tested rather than believed." },
    { id: "k6", topic: "candles", q: "On a candle, what does the thick body span?",
      opts: ["From the open to the close", "From the low to the high", "From the open to the high", "From the best bid to the best ask"],
      ex: "The body runs between the first and last trade of the window. The thin wicks reach out to the high and the low. On a hollow candle the open is the bottom of the body. On a filled one it is the top." },
    { id: "k7", topic: "candles", q: "Thirty seconds into a 1 minute candle the price is below the open, so the forming candle is filled. Can it still finish hollow?",
      opts: ["Yes. If the minute's last trade is above the open, the close is above the open", "No. Once a candle is filled it stays filled", "No. The fill is decided by the first half of the minute", "Only if the high of the minute comes after the low"],
      ex: "A candle's fill compares the close with the open, and the close is simply the last trade of the window. Until the window ends the latest price keeps changing, so a forming candle can flip from filled to hollow and back. Judge a candle only after it closes." },
    { id: "k8", topic: "candles", q: "During a minute, which event leaves the forming 1 minute candle exactly as it was?",
      opts: ["A large buy limit order is added to the book and nothing trades", "A trade prints above every earlier trade in the minute", "A trade prints below every earlier trade in the minute", "A trade prints inside the minute's range, at a price different from the last trade"],
      ex: "Candles are built only from trades. A new high moves the high, a new low moves the low, and any trade at a new price becomes the latest price, which is the close so far. An order resting in the book changes nothing on the chart." },
    { id: "k9", topic: "candles", q: "Two different minutes of ES produce candles with exactly the same open, high, low and close. What can you conclude about how trading went inside them?",
      opts: ["Nothing. Opposite paths can produce the same four numbers", "Both minutes followed the same path, one faster than the other", "Buyers were in control during both minutes", "Both minutes must have had the same volume"],
      ex: "A candle keeps four numbers and throws away the path. In one minute buyers can win early and late, in the other sellers can win early and buyers the rest, and the candle is identical. Volume is a separate bar and can differ completely." },
    { id: "k10", topic: "candles", q: "How do you find the high of a 5 minute candle from the five 1 minute candles inside it?",
      opts: ["Take the highest of the five highs", "Take the high of the last 1 minute candle", "Take the average of the five highs", "Take the highest of the five closes"],
      ex: "The 5 minute high is the highest trade in those five minutes, which is the high of whichever 1 minute candle contains it. The open comes from the first candle, the close from the last, and the low is the lowest of the five lows." },
    { id: "k11", topic: "candles", q: "Why does this course treat chart patterns as claims to be tested on data?",
      opts: ["A candle is four numbers from trades. It hides the path, book, aggressors and stops", "Charting software often draws candles with wrong prices", "Chart patterns only work on stocks, not on futures", "Exchanges do not allow trading on chart patterns"],
      ex: "A shape on a chart is a summary that has thrown away almost everything that caused it. Any story read from it is a guess about a path nobody drew. The honest move is to define the pattern exactly and test whether it predicts anything." },
    { id: "k12", topic: "candles", q: "A 3 minute candle has open 6,010.00, high 6,012.25, low 6,007.00 and close 6,010.00. What does it look like?",
      opts: ["A body with no height, with wicks up to 6,012.25 and down to 6,007.00", "A filled candle, because the price fell during the window", "A hollow candle, because the high is above the open", "A tall body from 6,007.00 up to 6,012.25"],
      ex: "The body spans open to close, and both are 6,010.00, so the body is a flat line. The wicks show the extremes. Any fall or rally inside the window has vanished. Only the four numbers survive." },
    { id: "k13", topic: "candles", q: "A candle's open is 6,004.00, its close 6,002.50 and its high 6,006.25. Which statement must be true?",
      opts: ["It is a filled candle with an upper wick reaching 6,006.25", "It is a hollow candle with an upper wick", "The high happened before the low", "The lowest trade of the window was the close"],
      ex: "The close is below the open, so the candle is filled, and the top of a filled body is the open, 6,004.00. The high is above that, so an upper wick reaches 6,006.25. Whether the high came before the low, and where the low is, the candle in the question does not tell you." },

    // ================================================================ generators
    { id: "g-avg", topic: "slippage", gen: function (R) {
        var buy, b, lv, qty, w, avg, guard = 0;
        do { // redraw when the plain unweighted mean of the prices touched would round to the right answer by luck
          buy = R.int(0, 1) === 1; b = mkBook(R, 3, 3, 3, 9); lv = buy ? b.asks : b.bids;
          qty = R.int(lv[0][1] + 1, Math.min(cum(lv, 3), 20)); w = walk(lv, qty); avg = w.cost / qty;
          var nt = w.parts.length, um = 0; for (var u = 0; u < nt; u++) um += lv[u][0] / nt; guard++;
        } while (Math.abs(Math.round(um * 100) / 100 - avg) <= 0.0051 && guard < 50);
        var slip = buy ? avg - lv[0][0] : lv[0][0] - avg;
        return { type: "num", q: "Here is the ES book. You send a market " + (buy ? "buy" : "sell") + " for " + qty + " contracts. What is your average fill price? Round to two decimals." + show(b),
          answer: Math.round(avg * 10000) / 10000, tol: 0.0051,
          ex: "A market " + (buy ? "buy takes the asks from the lowest price up" : "sell takes the bids from the highest price down") + ". You fill " + w.parts.join(", then ") + ". That is " + w.costs.join(" plus ") + ", which is " + fp(w.cost) + " for " + qty + " contracts. Divide and you get " + f4(avg) + (Math.abs(avg * 100 - Math.round(avg * 100)) > 1e-6 ? ", which rounds to " + fp(Math.round(avg * 100) / 100) : "") + ". The best " + (buy ? "ask" : "bid") + " was " + fp(lv[0][0]) + ", so your slippage is about " + f4(Math.round(slip * 10000) / 10000) + " points per contract." };
      } },
    { id: "g-slip", topic: "slippage", gen: function (R) {
        var buy = R.int(0, 1) === 1, b = mkBook(R, 3, 3, 3, 9), lv = buy ? b.asks : b.bids;
        var qty = R.int(lv[0][1] + 1, Math.min(cum(lv, 3), 20)), w = walk(lv, qty), avg = w.cost / qty;
        var slip = buy ? avg - lv[0][0] : lv[0][0] - avg;
        return { type: "num", q: "Here is the ES book. You send a market " + (buy ? "buy" : "sell") + " for " + qty + " contracts. Compared with the best " + (buy ? "ask" : "bid") + " when you sent it, what is your slippage in points per contract? Give it as a positive number, rounded to two decimals." + show(b),
          answer: Math.round(slip * 10000) / 10000, tol: 0.0051,
          ex: "You " + (buy ? "buy " : "sell ") + w.parts.join(", then ") + ". The total is " + fp(w.cost) + ", so the average is " + f4(avg) + ". The best " + (buy ? "ask" : "bid") + " was " + fp(lv[0][0]) + ", so slippage is " + f4(Math.round(slip * 10000) / 10000) + " points per contract, about " + Math.abs(Math.round(slip * 100) / 100).toFixed(2) + ". Only the contracts beyond the best level paid extra." };
      } },
    { id: "g-last", topic: "orders", gen: function (R) {
        var buy = R.int(0, 1) === 1, b = mkBook(R, 4, 4, 3, 18), lv = buy ? b.asks : b.bids;
        var j = R.int(0, 3), qty = R.int(cum(lv, j) + 1, cum(lv, j + 1)), w = walk(lv, qty);
        var opts = [fp(w.last)];
        lv.forEach(function (x) { if (fp(x[0]) !== fp(w.last)) opts.push(fp(x[0])); });
        return { type: "mcq", q: "Here is the ES book. A trader sends a market " + (buy ? "buy" : "sell") + " for " + qty + " contracts. What is the last price right after it finishes?" + show(b),
          opts: opts,
          ex: "The order " + (buy ? "buys " : "sells ") + w.parts.join(", then ") + ". The last of those trades is the new last price, " + fp(w.last) + "." + (j === 0 ? " The whole order fit inside the best level, so the price did not move." : " The order was bigger than the best level, so it walked " + tick(j) + " and moved the price itself.") };
      } },
    { id: "g-mid", topic: "spread", gen: function (R) {
        var bid = base(R), k = R.int(1, 4), ask = bid + 0.25 * k, sp = ask - bid, mid = (ask + bid) / 2;
        var opts = ["Spread " + sp.toFixed(2) + ", mid " + fpx(mid), "Spread " + (2 * sp).toFixed(2) + ", mid " + fpx(mid), "Spread " + sp.toFixed(2) + ", mid " + fpx(ask), "Spread " + k.toFixed(2) + ", mid " + fpx(mid)];
        return { type: "mcq", q: "Best bid " + fp(bid) + ", best ask " + fp(ask) + ". What are the spread, in points, and the mid price?",
          opts: opts, ex: "The spread is " + fp(ask) + " minus " + fp(bid) + ", which is " + sp.toFixed(2) + " points, or " + tick(k) + " of 0.25. The mid is halfway between them, " + fpx(mid) + "." + (k % 2 === 1 ? " That is not a multiple of 0.25, so nothing can ever trade there. The mid is arithmetic, not a price." : " Even when the mid lands on a tick, nothing forces a trade to happen there.") };
      } },
    { id: "g-ticks", topic: "spread", gen: function (R) {
        var k = R.int(1, 6), b = mkBook(R, 3, 3, 3, 12, k);
        // the biggest bars sit away from the best prices, the classic misreading
        b.bids[0][1] = R.int(2, 6); b.bids[1][1] = R.int(30, 60); b.asks[0][1] = R.int(2, 6); b.asks[2][1] = R.int(30, 60);
        return { type: "num", q: "Here is the ES book. How many ticks wide is the spread?" + show(b), answer: k, tol: 0.001,
          ex: "The best bid is the highest bid price, " + fp(b.bid) + ", and the best ask is the lowest ask price, " + fp(b.ask) + ", whatever the sizes. The spread is " + pts(b.ask - b.bid) + ", and each tick is 0.25 points, so it is " + tick(k) + "." + (k > 1 ? " Counting the " + (k - 1) + " empty row" + (k > 2 ? "s" : "") + " between them gives one less than the answer. Count steps between prices, not rows." : "") };
      } },
    { id: "g-round", topic: "spread", gen: function (R) {
        var n = R.int(2, 6), k = R.int(1, 3), sp = 0.25 * k, bid = base(R), ask = bid + sp;
        return { type: "num", q: "Best bid " + fp(bid) + ", best ask " + fp(ask) + ". You buy " + n + " contracts with a market order and immediately sell all " + n + " with a market order. The book does not change. Before fees, how many points did you lose in total across all " + n + " contracts? Give the loss as a positive number.",
          answer: n * sp, tol: 0.001,
          ex: "Each contract is bought at the ask, " + fp(ask) + ", and sold at the bid, " + fp(bid) + ", losing the spread, " + pts(sp) + ". Times " + n + " contracts is " + pts(n * sp) + ". The price never moved. That loss is purely the cost of being in a hurry twice." };
      } },
    { id: "g-rt", topic: "orders", gen: function (R) {
        var n = R.int(1, 5), k = R.int(1, 2), bid = base(R), ask = bid + 0.25 * k;
        var mIn = R.int(0, 1) === 1, mOut = R.int(0, 1) === 1, pin = mIn ? ask : bid, pout = mOut ? bid : ask, r = n * (pout - pin);
        return { type: "num", q: "Best bid " + fp(bid) + ", best ask " + fp(ask) + ". You buy " + n + " contract" + (n > 1 ? "s" : "") + " with " + (mIn ? "a market buy" : "a limit buy at the best bid, which gets filled") + ", and later sell " + (n > 1 ? "all " + n : "it") + " with " + (mOut ? "a market sell" : "a limit sell at the best ask, which gets filled") + ". Assume the best bid and best ask stay at these prices the whole time. Before fees, what is your total result in points? Use a negative number for a loss.",
          answer: r, tol: 0.001,
          ex: (mIn ? "The market buy is a taker and pays the ask, " + fp(ask) + "." : "The limit buy rests at the bid, and when a seller hits it, it fills at its own price, " + fp(bid) + ".") + " " + (mOut ? "The market sell is a taker and gets the bid, " + fp(bid) + "." : "The limit sell rests at the ask and fills at its own price, " + fp(ask) + ".") + " Per contract that is " + fp(pout) + " minus " + fp(pin) + ", and over " + n + " contract" + (n > 1 ? "s" : "") + " it is " + res(r) + ". Takers pay the spread and makers collect it. In real markets the maker's fills come with adverse selection, so the patient route is not free money." };
      } },
    { id: "g-mkt", topic: "orders", gen: function (R) {
        var bid = base(R), ask = bid + 0.25, kind = R.int(0, 3), q, opts, ex;
        if (kind === 0) { var L = ask + 0.25 * R.int(1, 3);
          q = "Best bid " + fp(bid) + ", best ask " + fp(ask) + ". You send a limit buy for 1 at " + fp(L) + ". What happens?";
          opts = ["It trades at once at " + fp(ask), "It trades at once at " + fp(L), "It rests in the book at " + fp(L), "It is rejected for being above the best ask"];
          ex = "Your limit reaches past the best ask, so it matches the resting seller immediately. Trades happen at the resting order's price, " + fp(ask) + ", which is better than your limit. A limit priced through the other side is a marketable limit order, and it took liquidity."; }
        else if (kind === 1) { var L2 = bid - 0.25 * R.int(1, 3);
          q = "Best bid " + fp(bid) + ", best ask " + fp(ask) + ". You send a limit buy for 1 at " + fp(L2) + ". What happens?";
          opts = ["It rests in the book at " + fp(L2) + " and adds liquidity", "It trades at once at " + fp(ask), "It trades at once at " + fp(L2), "It trades at once at the mid price"];
          ex = "Nobody is selling that low. The cheapest seller wants " + fp(ask) + ". So the order waits in the book below the best bid. It made liquidity."; }
        else if (kind === 2) { var L3 = bid - 0.25 * R.int(0, 2);
          q = "Best bid " + fp(bid) + ", best ask " + fp(ask) + ". You send a limit sell for 1 at " + fp(L3) + ". What happens?";
          opts = L3 === bid ? ["It trades at once at " + fp(bid), "It rests in the book at " + fp(bid) + " as the new best ask", "It trades at once at the mid price", "It is rejected, because a sell cannot be priced at the bid"]
            : ["It trades at once at " + fp(bid), "It trades at once at " + fp(L3), "It rests in the book at " + fp(L3), "It trades at once at the mid price"];
          ex = "Your limit reaches the best bid, so it matches the waiting buyer immediately, at the resting price, " + fp(bid) + "." + (L3 < bid ? " You accepted as little as " + fp(L3) + ", but a buyer was already paying more." : "") + " A sell priced at or through the bid takes liquidity."; }
        else { var L4 = ask + 0.25 * R.int(0, 2);
          q = "Best bid " + fp(bid) + ", best ask " + fp(ask) + ". You send a limit sell for 1 at " + fp(L4) + ". What happens?";
          opts = ["It rests in the book at " + fp(L4) + " and adds liquidity", "It trades at once at " + fp(bid), "It trades at once at " + fp(L4), "It trades at once at the mid price"];
          ex = "No buyer will pay " + fp(L4) + ". The highest bid is " + fp(bid) + ". The order waits among the asks" + (L4 === ask ? ", at the back of the line at the best ask" : "") + ". It made liquidity."; }
        return { type: "mcq", q: q, opts: opts, ex: ex };
      } },
    { id: "g-mlfill", topic: "slippage", gen: function (R) {
        var buy = R.int(0, 1) === 1, b = mkBook(R, 4, 4, 3, 12), lv = buy ? b.asks : b.bids, j = R.int(1, 2);
        var L = lv[j][0], avail = cum(lv, j + 1), Q = R.int(Math.max(2, avail - 8), avail + 10), f = Math.min(Q, avail), w = walk(lv, f);
        return { type: "num", q: "Here is the ES book. You send a limit " + (buy ? "buy" : "sell") + " for " + Q + " contracts at " + fp(L) + ". How many of them fill immediately?" + show(b),
          answer: f, tol: 0.001,
          ex: "Your limit lets you " + (buy ? "buy at " + fp(L) + " or lower" : "sell at " + fp(L) + " or higher") + ", so it trades against the " + (buy ? "asks" : "bids") + " from " + fp(lv[0][0]) + " through " + fp(L) + ", which hold " + avail + " contracts. It fills " + w.parts.join(", then ") + ", " + f + " in all." + (Q > avail ? " The limit stops it from reaching " + fp(lv[j + 1][0]) + ", so the other " + (Q - avail) + " wait in the book as a " + (buy ? "bid" : "ask") + " at " + fp(L) + "." : " That covers the whole order, so nothing is left to rest.") };
      } },
    { id: "g-mlbook", topic: "orders", gen: function (R) {
        var buy = R.int(0, 1) === 1, b = mkBook(R, 4, 4, 3, 12), j = R.int(0, 1), lv = buy ? b.asks : b.bids, L = lv[j][0], avail = cum(lv, j + 1);
        var Q = R.int(avail + 1, avail + 10), nxt = lv[j + 1][0];
        var key = buy ? [L, nxt] : [nxt, L], oldB = b.bid, oldA = b.ask;
        var cand = [key, buy ? [oldB, nxt] : [nxt, oldA], [oldB, oldA], buy ? [L, oldA] : [oldB, L], [L, L]];
        var opts = [], seen = {};
        cand.forEach(function (c) { var s = "Best bid " + fp(c[0]) + ", best ask " + fp(c[1]); if (!seen[s] && opts.length < 4) { seen[s] = 1; opts.push(s); } });
        return { type: "mcq", q: "Here is the ES book. You send a limit " + (buy ? "buy" : "sell") + " for " + Q + " contracts at " + fp(L) + ". Right after, what are the best bid and best ask?" + show(b),
          opts: opts,
          ex: "Your limit reaches the " + (buy ? "asks" : "bids") + " up to " + fp(L) + ", which hold " + avail + " contracts, so those trade at once and that side of the book is used up through " + fp(L) + ". The other " + (Q - avail) + " contracts cannot go past your limit, so they wait in the book as a " + (buy ? "bid" : "ask") + " at " + fp(L) + ", the new best " + (buy ? "bid" : "ask") + ". The best " + (buy ? "ask" : "bid") + " is now the next level, " + fp(nxt) + ". A bid and an ask at the same price would trade, so they can never both rest there." };
      } },
    { id: "g-depth", topic: "book", gen: function (R) {
        var buy = R.int(0, 1) === 1, b = mkBook(R, 5, 5, 3, 15), lv = buy ? b.asks : b.bids, j = R.int(1, 4), need = cum(lv, j) + 1;
        return { type: "num", q: "Here is the ES book. What is the smallest market " + (buy ? "buy" : "sell") + ", in contracts, that makes the last price print at " + fp(lv[j][0]) + "?" + show(b),
          answer: need, tol: 0.001,
          ex: "To trade at " + fp(lv[j][0]) + " the order must first use up every contract at the better levels, " + lv.slice(0, j).map(function (x) { return x[1] + " at " + fp(x[0]); }).join(", ") + ", which is " + cum(lv, j) + " contracts. One more contract then prints at " + fp(lv[j][0]) + ", so the answer is " + need + ". That is depth in action. The more that waits in front, the more it takes to move the price." };
      } },
    { id: "g-queue", topic: "priority", gen: function (R) {
        var P = base(R), S = R.int(2, 10), A = R.int(5, 40), Bh = R.int(3, 30), X = R.int(0, 1) ? R.int(1, A - 1) : 0;
        var ahead = A - X, kase = R.int(0, 2), M = kase === 0 ? R.int(1, ahead) : kase === 1 ? ahead + R.int(1, S - 1) : ahead + S + R.int(0, 10), f = Math.max(0, Math.min(S, M - ahead));
        return { type: "num", q: "You are bidding " + fp(P) + " for " + S + " ES contracts, and " + fp(P) + " is the best bid. In the line at " + fp(P) + ", " + A + " contracts arrived before yours and " + Bh + " arrived after." + (X ? " Then " + X + " of the contracts ahead of you are cancelled." : "") + " A market sell for " + M + " contracts arrives. How many of your " + S + " contracts are filled?",
          answer: f, tol: 0.001,
          ex: (X ? "After the cancels, " + A + " minus " + X + " leaves " + ahead + " contracts ahead of you. " : "There are " + ahead + " contracts ahead of you. ") + "First in, first out means the market sell fills them first. " + (M <= ahead ? "It is only " + M + " contracts, so it never reaches you. You get 0, even though the price traded at your level." : "That leaves " + (M - ahead) + " for you, so you get " + f + (M - ahead > S ? ", all of your order" : "") + ".") + " The " + Bh + " contracts behind you do not matter, since they can only fill after you." };
      } },
    { id: "g-aggr", topic: "sides", gen: function (R) {
        var n = R.int(5, 7), bid = base(R), rows = [], buyQ = 0, sellQ = 0, s = R.int(1, 5), t, guard = 0;
        do {
          rows = []; buyQ = 0; sellQ = 0; var bb = bid; s = R.int(1, 5);
          for (var i = 0; i < n; i++) {
            if (i > 0) bb += 0.25 * R.int(-1, 1);
            var atAsk = R.int(0, 1) === 1, size = R.int(1, 20), price = atAsk ? bb + 0.25 : bb;
            rows.push([s, bb, bb + 0.25, price, size, atAsk]); if (atAsk) buyQ += size; else sellQ += size;
            s += R.int(2, 9);
          }
          guard++;
        } while ((buyQ === 0 || sellQ === 0) && guard < 50);
        var list = rows.map(function (r) { return "<li>" + clock(r[0]) + "  bid " + fp(r[1]) + "  ask " + fp(r[2]) + "  trade " + fp(r[3]) + "  size " + r[4] + "</li>"; }).join("");
        return { type: "num", q: "Here is part of the ES tape, with the best bid and best ask at the moment of each trade. How many contracts traded with a buyer as the aggressor?<ol class=\"qlist\">" + list + "</ol>",
          answer: buyQ, tol: 0.001,
          ex: "Compare each trade price with the quote at that moment. A trade at the ask is a buyer crossing the spread, and a trade at the bid is a seller crossing. " + rows.map(function (r) { return r[4] + " at " + fp(r[3]) + " was at the " + (r[5] ? "ask, a buyer" : "bid, a seller"); }).join(". ") + ". Buyers were the aggressors for " + buyQ + " contracts and sellers for " + sellQ + ". Every one of the " + (buyQ + sellQ) + " contracts still had a buyer and a seller." };
      } },
    { id: "g-zs", topic: "zerosum", gen: function (R) {
        var n = R.int(1, 5), p1 = base(R), d = R.int(1, 16) * (R.int(0, 1) ? 1 : -1), p2 = p1 + 0.25 * d, askA = R.int(0, 1) === 1;
        var ra = n * (p2 - p1), ans = askA ? ra : -ra;
        return { type: "num", q: "Trader A buys " + n + " ES contract" + (n > 1 ? "s" : "") + " from trader B at " + fp(p1) + ". Neither trades again. Later the price is " + fp(p2) + ". Measured at " + fp(p2) + " and before fees, what is trader " + (askA ? "A" : "B") + "'s result in points across all " + n + " contract" + (n > 1 ? "s" : "") + "? Use a negative number for a loss.",
          answer: ans, tol: 0.001,
          ex: "The price moved " + pts(Math.abs(p2 - p1)) + (d > 0 ? " up" : " down") + ". A bought, so A gains when it rises and loses when it falls. B is on the other side of the very same contracts. A's result is " + res(ra) + " and B's is " + res(-ra) + ". They add to zero, which is what zero sum means." };
      } },
    { id: "g-mm", topic: "makers", gen: function (R) {
        var bid = base(R), ask = bid + 0.25, k = R.int(2, 12), bal = R.int(0, 2) === 0, d = R.int(2, 8), z = bid - 0.25 * d;
        var r = bal ? k * (ask - bid) : k * (z - bid);
        var q = "A market maker quotes bid " + fp(bid) + " and ask " + fp(ask) + " in ES. " + (bal ? "One trader sells " + k + " contracts to its bid, and another buys " + k + " contracts from its ask." : "Sellers hit its bid for " + k + " contracts and nobody buys from its ask. The price falls, and the market maker sells all " + k + " with a market sell that fills at " + fp(z) + ".") + " Before fees, what is its total result in points? Use a negative number for a loss.";
        return { type: "num", q: q, answer: r, tol: 0.001,
          ex: bal ? "It bought " + k + " at " + fp(bid) + " and sold " + k + " at " + fp(ask) + ", earning the spread, 0.25 points, on each, " + res(r) + ". This is the dream, buys and sells arriving in balance, with no view on direction needed." :
            "It bought " + k + " at " + fp(bid) + " and had to dump them at " + fp(z) + ", " + pts(bid - z) + " lower, for " + res(r) + ". One sided selling piled up inventory while the price fell. That is the market maker's main risk, and why it pulls quotes when markets turn violent." };
      } },
    { id: "g-stop", topic: "stops", gen: function (R) {
        var b, t, M, S, fire, guard = 0;
        do {
          b = mkBook(R, 2, 5, 3, 12); fire = R.int(0, 3) > 0; t = fire ? R.int(0, 1) : 1;
          M = fire ? R.int(cum(b.bids, t) + 1, cum(b.bids, t + 1)) : R.int(1, b.bids[0][1]);
          var restAll = cum(b.bids, 5) - M; S = R.int(2, Math.max(2, restAll - 1)); guard++;
        } while (S >= cum(b.bids, 5) - M && guard < 50);
        var T = b.bids[t][0], left = b.bids.map(function (x) { return x.slice(); }), m = M;
        for (var i = 0; i < left.length && m > 0; i++) { var u = Math.min(m, left[i][1]); left[i][1] -= u; m -= u; }
        var w1 = walk(b.bids, M), w2 = fire ? walk(left, S) : null, end = fire ? w2.last : w1.last;
        // the result under the opposite assumption, a strong distractor
        var alt = fire ? w1.last : walk(left, S).last;
        var opts = [fp(end)], add = function (p) { if (opts.indexOf(fp(p)) < 0 && opts.length < 4) opts.push(fp(p)); };
        add(alt); add(T); b.bids.forEach(function (x) { add(x[0]); });
        return { type: "mcq", q: "Here is the ES book. Outside the book, where nobody can see them, stop sells totalling " + S + " contracts have a trigger at " + fp(T) + ". A trader sends a market sell for " + M + ". No other orders arrive. Where is the last price once everything has finished trading?" + show(b),
          opts: opts,
          ex: "The " + M + " contract sale fills " + w1.parts.join(", then ") + ". " + (fire ? "That prints a trade at " + fp(T) + ", the trigger, so the " + S + " stop contracts wake up as market sells and fill " + w2.parts.join(", then ") + ". The last of those, " + fp(end) + ", is the price. A small sale released orders nobody could see." : "Its last trade is at " + fp(w1.last) + ", above the trigger at " + fp(T) + ", so no trade printed at the trigger. The stops never wake up, and the last price is " + fp(end) + ". Emptying the level above the trigger is not enough. A trade has to print at the trigger itself.") };
      } },
    { id: "g-stoplim", topic: "stops", gen: function (R) {
        var T = base(R), Q = R.int(3, 20), j = R.int(1, 3), Lm = T - 0.25 * j, g = R.int(0, 4), bb = T - 0.25 * g, bids = [];
        for (var i = 0; i < 4; i++) bids.push([bb - 0.25 * i, R.int(2, 10)]);
        var bk = { bids: bids, asks: [[T + 0.25, R.int(3, 12)], [T + 0.5, R.int(3, 12)]], bid: bb, ask: T + 0.25 };
        var avail = 0; bids.forEach(function (x) { if (x[0] >= Lm - 1e-9) avail += x[1]; });
        var f = Math.min(Q, avail);
        return { type: "num", q: "A trade just printed at " + fp(T) + ", triggering your stop limit sell for " + Q + " contracts with a limit of " + fp(Lm) + ". Here is the book at that instant, and nobody else is selling. How many of your contracts fill at once?" + show(bk),
          answer: f, tol: 0.001,
          ex: "Once triggered, a stop limit becomes a limit sell at " + fp(Lm) + ". It can sell only to bids at " + fp(Lm) + " or higher. " + (avail === 0 ? "The highest bid is " + fp(bb) + ", already below your limit, so nothing fills. The price fell straight through your limit and you are still holding all " + Q + "." : "Those hold " + avail + " contracts, so you fill " + f + "." + (Q > avail ? " The other " + (Q - avail) + " wait in the book as an ask at " + fp(Lm) + ", and if the price keeps falling you are still holding them." : " That is your whole order, so this time the limit cost you nothing.")) + (f < Q ? " A plain stop would have sold everything by walking further down the bids. The stop limit swaps a guaranteed exit for a guaranteed worst price." : "") };
      } },
    { id: "g-candle", topic: "candles", gen: function (R) {
        var n = R.int(2, 5), p = base(R), cs = [];
        for (var i = 0; i < n; i++) {
          var o = i === 0 ? p : p + 0.25 * R.int(-1, 1), c = o + 0.25 * R.int(-8, 8), h = Math.max(o, c) + 0.25 * R.int(0, 5), l = Math.min(o, c) - 0.25 * R.int(0, 5);
          cs.push([o, h, l, c]); p = c;
        }
        var O = cs[0][0], C = cs[n - 1][3], H = Math.max.apply(null, cs.map(function (x) { return x[1]; })), Lo = Math.min.apply(null, cs.map(function (x) { return x[2]; }));
        var key = [O, H, Lo, C], last = cs[n - 1];
        var cand = [[O, H, last[2], C], [last[0], H, Lo, C], [O, last[1], Lo, C], [O, H, Lo, cs[0][3]], [O, H + 0.25, Lo, C], [O, H, Lo - 0.25, C], [O, H + 0.5, Lo, C]];
        var opts = [ohlc(key)];
        cand.forEach(function (x) { var s = ohlc(x); if (validC(x) && opts.indexOf(s) < 0 && opts.length < 4) opts.push(s); });
        var list = cs.map(function (x) { return "<li>" + ohlc(x) + "</li>"; }).join("");
        return { type: "mcq", q: "These are " + n + " consecutive 1 minute ES candles. What is the single " + n + " minute candle they make?<ol class=\"qlist\">" + list + "</ol>",
          opts: opts, ex: "Open of the first candle, " + fp(O) + ". Highest of the highs, " + fp(H) + ". Lowest of the lows, " + fp(Lo) + ". Close of the last candle, " + fp(C) + ". Every timeframe is the same tape cut into different windows." };
      } },
    { id: "g-tape", topic: "candles", gen: function (R) {
        var n, ps, guard = 0;
        do {
          n = R.int(6, 9); ps = [base(R)];
          for (var i = 1; i < n; i++) ps.push(ps[i - 1] + 0.25 * (R.int(1, 3)) * (R.int(0, 1) ? 1 : -1));
          var O = ps[0], C = ps[n - 1], H = Math.max.apply(null, ps), Lo = Math.min.apply(null, ps); guard++;
        } while ((O === C || H <= Math.max(O, C) || Lo >= Math.min(O, C)) && guard < 200);
        var secs = [], s = R.int(0, 4);
        for (var k = 0; k < n; k++) { secs.push(s); s += R.int(2, 7); }
        var key = [O, H, Lo, C];
        var cand = [[C, H, Lo, O], [O, Math.max(O, C), Math.min(O, C), C], [O, H, Lo, ps[n - 2]], [O, H + 0.25, Lo, C], [O, H, Lo - 0.25, C]];
        var opts = [ohlc(key)];
        cand.forEach(function (x) { var t = ohlc(x); if (validC(x) && opts.indexOf(t) < 0 && opts.length < 4) opts.push(t); });
        var list = ps.map(function (x, i) { return "<li>" + clock(secs[i]) + "  trade at " + fp(x) + "</li>"; }).join("");
        return { type: "mcq", q: "Here is every ES trade in one minute, in time order. What 1 minute candle do they make?<ol class=\"qlist\">" + list + "</ol>",
          opts: opts, ex: "The open is the first trade, " + fp(O) + ", and the close is the last, " + fp(C) + ". The high is the highest trade anywhere in the minute, " + fp(H) + ", and the low the lowest, " + fp(Lo) + ". The wicks matter. A candle that only spans open to close has thrown away the extremes, and swapping open and close flips the candle's color." };
      } },
    { id: "g-wick", topic: "candles", gen: function (R) {
        var o = base(R), c, guard = 0;
        do { c = o + 0.25 * R.int(-10, 10); guard++; } while (c === o && guard < 50);
        var h = Math.max(o, c) + 0.25 * R.int(1, 8), l = Math.min(o, c) - 0.25 * R.int(1, 8), part = R.int(0, 2), up = c > o;
        var names = ["upper wick", "lower wick", "body"], ans = [h - Math.max(o, c), Math.min(o, c) - l, Math.abs(c - o)][part];
        return { type: "num", q: "A 1 minute ES candle has open " + fp(o) + ", high " + fp(h) + ", low " + fp(l) + " and close " + fp(c) + ". How long is its " + names[part] + ", in points?",
          answer: ans, tol: 0.001,
          ex: "The close is " + (up ? "above" : "below") + " the open, so it is " + (up ? "a hollow candle and the body runs from the open at the bottom, " + fp(o) + ", to the close at the top, " + fp(c) : "a filled candle and the body runs from the open at the top, " + fp(o) + ", down to the close, " + fp(c)) + ". " +
            (part === 0 ? "The upper wick runs from the top of the body, " + fp(Math.max(o, c)) + ", to the high, " + fp(h) + ", so it is " + pts(ans) + "." + (up ? "" : " Measuring from the close instead would be wrong here, because on a filled candle the top of the body is the open.") :
             part === 1 ? "The lower wick runs from the bottom of the body, " + fp(Math.min(o, c)) + ", down to the low, " + fp(l) + ", so it is " + pts(ans) + "." + (up ? " On a hollow candle the bottom of the body is the open, not the close." : "") :
             "The body is the distance between open and close, " + pts(ans) + ". The wicks are not part of it.") };
      } }
  ];

  // The slippage topic holds only generators on purpose. The app's composer takes one item per topic and then
  // has only 3 free slots left (15 minus 12 topics) to reach its minimum of 4 calculation questions, so at least one
  // topic must be generator only or some exams would get just 3.
  TA.BANKS[1] = {
    week: 1,
    examSize: 15,
    topics: { price: "What a price is", book: "The order book", spread: "Spread and mid", priority: "Price time priority", orders: "Order types", slippage: "Fills and slippage", stops: "Stop orders", sides: "Aggressors and price moves", makers: "Market makers and HFT", zerosum: "Who pays you", crash: "May 6, 2010", candles: "Candles" },
    items: items
  };
})();
