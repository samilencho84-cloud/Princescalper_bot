let running = false;
let balance = 10000;
let pnl = 0;
let wins = 0;
let losses = 0;
let trades = 0;
let timer = null;
let price = 4352.70;

const $ = id => document.getElementById(id);

function money(value) {
  return (value >= 0 ? '+' : '-') + '$' + Math.abs(value).toFixed(2);
}

function render() {
  $('balance').textContent = '$' + balance.toFixed(2);
  $('equity').textContent = '$' + (balance + pnl).toFixed(2);
  $('pnl').textContent = money(pnl);
  $('pnl').className = pnl >= 0 ? 'green' : '';
  $('winRate').textContent =
    trades ? ((wins / trades) * 100).toFixed(1) + '%' : '0.0%';
  $('tradeCount').textContent = trades + ' trades';
  $('price').textContent = '$' + price.toFixed(2);
}

function addTrade() {
  const move = (Math.random() - 0.43) * 18;

  const maxLoss = Number($('maxLoss').value);
  const target = Number($('target').value);

  const result = Math.max(
    -maxLoss,
    Math.min(target, move)
  );

  pnl += result;
  balance += result;
  trades++;

  if (result >= 0) {
    wins++;
  } else {
    losses++;
  }

  const row = document.createElement('tr');

  const type = move >= 0 ? 'BUY' : 'SELL';

  row.innerHTML = `
    <td>${new Date().toLocaleTimeString()}</td>
    <td>${type}</td>
    <td>$${price.toFixed(2)}</td>
    <td>$${(price + move).toFixed(2)}</td>
    <td class="${result >= 0 ? 'green' : ''}">
      ${money(result)}
    </td>
    <td>CLOSED</td>
  `;

  const body = $('historyBody');

  if (body.querySelector('.empty')) {
    body.innerHTML = '';
  }

  body.prepend(row);

  render();

  if (
    pnl <= -maxLoss ||
    pnl >= target
  ) {
    stopDemo();
  }
}

function tick() {
  price += (Math.random() - 0.5) * 3;

  render();

  if (Math.random() < 0.18) {
    addTrade();
  }
}

function startDemo() {
  if (running) return;

  running = true;

  $('status').textContent = '● Engine Running';
  $('status').className = 'status live';

  timer = setInterval(tick, 1000);
}

function stopDemo() {
  running = false;

  clearInterval(timer);

  $('status').textContent = '● Engine Idle';
  $('status').className = 'status idle';
}

$('startBtn').onclick = startDemo;

$('stopBtn').onclick = stopDemo;

$('applyBtn').onclick = () => {
  const risk = Number($('risk').value);
  const maxLoss = Number($('maxLoss').value);
  const target = Number($('target').value);

  $('riskDisplay').textContent =
    risk.toFixed(1) + '%';

  $('lossDisplay').textContent =
    '$' + maxLoss.toFixed(0);

  $('targetDisplay').textContent =
    '$' + target.toFixed(0);

  $('riskMessage').textContent =
    `Risk: ${risk.toFixed(1)}% · Max loss: $${maxLoss.toFixed(2)} · Target: $${target.toFixed(2)}`;
};

render();
