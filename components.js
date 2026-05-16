document.addEventListener("DOMContentLoaded", async function () {
    // 1. Auth Page Check
    const isAuthPage = document.getElementById('auth-page') || 
                       window.location.pathname.includes('register.html') || 
                       window.location.pathname.includes('login.html');

    // 2. Inject Dots Background Matrix
    const dotsHTML = `<div class="dots-container"><div class="dots dots-white"></div><div class="dots dots-cyan"></div></div>`;
    document.body.insertAdjacentHTML('afterbegin', dotsHTML);

    if (isAuthPage) return;

    // 3. Check Wallet Session Status
    let walletAddress = "";
    let isConnected = false;
    if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
            walletAddress = accounts[0];
            isConnected = true;
        }
    }

    // --- PREMIUM B-NEXORA LOGO IMAGE COMPONENT ---
    const premiumNexoraLogo = `
        <img src="logo/bnexora-logo.png" 
             alt="B-Nexora Logo" 
             class="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(235,30,140,0.6)] animate-pulse"
             onerror="this.onerror=null; this.src='https://api.dicebear.com/7.x/identicon/svg?seed=Bnexora';">
    `;

    // 4. Inject Premium Global Desktop Navbar
    const navHTML = `
        <nav class="max-w-7xl mx-auto px-4 md:px-6 py-6 flex justify-between items-center relative z-[100]">
            <div class="flex items-center gap-2 md:gap-4 cursor-pointer group" onclick="location.href='index1.html'">
                <div class="relative w-12 h-12 md:w-14 md:h-14 flex items-center justify-center">
                    <div class="absolute inset-0 bg-pink-500/20 blur-xl group-hover:bg-purple-500/40 transition-all duration-500"></div>
                    <div class="z-10 transform group-hover:scale-110 transition-transform duration-500 w-full h-full flex items-center justify-center p-1">
                        ${premiumNexoraLogo}
                    </div>
                </div>
                <div class="flex flex-col">
                    <span class="text-xl md:text-2xl font-black tracking-tighter uppercase italic leading-none text-white">
                        B-<span class="bg-gradient-to-r from-pink-500 via-purple-400 to-indigo-500 bg-clip-text text-transparent">Nexora</span>
                    </span>
                    <span class="text-[7px] md:text-[8px] text-purple-400 tracking-[0.3em] font-extrabold uppercase mt-1">Smart Matrix Protocol</span>
                </div>
            </div>
            
            <div class="hidden md:flex bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-1 shadow-2xl">
                <button class="nav-btn-new" onclick="location.href='index1.html'">Dashboard</button>
                <button class="nav-btn-new" onclick="location.href='deposits.html'">Matrix View</button>
                <button class="nav-btn-new" onclick="location.href='referral.html'">Directs</button>
                <button class="nav-btn-new" onclick="location.href='leadership.html'">Network</button>
                <button class="nav-btn-new" onclick="location.href='history.html'">Ledger History</button>
            </div>
            
            <div class="relative flex flex-col items-center">
                <button id="connect-btn" onclick="handleLogin()" class="new-cyber-btn">
                    <span>${isConnected ? walletAddress.substring(0, 6) + "..." + walletAddress.substring(38) : "Connect"}</span>
                </button>
                
                <button id="logout-icon-btn" onclick="handleLogout()" 
                    style="display: ${isConnected ? 'flex' : 'none'}; position: absolute; top: 100%; margin-top: 6px;" 
                    class="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-500 transition-all cursor-pointer items-center justify-center shadow-lg">
                    <i data-lucide="power" class="w-3.5 h-3.5"></i>
                </button>
            </div>
        </nav>

        <style>
            .nav-btn-new { color: #cbd5e1; font-size: 11px; font-weight: 800; padding: 10px 20px; border-radius: 12px; transition: 0.3s; text-transform: uppercase; letter-spacing: 0.5px; }
            .nav-btn-new:hover { color: white; background: rgba(255,255,255,0.08); text-shadow: 0 0 10px rgba(235,30,140,0.6); }
            .new-cyber-btn { background: linear-gradient(135deg, #eb1e8c 0%, #9d34da 100%); color: white; font-weight: 900; padding: 10px 20px; border-radius: 12px; transition: 0.3s; border: 1px solid rgba(255,255,255,0.2); cursor: pointer; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(235,30,140,0.2); }
            @media (min-width: 768px) {
                .new-cyber-btn { padding: 12px 24px; font-size: 12px; }
            }
            .new-cyber-btn:hover { transform: translateY(-2px); box-shadow: 0 0 20px rgba(235,30,140,0.5); }
        </style>
    `;
    document.body.insertAdjacentHTML('afterbegin', navHTML);

    // 5. Inject Luxury Floating Mobile Navigation Bar
    const mobileNavHTML = `
        <div class="fixed bottom-6 left-3 right-3 md:hidden z-[9999]">
            <div class="bg-[#0f021c]/95 backdrop-blur-3xl border border-white/10 rounded-[2.2rem] flex justify-between items-center px-4 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.95)]">
                
                <a href="index1.html" class="flex flex-col items-center gap-1 transition-all duration-300 w-12 ${window.location.pathname.includes('index1.html') ? 'text-pink-500 drop-shadow-[0_0_8px_#eb1e8c]' : 'text-gray-500'}">
                    <i data-lucide="layout-dashboard" class="w-5 h-5"></i>
                    <span class="text-[8px] font-extrabold uppercase tracking-wider">Home</span>
                </a>
                
                <a href="deposits.html" class="flex flex-col items-center gap-1 transition-all duration-300 w-12 ${window.location.pathname.includes('deposits.html') ? 'text-pink-500 drop-shadow-[0_0_8px_#eb1e8c]' : 'text-gray-500'}">
                    <i data-lucide="network" class="w-5 h-5"></i>
                    <span class="text-[8px] font-extrabold uppercase tracking-wider">Matrix</span>
                </a>

                <!-- Centered Interactive Core Navigation Module -->
                <div class="relative -top-7 flex flex-col items-center">
                    <a href="leadership.html" class="relative group">
                        <div class="absolute inset-0 bg-gradient-to-tr from-pink-500 to-purple-600 blur-xl opacity-60 group-hover:opacity-100 transition-opacity rounded-full"></div>
                        <div class="relative w-15 h-15 bg-gradient-to-tr from-[#16022b] to-[#32065c] rounded-full flex items-center justify-center border-4 border-[#0d0118] shadow-[0_8px_25px_rgba(235,30,140,0.4)] p-2.5">
                            ${premiumNexoraLogo}
                        </div>
                        <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[7px] font-black px-2.5 py-0.5 rounded-full border border-white/20 whitespace-nowrap uppercase tracking-wider scale-90">
                            Team
                        </div>
                    </a>
                </div>

                <a href="referral.html" class="flex flex-col items-center gap-1 transition-all duration-300 w-12 ${window.location.pathname.includes('referral.html') ? 'text-pink-500 drop-shadow-[0_0_8px_#eb1e8c]' : 'text-gray-500'}">
                    <i data-lucide="users" class="w-5 h-5"></i>
                    <span class="text-[8px] font-extrabold uppercase tracking-wider">Directs</span>
                </a>
                
                <a href="history.html" class="flex flex-col items-center gap-1 transition-all duration-300 w-12 ${window.location.pathname.includes('history.html') ? 'text-pink-500 drop-shadow-[0_0_8px_#eb1e8c]' : 'text-gray-500'}">
                    <i data-lucide="history" class="w-5 h-5"></i>
                    <span class="text-[8px] font-extrabold uppercase tracking-wider">Ledger</span>
                </a>
            </div>
        </div>
    `;
    
    const oldMobileNav = document.querySelector('.fixed.bottom-6');
    if (oldMobileNav) oldMobileNav.remove();
    document.body.insertAdjacentHTML('beforeend', mobileNavHTML);

    // 6. Inject Luxury Pre-Rendered Footer 
    const footerHTML = `
        <footer class="py-16 text-center border-t border-white/5 relative z-10 mb-24 md:mb-0 bg-[#06000b]">
            <div class="flex flex-col items-center gap-3 mb-4">
                 <div class="w-12 h-12 opacity-90 flex items-center justify-center p-1">
                    ${premiumNexoraLogo}
                </div>
                <p class="font-black text-xl uppercase tracking-tight text-white">
                    B-<span class="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">Nexora</span>
                </p>
            </div>
            <p class="text-gray-600 text-[8px] md:text-[10px] tracking-[0.4em] md:tracking-[0.6em] uppercase font-bold">Decentralized Autonomous Matrix Initiative © 2026</p>
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
