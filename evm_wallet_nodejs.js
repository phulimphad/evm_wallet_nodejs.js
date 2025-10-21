// evm-wallet-nodejs.js
// Simple Node.js script to create/derive EVM wallets using ethers.js (v5 compatible)
// Usage:
// 1) npm init -y
// 2) npm install ethers@5 dotenv
// 3) create a .env file if you want (see .env.example below)
// 4) node evm-wallet-nodejs.js

/* .env.example
MNEMONIC=""
PRIVATE_KEY=""
RPC_URL=""    # optional - an RPC url (Infura/Alchemy/local)
*/

require('dotenv').config();
const { ethers } = require('ethers');

// Create a brand new random wallet (mnemonic + private key)
function createRandomWallet() {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    mnemonic: wallet.mnemonic && wallet.mnemonic.phrase ? wallet.mnemonic.phrase : null,
    privateKey: wallet.privateKey
  };
}

// Derive a single wallet from a mnemonic
function walletFromMnemonic(mnemonic, index = 0) {
  const hdNode = ethers.utils.HDNode.fromMnemonic(mnemonic);
  const child = hdNode.derivePath(`m/44'/60'/0'/0/${index}`);
  return {
    index,
    address: child.address,
    privateKey: child.privateKey
  };
}

// Derive multiple wallets from a mnemonic
function deriveMultiple(mnemonic, count = 5) {
  const wallets = [];
  for (let i = 0; i < count; i++) {
    wallets.push(walletFromMnemonic(mnemonic, i));
  }
  return wallets;
}

async function main() {
  console.log('=== EVM Wallet helper script ===');

  // 1) Create a new random wallet
  const newWallet = createRandomWallet();
  console.log('\n-- New Random Wallet (save securely!) --');
  console.log('Address :', newWallet.address);
  console.log('Mnemonic:', newWallet.mnemonic || '--- none ---');
  console.log('PrivateKey:', newWallet.privateKey);
  console.log('\nIMPORTANT: do NOT share your private key or mnemonic. Store them offline or in a secure vault.');

  // 2) If user provided MNEMONIC in .env, derive examples
  if (process.env.MNEMONIC) {
    console.log('\n-- Derived wallets from MNEMONIC (first 3) --');
    const derived = deriveMultiple(process.env.MNEMONIC, 3);
    derived.forEach(w => console.log(`#${w.index}	${w.address}	${w.privateKey}`));
  }

  // 3) If user provided PRIVATE_KEY in .env, show address and example connect
  if (process.env.PRIVATE_KEY) {
    const w = new ethers.Wallet(process.env.PRIVATE_KEY);
    console.log('\n-- Wallet from PRIVATE_KEY --');
    console.log('Address:', w.address);
  }

  // 4) Optional: connect to an RPC and show balance (requires RPC_URL in .env)
  if (process.env.RPC_URL) {
    try {
      const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
      const wallet = new ethers.Wallet(newWallet.privateKey, provider);
      const balance = await provider.getBalance(wallet.address);
      console.log('\n-- Connected to RPC --');
      console.log('Using address:', wallet.address);
      console.log('Balance:', ethers.utils.formatEther(balance), 'ETH');
    } catch (err) {
      console.error('Failed to connect to RPC:', err.message || err);
    }
  }

  // 5) Example: sign a simple message (offline)
  const signer = new ethers.Wallet(newWallet.privateKey);
  const msg = 'hello from evm-wallet script';
  const sig = await signer.signMessage(msg);
  console.log('\n-- Signed message example (offline) --');
  console.log('Message :', msg);
  console.log('Signature:', sig);

  console.log('\nDone. Remember: NEVER commit private keys/mnemonics to public repos.');
}

main().catch(err => {
  console.error('Error:', err);
});


// -----------------------------
// GitHub commit helper (Node.js)
// -----------------------------
// This helper will create or update a file in a GitHub repo (thus creating a commit)
// Uses: @octokit/rest and dotenv
// Usage:
// 1) npm install @octokit/rest dotenv
// 2) Create a .env with the following variables:
//    GITHUB_TOKEN=your_personal_access_token
//    REPO_OWNER=your_github_username_or_org
//    REPO_NAME=your_repo_name
//    BRANCH=main            # optional, default: main
//    FILE_PATH=path/in/repo/evm-wallet-nodejs.js
//    COMMIT_MESSAGE="Add evm wallet script"
//    LOCAL_FILE=./evm-wallet-nodejs.js   # optional - if provided, script will read this file and push its content
// 3) node github-commit-helper.js

const fs = require('fs');
require('dotenv').config();
const { Octokit } = require('@octokit/rest');

async function run() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.REPO_OWNER;
  const repo = process.env.REPO_NAME;
  const branch = process.env.BRANCH || 'main';
  const path = process.env.FILE_PATH || 'evm_wallet_nodejs.js';
  const message = process.env.COMMIT_MESSAGE || 'Add evm wallet script';
  const localFile = process.env.LOCAL_FILE; // optional

  if (!token || !owner || !repo) {
    console.error('Missing required env vars. Please set GITHUB_TOKEN, REPO_OWNER, REPO_NAME.');
    process.exit(1);
  }

  const octokit = new Octokit({ auth: token });

  let content;
  if (localFile) {
    content = fs.readFileSync(localFile, 'utf8');
  } else {
    // default to reading the evm-wallet-nodejs.js from this project folder if exists
    try {
      content = fs.readFileSync('./evm_wallet_nodejs.js', 'utf8');
    } catch (e) {
      // fallback: simple placeholder content
      content = `// evm_wallet_nodejs.js
// placeholder content - set LOCAL_FILE or create a file named evm_wallet_nodejs.js in the same folder.`;
    }
  }

  const encoded = Buffer.from(content, 'utf8').toString('base64');

  try {
    // Check if file exists to get its sha (required for update)
    let sha;
    try {
      const { data: existing } = await octokit.repos.getContent({ owner, repo, path, ref: branch });
      sha = existing.sha;
      console.log('File exists in repo, will update (sha:', sha, ')');
    } catch (err) {
      if (err.status === 404) {
        console.log('File does not exist in repo, will create it.');
      } else {
        throw err;
      }
    }

    const params = {
      owner,
      repo,
      path,
      message,
      content: encoded,
      branch,
      committer: {
        name: process.env.COMMITTER_NAME || 'EVM Wallet Script',
        email: process.env.COMMITTER_EMAIL || 'noreply@example.com'
      }
    };
    if (sha) params.sha = sha;

    const res = await octokit.repos.createOrUpdateFileContents(params);
    console.log('Commit created: ', res.data.commit.html_url);
  } catch (err) {
    console.error('Failed to create/update file:', err);
    process.exit(1);
  }
}

if (require.main === module) run();
