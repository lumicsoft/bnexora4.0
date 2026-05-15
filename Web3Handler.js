import { ethers } from "ethers";

// Configuration
const CONTRACT_ADDRESS = "0xd077cf115e84d5cbfd42687f38fd6595e555ce59"; 
const USDT_ADDRESS = "0x3B66b1E08F55AF26c8eA14a73dA64b6bC8D799dE"; // Testnet USDT

window.userData = {
    currentPackageId: -1,
    isRegistered: false
};

const CONTRACT_ABI = [
    "function registrationExt(uint256 referrerId) external",
    "function users(address) view returns (uint256 id, address referrer, uint256 referrerId, uint256 teamSize, uint256 registrationTimestamp, uint256 totalIncome, uint8 currentRank)",
    "function getUserDetails(uint userId) view returns (address userAddress, address referrerAddress, uint referrerId, uint partnersCount, uint8 activeSlotsCount, uint teamSize, uint registrationTimestamp, uint256 totalIncome, uint8 rank)",
    "function usersXMatrix(address userAddress, uint8 level) view returns (address currentReferrer, uint reinvestCount, uint heldTokenForUpgrade, uint lastSpillUnderReceiverIndex, uint totalTeamSize, uint256 totalEarning)",
    "function usersXMatrixReferrals(address userAddress, uint8 level) view returns (address[] memory referrals)",
    "function addressToId(address) view returns (uint256)",
    "function levelTokenCost(uint8) view returns (uint256)",
    "function isUserSlotActive(uint256 userId, uint8 slot) view returns (bool)",
    "function isUserExists(address user) view returns (bool)"
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

    if (refAddr && refField) {
        refField.value = refAddr;
        console.log("Referral auto-filled:", refAddr);
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
            usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);

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

// --- NEW: FIXED LOGIN LOGIC ---
window.handleLogin = async function() {
    try {
        if (!window.ethereum) return alert("Please install MetaMask!");
        const accounts = await provider.send("eth_requestAccounts", []);
        if (accounts.length === 0) return;
        
        const userAddress = accounts[0]; 
        signer = provider.getSigner();
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        localStorage.removeItem('manualLogout');
        
        const registered = await contract.isUserExists(userAddress); [cite: 1]
        if (registered) {
            if(typeof showLogoutIcon === "function") showLogoutIcon(userAddress);
            window.location.href = "index1.php"; [cite: 1]
        } else {
            alert("This wallet is not registered!");
            window.location.href = "register.html"; [cite: 1]
        }
    } catch (err) {
        console.error("Login Error:", err);
        alert("Login failed! Ensure you are on BSC Testnet.");
    }
}

// --- NEW: FIXED REGISTER LOGIC (10 USDT) ---
window.handleRegister = async function() {
    try {
        if (!window.ethereum) return alert("MetaMask or Trust Wallet not found!");
        
        const userAddress = await signer.getAddress();
        const refField = document.getElementById('reg-referrer');
        const referrerId = refField ? refField.value.trim() : "";

        if (!referrerId || isNaN(referrerId)) return alert("Please enter a valid Referrer ID (Number)");

        const regAmount = ethers.utils.parseUnits("10", 18); [cite: 1]
        const btn = document.getElementById('reg-btn');
        if(btn) { btn.disabled = true; btn.innerText = "PROCESSING..."; }

        const allowance = await usdtContract.allowance(userAddress, CONTRACT_ADDRESS);
        if (allowance.lt(regAmount)) {
            if(btn) btn.innerText = "APPROVE 10 USDT...";
            const approveTx = await usdtContract.approve(CONTRACT_ADDRESS, ethers.constants.MaxUint256);
            await approveTx.wait();
        }

        if(btn) btn.innerText = "ESTIMATING GAS...";
        const estimatedGas = await contract.estimateGas.registrationExt(referrerId); [cite: 1]
        const tx = await contract.registrationExt(referrerId, {
            gasLimit: estimatedGas.mul(130).div(100) 
        });

        await tx.wait();
        localStorage.removeItem('manualLogout');
        window.location.href = "index1.php"; [cite: 1]
    } catch (err) {
        console.error("Reg Error:", err);
        if(document.getElementById('reg-btn')) {
            document.getElementById('reg-btn').disabled = false;
            document.getElementById('reg-btn').innerText = "REGISTER NOW";
        }
        alert("Error: " + (err.reason || err.message));
    }
}

// --- REST OF YOUR FUNCTIONS (NO CHANGES) ---
window.handleBuyPackage = async function(pkgId) {
    try {
        const selectedPkg = packageData.find(p => p.id === pkgId);
        if (!selectedPkg) return alert("Package not found!");
        const price = ethers.utils.parseUnits(selectedPkg.price.toString(), 18);
        const userAddress = await window.signer.getAddress();
        const allowance = await usdtContract.allowance(userAddress, CONTRACT_ADDRESS);
        if (allowance.lt(price)) {
            const btn = document.querySelector(`button[onclick*='handleBuyPackage(${pkgId})']`);
            if(btn) btn.innerText = "APPROVING...";
            const approveTx = await usdtContract.approve(CONTRACT_ADDRESS, price);
            await approveTx.wait();
        }
        const tx = await window.contract.buyPackage(pkgId);
        await tx.wait();
        alert(`${selectedPkg.name} purchased successfully!`);
        location.reload();
    } catch (err) { console.error(err); location.reload(); }
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
        if(btn) { btn.disabled = true; btn.innerText = "PROCESSING..."; }
        const tx = await window.contract.claimAllIncomes();
        await tx.wait();
        alert("Success! Rewards added.");
        if(typeof fetchAllData === 'function') await fetchAllData(await window.signer.getAddress());
        if(btn) { btn.disabled = false; btn.innerText = "CLAIM ALL NOW"; }
    } catch (err) { if(btn) { btn.disabled = false; btn.innerText = "CLAIM ALL NOW"; } }
}

