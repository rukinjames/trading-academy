"""Week 1. A share for one cent.

Color meanings for the whole lesson. One color, one meaning.
    blue  (k1)  buy side. Resting buy orders (bids), and anything a buyer does
    red   (k2)  sell side. Resting sell orders (asks), and anything a seller does
    gold  (k3)  a trade that actually happened, and the last traded price
    gray  (k4)  an order that was cancelled or pulled from the book
    accent ring / outline (hl)  the spread, the gap between best bid and best ask
    dashed outline (hl2)        a stop order, waiting outside the book where nobody can see it

Candles are drawn hollow when the price closed above where it opened, and filled when it closed
below. On TradingView up candles are green and down candles are red. Red already means sellers in
this lesson, so the picture uses hollow and filled instead, which is the older convention.
"""
from svgkit import *

FIGS = {}
TIMEC = "∶"  # ratio sign, used inside clock times so times never contain a prose colon


def fmtp(p, dollars=False):
    if dollars:
        return "$%.2f" % p
    return "{:,.2f}".format(p)


# ------------------------------------------------------------------ the order book drawing
def book(rows, unit=9.0, last=None, spread=None, ghosts=None, top=0, note=None, dollars=False,
         extra="", gap_rows=(), H=None, hdr=True, label="An order book"):
    """rows is a list of (price, bid_size, ask_size) from the highest price to the lowest.
    spread is (best_ask_price, best_bid_price) to outline. ghosts maps price -> (side, size).
    gap_rows is a set of row indexes drawn as an empty stretch with a note instead of a price."""
    ghosts = ghosts or {}
    rh = 24
    y0 = top + (36 if hdr else 8)
    o = ""
    if hdr:
        o += tx(98, top + 20, "Buy orders (bids)", "b") + tx(200, top + 20, "Price", "b") + tx(302, top + 20, "Sell orders (asks)", "b")
    for i, (p, bsz, asz) in enumerate(rows):
        yc = y0 + i * rh + rh / 2
        if i in gap_rows:
            o += L(200, yc - 9, 200, yc + 9, "dash") + tx(214, yc + 4, p, "sm", "start")
            continue
        ptxt = fmtp(p, dollars)
        if last is not None and abs(p - last) < 1e-9:
            o += f'<rect x="166" y="{yc - 10}" width="68" height="20" rx="4" class="k3"/>' + tx(200, yc + 4, ptxt, "onT")
        else:
            o += f'<rect x="166" y="{yc - 10}" width="68" height="20" rx="4" class="panel"/>' + tx(200, yc + 4, ptxt)
        if bsz:
            w = max(3, bsz * unit)
            o += f'<rect x="{162 - w:.1f}" y="{yc - 8}" width="{w:.1f}" height="16" rx="2" class="k1"/>' + tx(158 - w, yc + 4, f"{bsz:,}", "", "end")
        if asz:
            w = max(3, asz * unit)
            o += f'<rect x="238" y="{yc - 8}" width="{w:.1f}" height="16" rx="2" class="k2"/>' + tx(242 + w, yc + 4, f"{asz:,}", "", "start")
        if p in ghosts:
            side, sz = ghosts[p]
            w = max(3, sz * unit)
            if side == "bid":
                o += f'<rect x="{162 - w:.1f}" y="{yc - 8}" width="{w:.1f}" height="16" rx="2" class="k4" opacity=".55"/>' + tx(158 - w, yc + 4, "pulled", "sm", "end")
            else:
                o += f'<rect x="238" y="{yc - 8}" width="{w:.1f}" height="16" rx="2" class="k4" opacity=".55"/>' + tx(242 + w, yc + 4, "pulled", "sm", "start")
    if spread:
        a, b = spread
        ia = [i for i, r in enumerate(rows) if abs(r[0] - a) < 1e-9][0]
        ib = [i for i, r in enumerate(rows) if abs(r[0] - b) < 1e-9][0]
        ya, yb = y0 + ia * rh + 1, y0 + ib * rh + rh - 1
        o += f'<rect x="162" y="{ya}" width="76" height="{yb - ya}" rx="7" class="hl"/>'
        sp = a - b
        o += tx(244, y0 + ib * rh + rh / 2 + 4, "spread " + ("%.2f" % sp), "tagR", "start")
    o += extra
    hh = H or (y0 + len(rows) * rh + (26 if note else 8))
    if note:
        o += tx(200, y0 + len(rows) * rh + 18, note, "sm")
    return svg(400, hh, o, label)


# A ladder of ES-style prices, quarter points, used by several figures
LAD = [6001.00, 6000.75, 6000.50, 6000.25, 6000.00, 5999.75, 5999.50, 5999.25, 5999.00]


def rows_from(bids, asks, prices=LAD):
    return [(p, bids.get(p, 0), asks.get(p, 0)) for p in prices]


# ---- Figure. The full book with its parts named
B4 = {5999.75: 5, 5999.50: 8, 5999.25: 12, 5999.00: 6}
A4 = {6000.25: 4, 6000.50: 3, 6000.75: 10, 6001.00: 7}
FIGS["book"] = book(rows_from(B4, A4), spread=(6000.25, 5999.75), label="An order book with bids, asks and the spread")

