/**
 * SAVORIA - Kitchen & Service Live Operations JS
 * Menghubungkan antarmuka dapur dengan API Orders Savoria.
 */

let allOrders = [];
let currentFilter = 'semua';
let lastPendingCount = 0;
let isAudioEnabled = true;

// Web Audio API Synthesizer Chime untuk Notifikasi Pesanan Baru
function playKitchenNotificationChime() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5

        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
        console.warn('Audio not allowed yet by user gesture', e);
    }
}

// Format Rupiah
function formatRupiah(amount) {
    return 'Rp ' + Number(amount || 0).toLocaleString('id-ID');
}

// Live Clock WIB
function updateClock() {
    const clockEl = document.getElementById('liveClock');
    if (!clockEl) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    clockEl.textContent = `${timeStr} WIB`;
}
setInterval(updateClock, 1000);
updateClock();

// Fetch Data Statistik Dashboard
async function loadKitchenStats() {
    try {
        const res = await fetch('/api/orders/stats');
        if (!res.ok) return;
        const stats = await res.json();

        if (document.getElementById('statTotal')) document.getElementById('statTotal').textContent = stats.total_orders;
        if (document.getElementById('statPending')) document.getElementById('statPending').textContent = stats.pending_orders;
        if (document.getElementById('statCooking')) document.getElementById('statCooking').textContent = stats.cooking_orders;
        if (document.getElementById('statCompleted')) document.getElementById('statCompleted').textContent = stats.completed_orders;
        if (document.getElementById('statRevenue')) document.getElementById('statRevenue').textContent = formatRupiah(stats.total_revenue);
        if (document.getElementById('statPaidRevenue')) document.getElementById('statPaidRevenue').textContent = formatRupiah(stats.paid_revenue);
        if (document.getElementById('statUnpaidRevenue')) document.getElementById('statUnpaidRevenue').textContent = formatRupiah(stats.unpaid_revenue);

        const waitingDot = document.getElementById('waitingDot');
        if (waitingDot) {
            waitingDot.style.display = stats.pending_orders > 0 ? 'inline-block' : 'none';
        }

        // Bunyikan lonceng jika ada pesanan baru masuk
        if (stats.pending_orders > lastPendingCount && lastPendingCount !== 0) {
            playKitchenNotificationChime();
        }
        lastPendingCount = stats.pending_orders;
    } catch (err) {
        console.error('Gagal mengambil statistik dapur:', err);
    }
}

// Fetch Seluruh Pesanan
async function loadOrders() {
    try {
        const res = await fetch('/api/orders');
        if (!res.ok) throw new Error('Network error');
        allOrders = await res.json();
        renderOrders();
    } catch (err) {
        console.error('Gagal mengambil pesanan:', err);
        const grid = document.getElementById('ordersGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="empty-orders">
                    <div style="color: #ef4444; margin-bottom: 8px;">⚠️ Gagal terhubung ke server database.</div>
                    <button onclick="loadOrders()" class="btn-ghost-nav" style="margin: 0 auto;">Coba Lagi</button>
                </div>
            `;
        }
    }
}

// Update Status Pesanan via API (Optimistic UI: 0ms Response)
async function updateOrderStatus(orderId, newStatus) {
    const target = allOrders.find(o => o.order_id === orderId);
    const oldStatus = target ? target.status : null;

    // 1. Optimistic Update: Langsung render UI
    if (target) {
        target.status = newStatus;
        renderOrders();
    }

    // 2. Kirim update ke server di background
    try {
        const res = await fetch(`/api/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.detail || 'Terjadi kesalahan');
        }

        loadKitchenStats();
    } catch (err) {
        // Rollback jika error
        if (target && oldStatus) {
            target.status = oldStatus;
            renderOrders();
        }
        console.error('Error updating order status:', err);
        alert(`Gagal memperbarui status: ${err.message}`);
    }
}

