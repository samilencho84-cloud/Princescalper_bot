let running = false;

let balance = 10000;
let pnl = 0;
let wins = 0;
let losses = 0;
let trades = 0;

let price = 4352.70;
let timer = null;

const $ = (id) => document.getElementById(id);

function money(value) {
  const sign = value >= 0 ? "+" : "-";
  return sign + "$" + Math.abs(value).toFixed(2);
}

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = value;
}

function render() {
  const equity = balance;

  setText("balance", "$" + balance.toFixed(2));
  setText("equity", "$" + equity.toFixed(2));
  setText("pnl", money(pnl));
  setText("sidePnl", money(pnl));

  setText(
    "winRate",
    trades ? ((wins / trades) * 100).toFixed(1) + "%" : "0.0%"
  );

  setText("tradeCount", trades + " trades");
  setText("price", "$" + price.toFixed(2));

  const pnlEl = $("pnl");
  if (pnlEl) {
    pnlEl.style.color = pnl >= 0 ? "#22c55e" : "#ef4444";
  }

  const sidePnlEl = $("sidePnl");
  if (sidePnlEl) {
    sidePnlEl.style.color = pnl >= 0 ? "#22c55e" : "#ef4444";
  }
}

function addTrade() {
  const maxLossEl = $("maxLoss");
  const targetEl = $("target");

  const maxLoss = maxLossEl ? Number(maxLossEl.value) : 100;
  const target = targetEl ? Number(targetEl.value) : 200;

  if (maxLoss <= 0 || target <= 0) return;

  const direction = Math.random() >= 0.5 ? "BUY" : "SELL";

  /*
    Demo result only.
    This is NOT real market execution.
  */
  const isWinner = Math.random() >= 0.43;

  let result;

  if (isWinner) {
    result = Math.random() * (target * 0.25) + target * 0.05;
    result = Math.min(result, target);
  } else {
    result = -(Math.random() * (maxLoss * 0.25) + maxLoss * 0.05);
    result = Math.max(result, -maxLoss);
  }

  const oldPrice = price;

  if (direction === "BUY") {
    price += Math.abs(result) * 0.08;
  } else {
    price -= Math.abs(result) * 0.08;
  }

  pnl += result;
  balance += result;

  trades++;

  if (result >= 0) {
    wins++;
  } else {
    losses++;
  }

  const body = $("historyBody");

  if (body) {
    if (body.querySelector(".empty")) {
      body.innerHTML = "";
    }

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${new Date().toLocaleTimeString()}</td>
      <td>${direction}</td>
      <td>$${oldPrice.toFixed(2)}</td>
      <td>$${price.toFixed(2)}</td>
      <td style="color:${result >= 0 ? "#22c55e" : "#ef4444"}">
        ${money(result)}
      </td>
      <td>CLOSED</td>
    `;

    body.prepend(row);
  }

  render();

  if (pnl <= -maxLoss) {
    stopDemo();
  }

  if (pnl >= target) {
    stopDemo();
  }
}

function tick() {
  /*
    Simulated XAU/USD price movement.
  */
  price += (Math.random() - 0.5) * 3;

  render();

  /*
    Random demo trade.
  */
  if (Math.random() < 0.25) {
    addTrade();
  }
}

function startDemo() {
  if (running) return;

  running = true;

  setText("status", "● Engine Running");

  const status = $("status");
  if (status) {
    status.className = "status live";
  }

  timer = setInterval(tick, 1000);
}

function stopDemo() {
  running = false;

  if (timer) {
    clearInterval(timer);
    timer = null;
  }

  setText("status", "● Engine Idle");

  const status = $("status");
  if (status) {
    status.className = "status idle";
  }
}

function resetDemo() {
  stopDemo();

  balance = 10000;
  pnl = 0;
  wins = 0;
  losses = 0;
  trades = 0;
  price = 4352.70;

  const body = $("historyBody");

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

const startBtn = $("startBtn");
const stopBtn = $("stopBtn");
const resetBtn = $("resetBtn");
const applyBtn = $("applyBtn");

if (startBtn) {
  startBtn.onclick = startDemo;
}

if (stopBtn) {
  stopBtn.onclick = stopDemo;
}

if (resetBtn) {
  resetBtn.onclick = resetDemo;
}

if (applyBtn) {
  applyBtn.onclick = () => {
    const riskEl = $("risk");
    const maxLossEl = $("maxLoss");
    const targetEl = $("target");

    const risk = riskEl ? Number(riskEl.value) : 1;
    const maxLoss = maxLossEl ? Number(maxLossEl.value) : 100;
    const target = targetEl ? Number(targetEl.value) : 200;

    setText("riskDisplay", risk.toFixed(1) + "%");
    setText("lossDisplay", "$" + maxLoss.toFixed(0));
    setText("targetDisplay", "$" + target.toFixed(0));

    setText(
      "riskMessage",
      `Risk: ${risk.toFixed(1)}% · Max loss: $${maxLoss.toFixed(
        2
      )} · Target: $${target.toFixed(2)}`
    );
  };
}

render();