# ---- Stepper. Building a book one order at a time
st = []
caps = [
    "An empty price ladder. Each row is one price the contract is allowed to trade at, a quarter point apart. Nobody is waiting at any of them yet, so there is no bid, no ask, and no price to quote.",
    "A buyer posts a limit order. Buy 5 contracts at 5,999.75 or less. Nobody is selling that cheaply right now, so the order cannot trade. It waits in the book as a blue bar. It is now the best bid, the highest price anyone is offering to pay.",
    "A seller posts a limit order. Sell 3 at 6,000.50 or more. The buyer will not pay that much, so this order waits too. Now there is a best ask, and between the best bid and the best ask sits a gap of 0.75 points. That gap is the spread.",
    "Fast forward. Six more traders post orders at other prices. Notice the new best ask. Someone is now willing to sell at 6,000.25, so the spread has narrowed to 0.50. Nothing has traded yet. Every bar is just a promise that is waiting.",
    "A new seller sends Sell 5 at 5,999.75 or more. A buyer is already waiting at exactly 5,999.75, so the two orders match at once. Five contracts trade at 5,999.75, shown in gold. The buyer's bar is used up and disappears. That trade is now the last price, the number every screen in the world displays. Look at the outline too. The bid at 5,999.75 is used up, so 5,999.50 is now the best bid and the spread has widened to 0.75. Taking liquidity widens the spread, and the last price now sits inside the gap, at a price where nobody is waiting.",
    "The trader resting at 5,999.25 changes their mind and cancels. The bar vanishes, drawn here in gray. An order in the book is a promise that can be withdrawn in a few millionths of a second, and nobody has to say why.",
]
frames_b = [
    ({}, {}, None, None, {}),
    ({5999.75: 5}, {}, None, None, {}),
    ({5999.75: 5}, {6000.50: 3}, None, (6000.50, 5999.75), {}),
    (B4, A4, None, (6000.25, 5999.75), {}),
    ({5999.50: 8, 5999.25: 12, 5999.00: 6}, A4, 5999.75, (6000.25, 5999.50), {}),
    ({5999.50: 8, 5999.00: 6}, A4, 5999.75, (6000.25, 5999.50), {5999.25: ("bid", 12)}),
]
for i, (b, a, last, spr, gh) in enumerate(frames_b):
    st.append((i + 1, "", f"Stage {i + 1} of 6", book(rows_from(b, a), last=last, spread=spr, ghosts=gh,
               note=("Last trade 5,999.75" if last else "No trade yet"), label="The order book, stage %d" % (i + 1)), caps[i]))
STEPPERS = {"build": dict(frames=st)}


# ---- Figure. The tape (time and sales)
def tape():
    rows = [("10" + TIMEC + "41" + TIMEC + "07.112", "6,000.25", "2", "buyer"),
            ("10" + TIMEC + "41" + TIMEC + "07.540", "6,000.25", "11", "buyer"),
            ("10" + TIMEC + "41" + TIMEC + "08.003", "6,000.00", "4", "seller"),
            ("10" + TIMEC + "41" + TIMEC + "08.871", "6,000.00", "1", "seller"),
            ("10" + TIMEC + "41" + TIMEC + "09.215", "6,000.25", "6", "buyer")]
    o = tx(80, 20, "Time", "b") + tx(200, 20, "Price", "b") + tx(268, 20, "Size", "b") + tx(338, 20, "In a hurry", "b")
    for i, (t, p, s, who) in enumerate(rows):
        y = 44 + i * 26
        last = i == len(rows) - 1
        o += f'<rect x="14" y="{y - 15}" width="372" height="22" rx="4" class="k3"' + ('' if last else ' opacity=".22"') + '/>'
        cls = "onT" if last else ""
        o += tx(80, y, t, cls + " mono" if cls else "mono") + tx(200, y, p, cls) + tx(268, y, s, cls)
        o += f'<circle cx="312" cy="{y - 4}" r="6" class="{"k1" if who == "buyer" else "k2"}"/>' + tx(324, y, who, cls, "start")
    o += tx(200, 44 + 5 * 26 + 6, "Every row is a trade. Solid gold marks the last one, which is the price.", "sm")
    return svg(400, 44 + 5 * 26 + 16, o, "A time and sales list of five trades")


FIGS["tape"] = tape()


# ---- Figure. A queue at one price (price, then time)
def queue():
    o = tx(200, 18, "Everyone selling at 6,000.25, in the order they arrived", "b")
    def row(y, segs, title):
        s = tx(14, y - 12, title, "sm", "start")
        x = 14
        for lab, n, cls in segs:
            w = n * 30
            s += f'<rect x="{x}" y="{y}" width="{w - 3}" height="26" rx="3" class="{cls}"/>' + tx(x + (w - 3) / 2, y + 17, lab, "on" if cls in ("k2",) else "onT")
            x += w
        return s
    o += row(52, [("A sells 4", 4, "k2"), ("B sells 3", 3, "k2"), ("C sells 5", 5, "k2")], "Before. A arrived first, then B, then C.")
    o += f'<path d="M14 92 h0" class="ln"/>'
    o += row(130, [("A 4 traded", 4, "k3"), ("B 2", 2, "k3"), ("B 1", 1, "k2"), ("C sells 5", 5, "k2")], "A market buy for 6 arrives. It fills A completely, then 2 of B.")
    o += tx(200, 178, "Gold traded, red still waiting. C waits untouched, back of the line.", "sm")
    return svg(400, 188, o, "Price time priority at one price level")


FIGS["queue"] = queue()


# ---- Classify. Maker or taker
CLASSIFY = {"mt": dict(
    noun="Order",
    options=[("make", "Rests in the book"), ("take", "Trades at once")],
    items=[
        ("The book shows best bid 5,999.75 and best ask 6,000.00. You send a limit buy for 2 at 5,999.50.", "make",
         "Nobody is selling at 5,999.50 or lower. The cheapest seller wants 6,000.00. Your order cannot match, so it waits in the book below the best bid. You added liquidity."),
        ("Same book. You send a market sell for 3.", "take",
         "A market order never waits. It sells to the best bid, 5,999.75, at once. You took liquidity and paid the spread to be immediate."),
        ("Same book. You send a limit buy for 2 at 6,000.25.", "take",
         "Your limit says you will pay up to 6,000.25. A seller is already waiting at 6,000.00, which is better than your limit, so you match immediately and fill at 6,000.00. A limit order priced through the other side is called a marketable limit order, and it takes liquidity just like a market order."),
        ("Same book. You send a limit sell for 1 at 6,000.50.", "make",
         "No buyer will pay 6,000.50. The highest bid is 5,999.75. Your order rests above the best ask and waits for a buyer to come up to it."),
        ("Same book. You send a limit sell for 4 at 5,999.75.", "take",
         "A buyer is waiting at exactly 5,999.75. Your sell matches it at once. Selling at the bid means you are the one crossing the spread."),
        ("You placed a stop sell with a trigger at 5,999.00 an hour ago. The price just traded at 5,999.00.", "take",
         "A stop order sits outside the book doing nothing until its trigger price trades. Then it becomes a market order and sells immediately to whatever bids are left."),
        ("Same book. You send a limit buy for 1 at 5,999.75, the same price as the best bid.", "make",
         "You join the line of buyers at 5,999.75. Nobody is selling there, so you wait, and you wait behind everyone who was already in that line."),
    ])}


