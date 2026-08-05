/**
 * BA Cafe - Client Side Application Logic
 * Ported from React to Vanilla JS
 */

// --- Configuration ---
// These should ideally be set via your build process or a config file.
// For now, they are placeholders you'll need to fill.
const CONFIG = {
    SUPABASE_URL: 'https://nzantxodqsdyxmtbaqik.supabase.co', // Add your Supabase URL
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56YW50eG9kcXNkeXhtdGJhcWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MzMxNDQsImV4cCI6MjEwMTUwOTE0NH0.L0sJCQOKYH_KpkPz6cNz2xg20cVNmhncS-5WKnprkJs', // Add your Supabase Anon Key
    ONESIGNAL_APP_ID: '049fc06c-108f-4836-8c2d-9c07ecbfd7fd', // Add your OneSignal App ID
};

// --- Application State ---
let state = {
    session: null,
    activeTab: localStorage.getItem('last_active_tab') || 'timer',
    timerHistory: [],
    calendarHistory: [],
    calendarDate: new Date(),
    relationshipHistory: [],
    ticket1Time: null,
    ticket2Time: null,
    isSyncing: false,
    isDataLoaded: false,
    isAuthChecking: true,
};

// --- Supabase Initialization ---
const supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// --- API Service ---
const api = {
    async fetchRelationshipHistory() {
        if (!state.session) return;
        try {
            const res = await fetch('/api/relationship', {
                headers: { 'Authorization': `Bearer ${state.session.access_token}` }
            });
            const data = await res.json();
            state.relationshipHistory = Array.isArray(data) ? data : [];
        } catch (e) { console.error('Fetch Relationship Error:', e); }
    },

    async saveRelationship(level, date, charKey) {
        if (!state.session || state.isSyncing) return;
        state.isSyncing = true;
        updateUI();
        try {
            const res = await fetch('/api/relationship', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.session.access_token}`
                },
                body: JSON.stringify({ char_key: charKey, bond_level: level, recorded_at: date })
            });

            if (!res.ok) {
                const errorData = await res.json();
                alert(errorData.error || "登録に失敗しました。");
                return;
            }

            await this.fetchRelationshipHistory();
        } catch (e) {
            console.error('Save Relationship Error:', e);
        } finally {
            state.isSyncing = false;
            updateUI();
        }
    },

    async postTap(payload) {
        if (!state.session || state.isSyncing) return;
        state.isSyncing = true;
        updateUI();
        try {
            const res = await fetch('/api/tap', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.session.access_token}`
                },
                body: JSON.stringify(payload)
            });
            return await res.json();
        } catch (e) {
            console.error('Tap API Error:', e);
        } finally {
            state.isSyncing = false;
            updateUI();
        }
    }
};

