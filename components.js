document.addEventListener("DOMContentLoaded", async function () {
    // 1. Auth Page Check
    const isAuthPage = document.getElementById('auth-page') || 
                       window.location.pathname.includes('register.html') || 
                       window.location.pathname.includes('login.html');

    // 2. Inject Dots Background
    const dotsHTML = `<div class="dots-container"><div class="dots dots-white"></div><div class="dots dots-cyan"></div></div>`;
    document.body.insertAdjacentHTML('afterbegin', dotsHTML);

    if (isAuthPage) return;

    // 3. Check Wallet Status
    let walletAddress = "";
    let isConnected = false;
    if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
            walletAddress = accounts[0];
            isConnected = true;
        }
    }

    // --- UPDATED: PREMIUM LOGO IMAGE (Replacing SVG) ---
    const premiumFalconSVG = `
        <img src="logo/logo1.png" 
             alt="Silver Falcon" 
             class="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
    `;

    // 4. Inject Navbar (Desktop & Mobile)
    const navHTML = `
        <nav class="max-w-7xl mx-auto px-4 md:px-6 py-6 flex justify-between items-center relative z-[100]">
            <div class="flex items-center gap-2 md:gap-4 cursor-pointer group" onclick="location.href='index1.html'">
                <div class="relative w-12 h-12 md:w-16 md:h-16 flex items-center justify-center">
                    <div class="absolute inset-0 bg-cyan-500/20 blur-xl group-hover:bg-cyan-500/40 transition-all"></div>
                    <!-- Logo Container adjusted for Image -->
                    <div class="z-10 transform group-hover:scale-110 transition-transform duration-500 w-full h-full flex items-center justify-center">
                        ${premiumFalconSVG}
                    </div>
                </div>
                <div class="flex flex-col">
                    <span class="text-lg md:text-2xl font-black orbitron tracking-tighter uppercase italic leading-none text-white">
                        Silver <span class="bg-gradient-to-r from-cyan-400 via-white to-blue-500 bg-clip-text text-transparent">Falcon</span>
                    </span>
                    <span class="text-[7px] md:text-[9px] text-cyan-400 tracking-[0.2em] md:tracking-[0.4em] font-bold uppercase mt-1">DeFi Protocol</span>
                </div>
            </div>
            
            <div class="hidden md:flex bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-1 shadow-2xl">
                <button class="nav-btn-new" onclick="location.href='index1.html'">Dashboard</button>
                <button class="nav-btn-new" onclick="location.href='deposits.html'">Position</button>
                <button class="nav-btn-new" onclick="location.href='referral.html'">Referral</button>
                <button class="nav-btn-new" onclick="location.href='leadership.html'">Leadership</button>
                <button class="nav-btn-new" onclick="location.href='history.html'">History</button>
            </div>
            
            <div class="relative flex flex-col items-center">
                <button id="connect-btn" onclick="handleLogin()" class="new-cyber-btn">
                    <span>${isConnected ? walletAddress.substring(0, 4) + "..." + walletAddress.substring(38) : "Connect"}</span>
                </button>
                
                <button id="logout-icon-btn" onclick="handleLogout()" 
                    style="display: ${isConnected ? 'flex' : 'none'}; position: absolute; top: 100%; margin-top: 4px;" 
                    class="p-1 text-red-500 hover:text-red-400 transition-all cursor-pointer items-center justify-center">
                    <i data-lucide="power" class="w-3 h-3"></i>
                </button>
            </div>
        </nav>

        <style>
            .nav-btn-new { color: #cbd5e1; font-size: 11px; font-weight: 800; padding: 8px 16px; border-radius: 10px; transition: 0.3s; font-family: 'Orbitron', sans-serif; text-transform: uppercase; }
            .nav-btn-new:hover { color: white; background: rgba(255,255,255,0.15); }
            .new-cyber-btn { background: white; color: black; font-weight: 900; font-family: 'Orbitron'; padding: 8px 16px; border-radius: 6px; clip-path: polygon(10% 0, 100% 0, 90% 100%, 0 100%); transition: 0.3s; border: none; cursor: pointer; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
            @media (min-width: 768px) {
                .new-cyber-btn { padding: 12px 24px; border-radius: 10px; font-size: 12px; letter-spacing: 1px; }
            }
            .new-cyber-btn:hover { transform: translateY(-2px); box-shadow: 0 0 15px rgba(255,255,255,0.4); }
        </style>
    `;
    document.body.insertAdjacentHTML('afterbegin', navHTML);

    // 5. Inject Premium Floating Mobile Navigation - WITH CENTER REFERRAL
    const mobileNavHTML = `
        <div class="fixed bottom-6 left-4 right-4 md:hidden z-[9999]">
            <div class="bg-black/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] flex justify-between items-center px-6 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
                <a href="index1.html" class="flex flex-col items-center gap-1 transition-all ${window.location.pathname.includes('index1.html') ? 'text-cyan-400' : 'text-gray-500'}">
                    <i data-lucide="layout-dashboard" class="w-5 h-5"></i>
                    <span class="text-[7px] font-bold orbitron uppercase">Home</span>
                </a>
                <a href="deposits.html" class="flex flex-col items-center gap-1 transition-all ${window.location.pathname.includes('deposits.html') ? 'text-cyan-400' : 'text-gray-500'}">
                    <i data-lucide="gem" class="w-5 h-5"></i>
                    <span class="text-[7px] font-bold orbitron uppercase">Position</span>
                </a>

                <div class="relative -top-10 flex flex-col items-center">
                    <a href="referral.html" class="relative group">
                        <div class="absolute inset-0 bg-cyan-500 blur-2xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
                        <!-- Centered Mobile Logo -->
                        <div class="relative w-16 h-16 bg-gradient-to-tr from-white via-gray-100 to-gray-400 rounded-full flex items-center justify-center border-4 border-[#050505] shadow-2xl p-3">
                            ${premiumFalconSVG}
                        </div>
                        <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-cyan-500 text-black text-[7px] font-black orbitron px-2 py-0.5 rounded-full border-2 border-[#050505] whitespace-nowrap uppercase">
                            Invite
                        </div>
                    </a>
                </div>

                <a href="leadership.html" class="flex flex-col items-center gap-1 transition-all ${window.location.pathname.includes('leadership.html') ? 'text-cyan-400' : 'text-gray-500'}">
                    <i data-lucide="award" class="w-5 h-5"></i>
                    <span class="text-[7px] font-bold orbitron uppercase">Rank</span>
                </a>
                <a href="history.html" class="flex flex-col items-center gap-1 transition-all ${window.location.pathname.includes('history.html') ? 'text-cyan-400' : 'text-gray-500'}">
                    <i data-lucide="history" class="w-5 h-5"></i>
                    <span class="text-[7px] font-bold orbitron uppercase">History</span>
                </a>
            </div>
        </div>
    `;
    const oldMobileNav = document.querySelector('.fixed.bottom-6');
    if (oldMobileNav) oldMobileNav.remove();
    document.body.insertAdjacentHTML('beforeend', mobileNavHTML);

    // 6. Inject Luxury Footer
    const footerHTML = `
        <footer class="py-20 text-center border-t border-white/5 relative z-10 mb-28 md:mb-0 bg-black">
            <div class="flex flex-col items-center gap-4 mb-4">
                 <div class="w-12 h-12 opacity-80 flex items-center justify-center">
                    ${premiumFalconSVG}
                </div>
                <p class="orbitron font-black text-2xl italic uppercase tracking-tighter text-white">
                    Silver <span class="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Falcon</span>
                </p>
            </div>
            <p class="text-gray-600 text-[8px] md:text-[10px] tracking-[0.5em] md:tracking-[1em] uppercase">Decentralized Falcon Initiative © 2026</p>
        </footer>
    `;
    
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
        footerPlaceholder.innerHTML = footerHTML;
    } else {
        document.body.insertAdjacentHTML('beforeend', footerHTML);
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
});