# ---- Stepper. Stops waiting below the market, then the cascade
SROWS = [6000.25, 6000.00, 5999.75, 5999.50, 5999.25, 5999.00, 5998.75]
sb = {5999.75: 6, 5999.50: 5, 5999.25: 7, 5999.00: 6, 5998.75: 8}
sa = {6000.25: 6, 6000.00: 5}


def stop_frame(b, a, last, panel_txt, trig, note):
    rows = [(p, b.get(p, 0), a.get(p, 0)) for p in SROWS]
    ex = f'<rect x="20" y="{36 + 7 * 24 + 10}" width="360" height="44" rx="8" class="hl2"/>'
    ex += tx(200, 36 + 7 * 24 + 28, panel_txt, "b") + tx(200, 36 + 7 * 24 + 44, trig, "sm")
    return book(rows, unit=9, last=last, extra=ex, H=36 + 7 * 24 + 84, label="Stops waiting outside the book")


FR_STOP = [
    (stop_frame(sb, sa, None, "Outside the book. Stop sells totalling 20 contracts", "Trigger at 5,999.75. Invisible to everyone else", ""),
     "The book looks calm. Bids are stacked below the price, asks above. What nobody can see is the dashed box. Several traders who bought earlier have placed stop sells with a trigger at 5,999.75. They mean, if the price falls to 5,999.75, get me out."),
    (stop_frame({5999.50: 5, 5999.25: 7, 5999.00: 6, 5998.75: 8}, sa, 5999.75, "Triggered. 20 contracts become market sells", "Trigger at 5,999.75 has just traded", ""),
     "An ordinary seller sells 6 contracts at the bid, 5,999.75. That trade, in gold, touches the trigger. All of the stops wake up at once and each one turns into a market sell order."),
    (stop_frame({5998.75: 6}, sa, 5998.75, "20 contracts sold into the bids", "Filled 5 at 5,999.50, 7 at 5,999.25, 6 at 5,999.00, 2 at 5,998.75", ""),
     "Twenty contracts of market selling hit the book together. They eat 5,999.50, then 5,999.25, then 5,999.00, and dig into 5,998.75. The last price falls a full point in an instant. Nobody chose 5,998.75. It is simply where the bids ran out."),
]
STEPPERS["stops"] = dict(frames=[(i + 1, "", f"Stage {i + 1} of 3", f, c) for i, (f, c) in enumerate(FR_STOP)])

# ---- Stepper. A stock's book during the crash. Illustrative sizes, real stub quote
CR = [40.10, 40.00, 39.95, 39.80, 39.50, "gap", 0.01]


def crash(b, a, last, note, gh=None):
    rows, gaps = [], set()
    for i, p in enumerate(CR):
        if p == "gap":
            rows.append(("no bids at all down to $0.02", 0, 0))
            gaps.add(i)
        else:
            rows.append((p, b.get(p, 0), a.get(p, 0)))
    return book(rows, unit=0.11, last=last, dollars=True, ghosts=gh, gap_rows=gaps, note=note, label="A stock order book during the crash")


cr_frames = [
    (crash({39.95: 300, 39.80: 500, 39.50: 800, 0.01: 100}, {40.00: 400, 40.10: 600}, None, "Last trade about $40. Sizes in shares, made up for the picture"),
     "A normal afternoon in a stock like Accenture. Buyers wait at $39.95, $39.80 and $39.50. Far below, at one cent, sits a strange tiny order. That is a stub quote, a placeholder a market maker posts so it technically has a bid in the book without ever expecting to trade there."),
    (crash({39.95: 100, 0.01: 100}, {40.00: 400, 40.10: 600}, None, "Last trade about $40", {39.80: ("bid", 500), 39.50: ("bid", 800)}),
     "Prices everywhere are falling fast and nobody knows why. The firms that normally keep bids in the book decide the risk is too high and pull them. Two whole levels vanish, and most of the bid at $39.95 is pulled too, leaving only 100 shares. Nothing about the company has changed. The only thing that changed is who is willing to wait in line."),
    (crash({0.01: 0}, {40.00: 400, 40.10: 600}, 0.01, "Last trade $0.01"),
     "Sell orders arrive that say sell now at any price. Some are frightened sellers and some are stop orders that have just been triggered. They take the 100 shares at $39.95. The next bid in the whole book is one cent. A market order takes the best bid that exists, so the rest trades at $0.01."),
    (crash({39.50: 300, 0.01: 100}, {39.80: 200, 39.95: 300, 40.00: 300}, 39.50, "Last trade $39.50. The real stock printed $39.51 at 2\u223650"),
     "Within minutes buyers and market makers come back, the book refills, and the stock trades near forty dollars again. Sellers have even posted new asks below the old ones. The one cent trade really happened. The exchanges later cancelled trades like it, but the people on both sides could not know that at the time."),
]
STEPPERS["crash"] = dict(frames=[(i + 1, "", ["2" + TIMEC + "40 pm", "About 2" + TIMEC + "46 pm", "2" + TIMEC + "47 pm", "2" + TIMEC + "50 pm"][i], f, c) for i, (f, c) in enumerate(cr_frames)])


# ---- Figure. E-mini buy-side depth, morning versus 2:45:28
def depth():
    o = tx(200, 18, "Contracts waiting to buy in the E-mini", "b")
    o += f'<rect x="40" y="40" width="320" height="34" rx="4" class="k1"/>' + tx(200, 62, "Start of the day. Full depth, call it 100%", "on")
    o += f'<rect x="40" y="104" width="3.2" height="34" rx="1" class="k1"/>' + tx(52, 126, "2" + TIMEC + "45" + TIMEC + "28 pm. Fewer than 1,050 contracts, under 1%", "", "start")
    o += tx(200, 166, "Bar lengths to scale. Source is the joint SEC and CFTC report.", "sm")
    return svg(400, 178, o, "E-mini buy side depth fell to under one percent")


FIGS["depth"] = depth()


