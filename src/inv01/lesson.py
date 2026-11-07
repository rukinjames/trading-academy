"""Unit 2, investing lane. Eight million dollars of patience.

Color meanings for the whole lesson. One color, one meaning. Where they overlap with the trading
lessons they mean the same thing there.
    gold   (k3)  a price that actually traded. Price lines on every chart are gold
    green  (k7)  earnings, the profit a company makes, including profit kept and reinvested
    teal   (k5)  dividends, cash paid out to owners
    blue   (k1)  the buy side. Here mostly the company buying back its own shares
    red    (k2)  the sell side. In this lesson only the short side of an ES contract
    purple (k6)  one owner's slice of a company, the shares you or Ronald Read own, and the
                 value of your holding in the calculator
    amber  (k8)  growth on earlier growth, the extra that compounding adds
    gray   (k4)  shares that no longer exist, cancelled or worth zero
    neutral panel   the rest of the company, shares owned by everyone else
    ink outline (sym)  a plain neutral item. Ordinary dates on the timeline, plain growth in the
                 compounding figure, the cash box, and the rows paid before the owners
    ink fill (aff)  the money Read gave away on the timeline, and the plain data bars of the
                 98 year chart, where position above or below zero carries the meaning
    dashed ink outline (hl2)  something that is now empty. Cash spent, or owners paid nothing
"""
from svgkit import *
import math

FIGS = {}
TC = "∶"  # ratio sign for clock style numbers, never a prose colon


# ------------------------------------------------------------------ Read's life timeline
def life():
    ev = [("1921", "Born in Dummerston, Vermont", "sym"),
          ("1940", "Finishes high school, the first in his family", "sym"),
          ("1940s", "World War II, home by late 1945", "sym"),
          ("1959", "Buys 39 Pacific Gas and Electric shares", "k6"),
          ("To 1979", "Attendant, mechanic, later part owner", "sym"),
          ("1980 to 1997", "Part time janitor at J. C. Penney", "sym"),
          ("2008", "Lehman Brothers, one of his stocks, fails", "k4"),
          ("June 2014", "Dies at 92", "sym"),
          ("Feb 2015", "His will gives $6 million to two local causes", "aff")]
    AX = 112
    o = L(AX, 16, AX, 22 + len(ev) * 36, "ln")
    for i, (t, txt, cls) in enumerate(ev):
        y = 32 + i * 36
        o += (f'<circle cx="{AX}" cy="{y}" r="7" class="{cls}"' + (' opacity=".5"' if cls == "k4" else "") + '/>'
              + tx(AX - 14, y + 4, t, "b", "end") + tx(AX + 14, y + 4, txt, "", "start"))
    return svg(400, 30 + len(ev) * 36, o, "Timeline of Ronald Read's life")


FIGS["life"] = life()