// --- UI Components & Rendering ---
const components = {
    renderTimer() {
        const lastTap = state.timerHistory.length ? new Date(state.timerHistory[state.timerHistory.length-1]) : null;
        return `
            <div class="p-4 flex flex-col gap-6 animate-in fade-in duration-300">
                <div class="timer-card p-6 rounded-2xl border bg-card shadow-sm text-center">
                    <h2 class="text-lg font-bold mb-4 opacity-70">Next Coffee In</h2>
                    <div class="text-5xl font-black mb-2 tracking-tighter" id="countdown-display">
                        ${this.calculateCountdown(lastTap)}
                    </div>
                    <p class="text-sm text-muted-foreground">Last tap: ${lastTap ? lastTap.toLocaleTimeString() : 'Never'}</p>
                </div>

                <div class="grid grid-cols-1 gap-4">
                    <button id="tap-button" class="btn-timer w-full py-8 rounded-3xl bg-primary text-primary-foreground font-black text-2xl shadow-xl active:scale-95 transition-all ${state.isSyncing ? 'opacity-50 pointer-events-none' : ''}">
                        TAP TO RECORD
                    </button>

                    <div class="grid grid-cols-2 gap-4">
                        <button id="invite-1" class="p-4 rounded-2xl border bg-card hover:bg-muted transition-colors text-sm font-bold">
                            INVITE #1<br><span class="text-xs opacity-50 font-normal">${state.ticket1Time ? new Date(state.ticket1Time).toLocaleTimeString() : 'Ready'}</span>
                        </button>
                        <button id="invite-2" class="p-4 rounded-2xl border bg-card hover:bg-muted transition-colors text-sm font-bold">
                            INVITE #2<br><span class="text-xs opacity-50 font-normal">${state.ticket2Time ? new Date(state.ticket2Time).toLocaleTimeString() : 'Ready'}</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    calculateCountdown(lastTap) {
        if (!lastTap) return "READY";
        const now = new Date();
        const diff = now - lastTap;
        const threeHours = 3 * 60 * 60 * 1000;
        if (diff >= threeHours) return "READY";

        const remaining = threeHours - diff;
        const h = Math.floor(remaining / 3600000);
        const m = Math.floor((remaining % 3600000) / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    },

    renderHistory() {
        return `
            <div class="p-4 animate-in fade-in duration-300">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-black">${state.calendarDate.getFullYear()} / ${state.calendarDate.getMonth() + 1}</h2>
                </div>
                <div class="timer-card p-4 rounded-2xl border">
                    <p class="text-center text-muted-foreground py-10">Calendar UI Port in Progress...</p>
                </div>
            </div>
        `;
    },

    renderBond() {
        return `
            <div class="p-4 animate-in fade-in duration-300">
                <h2 class="text-2xl font-black mb-6">Bond History</h2>
                <div class="space-y-4">
                    ${state.relationshipHistory.map(item => `
                        <div class="p-4 rounded-xl border bg-card flex justify-between items-center">
                            <div>
                                <div class="font-bold">${item.char_key}</div>
                                <div class="text-xs text-muted-foreground">${new Date(item.recorded_at).toLocaleDateString()}</div>
                            </div>
                            <div class="text-xl font-black text-primary">RANK ${item.bond_level}</div>
                        </div>
                    `).join('')}
                    ${state.relationshipHistory.length === 0 ? '<p class="text-center py-10 opacity-50">No records found</p>' : ''}
                </div>
            </div>
        `;
    }
};

// --- App Control Logic ---
function updateUI() {
    const authView = document.getElementById('auth-view');
    const mainView = document.getElementById('main-view');
    const loadingOverlay = document.getElementById('loading-overlay');
    const tabContent = document.getElementById('tab-content');

    // Handle Loading State
    if (state.isAuthChecking || (state.session && !state.isDataLoaded)) {
        loadingOverlay.classList.remove('hidden');
        return;
    }
    loadingOverlay.classList.add('hidden');

    // Handle View Switching
    if (!state.session) {
        authView.classList.remove('hidden');
        mainView.classList.add('hidden');
    } else {
        authView.classList.add('hidden');
        mainView.classList.remove('hidden');

        // Update active tab button style
        document.querySelectorAll('.btn-nav').forEach(btn => {
            if (btn.dataset.tab === state.activeTab) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Render Tab Content
        if (state.activeTab === 'timer') tabContent.innerHTML = components.renderTimer();
        if (state.activeTab === 'history') tabContent.innerHTML = components.renderHistory();
        if (state.activeTab === 'bond') tabContent.innerHTML = components.renderBond();

        // Re-bind dynamic events (e.g., tap button)
        bindDynamicEvents();
    }
}

function bindDynamicEvents() {
    const tapBtn = document.getElementById('tap-button');
    if (tapBtn) {
        tapBtn.onclick = async () => {
            const now = new Date();
            const res = await api.postTap({ tapTime: now.toISOString() });
            if (res && res.success) {
                state.timerHistory.push(now.getTime());
                updateUI();
            } else if (res && res.error) {
                alert(res.error);
            }
        };
    }

    const invite1 = document.getElementById('invite-1');
    if (invite1) {
        invite1.onclick = async () => {
            const now = new Date();
            const res = await api.postTap({ ticket1Time: now.toISOString() });
            if (res && res.success) {
                state.ticket1Time = now;
                updateUI();
            }
        };
    }

    const invite2 = document.getElementById('invite-2');
    if (invite2) {
        invite2.onclick = async () => {
            const now = new Date();
            const res = await api.postTap({ ticket2Time: now.toISOString() });
            if (res && res.success) {
                state.ticket2Time = now;
                updateUI();
            }
        };
    }
}

async function loadInitialData() {
    if (!state.session) return;
    try {
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('ticket1_time, ticket2_time')
            .eq('id', state.session.user.id)
            .single();

        if (profile) {
            state.ticket1Time = profile.ticket1_time ? new Date(profile.ticket1_time) : null;
            state.ticket2Time = profile.ticket2_time ? new Date(profile.ticket2_time) : null;
        }

        await api.fetchRelationshipHistory();

        state.isDataLoaded = true;
        updateUI();
    } catch (e) {
        console.error('Load Initial Data Error:', e);
    } finally {
        state.isAuthChecking = false;
        updateUI();
    }
}

// --- Initialization ---
function init() {
    // Auth Change Listener
    supabaseClient.auth.onAuthStateChange((event, session) => {
        state.session = session;
        if (session) {
            loadInitialData();
        } else {
            state.isAuthChecking = false;
            state.isDataLoaded = false;
            updateUI();
        }
    });

    // Static Event Listeners
    document.getElementById('discord-login').onclick = () => {
        supabaseClient.auth.signInWithOAuth({
            provider: 'discord',
            options: { redirectTo: window.location.origin }
        });
    };

    document.getElementById('logout-btn').onclick = () => {
        supabaseClient.auth.signOut();
        document.getElementById('side-panel').classList.add('hidden');
    };

    document.querySelectorAll('.btn-nav').forEach(btn => {
        btn.onclick = () => {
            state.activeTab = btn.dataset.tab;
            localStorage.setItem('last_active_tab', state.activeTab);
            updateUI();
        };
    });

    document.getElementById('menu-toggle').onclick = () => {
        const panel = document.getElementById('side-panel');
        const content = document.getElementById('side-panel-content');
        panel.classList.remove('hidden');
        setTimeout(() => content.classList.remove('translate-x-full'), 10);
    };

    document.getElementById('side-panel-backdrop').onclick = () => {
        const content = document.getElementById('side-panel-content');
        content.classList.add('translate-x-full');
        setTimeout(() => document.getElementById('side-panel').classList.add('hidden'), 300);
    };

    // Countdown Timer Refresh
    setInterval(() => {
        if (state.activeTab === 'timer' && state.session) {
            const display = document.getElementById('countdown-display');
            if (display) {
                const lastTap = state.timerHistory.length ? new Date(state.timerHistory[state.timerHistory.length-1]) : null;
                display.innerText = components.calculateCountdown(lastTap);
            }
        }
    }, 1000);

    updateUI();
}

document.addEventListener('DOMContentLoaded', init);