# ------------------------------------------------------------------ candles
def candle(x, o_, h, l, c, ymap, w=22, label=True, side="right"):
    yo, yh, yl, yc = ymap(o_), ymap(h), ymap(l), ymap(c)
    top, bot = min(yo, yc), max(yo, yc)
    s = L(x, yh, x, top, "tick") + L(x, bot, x, yl, "tick")
    cls = "sym" if c >= o_ else "aff"
    s += f'<rect x="{x - w / 2}" y="{top}" width="{w}" height="{max(2, bot - top)}" class="{cls}"/>'
    return s


def ymapper(lo, hi, ytop, ybot):
    return lambda p: ybot - (p - lo) / (hi - lo) * (ybot - ytop)


def anatomy():
    ym = ymapper(5998.5, 6002.0, 30, 210)
    o = tx(110, 18, "Price rose in this minute", "b") + tx(300, 18, "Price fell in this minute", "b")
    o += candle(110, 5999.5, 6001.5, 5998.75, 6000.75, ym, w=34)
    o += candle(300, 6000.75, 6001.75, 5998.75, 5999.5, ym, w=34)
    # labels for the up candle
    for p, t in ((6001.5, "high"), (6000.75, "close"), (5999.5, "open"), (5998.75, "low")):
        o += L(132, ym(p), 150, ym(p), "thin") + tx(154, ym(p) + 4, t, "sm", "start")
    for p, t in ((6001.75, "high"), (6000.75, "open"), (5999.5, "close"), (5998.75, "low")):
        o += L(278, ym(p), 260, ym(p), "thin") + tx(256, ym(p) + 4, t, "sm", "end")
    o += tx(66, ym(6001.1), "wick", "sm", "end") + L(70, ym(6001.1), 106, ym(6001.1), "thin")
    o += tx(66, ym(6000.1), "body", "sm", "end") + L(70, ym(6000.1), 92, ym(6000.1), "thin")
    return svg(400, 226, o, "Anatomy of an up candle and a down candle")


FIGS["anatomy"] = anatomy()

# Stepper. A minute of trades building one candle
PATH = [(0, 6000.00), (6, 6000.50), (12, 6001.00), (15, 6001.50), (21, 6001.00), (25, 6000.75), (30, 6000.00),
        (33, 5999.50), (40, 5999.25), (44, 5999.75), (50, 6000.25), (55, 6000.50), (60, 6000.75)]
ymc = ymapper(5998.75, 6002.0, 34, 196)


def minute_frame(tcut):
    pts = [(t, p) for t, p in PATH if t <= tcut]
    X = lambda t: 54 + t * 3.85
    o = tx(170, 18, "A very quiet, made up minute", "b") + tx(345, 18, "The candle so far", "b")
    o += L(54, 200, 285, 200, "ln") + tx(54, 214, "0 s", "sm") + tx(285, 214, "60 s", "sm")
    for gp in (5999.0, 6000.0, 6001.0, 6002.0):
        o += L(54, ymc(gp), 285, ymc(gp), "thin") + tx(50, ymc(gp) + 4, "{:,.0f}".format(gp), "sm", "end")
    d = " ".join(("M" if i == 0 else "L") + f"{X(t):.1f},{ymc(p):.1f}" for i, (t, p) in enumerate(pts))
    o += f'<path d="{d}" class="ln" style="stroke-width:2"/>'
    for t, p in pts:
        o += f'<circle cx="{X(t):.1f}" cy="{ymc(p):.1f}" r="3.2" class="k3"/>'
    ps = [p for _, p in pts]
    o += candle(345, ps[0], max(ps), min(ps), ps[-1], ymc, w=30)
    return svg(400, 222, o, "Trades in one minute and the candle they build")


mcaps = [
    "The minute starts. The first trade prints at 6,000.00. That first price is the open, and for now the candle is a flat line, because open, high, low and close are all the same number.",
    "Buyers cross the spread again and again and the price climbs to 6,001.50. Right now the latest trade is also the highest one, so the top of the body is the high and there is no wick yet. A wick only appears once the price pulls back from an extreme.",
    "Now sellers take over. Trades print lower and lower, down to 5,999.50 at the 33 second mark. That is below the open, so for this moment the candle is a down candle, drawn filled. Notice the line above the body. The price left 6,001.50 behind, and the candle keeps that high anyway. That line is the upper wick.",
    "The low, 5,999.25, printed at 40 seconds. Then buyers return and the price works back up past the open. The candle flips to hollow, because the latest price is now above where the minute began, and a new line hangs under the body. The candle keeps the low even though the price has moved on.",
    "The minute ends. The very last trade, 6,000.75, becomes the close. The candle freezes. Thirteen trades and their whole path have been squeezed into four numbers, open 6,000.00, high 6,001.50, low 5,999.25, close 6,000.75.",
]
STEPPERS["minute"] = dict(frames=[(i + 1, "", lab, minute_frame(tc), mcaps[i]) for i, (tc, lab) in enumerate(
    [(0, "0 seconds"), (15, "15 seconds"), (33, "33 seconds"), (50, "50 seconds"), (60, "60 seconds")])])


# Toggle. Two different minutes, one identical candle
def path_frame(path, title):
    X = lambda t: 54 + t * 3.85
    o = tx(170, 18, title, "b") + tx(345, 18, "Its candle", "b")
    o += L(54, 200, 285, 200, "ln") + tx(54, 214, "0 s", "sm") + tx(285, 214, "60 s", "sm")
    for gp in (5999.0, 6000.0, 6001.0, 6002.0):
        o += L(54, ymc(gp), 285, ymc(gp), "thin") + tx(50, ymc(gp) + 4, "{:,.0f}".format(gp), "sm", "end")
    d = " ".join(("M" if i == 0 else "L") + f"{X(t):.1f},{ymc(p):.1f}" for i, (t, p) in enumerate(path))
    o += f'<path d="{d}" class="ln" style="stroke-width:2"/>'
    for t, p in path:
        o += f'<circle cx="{X(t):.1f}" cy="{ymc(p):.1f}" r="3.2" class="k3"/>'
    ps = [p for _, p in path]
    o += candle(345, ps[0], max(ps), min(ps), ps[-1], ymc, w=30)
    return svg(400, 222, o, title)