# ------------------------------------------------------------------ a company cut into shares
def slices(own=50, total=1000, label_you="You, 50 shares"):
    o = tx(200, 18, "The shop, cut into 1,000 equal shares", "b")
    cells = 20  # each cell is 50 shares
    w = 360 / cells
    for i in range(cells):
        cls = "k6" if i < own // 50 else "panel"
        o += f'<rect x="{20 + i * w:.1f}" y="34" width="{w - 2:.1f}" height="40" rx="3" class="{cls}"/>'
    o += L(20, 86, 20 + (own // 50) * w - 2, 86, "ln") + tx(20, 102, label_you, "", "start")
    o += L(20 + (own // 50) * w, 86, 378, 86, "thin") + tx(378, 102, "Everyone else, 950 shares", "sm", "end")
    o += tx(200, 128, "Each block is 50 shares. 50 of 1,000 is 5% of the shop.", "sm")
    return svg(400, 140, o, "A company divided into equal shares")


FIGS["slices"] = slices()


# ------------------------------------------------------------------ who gets paid, in order
def paid(good):
    sales = 100 if good else 70
    X0, S = 168, 1.9
    X = lambda v: X0 + v * S
    o = tx(200, 16, f"Where ${sales} of sales goes, in order", "b")
    rows = [("Customers pay", 0, sales, "sym", f"${sales}"),
            ("Suppliers and staff", 0, 70, "sym", "$70"),
            ("Lenders' interest", 70, 75, "sym", "$5" if good else "$5, still owed"),
            ("Taxes", 75 if good else None, 80 if good else None, "sym", "$5" if good else "$0, no tax"),
            ("Owners, what is left", 80 if good else 75, 100 if good else 85, "k7" if good else "hl2", "$20" if good else "$0")]
    for i, (lab, a, b, cls, amt) in enumerate(rows):
        yc = 44 + i * 34
        o += tx(14, yc + 4, lab, "b" if i == 4 else "", "start")
        if a is None:
            o += tx(X(75) + 6, yc + 4, amt, "sm", "start")
            continue
        o += f'<rect x="{X(a):.1f}" y="{yc - 10}" width="{(b - a) * S:.1f}" height="20" rx="3" class="{cls}"/>'
        o += tx(X(b) + 6, yc + 4, amt, "b" if i == 4 else "sm", "start")
    o += L(X(sales), 30, X(sales), 196, "dash")
    o += tx(X(sales), 208, "end of the sales", "xs")
    if good:
        o += tx(200, 228, "The owners get the last $20, after everyone else.", "sm")
    else:
        o += tx(200, 228, "The lenders' $5 comes from savings or new borrowing.", "sm")
        o += tx(200, 246, "The owners get nothing this year, and never a bill.", "sm")
    return svg(400, 254, o, "Who gets paid from a company's sales, and in what order")


TOGGLES = {"paid": [
    ("A good year", paid(True), "A good year. Customers pay $100. Suppliers and staff, lenders and taxes are paid first, $80 in all. The last $20 is the profit, and it belongs to the owners."),
    ("A bad year", paid(False), "A bad year. Only the sales change, to $70. Suppliers and staff still take $70, and the lenders are still owed their $5, so the company pays them from savings or new borrowing. There is no profit, so there is no tax and nothing for the owners. Owners are paid last, so the worst they get in a year is nothing."),
]}


# ------------------------------------------------------------------ where profit goes
def profit_split():
    o = tx(200, 18, "One year of profit, $100 million", "b")
    parts = [(40, "k5", "Dividends", "$40m"), (25, "k1", "Buybacks", "$25m"), (35, "k7", "Reinvested", "$35m")]
    x = 20
    for v, cls, name, amt in parts:
        w = 360 * v / 100
        o += f'<rect x="{x:.1f}" y="34" width="{w - 2:.1f}" height="40" rx="3" class="{cls}"/>' + tx(x + (w - 2) / 2, 59, amt, "on")
        o += tx(x + (w - 2) / 2, 96, name, "b")
        x += w
    o += tx(200, 124, "Made up split. Every company chooses its own.", "sm")
    return svg(400, 136, o, "Profit split into dividends, buybacks and reinvestment")


FIGS["split"] = profit_split()


# ------------------------------------------------------------------ buyback stepper with the company's cash
BW, BX0, BY, BH = 24, 14, 40, 44
CX, CY, CW, CH = 290, 34, 96, 56


def blocks(buying=0, cancelled=0):
    o = ""
    for i in range(10):
        x = BX0 + i * BW
        if i == 0:
            cls = "k6"
        elif i >= 10 - cancelled:
            cls = "k4"
        elif i >= 10 - cancelled - buying:
            cls = "k1"
        else:
            cls = "panel"
        op = ' opacity=".35"' if cls == "k4" else ""
        o += f'<rect x="{x + 2}" y="{BY}" width="{BW - 4}" height="{BH}" rx="3" class="{cls}"{op}/>'
        if cls == "k4":
            o += L(x + 5, BY + 6, x + BW - 5, BY + BH - 6, "thin") + L(x + BW - 5, BY + 6, x + 5, BY + BH - 6, "thin")
    o += tx(BX0 + 5 * BW, BY + BH + 16, "Shares", "sm")
    return o


def cash(amount, empty=False):
    o = f'<rect x="{CX}" y="{CY}" width="{CW}" height="{CH}" rx="6" class="{"hl2" if empty else "sym"}"/>'
    o += tx(CX + CW / 2, CY + 22, "Cash", "sm") + tx(CX + CW / 2, CY + 44, amount, "b")
    return o


def bb_lines(a, b, c):
    return tx(200, 130, a, "") + tx(200, 150, b, "sm") + tx(200, 174, c, "b")


TITLE_BB = tx(200, 18, "A company earning $100 a year, with cash in the bank", "b")
bb1 = svg(400, 190, TITLE_BB + blocks() + cash("$250") + bb_lines("Business $1,000 + cash $250 = $1,250", "10 shares, each worth $125", "Earnings per share $10.00"), "Before the buyback")
bb2 = svg(400, 190, TITLE_BB + blocks(buying=2) + cash("$250") + arrow(CX - 2, 62, BX0 + 10 * BW + 2, 62)
          + tx((CX + BX0 + 10 * BW) / 2, 52, "$250", "xs")
          + bb_lines("The company pays two sellers $250 in all", "$125 each, a fair price", "Earnings per share $10.00"), "The company buys two shares")
bb3 = svg(400, 190, TITLE_BB + blocks(cancelled=2) + cash("$0", empty=True) + bb_lines("Business $1,000 + cash $0 = $1,000", "8 shares, each worth $125", "Earnings per share $12.50"), "After the buyback")


def bb_compare():
    o = TITLE_BB
    o += f'<rect x="10" y="32" width="184" height="108" rx="8" class="panel"/>' + f'<rect x="206" y="32" width="184" height="108" rx="8" class="panel"/>'
    o += tx(102, 52, "The buyback", "b") + tx(298, 52, "$250 as a dividend instead", "b")
    o += f'<rect x="80" y="66" width="44" height="44" rx="3" class="k6"/>' + tx(102, 128, "Your share, $125", "")
    o += f'<rect x="236" y="66" width="44" height="44" rx="3" class="k6"/>' + f'<circle cx="334" cy="88" r="20" class="k5"/>' + tx(334, 93, "$25", "on")
    o += tx(258, 93, "$100", "on") + tx(298, 128, "Share $100 + cash $25", "")
    o += tx(102, 93, "$125", "on")
    o += tx(200, 162, "8 shares, no cash left, or 10 shares and $25 each paid out", "sm")
    o += tx(200, 182, "Either way you end with $125.", "b")
    return svg(400, 190, o, "A buyback compared with a dividend")


BB = [
    (bb1, "The company earns $100 a year, and say the business itself is worth $1,000. It also holds $250 of cash. Your one share, the purple one, is 10% of both, $100 of the business and $25 of the cash, so it is worth $125. Earnings per share are $100 ÷ 10 = $10."),
    (bb2, "Two owners want to sell. The company pays them $125 each, a fair price, using all $250 of its cash. The two blue shares are the ones it is buying. Nothing has happened to your share yet."),
    (bb3, "The two shares are cancelled, so 8 remain and earnings per share rise to $100 ÷ 8 = $12.50. Your slice of the profit grew from 10% to 12.5%, and 12.5% of the $1,000 business is $125. But the company's cash is gone, and $25 of it was yours. Your share is worth $125, exactly what it was worth before. The next stage compares this with a dividend."),
    (bb_compare(), "Here is the same $250 paid as a dividend instead, $25 to each of the 10 shares. Your share is then worth $100, its tenth of the business, plus $25 in your hand. Either way you end with $125. A buyback and a dividend deliver the same profit in two packages. A buyback helps the owners who stay only if the company buys its shares for less than they are worth."),
]
STEPPERS = {"buyback": dict(frames=[(i + 1, "", f"Stage {i + 1} of 4", f, c) for i, (f, c) in enumerate(BB)])}


# ------------------------------------------------------------------ short run vs long run price
random.seed(7)


def chart(points_gold, points_green, xlab0, xlab1, ylo, yhi, title, ylabs, green_label):
    X0, X1, Y0, Y1 = 50, 385, 34, 196
    n = len(points_gold)
    X = lambda i: X0 + i / (n - 1) * (X1 - X0)
    Y = lambda v: Y1 - (v - ylo) / (yhi - ylo) * (Y1 - Y0)
    o = tx(218, 18, title, "b")
    for v in ylabs:
        o += L(X0, Y(v), X1, Y(v), "thin") + tx(X0 - 5, Y(v) + 4, f"${v:,.0f}", "sm", "end")
    o += L(X0, Y1, X1, Y1, "ln") + tx(X0, Y1 + 16, xlab0, "sm", "start") + tx(X1, Y1 + 16, xlab1, "sm", "end")
    dg = " ".join(("M" if i == 0 else "L") + f"{X(i):.1f},{Y(v):.1f}" for i, v in enumerate(points_green))
    o += f'<path d="{dg}" class="k7s" style="fill:none;stroke-width:2.2;stroke-dasharray:6 4"/>'
    dp = " ".join(("M" if i == 0 else "L") + f"{X(i):.1f},{Y(v):.1f}" for i, v in enumerate(points_gold))
    o += f'<path d="{dp}" class="k3s" style="fill:none;stroke-width:2.4"/>'
    o += f'<line x1="60" y1="226" x2="84" y2="226" class="k3s" style="stroke-width:2.4"/>' + tx(90, 230, "Price", "sm", "start")
    o += f'<line x1="150" y1="226" x2="174" y2="226" class="k7s" style="stroke-width:2.2;stroke-dasharray:6 4"/>' + tx(180, 230, green_label, "sm", "start")
    return svg(400, 240, o, title)


# short run: 20 trading days, earnings fixed
sr = [100.0]
for _ in range(19):
    sr.append(100 + 0.55 * (sr[-1] - 100) + random.uniform(-2.2, 2.2))
short = chart(sr, [100.0] * 20, "Day 1", "Day 20", 90, 110, "Twenty trading days", [92, 96, 100, 104, 108], "Earnings per share × 20")
# long run: 30 years, EPS grows 7% a year, P/E wanders between about 12 and 26
eps = [5 * 1.07 ** t for t in range(31)]
pe = [19 + 6 * math.sin(t / 4.2) + random.uniform(-1.5, 1.5) for t in range(31)]
lr = [e * p for e, p in zip(eps, pe)]
long_ = chart(lr, [e * 19 for e in eps], "Year 0", "Year 30", 0, 1000, "Thirty years", [0, 250, 500, 750, 1000], "Earnings per share × 19")
TOGGLES["runs"] = [
    ("Twenty days", short, "Over a month, the company's earnings do not change at all, so the green line is flat. The price still zigzags up and down every day. Almost all of that is the order book from Unit 1, orders arriving and leaving, not a change in the business."),
    ("Thirty years", long_, "Over thirty years the earnings grow about 7% a year, and the green line, earnings times a steady multiple of 19, climbs with them. The gold price swings above and below it, sometimes for years. This made up company's multiple was built to wander around 19 and come back. That is the model from the aside above. Real multiples have mostly behaved this way over the last century, but nothing forces them to."),
]


# ------------------------------------------------------------------ growth on growth
def compound_bars():
    o = tx(200, 18, "$1,000 growing 10% a year", "b")
    X0, Y1 = 46, 214
    top = 2600.0
    Y = lambda v: Y1 - v / top * 118
    for v in (0, 1000, 2000):
        o += L(X0, Y(v), 390, Y(v), "thin") + tx(X0 - 5, Y(v) + 4, f"${v:,.0f}", "sm", "end")
    for n in range(11):
        x = X0 + 6 + n * 31
        total = 1000 * 1.1 ** n
        simple = 100 * n
        extra = total - 1000 - simple
        o += f'<rect x="{x}" y="{Y(1000):.1f}" width="24" height="{Y(0) - Y(1000):.1f}" class="panel"/>'
        if simple:
            o += f'<rect x="{x + 0.75}" y="{Y(1000 + simple):.1f}" width="22.5" height="{Y(1000) - Y(1000 + simple):.1f}" class="sym"/>'
        if extra > 0.5:
            o += f'<rect x="{x}" y="{Y(total):.1f}" width="24" height="{Y(1000 + simple) - Y(total):.1f}" class="k8"/>'
        o += tx(x + 12, Y1 + 14, str(n), "sm")
    o += tx(218, Y1 + 30, "Years", "sm")
    o += f'<rect x="56" y="34" width="12" height="12" class="panel"/>' + tx(74, 44, "the $1,000 you put in", "sm", "start")
    o += f'<rect x="56" y="52" width="12" height="12" class="sym"/>' + tx(74, 62, "plain 10% of the $1,000, $100 each year", "sm", "start")
    o += f'<rect x="56" y="70" width="12" height="12" class="k8"/>' + tx(74, 80, "growth on earlier growth", "sm", "start")
    o += tx(386, Y(1000 * 1.1 ** 10) - 6, "$2,594", "b", "end")
    return svg(400, 258, o, "Growth on growth over ten years")


FIGS["compound"] = compound_bars()


# ------------------------------------------------------------------ 98 years, one bar each
# S&P 500 total return with dividends reinvested, percent, 1928 to 2025, from Damodaran's histretSP table.
SP = [43.81, -8.30, -25.12, -43.84, -8.64, 49.98, -1.19, 46.74, 31.94, -35.34, 29.28, -1.10, -10.67, -12.77, 19.17,
      25.06, 19.03, 35.82, -8.43, 5.20, 5.70, 18.30, 30.81, 23.68, 18.15, -1.21, 52.56, 32.60, 7.44, -10.46, 43.72,
      12.06, 0.34, 26.64, -8.81, 22.61, 16.42, 12.40, -9.97, 23.80, 10.81, -8.24, 3.56, 14.22, 18.76, -14.31, -25.90,
      37.00, 23.83, -6.98, 6.51, 18.52, 31.74, -4.70, 20.42, 22.34, 6.15, 31.24, 18.49, 5.81, 16.54, 31.48, -3.06,
      30.23, 7.49, 9.97, 1.33, 37.20, 22.68, 33.10, 28.34, 20.89, -9.03, -11.85, -21.97, 28.36, 10.74, 4.83, 15.61,
      5.48, -36.55, 25.94, 14.82, 2.10, 15.89, 32.15, 13.52, 1.38, 11.77, 21.61, -4.23, 31.21, 18.02, 28.47, -18.04,
      26.06, 24.88, 17.78]
assert len(SP) == 98 and sum(1 for v in SP if v < 0) == 26


def years_chart():
    X0, X1 = 40, 390
    step = (X1 - X0) / 98
    Y = lambda v: 30 + (60 - v) / 110 * 180
    o = tx(215, 16, "98 years of US stocks, one bar each", "b")
    for g in (60, 40, 20, -20, -40):
        o += L(X0, Y(g), X1, Y(g), "thin") + tx(X0 - 4, Y(g) + 4, ("−" if g < 0 else "") + f"{abs(g)}%", "sm", "end")
    for i, v in enumerate(SP):
        x = X0 + i * step + 0.45
        top, bot = (Y(v), Y(0)) if v >= 0 else (Y(0), Y(v))
        o += f'<rect x="{x:.2f}" y="{top:.1f}" width="2.7" height="{max(bot - top, 0.6):.1f}" class="aff" style="stroke:none"/>'
    o += L(X0, Y(0), X1, Y(0), "ln") + tx(X0 - 4, Y(0) + 4, "0%", "sm", "end")
    o += L(X0, Y(10), X1, Y(10), "dash")
    bx = lambda i: X0 + i * step + 1.8
    o += tx(bx(26) - 5, Y(52.56) + 5, "1954, +53%", "xs", "end")
    o += tx(bx(3) + 5, Y(-43.84) + 4, "1931, −44%", "xs", "start")
    o += tx(bx(80) - 5, Y(-36.55) + 4, "2008, −37%", "xs", "end")
    for i, yr in ((0, "1928"), (32, "1960"), (62, "1990"), (97, "2025")):
        o += tx(bx(i), 226, yr, "sm")
    o += L(120, 242, 148, 242, "dash") + tx(154, 246, "the 10% compounded average", "sm", "start")
    return svg(400, 254, o, "S&amp;P 500 total return for each year from 1928 to 2025")


FIGS["years"] = years_chart()


# ------------------------------------------------------------------ one basket or ninety five
def baskets(n):
    o = tx(200, 18, "One company" if n == 1 else "95 companies, equal amounts in each", "b")
    if n == 1:
        o += f'<rect x="130" y="40" width="140" height="140" rx="6" class="k4" opacity=".35"/>' + L(140, 50, 260, 170, "thin") + L(260, 50, 140, 170, "thin")
        o += tx(200, 206, "It goes bankrupt. You lose 100%.", "b")
    else:
        s = 20
        for i in range(95):
            r, c = divmod(i, 19)
            x, y = 10 + c * s, 40 + r * 28
            gone = i == 7
            o += f'<rect x="{x + 1}" y="{y}" width="{s - 3}" height="22" rx="3" class="{"k4" if gone else "k6"}"{" opacity=\".35\"" if gone else ""}/>'
        o += tx(200, 206, "One of them goes bankrupt. You lose 1 of 95, about 1.05%.", "b")
    return svg(400, 220, o, "Owning one company versus ninety five")


TOGGLES["baskets"] = [
    ("One company", baskets(1), "Everything you own is in one company. When it fails, its shares become worthless, and so does your whole investment."),
    ("95 companies", baskets(95), "The same money spread equally over 95 companies, roughly the number Ronald Read owned. One goes bankrupt and turns gray. The other 94 keep earning. Read's real holdings were not equal sizes, so treat the 1.05% as a picture of the idea, not a measurement of his loss."),
]


# ------------------------------------------------------------------ where the money comes from
def two_games():
    o = tx(100, 18, "An ES futures contract", "b") + tx(300, 18, "A share of a company", "b")
    # left, zero sum
    o += f'<rect x="20" y="30" width="160" height="32" rx="8" class="sym"/>' + tx(100, 51, "Price rises 10 points")
    o += arrow(80, 62, 60, 92) + arrow(120, 62, 140, 92)
    o += f'<rect x="20" y="94" width="74" height="36" rx="6" class="k1"/>' + tx(57, 117, "Long +10", "on")
    o += f'<rect x="106" y="94" width="74" height="36" rx="6" class="k2"/>' + tx(143, 117, "Short −10", "on")
    o += tx(100, 218, "Total for everyone", "sm") + tx(100, 238, "0", "b")
    # right, positive sum
    o += f'<rect x="220" y="30" width="160" height="32" rx="8" class="sym"/>' + tx(300, 51, "Customers buy products")
    o += arrow(300, 62, 300, 78)
    o += f'<rect x="262" y="80" width="76" height="26" rx="6" class="k7"/>' + tx(300, 98, "Profit", "on")
    for xc, cls, name in ((240, "k5", "Dividends"), (300, "k1", "Buybacks"), (360, "k7", "Reinvested")):
        o += arrow(300 + (xc - 300) * 0.25, 106, xc, 120)
        o += f'<rect x="{xc - 22}" y="122" width="44" height="18" rx="4" class="{cls}"/>' + tx(xc, 155, name, "sm")
        o += arrow(xc, 160, 300 + (xc - 300) * 0.4, 178)
    o += f'<rect x="250" y="180" width="100" height="22" rx="6" class="sym"/>' + tx(300, 196, "All owners", "b")
    o += tx(300, 218, "Total for all owners", "sm") + tx(300, 238, "the profit, year after year", "b")
    o += L(200, 28, 200, 244, "dash")
    return svg(400, 250, o, "Zero sum futures versus positive sum ownership")


FIGS["games"] = two_games()


CLASSIFY = {"games": dict(
    noun="Situation",
    options=[("pos", "Profits flow to owners"), ("zero", "Only a transfer")],
    items=[
        ("You and a friend each take one side of an ES contract and hold it for a year.", "zero",
         "A futures contract only moves money between its two sides. Whatever one of you gains over the year, the other loses."),
        ("A company pays out part of its yearly profit as dividends.", "pos",
         "The cash comes from customers buying the company's products. It goes to every owner and nobody on the other side of a trade loses it."),
        ("A day trader buys 100 shares and sells them five minutes later at a higher price.", "zero",
         "In five minutes the business earns almost nothing for its owners, so the gain came from whoever sold low or bought high. Over such a short time trading shares is effectively a transfer."),
        ("A company reinvests its profit in new stores that earn more than the owners could have earned elsewhere.", "pos",
         "The new stores produce new profit that belongs to all the owners. The group as a whole is richer and nobody had to lose."),
        ("You buy a share from another investor at a P/E of 30 and sell it a year later at a P/E of 15. Earnings did not change.", "zero",
         "The business earned the same either way. You paid twice as much for its earnings as the next buyer did. The investor who sold to you at 30 got a high price, and the one who buys from you at 15 gets the same earnings for half the price. The multiple created no profit. It only decided who paid how much."),
        ("A company uses its profit to buy back and cancel some of its shares.", "pos",
         "The sellers get cash and the remaining owners get a bigger slice of the same profit. The value delivered comes from the company's earnings."),
    ])}


# ------------------------------------------------------------------ compounding calculator
CUSTOM = {"grow": """<div class="widget grow" id="grow">
<p class="flab">Starting amount</p>
<div class="presets" data-g="start"><button type="button" data-v="0">$0</button><button type="button" data-v="1000" class="on">$1,000</button><button type="button" data-v="10000">$10,000</button></div>
<p class="flab">Added at the end of every year</p>
<div class="presets" data-g="add"><button type="button" data-v="0" class="on">$0</button><button type="button" data-v="1000">$1,000</button><button type="button" data-v="5000">$5,000</button></div>
<p class="flab">Years</p>
<div class="presets" data-g="years"><button type="button" data-v="10">10</button><button type="button" data-v="20">20</button><button type="button" data-v="30" class="on">30</button><button type="button" data-v="40">40</button><button type="button" data-v="50">50</button></div>
<p class="flab">Yearly return, 1928 to 2025 average for US stocks</p>
<div class="presets" data-g="rate"><button type="button" data-v="6.8" class="on">6.8%, after inflation</button><button type="button" data-v="10">10%, before inflation</button></div>
<p class="flab">Dividends</p>
<div class="presets" data-g="div"><button type="button" data-v="re" class="on">Reinvested</button><button type="button" data-v="sp">Spent as they arrive</button></div>
<div class="pbars" id="g_bars"></div>
<div class="pbars" id="g_cmp"></div>
<dl class="out">
<dt>You put in</dt><dd id="g_in"></dd>
<dt>Value at the end</dt><dd id="g_end" class="big"></dd>
<dt>Growth, value minus what you put in</dt><dd id="g_gain"></dd>
<dt>Dividends spent along the way</dt><dd id="g_spent"></dd>
<dt>Years for one lump sum to double at this rate</dt><dd id="g_72"></dd>
</dl>
<p class="say" id="g_say"></p>
</div>"""}

EXTRA_CSS = r"""
.grow .presets button.on{background:var(--ink);border-color:var(--ink);color:var(--card);font-weight:600}
.grow .flab{font-size:.85rem;font-weight:600;margin:.7rem 0 .3rem;color:var(--muted)}
.grow .pbt i{background:var(--k6)}
.grow .stk{display:flex}
.grow .stk i{border-radius:0}
.grow .stk i:first-child{border-radius:3px 0 0 3px}
.grow .stk i.dv{background:var(--k5);border-radius:0 3px 3px 0}
.plan{margin:1rem 0 0;font-size:.95rem}
.plan .planh{font-family:var(--sans);font-weight:700;font-size:.9rem;margin:0 0 .35rem}
.plan ol{padding-left:1.4rem;margin:0}
.plan li{margin:.3rem 0}
.sitting{margin:3.4rem 0 0;padding:1rem 1.25rem;border:1px solid var(--line);border-top:4px solid var(--accent);border-radius:10px;background:var(--card);font-family:var(--sans)}
.sitting p{margin:0;font-size:.95rem;color:var(--muted);line-height:1.5}
.sitting p.sitn{margin:0 0 .35rem;font-size:1.1rem;font-weight:700;color:var(--accent)}
.resume{margin:1.4rem 0 0;padding:.9rem 1.2rem;border:1px solid var(--accent);border-radius:10px;background:var(--wonder);font-family:var(--sans);font-size:.95rem;line-height:1.5}
.resume p{margin:.15rem 0}
.resume .ra{margin-top:.55rem}
.resume a.go{font-weight:700;color:var(--accent)}
.resume a.clear{color:var(--muted);margin-left:1.4rem}
"""

EXTRA_JS = r"""
(function(){
  var W=document.getElementById('grow'); if(!W) return;
  var st={start:1000,add:0,years:30,rate:6.8,div:'re'};
  var DY=3; // illustrative dividend yield in percent, see the lesson text
  function money(x){return '$'+Math.round(x).toLocaleString('en-US');}
  function run(){
    var r=st.rate/100,d=DY/100,g=r-d,v=st.start,vr=st.start,inn=st.start,spent=0,marks=[];
    for(var y=1;y<=st.years;y++){
      if(st.div==='re'){v=v*(1+r);}else{spent+=v*d;v=v*(1+g);}
      vr=vr*(1+r);
      v+=st.add;vr+=st.add;inn+=st.add;
      if(y%10===0)marks.push([y,v]);
    }
    var mx=1;marks.forEach(function(m){mx=Math.max(mx,m[1]);});
    var h='';marks.forEach(function(m){h+='<div class="pbl"><span>After '+m[0]+' years</span><b>'+money(m[1])+'</b></div><div class="pbt"><i style="width:'+Math.max(0.5,m[1]/mx*100)+'%"></i></div>';});
    document.getElementById('g_bars').innerHTML=h;
    var c='';
    if(st.div==='sp'&&inn>0){
      var top=Math.max(vr,v+spent);
      c='<div class="pbl"><span>Shares at the end, plus the teal dividends you spent</span><b>'+money(v)+' + '+money(spent)+'</b></div>'+
        '<div class="pbt stk"><i style="width:'+(v/top*100)+'%"></i><i class="dv" style="width:'+(spent/top*100)+'%"></i></div>'+
        '<div class="pbl"><span>The same money with dividends reinvested</span><b>'+money(vr)+'</b></div>'+
        '<div class="pbt"><i style="width:'+(vr/top*100)+'%"></i></div>';
    }
    document.getElementById('g_cmp').innerHTML=c;
    document.getElementById('g_in').textContent=money(inn);
    document.getElementById('g_end').textContent=money(v);
    document.getElementById('g_gain').textContent=money(v-inn);
    document.getElementById('g_spent').textContent=st.div==='re'?'none, all reinvested':money(spent);
    var rr=st.div==='re'?st.rate:st.rate-DY;
    var exact=Math.log(2)/Math.log(1+rr/100);
    document.getElementById('g_72').textContent=(72/rr).toFixed(1)+' by the rule, '+exact.toFixed(1)+' exactly';
    var s;
    if(inn===0){s='Nothing in, nothing out. Compounding needs something to grow.';}
    else if(st.div==='sp'){
      s='Every dollar you put in became about '+(v/inn).toFixed(1)+' dollars of shares, plus '+(spent/inn).toFixed(1)+' dollars of dividends you spent. Together that is '+((v+spent)/inn).toFixed(1)+'. With dividends spent, the shares only grow by the price part of the return, '+(st.rate-DY).toFixed(1)+'% a year. Press Reinvested and compare.';
    }
    else{
      s='Every dollar you put in became about '+(v/inn).toFixed(1)+' dollars. ';
      if(st.years>=40)s+='Look at the last bar compared with the first. Most of the growth arrives in the final decades.';
      else s+='Now try 40 or 50 years with the same inputs.';
    }
    if(inn>0){
      if(st.rate===6.8)s+=' These are dollars with today\'s buying power.';
      else s+=' These are future dollars, before inflation shrinks what they buy.';
    }
    document.getElementById('g_say').textContent=s;
  }
  W.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;var grp=b.parentNode.getAttribute('data-g');if(!grp)return;
    b.parentNode.querySelectorAll('button').forEach(function(x){x.classList.toggle('on',x===b);});
    var v=b.getAttribute('data-v');st[grp]=(grp==='div')?v:+v;run();});
  run();
})();
// saved progress. Answers, furthest step and sitting, kept in this browser
(function(){try{
  var ID='inv01',KEY='ta.lesson.'+ID,SUM='ta.lessonprogress',stop=false,restoring=false;
  function get(k){try{return JSON.parse(localStorage.getItem(k)||'null');}catch(e){return null;}}
  function put(k,v){if(stop)return;try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
  function $$(s){return [].slice.call(document.querySelectorAll(s));}
  var st=get(KEY);if(!st||typeof st!=='object')st={};
  if(!st.ans||typeof st.ans!=='object')st.ans={};
  st.far=+st.far||0;
  var qs=$$('.quiz .q'),seen={};
  function hash(s){var h=5381;for(var i=0;i<s.length;i++)h=((h*33)^s.charCodeAt(i))>>>0;return h.toString(36);}
  var ids=qs.map(function(q){var t=(q.querySelector('.qt')||q).textContent.replace(/\s+/g,' ').trim(),h=hash(t);seen[h]=(seen[h]||0)+1;return seen[h]>1?h+'.'+seen[h]:h;});
  var steps=$$('h3[id^="s"]').filter(function(h){return /^s\d+$/.test(h.id);});
  var divs=$$('.sitting'),of=divs.length+1;
  function sitOf(el){var k=1;divs.forEach(function(d){if(d.compareDocumentPosition(el)&4)k++;});return k;}
  function stepEl(n){return document.getElementById('s'+n);}
  // recap quizzes say what they recap
  divs.forEach(function(d){var n=d.nextElementSibling;if(n&&n.classList.contains('quiz')){var h=n.querySelector('.qh');if(h)h.textContent='Recap of sitting '+(+d.getAttribute('data-sit')-1);}});
  function answered(){var a=0;ids.forEach(function(id){if(st.ans[id]!=null)a++;});return a;}
  function sitting(){
    var k=1,el=st.far?stepEl(st.far):null;if(el)k=sitOf(el);
    qs.forEach(function(q,i){if(st.ans[ids[i]]!=null)k=Math.max(k,sitOf(q));});
    return k;
  }
  // a sitting is done when the recap of it, at the next divider, is fully answered. The last sitting is done when every question in it is answered
  function isAns(q){return st.ans[ids[qs.indexOf(q)]]!=null;}
  function done(){var d=0;
    for(var k=1;k<=of;k++){var set;
      if(k<of){var n=divs[k-1].nextElementSibling;set=(n&&n.classList.contains('quiz'))?[].slice.call(n.querySelectorAll('.q')):[];}
      else set=qs.filter(function(q){return sitOf(q)===of;});
      if(set.length&&set.every(isAns))d++;}
    return d;}
  function save(){
    put(KEY,st);
    var all=get(SUM);if(!all||typeof all!=='object')all={};
    var cur=all[ID],d=done();
    if(!cur||cur.done!==d||cur.total!==of){all[ID]={done:d,total:of,updated:new Date().toISOString().replace(/\.\d{3}Z$/,'Z')};put(SUM,all);}
  }
  var had=st.far>1||answered()>0;
  // put answered quizzes back by replaying the same clicks through the page's own quiz code
  restoring=true;
  qs.forEach(function(q,i){var o=st.ans[ids[i]];if(o==null||q.getAttribute('data-done'))return;var b=q.querySelector('button[data-o="'+o+'"]');if(b)b.click();});
  restoring=false;
  document.addEventListener('click',function(e){
    if(restoring)return;var b=e.target.closest&&e.target.closest('.quiz .q button[data-o]');if(!b)return;
    var q=b.closest('.q'),i=qs.indexOf(q);if(i<0||!q.getAttribute('data-done')||st.ans[ids[i]]!=null)return;
    st.ans[ids[i]]=b.getAttribute('data-o');save();
  });
  // furthest step reached
  var tick=false;
  function track(){tick=false;var n=0,lim=window.innerHeight*0.5;
    for(var i=0;i<steps.length;i++){if(steps[i].getBoundingClientRect().top<lim)n=+steps[i].id.slice(1);else break;}
    if(n>st.far){st.far=n;save();}}
  window.addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(track);}},{passive:true});
  // pick up where you left off
  if(had){
    var n=Math.max(st.far,1),el=stepEl(n);
    if(el){
      var sec=el.closest('section'),h2=sec&&sec.querySelector('h2');
      var ch=sec?'Chapter '+sec.getAttribute('data-part')+', '+h2.textContent.replace(/^\s*Chapter \d+\s*/,'').trim():'';
      var stt=el.textContent.replace(/^\s*Step \d+\.\s*/,'').trim();
      var box=document.createElement('div');box.className='resume';box.id='resume';
      box.innerHTML='<p><b>Pick up where you left off.</b> <span class="rw"></span></p><p class="ra"><a class="go" href="#s'+n+'"></a><a class="clear" href="#">Start over</a></p>';
      box.querySelector('.rw').textContent=ch+'. Step '+n+', '+stt+(/[.?!]$/.test(stt)?'':'.')+' Sitting '+sitting()+' of '+of+', with '+answered()+' of '+qs.length+' questions answered.';
      box.querySelector('.go').textContent='Go to Step '+n;
      box.querySelector('.clear').addEventListener('click',function(e){e.preventDefault();
        stop=true;
        try{localStorage.removeItem(KEY);var all=get(SUM);if(all&&typeof all==='object'){delete all[ID];localStorage.setItem(SUM,JSON.stringify(all));}}catch(x){}
        try{history.replaceState(null,'',location.pathname+location.search);if('scrollRestoration' in history)history.scrollRestoration='manual';}catch(x){}
        window.scrollTo(0,0);location.reload();});
      var toc=document.getElementById('contents');
      if(toc)toc.parentNode.insertBefore(box,toc);
    }
  }
  save();
}catch(err){}})();
// link back to the academy hub
(function(){var bar=document.querySelector('.bar .in');if(!bar)return;var a=document.createElement('a');a.href='../index.html';a.textContent='Academy';bar.insertBefore(a,bar.firstChild);})();
"""

TITLE = "Eight million dollars of patience. Trading Academy, Unit 2"
BAR = "Unit 2"
OUT = "inv01.html"
CONTENT = ["content-1.html", "content-2.html"]
