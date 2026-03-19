const SUPABASE_URL = 'https://ycxebqmolvjdaiyedodk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_3W1-V3P00bk6LCl-bk2gGw_4N2gkOiI';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const tg = window.Telegram.WebApp;
const userId = tg.initDataUnsafe.user?.id || 12345; // 12345 untuk testing browser

async function initApp() {
    try {
        document.getElementById('status-load').innerText = "Mengambil Data User...";
        
        // 1. Ambil/Daftarkan User
        let { data: user, error } = await supabase.from('users').select('*').eq('user_id', userId).single();
        
        if (!user) {
            // Register user baru jika tidak ada
            await supabase.from('users').insert([{ user_id: userId, username: tg.initDataUnsafe.user?.username }]);
            // Buat 10 Miner default (Locked)
            const initialMiners = 'ABCDEFGHIJ'.split('').map(m => ({
                user_id: userId, miner_id: m, level: 0, is_unlocked: m === 'A'
            }));
            await supabase.from('user_miners').insert(initialMiners);
        }

        // 2. Hitung Cloud Mining (Offline Earning)
        await calculateOfflineEarning(user);

        // 3. Render Dashboard
        renderVGA();
        
        // 4. Tutup Splash Screen
        setTimeout(() => {
            document.getElementById('splash-screen').style.display = 'none';
        }, 1000);

    } catch (e) {
        document.getElementById('status-load').innerText = "Koneksi Gagal. Cek Sinyal!";
    }
}

async function calculateOfflineEarning(user) {
    if (!user) return;
    const now = new Date();
    const lastSync = new Date(user.last_sync);
    const diffSec = Math.floor((now - lastSync) / 1000);
    
    // Logika 1.8 Menit per 1 Energi
    const recoveredEnergy = Math.floor(diffSec / 108);
    const newEnergy = Math.min(100, (user.energy || 0) + recoveredEnergy);
    
    await supabase.from('users').update({ 
        energy: newEnergy, 
        last_sync: now.toISOString() 
    }).eq('user_id', userId);
}

function switchPage(pageId, el) {
    document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    el.classList.add('active');
    tg.HapticFeedback.impactOccurred('light');
}

// Jalankan aplikasi
initApp();