PA = [(0, 6000.0), (8, 6001.0), (14, 6001.5), (24, 6000.5), (34, 5999.5), (42, 5999.25), (52, 6000.25), (60, 6000.75)]
PB = [(0, 6000.0), (5, 5999.5), (10, 5999.25), (18, 5999.75), (30, 6000.5), (38, 6001.5), (48, 6001.0), (60, 6000.75)]
TOGGLES = {"paths": [
    ("Up first, then down, then up", path_frame(PA, "Minute A"),
     "Buyers push the price to the high in the first quarter of the minute. Then sellers drive it all the way to the low before buyers lift it to the close."),
    ("Down first, then up", path_frame(PB, "Minute B"),
     "Sellers hit the low within ten seconds. Then buyers grind the price up to the high and it eases back to the close. A completely different fight, and the candle on the right has not changed at all."),
]}


def five():
    ym = ymapper(5998.25, 6003.0, 30, 196)
    C = [(6000.00, 6001.50, 5999.25, 6000.75), (6000.75, 6002.25, 6000.50, 6002.00), (6002.00, 6002.50, 6000.25, 6000.50),
         (6000.50, 6001.00, 5998.75, 5999.50), (5999.50, 6001.25, 5999.25, 6001.00)]
    o = tx(118, 18, "Five 1 minute candles", "b") + tx(318, 18, "One 5 minute candle", "b")
    for gp in (5999.0, 6000.0, 6001.0, 6002.0, 6003.0):
        o += L(36, ym(gp), 314, ym(gp), "thin") + tx(32, ym(gp) + 4, "{:,.0f}".format(gp), "sm", "end")
    xs = [52 + i * 32 for i in range(5)]
    # dotted guides from the four source values to the 5 minute candle
    for (xi, p) in ((xs[0] - 9, 6000.00), (xs[2], 6002.50), (xs[3], 5998.75), (xs[4] + 9, 6001.00)):
        o += f'<line x1="{xi:.1f}" y1="{ym(p):.1f}" x2="284" y2="{ym(p):.1f}" class="dash" style="stroke:var(--chrT);stroke-width:1.4"/>'
    for i, c in enumerate(C):
        o += candle(xs[i], *c, ym, w=16) + tx(xs[i], 214, str(i + 1), "sm")
    o += candle(300, 6000.00, 6002.50, 5998.75, 6001.00, ym, w=26)
    for p, t in ((6002.50, "H 6,002.50"), (6001.00, "C 6,001.00"), (6000.00, "O 6,000.00"), (5998.75, "L 5,998.75")):
        o += tx(318, ym(p) + 4, t, "sm", "start")
    o += L(220, 30, 220, 200, "dash")
    return svg(400, 222, o, "Five one-minute candles combine into one five-minute candle")


FIGS["five"] = five()


# ------------------------------------------------------------------ added after review
RH = 36 + 9 * 24  # bottom of a 9 row ladder


# V1. Three ways a price moves
def mini_tape(y, rows):
    o = tx(200, y, "The last three trades", "b")
    for i, (p, who) in enumerate(rows):
        yy = y + 20 + i * 20
        o += f'<rect x="120" y="{yy - 13}" width="160" height="18" rx="3" class="k3"' + ("" if i == len(rows) - 1 else ' opacity=".22"') + '/>'
        o += tx(180, yy, p, "onT" if i == len(rows) - 1 else "") + f'<circle cx="232" cy="{yy - 4}" r="5" class="{"k1" if who == "b" else "k2"}"/>' + tx(242, yy, "buyer" if who == "b" else "seller", "sm", "start")
    return o


H3 = RH + 92
three = [
    ("Way 1 of 3", book(rows_from(B4, {6000.50: 3, 6000.75: 10, 6001.00: 7}), last=6000.25, spread=(6000.50, 5999.75), H=H3,
       extra=tx(200, RH + 24, "Last trade 6,000.25. The next trade up must be at 6,000.50", "sm"), label="A taker eats a level"),
     "Way 1, a taker eats a level. Start from the order book picture in Chapter 3. A buyer sends a market order for 4 and takes every ask at 6,000.25. That level is gone, so the next buyer has to pay 6,000.50. This is the way you watched in the widget."),
    ("Way 2 of 3", book(rows_from({5999.50: 8, 5999.25: 12, 5999.00: 6}, {6000.00: 4, 6000.50: 3, 6000.75: 10, 6001.00: 7}), spread=(6000.00, 5999.50),
       ghosts={5999.75: ("bid", 5), 6000.25: ("ask", 4)}, H=H3, extra=tx(200, RH + 24, "No trade happened at all", "sm"), label="The book moves without a trade"),
     "Way 2, the book moves. Back to the same starting book. This time nobody trades. The bidder at 5,999.75 cancels, and the seller at 6,000.25 cancels and reposts one tick lower, at 6,000.00. Not one contract changed hands, yet the whole front of the book is now lower, so whoever trades next will trade lower."),
    ("Way 3 of 3", book(rows_from(B4, A4), last=6000.25, spread=(6000.25, 5999.75), H=H3,
       extra=mini_tape(RH + 18, [("6,000.25", "b"), ("5,999.75", "s"), ("6,000.25", "b")]), label="Bid ask bounce"),
     "Way 3, bid ask bounce. The same book again, untouched. A buyer lifts the ask at 6,000.25, a seller hits the bid at 5,999.75, then another buyer lifts the ask. The last price jumps up and down by half a point, but no level was used up and nothing moved. That is called bid ask bounce, and it is noise, not a trend."),
]
STEPPERS["three"] = dict(frames=[(i + 1, "", lab, f, c) for i, (lab, f, c) in enumerate(three)])


# V2. Same spread, different depth
DROWS = [6001.00, 6000.75, 6000.50, 6000.25, 6000.00, 5999.75, 5999.50, 5999.25, 5999.00, 5998.75]
deepB = {5999.75: 440, 5999.50: 390, 5999.25: 520, 5999.00: 470, 5998.75: 400}
deepA = {6000.00: 420, 6000.25: 510, 6000.50: 380, 6000.75: 460, 6001.00: 500}
thinB = {5999.75: 5, 5999.25: 4, 5998.75: 3}
thinA = {6000.00: 6, 6000.50: 3, 6001.00: 2}
TOGGLES["depth"] = [
    ("Deep book", book([(p, deepB.get(p, 0), deepA.get(p, 0)) for p in DROWS], unit=0.22, spread=(6000.00, 5999.75), note="A market buy for 50 fills entirely at 6,000.00", label="A deep book"),
     "Hundreds of contracts wait at every price. A market buy for 50 is swallowed by the first level and the price does not move at all."),
    ("Thin book", book([(p, thinB.get(p, 0), thinA.get(p, 0)) for p in DROWS], unit=0.22, spread=(6000.00, 5999.75), note="A market buy for 50 runs out of asks after 11", label="A thin book"),
     "Exactly the same best bid, best ask and spread. But only a handful of contracts wait at each price, and some prices are empty. The bars are drawn to the same scale as the deep book, which is why they are barely visible. A market buy for 50 uses up every ask on screen after 11 contracts."),
]


