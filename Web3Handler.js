import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";

// --- Configuration ---
const CONTRACT_ADDRESS = "0xd077cf115e84d5cbfd42687f38fd6595e555ce59"; 
const USDT_ADDRESS = "0x3B66b1E08F55AF26c8eA14a73dA64b6bC8D799dE"; 

let provider, signer, contract, usdtContract;

window.userData = {
    currentPackageId: -1,
    isRegistered: false
};

const CONTRACT_ABI = [
    "function registrationExt(uint256 referrerId) external",
    "function users(address) view returns (uint256 id, address referrer, uint256 referrerId, uint256 teamSize, uint256 registrationTimestamp, uint256 totalIncome, uint8 currentRank, bool registered)",
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

// --- initialization Function ---
async function initWeb3() {
    if (window.ethereum) {
        try {
            provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            signer = await provider.getSigner();
            
            contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
            usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);
            return accounts[0];
        } catch (error) {
            console.error("User denied account access");
            return null;
        }
    }
    return null;
}

// --- 1. LOGIN LOGIC (Admin & User Friendly) ---
window.handleLogin = async function() {
    try {
        const address = await initWeb3();
        if (!address) return alert("Please install/connect MetaMask!");

        localStorage.removeItem('manualLogout');
        
        // Contract logic: Check if user exists (Works for ID 1 and all others)
        const registered = await contract.isUserExists(address);
        
        if (registered) {
            if(typeof showLogoutIcon === "function") showLogoutIcon(address);
            window.location.href = "index1.php";
        } else {
            alert("This wallet is not registered!");
            window.location.href = "register.html";
        }
    } catch (err) {
        console.error("Login Error:", err);
        alert("Login failed! Ensure you are on BSC Testnet.");
    }
}

// --- 2. REGISTER LOGIC (10 USDT) ---
window.handleRegister = async function() {
    try {
        const address = await initWeb3();
        if (!address) return alert("MetaMask or Trust Wallet not found!");
        
        const refField = document.getElementById('reg-referrer');
        const referrerId = refField ? refField.value.trim() : "";

        if (!referrerId || isNaN(referrerId)) return alert("Please enter a valid Referrer ID (Number)");

        const regAmount = ethers.parseUnits("10", 18); 
        const btn = document.getElementById('reg-btn');
        if(btn) { btn.disabled = true; btn.innerText = "PROCESSING..."; }

        const allowance = await usdtContract.allowance(address, CONTRACT_ADDRESS);
        if (allowance < regAmount) {
            if(btn) btn.innerText = "APPROVE 10 USDT...";
            const approveTx = await usdtContract.approve(CONTRACT_ADDRESS, ethers.MaxUint256);
            await approveTx.wait();
        }

        if(btn) btn.innerText = "CONFIRMING...";
        const tx = await contract.registrationExt(referrerId); 
        await tx.wait();

        localStorage.removeItem('manualLogout');
        window.location.href = "index1.php";
    } catch (err) {
        console.error("Reg Error:", err);
        const btn = document.getElementById('reg-btn');
        if(btn) { btn.disabled = false; btn.innerText = "REGISTER NOW"; }
        alert("Error: " + (err.reason || err.message));
    }
}

// --- 3. PURCHASE & REWARDS ---
window.handleBuyPackage = async function(pkgId) {
    try {
        await initWeb3();
        const selectedPkg = packageData.find(p => p.id === pkgId);
        if (!selectedPkg) return alert("Package not found!");
        
        const price = ethers.parseUnits(selectedPkg.price.toString(), 18);
        const userAddress = await signer.getAddress();
        
        const allowance = await usdtContract.allowance(userAddress, CONTRACT_ADDRESS);
        if (allowance < price) {
            const btn = document.querySelector(`button[onclick*='handleBuyPackage(${pkgId})']`);
            if(btn) btn.innerText = "APPROVING...";
            const approveTx = await usdtContract.approve(CONTRACT_ADDRESS, price);
            await approveTx.wait();
        }
        const tx = await contract.buyPackage(pkgId);
        await tx.wait();
        alert(`${selectedPkg.name} purchased successfully!`);
        location.reload();
    } catch (err) { console.error(err); location.reload(); }
}

window.handleWithdraw = async function() {
    try {
        await initWeb3();
        const tx = await contract.withdraw();
        await tx.wait();
        alert("Withdrawal successful!");
        location.reload();
    } catch (err) { alert("Withdraw failed: " + (err.reason || err.message)); }
}

