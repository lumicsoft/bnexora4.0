let provider, signer, contract, usdtContract;
const CONTRACT_ADDRESS = "0x567982630826E9Fa7Cf6003036B5295d45526349"; 
const USDT_ADDRESS = "0x3B66b1E08F55AF26c8eA14a73dA64b6bC8D799dE"; // Testnet USDT

window.userData = {
    currentLevel: 0,
    isRegistered: false
};

const CONTRACT_ABI = [
    // --- Registration Functions ---
    "function registrationByAddress(address referrerAddress) external",
    "function registrationExt(address referrer) external",

    // --- User Status & Mapping ---
    "function isUserExists(address user) public view returns (bool)",
    "function addressToId(address) view returns (uint256)",
    "function idToAddress(uint256) view returns (address)",

    // --- Dashboard Data (Address Based) ---
    "function getUserDetailsByAddress(address userAdd) public view returns (uint256 id, address referrerAddress, uint256 referrerId, uint256 partnersCount, uint8 activeSlotsCount, uint256 teamSize, uint256 registrationTimestamp, uint256 totalIncome, uint8 rank)",
    "function getActiveLevelsCount(address userAddress) public view returns (uint8)",
    "function getDirectPartnerAddresses(address userAddress) public view returns (address[] memory)",
    "function isUserSlotActiveByAddress(address userAddress, uint8 slot) public view returns (bool)",

    // --- Matrix & Level Data ---
    "function levelTokenCost(uint8) view returns (uint256)",
    "function usersXMatrix(address userAddress, uint8 level) public view returns(address currentReferrer, uint256 reinvestCount, uint256 heldTokenForUpgrade, uint256 lastSpillUnderReceiverIndex, uint256 totalTeamSize, uint256 totalEarning)",
    "function usersXMatrixReferrals(address userAddress, uint8 level) public view returns(address[] memory referrals)",

    // --- System Stats ---
    "function totalProjectInvestment() view returns (uint256)",

    // --- Events ---
    "event Registration(uint256 indexed userId, uint256 indexed referrerId, address indexed userAddress)",
    "event Upgrade(uint256 indexed userId, uint256 indexed newReferrerId, uint8 level)",
    "event RankUpdated(address indexed user, uint8 newRank)",
    "function getUserIncomeHistory(address userAddress) public view returns (tuple(uint8 level, uint256 amount, string incomeType, address fromUser, uint256 fromUserId, uint256 matrixCycle, uint256 timestamp)[])",
    "event Spillover(uint256 indexed referrerId, uint256 indexed receiverId, uint8 level, uint256 cycle, uint8 virtualSpot)"
];
const USDT_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)"
];

// --- 1. NEW: AUTO-FILL LOGIC ---
function checkReferralURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const refAddr = urlParams.get('ref');
    const refField = document.getElementById('reg-referrer');

    if (refAddr && ethers.utils.isAddress(refAddr) && refField) {
        refField.value = refAddr;
        console.log("Referral address auto-filled:", refAddr);
    }
}

// --- INITIALIZATION ---
async function init() {
    checkReferralURL();
    if (window.ethereum) {
        try {
            provider = new ethers.providers.Web3Provider(window.ethereum, "any");
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            window.signer = provider.getSigner();
            signer = window.signer;
            window.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
            contract = window.contract;

            if (accounts && accounts.length > 0) {
                if (localStorage.getItem('manualLogout') !== 'true') {
                    await setupApp(accounts[0]);
                } else {
                    updateNavbar(accounts[0]);
                }
            }
        } catch (error) { 
            console.error("Init Error", error); 
        }
    } else { 
        alert("Wallet not detected! Please open this site inside Trust Wallet or MetaMask browser."); 
    }
}


window.handleBuyPackage = async function(pkgId) {
    try {
        const selectedPkg = packageData.find(p => p.id === pkgId);
        if (!selectedPkg) {
            alert("Package not found!");
            return;
        }

        const price = ethers.utils.parseUnits(selectedPkg.price.toString(), 18);
        console.log(`Buying ${selectedPkg.name}: ${selectedPkg.price} USDT`);

        const usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, window.signer);
        const userAddress = await window.signer.getAddress();
        
        const allowance = await usdtContract.allowance(userAddress, CONTRACT_ADDRESS);
        
        if (allowance.lt(price)) {
            console.log("Approving exact amount:", selectedPkg.price, "USDT");
            const btn = document.querySelector(`button[onclick*='handleBuyPackage(${pkgId})']`);
            if(btn) btn.innerText = "APPROVING...";
            const approveTx = await usdtContract.approve(CONTRACT_ADDRESS, price);
            await approveTx.wait();
        }
        
        const tx = await window.contract.buyPackage(pkgId);
        await tx.wait();
        
        alert(`${selectedPkg.name} purchased successfully!`);
        location.reload();
        
    } catch (err) { 
        console.error("Purchase Error:", err);
        if (err.code === 4001) {
            alert("Transaction cancelled by user.");
        } else {
            alert("Purchase failed: " + (err.reason || err.message));
        }
        location.reload();
    }
}