# V3. A market maker's afternoon
MR = [6000.50, 6000.25, 6000.00, 5999.75, 5999.50, 5999.25, 5999.00, 5998.75]


def mm_frame(mmb, mma, last, inv, spr, ghosts=None):
    b = {5998.75: 6}
    a = {6000.50: 8}
    if mmb: b[mmb] = 10
    if mma: a[mma] = 10
    rows = [(p, b.get(p, 0), a.get(p, 0)) for p in MR]
    ex = ""
    for i, p in enumerate(MR):
        yc = 36 + i * 24 + 12
        if mmb is not None and abs(p - mmb) < 1e-9:
            ex += tx(162 - 45, yc + 4, "MM", "on")
        if mma is not None and abs(p - mma) < 1e-9:
            ex += tx(238 + 45, yc + 4, "MM", "on")
    return book(rows, unit=9, last=last, spread=spr, ghosts=ghosts, note=inv, extra=ex, label="A market maker's quotes")


mmcaps = [
    "MM is a market maker. It quotes both sides at once, buying 10 at 5,999.75 and selling 10 at 6,000.00. If one trader sells to it and another buys from it, it earns the spread, 0.25 points per contract, without caring where the market goes.",
    "A seller hits MM's bid. MM now owns 10 contracts, bought at 5,999.75. That is only half of a round trip. To attract a buyer and avoid buying more, it lowers both quotes by a tick.",
    "Two more sellers arrive and hit its bid at 5,999.50 and then 5,999.25. MM keeps lowering its quotes and keeps getting filled on the wrong side. It now holds 30 contracts, bought on average at 5,999.50, and the price is falling under it. This is inventory risk.",
    "So MM pulls both quotes. Nothing else changed, yet the best bid is now 5,998.75, the best ask 6,000.50, and the spread is 1.75 points. Its liquidity was a choice it made second by second, and it just stopped choosing.",
]
mmf = [
    mm_frame(5999.75, 6000.00, None, "MM holds 0 contracts", (6000.00, 5999.75)),
    mm_frame(5999.50, 5999.75, 5999.75, "MM holds 10 contracts, bought at 5,999.75", (5999.75, 5999.50)),
    mm_frame(5999.00, 5999.50, 5999.25, "MM holds 30 contracts, average price 5,999.50", (5999.50, 5999.00)),
    mm_frame(None, None, 5999.25, "MM holds 30 contracts and has no quotes in the book", (6000.50, 5998.75), ghosts={5999.00: ("bid", 10), 5999.50: ("ask", 10)}),
]
STEPPERS["mm"] = dict(frames=[(i + 1, "", f"Stage {i + 1} of 4", mmf[i], mmcaps[i]) for i in range(4)])


# V4. Volume is not liquidity
def potato():
    o = tx(200, 18, "HFT trading in ES, 2∶45∶13 to 2∶45∶27 pm", "b")
    o += f'<rect x="40" y="38" width="320" height="34" rx="4" class="k3"/>' + tx(200, 60, "Contracts traded, over 27,000", "onT")
    o += f'<rect x="40" y="100" width="2.4" height="34" rx="1" class="k1"/>' + tx(52, 122, "Contracts kept, net bought, about 200", "", "start")
    o += tx(200, 160, "Bar lengths to scale. Source is the joint SEC and CFTC report.", "sm")
    return svg(400, 172, o, "Twenty seven thousand contracts traded, about two hundred kept")


FIGS["potato"] = potato()


# V5. May 6 timeline
def timeline():
    ev = [("2∶32", "A fund's program starts selling 75,000 ES contracts", "sym"),
          ("2∶41", "ES starts falling fast", "sym"),
          ("2∶45∶28", "ES hits its low. CME pauses ES for five seconds", "k4"),
          ("2∶45∶33", "ES trading resumes and the price steadies", "sym"),
          ("2∶47", "Accenture trades at one cent", "k3"),
          ("2∶50", "Accenture trades near $39.50 again", "k3"),
          ("3∶08", "ES is back near where it started", "sym")]
    o = L(70, 18, 70, 24 + len(ev) * 38, "ln")
    for i, (t, txt, cls) in enumerate(ev):
        y = 34 + i * 38
        o += f'<circle cx="70" cy="{y}" r="7" class="{cls}"/>' + tx(56, y + 4, t, "b", "end") + tx(86, y + 4, txt, "", "start")
    return svg(400, 34 + len(ev) * 38, o, "Timeline of May 6, 2010")


FIGS["timeline"] = timeline()


# V6. The order path
def orderpath():
    boxes = ["Your trading app", "Your broker. Checks you have the money", "CME Globex matching engine, Aurora", "CME Clearing. Guarantees both sides"]
    o = ""
    for i, b in enumerate(boxes):
        y = 14 + i * 62
        o += f'<rect x="10" y="{y}" width="270" height="40" rx="8" class="panel" style="stroke:var(--ink);stroke-width:1.3"/>' + tx(145, y + 25, b, "b" if i == 2 else "")
        if i < 3:
            o += arrow(145, y + 40, 145, y + 60)
    o += f'<path d="M280,{14 + 2 * 62 + 20} H312 V34 H286" class="ln" marker-end="url(#ah)"/>'
    o += tx(320, 100, "market data", "sm", "start") + tx(320, 114, "comes back", "sm", "start") + tx(320, 128, "to every", "sm", "start") + tx(320, 142, "screen", "sm", "start")
    return svg(400, 14 + 4 * 62, o, "The path an order takes")


FIGS["orderpath"] = orderpath()


