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
            window.updatePendingRewardsUI();
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
        
        // Check registration status via contract function
        const registered = await contract.isUserExists(userAddress);
        
        if (registered) {
            showLogoutIcon(userAddress);
            window.location.href = "index1.html";
        } else {
            alert("This wallet is not registered in Bnexora!");
            window.location.href = "register.html";
        }
    } catch (err) {
        console.error("Login Error:", err);
        alert("Login failed! Ensure you are on BSC Testnet.");
    }
}
window.handleRegister = async function() {
    try {
        if (!window.ethereum) {
            alert("MetaMask or Trust Wallet not found!");
            return;
        }

        // Initialize Provider and Contracts
        const tempProvider = new ethers.providers.Web3Provider(window.ethereum);
        await tempProvider.send("eth_requestAccounts", []);
        signer = tempProvider.getSigner();
        
        // Bnexora aur USDT Contract instances
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        const usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);
        
        const userAddress = await signer.getAddress();
        const refField = document.getElementById('reg-referrer');
        const referrerId = refField ? refField.value.trim() : "";

        // 1. Validation: Referrer ID empty nahi honi chahiye
        if (!referrerId || isNaN(referrerId)) {
            alert("Please enter a valid Referrer ID (Number)");
            return;
        }

        // 2. Amount Update: Ab registration 10 USDT se hogi
        const regAmount = ethers.utils.parseUnits("10", 18);

        const btn = document.getElementById('reg-btn');
        if(btn) {
            btn.disabled = true;
            btn.innerText = "PROCESSING...";
        }

        // 3. USDT Allowance Check
        const allowance = await usdtContract.allowance(userAddress, CONTRACT_ADDRESS);
        if (allowance.lt(regAmount)) {
            if(btn) btn.innerText = "APPROVE 10 USDT...";
            
            // Gas estimation for Approval
            const estApproveGas = await usdtContract.estimateGas.approve(CONTRACT_ADDRESS, ethers.constants.MaxUint256);
            
            const approveTx = await usdtContract.approve(CONTRACT_ADDRESS, ethers.constants.MaxUint256, {
                gasLimit: estApproveGas.mul(130).div(100) 
            });
            await approveTx.wait();
        }

        // 4. Registration via registrationExt (As per your latest Bnexora contract)
        if(btn) btn.innerText = "ESTIMATING GAS...";

        try {
            // Function name registrationExt use kiya hai jo Referrer ID leta hai
            const estimatedGas = await contract.estimateGas.registrationExt(referrerId);
            const gasLimitWithBuffer = estimatedGas.mul(130).div(100); 
            
            console.log("Estimated Gas:", estimatedGas.toString());

            if(btn) btn.innerText = "CONFIRM IN WALLET...";

            const tx = await contract.registrationExt(referrerId, {
                gasLimit: gasLimitWithBuffer
            });

            alert("Transaction sent! Waiting for confirmation...");
            const receipt = await tx.wait();

            if (receipt.status === 1) {
                alert("Registration Successful with 10 USDT Package!");
                localStorage.removeItem('manualLogout');
                window.location.href = "index1.html";
            }
        } catch (gasErr) {
            console.error("Gas Estimation Failed:", gasErr);
            throw new Error("Transaction would fail. Check if you have 10 USDT + BNB for gas, or if you are already registered.");
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
async function fetchAllData(address) {
    try {
        const userId = await contract.addressToId(address);
        if (userId.isZero()) return;

        // Fetch user summary via getUserDetails helper
        const d = await contract.getUserDetails(userId);
        
        updateText('user-id-display', "ID: " + userId.toString());
        updateText('referrer-id-display', "Ref ID: " + d.referrerId.toString());
        updateText('total-income-display', format(d.totalIncome));
        updateText('partners-count', d.partnersCount.toString());
        updateText('team-size', d.teamSize.toString());
        updateText('rank-display', getRankName(d.rank));

        // Referral Link Generator (Using User ID)
        const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '');
        const refUrl = `${baseUrl}/register.html?ref=${userId.toString()}`;
        if (document.getElementById('refURL')) {
            document.getElementById('refURL').value = refUrl;
        }

        // Active Slots Highlight (Level 1 to 12)
        for(let i = 1; i <= 12; i++) {
            const isActive = await contract.isUserSlotActive(userId, i);
            const slotCard = document.getElementById(`slot-card-${i}`);
            if(slotCard && isActive) slotCard.classList.remove('slot-locked');
        }

    } catch (e) {
        console.error("Data Load Error:", e);
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
        
        const userData = await contract.users(address);
        const isRegistered = userData.id.gt(0);
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
    } else {
        console.log("Page specific init function not found - Skipping");
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
        if (!activeContract) {
            console.error("Contract not initialized");
            return [];
        }

        console.log("Fetching history for:", userAddress);
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
            } catch (innerErr) {
                console.warn("Record mapping error at index", index, innerErr);
                return null;
            }
        }).filter(item => item !== null);

        return formattedHistory.sort((a, b) => b.time - a.time);
        
    } catch (e) {
        console.error("Critical Web3 Handler History Error:", e);
        return [];
    }
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

// --- TREE & MATRIX ---
window.loadTreeData = async function(level) {
    const userAddr = await signer.getAddress();
    // stats: currentReferrer, reinvestCount, heldTokenForUpgrade, lastSpill, totalTeam, totalEarning
    const stats = await contract.usersXMatrix(userAddr, level);
    const referrals = await contract.usersXMatrixReferrals(userAddr, level);
    
    updateText('slot-id-header', "Level " + level);
    updateText('cycle-display', "Cycles: " + stats.reinvestCount.toString());
    updateText('slot-earnings', format(stats.totalEarning));

    // nodes mapping (Exactly 14 spots)
    const nodeCircles = document.querySelectorAll('.node-circle');
    nodeCircles.forEach((circle, index) => {
        circle.classList.remove('node-filled');
        // referrals array index matches the node position
        if (referrals[index] && referrals[index] !== ethers.constants.AddressZero) {
            circle.classList.add('node-filled');
            circle.innerText = (index + 1);
        } else {
            circle.innerText = "";
        }
    });
};

// --- UTILS ---
const format = (val) => {
    try { 
        if (!val) return "0.0000"; 
        return parseFloat(ethers.utils.formatUnits(val, 18)).toFixed(4);
    } catch (e) { return "0.0000"; }
};

const updateText = (id, val) => { const el = document.getElementById(id); if(el) el.innerText = val; };

function updateNavbar(addr) {
    const btn = document.getElementById('connect-btn');
    if(btn) btn.innerText = addr.substring(0,6) + "..." + addr.substring(38);
}

if (window.ethereum) {
    window.ethereum.on('accountsChanged', () => {
        localStorage.removeItem('manualLogout');
        location.reload();
    });
    window.ethereum.on('chainChanged', () => location.reload());
}

window.addEventListener('load', init);