async function fetchAllData(address) {
    try {
        const userId = await contract.addressToId(address);
        if (userId.isZero()) return;
        const d = await contract.getUserDetails(userId); [cite: 1]
        updateText('user-id-display', "ID: " + userId.toString());
        updateText('referrer-id-display', "Ref ID: " + d.referrerId.toString());
        updateText('total-income-display', format(d.totalIncome));
        updateText('partners-count', d.partnersCount.toString());
        updateText('team-size', d.teamSize.toString());
        updateText('rank-display', getRankName(d.rank));
        const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '');
        const refUrl = `${baseUrl}/register.html?ref=${userId.toString()}`;
        if (document.getElementById('refURL')) document.getElementById('refURL').value = refUrl;
        for(let i = 1; i <= 12; i++) {
            const isActive = await contract.isUserSlotActive(userId, i); [cite: 1]
            const slotCard = document.getElementById(`slot-card-${i}`);
            if(slotCard && isActive) slotCard.classList.remove('slot-locked');
        }
    } catch (e) { console.error(e); }
}

window.handleLogout = function() {
    if (confirm("Do you want to disconnect?")) {
        localStorage.setItem('manualLogout', 'true');
        signer = null; contract = null;
        window.location.href = "index.html";
    }
}

function showLogoutIcon(address) {
    const btn = document.getElementById('connect-btn');
    const logout = document.getElementById('logout-icon-btn');
    if (btn) btn.innerText = address.substring(0, 6) + "..." + address.substring(38);
    if (logout) { logout.style.display = 'flex'; }
}

async function setupApp(address) {
    try {
        const network = await provider.getNetwork();
        if (network.chainId !== 97) { 
            await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x61' }] });
        }
        const userDataFromContract = await contract.users(address);
        const isRegistered = userDataFromContract.id.gt(0);
        const path = window.location.pathname;
        window.userData.isRegistered = isRegistered;
        if (!isRegistered) {
            if (!path.includes('register') && !path.includes('login')) window.location.href = "register.html";
        } else {
            if (path.includes('register') || path.includes('login') || path.endsWith('index.html')) window.location.href = "index1.php";
            await fetchAllData(address);
        }
        updateNavbar(address);
        showLogoutIcon(address);
    } catch (e) { console.error(e); }
}

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
            <div><h4 class="font-bold ${item.color}">${item.type}</h4><p class="text-xs text-gray-400">${item.date} | ${item.time}</p></div>
            <div class="text-right"><span class="text-lg font-black text-white">${item.amount}</span><p class="text-[10px] text-gray-500 italic uppercase">Completed</p></div>
        </div>`).join('');
}

window.fetchBlockchainHistory = async function(type) {
    try {
        const address = await signer.getAddress();
        const rawHistory = await contract.getUserHistory(address);
        return rawHistory.map(item => {
            const dt = new Date(item.timestamp.toNumber() * 1000);
            return { type: item.txType, amount: format(item.amount), date: dt.toLocaleDateString(), time: dt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), ts: item.timestamp.toNumber(), color: 'text-cyan-400' };
        }).sort((a, b) => b.ts - a.ts);
    } catch (e) { return []; }
}

window.loadTreeData = async function(level) {
    const userAddr = await signer.getAddress();
    const stats = await contract.usersXMatrix(userAddr, level); [cite: 1]
    const referrals = await contract.usersXMatrixReferrals(userAddr, level); [cite: 1]
    updateText('slot-id-header', "Level " + level);
    updateText('cycle-display', stats.reinvestCount.toString());
    updateText('slot-earnings', format(stats.totalEarning));
    const nodeCircles = document.querySelectorAll('.node-circle');
    nodeCircles.forEach((circle, index) => {
        circle.classList.remove('node-filled');
        if (referrals[index] && referrals[index] !== ethers.constants.AddressZero) {
            circle.classList.add('node-filled'); circle.innerText = (index + 1);
        } else { circle.innerText = ""; }
    });
};

const format = (val) => {
    try { if (!val) return "0.0000"; return parseFloat(ethers.utils.formatUnits(val, 18)).toFixed(4); } catch (e) { return "0.0000"; }
};
const updateText = (id, val) => { const el = document.getElementById(id); if(el) el.innerText = val; };
function getRankName(r) { const ranks = ["No Rank", "Bronze", "Silver", "Gold", "Diamond"]; return ranks[r] || "Beginner"; }
function updateNavbar(addr) { const btn = document.getElementById('connect-btn'); if(btn) btn.innerText = addr.substring(0,6) + "..." + addr.substring(38); }

if (window.ethereum) {
    window.ethereum.on('accountsChanged', () => { localStorage.removeItem('manualLogout'); location.reload(); });
    window.ethereum.on('chainChanged', () => location.reload());
}

window.addEventListener('load', init);
