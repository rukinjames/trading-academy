/* Investing Week 1 question bank. Proposed replacement from the independent audit in review/inv/bank-review.md.
   Static questions list the correct option FIRST. The app shuffles.
   Generators return a fresh question with new numbers every time they are drawn.
   Numeric answers are stored as the correctly rounded value with a tolerance of half the requested rounding unit.
   Any draw whose exact value sits on a rounding tie is thrown away and redrawn, so exactly one rounding is right,
   the exact unrounded value is also accepted, and anything one unit off fails. Draws where a common wrong method
   would round to the right answer are redrawn too.
   The ratios topic holds only generators on purpose. The composer takes one item per topic (12 topics) and then has
   3 free slots to reach its minimum of 4 calculation questions. One generator only topic plus those 3 slots
   guarantees 4. Do not add static items to ratios. */
window.TA = window.TA || {};
TA.BANKS = TA.BANKS || {};
(function () {
  // ---------------- helpers
  function usd(x, d) { d = d == null ? 2 : d; return "$" + x.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function usd0(x) { return "$" + Math.round(x).toLocaleString("en-US"); }
  function n0(x) { return Math.round(x).toLocaleString("en-US"); }
  // x is a count or an amount in millions. Values passed in are exact to the thousandth of a billion.
  function mil(x) { return x >= 1000 ? (x / 1000).toLocaleString("en-US", { maximumFractionDigits: 3 }) + " billion" : x.toLocaleString("en-US", { maximumFractionDigits: 3 }) + " million"; }
  // fixed decimals with a true minus sign for negatives
  function fx(x, d) { var s = Math.abs(x).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }); return (x < 0 && Number(s.replace(/,/g, "")) !== 0 ? "−" : "") + s; }
  function isTie(x, u) { var f = Math.abs(x / u) % 1; return Math.abs(f - 0.5) < 1e-6; }
  function roundTo(x, u) { var d = u >= 1 ? 0 : Math.round(-Math.log10(u)); return Number((Math.round(x / u) * u).toFixed(d)); }
  function num(q, exact, u, ex) { return { type: "num", q: q, answer: roundTo(exact, u), tol: u / 2 + 1e-9, ex: ex }; }
  function r2(x) { return Math.round(x * 100) / 100; }
  function sum(a) { return a.reduce(function (s, x) { return s + x; }, 0); }

  var items = [
    // ================= share. What a share is
    { id: "s1", topic: "share", q: "What does owning one share of a company give you?",
      opts: ["A fraction of the whole company, including its profits", "A loan to the company that it must repay to you with interest", "A right to buy the company's products at a discount", "A promise from the company that its share price will rise"],
      ex: "A share is a piece of ownership. Owning it means owning part of everything the company has and part of everything it earns. It is not a loan, so nothing is ever repaid, it carries no discount, and nobody can promise a price." },
    { id: "s2", topic: "share", q: "What are a company's shares outstanding?",
      opts: ["The total number of its shares that exist", "The shares that changed hands today", "The shares still owned by the founders", "The shares the company plans to sell later"],
      ex: "Shares outstanding is the count of all the shares that exist, the number the ownership and the profit are split into. Your fraction of the company is your shares divided by that number. How many shares traded today is a different number and changes nothing about who owns what." },
    { id: "s3", topic: "share", q: "You own 300 of a shop's 1,200 shares. What fraction of each year's profit belongs to you?",
      opts: ["25%", "30%", "12%", "4%"],
      ex: "Your fraction is your shares over the shares outstanding, 300 ÷ 1,200 = 0.25. A quarter of the shop means a quarter of every dollar of its profit. Dividing the other way, 1,200 ÷ 300 = 4, gives a number, not a fraction of anything." },
    { id: "s4", topic: "share", q: "Ronald Read kept paper stock certificates in a safe deposit box. What do most owners have instead today?",
      opts: ["An electronic record at their broker", "A paper certificate mailed by the company each year", "A receipt from the stock exchange for every purchase", "A copy of the company's register of owners"],
      ex: "Ownership is now recorded electronically, almost always by the broker. The meaning is identical to the paper certificate. You still own a fraction of the business." },
    { id: "s5", topic: "share", q: "What is a stock, in the sense used on this course?",
      opts: ["The shares of one company", "Any investment traded on an exchange", "A futures contract on a company", "The total value of the market"],
      ex: "A stock means the shares of a single company. Owning Procter and Gamble stock means owning some of its shares, and so a slice of its business." },
    { id: "s6", topic: "share", q: "Suppose nobody traded a company's shares for a whole year. What would each share still represent?",
      opts: ["A fraction of the business and of the profit it earns that year", "Nothing, since a share has value only while people trade it", "A claim to a refund of whatever price was paid for it", "A vote on the next price the exchange will set for it"],
      ex: "A share is a fraction of a real business, not a bet on the next trade. The business keeps selling to customers and its profit still belongs to the owners. With no trades there is simply no new last price." },
    { id: "s7", topic: "share", q: "A partner owns 400 of an ice cream shop's 1,000 shares. The shop earns $90,000 this year. How much of that profit is the partner's?",
      opts: ["$36,000", "$40,000", "$9,000", "$22,500"],
      ex: "400 ÷ 1,000 = 40% of the shop, so 40% of its $90,000 profit, which is $36,000. That slice is the partner's whether the shop pays it out or keeps it to grow." },
    { id: "s8", topic: "share", q: "You buy 10 shares of Procter and Gamble through your broker. Who receives the money you pay?",
      opts: ["Whoever sold the shares to you, not the company", "Procter and Gamble, which creates new shares for you", "The stock exchange, which keeps it as its fee", "The broker, which holds it until the company repays you"],
      ex: "Shares of a public company change hands between investors, on one of the exchanges' order books or, for many app orders, with a wholesaler, a big trading firm that fills them. The company is on neither side of your trade and receives none of your money. That is why the price of a share is just the last trade between a buyer and a seller." },
    { id: "s9", topic: "share", q: "Why are a company's owners called residual claimants?",
      opts: ["They are paid from whatever is left after everyone else is paid", "They are paid first, before suppliers, staff and lenders", "They receive a fixed amount each year, just like a lender", "They can take their share of the company's assets at any time"],
      ex: "Residual means left over. Customers pay the company, and suppliers, staff, lenders and taxes are paid first. Only what remains, the profit, belongs to the owners. In a bad year that can be nothing at all." },
    { id: "s10", topic: "share", q: "What does limited liability mean for someone who owns shares?",
      opts: ["They can never lose more than they paid for the shares", "They can lose at most half of what they paid for the shares", "They owe a share of the company's debts if it fails", "The company must buy back their shares if the price falls"],
      ex: "If the company collapses owing billions, its lenders cannot come after the owners for the rest. The worst an owner can lose is what they paid. That is a real difference from ES, where a bad enough move can cost more than the money in the account." },
    { id: "s11", topic: "share", q: "Can an owner of a company's shares demand that it pay a dividend?",
      opts: ["No, the board the owners elect decides, so owners can only vote", "Yes, any owner can demand their slice of the profit in cash", "Yes, but only once they own at least 100 of its shares", "No, because the stock exchange sets every company's dividend"],
      ex: "Owners elect a board of directors, usually one vote per share. The board hires the managers and decides how much profit to pay out and how much to keep. An owner's power is the vote, not a demand for cash." },
    { id: "g-own", topic: "share", gen: function (R) {
        var out, mine, p, t = 0;
        do { out = R.int(2, 60) * 50; mine = R.int(1, 40) * 5; if (mine >= out) mine = out / 10; p = mine / out * 100; } while (isTie(p, 0.01) && ++t < 100);
        return num("A company has " + n0(out) + " shares outstanding and you own " + n0(mine) + ". What percent of the company do you own? Round to two decimals.", p, 0.01,
          "Your fraction is your shares over the shares outstanding, " + n0(mine) + " ÷ " + n0(out) + " = " + (mine / out).toFixed(5) + ". As a percent that is " + p.toFixed(4) + "%, which rounds to " + fx(p, 2) + "%. You own that fraction of everything the company owns and earns.");
      } },
    { id: "g-slice", topic: "share", gen: function (R) {
        var shares = R.int(2, 40) * 100, eps = R.int(150, 900) / 100, ans = shares * eps;
        return num("A company's earnings per share this year are " + usd(eps) + ". You own " + n0(shares) + " shares. How many dollars of this year's profit belong to you? Round to the nearest dollar. Type the number only, without a $ sign.", ans, 1,
          "Your slice is your shares times the profit per share, " + n0(shares) + " × " + usd(eps) + " = " + usd0(ans) + ". It is yours whether the company pays it out as a dividend or keeps it to reinvest." );
      } },

    // ================= measures. Market cap, EPS, P/E concepts
    { id: "m1", topic: "measures", q: "What is market capitalization?",
      opts: ["Share price times shares outstanding", "The company's total yearly profit", "The cash the company has in the bank", "Share price times yearly earnings"],
      ex: "Market cap multiplies the last traded price by the number of shares that exist. It is what the market is charging for the whole company at that moment." },
    { id: "m2", topic: "measures", q: "Why does the lesson call market cap a price rather than a value?",
      opts: ["It is the last trade times the share count, so it moves with mood", "It is set by the company's own managers at the end of each quarter", "It is worked out by the exchange once a year from the annual report", "It counts just the shares that changed hands in the latest session"],
      ex: "Market cap inherits everything about price from Trading Week 1. If the last trade drops 10% in a nervous hour, market cap drops 10% too, with no change at all in the factories or the customers." },
    { id: "m3", topic: "measures", q: "How is earnings per share calculated?",
      opts: ["Yearly earnings divided by shares outstanding", "Share price divided by the company's yearly earnings", "Yearly dividends per share divided by the share price", "Yearly earnings divided by market cap"],
      ex: "EPS is the slice of profit belonging to one share, earnings ÷ shares outstanding. Price ÷ EPS is the P/E, and yearly dividend ÷ price is the dividend yield." },
    { id: "m4", topic: "measures", q: "What are a company's earnings?",
      opts: ["Revenue left after all costs and taxes", "The total money customers paid the company", "The cash the company pays out to its shareholders", "The rise in the share price over the year"],
      ex: "Earnings, or profit, is what is left of revenue after every cost including taxes. Revenue is the total customers paid. Dividends are only the part of earnings that gets paid out." },
    { id: "m5", topic: "measures", q: "Two companies both earn $1 billion a year. One has 100 million shares and the other 1 billion. Which statement is correct?",
      opts: ["The first has EPS of $10 and the second $1, yet both earn the same total", "The first is ten times as profitable, because its EPS is ten times higher", "The second is the better business, because it has ten times as many shares", "Their EPS is identical, because both companies earn the same $1 billion"],
      ex: "EPS divides the same $1 billion by different share counts, $1 billion ÷ 100 million = $10 and $1 billion ÷ 1 billion = $1. The businesses earn the same. EPS compares slices, not companies, so it tells you little across companies without the share count." },
    { id: "m6", topic: "measures", q: "A company's share price rises 20% while its share count and earnings are unchanged. What happens to its market cap and its P/E?",
      opts: ["Both rise 20%", "Market cap rises 20% and P/E is unchanged", "P/E rises 20% and market cap is unchanged", "Neither changes, because the business is the same"],
      ex: "Market cap is price times shares, so it rises 20%. P/E is price divided by EPS, and EPS did not change, so P/E rises 20% too. The business did not change, only what the market charges for it." },
    { id: "m7", topic: "measures", q: "What does a P/E of 25 mean in plain words?",
      opts: ["A share costs 25 years of this year's earnings", "The company is expected to grow 25% this year", "The share pays 25% of its price as dividends each year", "The company has 25 times more shares than a year ago"],
      ex: "P/E is price divided by EPS. A P/E of 25 means one share costs 25 times what that share earned this year, so the market is charging 25 years of this year's earnings." },
    { id: "m8", topic: "measures", q: "A company has 1 billion shares, a price of $30 and earnings of $2 billion. Which set of numbers is right?",
      opts: ["Market cap $30 billion, EPS $2, P/E 15", "Market cap $2 billion, EPS $30, P/E 15", "Market cap $30 billion, EPS $0.50, P/E 60", "Market cap $32 billion, EPS $2, P/E 30"],
      ex: "Market cap = 1 billion × $30 = $30 billion. EPS = $2 billion ÷ 1 billion = $2. P/E = $30 ÷ $2 = 15. Each one is a different question, what the whole company costs, what one share earns, and how many years of earnings one share costs." },

    // ================= ratios. generator only, see the header
    { id: "g-cap", topic: "ratios", gen: function (R) {
        var sh, price, cap, t = 0; // sh in millions, cap in billions
        do { sh = R.int(2, 90) * 50; price = R.int(1500, 40000) / 100; cap = sh * price / 1000; } while (isTie(cap, 0.01) && ++t < 100);
        return num("A company has " + mil(sh) + " shares outstanding and the last trade was " + usd(price) + ". What is its market cap, in billions of dollars? Round to two decimals. Type the number only, without a $ sign.", cap, 0.01,
          "Market cap is shares outstanding times the last price, " + mil(sh) + " × " + usd(price) + " = $" + cap.toLocaleString("en-US", { maximumFractionDigits: 4 }) + " billion, which rounds to " + fx(cap, 2) + ". It is what the market is charging for the whole company at that last trade, not a measure of what the business is worth.");
      } },
    { id: "g-eps", topic: "ratios", gen: function (R) {
        var sh, earn, eps, t = 0; // millions
        do { sh = R.int(2, 60) * 50; earn = Math.round(sh * R.int(50, 1500) / 100 / 5) * 5; eps = earn / sh; }
        while ((earn < 5 || isTie(eps, 0.01) || roundTo(eps, 0.01) === roundTo(sh / earn, 0.01)) && ++t < 100);
        return num("A company earned $" + mil(earn) + " this year and has " + mil(sh) + " shares outstanding. What is its earnings per share? Answer in dollars to the cent. Type the number only, without a $ sign.", eps, 0.01,
          "EPS is earnings divided by shares outstanding, $" + mil(earn) + " ÷ " + mil(sh) + " = " + usd(eps, 4) + ", which rounds to " + usd(roundTo(eps, 0.01)) + ". That is one share's slice of this year's profit.");
      } },
    { id: "g-pe", topic: "ratios", gen: function (R) {
        var eps, pe, price, real, t = 0;
        do { eps = R.int(75, 1200) / 100; pe = R.int(80, 400) / 10; price = r2(eps * pe); real = price / eps; } while ((isTie(real, 0.1) || price < 5) && ++t < 100);
        return num("A share trades at " + usd(price) + " and the company's EPS is " + usd(eps) + ". What is the P/E? Round to one decimal.", real, 0.1,
          "P/E is price divided by EPS, " + usd(price) + " ÷ " + usd(eps) + " = " + real.toFixed(3) + ", which rounds to " + fx(real, 1) + ". The market is charging about that many years of this year's earnings for one share.");
      } },
    { id: "g-yield", topic: "ratios", gen: function (R) {
        var price, qd, y, t = 0;
        do { price = R.int(2000, 25000) / 100; qd = Math.max(5, Math.round(price * R.int(5, 80) / 10 / 4)) / 100; y = 4 * qd / price * 100; }
        while ((isTie(y, 0.01) || y < 0.3 || y > 10) && ++t < 100);
        return num("A company pays a dividend of " + usd(qd) + " per share every quarter. The share trades at " + usd(price) + ". What is the dividend yield, in percent? Round to two decimals.", y, 0.01,
          "Dividend yield uses the yearly dividend, so first multiply the quarterly payment by four, 4 × " + usd(qd) + " = " + usd(4 * qd) + ". Then divide by the price, " + usd(4 * qd) + " ÷ " + usd(price) + " = " + (y / 100).toFixed(5) + ", which is " + y.toFixed(3) + "% and rounds to " + fx(y, 2) + "%. Forgetting the four gives a yield a quarter of the real one.");
      } },
    { id: "g-price", topic: "ratios", gen: function (R) {
        var eps = R.int(100, 900) / 100, pe = R.int(8, 35), price = eps * pe;
        return num("A company's EPS is " + usd(eps) + " and the market pays a P/E of " + pe + ". What share price does that imply? Answer in dollars to the cent. Type the number only, without a $ sign.", price, 0.01,
          "P/E is defined as price ÷ EPS, so turning it around gives Price = EPS × P/E = " + usd(eps) + " × " + pe + " = " + usd(price) + ". The price can only change if the EPS or the multiple changes.");
      } },
    { id: "g-capeps", topic: "ratios", gen: function (R) {
        var sh, eps, pe, price, cap, t = 0; // sh in millions, cap in billions
        do { sh = R.int(2, 40) * 50; eps = R.int(100, 800) / 100; pe = R.int(10, 30); price = eps * pe; cap = sh * price / 1000; } while ((isTie(cap, 0.01) || eps === 1) && ++t < 100);
        return num("A company has " + mil(sh) + " shares outstanding, EPS of " + usd(eps) + ", and trades at a P/E of " + pe + ". What is its market cap, in billions of dollars? Round to two decimals. Type the number only, without a $ sign.", cap, 0.01,
          "First the price, EPS × P/E = " + usd(eps) + " × " + pe + " = " + usd(price) + ". Then market cap = shares × price = " + mil(sh) + " × " + usd(price) + " = $" + cap.toLocaleString("en-US", { maximumFractionDigits: 4 }) + " billion, which rounds to " + fx(cap, 2) + ". Total earnings, shares × EPS = $" + mil(sh * eps) + ", is a different thing, the yearly profit, and the market cap is " + pe + " times it because of the P/E.");
      } },

    // ================= dividends
    { id: "d1", topic: "dividends", q: "What is a dividend?",
      opts: ["Cash a company pays its owners out of its profits", "The profit a trader makes from selling a share for more", "A yearly fee that owners pay the company to keep their shares", "New shares that a company sells to the public to raise money"],
      ex: "A dividend is part of the company's profit paid to its owners in cash. It is set as an amount per share and, in the US, usually paid every quarter." },
    { id: "d2", topic: "dividends", q: "What does dividend yield measure?",
      opts: ["The yearly dividend as a percent of the share price", "The fraction of the company's profit that it pays out as dividends", "How fast the dividend per share has grown over the past year", "The dollar amount of dividend paid in a single quarter"],
      ex: "Yield = yearly dividend ÷ share price. Dividing by the price lets you compare cash payouts across companies whose shares cost very different amounts." },
    { id: "d3", topic: "dividends", q: "On a share's ex dividend date, the first day a buyer no longer gets the coming payment, what typically happens to the price?",
      opts: ["It drops by about the dividend amount", "It rises by about the dividend amount", "It stays the same, since dividends are extra", "It halves, because the cash is split"],
      ex: "The cash is about to leave the company, and a buyer from that day on will not receive it. So each share carries that much less and the price typically adjusts down by roughly the dividend." },
    { id: "d4", topic: "dividends", q: "Why is a dividend not free extra money on top of owning the share?",
      opts: ["It is the company's own cash leaving, so each share carries less", "It is taxed away in full before any of it reaches the owner", "It must be paid back to the company within a year of receiving it", "It is paid only to the largest owners, never to small ones"],
      ex: "The dividend moves value from inside the company to your account. At that moment your total, share plus cash, is unchanged. The real gain was the profit that produced the cash." },
    { id: "d5", topic: "dividends", q: "In April 2026 Procter and Gamble raised its dividend. For how many years in a row had it raised it?",
      opts: ["70", "136", "25", "10"],
      ex: "P&G said the April 2026 increase made 70 consecutive years of raising its dividend. 136 is a different record, the number of consecutive years it has paid a dividend at all, every year since it was incorporated in 1890." },
    { id: "d6", topic: "dividends", q: "A share's price falls while its dividend stays the same. What happens to the dividend yield?",
      opts: ["It rises, since the same dividend is a bigger share of a lower price", "It falls, because the shares are now worth less than they were before", "It stays the same, because the dividend itself did not change", "It turns negative, because the owners are now losing money on paper"],
      ex: "Yield = dividend ÷ price. A smaller price with the same dividend gives a larger percentage. So a rising yield can come from a falling price, not from a better business." },
    { id: "d7", topic: "dividends", q: "How often do most US companies that pay dividends pay them?",
      opts: ["Every quarter", "Every month", "Once every five years", "Only when the share price rises"],
      ex: "Most US dividend payers pay four times a year. That is why a quarterly amount must be multiplied by four to get the yearly dividend used in the yield." },
    { id: "d8", topic: "dividends", q: "A share at $40 pays $0.50 each quarter. What is its dividend yield?",
      opts: ["5%", "1.25%", "12.5%", "0.5%"],
      ex: "The yearly dividend is 4 × $0.50 = $2.00, and $2.00 ÷ $40 = 0.05, which is 5%. Using one quarter's $0.50 alone gives 1.25%, a quarter of the real yield." },
    { id: "d9", topic: "dividends", q: "A company keeps paying $2 a share each year, but its share price falls from $50 to $25. What happens to the dividend yield?",
      opts: ["It doubles from 4% to 8%, since the same cash is set against half the price", "It halves from 4% to 2%, since the shares are now worth half as much", "It stays at 4%, since the dividend per share did not change at all", "It rises from 4% to 6%, since the yield moves by the price drop in dollars"],
      ex: "Yield = yearly dividend ÷ price. $2 ÷ $50 = 4% and $2 ÷ $25 = 8%. The yield doubled only because the price halved, so a high yield on its own says nothing good about the business. Sometimes the price fell because buyers doubt the dividend will last." },
    { id: "d10", topic: "dividends", q: "You buy a share on its ex dividend date. Do you receive the coming dividend?",
      opts: ["No, it goes to whoever owned the share before that day", "Yes, because you own the share on the day it is paid out", "Yes, but you split it evenly with the owner who sold to you", "No, because the company cancels that dividend for everyone"],
      ex: "The ex dividend date is the cutoff. Anyone who buys on or after it does not get the coming payment, which goes to the seller. That is why the price typically drops by about the dividend on that day, since a buyer no longer gets the cash." },
    { id: "g-exdiv", topic: "dividends", gen: function (R) {
        var k = R.int(1, 10) * 100, p = R.int(2000, 20000) / 100, d = Math.max(5, Math.round(p * R.int(10, 60) / 10 / 4)) / 100, total = k * p;
        return num("You own " + n0(k) + " shares that closed at " + usd(p) + " the day before the ex dividend date. The dividend is " + usd(d) + " a share. On the ex dividend date the price drops by exactly the dividend and nothing else changes. What are your shares plus the dividend you are owed worth in total, in dollars? Round to the nearest dollar. Type the number only, without a $ sign.", total, 1,
          "Your shares are now worth " + n0(k) + " × (" + usd(p) + " − " + usd(d) + ") = " + usd(k * (p - d)) + ", and you are owed " + n0(k) + " × " + usd(d) + " = " + usd(k * d) + " in cash. Together that is " + usd0(total) + ", exactly what you had the evening before. The dividend moved value from inside the company to your account. It did not create any.");
      } },

    // ================= buybacks
    { id: "b1", topic: "buybacks", q: "What is a share buyback?",
      opts: ["The company buys its own shares and cancels them", "Owners sell their shares back to the stock exchange", "The company hands out new shares to its employees", "The company issues new shares and sells them to the public"],
      ex: "In a buyback the company spends cash buying its own shares from owners who want to sell, then cancels them, so fewer shares exist and each remaining share is a bigger slice." },
    { id: "b2", topic: "buybacks", q: "A company buys back and cancels shares, and its total profit does not change. What happens to its EPS?",
      opts: ["It rises, since the same profit is split among fewer shares", "It falls, because the company spent cash on the buyback", "It stays the same, because total profit did not change", "It drops to zero for the cancelled shares and stays elsewhere"],
      ex: "EPS = earnings ÷ shares outstanding. The top of the fraction is unchanged and the bottom got smaller, so each share's slice is bigger." },
    { id: "b3", topic: "buybacks", q: "You own 1 of a company's 20 shares and do nothing while it buys back and cancels 4 shares. What fraction do you own now?",
      opts: ["1 of 16, which is 6.25%", "1 of 20, which is 5%", "1 of 24, which is about 4.17%", "4 of 20, which is 20%"],
      ex: "16 shares remain and you still hold 1, so you own 1 ÷ 16 = 6.25% of the company and its profit, up from 5%. But the company spent cash on those 4 shares, and part of that cash was yours, so if it paid a fair price you are no richer. Your slice grew while the company's cash shrank." },
    { id: "b4", topic: "buybacks", q: "In a buyback, which owners receive cash?",
      opts: ["Only the owners who choose to sell to the company", "Every owner, in proportion to the shares they hold", "Only the largest owners, who negotiate with the company", "Nobody, because the cash goes to the stock exchange"],
      ex: "A buyback pays only the sellers. A dividend pays every owner. That choice is the main practical difference between the two cash paths. The owners who stay are paid differently, with a bigger slice." },
    { id: "b5", topic: "buybacks", q: "A company's EPS rose 10% this year. Why is that alone not proof the business grew?",
      opts: ["A buyback can raise EPS with no growth in profit", "EPS rises with inflation, whatever the business does", "EPS rises whenever the share price rises", "EPS leaves out the company's costs, so it tends to grow"],
      ex: "If the share count shrinks by about 9%, EPS rises about 10% with exactly the same profit, because 1 ÷ (1 − 0.09) is about 1.10. Check total earnings and the share count, not just EPS." },
    { id: "b6", topic: "buybacks", q: "A company earns $300 million with 150 million shares, then buys back and cancels 30 million shares. Earnings stay the same. What is the new EPS?",
      opts: ["$2.50", "$2.00", "$1.67", "$10.00"],
      ex: "Before, EPS was $300 million ÷ 150 million = $2.00. After, 120 million shares remain, so EPS = $300 million ÷ 120 million = $2.50. Dividing by the 30 million shares bought back, $10.00, mixes up which shares are left." },
    { id: "b7", topic: "buybacks", q: "A company buys back shares at a fair price, exactly what they are worth. What happens to an owner who does not sell?",
      opts: ["Their bigger slice of profit is offset by their part of the cash that left", "They get richer by the rise in earnings per share, at no cost to them", "They get poorer, because the buyback lowers the company's yearly profit", "They receive a share of the cash the sellers were paid, like a dividend"],
      ex: "Each remaining share owns more of the profit, but the cash that paid the sellers belonged partly to every owner. At a fair price those two changes cancel exactly, the same way a share price drops by the dividend on the ex dividend date. A buyback hands over profit already earned. It is not new money." },
    { id: "b8", topic: "buybacks", q: "When does a buyback make the owners who stay richer?",
      opts: ["When the company buys its shares for less than they are really worth", "Whenever it raises the company's earnings per share", "Whenever the company has spare cash it does not need", "When the company pays more for its shares than they are worth"],
      ex: "At a fair price the bigger slice and the lost cash cancel. The owners who stay gain only when the company pays less than the shares are worth, and they lose when it overpays. A higher EPS happens either way, so it is not the test." },
    { id: "b9", topic: "buybacks", q: "A company buys back 10% of its shares at a fair price, and its EPS rises about 11%. If nothing else changes, what happens to the share price?",
      opts: ["It stays about the same, and the P/E falls", "It rises about 11%, because the P/E stays the same", "It falls about 10%, because the cash left the company", "It rises about 10%, in line with the shares removed"],
      ex: "The cash that left paid for exactly the shares that were cancelled, so each remaining share is worth what it was. EPS rose, so P/E = price ÷ EPS fell. Assuming the P/E stays the same after a buyback is the trap, since it counts the bigger slice and forgets the cash that paid for it." },
    { id: "g-bb", topic: "buybacks", gen: function (R) {
        var sh, cut, earn, eps0, eps1, t = 0; // millions
        do { sh = R.int(4, 40) * 25; cut = Math.round(sh * R.int(5, 25) / 100 / 5) * 5; earn = R.int(20, 400) * 5; eps0 = earn / sh; eps1 = earn / (sh - cut); }
        while ((cut < 5 || eps1 < 0.25 || isTie(eps1, 0.01) || roundTo(eps0, 0.01) === roundTo(eps1, 0.01)) && ++t < 100);
        return num("A company earns $" + mil(earn) + " a year and has " + mil(sh) + " shares. It buys back and cancels " + mil(cut) + " shares, and earnings stay the same. What is the new EPS? Answer in dollars to the cent. Type the number only, without a $ sign.", eps1, 0.01,
          "Before the buyback EPS was $" + mil(earn) + " ÷ " + mil(sh) + " = " + usd(eps0, 4) + ". After it, " + mil(sh - cut) + " shares remain, so EPS = $" + mil(earn) + " ÷ " + mil(sh - cut) + " = " + usd(eps1, 4) + ", which rounds to " + usd(roundTo(eps1, 0.01)) + ". The profit did not change. It is split among fewer shares, so each remaining share's slice is bigger. The company also spent cash, so a higher EPS alone does not mean the owners got richer.");
      } },
    { id: "g-bbown", topic: "buybacks", gen: function (R) {
        var sh, mine, cut, before, after, t = 0;
        do { sh = R.int(20, 200) * 10; mine = R.int(1, 10) * 5; cut = Math.round(sh * R.int(5, 30) / 100 / 10) * 10; before = mine / sh * 100; after = mine / (sh - cut) * 100; }
        while ((cut < 10 || isTie(after, 0.01) || roundTo(before, 0.01) === roundTo(after, 0.01) || roundTo(mine / (sh + cut) * 100, 0.01) === roundTo(after, 0.01)) && ++t < 100);
        return num("A company has " + n0(sh) + " shares and you own " + mine + ". It buys back and cancels " + n0(cut) + " shares from other owners. What percent of the company do you own now? Round to two decimals.", after, 0.01,
          "Before, you owned " + mine + " ÷ " + n0(sh) + " = " + before.toFixed(4) + "%. The buyback leaves " + n0(sh - cut) + " shares and you still hold " + mine + ", so you now own " + mine + " ÷ " + n0(sh - cut) + " = " + after.toFixed(4) + "%, which rounds to " + fx(after, 2) + "%. Your slice grew without you buying anything, though the company spent cash, part of it yours, to make that happen.");
      } },
    { id: "g-bbpct", topic: "buybacks", gen: function (R) {
        var x, f, t = 0;
        do { x = R.int(3, 30); f = (1 - 1 / (1 + x / 100)) * 100; } while (isTie(f, 0.01) && ++t < 100);
        return num("A company's total profit is exactly the same as last year, but its earnings per share rise " + x + "% because it bought back and cancelled some of its shares. What percent of its shares did it cancel? Round to two decimals.", f, 0.01,
          "EPS is profit ÷ shares. With profit fixed, EPS can only be " + (1 + x / 100).toFixed(2) + " times as large if the share count is 1 ÷ " + (1 + x / 100).toFixed(2) + " = " + (1 / (1 + x / 100)).toFixed(5) + " of what it was. So the company cancelled 1 − " + (1 / (1 + x / 100)).toFixed(5) + " = " + (f / 100).toFixed(5) + " of its shares, " + f.toFixed(4) + "%, which rounds to " + fx(f, 2) + "%. It is less than " + x + "% because the cut is measured against the larger starting count.");
      } },
    { id: "g-bbpe", topic: "buybacks", gen: function (R) {
        var sh, earn, pe0, P, cut, pe1, t = 0; // millions
        do { sh = R.int(4, 40) * 25; earn = R.int(20, 600) * 5; pe0 = R.int(10, 30); P = r2(earn / sh * pe0); cut = Math.round(sh * R.int(4, 20) / 100 / 5) * 5; pe1 = P * (sh - cut) / earn; }
        while ((cut < 5 || P < 5 || P > 1000 || isTie(pe1, 0.01) || roundTo(pe1, 0.01) === roundTo(P * sh / earn, 0.01)) && ++t < 100);
        return num("A company has " + mil(sh) + " shares, earns $" + mil(earn) + " a year, and its shares trade at " + usd(P) + ". It spends cash buying back and cancelling " + mil(cut) + " shares at " + usd(P) + " each, a fair price. Earnings stay the same, and since the cash that left paid for exactly the shares that were cancelled, each remaining share is still worth " + usd(P) + ". What is the new P/E? Round to two decimals.", pe1, 0.01,
          "After the buyback " + mil(sh - cut) + " shares remain, so EPS = $" + mil(earn) + " ÷ " + mil(sh - cut) + ", about " + usd(earn / (sh - cut), 4) + ". The price stays at " + usd(P) + ", so the new P/E = " + usd(P) + " ÷ ($" + mil(earn) + " ÷ " + mil(sh - cut) + ") = " + pe1.toFixed(4) + ", which rounds to " + fx(pe1, 2) + ", down from " + (P * sh / earn).toFixed(2) + ". EPS rose, but the owners who stayed are no richer, because their bigger slice was paid for with their part of the cash that left.");
      } },

    // ================= paths. Where profit goes
    { id: "w1", topic: "paths", q: "What are the three main ways a profitable company can deliver its profit to its owners?",
      opts: ["Pay dividends, buy back shares, or reinvest in the business", "Raise prices, cut costs, or borrow more money from a bank", "Issue new shares, pay staff bonuses, or pay more in taxes", "List on an exchange, split its shares, or merge with a rival"],
      ex: "Profit can leave as cash (dividends), shrink the share count so each slice grows (buybacks), or stay inside to grow future profit (reinvestment). All three put value in the owners' hands in a different way." },
    { id: "w2", topic: "paths", q: "How does reinvested profit benefit owners who receive no cash from it?",
      opts: ["It can grow the company's future profits, which belong to them", "It is paid out to them later, with interest added on top", "It is held for them in a separate account they can withdraw from at will", "It cuts the number of shares that each of the owners holds"],
      ex: "Profit kept in the business builds stores, factories and products. If those earn more than the owners could have earned with the money elsewhere, future earnings grow by more than a payout would have, and each owner's slice grows with them." },
    { id: "w3", topic: "paths", q: "When can reinvesting profit make owners poorer?",
      opts: ["When its projects earn less than the owners could earn elsewhere", "Whenever the company skips its dividend for a year", "Whenever the share price happens to fall that year", "Never, because keeping profit always adds value for owners"],
      ex: "The test is not whether a project earns something. It is whether it earns more than the owners could have got by putting the same money somewhere else. Earning 2% when 7% was available leaves them poorer than a payout would have. Judging this is part of Investing Week 4." },
    { id: "w4", topic: "paths", q: "Where does the money delivered by all three paths ultimately come from?",
      opts: ["Customers buying the company's products and services", "Other investors who sell their shares too cheaply", "The stock exchange, out of its trading fees", "New owners buying shares from the company"],
      ex: "Dividends, buybacks and reinvestment all spend the company's profit, and profit comes from customers. That is why ownership does not require anyone else to lose." },
    { id: "w5", topic: "paths", q: "A company earns $100 million. It pays $40 million in dividends and spends $25 million on buybacks. How much is left to reinvest?",
      opts: ["$35 million", "$60 million", "$75 million", "$65 million"],
      ex: "$100 million − $40 million − $25 million = $35 million kept in the business. $65 million is the part that left, the dividends and buybacks together." },
    { id: "w6", topic: "paths", q: "Which statement about dividends versus buybacks is correct?",
      opts: ["Dividends pay every owner, buybacks pay only the owners who sell", "Dividends raise EPS right away, while buybacks leave EPS alone", "Buybacks pay every owner, while dividends go only to large owners", "They are the same payment, described with two different names"],
      ex: "A dividend goes to every share. A buyback sends cash only to the sellers and leaves the remaining owners with bigger slices, which is why it raises EPS and a dividend does not." },
    { id: "w7", topic: "paths", q: "A drugstore chain keeps its profit and opens new stores that earn more than its owners could have earned with that money elsewhere. Who benefits, and how?",
      opts: ["Every owner, as future profit per share grows", "Only the owners who sell their shares that year", "Only the managers who run the new stores", "Nobody, because no cash was paid out to owners"],
      ex: "Reinvested profit that earns a good return raises future earnings, and every owner's slice grows with them, even without a cash payment." },
    { id: "w8", topic: "paths", q: "A company keeps $200 million of profit and builds a plant that earns 3% a year. Its owners could have earned 8% a year on that money elsewhere. About what does the choice cost them each year?",
      opts: ["About $10 million", "Nothing, since the plant earns a profit", "About $6 million", "About $16 million"],
      ex: "The plant earns 3% of $200 million, $6 million a year, where 8% would have earned $16 million. The gap, 5% of $200 million, is about $10 million a year. Earning something is not enough. Reinvestment helps only when it beats what the owners could get elsewhere." },

    // ================= price. Price versus earnings
    { id: "p1", topic: "price", q: "Why does a share's price move every day even when the business has not changed?",
      opts: ["The price is the last trade, pushed by orders and mood", "The company updates its profit figures each trading day", "The exchange adjusts prices for inflation each morning", "Dividends are recalculated and repriced each trading day"],
      ex: "This is Trading Week 1. Price is just the last trade, and it moves with every order that arrives or leaves the book, whatever the reason behind it. None of that changes how much the business sells this month." },
    { id: "p2", topic: "price", q: "Price = EPS × P/E. If a share's price changes, what are the only two possible reasons?",
      opts: ["The earnings changed, or the multiple paid for them changed", "The dividend changed, or the number of shares outstanding changed", "Inflation changed, or interest rates changed that day", "The exchange changed, or the broker's prices changed"],
      ex: "Because P/E is defined as price ÷ EPS, every price move is a change in EPS, a change in P/E, or both. Things like news, rates or a buyback matter only through those two." },
    { id: "p3", topic: "price", q: "Over a single week, what drives most of a large company's share price movement?",
      opts: ["The multiple and the order book, since earnings barely move", "Changes in the company's earnings, which are updated weekly", "Changes in the number of shares outstanding that week", "The dividend the company happened to pay during that week"],
      ex: "In a week the business is nearly fixed, so the movement is mostly mood and order flow. Over decades, earnings growth has done most of the work for large US companies." },
    { id: "p4", topic: "price", q: "Over thirty years, what has usually explained most of a successful company's share price growth?",
      opts: ["Growth in its earnings", "A P/E that keeps rising year after year", "Daily trading volume", "The number of times it was mentioned in the news"],
      ex: "A multiple can swing for years, but it has tended to drift around a middle value, while earnings can keep compounding. That is a pattern from history, not a law, but over decades the price has mostly followed the earnings." },
    { id: "p5", topic: "price", q: "Why is the idea that P/E drifts around a middle value over decades called a model rather than a law?",
      opts: ["It held in the past, but multiples can stay high or low for years", "P/E cannot be measured accurately for most large companies", "The formula Price = EPS × P/E fails for some kinds of company", "P/E can be worked out only for companies that pay dividends"],
      ex: "Price = EPS × P/E is a definition, always true. How the multiple behaves over time is an observation about history, with no guarantee." },
    { id: "p6", topic: "price", q: "A company's EPS doubled over ten years, but its share price did not rise at all. What must have happened?",
      opts: ["Its P/E halved", "Its P/E doubled", "It stopped paying dividends", "Its shares outstanding doubled"],
      ex: "Price = EPS × P/E. If EPS doubled and price stayed flat, P/E must have fallen by half. Owners who paid a very high multiple at the start saw the business grow and no price gain." },
    { id: "p7", topic: "price", q: "A share trades at $90 with EPS of $4.50. What is its P/E?",
      opts: ["20", "405", "0.05", "45"],
      ex: "P/E = price ÷ EPS = $90 ÷ $4.50 = 20. Multiplying gives 405, and dividing the wrong way gives 0.05." },
    { id: "p8", topic: "price", q: "Over ten years a company's EPS triples and its P/E falls from 30 to 20. What happens to the share price?",
      opts: ["It doubles", "It triples", "It stays the same", "It falls by a third"],
      ex: "Price changes by the product of the two factors, 3 × 20 ÷ 30 = 2. The earnings growth was partly eaten by the shrinking multiple." },
    { id: "p9", topic: "price", q: "Earnings have not changed, but investors come to expect much faster profit growth ahead. What most likely happens?",
      opts: ["The P/E rises, and the price rises with it", "Nothing, until the faster growth shows up in EPS", "EPS rises at once, while the P/E stays the same", "The P/E rises, but the price falls"],
      ex: "The multiple is the market's running summary of what it expects, how fast earnings will grow, how risky they are, interest rates, and plain mood. Better expectations mean a higher multiple. Price = EPS × P/E, so with EPS unchanged the price rises too." },
    { id: "g-pex", topic: "price", gen: function (R) {
        var e, p0, p1, ch, t = 0;
        do { e = R.pick([1.2, 1.5, 2, 2.5, 3]); p0 = R.int(10, 30); p1 = R.int(8, 30); ch = e * p1 / p0; } while ((isTie(ch, 0.01) || (p1 !== p0 && roundTo(e + p1 / p0 - 1, 0.01) === roundTo(ch, 0.01))) && ++t < 100);
        var move = p1 === p0 ? "its P/E stays at " + p0 : "its P/E " + (p1 < p0 ? "falls" : "rises") + " from " + p0 + " to " + p1;
        return num("Over ten years a company's EPS grows by a factor of " + e + " and " + move + ". By what factor did the share price change? Round to two decimals. A factor below 1 means the price fell.", ch, 0.01,
          "Price = EPS × P/E, so the price changes by the product of the two factors. The P/E factor is " + p1 + " ÷ " + p0 + ", so the price factor is " + e + " × " + p1 + " ÷ " + p0 + " = " + ch.toFixed(4) + ", which rounds to " + fx(ch, 2) + (ch < 1 ? ", so the price fell even though the earnings grew." : ch === e ? ", the same as the EPS factor because the multiple did not move." : ".") + (p1 === p0 ? "" : " Adding the two changes instead of multiplying the factors gives the wrong answer."));
      } },

    // ================= growth. Compounding
    { id: "c1", topic: "growth", q: "$1,000 grows 10% a year. Why is the gain in the second year $110 rather than $100?",
      opts: ["The 10% is figured on $1,100, so it includes growth on the first year's growth", "The rate rises from 10% to 11% in the second year of any investment", "Dividends of $10 are added on top of the 10% from the second year on", "Inflation adds $10 to the value of the money in the second year"],
      ex: "After one year you have $1,100, and the second year's 10% is figured on all of it. The extra $10 is 10% of the first year's $100 gain. Growth that builds on earlier growth like this is compounding." },
    { id: "c2", topic: "growth", q: "At 6.8% a year, what does holding for 50 years instead of 30 do to the ending value?",
      opts: ["Multiplies it by about 3.7, since the extra 20 years compound on all of it", "Raises it by about two thirds, since 20 more years is two thirds more time", "Raises it by about 20 × 6.8% = 136%, since each extra year adds 6.8%", "Leaves it about the same, since most of the growth happens in the early years"],
      ex: "The last 20 years multiply everything the first 30 built by 1.068 to the power 20, about 3.7. Time is not added on, it multiplies, which is why most of the growth arrives in the final decades." },
    { id: "c3", topic: "growth", q: "At 72% a year the rule of 72 says money doubles in 1 year. What really happens in that year?",
      opts: ["It grows to 1.72 times, short of doubling, because the rule drifts at high rates", "It doubles, because 72 ÷ 72 = 1 and the rule is an identity", "It grows to 2.72 times, because the rule tends to underestimate growth", "It grows to 1.36 times, because half the rate counts in year one"],
      ex: "One year at 72% multiplies money by 1.72, not 2. The exact doubling time is ln 2 ÷ ln (1 + rate). Between about 2% and 15% the shortcut is off by less than 4%, but far outside that range it drifts, and at 72% it is badly off." },
    { id: "c4", topic: "growth", q: "$1,000 grows 10% a year for 10 years and ends at about $2,594. How much of the $1,594 gain is growth on growth?",
      opts: ["About $594", "About $1,000", "About $1,594", "About $259"],
      ex: "Simple growth, 10% of the original $1,000 each year, adds $100 a year, $1,000 over ten years. The other $594 is growth on growth, about 37% of the whole gain. That share keeps rising the longer the money sits." },
    { id: "c5", topic: "growth", q: "Why does spending dividends instead of reinvesting them slow the growth of a holding?",
      opts: ["The share count stays fixed, so only the price part of the return compounds", "Companies pay smaller dividends to the owners who choose to spend them", "Spending a dividend triggers a penalty that pushes the share price down", "Spent dividends are taken back out of the company's future profits"],
      ex: "Reinvested dividends buy more shares, which pay more dividends, which buy more shares, so the holding compounds at the full return. Spent dividends leave the share count fixed, so only the price part compounds. Companies treat both owners identically." },
    { id: "c6", topic: "growth", q: "An investment loses 50% one year and gains 50% the next. The simple average of the two returns is 0%. What is $100 worth at the end?",
      opts: ["$75", "$100", "$125", "$50"],
      ex: "$100 falls to $50, and a 50% gain on $50 adds only $25, ending at $75. A loss hurts more than an equal gain helps, which is why the simple average of yearly returns overstates growth. The compounded average here is about −13.4% a year." },
    { id: "g-fv", topic: "growth", gen: function (R) {
        var P, r, n, fv, t = 0;
        do { P = R.int(1, 20) * 500; r = R.int(3, 12); n = R.int(5, 40); fv = P * Math.pow(1 + r / 100, n); } while (isTie(fv, 1) && ++t < 100);
        return num("You invest " + usd0(P) + " and it grows " + r + "% a year, compounded, for " + n + " years with nothing added or taken out. What is it worth at the end? Round to the nearest dollar. Type the number only, without a $ sign.", fv, 1,
          "Each year multiplies the total by " + (1 + r / 100).toFixed(2) + ", so after " + n + " years it is " + usd0(P) + " × " + (1 + r / 100).toFixed(2) + " to the power " + n + " = " + usd(fv) + ", which rounds to " + usd0(fv) + ". Simple growth, " + r + "% of the original each year with no growth on growth, would give only " + usd0(P * (1 + r / 100 * n)) + ".");
      } },
    { id: "g-72", topic: "growth", gen: function (R) {
        var r = R.pick([3, 4, 6, 8, 9, 12]), dt = 72 / r, k = R.int(2, Math.min(5, Math.floor(60 / dt))), yrs = dt * k, key = Math.pow(2, k);
        var cand = [], seen = {};
        function add(v, s, tag) { var kk = Math.round(v * 100); if (Math.abs(v - key) < 1e-9 || seen[kk]) return; seen[kk] = 1; cand.push({ v: v, s: s, tag: tag }); }
        add(k, "About " + k + " times", "count");
        add(2 * k, "About " + 2 * k + " times", "added");
        add(1 + r * yrs / 100, "About " + (1 + r * yrs / 100).toFixed(1) + " times", "simple");
        add(yrs, "About " + yrs + " times", "years");
        add(r * k, "About " + r * k + " times", "rate");
        add(key / 2, "About " + key / 2 + " times", "half");
        add(key * 2, "About " + key * 2 + " times", "double");
        var lo = cand.filter(function (c) { return c.v < key; }), hi = cand.filter(function (c) { return c.v > key; }), pickd = null;
        for (var t = 0; t < 200 && !pickd; t++) {
          var nl = R.int(0, 3); if (lo.length < nl || hi.length < 3 - nl) continue;
          var set = R.shuffle(lo).slice(0, nl).concat(R.shuffle(hi).slice(0, 3 - nl));
          var tags = set.map(function (c) { return c.tag; });
          var vs = set.map(function (c) { return c.v; });
          if (vs.indexOf(key / 2) >= 0 && vs.indexOf(key * 2) >= 0) continue; // the key would sit in the middle of a halving and doubling pair
          pickd = set;
        }
        if (!pickd) pickd = R.shuffle(cand).slice(0, 3);
        return { type: "mcq", q: "Using the rule of 72, an investment growing " + r + "% a year for " + yrs + " years ends up worth roughly how many times its starting value?",
          opts: ["About " + key + " times"].concat(pickd.map(function (c) { return c.s; })),
          ex: "At " + r + "% money doubles about every 72 ÷ " + r + " = " + dt + " years. " + yrs + " years is " + k + " doublings, and 2 multiplied by itself " + k + " times is " + key + ". Doublings multiply rather than add" + (2 * k === key ? ". At 2 doublings both give 4, but with more doublings multiplying pulls far ahead, 3 doublings make 8 times, not 6." : ", so " + k + " doublings make " + key + " times, not " + 2 * k + " times.") };
      } },
    { id: "g-dbl", topic: "growth", gen: function (R) {
        var r = R.int(3, 14), est = 72 / r;
        return num("Using the rule of 72, about how many years does money take to double at " + r + "% a year? Round to one decimal.", est, 0.1,
          "Divide 72 by the yearly percentage, 72 ÷ " + r + " = " + est.toFixed(3) + ", which rounds to " + fx(est, 1) + " years. The exact doubling time is ln 2 ÷ ln " + (1 + r / 100).toFixed(2) + " = " + (Math.log(2) / Math.log(1 + r / 100)).toFixed(2) + " years, so in this range the shortcut is close.");
      } },
    { id: "g-real", topic: "growth", gen: function (R) {
        var nom, inf, real, t = 0;
        do { nom = R.int(30, 140) / 10; inf = R.int(5, Math.min(60, Math.round(nom * 10) - 3)) / 10; real = ((1 + nom / 100) / (1 + inf / 100) - 1) * 100; }
        while ((isTie(real, 0.01) || roundTo(real, 0.01) === roundTo(nom - inf, 0.01)) && ++t < 100);
        return num("An investment returned " + nom.toFixed(1) + "% in a year when inflation was " + inf.toFixed(1) + "%. What was the exact real return, in percent? Use (1 + nominal) ÷ (1 + inflation) − 1 and round to two decimals.", real, 0.01,
          "(1 + " + (nom / 100).toFixed(3) + ") ÷ (1 + " + (inf / 100).toFixed(3) + ") − 1 = " + fx(real / 100, 5) + ", which is " + fx(real, 3) + "% and rounds to " + fx(real, 2) + "%. The quick shortcut, nominal minus inflation, gives " + fx(nom - inf, 2) + "%. It is a little off because the gain itself is paid in dollars that buy less.");
      } },
    { id: "g-spent", topic: "growth", gen: function (R) {
        var P, d, g, n, re, sp, diff, t = 0;
        do { P = R.int(1, 10) * 1000; d = R.pick([2, 3, 4]); g = R.int(3, 7); n = R.pick([20, 25, 30, 40]); re = P * Math.pow(1 + (g + d) / 100, n); sp = P * Math.pow(1 + g / 100, n); diff = re - sp; } while (isTie(diff, 1) && ++t < 100);
        return num("A share's price rises " + g + "% each year. At the end of each year it pays a dividend equal to " + d + "% of the share price at the start of that year. You hold " + usd0(P) + " of it for " + n + " years. How many dollars more is your holding worth at the end if you reinvest every dividend in more shares than if you spend each one? Ignore the cash you spent. Round to the nearest dollar. Type the number only, without a $ sign.", diff, 1,
          "Reinvested, each year adds " + g + "% from the price and " + d + "% in new shares, so the holding grows " + (g + d) + "% a year and ends at " + usd0(P) + " × " + (1 + (g + d) / 100).toFixed(2) + " to the power " + n + " = " + usd(re) + ". Spent, the share count never changes, so the holding grows only at the price rate of " + g + "% and ends at " + usd0(P) + " × " + (1 + g / 100).toFixed(2) + " to the power " + n + " = " + usd(sp) + ". The difference is " + usd(diff) + ", which rounds to " + usd0(diff) + ".");
      } },
    { id: "g-add", topic: "growth", gen: function (R) {
        var A, r, n, fv, t = 0;
        do { A = R.int(1, 10) * 500; r = R.int(4, 10); n = R.int(5, 30); fv = A * (Math.pow(1 + r / 100, n) - 1) / (r / 100); } while (isTie(fv, 1) && ++t < 100);
        return num("You add " + usd0(A) + " at the end of every year for " + n + " years, and the total grows " + r + "% a year. What is it worth right after the last deposit? Round to the nearest dollar. Type the number only, without a $ sign.", fv, 1,
          "Each deposit grows for a different number of years, the first for " + (n - 1) + " years and the last for none. Adding them up gives " + usd0(A) + " × ((" + (1 + r / 100).toFixed(2) + " to the power " + n + " − 1) ÷ " + (r / 100).toFixed(2) + ") = " + usd(fv) + ", which rounds to " + usd0(fv) + ". You put in " + usd0(A * n) + ", so about " + usd0(fv - A * n) + " is growth.");
      } },
    { id: "g-mult", topic: "growth", gen: function (R) {
        var r, n, m, t = 0;
        do { r = R.int(4, 12); n = R.int(10, 50); m = Math.pow(1 + r / 100, n); } while (isTie(m, 0.01) && ++t < 100);
        var est = Math.pow(2, n / (72 / r)), off = (est / m - 1) * 100;
        return num("Money grows " + r + "% a year, compounded, for " + n + " years. By what factor does it multiply? Round to two decimals.", m, 0.01,
          (1 + r / 100).toFixed(2) + " to the power " + n + " = " + m.toFixed(4) + ", which rounds to " + fx(m, 2) + ". For comparison, the rule of 72 counts " + (n / (72 / r)).toFixed(2) + " doublings, about " + est.toFixed(2) + " times, which is " + Math.abs(off).toFixed(1) + "% " + (off >= 0 ? "above" : "below") + " the exact figure.");
      } },
    { id: "g-gog", topic: "growth", gen: function (R) {
        var P, r, n, fv, simple, gog, t = 0;
        do { P = R.int(1, 20) * 500; r = R.int(4, 12); n = R.int(5, 30); fv = P * Math.pow(1 + r / 100, n); simple = P * r / 100 * n; gog = fv - P - simple; } while (isTie(gog, 1) && ++t < 100);
        return num(usd0(P) + " grows " + r + "% a year, compounded, for " + n + " years. Split the total gain into simple growth, which is " + r + "% of the original " + usd0(P) + " every year, and growth on growth. How many dollars of the gain are growth on growth? Round to the nearest dollar. Type the number only, without a $ sign.", gog, 1,
          "The end value is " + usd0(P) + " × " + (1 + r / 100).toFixed(2) + " to the power " + n + " = " + usd(fv) + ", a total gain of " + usd(fv - P) + ". Simple growth is " + r + "% of " + usd0(P) + " for " + n + " years, " + usd0(simple) + ". The rest, " + usd(gog) + ", which rounds to " + usd0(gog) + ", is growth on growth, gains earned on earlier gains. That is " + Math.round(gog / (fv - P) * 100) + "% of the whole gain, and the share keeps rising the longer the money sits.");
      } },
    { id: "g-cagr", topic: "growth", gen: function (R) {
        var n, rs, f, cg, sa, t = 0, words = ["first", "second", "third"];
        do { n = R.pick([2, 3]); rs = []; for (var i = 0; i < n; i++) rs.push(R.int(0, 2) ? R.int(5, 40) : -R.int(5, 30)); f = rs.reduce(function (p, r) { return p * (1 + r / 100); }, 1); cg = (Math.pow(f, 1 / n) - 1) * 100; sa = sum(rs) / n; }
        while ((rs.every(function (r) { return r > 0; }) || f < 1.01 || isTie(cg, 0.01) || roundTo(cg, 0.01) === roundTo(sa, 0.01)) && ++t < 100);
        var parts = rs.map(function (r, i) { return (r > 0 ? "gains " : "loses ") + Math.abs(r) + "% in the " + words[i] + " year"; });
        var said = n === 2 ? parts[0] + " and " + parts[1] : parts[0] + ", " + parts[1] + ", and " + parts[2];
        return num("An investment " + said + ". What was its compounded average yearly return over the " + n + " years? Round to two decimals.", cg, 0.01,
          "Multiply the yearly growth factors, " + rs.map(function (r) { return (1 + r / 100).toFixed(2); }).join(" × ") + " = " + f.toFixed(5) + ". The compounded average is the one steady rate that gives the same result, the " + (n === 2 ? "square" : "cube") + " root of " + f.toFixed(5) + " minus 1, which is " + (cg / 100).toFixed(5) + ", or " + cg.toFixed(4) + "%, and rounds to " + fx(cg, 2) + "%. The simple average of the yearly returns is " + fx(sa, 2) + "%, higher, because a loss hurts more than an equal gain helps.");
      } },

    // ================= history. The long run record
    { id: "h1", topic: "history", q: "From 1928 through 2025, about how much did US stocks, the S&P 500 with dividends reinvested, grow per year, compounded, before inflation?",
      opts: ["About 10%", "About 3%", "About 20%", "About 1%"],
      ex: "Damodaran's NYU dataset gives a compounded average of about 10.0% a year for 1928 to 2025, counted in dollars of the day. About 3% is roughly what inflation averaged over the same years." },
    { id: "h2", topic: "history", q: "From 1928 through 2025, about how much did US stocks grow per year, compounded, after inflation?",
      opts: ["About 6.8%", "About 10%", "About 13%", "About 2%"],
      ex: "With inflation averaging about 3% a year, the growth in real buying power was about 6.8% a year. About 10% is the same record before inflation is taken out." },
    { id: "h3", topic: "history", q: "What is the difference between a nominal return and a real return?",
      opts: ["Nominal is in dollars of the day, real removes inflation", "Nominal includes dividends, while real leaves them out", "Nominal is measured before fees, real is after fees", "Nominal is the promised return, real is what you received"],
      ex: "Real return asks how much more you can buy. It is roughly the nominal return minus inflation, and exactly (1 + nominal) ÷ (1 + inflation) − 1." },
    { id: "h4", topic: "history", q: "From 1928 through 2025, in roughly how many of the 98 years did US stocks lose money?",
      opts: ["26", "None", "About 50", "2"],
      ex: "Stocks fell in 26 of 98 years, about a quarter of them. A strong long run average is built from many losing years." },
    { id: "h5", topic: "history", q: "About how much did US stocks fall in 1931, their worst year in the record?",
      opts: ["About 44%", "About 10%", "About 90%", "About 25%"],
      ex: "In 1931 the S&P 500 with dividends fell about 44%. In 2008, the year Lehman failed, it fell about 37%." },
    { id: "h6", topic: "history", q: "Why is the 1928 to 2025 record not a guarantee for the next fifty years?",
      opts: ["It is one country over one century, and the future can differ", "The figures from before the year 2000 are full of known errors", "US companies stopped paying dividends after the record ended", "Inflation has disappeared from the economy since the 1990s"],
      ex: "It is the best evidence available, from one country in a century when its economy grew enormously. History informs but does not promise." },
    { id: "h7", topic: "history", q: "Who keeps the widely used table of US stock returns since 1928 that this lesson used?",
      opts: ["Aswath Damodaran, a professor at NYU", "The New York Stock Exchange's research team", "The Federal Reserve's economic data office", "The Securities and Exchange Commission"],
      ex: "The figures come from Aswath Damodaran's historical returns dataset at NYU's Stern School, which also tracks bonds and bills." },
    { id: "h8", topic: "history", q: "Inflation averaged about 3% a year from 1928 to 2025. What does that do to a dollar held as cash for 24 years?",
      opts: ["It buys about half as much at the end", "It buys about 3% less than it did at the start", "It buys the same, since a dollar is still a dollar", "It buys about twice as much, because prices doubled"],
      ex: "By the rule of 72, prices double in about 72 ÷ 3 = 24 years at 3% inflation, so a dollar of cash buys roughly half as much. Inflation compounds just like returns do." },
    { id: "h9", topic: "history", q: "At about 10% a year, roughly how long did US stocks take to double in value on average, before inflation?",
      opts: ["About 7 years", "About 10 years", "About 3 years", "About 20 years"],
      ex: "By the rule of 72, 72 ÷ 10 = 7.2 years. The exact figure at 10% is about 7.3 years. Ten years would be the answer only if the growth did not compound." },
    { id: "h10", topic: "history", q: "A dollar invested in US stocks at the start of 1928 with dividends reinvested grew to roughly how much by the end of 2025, before inflation?",
      opts: ["About $11,600", "About $100", "About $1,160", "About $1.16 million"],
      ex: "Compounding the yearly returns in Damodaran's table from 1928 to 2025 turns $1 into roughly $11,600, which is about 10% a year for 98 years." },
    { id: "h11", topic: "history", q: "The figure of about 10% a year for US stocks from 1928 to 2025 assumes what about dividends?",
      opts: ["They were all reinvested, so they compounded with the rest", "They were spent each year and left out of the figure", "They were taxed away before the figure was worked out", "They were added in once, as a lump sum at the end"],
      ex: "The record measures the S&P 500 with all dividends reinvested. Price change plus dividends is called the total return. Without reinvesting, the dividends would not compound and the yearly figure would be lower." },
    { id: "h12", topic: "history", q: "For 1928 to 2025 Damodaran's table gives about 10.0% a year compounded and about 11.9% as the simple average of the yearly returns. Why is the simple average higher?",
      opts: ["A loss hurts more than an equal gain helps, so adding returns overstates growth", "The simple average includes dividends and the compounded one leaves them out", "The simple average is measured after inflation and the other one before it", "The compounded average leaves out the 26 years in which stocks lost money"],
      ex: "Lose 50% and you need a 100% gain to get back. Adding yearly returns treats a loss and an equal gain as cancelling, which they do not. The compounded average, about 10.0%, is the one steady rate that turns $1 into the real ending value of about $11,600." },
    { id: "h13", topic: "history", q: "US stocks lost money in 1929, 1930, 1931 and 1932. What did those four years in a row do to $1?",
      opts: ["Turned it into about 35 cents", "Turned it into about 90 cents", "Turned it into about 56 cents", "Turned it into about 5 cents"],
      ex: "The four yearly losses were about 8%, 25%, 44% and 9%, and they multiply. 0.92 × 0.75 × 0.56 × 0.91 is about 0.35, so $1 became about 35 cents. Calendar years hide the worst runs, which can be far deeper than any single year." },

    // ================= diversify
    { id: "v1", topic: "diversify", q: "What is diversification?",
      opts: ["Spreading money over many companies so no one failure ruins you", "Buying and selling often so that you catch more of the market's moves", "Owning just the few companies that you understand best", "Keeping your savings in cash rather than in stocks"],
      ex: "Owning many companies shrinks the damage any one of them can do. It is why Lehman barely mattered to Ronald Read." },
    { id: "v2", topic: "diversify", q: "What risk does diversification NOT remove?",
      opts: ["The whole market falling together", "One company committing an accounting fraud", "One company losing a large lawsuit", "One company going bankrupt"],
      ex: "Company specific disasters are diluted by owning many companies. A market wide fall hits nearly all of them at once, as in 1931 and 2008." },
    { id: "v3", topic: "diversify", q: "What is an index, such as the S&P 500?",
      opts: ["A list of companies plus a rule for how much of each it holds", "A single large company chosen to represent the whole market", "A fund that guarantees its owners the market's return each year", "The simple average of the share prices of US companies"],
      ex: "An index is a list and a weighting rule. The S&P 500 holds about 500 large US companies weighted by market cap, and its level is calculated from their prices." },
    { id: "v4", topic: "diversify", q: "How does the S&P 500 weight its companies?",
      opts: ["By market cap, so bigger companies count for more", "Equally, each company counts the same", "By share price, so higher priced shares count for more", "By how long each company has existed"],
      ex: "Each company's weight follows its market cap. A company worth twice as much at market prices counts twice as much." },
    { id: "v5", topic: "diversify", q: "What is an index fund?",
      opts: ["A fund that buys every company in an index, in its proportions", "A fund whose managers try to pick the best stocks inside an index", "A futures contract whose price follows the level of an index", "A savings account that pays interest linked to the market"],
      ex: "An index fund simply owns the whole list in the index's proportions, so its owners collect the profits of all those companies. Investing Week 2 covers them in depth." },
    { id: "v6", topic: "diversify", q: "How is the ES futures contract related to the S&P 500 index?",
      opts: ["ES bets on the index level without owning any company", "ES is a fund that owns all 500 of the companies", "ES pays its holders the dividends of the 500 companies", "ES and the S&P 500 index are unrelated products"],
      ex: "ES tracks the index number. Owning the companies brings their profits. Trading ES only moves money between the contract's two sides." },
    { id: "v7", topic: "diversify", q: "What happened to Lehman Brothers shareholders when the bank went bankrupt in September 2008?",
      opts: ["They were wiped out, since owners are paid after lenders", "They were repaid in full by the US government after the failure", "Their shares were converted into bonds of the bankrupt bank", "They received the bank's remaining cash before lenders"],
      ex: "Shareholders own what is left after debts are paid. In Lehman's case almost nothing was left, so the shares became nearly worthless." },
    { id: "v8", topic: "diversify", q: "You put equal amounts into 50 companies and one goes to zero. What fraction of your money is lost?",
      opts: ["2%", "50%", "1%", "20%"],
      ex: "One of 50 equal stakes is 1 ÷ 50 = 2% of the total. The other 49 are untouched." },
    { id: "v9", topic: "diversify", q: "Diversification removes one kind of risk and leaves another. Which risk are long term owners paid to carry?",
      opts: ["The risk of the whole market falling, which no spreading removes", "The risk that one particular company they own goes bankrupt", "The risk that one of their companies is caught in a fraud", "The risk that one company they own cuts its dividend for a year"],
      ex: "Spreading money over many companies shrinks the risk that comes from any one of them. The standard theory in finance says investors are not paid extra for that risk, because anyone can get rid of it almost for free. What is left is the risk of the market as a whole, which long term owners are paid to sit through." },
    { id: "v10", topic: "diversify", q: "Company A trades at $400 with 100 million shares. Company B trades at $50 with 2 billion shares. In an index weighted by market cap, which counts for more?",
      opts: ["B, because its market cap is $100 billion against A's $40 billion", "A, because its share price is eight times higher than B's", "Neither, because each is one company in the index", "A, because it has fewer shares, so each share is a bigger slice"],
      ex: "Market cap is price times shares. A is $400 × 100 million = $40 billion and B is $50 × 2 billion = $100 billion, so B counts two and a half times as much. A high share price alone does not make a company big." },
    { id: "v11", topic: "diversify", q: "A study of every US stock from 1926 to 2016 found that the best 4% of companies produced all of the market's gain over Treasury bills. What does that suggest about owning just a few stocks?",
      opts: ["It risks missing the few big winners that carry the whole market", "It tends to beat the market, since few stocks means less noise", "It makes no difference, since each stock earns the market's return over time", "It is safer, since the 4% are easy to spot in advance"],
      ex: "The other 96% together did about as well as Treasury bills, the safest short term loans to the US government. Nobody can reliably pick the few big winners in advance, so an owner of a handful of stocks can easily hold none of them. Owning the whole index guarantees holding all of them." },
    { id: "g-loss", topic: "diversify", gen: function (R) {
        var n, each, k, loss, t = 0;
        do { n = R.int(5, 60); each = R.int(1, 20) * 100; k = R.int(1, Math.min(3, n - 1)); loss = k / n * 100; }
        while ((isTie(loss, 0.01) || roundTo(loss, 0.01) === roundTo(k / (n - k) * 100, 0.01)) && ++t < 100);
        var tot = n * each, what = k === 1 ? "One of them goes bankrupt and becomes worthless" : (k === 2 ? "Two" : "Three") + " of them go bankrupt and become worthless";
        return num("You put " + usd0(each) + " into each of " + n + " companies, " + usd0(tot) + " in total. " + what + ", and the rest are unchanged. What percent of your total did you lose? Round to two decimals.", loss, 0.01,
          "Each company holds the same " + usd0(each) + ", so the loss is " + k + " of " + n + " equal slices. " + k + " × " + usd0(each) + " = " + usd0(k * each) + " out of " + usd0(tot) + " is " + k + " ÷ " + n + " = " + loss.toFixed(4) + "%, which rounds to " + fx(loss, 2) + "%. The other " + (n - k) + " companies keep earning, which is why spreading money out limits the damage from any one failure.");
      } },
    { id: "g-weight", topic: "diversify", gen: function (R) {
        var nm = ["A", "B", "C"], rows, caps, tot, ti, w, pw, t = 0; // shares in millions, caps in billions
        do {
          rows = nm.map(function (x) { return { n: x, p: R.int(1500, 60000) / 100, s: R.int(2, 60) * 50 }; });
          caps = rows.map(function (r) { return r.p * r.s / 1000; }); tot = sum(caps); ti = R.int(0, 2);
          w = caps[ti] / tot * 100; pw = rows[ti].p / sum(rows.map(function (r) { return r.p; })) * 100;
        } while ((isTie(w, 0.01) || roundTo(w, 0.01) === roundTo(pw, 0.01) || roundTo(w, 0.01) === roundTo(100 / 3, 0.01)) && ++t < 100);
        var b = function (x) { return "$" + x.toLocaleString("en-US", { maximumFractionDigits: 4 }) + " billion"; };
        return num("An index holds three companies and weights them by market cap. " + rows.map(function (r) { return "Company " + r.n + " trades at " + usd(r.p) + " with " + mil(r.s) + " shares."; }).join(" ") + " What percent of the index does company " + nm[ti] + " make up? Round to two decimals.", w, 0.01,
          "Each company's weight is its market cap over the total. " + rows.map(function (r, i) { return r.n + " is " + mil(r.s) + " × " + usd(r.p) + " = " + b(caps[i]); }).join(", ") + ", for a total of " + b(tot) + ". Company " + nm[ti] + " makes up " + b(caps[ti]) + " ÷ " + b(tot) + " = " + w.toFixed(4) + "%, which rounds to " + fx(w, 2) + "%. Weighting by share price alone would give " + fx(pw, 2) + "%, which is wrong because price says nothing about how many shares exist.");
      } },

    // ================= sum. Positive sum versus zero sum
    { id: "z1", topic: "sum", q: "Why is owning shares called positive sum?",
      opts: ["Companies earn new profit from customers, and it belongs to owners", "Share prices are bound to rise if you wait long enough for them", "Buyers of shares eventually make money on the trade", "The exchange credits extra money to owners' accounts each year"],
      ex: "The profits are new money created by the businesses. Owners as a group receive them without anyone on the other side of a trade losing." },
    { id: "z2", topic: "sum", q: "Why is an ES futures contract zero sum before fees?",
      opts: ["It is an agreement between two people, so gains and losses always cancel", "The S&P 500 index level never really changes over the long run", "The exchange keeps all of the profits from every contract it clears", "Futures contracts always expire worthless for both of the two sides"],
      ex: "An ES contract is not a piece of any business. Every point the long gains, the short loses, at any holding period." },
    { id: "z3", topic: "sum", q: "Which part of owning stocks is NOT positive sum?",
      opts: ["Gains and losses from changes in the multiple", "Dividends paid out of the company's profits", "Buybacks paid for out of the company's profits", "Profit growth that comes from reinvestment"],
      ex: "If you buy at a P/E of 30 and sell at 15, the drop is your loss and the next buyer's potential gain. The earnings themselves are the positive sum part." },
    { id: "z4", topic: "sum", q: "A day trader buys 100 shares and sells them five minutes later for a profit. Who mostly paid for that profit?",
      opts: ["Whoever sold to them low or bought from them high", "The company, out of the profit it earned in those five minutes", "The exchange, which pays traders a share of its fees", "Nobody, because owning stocks is a positive sum game"],
      ex: "In five minutes the business earns almost nothing for its owners, so a five minute trade is effectively a transfer between traders, even though the thing traded is a share." },
    { id: "z5", topic: "sum", q: "Why can an individual stock owner still lose money even though ownership is positive sum for owners as a group?",
      opts: ["They can buy at a high multiple and sell low, or own a firm that fails", "Company profits are paid out to the large investment funds first", "Dividends are taxed away before they reach the small owners", "Companies must buy back small owners' shares at a loss each year"],
      ex: "The group collects the earnings, but individuals can buy high, sell low, or concentrate in losers. Investing Week 7 is about why so many do." },
    { id: "z6", topic: "sum", q: "One of the largest studies of day trading used every trade in Taiwan from 1992 to 2006. What did it find?",
      opts: ["Fewer than 1 in 100 could reliably beat the market after fees", "About half of them beat the market after fees in a typical year", "Day traders as a group beat long term investors after fees", "Most of the day traders roughly broke even once fees were paid"],
      ex: "Barber, Lee, Liu and Odean (2014) found that less than 1% of day traders could predictably and reliably earn positive abnormal returns net of fees,, meaning more than the market itself gave, year after year." },
    { id: "z7", topic: "sum", q: "What three things does long term ownership require of an investor to collect roughly the market's return?",
      opts: ["Own many businesses, keep costs low, and hold through bad years", "Predict the next crash, sell just before it, and buy back in after it", "Trade often, use borrowed money, and follow the daily news closely", "Own one great company, hold it forever, and never diversify at all"],
      ex: "The profits flow to owners by default. Costs, panic selling and concentration are the usual things that take an investor below the market's return." },
    { id: "z8", topic: "sum", q: "In one year ES rises 300 points. Before fees, what is the combined gain of every ES contract holder?",
      opts: ["Zero", "300 points per contract", "The S&P 500 companies' total profit", "Half of 300 points"],
      ex: "Every long's gain is matched by a short's loss. Company profits go to share owners, not to futures holders." },
    { id: "z9", topic: "sum", q: "Which of these is only a transfer from one person to another, not profit flowing to owners?",
      opts: ["A buyer gains because the P/E rose from 15 to 20 while earnings stayed flat", "A company pays part of its yearly profit to its owners as dividends", "A company cancels shares it bought back with its yearly profit", "A company's new stores earn more than owners could get elsewhere"],
      ex: "With earnings flat, the whole gain came from the multiple, which is just what the next buyer agreed to pay. That money came from another investor, not from customers. The other three are the company's profit reaching its owners as dividends, buybacks and reinvestment." },
    { id: "z10", topic: "sum", q: "Before costs, why must active stock pickers as a group earn the market's return?",
      opts: ["Together they hold, in effect, the whole market", "The exchange caps each trader's return at the market's", "Their trades cancel, so the group ends up with zero profit", "They tend to buy the same few large stocks at the same time"],
      ex: "Owning the market is positive sum. Trying to beat it is not. As a group the pickers hold, in effect, the market, so every dollar one earns above it another earns below it. After costs the group falls behind. Investing Week 2 builds this." },

    // ================= read. Ronald Read's story
    { id: "r1", topic: "read", q: "What jobs did Ronald Read hold for most of his working life?",
      opts: ["Gas station attendant, then part time janitor", "Stockbroker, then branch manager at a local bank", "Factory owner, then real estate investor", "Accountant, then a financial advisor"],
      ex: "He worked about 25 years at Haviland's service station in Brattleboro, later as a part owner with his brother, until 1979. He then spent 17 years as a part time janitor at J. C. Penney, until 1997. He never earned a large salary." },
    { id: "r2", topic: "read", q: "How large was Ronald Read's estate, and how much did he leave to the hospital and the library?",
      opts: ["Nearly $8 million, with $4.8 million and $1.2 million", "About $800,000, split evenly between the two of them", "About $80 million, most of it to the library", "About $2 million, most of it to the hospital"],
      ex: "His estate was nearly $8 million. Brattleboro Memorial Hospital received $4.8 million and Brooks Memorial Library $1.2 million, the largest gifts either had received." },
    { id: "r3", topic: "read", q: "According to The Wall Street Journal, how many companies did Ronald Read own shares in when he died?",
      opts: ["At least 95", "Exactly 3", "About 10", "More than 2,000"],
      ex: "The Journal reported at least 95 holdings, many held for decades, among them Procter and Gamble, JPMorgan Chase, Johnson and Johnson, J. M. Smucker and CVS." },
    { id: "r4", topic: "read", q: "What did Ronald Read generally do with the dividends his companies paid him?",
      opts: ["Used them to buy more shares", "Spent them on living costs", "Kept them in a savings account", "Gave them to charity each year"],
      ex: "He reinvested dividends into more shares, which paid more dividends, which bought more shares. That is compounding at work." },
    { id: "r5", topic: "read", q: "Which of these companies did Ronald Read own that went bankrupt in 2008?",
      opts: ["Lehman Brothers", "Procter and Gamble", "J. M. Smucker", "CVS Health"],
      ex: "Lehman Brothers failed in September 2008 and its shares became nearly worthless. Because he owned dozens of companies, it barely dented his fortune. He owned the other three too, and they did not fail." },
    { id: "r6", topic: "read", q: "Which kind of company did Ronald Read reportedly avoid?",
      opts: ["Technology and fashionable stocks", "Banks and other financial companies", "Makers of everyday consumer goods", "Companies that paid regular dividends"],
      ex: "He stuck to long established businesses, including banks and consumer goods makers that paid dividends, and avoided technology and whatever was fashionable." },
    { id: "r7", topic: "read", q: "Why can we NOT say exactly how Ronald Read's $8 million was built year by year?",
      opts: ["Nobody published his yearly amounts or exact returns", "His records were destroyed in the 2008 financial crash", "Stock prices from before 2000 are no longer known", "He invested through secret accounts in other countries"],
      ex: "The reporting describes his holdings and habits, not his yearly contributions or returns. The lesson's numbers are a plausibility check, not his history." },
    { id: "r8", topic: "read", q: "Who lost the money Ronald Read gained?",
      opts: ["Nobody had to, because it came from his companies' profits", "The investors who sold him his shares at prices that were too low", "The traders who took the other side of his ES futures contracts", "The hospital and the library, which received it after his death"],
      ex: "His gains came from the profits of businesses, delivered and compounded over decades. That is the positive sum answer to the lesson's one question." },
    { id: "r9", topic: "read", q: "Investing $2,000 at the end of every year for 55 years at 10% ends near $3.8 million, and reaching $8 million the same way takes about $4,300 a year. What does the lesson conclude about Ronald Read?",
      opts: ["He saved a large share of his pay, or his picks beat the market, or both", "He must have had inside information that other investors lacked", "He put in exactly $2,000 a year and earned exactly 10% a year", "His result is impossible, so the reports of his estate must be wrong"],
      ex: "In 1959 $2,000 a year was a lot for a mechanic, and the check needs about $4,300 a year at the market's average to reach $8 million. So either he saved a very large share of what he earned from early on, or his picks did better than average, or both. Nobody published the numbers that would settle it. The engine itself is ordinary, decades of saving plus growth on growth." },
    { id: "r10", topic: "read", q: "Where did Ronald Read keep the paper certificates proving his share ownership?",
      opts: ["In a safe deposit box at his bank", "With his stepchildren, who kept them at home", "At the stock exchange, in a vault for small owners", "In the library he later funded"],
      ex: "His certificates sat in a safe deposit box at his bank, a stack about five inches thick." },
    { id: "r11", topic: "read", q: "Besides his companies' profits, which two things does the lesson credit for how much Ronald Read ended up with?",
      opts: ["Time, more than five decades of compounding, and rarely selling", "A large salary late in his career and a few lucky technology stocks", "Tips from the bank that held his certificates and frequent trading", "Borrowed money that magnified his gains and a focus on new companies"],
      ex: "He had time, more than five decades by the Journal's account of a purchase he made in 1959, so growth on growth did most of the work. And he rarely sold, so he paid very little in trading costs and never handed his gains to someone on the other side of a panic." },
    { id: "r12", topic: "read", q: "Why does the lesson treat Ronald Read as a puzzle rather than as proof that his approach works?",
      opts: ["His story was reported because it is rare, and ordinary results are not", "His estate was not confirmed, so the $8 million may not be real", "He made nearly all of his money from a single lucky stock pick", "Long term investing has not worked for anyone besides him"],
      ex: "Nobody writes about the frugal janitor who saved for fifty years and ended with an ordinary amount. One surprising story proves nothing, so the lesson checks his result against arithmetic and a century of market data instead." }
  ];

  TA.BANKS["i1"] = {
    week: "i1",
    examSize: 15,
    topics: { share: "What a share is", measures: "Market cap, EPS and P/E", ratios: "Company math", dividends: "Dividends", buybacks: "Buybacks", paths: "Where profit goes", price: "Price and earnings", growth: "Compounding math", history: "The long run record", diversify: "Diversification and indexes", sum: "Positive sum and zero sum", read: "Ronald Read" },
    items: items
  };
})();