# ------------------------------------------------------------------ the market order widget
CUSTOM = {"fire": """<div class="widget fire" id="fire">
<div class="presets" role="group" aria-label="Choose a book">
<button type="button" data-k="es" class="on">ES, a normal afternoon</button>
<button type="button" data-k="thin">ES, a thin book</button>
<button type="button" data-k="acn">A stock at 2\u223647 pm, May 6</button>
</div>
<p class="fdom">This ladder is a DOM, short for depth of market, the same picture your trading platform will show.</p>
<p class="fquote" id="f_quote"></p>
<div class="fbook" aria-live="polite"></div>
<p class="flab">Send a market order</p>
<div class="cc fbuy"></div>
<div class="cc fsell"></div>
<dl class="out">
<dt>Filled</dt><dd id="f_fill">nothing yet</dd>
<dt>Best price when you sent it</dt><dd id="f_best"></dd>
<dt>Your average price</dt><dd id="f_avg" class="big"></dd>
<dt>Slippage per unit</dt><dd id="f_slip"></dd>
<dt>Last trade now</dt><dd id="f_last"></dd>
<dt>Spread now</dt><dd id="f_spr"></dd>
</dl>
<p class="say" id="f_say">Pick a book, then press a button. Each press sends a new market order into the book as it stands.</p>
<div class="cc"><button type="button" id="f_reset">Put the book back the way it started</button></div>
</div>"""}

EXTRA_CSS = r"""
.fire .presets button.on{background:var(--ink);border-color:var(--ink);color:var(--card);font-weight:600}
.fbook{font-family:var(--sans);font-size:.86rem;margin:.4rem 0 1rem;border:1px solid var(--line);border-radius:8px;overflow:hidden}
.frow{display:grid;grid-template-columns:1fr 6.2rem 1fr;align-items:center;min-height:30px;border-top:1px solid var(--line)}
.frow:first-child{border-top:0}
.frow .px{text-align:center;font-variant-numeric:tabular-nums;font-weight:600}
.frow .bd,.frow .as{display:flex;align-items:center;gap:.35rem;padding:0 .4rem}
.frow .bd{justify-content:flex-end}
.frow i{display:block;height:16px;border-radius:2px;min-width:3px}
.frow .bd i{background:var(--chrA)}.frow .as i{background:var(--chrB)}
.frow.gone .px{color:var(--muted);text-decoration:line-through}
.frow.last .px{background:var(--chrT);color:#2a2000}
.frow.gapr{min-height:26px;color:var(--muted);font-size:.8rem}
.frow.gapr .px{font-weight:400}
.frow .n{font-variant-numeric:tabular-nums;color:var(--ink);font-size:.8rem}
.frow .hit{font-size:.75rem;color:#8a6a00;font-weight:700}
.flab{font-size:.85rem;font-weight:600;margin:.2rem 0 .4rem;color:var(--muted)}
.fdom{font-size:.8rem;color:var(--muted);margin:.2rem 0 .5rem}
.fquote{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.85rem;background:var(--bg);border:1px solid var(--line);border-radius:6px;padding:.45rem .6rem;margin:0 0 .5rem;line-height:1.5}
.fquote span{white-space:nowrap;display:inline-block;margin-right:.9rem}.fquote .qb{color:var(--chrA);font-weight:700}.fquote .qa{color:var(--chrB);font-weight:700}
.frow.hd{min-height:24px;font-size:.72rem;color:var(--muted);font-weight:700;background:var(--bg)}
.frow.hd .px{font-weight:700}
.frow.empty .px{color:var(--muted);font-weight:400}
.frow.best .px{box-shadow:inset 0 0 0 2px var(--accent);border-radius:4px}
.fbuy button{border-color:var(--chrA)!important;color:var(--chrA)!important;font-weight:600}
.fsell button{border-color:var(--chrB)!important;color:var(--chrB)!important;font-weight:600}
"""

