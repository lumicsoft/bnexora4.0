let provider, signer, contract, usdtContract;
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

// --- 1. AUTO-FILL LOGIC ---
function checkReferralURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const refId = urlParams.get('ref'); // Contract expects ID (Number)
    const refField = document.getElementById('reg-referrer');

    if (refId && refField) {
        refField.value = refId;
        console.log("Referral ID auto-filled:", refId);
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

// --- CORE LOGIC: REGISTER (10 USDT) ---
window.handleRegister = async function() {
    try {
        if (!window.ethereum) return alert("Wallet not found!");
        
        const userAddress = await signer.getAddress();
        const refField = document.getElementById('reg-referrer');
        const referrerId = refField ? refField.value.trim() : "";

        if (!referrerId || isNaN(referrerId)) return alert("Please enter a valid Referrer ID (Number)");

        const regAmount = ethers.utils.parseUnits("10", 18); // 10 USDT for Bnexora
        const btn = document.getElementById('reg-btn');
        if(btn) { btn.disabled = true; btn.innerText = "PROCESSING..."; }

        const allowance = await usdtContract.allowance(userAddress, CONTRACT_ADDRESS);
        if (allowance.lt(regAmount)) {
            if(btn) btn.innerText = "APPROVE 10 USDT...";
            const approveTx = await usdtContract.approve(CONTRACT_ADDRESS, ethers.constants.MaxUint256);
            await approveTx.wait();
        }

        if(btn) btn.innerText = "ESTIMATING GAS...";
        const estimatedGas = await contract.estimateGas.registrationExt(referrerId);
        const tx = await contract.registrationExt(referrerId, {
            gasLimit: estimatedGas.mul(130).div(100) 
        });

        alert("Transaction sent! Waiting for confirmation...");
        await tx.wait();

        alert("Registration Successful!");
        localStorage.removeItem('manualLogout');
        window.location.href = "index1.php";

    } catch (err) {
        console.error("Reg Error:", err);
        const btn = document.getElementById('reg-btn');
        if(btn) { btn.disabled = false; btn.innerText = "REGISTER NOW"; }
        alert("Error: " + (err.reason || err.message));
    }
}

// --- CORE LOGIC: LOGIN ---
window.handleLogin = async function() {
    try {
        if (!window.ethereum) return alert("MetaMask not found!");
        const accounts = await provider.send("eth_requestAccounts", []);
        const userAddress = accounts[0]; 
        
        signer = provider.getSigner();
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        localStorage.removeItem('manualLogout');
        
        const registered = await contract.isUserExists(userAddress);
        if (registered) {
            if(typeof showLogoutIcon === "function") showLogoutIcon(userAddress);
            window.location.href = "index1.php";
        } else {
            alert("This wallet is not registered in Bnexora!");
            window.location.href = "register.html";
        }
    } catch (err) {
        console.error("Login Error:", err);
        alert("Login failed!");
    }
}

// --- DASHBOARD DATA FETCH ---
async function fetchAllData(address) {
    try {
        const userId = await contract.addressToId(address);
        if (userId.isZero()) return;

        const d = await contract.getUserDetails(userId);
        
        // Dashboard Stats Update
        updateText('user-id-display', "ID: #" + userId.toString());
        updateText('referrer-id-display', "Invited By ID: " + d.referrerId.toString());
        updateText('total-income-display', format(d.totalIncome));
        updateText('partners-count', d.partnersCount.toString());
        updateText('team-size', d.teamSize.toString());
        updateText('rank-display', getRankName(d.rank));

        // Referral Link
        const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '');
        const refUrl = `${baseUrl}/register.html?ref=${userId.toString()}`;
        if (document.getElementById('refURL')) document.getElementById('refURL').value = refUrl;

        // Active Slots Highlight Loop
        for(let i = 1; i <= 12; i++) {
            const isActive = await contract.isUserSlotActive(userId, i);
            const slotCard = document.getElementById(`slot-card-${i}`);
            if(slotCard && isActive) slotCard.classList.remove('slot-locked');
        }

    } catch (e) { 
        console.error("Fetch Data Error:", e); 
    }
}

// --- MATRIX TREE VIEW (14 Nodes) ---
window.loadTreeData = async function(level) {
    try {
        const userAddr = await signer.getAddress();
        const stats = await contract.usersXMatrix(userAddr, level);
        const referrals = await contract.usersXMatrixReferrals(userAddr, level);
        
        updateText('slot-id-header', "Level " + level);
        updateText('cycle-display', stats.reinvestCount.toString());
        updateText('slot-earnings', format(stats.totalEarning));

        const nodeCircles = document.querySelectorAll('.node-circle');
        nodeCircles.forEach((circle, index) => {
            circle.classList.remove('node-filled');
            if (referrals[index] && referrals[index] !== ethers.constants.AddressZero) {
                circle.classList.add('node-filled');
                circle.innerText = (index + 1);
            } else {
                circle.innerText = "";
            }
        });
    } catch (e) { console.error("Tree Error", e); }
};

// --- APP SETUP & SYSTEM ---
async function setupApp(address) {
    try {
        const network = await provider.getNetwork();
        if (network.chainId !== 97) { 
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x61' }],
            });
        }
        
        const registered = await contract.isUserExists(address);
        const path = window.location.pathname;

        if (!registered) {
            if (!path.includes('register')) window.location.href = "register.html";
        } else {
            if (path.includes('register') || path.endsWith('index.html') || path === '/') {
                window.location.href = "index1.php";
            }
            await fetchAllData(address);
        }
        updateNavbar(address);
        showLogoutIcon(address);
    } catch (e) { console.error("SetupApp Error:", e); }
}

window.handleLogout = function() {
    if (confirm("Do you want to disconnect?")) {
        localStorage.setItem('manualLogout', 'true');
        signer = null;
        contract = null;
        window.location.href = "index.html";
    }
}

// --- UTILS ---
const format = (val) => {
    try { 
        if (!val) return "0.0000"; 
        return parseFloat(ethers.utils.formatUnits(val, 18)).toFixed(4);
    } catch (e) { return "0.0000"; }
};

const updateText = (id, val) => { const el = document.getElementById(id); if(el) el.innerText = val; };

function getRankName(r) {
    const ranks = ["Beginner", "Bronze", "Silver", "Gold", "Diamond"];
    return ranks[r] || "Beginner";
}

function updateNavbar(addr) {
    const btn = document.getElementById('connect-btn');
    if(btn) btn.innerText = addr.substring(0,6) + "..." + addr.substring(38);
}

function showLogoutIcon(address) {
    const btn = document.getElementById('connect-btn');
    const logout = document.getElementById('logout-icon-btn');
    if (btn) btn.innerText = address.substring(0, 6) + "..." + address.substring(38);
    if (logout) { logout.style.display = 'flex'; }
}

if (window.ethereum) {
    window.ethereum.on('accountsChanged', () => {
        localStorage.removeItem('manualLogout');
        location.reload();
    });
    window.ethereum.on('chainChanged', () => location.reload());
}

window.addEventListener('load', init);
