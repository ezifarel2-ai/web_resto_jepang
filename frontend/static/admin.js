/**
 * SAVORIA ADMIN & RESTAURANT OPS PORTAL
 * Logic Controller for /admin
 */

let allAdminFoods = [];
let allAdminOrders = [];
let currentCategoryFilter = 'all';
let currentKitchenOrderFilter = 'all';

// Toast Notification
function showAdminToast(msg, isSuccess = true) {
    const container = document.getElementById('adminToastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.borderColor = isSuccess ? '#10b981' : '#ef4444';
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

// Format Rupiah
function formatRupiah(amount) {
    return 'Rp ' + Number(amount || 0).toLocaleString('id-ID');
}

// Clock
function updateAdminClock() {
    const el = document.getElementById('liveClockAdmin');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
}
setInterval(updateAdminClock, 1000);
updateAdminClock();

// Load Overall Stats
async function loadAdminStats() {
    try {
        const [ordersRes, foodsRes] = await Promise.all([
            fetch('/api/orders/stats'),
            fetch('/api/foods?include_unavailable=true')
        ]);

        if (ordersRes.ok) {
            const stats = await ordersRes.json();
            const elPending = document.getElementById('statPendingOrders');
            const elUnpaid = document.getElementById('statUnpaidOrders');
            const elRevenue = document.getElementById('statRevenuePaid');
            if (elPending) elPending.textContent = stats.pending_orders || 0;
            if (elUnpaid) elUnpaid.textContent = stats.unpaid_orders || 0;
            if (elRevenue) elRevenue.textContent = formatRupiah(stats.paid_revenue || 0);
        }

        if (foodsRes.ok) {
            const foods = await foodsRes.json();
            allAdminFoods = foods;
            const activeCount = foods.filter(f => f.is_available).length;
            const soldOutCount = foods.filter(f => !f.is_available).length;
            const elActive = document.getElementById('statActiveFoods');
            const elSoldOut = document.getElementById('statSoldOutFoods');
            if (elActive) elActive.textContent = activeCount;
            if (elSoldOut) elSoldOut.textContent = soldOutCount;
        }
    } catch (e) {
        console.error('Error loadAdminStats:', e);
    }
}

// Load Foods List
async function loadAdminFoods() {
    try {
        const res = await fetch('/api/foods?include_unavailable=true');
        if (!res.ok) throw new Error('Gagal memuat katalog menu');
        allAdminFoods = await res.json();
        renderAdminFoods();
    } catch (e) {
        console.error(e);
        const container = document.getElementById('adminFoodsContainer');
        if (container) container.innerHTML = `<div style="color: #ef4444; padding: 20px; text-align: center;">⚠️ Gagal memuat data menu: ${e.message}</div>`;
    }
}

// Render Foods List
function renderAdminFoods() {
    const container = document.getElementById('adminFoodsContainer');
    if (!container) return;

    const query = (document.getElementById('adminFoodSearch')?.value || '').toLowerCase().trim();

    const filtered = allAdminFoods.filter(f => {
        const matchCat = currentCategoryFilter === 'all' || f.category === currentCategoryFilter;
        const matchQuery = !query || 
            (f.name && f.name.toLowerCase().includes(query)) ||
            (f.japanese_name && f.japanese_name.toLowerCase().includes(query)) ||
            (f.category && f.category.toLowerCase().includes(query));
        return matchCat && matchQuery;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                Tidak ada menu yang sesuai dengan filter.
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(food => {
        const fallbackImg = "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=300";
        const imgSrc = food.image_url || fallbackImg;
        const isAvail = food.is_available;
        const availClass = isAvail ? 'active' : 'soldout';
        const availText = isAvail ? '✅ Tersedia' : '❌ Sold Out';
        const nextState = !isAvail;

        return `
            <div class="admin-food-card" id="foodCard-${food.id}">
                <div class="food-thumb-info">
                    <img src="${imgSrc}" alt="${food.name}" class="food-thumb-img" onerror="this.src='${fallbackImg}'">
                    <div>
                        <div class="food-name-title">
                            <span>${food.name}</span>
                            ${food.japanese_name ? `<span class="food-jp-sub">(${food.japanese_name})</span>` : ''}
                        </div>
                        <div class="food-meta-row">
                            <span class="food-cat-badge">${food.category}</span>
                            <span>•</span>
                            <span class="food-price-tag">${formatRupiah(food.price)}</span>
                            <span>•</span>
                            <span>⏱️ ${food.prep_time_min || 10} mnt</span>
                            ${food.is_halal ? '<span>• 🟢 Halal</span>' : ''}
                        </div>
                    </div>
                </div>

                <div class="food-actions-group">
                    <button class="btn-toggle-stock ${availClass}" onclick="toggleFoodAvailability(${food.id}, ${nextState})" title="Klik untuk ubah ketersediaan di menu tamu">
                        ${availText}
                    </button>
                    <button class="btn-del-item" onclick="deleteFoodRecord(${food.id}, '${food.name.replace(/'/g, "\\'")}')" title="Hapus menu dari database">
                        🗑️ Hapus
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Toggle Availability
async function toggleFoodAvailability(foodId, makeAvailable) {
    try {
        const res = await fetch(`/api/foods/${foodId}/availability`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_available: makeAvailable })
        });
        if (!res.ok) throw new Error('Gagal mengubah status ketersediaan');
        const updated = await res.json();
        
        const target = allAdminFoods.find(f => f.id === foodId);
        if (target) target.is_available = updated.is_available;
        renderAdminFoods();
        loadAdminStats();
        showAdminToast(`Stok "${target ? target.name : 'Menu'}" diubah menjadi: ${makeAvailable ? 'Tersedia' : 'Sold Out'}`);
    } catch (e) {
        alert(e.message);
    }
}

// Delete Food
async function deleteFoodRecord(foodId, foodName) {
    if (!confirm(`Hapus permanen menu "${foodName}" dari sistem?`)) return;
    try {
        const res = await fetch(`/api/foods/${foodId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Gagal menghapus menu');
        allAdminFoods = allAdminFoods.filter(f => f.id !== foodId);
        renderAdminFoods();
        loadAdminStats();
        showAdminToast(`Menu "${foodName}" berhasil dihapus.`);
    } catch (e) {
        alert(e.message);
    }
}

// Load Orders (for Kitchen & Cashier)
async function loadAdminOrders() {
    try {
        const res = await fetch('/api/orders');
        if (!res.ok) throw new Error('Gagal memuat pesanan');
        allAdminOrders = await res.json();
        renderKitchenOrders();
        renderCashierOrders();
    } catch (e) {
        console.error('Error loadAdminOrders:', e);
    }
}

// Render Kitchen Queue
function renderKitchenOrders() {
    const grid = document.getElementById('adminOrdersGrid');
    if (!grid) return;

    let filtered = allAdminOrders;
    if (currentKitchenOrderFilter === 'waiting') {
        filtered = allAdminOrders.filter(o => o.status === 'menunggu');
    }

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
                Tidak ada pesanan dapur pada filter ini.
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(order => {
        let statusBadge = `<span class="order-status-badge badge-${order.status}">${order.status}</span>`;
        if (order.status === 'menunggu_kasir') statusBadge = `<span class="order-status-badge badge-menunggu_kasir" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4);">⏳ Menunggu Scan Kasir</span>`;
        else if (order.status === 'menunggu') statusBadge = `<span class="order-status-badge badge-menunggu">⏳ Menunggu Dapur</span>`;
        else if (order.status === 'dimasak') statusBadge = `<span class="order-status-badge badge-dimasak">👨‍🍳 Dimasak</span>`;
        else if (order.status === 'selesai') statusBadge = `<span class="order-status-badge badge-selesai">✅ Selesai</span>`;
        else if (order.status === 'dibatalkan') statusBadge = `<span class="order-status-badge badge-dibatalkan">❌ Dibatalkan</span>`;

        const isDineIn = order.order_type === 'dine_in';
        const locationText = isDineIn ? `Meja ${order.table_number || '-'}` : 'Takeaway';

        const itemsHtml = (order.items || []).map(item => `
            <div class="order-item-line">
                <span><strong>${item.quantity}x</strong> ${item.food_name || item.name}</span>
                <span style="color: var(--gold);">${formatRupiah((item.price || 0) * (item.quantity || 1))}</span>
            </div>
        `).join('');

        let actionsHtml = '';
        if (order.status === 'menunggu_kasir') {
            actionsHtml = `
                <div style="width: 100%; text-align: center;">
                    <button class="btn-order-action" disabled style="width: 100%; background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px dashed rgba(245, 158, 11, 0.4); cursor: not-allowed; padding: 7px 10px; font-size: 0.78rem;">
                        ⚠️ Menunggu Scan di Kasir
                    </button>
                    <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 4px;">Koki baru mulai setelah pelanggan bayar/scan barcode</div>
                </div>
            `;
        } else if (order.status === 'menunggu') {
            actionsHtml = `
                <button class="btn-order-action btn-cook" onclick="changeOrderStatus('${order.order_id}', 'dimasak')">👨‍🍳 Mulai Masak</button>
                <button class="btn-order-action btn-cancel" onclick="changeOrderStatus('${order.order_id}', 'dibatalkan')">Batalkan</button>
            `;
        } else if (order.status === 'dimasak') {
            actionsHtml = `
                <button class="btn-order-action btn-done" onclick="changeOrderStatus('${order.order_id}', 'selesai')">✅ Selesai Sajikan</button>
                <button class="btn-order-action btn-cancel" onclick="changeOrderStatus('${order.order_id}', 'dibatalkan')">Batalkan</button>
            `;
        } else {
            actionsHtml = `<span style="font-size: 0.8rem; color: var(--text-muted); text-align: center; width: 100%;">Pesanan Ditutup</span>`;
        }

        return `
            <div class="order-card-admin">
                <div class="order-card-head">
                    <div>
                        <span class="order-id-label">${order.order_id}</span>
                        <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 2px;">
                            ${order.customer_name || 'Tamu'} • <strong style="color: #60a5fa;">${locationText}</strong>
                        </div>
                    </div>
                    ${statusBadge}
                </div>

                <div class="order-items-box">
                    ${itemsHtml}
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem;">
                    <span style="color: var(--text-muted);">Total Tagihan:</span>
                    <span style="font-weight: 700; color: var(--gold);">${formatRupiah(order.grand_total)}</span>
                </div>

                <div class="order-cta-row">
                    ${actionsHtml}
                </div>
            </div>
        `;
    }).join('');
}

// Change Order Status (Optimistic UI: 0ms Instant Response)
async function changeOrderStatus(orderId, newStatus) {
    const targetOrder = allAdminOrders.find(o => o.order_id === orderId);
    const oldStatus = targetOrder ? targetOrder.status : null;

    // 1. Optimistic update: Langsung ubah memori dan render antarmuka seketika
    if (targetOrder) {
        targetOrder.status = newStatus;
        renderKitchenOrders();
        showAdminToast(`👨‍🍳 Pesanan ${orderId} diubah ke: ${newStatus}`);
    }

    // 2. Kirim update ke server di background
    try {
        const res = await fetch(`/api/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        if (!res.ok) throw new Error('Gagal memperbarui status di server');
        loadAdminStats();
    } catch (e) {
        // Rollback jika gagal
        if (targetOrder && oldStatus) {
            targetOrder.status = oldStatus;
            renderKitchenOrders();
        }
        alert(`Gagal: ${e.message}`);
    }
}

// Audio Chime synthesizer via Web Audio API (Pleasant 2-tone cash register / chime sound)
function playCashierChime(isSuccess = true) {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const audioCtx = new AudioCtx();
        if (isSuccess) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
            osc.frequency.setValueAtTime(1320, audioCtx.currentTime + 0.1); // E6
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.35);
        } else {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
        }
    } catch (e) {
        // Fallback silently if audio context is blocked
    }
}

// Handler Process Scan Barcode
async function handleScanCashierOrder(rawOrderId) {
    if (!rawOrderId) return;
    let orderId = rawOrderId.trim();
    if (orderId.startsWith('#')) orderId = orderId.substring(1).trim();

    const feedbackEl = document.getElementById('cashierScanFeedback');
    const inputEl = document.getElementById('cashierBarcodeInput');

    if (feedbackEl) {
        feedbackEl.innerHTML = `<span style="color: #60a5fa;">⏳ Memproses scan barcode #${orderId}...</span>`;
    }

    try {
        const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/scan-cashier`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.detail || 'Gagal memproses scan barcode di kasir.');
        }

        playCashierChime(true);
        if (feedbackEl) {
            feedbackEl.innerHTML = `<span style="color: #10b981; font-weight: 700;">✅ BERHASIL! Barcode #${orderId} telah dibayar LUNAS & diteruskan ke Koki Dapur!</span>`;
        }
        showAdminToast(`✅ Barcode #${orderId} di-scan! Pesanan siap dimasak koki.`);
        if (inputEl) {
            inputEl.value = '';
            inputEl.focus();
        }

        // Segera muat ulang data pesanan untuk menyegarkan tabel kasir dan antrean dapur
        await loadAdminOrders();
        loadAdminStats();
    } catch (err) {
        playCashierChime(false);
        if (feedbackEl) {
            feedbackEl.innerHTML = `<span style="color: #f87171; font-weight: 700;">❌ Gagal: ${err.message}</span>`;
        }
        alert(`Scan Barcode Gagal: ${err.message}`);
        if (inputEl) inputEl.select();
    }
}

// Render Cashier List
function renderCashierOrders() {
    const list = document.getElementById('cashierOrdersList');
    if (!list) return;

    const unpaid = allAdminOrders.filter(o => o.payment_status === 'belum_bayar');

    if (unpaid.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--emerald);">
                <div style="font-size: 2rem; margin-bottom: 8px;">✨</div>
                <div style="font-weight: 700; font-size: 1.1rem; color: #fff;">Semua Pesanan Telah Lunas!</div>
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">Tidak ada tagihan meja yang menunggu di kasir saat ini.</div>
            </div>
        `;
        return;
    }

    list.innerHTML = `
        <div style="margin-bottom: 14px; font-size: 0.88rem; color: #fbbf24; font-weight: 600;">
            ⚠️ Terdapat ${unpaid.length} pesanan menunggu scan tiket barcode / pembayaran di kasir:
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px;">
            ${unpaid.map(order => `
                <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-family: monospace; font-weight: 800; background: rgba(216, 178, 110, 0.15); color: var(--gold); padding: 3px 8px; border-radius: 4px; font-size: 0.95rem; border: 1px dashed rgba(216, 178, 110, 0.4);">
                                #${order.order_id}
                            </span>
                            <span style="font-weight: 700; color: #fff; font-size: 0.95rem;">• Meja ${order.table_number || '-'}</span>
                            <span style="font-size: 0.72rem; background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); padding: 2px 6px; border-radius: 4px;">Belum Scan/Bayar</span>
                        </div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 5px;">
                            Pelanggan: <strong>${order.customer_name || 'Tamu'}</strong> • Metode: Bayar di Kasir (Tiket Barcode)
                        </div>
                    </div>

                    <div style="display: flex; align-items: center; gap: 14px;">
                        <div style="text-align: right;">
                            <div style="font-size: 0.72rem; color: var(--text-muted);">Total Tagihan</div>
                            <div style="font-family: 'Cinzel', serif; font-size: 1.25rem; font-weight: 700; color: #fff;">
                                ${formatRupiah(order.grand_total)}
                            </div>
                        </div>

                        <button onclick="handleScanCashierOrder('${order.order_id}')" class="btn-submit-gold" style="width: auto; padding: 10px 18px; background: linear-gradient(135deg, #059669, #047857); color: #fff; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.35); display: flex; align-items: center; gap: 6px;">
                            <span>📷 Scan & Bayar Lunas</span>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Confirm Cashier Payment (Optimistic UI)
async function confirmCashierPayment(orderId) {
    return handleScanCashierOrder(orderId);
}

// Render Tables Grid
function renderTablesGrid() {
    const grid = document.getElementById('adminTablesGrid');
    if (!grid) return;

    let html = '';
    for (let i = 1; i <= 20; i++) {
        html += `
            <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 14px; text-align: center; transition: all 0.2s ease;">
                <div style="font-size: 0.72rem; color: var(--text-muted);">MEJA</div>
                <div style="font-family: 'Cinzel', serif; font-size: 1.6rem; font-weight: 700; color: var(--gold);">${i}</div>
                <a href="/?meja=${i}" target="_blank" style="display: inline-block; margin-top: 8px; font-size: 0.72rem; color: #60a5fa; text-decoration: none;">
                    Buka Tamu Meja ${i} ↗
                </a>
            </div>
        `;
    }
    grid.innerHTML = html;
}

// Form Add Food Submit Handler
function setupAddFoodForm() {
    const form = document.getElementById('adminAddFoodForm');
    const btn = document.getElementById('btnSubmitFood');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('foodName').value.trim();
        const japanese_name = document.getElementById('foodJpName').value.trim();
        const category = document.getElementById('foodCategory').value;
        const price = parseInt(document.getElementById('foodPrice').value, 10);
        const prep_time_min = parseInt(document.getElementById('foodPrepTime').value, 10) || 12;
        const calories = parseInt(document.getElementById('foodCalories').value, 10) || 450;
        const spiciness = parseInt(document.getElementById('foodSpiciness').value, 10) || 0;
        const image_url = document.getElementById('foodImageUrl').value.trim() || 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500';
        const description = document.getElementById('foodDesc').value.trim();
        const tagsRaw = document.getElementById('foodTags').value.trim();
        const is_halal = document.getElementById('foodIsHalal').checked;
        const is_vegetarian = document.getElementById('foodIsVeg').checked;
        const is_available = document.getElementById('foodIsAvailable').checked;

        const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

        const payload = {
            name,
            japanese_name,
            category,
            price,
            prep_time_min,
            calories,
            spiciness,
            image_url,
            description,
            tags,
            pairings: [],
            is_halal,
            is_vegetarian,
            is_available
        };

        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Menyimpan...';
        }

        try {
            const res = await fetch('/api/foods', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Gagal menyimpan menu');
            }

            const created = await res.json();
            showAdminToast(`✨ Menu "${created.name}" berhasil ditambahkan ke database!`);
            form.reset();
            document.getElementById('foodIsHalal').checked = true;
            document.getElementById('foodIsAvailable').checked = true;
            await loadAdminFoods();
            await loadAdminStats();
        } catch (e) {
            alert(`Error: ${e.message}`);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = '+ Simpan Menu ke Database';
            }
        }
    });
}

// Setup Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Nav Tabs
    const tabBtns = document.querySelectorAll('.nav-tab-btn');
    const sections = document.querySelectorAll('.admin-section');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            btn.classList.add('active');
            const targetId = btn.dataset.target;
            const targetSec = document.getElementById(targetId);
            if (targetSec) targetSec.classList.add('active');
        });
    });

    // Category Filter Pills
    const catPills = document.querySelectorAll('.cat-pill');
    catPills.forEach(pill => {
        pill.addEventListener('click', () => {
            catPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentCategoryFilter = pill.dataset.cat;
            renderAdminFoods();
        });
    });

    // Search Input
    const searchInput = document.getElementById('adminFoodSearch');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderAdminFoods();
        });
    }

    // Reload Foods Button
    const btnReload = document.getElementById('btnReloadFoods');
    if (btnReload) {
        btnReload.addEventListener('click', () => {
            loadAdminFoods();
            loadAdminStats();
            showAdminToast('Data menu dimuat ulang');
        });
    }

    // Kitchen Order Filter Buttons
    const btnWait = document.getElementById('filterOrderWaitBtn');
    const btnAll = document.getElementById('filterOrderAllBtn');
    if (btnWait && btnAll) {
        btnWait.addEventListener('click', () => {
            currentKitchenOrderFilter = 'waiting';
            renderKitchenOrders();
        });
        btnAll.addEventListener('click', () => {
            currentKitchenOrderFilter = 'all';
            renderKitchenOrders();
        });
    }

    // Barcode Scanner Event Listeners
    const barcodeInput = document.getElementById('cashierBarcodeInput');
    const barcodeBtn = document.getElementById('btnProcessScanBarcode');
    if (barcodeInput) {
        barcodeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleScanCashierOrder(barcodeInput.value);
            }
        });
    }
    if (barcodeBtn) {
        barcodeBtn.addEventListener('click', () => {
            if (barcodeInput) handleScanCashierOrder(barcodeInput.value);
        });
    }

    // Initialize
    setupAddFoodForm();
    renderTablesGrid();
    loadAdminStats();
    loadAdminFoods();
    loadAdminOrders();

    // Auto-polling 6s
    setInterval(() => {
        loadAdminStats();
        loadAdminOrders();
    }, 6000);
});
