const socket = io("https://crashcryptogame.onrender.com");

const multiplierEl = document.getElementById("multiplier");
const statusEl = document.getElementById("status");
const toastEl = document.getElementById("toast");

let currentPlayerId = "";

function showToast(msg, color = "green") {
  toastEl.textContent = msg;
  toastEl.style.backgroundColor = color === "red" ? "#dc2626" : "#059669";
  toastEl.classList.remove("hidden");
  setTimeout(() => toastEl.classList.add("hidden"), 3000);
}

socket.on("multiplier_update", (data) => {
  multiplierEl.textContent = `${parseFloat(data.multiplier).toFixed(2)}x`;
  multiplierEl.style.color = "#10b981"; // green
});

socket.on("round_crash", (data) => {
  multiplierEl.textContent = `💥 ${parseFloat(data.finalMultiplier).toFixed(2)}x`;
  multiplierEl.style.color = "#ef4444"; // red
  statusEl.textContent = "Round crashed.";
  fetchHistory();
});

socket.on("round_start", () => {
  statusEl.textContent = "New round started. Place your bets!";
  multiplierEl.style.color = "#10b981"; // green
  multiplierEl.textContent = "1.00x";
});

async function createPlayer() {
  const name = document.getElementById("playerName").value.trim();
  if (!name) return showToast("Name is required", "red");

  try {
    const res = await fetch("https://crashcryptogame.onrender.com/api/v1/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });

    const data = await res.json();
    if (res.ok) {
      currentPlayerId = data.playerId;
      document.getElementById("playerId").value = currentPlayerId;
      document.getElementById("walletID").value = currentPlayerId;
      localStorage.setItem("playerId", currentPlayerId);
      showToast(`✅ Player created: ${name}`);
      fetchWallet();
    } else {
      showToast(data.error || "Failed to create player", "red");
    }
  } catch (err) {
    console.error(err);
    showToast("Error creating player", "red");
  }
}

async function placeBet() {
  const playerId = document.getElementById("playerId").value.trim();
  const usdAmount = parseFloat(document.getElementById("betAmount").value);
  const currency = document.getElementById("currency").value;

  if (!playerId || isNaN(usdAmount) || usdAmount <= 0) {
    return showToast("Invalid bet inputs", "red");
  }

  currentPlayerId = playerId;
  try {
    const res = await fetch("https://crashcryptogame.onrender.com/api/v1/bet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, usdAmount, currency })
    });
    const data = await res.json();
    if (res.ok) {
      showToast(`✅ Bet placed (${data.cryptoAmount} ${currency})`);
      
    } else {
      showToast(data.error || "Failed to bet", "red");
    }
  } catch (err) {
    showToast("Error placing bet", "red");
  }
}

async function cashout() {
  if (!currentPlayerId) return showToast("Enter your Player ID", "red");

  try {
    const res = await fetch("https://crashcryptogame.onrender.com/api/v1/cashout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: currentPlayerId })
    });
    const data = await res.json();
    if (res.ok) {
      showToast(`💸 Cashed out: $${data.payoutUSD.toFixed(2)}`);
      fetchWallet();
    } else {
      showToast(data.error || "Cashout failed", "red");
    }
  } catch (err) {
    showToast("Error during cashout", "red");
  }
}

async function fetchWallet() {
  const playerId = document.getElementById("walletID").value.trim();
  console.log(playerId)
  try {
    const res = await fetch(`https://crashcryptogame.onrender.com/api/v1/wallet/${playerId}`);
    const data = await res.json();
    const w = data.wallet;
    console.log(w)
    document.getElementById("wallet").innerHTML = `
      BTC: ${w.BTC.amount.toFixed(5)} ($${w.BTC.usdValue.toFixed(2)})<br/>
      ETH: ${w.ETH.amount.toFixed(5)} ($${w.ETH.usdValue.toFixed(2)})
    `;
  } catch {
    showToast("Failed to fetch wallet", "red");
  }
}
currentPlayerId = localStorage.getItem("playerId") || "";
if (currentPlayerId) {
  document.getElementById("playerId").value = currentPlayerId;
  document.getElementById("walletID").value = currentPlayerId;
  fetchWallet();
}
async function fetchHistory() {
  try {
    const res = await fetch(`https://crashcryptogame.onrender.com/api/v1/round-history?limit=5`);
    const data = await res.json();
    const list = document.getElementById("history");
    list.innerHTML = "";
    data.rounds.forEach(r => {
      const li = document.createElement("li");
      li.textContent = `Round ${r.roundNumber}: Crashed at ${r.crashPoint}x`;
      list.appendChild(li);
    });
  } catch (err) {
    console.error("Failed to load history", err);
  }
}

fetchHistory();