window.handleWithdraw = async function() {
    try {
        const tx = await contract.withdraw();
        await tx.wait();
        alert("Withdrawal successful!");
        location.reload();
    } catch (err) { alert("Withdraw failed: " + (err.reason || err.message)); }
}

window.handleClaimRewards = async function() {
    const btn = document.getElementById('claim-btn');
    try {
        if(btn) { 
            btn.disabled = true; 
            btn.innerText = "PROCESSING..."; 
        }

        const tx = await window.contract.claimAllIncomes();
        console.log("Claiming rewards... TX:", tx.hash);
        
        await tx.wait();
        
        alert("Success! Rewards added to your main balance.");
        
        if(typeof fetchAllData === 'function') {
            const address = await window.signer.getAddress();
            await fetchAllData(address); 
        }

        if(typeof window.updatePendingRewardsUI === 'function') {
            await window.updatePendingRewardsUI();
        } else if(btn) {
            btn.disabled = false;
            btn.innerText = "CLAIM ALL NOW";
        }
        
    } catch (err) {
        console.error("Claim Error:", err);
        if (!(err instanceof TypeError && err.message.includes("updatePendingRewardsUI"))) {
            alert("Claim failed. Check console for details.");
        }
        if(typeof window.updatePendingRewardsUI === 'function') {
            await window.updatePendingRewardsUI();
        } else if(btn) {
            btn.disabled = false;
            btn.innerText = "CLAIM ALL NOW";
        }
    }
}

window.handleLogin = async function() {
    try {
        if (!window.ethereum) return alert("Please install MetaMask!");
        const accounts = await provider.send("eth_requestAccounts", []);
        if (accounts.length === 0) return;
        
        const userAddress = accounts[0]; 
        signer = provider.getSigner();
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        localStorage.removeItem('manualLogout');
        
        // FIX: Replaced .users with .isUserExists
        const isRegistered = await contract.isUserExists(userAddress);
        if (isRegistered) {
            if(typeof showLogoutIcon === "function") showLogoutIcon(userAddress);
            window.location.href = "index1.html";
        } else {
            alert("This wallet is not registered!");
            window.location.href = "register.html";
        }
    } catch (err) {
        console.error("Login Error:", err);
        alert("Login failed! Make sure you are on BSC Testnet.");
    }
}

window.handleRegister = async function() {
    try {
        if (!window.ethereum) {
            alert("MetaMask or Trust Wallet not found!");
            return;
        }

        const tempProvider = new ethers.providers.Web3Provider(window.ethereum);
        await tempProvider.send("eth_requestAccounts", []);
        signer = tempProvider.getSigner();
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        const usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);
        
        const userAddress = await signer.getAddress();
        const refField = document.getElementById('reg-referrer');
        const referrerAddress = refField ? refField.value.trim() : "";
        
        const regAmount = ethers.utils.parseUnits("10", 18);

        if (!ethers.utils.isAddress(referrerAddress)) {
            alert("Please enter a valid Referrer Wallet Address (0x...)");
            return;
        }

        const btn = document.getElementById('reg-btn');
        if(btn) {
            btn.disabled = true;
            btn.innerText = "PROCESSING...";
        }

        const allowance = await usdtContract.allowance(userAddress, CONTRACT_ADDRESS);
        if (allowance.lt(regAmount)) {
            if(btn) btn.innerText = "APPROVE 10 USDT...";
            const estApproveGas = await usdtContract.estimateGas.approve(CONTRACT_ADDRESS, regAmount);
            const approveTx = await usdtContract.approve(CONTRACT_ADDRESS, regAmount, {
                gasLimit: estApproveGas.mul(130).div(100) 
            });
            await approveTx.wait();
        }

        if(btn) btn.innerText = "ESTIMATING GAS...";

        try {
            // FIX: Using registrationByAddress as per new contract
            const tx = await contract.registrationByAddress(referrerAddress);
            alert("Transaction sent! Waiting for confirmation...");
            const receipt = await tx.wait();

            if (receipt.status === 1) {
                alert("Registration Successful!");
                window.location.href = "index1.html";
            }
        } catch (gasErr) {
            console.error("Gas Estimation Failed:", gasErr);
            throw new Error("Transaction would fail. Check if you have enough BNB for gas.");
        }

    } catch (err) {
        console.error("Detailed Error:", err);
        const btn = document.getElementById('reg-btn');
        if(btn) {
            btn.disabled = false;
            btn.innerText = "REGISTER NOW";
        }
        alert("Error: " + (err.reason || err.message));
    }
}