window.handleClaimRewards = async function() {
    const btn = document.getElementById('claim-btn');
    try {
        await initWeb3();
        if(btn) { btn.disabled = true; btn.innerText = "PROCESSING..."; }
        const tx = await contract.claimAllIncomes();
        await tx.wait();
        alert("Success! Rewards added.");
        fetchAllData(await signer.getAddress());
        if(btn) { btn.disabled = false; btn.innerText = "CLAIM ALL NOW"; }
    } catch (err) { if(btn) { btn.disabled = false; btn.innerText = "CLAIM ALL NOW"; } }
}

// --- 4. DATA FETCHING ---
async function fetchAllData(address) {
    try {
        const userId = await contract.addressToId(address);
        if (userId == 0n) return;
        
        const d = await contract.getUserDetails(userId); 
        
        updateText('user-id-display', "ID: " + userId.toString());
        updateText('referrer-id-display', "Ref ID: " + d[2].toString());
        updateText('total-income-display', format(d[7]));
        updateText('partners-count', d[3].toString());
        updateText('team-size', d[5].toString());
        updateText('rank-display', getRankName(Number(d[8])));

        const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '');
        const refUrl = `${baseUrl}/register.html?ref=${userId.toString()}`;
        if (document.getElementById('refURL')) document.getElementById('refURL').value = refUrl;

        for(let i = 1; i <= 12; i++) {
            const isActive = await contract.isUserSlotActive(userId, i); 
            const slotCard = document.getElementById(`slot-card-${i}`);
            if(slotCard && isActive) slotCard.classList.remove('slot-locked');
        }
    } catch (e) { console.error("Fetch Data Error:", e); }
}

// --- 5. MATRIX TREE ---
window.loadTreeData = async function(level) {
    try {
        await initWeb3();
        const userAddr = await signer.getAddress();
        const stats = await contract.usersXMatrix(userAddr, level); 
        const referrals = await contract.usersXMatrixReferrals(userAddr, level); 
        
        updateText('slot-id-header', "Level " + level);
        updateText('cycle-display', stats[1].toString());
        updateText('slot-earnings', format(stats[5]));
        
        const nodeCircles = document.querySelectorAll('.node-circle');
        nodeCircles.forEach((circle, index) => {
            circle.classList.remove('node-filled');
            if (referrals[index] && referrals[index] !== ethers.ZeroAddress) {
                circle.classList.add('node-filled'); 
                circle.innerText = (index + 1);
            } else { circle.innerText = ""; }
        });
    } catch (e) { console.error(e); }
};

// --- 6. SETUP & UTILS ---
async function setupApp(address) {
    try {
        const network = await provider.getNetwork();
        if (Number(network.chainId) !== 97) { 
            await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x61' }] });
        }
        
        const registered = await contract.isUserExists(address);
        window.userData.isRegistered = registered;

        const path = window.location.pathname;
        if (!registered) {
            if (!path.includes('register') && !path.includes('login')) window.location.href = "register.html";
        } else {
            if (path.includes('register') || path.includes('login') || path.endsWith('index.html') || path === '/') {
                window.location.href = "index1.php";
            }
            await fetchAllData(address);
        }
        updateNavbar(address);
        showLogoutIcon(address);
    } catch (e) { console.error("Setup Error:", e); }
}

window.handleLogout = function() {
    if (confirm("Do you want to disconnect?")) {
        localStorage.setItem('manualLogout', 'true');
        window.location.href = "index.html";
    }
}

const format = (val) => {
    try { if (!val) return "0.0000"; return parseFloat(ethers.formatUnits(val, 18)).toFixed(4); } catch (e) { return "0.0000"; }
};
const updateText = (id, val) => { const el = document.getElementById(id); if(el) el.innerText = val; };
function getRankName(r) { const ranks = ["No Rank", "Bronze", "Silver", "Gold", "Diamond"]; return ranks[r] || "Beginner"; }
function updateNavbar(addr) { const btn = document.getElementById('connect-btn'); if(btn) btn.innerText = addr.substring(0,6) + "..." + addr.substring(38); }
function showLogoutIcon(address) { const logout = document.getElementById('logout-icon-btn'); if (logout) { logout.style.display = 'flex'; } }

if (window.ethereum) {
    window.ethereum.on('accountsChanged', () => { localStorage.removeItem('manualLogout'); location.reload(); });
    window.ethereum.on('chainChanged', () => location.reload());
}

const checkReferralURL = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref && document.getElementById('reg-referrer')) document.getElementById('reg-referrer').value = ref;
};

window.addEventListener('load', () => {
    checkReferralURL();
    initWeb3().then(address => {
        if (address && localStorage.getItem('manualLogout') !== 'true') setupApp(address);
    });
});