// Update Status Pembayaran (Kasir / QRIS) via API
async function updateOrderPaymentStatus(orderId, newPaymentStatus) {
    try {
        const res = await fetch(`/api/orders/${orderId}/payment`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payment_status: newPaymentStatus })
        });

        if (!res.ok) {
            const errData = await res.json();
            alert(`Gagal memperbarui status pembayaran: ${errData.detail || 'Terjadi kesalahan'}`);
            return;
        }

        // Segera refresh data pesanan & statistik
        await Promise.all([loadOrders(), loadKitchenStats()]);
    } catch (err) {
        console.error('Error updating order payment:', err);
        alert('Gagal menghubungi server');
    }
}

// Render Kartu Pesanan ke Grid
function renderOrders() {
    const grid = document.getElementById('ordersGrid');
    if (!grid) return;

    const query = (document.getElementById('orderSearchInput')?.value || '').toLowerCase().trim();

    // Filter status & pencarian
    const filtered = allOrders.filter(o => {
        let matchStatus = false;
        if (currentFilter === 'semua') {
            matchStatus = true;
        } else if (currentFilter === 'belum_bayar') {
            matchStatus = o.payment_status === 'belum_bayar';
        } else {
            matchStatus = o.status === currentFilter;
        }

        const matchQuery = !query || 
            (o.order_id && o.order_id.toLowerCase().includes(query)) ||
            (o.customer_name && o.customer_name.toLowerCase().includes(query)) ||
            (o.table_number && o.table_number.toLowerCase().includes(query));
        return matchStatus && matchQuery;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-orders">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
                <div style="font-size: 1rem; color: #a1a7b7;">Tidak ada pesanan pada filter ini</div>
                <div style="font-size: 0.8rem; margin-top: 4px;">Pesanan baru dari tamu akan otomatis muncul di sini.</div>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(order => {
        const statusClass = `badge-${order.status}`;
        let statusLabel = order.status;
        if (order.status === 'menunggu_kasir') statusLabel = '⏳ Menunggu Scan Kasir';
        else if (order.status === 'menunggu') statusLabel = '⏳ Menunggu';
        else if (order.status === 'dimasak') statusLabel = '👨‍🍳 Sedang Dimasak';
        else if (order.status === 'selesai') statusLabel = '✅ Selesai';
        else if (order.status === 'dibatalkan') statusLabel = '❌ Dibatalkan';

        const isDineIn = order.order_type === 'dine_in';
        const typeBadge = isDineIn ? `Makan di Tempat (Meja: ${order.table_number || '-'})` : 'Bungkus / Takeaway';

        // Informasi Pembayaran (QRIS Digital vs Kasir)
        const isPaid = order.payment_status === 'lunas';
        const isQris = order.payment_method === 'qris';
        let paymentBadgeHtml = '';

        if (isPaid) {
            paymentBadgeHtml = `
                <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); padding: 5px 10px; border-radius: 6px; font-size: 0.74rem; display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                    <span style="color: #10b981; font-weight: 700;">🟢 LUNAS (${isQris ? 'QRIS Digital' : 'Kasir'})</span>
                    <span style="color: #6ee7b7; font-size: 0.7rem;">Bebas Kasir</span>
                </div>
            `;
        } else {
            paymentBadgeHtml = `
                <div style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.35); padding: 5px 10px; border-radius: 6px; font-size: 0.74rem; display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                    <span style="color: #fbbf24; font-weight: 700;">🟡 MENUNGGU SCAN KASIR</span>
                    <span style="color: #fde68a; font-size: 0.7rem;">Tiket Barcode Belum Di-scan</span>
                </div>
            `;
        }

        // Render Action Buttons
        let actionsHtml = '';
        if (order.status === 'menunggu_kasir') {
            actionsHtml = `
                <div class="order-actions-bar">
                    <button class="btn-action-status" disabled style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px dashed rgba(245, 158, 11, 0.4); cursor: not-allowed; opacity: 0.85;">
                        ⚠️ Menunggu Scan Barcode Kasir
                    </button>
                    <button class="btn-action-status btn-cancel-order" onclick="if(confirm('Batalkan pesanan ini?')) updateOrderStatus('${order.order_id}', 'dibatalkan')">
                        Batalkan
                    </button>
                </div>
            `;
        } else if (order.status === 'menunggu') {
            actionsHtml = `
                <div class="order-actions-bar">
                    <button class="btn-action-status btn-start-cook" onclick="updateOrderStatus('${order.order_id}', 'dimasak')">
                        👨‍🍳 Masak Sekarang
                    </button>
                    <button class="btn-action-status btn-cancel-order" onclick="if(confirm('Batalkan pesanan ini?')) updateOrderStatus('${order.order_id}', 'dibatalkan')">
                        Batalkan
                    </button>
                </div>
            `;
        } else if (order.status === 'dimasak') {
            actionsHtml = `
                <div class="order-actions-bar">
                    <button class="btn-action-status btn-finish-order" onclick="updateOrderStatus('${order.order_id}', 'selesai')">
                        ✨ Siap & Selesaikan
                    </button>
                </div>
            `;
        } else if (order.status === 'selesai') {
            actionsHtml = `
                <div style="text-align: center; font-size: 0.82rem; color: #10b981; font-weight: 600; padding: 6px;">
                    Pesanan Selesai Disajikan
                </div>
            `;
        } else {
            actionsHtml = `
                <div style="text-align: center; font-size: 0.82rem; color: #ef4444; font-weight: 500; padding: 6px;">
                    Pesanan Dibatalkan
                </div>
            `;
        }

        // Tombol Terima Kasir (jika belum bayar dan belum dibatalkan)
        let cashierPayButton = '';
        if (!isPaid && order.status !== 'dibatalkan') {
            cashierPayButton = `
                <button class="btn-action-status btn-pay-kasir" onclick="if(confirm('Tandai pesanan #${order.order_id} LUNAS di kasir?')) updateOrderPaymentStatus('${order.order_id}', 'lunas')" title="Terima pembayaran kasir dan tandai lunas">
                    💵 Terima Bayar Kasir (Tandai Lunas)
                </button>
            `;
        }

        const itemsHtml = (order.items || []).map(item => `
            <li class="order-item-row">
                <div>
                    <span class="item-qty-badge">${item.quantity}x</span>
                    <strong style="color: #fff;">${item.food_name || item.name}</strong>
                    ${item.notes ? `<span class="item-note-text">Catatan: "${item.notes}"</span>` : ''}
                </div>
                <div>${formatRupiah(item.line_total)}</div>
            </li>
        `).join('');

        return `
            <div class="order-card" id="card-${order.order_id}">
                <div>
                    <div class="order-card-header">
                        <div>
                            <div class="order-meta-id">#${order.order_id}</div>
                            <div class="order-time">${order.created_at || 'Baru Saja'}</div>
                        </div>
                        <span class="badge-status ${statusClass}">${statusLabel}</span>
                    </div>

                    <div class="customer-info-box">
                        <div>
                            <div class="customer-name">${order.customer_name}</div>
                            ${order.customer_phone ? `<div style="font-size: 0.75rem; color: #8e94a5;">📞 ${order.customer_phone}</div>` : ''}
                        </div>
                        <span class="table-badge">${typeBadge}</span>
                    </div>

                    ${paymentBadgeHtml}

                    ${order.notes ? `
                        <div style="background: rgba(245, 158, 11, 0.08); border-left: 3px solid #f59e0b; padding: 8px 12px; border-radius: 4px; font-size: 0.78rem; color: #fbbf24; margin-bottom: 14px;">
                            <strong>Catatan Tamu:</strong> ${order.notes}
                        </div>
                    ` : ''}

                    <ul class="items-list">
                        ${itemsHtml}
                    </ul>
                </div>

                <div>
                    <div class="order-financials">
                        <span style="font-size: 0.82rem; color: #8a8f9f;">Total Pembayaran:</span>
                        <span class="grand-total-amount">${formatRupiah(order.grand_total)}</span>
                    </div>

                    ${actionsHtml}
                    ${cashierPayButton}
                </div>
            </div>
        `;
    }).join('');
}

// --- Menu Management Logic (Kelola & Tambah Menu) ---
let managedFoods = [];

async function loadManagedFoods() {
    const listContainer = document.getElementById('managedFoodsList');
    if (!listContainer) return;
    listContainer.innerHTML = '<div style="text-align: center; padding: 30px; color: #8e94a5;">Memuat daftar menu...</div>';

    try {
        const res = await fetch('/api/foods?include_unavailable=true');
        if (!res.ok) throw new Error('Gagal mengambil data menu');
        managedFoods = await res.json();
        renderManagedFoods();
    } catch (err) {
        console.error('Error loadManagedFoods:', err);
        listContainer.innerHTML = `<div style="text-align: center; padding: 20px; color: #f87171;">⚠️ Gagal memuat menu: ${err.message}</div>`;
    }
}

function renderManagedFoods() {
    const listContainer = document.getElementById('managedFoodsList');
    if (!listContainer) return;

    if (!managedFoods || managedFoods.length === 0) {
        listContainer.innerHTML = '<div style="text-align: center; padding: 30px; color: #8e94a5;">Belum ada menu di database. Silakan tambah menu baru.</div>';
        return;
    }

    listContainer.innerHTML = managedFoods.map(food => {
        const fallbackImg = "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=300";
        const imgSrc = food.image_url || fallbackImg;
        const availClass = food.is_available ? 'available' : 'soldout';
        const availText = food.is_available ? '✅ Tersedia' : '❌ Habis / Sold Out';
        const toggleTarget = !food.is_available;

        return `
            <div class="manage-food-item" id="foodItem-${food.id}">
                <div class="manage-food-left">
                    <img src="${imgSrc}" alt="${food.name}" class="manage-food-img" onerror="this.src='${fallbackImg}'">
                    <div>
                        <div style="font-weight: 600; font-size: 0.95rem; color: #fff;">
                            ${food.name}
                            ${food.japanese_name ? `<span style="font-size: 0.8rem; color: #d8b26e; margin-left: 6px;">(${food.japanese_name})</span>` : ''}
                        </div>
                        <div style="font-size: 0.78rem; color: #8e94a5; margin-top: 2px;">
                            <span style="color: #60a5fa; font-weight: 500;">${food.category}</span> • 
                            <span style="color: #d8b26e; font-weight: 600;">${formatRupiah(food.price)}</span> • 
                            <span>⏱️ ${food.prep_time_min || 10} mnt</span>
                        </div>
                    </div>
                </div>

                <div class="manage-food-actions">
                    <button class="btn-toggle-avail ${availClass}" onclick="toggleFoodStock(${food.id}, ${toggleTarget})" title="Klik untuk ubah ketersediaan di menu tamu">
                        ${availText}
                    </button>
                    <button class="btn-del-food" onclick="deleteFoodItem(${food.id}, '${food.name.replace(/'/g, "\\'")}')">
                        🗑️ Hapus
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function toggleFoodStock(foodId, makeAvailable) {
    try {
        const res = await fetch(`/api/foods/${foodId}/availability`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_available: makeAvailable })
        });

        if (!res.ok) {
            const err = await res.json();
            alert(`Gagal mengubah ketersediaan: ${err.detail || 'Error'}`);
            return;
        }

        const updated = await res.json();
        // Update local state
        const target = managedFoods.find(f => f.id === foodId);
        if (target) target.is_available = updated.is_available;
        renderManagedFoods();
    } catch (err) {
        console.error('Error toggleFoodStock:', err);
        alert('Gagal menghubungi server');
    }
}

async function deleteFoodItem(foodId, foodName) {
    if (!confirm(`Apakah Anda yakin ingin menghapus menu "${foodName}" dari sistem?`)) {
        return;
    }

    try {
        const res = await fetch(`/api/foods/${foodId}`, {
            method: 'DELETE'
        });

        if (!res.ok) {
            const err = await res.json();
            alert(`Gagal menghapus menu: ${err.detail || 'Error'}`);
            return;
        }

        // Hapus dari state lokal
        managedFoods = managedFoods.filter(f => f.id !== foodId);
        renderManagedFoods();
    } catch (err) {
        console.error('Error deleteFoodItem:', err);
        alert('Gagal menghubungi server');
    }
}

function setupMenuManager() {
    const modalOverlay = document.getElementById('menuModalOverlay');
    const openBtn = document.getElementById('openMenuManagerBtn');
    const closeBtn = document.getElementById('closeMenuModalBtn');
    const tabAdd = document.getElementById('tabBtnAdd');
    const tabList = document.getElementById('tabBtnList');
    const panelAdd = document.getElementById('tabPanelAdd');
    const panelList = document.getElementById('tabPanelList');
    const refreshListBtn = document.getElementById('refreshMenuListBtn');
    const form = document.getElementById('addNewFoodForm');
    const submitBtn = document.getElementById('submitMenuBtn');

    if (!modalOverlay || !openBtn) return;

    // Buka Modal
    openBtn.addEventListener('click', () => {
        modalOverlay.classList.add('active');
        // Default tampilkan tab tambah menu atau refresh data
        loadManagedFoods();
    });

    // Tutup Modal
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modalOverlay.classList.remove('active');
        });
    }

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.classList.remove('active');
        }
    });

    // Switch Tabs
    if (tabAdd && tabList && panelAdd && panelList) {
        tabAdd.addEventListener('click', () => {
            tabAdd.classList.add('active');
            tabList.classList.remove('active');
            panelAdd.style.display = 'block';
            panelList.style.display = 'none';
        });

        tabList.addEventListener('click', () => {
            tabList.classList.add('active');
            tabAdd.classList.remove('active');
            panelList.style.display = 'block';
            panelAdd.style.display = 'none';
            loadManagedFoods();
        });
    }

    if (refreshListBtn) {
        refreshListBtn.addEventListener('click', () => {
            loadManagedFoods();
        });
    }

    // Submit Form Tambah Menu
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('foodNameInput').value.trim();
            const japanese_name = document.getElementById('foodJpNameInput').value.trim();
            const category = document.getElementById('foodCategorySelect').value;
            const price = parseInt(document.getElementById('foodPriceInput').value, 10);
            const prep_time_min = parseInt(document.getElementById('foodPrepTimeInput').value, 10) || 10;
            const calories = parseInt(document.getElementById('foodCaloriesInput').value, 10) || 0;
            const spiciness = parseInt(document.getElementById('foodSpicinessSelect').value, 10) || 0;
            const image_url = document.getElementById('foodImageUrlInput').value.trim();
            const description = document.getElementById('foodDescInput').value.trim();
            const tagsRaw = document.getElementById('foodTagsInput').value.trim();
            const is_halal = document.getElementById('foodIsHalalCheck').checked;
            const is_vegetarian = document.getElementById('foodIsVegCheck').checked;
            const is_available = document.getElementById('foodIsAvailableCheck').checked;

            const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

            const payload = {
                name,
                japanese_name,
                category,
                price,
                prep_time_min,
                calories,
                spiciness,
                image_url: image_url || 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500',
                description,
                tags,
                pairings: [],
                is_halal,
                is_vegetarian,
                is_available
            };

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Menyimpan ke Database...';
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
                alert(`✨ Menu "${created.name}" berhasil ditambahkan ke database Savoria!`);
                form.reset();

                // Pindah ke tab daftar menu dan muat ulang
                if (tabList) tabList.click();
            } catch (err) {
                console.error('Error create food:', err);
                alert(`Gagal menambahkan menu: ${err.message}`);
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = '+ Simpan Menu ke Database';
                }
            }
        });
    }
}

// Setup Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Filter Tabs
    const filterTabs = document.querySelectorAll('.filter-tab-btn');
    filterTabs.forEach(btn => {
        btn.addEventListener('click', () => {
            filterTabs.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderOrders();
        });
    });

    // Search Input
    const searchInput = document.getElementById('orderSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderOrders();
        });
    }

    // Manual Refresh Button
    const refreshBtn = document.getElementById('manualRefreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadKitchenStats();
            loadOrders();
        });
    }

    // Setup Menu Management Modal
    setupMenuManager();

    // Initial Load
    loadKitchenStats();
    loadOrders();

    // Auto-Polling Interval (setiap 6 detik)
    setInterval(() => {
        loadKitchenStats();
        loadOrders();
    }, 6000);
});