window.handleLogout = function() {
    if (confirm("Do you want to disconnect?")) {
        localStorage.setItem('manualLogout', 'true');
        signer = null;
        contract = null;
        window.location.href = "index.html";
    }
}

function showLogoutIcon(address) {
    const btn = document.getElementById('connect-btn');
    const logout = document.getElementById('logout-icon-btn');
    if (btn) btn.innerText = address.substring(0, 6) + "..." + address.substring(38);
    if (logout) { logout.style.display = 'flex'; }
}

// --- APP SETUP ---
async function setupApp(address) {
    try {
        const network = await provider.getNetwork();
        if (network.chainId !== 97) { 
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0x61' }],
                });
            } catch (err) {
                alert("Please switch to BSC testnet!");
                return; 
            }
        }
        
        // FIX: Replaced .users with .isUserExists
        const isRegistered = await contract.isUserExists(address);
        const path = window.location.pathname;

        window.userData.isRegistered = isRegistered;

        if (!isRegistered) {
            if (!path.includes('register') && !path.includes('login')) {
                window.location.href = "register.html"; 
                return; 
            }
        } else {
            if (path.includes('register') || path.includes('login') || path.endsWith('index.html')) {
                window.location.href = "index1.html";
                return;
            }
        }

        updateNavbar(address);
        showLogoutIcon(address); 

        if (path.includes('index1')) {
            await fetchAllData(address);
        }

        if (path.includes('referral') || path.includes('deposits')) {
            if (typeof initReferralPage === "function") {
                await initReferralPage();
            } else if (typeof initTeamPage === "function") {
                await initTeamPage();
            }
        }
        
        if (path.includes('deposits')) {
            if (typeof initTeamPage === "function") {
                await initTeamPage();
            } else {
                await fetchAllData(address); 
                if(window.loadTree) window.loadTree(address);
            }
        }

        if (path.includes('history')) {
            window.showHistory('deposit');
        }

    } catch (e) {
        console.error("SetupApp Error:", e);
    }
}
// --- HISTORY LOGIC ---
window.showHistory = async function(type) {
    const container = document.getElementById('history-container');
    if(!container) return;
    container.innerHTML = `<div class="p-10 text-center text-yellow-500 italic">Blockchain Syncing...</div>`;
    
    const logs = await window.fetchBlockchainHistory(type);
    if (logs.length === 0) {
        container.innerHTML = `<div class="p-10 text-center text-gray-500">No transactions found.</div>`;
        return;
    }

    container.innerHTML = logs.map(item => `
        <div class="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4 flex justify-between items-center">
            <div>
                <h4 class="font-bold ${item.color}">${item.type}</h4>
                <p class="text-xs text-gray-400">${item.date} | ${item.time}</p>
            </div>
            <div class="text-right">
                <span class="text-lg font-black text-white">${item.amount}</span>
                <p class="text-[10px] text-gray-500 italic uppercase">Completed</p>
            </div>
        </div>
    `).join('');
}


window.getIncomeHistory = async (userAddress) => {
    try {
        const activeContract = window.contract || contract;
        if (!activeContract) return [];

        const historyData = await activeContract.getUserIncomeHistory(userAddress);
        if (!historyData || historyData.length === 0) return [];

        const formattedHistory = historyData.map((record, index) => {
            try {
                const amountRaw = record.amount || record[0];
                const typeRaw = record.incomeType || record[1];
                const timeRaw = record.time || record[2];
                const fromRaw = record.from || record[3];
                const pkgRaw = record.packageId || record[4];

                return {
                    amount: ethers.utils.formatEther(amountRaw.toString()),
                    incomeType: Number(typeRaw.toString()),
                    time: Number(timeRaw.toString()),
                    from: fromRaw,
                    packageId: Number(pkgRaw.toString()),
                    index: index + 1
                };
            } catch (innerErr) { return null; }
        }).filter(item => item !== null);

        return formattedHistory.sort((a, b) => b.time - a.time);
    } catch (e) { return []; }
}

window.fetchBlockchainHistory = async function(type) {
    try {
        const activeSigner = window.signer || signer;
        const activeContract = window.contract || contract;
        const address = await activeSigner.getAddress();
        const rawHistory = await activeContract.getUserHistory(address);
        
        return rawHistory.map(item => {
            const dt = new Date(item.timestamp.toNumber() * 1000);
            return {
                type: item.txType,
                amount: format(item.amount),
                date: dt.toLocaleDateString(),
                time: dt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                ts: item.timestamp.toNumber(),
                color: 'text-cyan-400'
            };
        }).sort((a, b) => b.ts - a.ts);
    } catch (e) { return []; }
}

