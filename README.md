# evm_wallet_nodejs

A simple Node.js script that:
- Generates a new random EVM wallet (address, private key, mnemonic)
- Signs a sample message for verification
- Automatically commits a file to your GitHub repository using the GitHub API

---

## 🪪 How to Use

1. **Install dependencies**
   ```bash
   npm install @octokit/rest dotenv ethers

2. Set up .env

`
GITHUB_TOKEN=ghp_xxxxxx         # Personal access token with repo scope
REPO_OWNER=phulimphad           # Your GitHub username
REPO_NAME=evm_wallet_nodejs     # Repository name
BRANCH=main
FILE_PATH=evm_wallet_nodejs.js
LOCAL_FILE=./evm_wallet_nodejs.js
COMMIT_MESSAGE=Add evm wallet script`

4. Run the script
`node evm_wallet_nodejs.js`

---

Would you like me to include a **“Quick Setup from zero”** section too (commands to auto-create the repo and first commit)? It can make running your project much smoother next time.