EXTRA_JS = r"""
(function(){
  var W=document.getElementById('fire'); if(!W) return;
  function $(s){return W.querySelector(s);}
  var P={
    es:{d:false,tick:0.25,unit:'contracts',sizes:[1,10,100,600],
        asks:[[6001.25,460],[6001.00,510],[6000.75,380],[6000.50,420],[6000.25,350]],
        bids:[[6000.00,330],[5999.75,440],[5999.50,390],[5999.25,520],[5999.00,470]],
        note:'Sizes are made up but realistic in shape. Depth in real ES changes a lot from minute to minute.'},
    thin:{d:false,tick:0.25,unit:'contracts',sizes:[1,10,100,600],
        asks:[[6002.00,9],[6001.50,4],[6001.00,6],[6000.50,3],[6000.25,5]],
        bids:[[6000.00,4],[5999.50,7],[5999.00,3],[5998.25,8],[5997.50,6]],
        note:'A thin book, one with very little waiting at each price, like the middle of the night or the second before a big economic number. Same contract, same buttons. Notice the empty prices.'},
    acn:{d:true,tick:0,unit:'shares',sizes:[100,300,1000],
        asks:[[40.10,600],[40.00,400]],
        bids:[[39.95,200],[39.80,100],[0.01,10000]],
        note:'The sizes are invented. The one cent stub quote is the real thing. Try selling 1,000 shares.'}
  };
  var key='es',book,last=null,ladder=[];
  function fp(p){return P[key].d?('$'+p.toFixed(2)):p.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});}
  function fn(n){return n.toLocaleString('en-US');}
  function load(k){key=k;var p=P[k];book={asks:p.asks.map(function(x){return x.slice();}),bids:p.bids.map(function(x){return x.slice();})};last=null;
    ladder=[];
    if(p.tick){var hi=p.asks[0][0],lo=p.bids[p.bids.length-1][0];for(var x=hi;x>=lo-1e-9;x=Math.round((x-p.tick)*100)/100)ladder.push(x);}
    W.querySelectorAll('.presets button').forEach(function(b){b.classList.toggle('on',b.getAttribute('data-k')===k);});
    var bb=$('.fbuy'),ss=$('.fsell');bb.innerHTML='';ss.innerHTML='';
    p.sizes.forEach(function(s){
      var b=document.createElement('button');b.type='button';b.setAttribute('data-buy',s);b.textContent='Buy '+fn(s);bb.appendChild(b);
      var c=document.createElement('button');c.type='button';c.setAttribute('data-sell',s);c.textContent='Sell '+fn(s);ss.appendChild(c);});
    ['f_best','f_avg','f_slip'].forEach(function(id){document.getElementById(id).textContent='';});
    document.getElementById('f_fill').textContent='nothing yet';
    document.getElementById('f_say').textContent=p.note;
    draw({});
  }
  function bestAsk(){var a=book.asks.filter(function(x){return x[1]>0;});return a.length?a[a.length-1]:null;}
  function bestBid(){var b=book.bids.filter(function(x){return x[1]>0;});return b.length?b[0]:null;}
  function sizeAt(side,p){var arr=side==='a'?book.asks:book.bids;for(var i=0;i<arr.length;i++)if(Math.abs(arr[i][0]-p)<1e-9)return arr[i][1];return 0;}
  function draw(hits){
    var mx=1;P[key].asks.concat(P[key].bids).forEach(function(x){mx=Math.max(mx,x[1]);});
    if(key==='acn')mx=1200;
    var ba=bestAsk(),bb=bestBid();
    function bar(n){if(n>mx)n=mx;return '<i style="width:'+Math.max(3,Math.round(n/mx*100))+'%"></i>';}
    function row(p){
      var a=sizeAt('a',p),b=sizeAt('b',p),ha=hits['a'+p],hb=hits['b'+p];
      var isBest=(ba&&Math.abs(ba[0]-p)<1e-9)||(bb&&Math.abs(bb[0]-p)<1e-9);
      var cls='frow'+(!a&&!b?' empty':'')+(last!==null&&Math.abs(last-p)<1e-9?' last':'')+(isBest?' best':'');
      return '<div class="'+cls+'"><div class="bd">'+(hb?'<span class="hit">sold '+fn(hb)+'</span>':'')+(b?'<span class="n">'+fn(b)+'</span>'+bar(b):'')+'</div><div class="px">'+fp(p)+'</div><div class="as">'+(a?bar(a)+'<span class="n">'+fn(a)+'</span>':'')+(ha?'<span class="hit">bought '+fn(ha)+'</span>':'')+'</div></div>';
    }
    var h='<div class="frow hd"><div class="bd">Bid size</div><div class="px">Price</div><div class="as">Ask size</div></div>';
    if(ladder.length){ladder.forEach(function(p){h+=row(p);});}
    else{
      P[key].asks.forEach(function(x){h+=row(x[0]);});
      P[key].bids.forEach(function(x){
        if(x[0]===0.01)h+='<div class="frow gapr"><div class="bd">no bids from $39.79 to $0.02</div><div class="px"></div><div class="as"></div></div>';
        h+=row(x[0]);});
    }
    $('.fbook').innerHTML=h;
    document.getElementById('f_last').textContent=last===null?'none yet':fp(last);
    document.getElementById('f_quote').innerHTML='<span class="qb">Bid '+(bb?fp(bb[0])+' × '+fn(bb[1]):'none')+'</span> <span class="qa">Ask '+(ba?fp(ba[0])+' × '+fn(ba[1]):'none')+'</span> <span>Last '+(last===null?'none yet':fp(last))+'</span>';
    document.getElementById('f_spr').textContent=(ba&&bb)?(P[key].d?'$'+(ba[0]-bb[0]).toFixed(2):(ba[0]-bb[0]).toFixed(2)+' points'):'one side is empty';
  }
  function send(side,qty){
    var levels=side==='buy'?book.asks.slice().reverse():book.bids,left=qty,cost=0,hits={},filled=0,best=null,parts=[];
    for(var i=0;i<levels.length&&left>0;i++){var L=levels[i];if(L[1]<=0)continue;if(best===null)best=L[0];
      var take=Math.min(left,L[1]);L[1]-=take;left-=take;cost+=take*L[0];filled+=take;last=L[0];
      hits[(side==='buy'?'a':'b')+L[0]]=take;parts.push(fn(take)+' at '+fp(L[0]));}
    if(filled===0){document.getElementById('f_say').textContent='There is nobody left on the other side. A market order cannot trade with an empty book.';draw({});return;}
    var avg=cost/filled,slip=Math.abs(avg-best);
    document.getElementById('f_fill').textContent=fn(filled)+' of '+fn(qty)+' '+P[key].unit;
    document.getElementById('f_best').textContent=fp(best);
    document.getElementById('f_avg').textContent=P[key].d?('$'+avg.toFixed(3)):avg.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:3});
    document.getElementById('f_slip').textContent=P[key].d?('$'+slip.toFixed(3)):(slip.toFixed(3)+' points');
    var s='You '+(side==='buy'?'bought ':'sold ')+parts.join(', then ')+'. ';
    if(parts.length===1)s+='One level was enough, so you traded at exactly the best price and moved nothing except the size waiting there.';
    else s+='Your order was bigger than the best level, so it walked '+parts.length+' levels '+(side==='buy'?'up':'down')+' the book. The last trade is now '+fp(last)+', so you moved the price yourself.';
    if(left>0)s+=' The book ran out with '+fn(left)+' still unfilled. On the real CME a futures market order carries a built in price limit called protection, so the leftover would wait in the book at that limit instead of chasing further.';
    if(key==='acn'&&side==='sell'&&last===0.01)s+=(best===0.01?' Your slippage reads zero only because the best bid was already one cent. Slippage measures you against the book, and here the book itself was broken.':' Most of your shares sold for one cent. That is exactly what happened to real sellers on May 6.');
    document.getElementById('f_say').textContent=s;
    draw(hits);
  }
  W.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;
    if(b.hasAttribute('data-k'))load(b.getAttribute('data-k'));
    else if(b.hasAttribute('data-buy'))send('buy',+b.getAttribute('data-buy'));
    else if(b.hasAttribute('data-sell'))send('sell',+b.getAttribute('data-sell'));
    else if(b.id==='f_reset')load(key);});
  load('es');
})();
// link back to the academy hub
(function(){var bar=document.querySelector('.bar .in');if(!bar)return;var a=document.createElement('a');a.href='../index.html';a.textContent='Academy';bar.insertBefore(a,bar.firstChild);})();
"""

TITLE = "A share for one cent. Trading Academy, Week 1"
BAR = "Week 1"
OUT = "week01.html"
CONTENT = ["content-1.html", "content-2.html"]
