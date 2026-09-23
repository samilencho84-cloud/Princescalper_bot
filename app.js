// ============================================================
// XSCALPER SCALPING ENGINE v2
// Demo / Simulation Engine
// BUY + SELL | EMA | RSI | Momentum | ATR-style Risk
// ============================================================

let running = false;
let timer = null;

// -------------------------
// ACCOUNT
// -------------------------
let balance = 10000;
let startBalance = 10000;
let pnl = 0;

let wins = 0;
let losses = 0;
let trades = 0;

let price = 4352.70;

// -------------------------
// MARKET DATA
// -------------------------
let candles = [];
let currentPosition = null;

let lastSignal = "WAIT";
let cooldown = 0;

const MAX_CANDLES = 120;

// -------------------------
// HELPERS
// -------------------------
const $ = (id) => document.getElementById(id);

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = value;
}

function money(value) {
  return (
    (value >= 0 ? "+" : "-") +
    "$" +
    Math.abs(value).toFixed(2)
  );
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// ============================================================
// TECHNICAL INDICATORS
// ============================================================

function ema(values, period) {
  if (values.length < period) return null;

  const multiplier = 2 / (period + 1);

  let result = 0;

  for (let i = 0; i < period; i++) {
    result += values[i];
  }

  result /= period;

  for (let i = period; i < values.length; i++) {
    result =
      (values[i] - result) * multiplier + result;
  }

  return result;
}

function calculateRSI(values, period = 14) {
  if (values.length <= period) return 50;

  let gains = 0;
  let lossesValue = 0;

  for (
    let i = values.length - period;
    i < values.length;
    i++
  ) {
    const change = values[i] - values[i - 1];

    if (change > 0) {
      gains += change;
    } else {
      lossesValue += Math.abs(change);
    }
  }

  if (lossesValue === 0) return 100;

  const rs = gains / lossesValue;

  return 100 - 100 / (1 + rs);
}

function calculateATR(candleData, period = 14) {
  if (candleData.length <= period) return 2;

  const ranges = [];

  for (
    let i = candleData.length - period;
    i < candleData.length;
    i++
  ) {
    const candle = candleData[i];

    ranges.push(
      candle.high - candle.low
    );
  }

  const total = ranges.reduce(
    (sum, value) => sum + value,
    0
  );

  return total / ranges.length;
}

// ============================================================
// INITIAL MARKET DATA
// ============================================================

function createInitialMarket() {
  candles = [];

  let p = price;

  for (let i = 0; i < MAX_CANDLES; i++) {
    const movement =
      (Math.random() - 0.48) * 4;

    const open = p;

    const close =
      p + movement;

    const high =
      Math.max(open, close) +
      Math.random() * 1.5;

    const low =
      Math.min(open, close) -
      Math.random() * 1.5;

    candles.push({
      open,
      high,
      low,
      close
    });

    p = close;
  }

  price = p;
}

// ============================================================
// MARKET UPDATE
// ============================================================

function updateMarket() {
  const oldPrice = price;

  // Simulated XAU/USD movement
  const volatility =
    (Math.random() - 0.5) * 5;

  price += volatility;

  price = Math.max(
    100,
    price
  );

  const high =
    Math.max(oldPrice, price) +
    Math.random() * 1.2;

  const low =
    Math.min(oldPrice, price) -
    Math.random() * 1.2;

  candles.push({
    open: oldPrice,
    high,
    low,
    close: price
  });

  if (candles.length > MAX_CANDLES) {
    candles.shift();
  }

  // Reduce cooldown
  if (cooldown > 0) {
    cooldown--;
  }
}

// ============================================================
// STRATEGY
// ============================================================

function getStrategySignal() {
  if (candles.length < 30) {
    return "WAIT";
  }

  const closes = candles.map(
    candle => candle.close
  );

  const fastEMA =
    ema(closes, 9);

  const slowEMA =
    ema(closes, 21);

  const rsi =
    calculateRSI(closes, 14);

  const atr =
    calculateATR(candles, 14);

  const last =
    closes[closes.length - 1];

  const previous =
    closes[closes.length - 2];

  const momentum =
    last - previous;

  // ----------------------------------------------------------
  // BUY CONDITIONS
  // ----------------------------------------------------------

  const buyTrend =
    fastEMA > slowEMA;

  const buyMomentum =
    momentum > 0;

  const buyRSI =
    rsi > 50 && rsi < 72;

  // ----------------------------------------------------------
  // SELL CONDITIONS
  // ----------------------------------------------------------

  const sellTrend =
    fastEMA < slowEMA;

  const sellMomentum =
    momentum < 0;

  const sellRSI =
    rsi < 50 && rsi > 28;

  // ----------------------------------------------------------
  // SIGNAL
  // ----------------------------------------------------------

  if (
    buyTrend &&
    buyMomentum &&
    buyRSI
  ) {
    return {
      side: "BUY",
      rsi,
      atr,
      emaFast: fastEMA,
      emaSlow: slowEMA
    };
  }

  if (
    sellTrend &&
    sellMomentum &&
    sellRSI
  ) {
    return {
      side: "SELL",
      rsi,
      atr,
      emaFast: fastEMA,
      emaSlow: slowEMA
    };
  }

  return {
    side: "WAIT",
    rsi,
    atr,
    emaFast: fastEMA,
    emaSlow: slowEMA
  };
}

// ============================================================
// OPEN POSITION
// ============================================================

function openPosition(signal) {
  if (currentPosition) return;

  if (signal.side === "WAIT") return;

  if (cooldown > 0) return;

  const maxLossInput =
    $("maxLoss");

  const targetInput =
    $("target");

  const maxLoss =
    maxLossInput
      ? Number(maxLossInput.value)
      : 100;

  const target =
    targetInput
      ? Number(targetInput.value)
      : 200;

  // Small scalping target
  const tp =
    Math.min(
      target * 0.20,
      25
    );

  const sl =
    Math.min(
      maxLoss * 0.15,
      15
    );

  currentPosition = {
    side: signal.side,

    entry: price,

    tp,
    sl,

    rsi: signal.rsi,

    openedAt:
      new Date()
  };

  lastSignal =
    signal.side;

  render();
}

// ============================================================
// MANAGE POSITION
// ============================================================

function managePosition() {
  if (!currentPosition) return;

  const position =
    currentPosition;

  let floating = 0;

  if (position.side === "BUY") {
    floating =
      price - position.entry;
  }

  if (position.side === "SELL") {
    floating =
      position.entry - price;
  }

  // Scale price movement into demo dollars
  const demoPnL =
    floating * 4;

  // TAKE PROFIT
  if (
    demoPnL >= position.tp
  ) {
    closePosition(
      position.tp,
      "TAKE PROFIT"
    );

    return;
  }

  // STOP LOSS
  if (
    demoPnL <= -position.sl
  ) {
    closePosition(
      -position.sl,
      "STOP LOSS"
    );

    return;
  }

  // Small profit protection
  if (
    demoPnL >= 5 &&
    Math.random() < 0.12
  ) {
    closePosition(
      demoPnL,
      "QUICK PROFIT"
    );
  }
}

// ============================================================
// CLOSE POSITION
// ============================================================

function closePosition(
  result,
  reason
) {
  if (!currentPosition) return;

  const position =
    currentPosition;

  pnl += result;
  balance += result;

  trades++;

  if (result >= 0) {
    wins++;
  } else {
    losses++;
  }

  addTradeLog(
    position,
    result,
    reason
  );

  currentPosition = null;

  // Small pause before next entry
  cooldown = 2;

  render();
}

// ============================================================
// TRADE LOG
// ============================================================

function addTradeLog(
  position,
  result,
  reason
) {
  const body =
    $("historyBody");

  if (!body) return;

  const empty =
    body.querySelector(".empty");

  if (empty) {
    body.innerHTML = "";
  }

  const row =
    document.createElement("tr");

  row.innerHTML = `
    <td>
      ${new Date().toLocaleTimeString()}
    </td>

    <td>
      ${position.side}
    </td>

    <td>
      $${position.entry.toFixed(2)}
    </td>

    <td>
      $${price.toFixed(2)}
    </td>

    <td style="
      color:${result >= 0
        ? "#22c55e"
        : "#ef4444"};
      font-weight:700;
    ">
      ${money(result)}
    </td>

    <td>
      ${reason}
    </td>
  `;

  body.prepend(row);
}

// ============================================================
// RISK PROTECTION
// ============================================================

function riskProtection() {
  const maxLossInput =
    $("maxLoss");

  const targetInput =
    $("target");

  const maxLoss =
    maxLossInput
      ? Number(maxLossInput.value)
      : 100;

  const target =
    targetInput
      ? Number(targetInput.value)
      : 200;

  // Stop demo if maximum loss reached
  if (
    pnl <= -Math.abs(maxLoss)
  ) {
    if (currentPosition) {
      closePosition(
        -Math.abs(maxLoss),
        "MAX LOSS"
      );
    }

    stopDemo();

    return true;
  }

  // Stop demo if session target reached
  if (
    pnl >= Math.abs(target)
  ) {
    if (currentPosition) {
      closePosition(
        Math.abs(target),
        "SESSION TARGET"
      );
    }

    stopDemo();

    return true;
  }

  return false;
}

// ============================================================
// ENGINE
// ============================================================

function tick() {
  updateMarket();

  // Manage existing trade first
  if (currentPosition) {
    managePosition();
  }

  // Risk protection
  if (riskProtection()) {
    render();
    return;
  }

  // New signal
  if (!currentPosition && cooldown <= 0) {
    const signal =
      getStrategySignal();

    lastSignal =
      signal.side;

    // Enter only with confirmation
    if (
      signal.side === "BUY" ||
      signal.side === "SELL"
    ) {
      openPosition(signal);
    }
  }

  render();
}

// ============================================================
// START
// ============================================================

function startDemo() {
  if (running) return;

  running = true;

  setText(
    "status",
    "● Engine Running"
  );

  const status =
    $("status");

  if (status) {
    status.className =
      "status live";
  }

  timer =
    setInterval(
      tick,
      1000
    );

  render();
}

// ============================================================
// STOP
// ============================================================

function stopDemo() {
  running = false;

  if (timer) {
    clearInterval(timer);

    timer = null;
  }

  setText(
    "status",
    "● Engine Idle"
  );

  const status =
    $("status");

  if (status) {
    status.className =
      "status idle";
  }

  render();
}

// ============================================================
// RESET
// ============================================================

function resetDemo() {
  stopDemo();

  balance = 10000;
  startBalance = 10000;

  pnl = 0;

  wins = 0;
  losses = 0;
  trades = 0;

  price = 4352.70;

  currentPosition = null;

  lastSignal = "WAIT";

  cooldown = 0;

  createInitialMarket();

  const body =
    $("historyBody");

  if (body) {
    body.innerHTML = `
      <tr class="empty">
        <td colspan="6">
          No trades yet. Start the demo engine.
        </td>
      </tr>
    `;
  }

  render();
}

// ============================================================
// RENDER
// ============================================================

function render() {
  const equity =
    balance;

  setText(
    "balance",
    "$" + balance.toFixed(2)
  );

  setText(
    "equity",
    "$" + equity.toFixed(2)
  );

  setText(
    "pnl",
    money(pnl)
  );

  setText(
    "sidePnl",
    money(pnl)
  );

  setText(
    "winRate",
    trades
      ? ((wins / trades) * 100).toFixed(1) + "%"
      : "0.0%"
  );

  setText(
    "tradeCount",
    trades + " trades"
  );

  setText(
    "price",
    "$" + price.toFixed(2)
  );

  // Signal
  const signalText =
    lastSignal === "BUY"
      ? "🟢 BUY"
      : lastSignal === "SELL"
      ? "🔴 SELL"
      : "⚪ WAIT";

  setText(
    "signal",
    signalText
  );

  // Current position
  if (currentPosition) {
    setText(
      "position",
      currentPosition.side +
      " @ $" +
      currentPosition.entry.toFixed(2)
    );
  } else {
    setText(
      "position",
      "No Open Position"
    );
  }

  // P/L colors
  const pnlEl =
    $("pnl");

  if (pnlEl) {
    pnlEl.style.color =
      pnl >= 0
        ? "#22c55e"
        : "#ef4444";
  }

  const sidePnlEl =
    $("sidePnl");

  if (sidePnlEl) {
    sidePnlEl.style.color =
      pnl >= 0
        ? "#22c55e"
        : "#ef4444";
  }
}

// ============================================================
// RISK SETTINGS
// ============================================================

const applyBtn =
  $("applyBtn");

if (applyBtn) {
  applyBtn.onclick = () => {
    const riskEl =
      $("risk");

    const maxLossEl =
      $("maxLoss");

    const targetEl =
      $("target");

    const risk =
      riskEl
        ? Number(riskEl.value)
        : 1;

    const maxLoss =
      maxLossEl
        ? Number(maxLossEl.value)
        : 100;

    const target =
      targetEl
        ? Number(targetEl.value)
        : 200;

    setText(
      "riskDisplay",
      risk.toFixed(1) + "%"
    );

    setText(
      "lossDisplay",
      "$" +
      maxLoss.toFixed(0)
    );

    setText(
      "targetDisplay",
      "$" +
      target.toFixed(0)
    );

    setText(
      "riskMessage",
      `Risk: ${risk.toFixed(
        1
      )}% · Max loss: $${maxLoss.toFixed(
        2
      )} · Target: $${target.toFixed(2)}`
    );
  };
}

// ============================================================
// BUTTONS
// ============================================================

const startBtn =
  $("startBtn");

const stopBtn =
  $("stopBtn");

const resetBtn =
  $("resetBtn");

if (startBtn) {
  startBtn.onclick =
    startDemo;
}

if (stopBtn) {
  stopBtn.onclick =
    stopDemo;
}

if (resetBtn) {
  resetBtn.onclick =
    resetDemo;
}

// ============================================================
// INITIALIZE
// ============================================================

createInitialMarket();

render();
