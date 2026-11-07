/* Investing Week 1 question bank. Static questions list the correct option FIRST. The app shuffles.
   Generators return a fresh question with new numbers every time they are drawn. Numeric answers store the
   exact value with a tolerance of half the requested rounding unit, so either rounding of an exact tie passes
   and anything one unit off fails.
   Two topics, ratios and growth, hold only generators on purpose. The composer takes one item per topic
   (12 topics) and has only 3 free slots left to reach its minimum of 4 calculation questions, so two
   generator only topics guarantee that every exam can reach 4. */
window.TA = window.TA || {};
TA.BANKS = TA.BANKS || {};
(function () {
  // ---------------- helpers
  function usd(x, d) { d = d == null ? 2 : d; return "$" + x.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function usd0(x) { return "$" + Math.round(x).toLocaleString("en-US"); }
  function n0(x) { return Math.round(x).toLocaleString("en-US"); }
  function mil(x) { return x >= 1000 ? (x / 1000).toLocaleString("en-US", { maximumFractionDigits: 3 }) + " billion" : x.toLocaleString("en-US") + " million"; }
  function pct(x, d) { return x.toFixed(d == null ? 1 : d) + "%"; }
  function uniq(arr, n) { var o = []; arr.forEach(function (x) { if (o.indexOf(x) < 0 && o.length < (n || 4)) o.push(x); }); return o; }
  function r2(x) { return Math.round(x * 100) / 100; }

  var items = [
    // ================= share. What a share is
    { id: "s1", topic: "share", q: "What does owning one share of a company give you?",
      opts: ["A fraction of the whole company, including its profits", "A loan the company must repay with interest", "A right to a discount on the company's products", "A promise that the share price will rise"],
      ex: "A share is a piece of ownership. Owning it means owning part of everything the company has and earns. It is not a loan, it carries no discount, and nobody promises the price." },
    { id: "s2", topic: "share", q: "What are a company's shares outstanding?",
      opts: ["The total number of its shares that exist", "The shares that traded today", "The shares owned by the founders", "The shares the company plans to sell later"],
      ex: "Shares outstanding is the count of all shares in existence. Your ownership fraction is your shares divided by that number." },
    { id: "s3", topic: "share", q: "You own 300 of a shop's 1,200 shares. What fraction of each year's profit belongs to you?",
      opts: ["25%", "30%", "12%", "4%"],
      ex: "300 ÷ 1,200 = 0.25, so a quarter of the shop and a quarter of every dollar of its profit." },
    { id: "s4", topic: "share", q: "Ronald Read kept paper stock certificates in a safe deposit box. What do most owners have instead today?",
      opts: ["An electronic record at their broker", "A paper certificate mailed by the company each year", "A receipt from the stock exchange for every purchase", "A copy of the company's register of owners"],
      ex: "Ownership is now recorded electronically. The meaning is identical to the paper certificate. You still own a fraction of the business." },
    { id: "s5", topic: "share", q: "What is a stock, in the sense used on this course?",
      opts: ["The shares of one company", "Any investment traded on an exchange", "A futures contract on a company", "The total value of the market"],
      ex: "A stock means the shares of a single company. Owning Procter and Gamble stock means owning some of its shares." },
    { id: "s6", topic: "share", q: "If nobody traded a company's shares for a whole year, would the shares still be worth owning?",
      opts: ["Yes, they would still own part of the company and its profits", "No, a share only has value while it trades", "No, the company would cancel shares that do not trade", "Only if the company announced a new price"],
      ex: "A share is a fraction of a real business, not a bet on the next trade. Its owner is still entitled to the profits whether or not anyone trades it." },
    { id: "g-own", topic: "share", gen: function (R) {
        var out = R.int(2, 60) * 50, mine = R.int(1, 40) * 5;
        if (mine >= out) mine = Math.floor(out / 10);
        var p = mine / out * 100;
        return { type: "num", q: "A company has " + n0(out) + " shares outstanding and you own " + n0(mine) + ". What percent of the company do you own? Round to two decimals.",
          answer: p, tol: 0.005 + 1e-9,
          ex: "Your fraction is " + n0(mine) + " ÷ " + n0(out) + " = " + (mine / out).toFixed(5) + ", which is about " + pct(p, 2) + " of everything the company owns and earns." };
      } },
    { id: "g-slice", topic: "share", gen: function (R) {
        var shares = R.int(2, 40) * 100, eps = R.int(150, 900) / 100, ans = shares * eps;
        return { type: "num", q: "A company's earnings per share this year are " + usd(eps) + ". You own " + n0(shares) + " shares. How many dollars of this year's profit belong to you? Round to the nearest dollar.",
          answer: ans, tol: 0.5 + 1e-9,
          ex: "Your slice is shares times EPS, " + n0(shares) + " × " + usd(eps) + " = " + usd(ans) + ". It is yours whether the company pays it out or keeps it." };
      } },

    // ================= measures. Market cap, EPS, P/E concepts
    { id: "m1", topic: "measures", q: "What is market capitalization?",
      opts: ["Share price times shares outstanding", "The company's total yearly profit", "The cash the company has in the bank", "Share price times yearly earnings"],
      ex: "Market cap multiplies the last traded price by the number of shares. It is what the market is charging for the whole company at that moment." },
    { id: "m2", topic: "measures", q: "Why is market cap described as a price rather than a value?",
      opts: ["It is just the last trade times the share count", "It ignores the company's debts and its cash entirely", "It is set by the company's own managers each quarter", "It is calculated only once a year by the exchange"],
      ex: "Market cap inherits everything about price from Trading Week 1. If the last trade drops 10% in a nervous hour, market cap drops 10% too, with no change in the business." },
    { id: "m3", topic: "measures", q: "How is earnings per share calculated?",
      opts: ["Yearly earnings divided by shares outstanding", "Share price divided by yearly earnings", "Dividends divided by share price", "Yearly earnings divided by market cap"],
      ex: "EPS is the slice of profit belonging to one share, earnings ÷ shares outstanding. Price ÷ EPS is the P/E, and dividend ÷ price is the yield." },
    { id: "m4", topic: "measures", q: "What are a company's earnings?",
      opts: ["Revenue left after all costs and taxes", "The total money customers paid the company", "The cash the company pays out to its shareholders", "The rise in the share price over the year"],
      ex: "Earnings, or profit, is revenue minus every cost including taxes. Revenue is the total customers paid. Dividends are only the part of earnings paid out." },
    { id: "m5", topic: "measures", q: "Two companies both earn $1 billion a year. One has 100 million shares and the other 1 billion. Which statement is correct?",
      opts: ["The first has EPS of $10 and the second $1, but each company earns the same total", "The first company is ten times more profitable", "The second company is the better business because it has more shares", "Their EPS is identical because profits are identical"],
      ex: "EPS divides the same $1 billion by different share counts. The businesses earn the same. Comparing EPS across companies without the share count tells you little." },
    { id: "m6", topic: "measures", q: "A company's share price rises 20% while its share count and earnings are unchanged. What happens to its market cap and its P/E?",
      opts: ["Both rise 20%", "Market cap rises 20% and P/E is unchanged", "P/E rises 20% and market cap is unchanged", "Neither changes, because the business is the same"],
      ex: "Market cap is price times shares, so it rises 20%. P/E is price divided by EPS, and EPS did not change, so P/E rises 20% too." },
    { id: "m7", topic: "measures", q: "What does a P/E of 25 mean in plain words?",
      opts: ["A share costs 25 years of this year's earnings", "The company is expected to grow 25% this year", "The share pays 25% of its price as dividends each year", "The company has 25 times more shares than a year ago"],
      ex: "P/E is price divided by EPS. A P/E of 25 means a share costs 25 times what it earned this year." },

    // ================= ratios. generator only
    { id: "g-cap", topic: "ratios", gen: function (R) {
        var sh = R.int(2, 90) * 50, price = R.int(1500, 40000) / 100, cap = sh * price; // sh in millions
        var right = mil(r2(cap)), w1 = mil(r2(cap / 10)), w2 = mil(r2(sh + price)), w3 = mil(r2(cap * 10));
        return { type: "mcq", q: "A company has " + mil(sh) + " shares outstanding and the last trade was " + usd(price) + ". What is its market cap, in dollars?",
          opts: uniq(["$" + right, "$" + w1, "$" + w2, "$" + w3]),
          ex: "Market cap = shares × price = " + mil(sh) + " × " + usd(price) + " = $" + right + "." };
      } },
    { id: "g-eps", topic: "ratios", gen: function (R) {
        var sh = R.int(1, 60) * 50, earn = R.int(10, 2000) * 5, eps = earn / sh; // millions
        return { type: "num", q: "A company earned $" + mil(earn) + " this year and has " + mil(sh) + " shares outstanding. What is its earnings per share? Answer in dollars to the cent.",
          answer: eps, tol: 0.005 + 1e-9,
          ex: "EPS = earnings ÷ shares outstanding = $" + mil(earn) + " ÷ " + mil(sh) + " = " + usd(eps, 4) + ", which rounds to " + usd(eps) + "." };
      } },
    { id: "g-pe", topic: "ratios", gen: function (R) {
        var eps = R.int(50, 1200) / 100, pe = R.int(80, 400) / 10, price = r2(eps * pe), real = price / eps;
        return { type: "num", q: "A share trades at " + usd(price) + " and the company's EPS is " + usd(eps) + ". What is the P/E? Round to one decimal.",
          answer: real, tol: 0.05 + 1e-9,
          ex: "P/E = price ÷ EPS = " + usd(price) + " ÷ " + usd(eps) + " = " + real.toFixed(3) + ", about " + real.toFixed(1) + ". The market is charging that many years of this year's earnings." };
      } },
    { id: "g-yield", topic: "ratios", gen: function (R) {
        var q = R.int(10, 150) / 100, price = R.int(2000, 25000) / 100, y = 4 * q / price * 100;
        return { type: "num", q: "A company pays a dividend of " + usd(q) + " per share every quarter. The share trades at " + usd(price) + ". What is the dividend yield, in percent? Round to two decimals.",
          answer: y, tol: 0.005 + 1e-9,
          ex: "The yearly dividend is 4 × " + usd(q) + " = " + usd(4 * q) + ". Yield = " + usd(4 * q) + " ÷ " + usd(price) + " = " + (y / 100).toFixed(5) + ", about " + pct(y, 2) + ". Forgetting to multiply by four gives a yield a quarter of the real one." };
      } },
    { id: "g-price", topic: "ratios", gen: function (R) {
        var eps = R.int(100, 900) / 100, pe = R.int(8, 35), price = eps * pe;
        return { type: "num", q: "A company's EPS is " + usd(eps) + " and the market pays a P/E of " + pe + ". What share price does that imply? Answer in dollars to the cent.",
          answer: price, tol: 0.005 + 1e-9,
          ex: "Price = EPS × P/E = " + usd(eps) + " × " + pe + " = " + usd(price) + "." };
      } },
    { id: "g-capeps", topic: "ratios", gen: function (R) {
        var sh = R.int(2, 40) * 50, eps = R.int(100, 800) / 100, pe = R.int(10, 30), price = eps * pe, cap = sh * price, earn = sh * eps;
        var right = mil(r2(cap)), w1 = mil(r2(earn)), w2 = mil(r2(cap / pe)), w3 = mil(r2(sh * pe));
        return { type: "mcq", q: "A company has " + mil(sh) + " shares outstanding, EPS of " + usd(eps) + ", and trades at a P/E of " + pe + ". What is its market cap?",
          opts: uniq(["$" + right, "$" + w1, "$" + w3, "$" + mil(r2(cap * 2))]),
          ex: "First the price, EPS × P/E = " + usd(eps) + " × " + pe + " = " + usd(price) + ". Then market cap = shares × price = " + mil(sh) + " × " + usd(price) + " = $" + right + ". Total earnings, $" + w1 + ", is a different thing." };
      } },

    // ================= dividends
    { id: "d1", topic: "dividends", q: "What is a dividend?",
      opts: ["Cash a company pays its owners out of its profits", "The profit a trader makes selling a share", "A fee owners pay to keep their shares", "New shares a company sells to raise money"],
      ex: "A dividend is part of the company's profit paid to owners in cash, set as an amount per share and usually paid quarterly in the US." },
    { id: "d2", topic: "dividends", q: "What does dividend yield measure?",
      opts: ["The yearly dividend as a percent of the share price", "The share of profit paid out as dividends", "How fast the dividend has grown", "The dividend paid in one quarter"],
      ex: "Yield = yearly dividend ÷ price. It lets you compare cash payouts across companies with very different share prices." },
    { id: "d3", topic: "dividends", q: "On a share's ex dividend date, the first day a buyer no longer gets the coming payment, what typically happens to the price?",
      opts: ["It drops by about the dividend amount", "It rises by about the dividend amount", "It stays the same, since dividends are extra", "It halves, because the cash is split"],
      ex: "The cash is about to leave the company, and a buyer from that day will not receive it. So each share carries that much less and the price adjusts by roughly the dividend." },
    { id: "d4", topic: "dividends", q: "Why is a dividend not free extra money on top of owning the share?",
      opts: ["It is the company's own cash leaving, so each share carries less", "It is taxed away in full before it reaches the owner", "It has to be paid back to the company within a year", "It is paid only to the largest owners, not to everyone"],
      ex: "The dividend moves value from inside the company to your account. At that moment your total, share plus cash, is unchanged. The real gain was the profit that produced it." },
    { id: "d5", topic: "dividends", q: "According to its April 2026 announcement, Procter and Gamble had raised its dividend for how many years in a row?",
      opts: ["70", "136", "25", "10"],
      ex: "P&G said it had increased its dividend for 70 consecutive years and had paid one for 136 consecutive years, since it was incorporated in 1890." },
    { id: "d6", topic: "dividends", q: "A share's price falls while its dividend stays the same. What happens to the dividend yield?",
      opts: ["It rises, since the same dividend is a bigger share of a lower price", "It falls, because the shares are now worth less than before", "It stays the same, because the dividend itself did not change", "It turns negative, because owners are now losing money"],
      ex: "Yield = dividend ÷ price. A smaller price with the same dividend gives a larger percentage. A very high yield can be a sign that the price has fallen because people doubt the dividend will last." },
    { id: "d7", topic: "dividends", q: "How often do most large US companies pay dividends?",
      opts: ["Every quarter", "Every month", "Once every five years", "Only when the share price rises"],
      ex: "Most US dividend payers pay four times a year. That is why a quarterly amount must be multiplied by four to get the yearly dividend." },

    // ================= buybacks
    { id: "b1", topic: "buybacks", q: "What is a share buyback?",
      opts: ["The company buys its own shares and cancels them", "Owners sell their shares back to the stock exchange", "The company hands out new shares to its employees", "A trader buys back shares after selling them short"],
      ex: "In a buyback the company spends cash buying its own shares from owners who want to sell, then cancels them, so fewer shares exist." },
    { id: "b2", topic: "buybacks", q: "A company buys back and cancels shares, and its total profit does not change. What happens to its EPS?",
      opts: ["It rises, since the same profit is split among fewer shares", "It falls, because the company spent cash on the buyback", "It stays the same, because total profit did not change", "It drops to zero for the cancelled shares and stays elsewhere"],
      ex: "EPS = earnings ÷ shares. Fewer shares with the same earnings means a bigger slice per share." },
    { id: "b3", topic: "buybacks", q: "You own 1 of a company's 20 shares and do nothing while it buys back and cancels 4 shares. What fraction do you own now?",
      opts: ["1 of 16, which is 6.25%", "1 of 20, which is 5%", "1 of 24, about 4.2%", "4 of 20, which is 20%"],
      ex: "16 shares remain and you still hold 1, so you own 1 ÷ 16 = 6.25%. Before, you owned 5%. Your fraction grew without you buying anything, but the company spent its own cash to buy those shares, so at a fair price your slice is worth about the same." },
    { id: "b4", topic: "buybacks", q: "In a buyback, which owners receive cash?",
      opts: ["Only the owners who choose to sell to the company", "Every owner, in proportion to the shares they hold", "Only the largest owners, who negotiate with the company", "Nobody, because the cash goes to the stock exchange"],
      ex: "A buyback pays only the sellers. A dividend pays every owner. That choice is the main practical difference between the two cash paths." },
    { id: "b5", topic: "buybacks", q: "A company's EPS rose 10% this year. Why is that alone not proof the business grew?",
      opts: ["A buyback can raise EPS with no growth in profit", "EPS always rises with inflation, whatever the business does", "EPS rises automatically whenever the share price rises", "EPS leaves out the company's costs, so it always grows"],
      ex: "If the share count shrinks by about 9%, EPS rises about 10% with exactly the same profit. Check total earnings and the share count, not just EPS." },
    { id: "g-bb", topic: "buybacks", gen: function (R) {
        var sh = R.int(4, 40) * 25, cut = R.int(1, 8) * 5, earn = R.int(20, 400) * 5, eps0 = earn / sh, eps1 = earn / (sh - cut);
        if (cut >= sh / 2) cut = Math.floor(sh / 10 / 5) * 5 || 5;
        eps1 = earn / (sh - cut);
        return { type: "num", q: "A company earns $" + mil(earn) + " a year and has " + mil(sh) + " shares. It buys back and cancels " + mil(cut) + " shares, and earnings stay the same. What is the new EPS? Answer in dollars to the cent.",
          answer: eps1, tol: 0.005 + 1e-9,
          ex: "Before, EPS was $" + mil(earn) + " ÷ " + mil(sh) + " = " + usd(eps0, 4) + ". After, " + mil(sh - cut) + " shares remain, so EPS = $" + mil(earn) + " ÷ " + mil(sh - cut) + " = " + usd(eps1, 4) + ", about " + usd(eps1) + "." };
      } },
    { id: "g-bbown", topic: "buybacks", gen: function (R) {
        var sh = R.int(20, 200) * 10, mine = R.int(1, 10) * 5, cut = R.int(1, 10) * 10;
        if (cut > sh / 2) cut = sh / 4;
        var before = mine / sh * 100, after = mine / (sh - cut) * 100;
        return { type: "num", q: "A company has " + n0(sh) + " shares and you own " + mine + ". It buys back and cancels " + n0(cut) + " shares from other owners. What percent of the company do you own now? Round to two decimals.",
          answer: after, tol: 0.005 + 1e-9,
          ex: "Before, you owned " + mine + " ÷ " + n0(sh) + " = " + pct(before, 3) + ". After, " + n0(sh - cut) + " shares exist, so you own " + mine + " ÷ " + n0(sh - cut) + " = " + pct(after, 3) + ", about " + pct(after, 2) + "." };
      } },

    // ================= paths. Where profit goes
    { id: "w1", topic: "paths", q: "What are the three ways a profitable company can deliver its profit to its owners?",
      opts: ["Pay dividends, buy back shares, or reinvest in the business", "Raise prices, cut costs, or borrow money", "Issue shares, pay bonuses, or pay taxes", "List on an exchange, split its shares, or merge"],
      ex: "Profit can leave as cash (dividends), shrink the share count (buybacks), or stay inside to grow future profit (reinvestment)." },
    { id: "w2", topic: "paths", q: "How does reinvested profit benefit owners who receive no cash from it?",
      opts: ["It can grow the company's future profits, which belong to them", "It is paid to them later with interest", "It raises the share price immediately by the same amount", "It reduces the number of shares they own"],
      ex: "Profit kept in the business builds stores, factories and products. If those earn more than the owners could earn on that money elsewhere, future earnings and each owner's slice of them grow by more than a payout would have." },
    { id: "w3", topic: "paths", q: "When can reinvesting profit make owners poorer?",
      opts: ["When the projects it funds earn less than they cost", "Whenever the company skips its dividend for a year", "Whenever the share price happens to fall that year", "Never, because keeping profit always adds value for owners"],
      ex: "Reinvestment only helps if the projects pay off. Wasting kept profit on bad projects destroys value that could have been paid out. Judging this is part of Investing Week 4." },
    { id: "w4", topic: "paths", q: "Where does the money delivered by all three paths ultimately come from?",
      opts: ["Customers buying the company's products and services", "Other investors who sell their shares too cheaply", "The stock exchange", "New owners buying shares from the company"],
      ex: "Dividends, buybacks and reinvestment all spend the company's profit, and profit comes from customers. That is why ownership does not require anyone else to lose." },
    { id: "w5", topic: "paths", q: "A company earns $100 million. It pays $40 million in dividends and spends $25 million on buybacks. How much is left to reinvest?",
      opts: ["$35 million", "$60 million", "$75 million", "$65 million"],
      ex: "$100 million − $40 million − $25 million = $35 million kept in the business." },
    { id: "w6", topic: "paths", q: "Which statement about dividends versus buybacks is correct?",
      opts: ["Dividends pay every owner, buybacks pay only the owners who sell", "Dividends raise EPS, buybacks do not", "Buybacks pay every owner, dividends pay only large owners", "They are the same thing with different names"],
      ex: "A dividend goes to every share. A buyback sends cash only to sellers and leaves the remaining owners with bigger slices." },

    // ================= price. Price versus earnings
    { id: "p1", topic: "price", q: "Why does a share's price move every day even when the business has not changed?",
      opts: ["The price is the last trade, pushed by orders and changing opinions", "The company updates its profit figures every trading day", "The exchange adjusts every price for inflation each morning", "Dividends are recalculated and repriced every trading day"],
      ex: "This is Trading Week 1. Price is just the last trade, and the order book moves with every arriving and departing order." },
    { id: "p2", topic: "price", q: "Price = EPS × P/E. If a share's price changes, what are the only two possible reasons?",
      opts: ["The earnings changed, or the multiple paid for them changed", "The dividend changed, or the number of shares changed", "Inflation changed, or interest rates changed that day", "The exchange changed, or the broker's prices changed"],
      ex: "Because P/E is defined as price ÷ EPS, every price move is a change in EPS, a change in P/E, or both. Things like news and rates matter only through those two." },
    { id: "p3", topic: "price", q: "Over a single week, what drives most of a large company's share price movement?",
      opts: ["The multiple and the order book, since earnings barely move", "Changes in the company's earnings that week", "Changes in the number of shares outstanding that week", "The size of the dividend the company paid that week"],
      ex: "In a week the business is nearly fixed, so the movement is mostly changing opinions and order flow. Over decades, earnings growth dominates." },
    { id: "p4", topic: "price", q: "Over thirty years, what usually explains most of a successful company's share price growth?",
      opts: ["Growth in its earnings", "A rising P/E that keeps rising forever", "Daily trading volume", "The number of times it was mentioned in the news"],
      ex: "A multiple can swing for years, but it cannot keep rising forever. Earnings can keep compounding, and over decades the price follows them." },
    { id: "p5", topic: "price", q: "Why is the idea that P/E drifts around a middle value over decades called a model rather than a law?",
      opts: ["It held in the past, but multiples can stay high or low for years", "P/E cannot be measured with any real accuracy at all", "The formula Price = EPS × P/E is sometimes simply false", "P/E only applies to companies that pay out dividends"],
      ex: "Price = EPS × P/E is a definition, always true. The behavior of the multiple over time is an observation about history, with no guarantee." },
    { id: "p6", topic: "price", q: "A company's EPS doubled over ten years, but its share price did not rise at all. What must have happened?",
      opts: ["Its P/E halved", "Its P/E doubled", "It stopped paying dividends", "Its shares outstanding doubled"],
      ex: "Price = EPS × P/E. If EPS doubled and price stayed flat, P/E must have fallen by half. Owners who paid a very high multiple at the start saw the business grow and no price gain." },
    { id: "g-pex", topic: "price", gen: function (R) {
        var e = R.pick([1.2, 1.5, 2, 2.5, 3]), p0 = R.int(10, 30), p1 = R.int(8, 30), ch = (e * p1 / p0 - 1) * 100;
        return { type: "num", q: "Over ten years a company's EPS grows by a factor of " + e + " and its P/E moves from " + p0 + " to " + p1 + ". By what percent did the share price change? Round to one decimal, with a minus sign for a fall.",
          answer: ch, tol: 0.05 + 1e-9,
          ex: "Price = EPS × P/E, so the price changes by a factor of " + e + " × " + p1 + " ÷ " + p0 + " = " + (e * p1 / p0).toFixed(4) + ". That is a change of " + ch.toFixed(2) + "%." };
      } },

    // ================= growth. generator only
    { id: "g-fv", topic: "growth", gen: function (R) {
        var P = R.int(1, 20) * 500, r = R.int(3, 12), n = R.int(5, 40), fv = P * Math.pow(1 + r / 100, n);
        return { type: "num", q: "You invest " + usd0(P) + " and it grows " + r + "% a year, compounded, for " + n + " years with nothing added or taken out. What is it worth at the end? Round to the nearest dollar.",
          answer: fv, tol: 0.5 + 1e-9,
          ex: "Each year multiplies the total by " + (1 + r / 100).toFixed(2) + ", so the end value is " + usd0(P) + " × " + (1 + r / 100).toFixed(2) + " to the power " + n + " = " + usd(fv) + ". Simple growth without compounding would give only " + usd0(P * (1 + r / 100 * n)) + "." };
      } },
    { id: "g-72", topic: "growth", gen: function (R) {
        var r = R.pick([3, 4, 6, 8, 9, 12]), k = R.int(2, 4), yrs = 72 / r * k, mult = Math.pow(2, k);
        var right = "About " + mult + " times";
        return { type: "mcq", q: "Using the rule of 72, an investment growing " + r + "% a year for " + (yrs % 1 === 0 ? yrs : yrs.toFixed(1)) + " years ends up roughly how many times larger?",
          opts: uniq([right, "About " + (2 * k) + " times", "About " + (mult * 2) + " times", "About " + k + " times"]),
          ex: "At " + r + "% money doubles about every 72 ÷ " + r + " = " + (72 / r) + " years. " + (yrs % 1 === 0 ? yrs : yrs.toFixed(1)) + " years is " + k + " doublings, and 2 multiplied by itself " + k + " times is " + mult + ". Doubling is multiplication, so the doublings multiply rather than add." };
      } },
    { id: "g-dbl", topic: "growth", gen: function (R) {
        var r = R.int(3, 14), est = 72 / r;
        return { type: "num", q: "Using the rule of 72, about how many years does money take to double at " + r + "% a year? Round to one decimal.",
          answer: est, tol: 0.05 + 1e-9,
          ex: "72 ÷ " + r + " = " + est.toFixed(2) + " years. The exact doubling time is ln 2 ÷ ln " + (1 + r / 100).toFixed(2) + " = " + (Math.log(2) / Math.log(1 + r / 100)).toFixed(2) + " years, so the shortcut is close in this range." };
      } },
    { id: "g-real", topic: "growth", gen: function (R) {
        var nom = R.int(30, 140) / 10, inf = R.int(5, 60) / 10, real = ((1 + nom / 100) / (1 + inf / 100) - 1) * 100;
        return { type: "num", q: "An investment returned " + pct(nom) + " in a year when inflation was " + pct(inf) + ". What was the exact real return, in percent? Use (1 + nominal) ÷ (1 + inflation) − 1 and round to two decimals.",
          answer: real, tol: 0.005 + 1e-9,
          ex: "(1 + " + (nom / 100).toFixed(3) + ") ÷ (1 + " + (inf / 100).toFixed(3) + ") − 1 = " + (real / 100).toFixed(5) + ", which is " + pct(real, 2) + ". The quick approximation, nominal minus inflation, gives " + pct(nom - inf, 2) + "." };
      } },
    { id: "g-spent", topic: "growth", gen: function (R) {
        var P = R.int(1, 10) * 1000, d = R.pick([2, 3, 4]), g = R.int(3, 7), n = R.pick([20, 25, 30, 40]);
        var re = P * Math.pow(1 + (g + d) / 100, n), sp = P * Math.pow(1 + g / 100, n), diff = re - sp;
        return { type: "num", q: "A share's price grows " + g + "% a year and it pays a dividend yield of " + d + "% a year. You hold " + usd0(P) + " of it for " + n + " years. How many dollars more is the holding worth if you reinvest every dividend than if you spend them? Ignore the spent cash. Round to the nearest dollar.",
          answer: diff, tol: 0.5 + 1e-9,
          ex: "Reinvested, the holding compounds at the full " + (g + d) + "%, so it ends at " + usd(re) + ". Spent, the shares only grow at the price rate of " + g + "%, ending at " + usd(sp) + ". The difference is " + usd(diff) + "." };
      } },
    { id: "g-add", topic: "growth", gen: function (R) {
        var A = R.int(1, 10) * 500, r = R.int(4, 10), n = R.int(5, 30), fv = A * (Math.pow(1 + r / 100, n) - 1) / (r / 100);
        return { type: "num", q: "You add " + usd0(A) + " at the end of every year for " + n + " years, and the total grows " + r + "% a year. What is it worth right after the last deposit? Round to the nearest dollar.",
          answer: fv, tol: 0.5 + 1e-9,
          ex: "Each deposit grows for a different number of years. Adding them up gives " + usd0(A) + " × ((" + (1 + r / 100).toFixed(2) + " to the power " + n + " − 1) ÷ " + (r / 100).toFixed(2) + ") = " + usd(fv) + ". You put in " + usd0(A * n) + ", so " + usd(fv - A * n) + " is growth." };
      } },
    { id: "g-mult", topic: "growth", gen: function (R) {
        var r = R.int(4, 12), n = R.int(10, 50), m = Math.pow(1 + r / 100, n);
        return { type: "num", q: "Money grows " + r + "% a year, compounded, for " + n + " years. By what factor does it multiply? Round to two decimals.",
          answer: m, tol: 0.005 + 1e-9,
          ex: (1 + r / 100).toFixed(2) + " to the power " + n + " = " + m.toFixed(4) + ". The rule of 72 estimates " + (n / (72 / r)).toFixed(2) + " doublings, about " + Math.pow(2, n / (72 / r)).toFixed(2) + " times, close to the exact figure." };
      } },

    // ================= history. The long run record
    { id: "h1", topic: "history", q: "From 1928 through 2025, about what did US stocks, the S&P 500 with dividends reinvested, return per year on average, before inflation?",
      opts: ["About 10%", "About 3%", "About 20%", "About 1%"],
      ex: "Damodaran's NYU dataset gives a compounded average of about 10.0% a year for 1928 to 2025, before inflation." },
    { id: "h2", topic: "history", q: "Over the same period, about what was the average yearly return after inflation?",
      opts: ["About 6.8%", "About 10%", "About 13%", "About 2%"],
      ex: "With inflation averaging about 3% a year, the growth in real buying power was about 6.8% a year." },
    { id: "h3", topic: "history", q: "What is the difference between a nominal return and a real return?",
      opts: ["Nominal is in dollars of the day, real removes inflation", "Nominal includes dividends, while real leaves them out", "Nominal is measured before fees, real is after fees", "Nominal is the promised return, real is what you received"],
      ex: "Real return asks how much more you can buy. It is roughly the nominal return minus inflation." },
    { id: "h4", topic: "history", q: "From 1928 through 2025, in roughly how many of the 98 years did US stocks lose money?",
      opts: ["26", "None", "About 50", "2"],
      ex: "Stocks fell in 26 of 98 years. A strong long run average is built from many losing years." },
    { id: "h5", topic: "history", q: "About how much did US stocks fall in 1931, their worst year in the record?",
      opts: ["About 44%", "About 10%", "About 90%", "About 25%"],
      ex: "In 1931 the S&P 500 with dividends fell about 44%. In 2008 it fell about 37%." },
    { id: "h6", topic: "history", q: "Why is the 1928 to 2025 record not a guarantee for the next fifty years?",
      opts: ["It is one country over one century, and the future can differ", "The data before the year 2000 is full of known errors", "US companies have stopped paying dividends since then", "Inflation no longer exists in the modern economy"],
      ex: "It is the best evidence available, from a period when the US economy grew enormously. History informs but does not promise." },
    { id: "h7", topic: "history", q: "Who keeps the widely used table of US stock, bond and bill returns since 1928 that this lesson used?",
      opts: ["Aswath Damodaran, a professor at NYU", "The New York Stock Exchange's research team", "The Federal Reserve's economic data office", "The Securities and Exchange Commission"],
      ex: "The figures come from Aswath Damodaran's historical returns dataset at NYU's Stern School." },
    { id: "h8", topic: "history", q: "Inflation averaged about 3% a year from 1928 to 2025. What does that do to a dollar held as cash for 24 years?",
      opts: ["It buys about half as much at the end", "It buys about 3% less at the end", "It buys exactly the same", "It buys about twice as much"],
      ex: "By the rule of 72, prices double in about 72 ÷ 3 = 24 years at 3% inflation, so a dollar of cash buys roughly half as much." },

    // ================= diversify
    { id: "v1", topic: "diversify", q: "What is diversification?",
      opts: ["Spreading money over many companies so no one failure ruins you", "Buying and selling often so you catch more of the moves", "Owning only the few companies you understand best", "Keeping your savings in cash rather than in stocks"],
      ex: "Owning many companies shrinks the damage any one of them can do. It is why Lehman barely mattered to Ronald Read." },
    { id: "v2", topic: "diversify", q: "What risk does diversification NOT remove?",
      opts: ["The whole market falling together", "One company committing an accounting fraud", "One company losing a large lawsuit", "One company going bankrupt"],
      ex: "Company specific disasters are diluted by owning many companies. A market wide fall hits nearly all of them at once." },
    { id: "v3", topic: "diversify", q: "What is an index, such as the S&P 500?",
      opts: ["A list of companies plus a rule for how much of each it holds", "A single large company chosen to represent the whole market", "A fund that guarantees its owners the market's return", "The simple average share price of every US company"],
      ex: "An index is a list and a weighting rule. The S&P 500 holds about 500 large US companies weighted by market cap, and its level is calculated from their prices." },
    { id: "v4", topic: "diversify", q: "How does the S&P 500 weight its companies?",
      opts: ["By market cap, so bigger companies count for more", "Equally, each company counts the same", "By share price, so higher priced shares count for more", "By how long each company has existed"],
      ex: "Each company's weight follows its market cap. A company with twice the market cap counts twice as much." },
    { id: "v5", topic: "diversify", q: "What is an index fund?",
      opts: ["A fund that buys every company in an index, in its proportions", "A fund whose managers pick the best stocks inside an index", "A futures contract whose price follows an index level", "A savings account that pays interest linked to the market"],
      ex: "An index fund simply owns the whole list. Investing Week 2 covers them in depth." },
    { id: "v6", topic: "diversify", q: "How is the ES futures contract related to the S&P 500 index?",
      opts: ["ES bets on the index level without owning any company", "ES is a fund that owns all 500 of the companies", "ES pays its holders the dividends of the 500 companies", "ES and the S&P 500 index are not related at all"],
      ex: "ES tracks the index number. Owning the companies brings their profits. Trading ES only moves money between the contract's two sides." },
    { id: "v7", topic: "diversify", q: "What happened to Lehman Brothers shareholders when the bank went bankrupt in September 2008?",
      opts: ["They were wiped out, since owners are paid after lenders", "They were repaid in full by the US government", "Their shares were converted into the bank's bonds", "They received the bank's remaining cash before lenders"],
      ex: "Shareholders own what is left after debts are paid. In Lehman's case almost nothing was left, so the shares became nearly worthless." },
    { id: "g-loss", topic: "diversify", gen: function (R) {
        var n = R.int(5, 120), each = R.int(1, 20) * 100, tot = n * each, k = R.int(1, Math.min(3, n - 1)), loss = k * each / tot * 100;
        return { type: "num", q: "You put " + usd0(each) + " into each of " + n + " companies, " + usd0(tot) + " in total. " + (k === 1 ? "One of them goes" : k + " of them go") + " bankrupt and become worthless, and the rest are unchanged. What percent of your total did you lose? Round to two decimals.",
          answer: loss, tol: 0.005 + 1e-9,
          ex: "You lost " + k + " × " + usd0(each) + " = " + usd0(k * each) + " out of " + usd0(tot) + ", which is " + k + " ÷ " + n + " = " + pct(loss, 3) + ", about " + pct(loss, 2) + "." };
      } },

    // ================= sum. Positive sum versus zero sum
    { id: "z1", topic: "sum", q: "Why is owning shares called positive sum?",
      opts: ["Businesses earn new profit from customers, and it belongs to the owners", "Share prices always rise over long periods of time", "Every buyer of a share eventually makes money on it", "The exchange adds money to every owner's account each year"],
      ex: "The profits are new money created by the businesses. Owners as a group receive them without anyone on the other side of a trade losing." },
    { id: "z2", topic: "sum", q: "Why is an ES futures contract zero sum before fees?",
      opts: ["It is an agreement between two people, so gains and losses cancel", "The S&P 500 index level never changes in the long run", "The exchange keeps all of the profits from every contract", "Futures contracts always expire worthless for both sides"],
      ex: "An ES contract is not a piece of any business. Every point the long gains, the short loses, at any holding period." },
    { id: "z3", topic: "sum", q: "Which part of owning stocks is NOT positive sum?",
      opts: ["Gains and losses from changes in the multiple", "Dividends paid out of the company's profits", "Buybacks paid for out of the company's profits", "Profit growth that comes from reinvestment"],
      ex: "If you buy at a P/E of 30 and sell at 15, the drop is your loss and a gain for whoever bought from you at the higher price, a transfer between people. The earnings themselves are the positive sum part." },
    { id: "z4", topic: "sum", q: "A day trader buys 100 shares and sells them five minutes later for a profit. Who mostly paid for that profit?",
      opts: ["Whoever sold to them low or bought from them high", "The company, out of its earnings", "The exchange", "Nobody, because stocks are positive sum"],
      ex: "In five minutes the business earns almost nothing for its owners, so a five minute trade is effectively a transfer between traders." },
    { id: "z5", topic: "sum", q: "Why can an individual stock owner still lose money even though ownership is positive sum for owners as a group?",
      opts: ["They can buy at a high multiple and sell low, or own companies that fail", "Company profits are paid only to the large investment funds", "Dividends are always taxed away before reaching small owners", "Companies must pay back their shareholders at a loss"],
      ex: "The group collects the earnings, but individuals can buy high, sell low, or concentrate in losers. Investing Week 7 is about why so many do." },
    { id: "z6", topic: "sum", q: "What did the largest study of day traders in Taiwan, 1992 to 2006, find?",
      opts: ["Fewer than 1 in 100 could reliably beat the market after fees", "About half beat the market after fees", "Day traders as a group beat long term investors", "Most day traders broke even"],
      ex: "Barber, Lee, Liu and Odean found less than 1% of day traders could predictably and reliably earn positive abnormal returns net of fees, which means beating the market, not merely making money." },
    { id: "z7", topic: "sum", q: "What three things does long term ownership require of an investor to collect roughly the market's return?",
      opts: ["Own the businesses, keep costs low, and stay owners through bad years", "Predict the next crash, sell before it, and buy back after", "Trade often, use leverage, and follow the news", "Own one great company and never diversify"],
      ex: "The profits flow to owners by default. Costs, panic selling and concentration are what take an investor below the market's return." },

    // ================= read. Ronald Read's story
    { id: "r1", topic: "read", q: "What jobs did Ronald Read hold for most of his working life?",
      opts: ["Gas station attendant, then part time janitor", "Stockbroker, then manager at a local bank", "Factory owner, then real estate investor", "Accountant, then a financial advisor"],
      ex: "He worked about 25 years at Haviland's service station in Brattleboro and then 17 years as a part time janitor at J. C. Penney, retiring in 1997." },
    { id: "r2", topic: "read", q: "How large was Ronald Read's estate, and how much did he leave to the hospital and the library?",
      opts: ["Nearly $8 million, with $4.8 million and $1.2 million", "About $800,000, split evenly between the two", "About $80 million, almost all of it to the library", "About $2 million, almost all of it to the hospital"],
      ex: "His estate was nearly $8 million. Brattleboro Memorial Hospital received $4.8 million and Brooks Memorial Library $1.2 million, the largest gifts either had received." },
    { id: "r3", topic: "read", q: "According to The Wall Street Journal, how many companies did Ronald Read own shares in when he died?",
      opts: ["At least 95", "Exactly 3", "About 10", "More than 2,000"],
      ex: "The Journal reported at least 95 holdings across railroads, utilities, banks, health care, telecom and consumer goods." },
    { id: "r4", topic: "read", q: "What did Ronald Read generally do with the dividends his companies paid him?",
      opts: ["Used them to buy more shares", "Spent them on living costs", "Kept them in a savings account", "Gave them to charity each year"],
      ex: "The Journal reported he reinvested dividends into more shares, which compounded that part of his return." },
    { id: "r5", topic: "read", q: "Which of these companies did Ronald Read own that went bankrupt in 2008?",
      opts: ["Lehman Brothers", "Procter and Gamble", "J. M. Smucker", "CVS Health"],
      ex: "Lehman Brothers failed in September 2008 and its shares became nearly worthless. Because he owned dozens of companies, it barely dented his fortune." },
    { id: "r6", topic: "read", q: "Which kind of company did Ronald Read reportedly avoid?",
      opts: ["Technology and fashionable stocks", "Banks and other financial companies", "Makers of everyday consumer goods", "Companies that paid regular dividends"],
      ex: "He stuck to long established businesses he understood, including banks and consumer goods makers, and avoided technology and fads." },
    { id: "r7", topic: "read", q: "Why can we NOT say exactly how Ronald Read's $8 million was built year by year?",
      opts: ["Nobody published his yearly amounts or exact returns", "His records were destroyed in the 2008 financial crash", "Stock prices from before 2000 are no longer known", "He invested through secret accounts in other countries"],
      ex: "The reporting describes his holdings and habits, not his yearly contributions or returns. The lesson's numbers are a plausibility check, not his history." },
    { id: "r8", topic: "read", q: "Who lost the money Ronald Read gained?",
      opts: ["Nobody had to, because it came from his companies' profits", "The investors who sold him shares", "The traders on the other side of his ES contracts", "The hospital and library he gave it to"],
      ex: "His gains came from the profits of businesses, delivered and compounded over decades. That is the positive sum answer to the lesson's one question." },
    { id: "r9", topic: "read", q: "Investing $2,000 at the end of every year for 55 years at 10% a year ends near $3.8 million. What does that example show about Read's story?",
      opts: ["A modest earner investing for decades could plausibly get there", "Read invested exactly $2,000 every single year", "Read earned exactly 10% every year he invested", "Anyone who invests is certain to end with $4 million"],
      ex: "It is a plausibility check with made up inputs. It shows the result is possible, not what he actually did, and it assumes a market average return. It also falls short of $8 million, so he must have put in more, about $4,300 a year at that rate, or done better in some years." },

    // ================= more static, spread across topics
    { id: "s7", topic: "share", q: "A partner owns 400 of an ice cream shop's 1,000 shares. The shop earns $90,000 this year. How much of that profit is the partner's?",
      opts: ["$36,000", "$40,000", "$9,000", "$22,500"],
      ex: "400 ÷ 1,000 = 40% ownership, and 40% of $90,000 is $36,000." },
    { id: "m8", topic: "measures", q: "A company has 1 billion shares, a price of $30 and earnings of $2 billion. Which set of numbers is right?",
      opts: ["Market cap $30 billion, EPS $2, P/E 15", "Market cap $2 billion, EPS $30, P/E 15", "Market cap $30 billion, EPS $0.50, P/E 60", "Market cap $32 billion, EPS $2, P/E 30"],
      ex: "Market cap = 1 billion × $30 = $30 billion. EPS = $2 billion ÷ 1 billion = $2. P/E = $30 ÷ $2 = 15." },
    { id: "d8", topic: "dividends", q: "A share at $40 pays $0.50 each quarter. What is its dividend yield?",
      opts: ["5%", "1.25%", "12.5%", "0.5%"],
      ex: "Yearly dividend 4 × $0.50 = $2.00. $2.00 ÷ $40 = 5%." },
    { id: "b6", topic: "buybacks", q: "A company earns $300 million with 150 million shares, then buys back and cancels 30 million shares. Earnings stay the same. What is the new EPS?",
      opts: ["$2.50", "$2.00", "$1.67", "$3.00"],
      ex: "Before, EPS was $300 million ÷ 150 million = $2.00. After, 120 million remain, so EPS = $300 million ÷ 120 million = $2.50." },
    { id: "p7", topic: "price", q: "A share trades at $90 with EPS of $4.50. What is its P/E?",
      opts: ["20", "405", "0.05", "45"],
      ex: "P/E = $90 ÷ $4.50 = 20." },
    { id: "p8", topic: "price", q: "Over ten years a company's EPS triples and its P/E falls from 30 to 20. What happens to the share price?",
      opts: ["It doubles", "It triples", "It stays the same", "It falls by a third"],
      ex: "Price changes by a factor of 3 × 20 ÷ 30 = 2. The earnings growth was partly eaten by the shrinking multiple." },
    { id: "v8", topic: "diversify", q: "You put equal amounts into 50 companies and one goes to zero. What fraction of your money is lost?",
      opts: ["2%", "50%", "1%", "20%"],
      ex: "One of 50 equal stakes is 1 ÷ 50 = 2% of the total." },
    { id: "h9", topic: "history", q: "At about 10% a year, roughly how long did US stocks take to double in value on average, before inflation?",
      opts: ["About 7 years", "About 10 years", "About 3 years", "About 20 years"],
      ex: "By the rule of 72, 72 ÷ 10 = 7.2 years. The exact figure at 10% is about 7.3 years." },
    { id: "z8", topic: "sum", q: "In one year ES rises 300 points. Before fees, what is the combined gain of every ES contract holder?",
      opts: ["Zero", "300 points per contract", "The S&P 500 companies' total profit", "Half of 300 points"],
      ex: "Every long's gain is matched by a short's loss. Company profits go to share owners, not to futures holders." },
    { id: "w7", topic: "paths", q: "A drugstore chain keeps its profit and opens new stores that earn more than its owners could earn on that money elsewhere. Who benefits, and how?",
      opts: ["Every owner, as future profit per share grows", "Only the owners who sell their shares that year", "Only the managers who run the new stores", "Nobody, because no cash was paid out to owners"],
      ex: "Reinvested profit that earns a good return raises future earnings, and every owner's slice grows with them, even without a cash payment." },
    { id: "r10", topic: "read", q: "Where did Ronald Read keep the paper certificates proving his share ownership?",
      opts: ["In a safe deposit box at his bank", "With his stepchildren", "At the stock exchange", "In the library he later funded"],
      ex: "The Wall Street Journal reported a stack of certificates about five inches thick in his safe deposit box." },
    { id: "d9", topic: "dividends", q: "Which statement about a very high dividend yield is the most careful?",
      opts: ["It can mean the price fell because people doubt the dividend", "It always means the company is unusually profitable", "It guarantees that the dividend will keep on rising", "It means the share price is certain to go up soon"],
      ex: "Yield rises when price falls. Sometimes the market is pricing in a dividend cut. A high yield is a reason to look closer, not a guarantee." },
    { id: "h10", topic: "history", q: "A dollar invested in US stocks at the start of 1928 with dividends reinvested grew to roughly how much by the end of 2025, before inflation?",
      opts: ["About $11,600", "About $100", "About $1,160", "About $1.16 million"],
      ex: "Compounding the annual returns in Damodaran's table from 1928 to 2025 turns $1 into roughly $11,600, about 10% a year for 98 years." }
  ];

  TA.BANKS["i1"] = {
    week: "i1",
    examSize: 15,
    topics: { share: "What a share is", measures: "Market cap, EPS and P/E", ratios: "Company math", dividends: "Dividends", buybacks: "Buybacks", paths: "Where profit goes", price: "Price and earnings", growth: "Compounding math", history: "The long run record", diversify: "Diversification and indexes", sum: "Positive sum and zero sum", read: "Ronald Read" },
    items: items
  };
})();
