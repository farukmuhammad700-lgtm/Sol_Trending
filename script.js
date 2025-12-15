 let currentStep = 1;
  let selectedTier = null;
  let selectedPrice = 0;
  let phantom = null;
  let publicKey = null;

  const prices = {
    standard: { 4: 1.0, 8: 1.7, 16: 4.1, 24: 5.2 },
    premium:  { 4: 1.5, 8: 3.0, 16: 5.7, 24: 8.4 }
  };

  // Phantom Wallet Integration
  async function initPhantom() {
    if ('phantom' in window) {
      phantom = window.phantom.solana;
      if (phantom.isPhantom) {
        console.log('Phantom detected');
        await checkIfWalletIsConnected();
      } else {
        console.log('Phantom not detected');
      }
    } else {
      console.log('Requesting Phantom install');
      window.open('https://phantom.app/download', '_blank');
    }
  }

  async function checkIfWalletIsConnected() {
    try {
      const resp = await phantom.connect({ onlyIfTrusted: true });
      publicKey = resp.publicKey;
      updateWalletUI(true);
      await getBalance();
    } catch (err) {
      console.log('Not connected');
      updateWalletUI(false);
    }
  }

  async function connectWallet() {
    try {
      const resp = await phantom.connect();
      publicKey = resp.publicKey.toString();
      updateWalletUI(true);
      await getBalance();
    } catch (err) {
      console.log('User rejected connection');
    }
  }

  async function disconnectWallet() {
    try {
      await phantom.disconnect();
      publicKey = null;
      updateWalletUI(false);
    } catch (err) {
      console.log('Disconnect error');
    }
  }

  function updateWalletUI(connected) {
    const ui = document.getElementById('wallet-ui');
    if (connected) {
      ui.innerHTML = `
        <div class="wallet-status">Connected: ${publicKey ? publicKey.slice(0,4) + '...' + publicKey.slice(-4) : ''}</div>
        <button class="disconnect-wallet" onclick="disconnectWallet()">Disconnect</button>
      `;
    } else {
      ui.innerHTML = '<button id="connect-btn" class="connect-wallet" onclick="connectWallet()">Connect Wallet</button>';
    }
  }

  async function getBalance() {
    if (!publicKey) return;
    try {
      const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('mainnet-beta'));
      const balance = await connection.getBalance(new solanaWeb3.PublicKey(publicKey));
      const sol = balance / solanaWeb3.LAMPORTS_PER_SOL;
      document.getElementById('sol-balance').textContent = `${sol.toFixed(2)} SOL`;
    } catch (err) {
      console.log('Balance fetch error');
    }
  }

  function goToStep(n) {
    if (n === 3 && !selectedTier) return alert("Please select a package");
    if (n === 4 && selectedPrice === 0) return;

    currentStep = n;
    document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
    document.getElementById(`step-${n}`).classList.add('active');

    // Update progress bar
    document.getElementById('progress-fill').style.width = ((n-1)/3 * 100) + '%';
    document.querySelectorAll('.step').forEach((s, i) => {
      s.classList.toggle('active', i+1 === n);
      s.classList.toggle('completed', i+1 < n);
    });

    if (n === 3) document.getElementById('pay-amount').textContent = selectedPrice.toFixed(2);
    if (n === 4) setTimeout(() => alert("Payment Verified! Your token is now trending!"), 3000);
  }

  // Tier selection
  document.getElementById('standard-card').onclick = () => selectTier('standard');
  document.getElementById('premium-card').onclick = () => selectTier('premium');

  function selectTier(tier) {
    selectedTier = tier;
    document.querySelectorAll('.tier-card').forEach(c => c.classList.remove('active'));
    document.getElementById(tier + '-card').classList.add('active');

    const list = document.getElementById('duration-list');
    list.innerHTML = Object.entries(prices[tier]).map(([hours, price]) => `
      <div class="duration-option" data-price="${price}">
        <span>${hours} Hours</span>
        <span>${price} SOL</span>
      </div>
    `).join('');

    document.getElementById('duration-options').style.display = 'block';
    document.getElementById('options-title').textContent = 
      tier === 'premium' ? 'Premium Trending Options' : 'Standard Trending Options';

    // Click handler for durations
    list.querySelectorAll('.duration-option').forEach(el => {
      el.onclick = () => {
        list.querySelectorAll('.duration-option').forEach(o => o.classList.remove('selected'));
        el.classList.add('selected');
        selectedPrice = parseFloat(el.dataset.price);
        document.getElementById('total-price').textContent = selectedPrice.toFixed(2);
        document.getElementById('continue-btn').disabled = false;
      };
    });

    // Auto-select 24h
    setTimeout(() => list.children[3]?.click(), 100);
  }

  function copyWallet() {
    navigator.clipboard.writeText('5iuDQTtC4L9pSEkecxPjpF2usXwv7dNmtGRZv6oWPLVz');
    alert('Wallet address copied!');
  }

  // Form submit → go to step 2
  document.getElementById('project-form').onsubmit = e => {
    e.preventDefault();
    if (!document.querySelector('input[required]').value) return alert("Fill required fields");
    goToStep(2);
  };

  // Init
  initPhantom();
  window.addEventListener('load', () => {
    if (phantom) {
      phantom.on('connect', () => checkIfWalletIsConnected());
      phantom.on('disconnect', () => updateWalletUI(false));
    }
  });   