async function fetchAllData(address) {
    try {
        console.log("Fetching data for:", address);
        
        // --- 1. DIRECT ADDRESS SE DETAILS NIKALNA ---
        // Final ABI ke mutabik function ka naam 'getUserDetailsByAddress' hai
        const details = await window.contract.getUserDetailsByAddress(address);
        
        // --- 2. DASHBOARD SYNC ---
        
        // Header & Profile Setup
        // Naye ABI mein 'id' pehla return parameter hai
        updateText('user-id-display', details.id ? "#" + details.id.toString() : "#0000");
        updateText('connect-btn', address.substring(0,6) + "..." + address.substring(38));
        
        // Rank Setup
        const rankLabel = "Rank: " + details.rank.toString();
        updateText('rank-display', rankLabel);
        updateText('current-rank-header', rankLabel);

        // Referral Link (Address based link as requested)
        const currentPath = window.location.pathname;
        const basePath = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
        const refUrl = window.location.origin + basePath + "register.html?ref=" + address;
        
        const refInput = document.getElementById('refURL');
        if(refInput) {
            refInput.value = refUrl;
        }

        // Income & Earnings Setup
        const income = format(details.totalIncome);
        updateText('total-income', income);
        updateText('total-income-display', income); // Agar element exists karta hai
        updateText('balance-large', income);
        
        // Matrix, Level aur Direct Income (Contract abhi total income hi de raha hai)
        updateText('matrix-earnings', income + " USDT"); 
        updateText('level-earnings', "0.00 USDT");
        updateText('direct-earnings', "0.00 USDT");

        // Team & Network Stats
        updateText('partners-count', details.partnersCount.toString());
        updateText('direct-count', details.partnersCount.toString());
        updateText('team-size', details.teamSize.toString());
        
        // Active Slots count (Level 1 to 12)
        updateText('active-slots-count', details.activeSlotsCount.toString() + "/12");
        
        // Referrer details
        updateText('referrer-id-display', "Ref ID: " + details.referrerId.toString());

    } catch (e) {
        console.error("Fetch Data Error (Final Sync):", e);
        // Agar dashboard load nahi hota toh console check karein ki function name match kar raha hai ya nahi
    }
}

window.loadMatrixData = async function(level) {
    try {
        const userAddress = await signer.getAddress();
        const data = await contract.usersXMatrix(userAddress, level);
        return {
            referrer: data.currentReferrer,
            reinvests: data.reinvestCount.toString(),
            heldForUpgrade: format(data.heldTokenForUpgrade),
            earnings: format(data.totalEarning),
            team: data.totalTeamSize.toString()
        };
    } catch (e) { return null; }
}

window.getAllMatrixHistory = async function(userAddr, pkgId) {
    try {
        const activeContract = window.contract; 
        const history = await activeContract.getAllMatrixHistory(userAddr, pkgId);
        return history.map(node => ({
            index: node.index.toString(),
            filledCount: node.filledCount.toString(),
            slotA: node.slotA,
            slotB: node.slotB,
            slotC: node.slotC
        }));
    } catch (e) { return []; }
}

window.syncPendingRewards = async function() {
    try {
        const activeContract = window.contract || contract;
        const address = await signer.getAddress();
        const pending = await activeContract.getPendingIncomeDetails(address);
        
        const pDaily = parseFloat(ethers.utils.formatEther(pending[0]));
        const pLunar = parseFloat(ethers.utils.formatEther(pending[1]));
        const pBoxer = parseFloat(ethers.utils.formatEther(pending[2]));
        const pFastTrack = pending[3] ? parseFloat(ethers.utils.formatEther(pending[3])) : 0;
        
        const totalPending = pDaily + pLunar + pBoxer + pFastTrack;
        updateText('total-pending-claim', totalPending.toFixed(2));
        updateText('p-daily', pDaily.toFixed(2));
        updateText('p-lunar', pLunar.toFixed(2));
        updateText('p-booster', pBoxer.toFixed(2));
        updateText('p-fast-track', pFastTrack.toFixed(2));

        const claimBtn = document.getElementById('claim-btn');
        if (claimBtn) claimBtn.disabled = totalPending <= 0;
    } catch (e) {}
}

const format = (val) => {
    try { 
        if (!val) return "0.00"; 
        return parseFloat(ethers.utils.formatUnits(val, 18)).toFixed(2);
    } catch (e) { return "0.00"; }
};

const updateText = (id, val) => { const el = document.getElementById(id); if(el) el.innerText = val; };

function updateNavbar(addr) {
    const btn = document.getElementById('connect-btn');
    if(btn) btn.innerText = addr.substring(0,6) + "..." + addr.substring(38);
}

if (window.ethereum) {
    window.ethereum.on('accountsChanged', () => { location.reload(); });
    window.ethereum.on('chainChanged', () => location.reload());
}

window.addEventListener('load', init);
