// SAVORIA — Artisanal Japanese Dining Frontend Engine
document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    let foodsData = [];
    let cart = JSON.parse(localStorage.getItem('savoria_cart') || '{}');
    let activeFilters = {
        query: '',
        category: '',
        is_halal: null,
        is_vegetarian: null,
        is_spicy: null,
        sort_by: 'popular'
    };
    let currentDetailFood = null;
    let detailQty = 1;
    let debounceTimer;

    // --- DOM REFERENCES ---
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearch');
    const categoryTabs = document.querySelectorAll('.tab-item');
    const foodGrid = document.getElementById('foodGrid');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const emptyState = document.getElementById('emptyState');
    const resultsCount = document.getElementById('resultsCount');
    const resultsTitle = document.getElementById('resultsTitle');
    const cartCountBadge = document.getElementById('cartCountBadge');
    const toastContainer = document.getElementById('toastContainer');

    // Secondary Filter Chips & Sorting
    const filterHalalBtn = document.getElementById('filterHalal');
    const filterSpicyBtn = document.getElementById('filterSpicy');
    const filterVegBtn = document.getElementById('filterVeg');
    const sortBySelect = document.getElementById('sortBySelect');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');

    // Food Detail Dialog
    const foodDetailModal = document.getElementById('foodDetailModal');
    const closeDetailBtn = document.getElementById('closeDetailBtn');
    const detailImage = document.getElementById('detailImage');
    const detailCategoryBadge = document.getElementById('detailCategoryBadge');
    const detailJapaneseName = document.getElementById('detailJapaneseName');
    const detailName = document.getElementById('detailName');
    const detailRating = document.getElementById('detailRating');
    const detailPrepTime = document.getElementById('detailPrepTime');
    const detailCalories = document.getElementById('detailCalories');
    const detailDescription = document.getElementById('detailDescription');
    const detailTags = document.getElementById('detailTags');
    const detailPairings = document.getElementById('detailPairings');
    const detailPrice = document.getElementById('detailPrice');
    const detailQtyDisplay = document.getElementById('detailQtyDisplay');
    const detailQtyMinus = document.getElementById('detailQtyMinus');
    const detailQtyPlus = document.getElementById('detailQtyPlus');
    const detailAddToCartBtn = document.getElementById('detailAddToCartBtn');

    // Cart Sheet
    const cartDrawer = document.getElementById('cartDrawer');
    const openCartBtn = document.getElementById('openCartBtn');
    const closeCartBtn = document.getElementById('closeCartBtn');
    const cartItemsList = document.getElementById('cartItemsList');
    const cartSubtotal = document.getElementById('cartSubtotal');
    const cartTax = document.getElementById('cartTax');
    const cartService = document.getElementById('cartService');
    const cartGrandTotal = document.getElementById('cartGrandTotal');
    const checkoutDirectBtn = document.getElementById('checkoutDirectBtn') || document.getElementById('checkoutWhatsAppBtn');
    const clearCartBtn = document.getElementById('clearCartBtn');
    const modeDineIn = document.getElementById('modeDineIn');
    const modeTakeaway = document.getElementById('modeTakeaway');
    const tableField = document.getElementById('tableField');
    const tableNumberInput = document.getElementById('tableNumberInput');
    const customerNameInput = document.getElementById('customerNameInput');
    const cartNotesInput = document.getElementById('cartNotesInput');
    const payMethodQris = document.getElementById('payMethodQris');
    const payMethodKasir = document.getElementById('payMethodKasir');
    const checkoutBtnLabel = document.getElementById('checkoutBtnLabel');
    const checkoutHelperText = document.getElementById('checkoutHelperText');
    const qrisPaymentModal = document.getElementById('qrisPaymentModal');
    const qrisAmountDisplay = document.getElementById('qrisAmountDisplay');
    const qrisCodeImage = document.getElementById('qrisCodeImage');
    const confirmQrisPaidBtn = document.getElementById('confirmQrisPaidBtn');
    const cancelQrisBtn = document.getElementById('cancelQrisBtn');
    let selectedPaymentMethod = 'qris';
    let orderMode = 'dine_in';

    const floatingComboBtn = document.getElementById('floatingComboBtn');
    const openComboFromEmptyBtn = document.getElementById('openComboFromEmptyBtn');

    // Set Menu Planner Dialog
    const comboModal = document.getElementById('comboModal');
    const openComboBtn = document.getElementById('openComboBtn');
    const closeComboBtn = document.getElementById('closeComboBtn');
    const comboBudgetInput = document.getElementById('comboBudgetInput');
    const comboBudgetSlider = document.getElementById('comboBudgetSlider');
    const comboPeopleSelect = document.getElementById('comboPeopleSelect');
    const comboTasteSelect = document.getElementById('comboTasteSelect');
    const generateComboBtn = document.getElementById('generateComboBtn');
    const comboResultBox = document.getElementById('comboResultBox');
    const comboResultTitle = document.getElementById('comboResultTitle');
    const comboResultDesc = document.getElementById('comboResultDesc');
    const comboTotalPrice = document.getElementById('comboTotalPrice');
    const comboSavingsBadge = document.getElementById('comboSavingsBadge');
    const comboItemsList = document.getElementById('comboItemsList');
    const comboTotalCalories = document.getElementById('comboTotalCalories');
    const addAllComboToCartBtn = document.getElementById('addAllComboToCartBtn');
    let activeComboItems = [];

    // Invoice Confirmation Dialog
    const orderSuccessModal = document.getElementById('orderSuccessModal');
    const closeSuccessBtn = document.getElementById('closeSuccessBtn');
    const receiptBox = document.getElementById('receiptBox');
    const successWhatsAppLink = document.getElementById('successWhatsAppLink');
    const trackFromReceiptBtn = document.getElementById('trackFromReceiptBtn');

    // Customer Tracking Dialog Elements
    const openTrackBtn = document.getElementById('openTrackBtn');
    const trackOrderModal = document.getElementById('trackOrderModal');
    const closeTrackModalBtn = document.getElementById('closeTrackModalBtn');
    const trackOrderIdInput = document.getElementById('trackOrderIdInput');
    const searchTrackOrderBtn = document.getElementById('searchTrackOrderBtn');
    const trackOrderResult = document.getElementById('trackOrderResult');
    let trackPollingTimer = null;

    // --- UTILITIES ---
    const formatRp = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(num);
    };

    const showToast = (message) => {
        const toast = document.createElement('div');
        toast.className = 'toast-pill';
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.25s ease';
            setTimeout(() => toast.remove(), 250);
        }, 2500);
    };

    const saveCart = () => {
        localStorage.setItem('savoria_cart', JSON.stringify(cart));
        updateCartBadge();
    };

    const updateCartBadge = () => {
        const totalQty = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
        cartCountBadge.textContent = totalQty;
    };

    // --- FETCH & RENDER FOODS ---
    const fetchFoods = async () => {
        foodGrid.classList.add('hidden');
        emptyState.classList.add('hidden');
        loadingIndicator.classList.remove('hidden');

        try {
            const params = new URLSearchParams();
            if (activeFilters.query) params.append('query', activeFilters.query);
            if (activeFilters.category) params.append('category', activeFilters.category);
            if (activeFilters.is_halal !== null) params.append('is_halal', activeFilters.is_halal);
            if (activeFilters.is_vegetarian !== null) params.append('is_vegetarian', activeFilters.is_vegetarian);
            if (activeFilters.is_spicy !== null) params.append('is_spicy', activeFilters.is_spicy);
            if (activeFilters.sort_by) params.append('sort_by', activeFilters.sort_by);

            const res = await fetch(`/api/foods?${params.toString()}`);
            foodsData = await res.json();
            renderFoods(foodsData);
        } catch (err) {
            console.error('Error fetching foods:', err);
            foodGrid.innerHTML = `<p style="color: #b33939; text-align: center; grid-column: 1/-1;">Gagal memuat hidangan. Pastikan server aktif.</p>`;
            foodGrid.classList.remove('hidden');
        } finally {
            loadingIndicator.classList.add('hidden');
        }
    };

    const renderFoods = (foods) => {
        foodGrid.innerHTML = '';
        resultsCount.textContent = `${foods.length} hidangan tersedia`;

        if (foods.length === 0) {
            foodGrid.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        foodGrid.classList.remove('hidden');
        emptyState.classList.add('hidden');

        foods.forEach((food) => {
            const card = document.createElement('div');
            card.className = 'dish-card';

            card.innerHTML = `
                <div class="dish-visual-box" data-id="${food.id}">
                    <img src="${food.image_url}" alt="${food.name}" class="dish-image" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80'">
                    <span class="dish-category-label">${food.category}</span>
                </div>
                <div class="dish-content">
                    <div class="dish-meta-head">
                        <span class="dish-kanji">${food.japanese_name || ''}</span>
                        <span class="dish-rating-text">★ ${food.rating}</span>
                    </div>
                    <h3 class="dish-name" data-id="${food.id}">${food.name}</h3>
                    <p class="dish-description">${food.description}</p>
                    <div class="dish-specifications">
                        <span>${food.prep_time_min} mnt</span>
                        <span>•</span>
                        <span>${food.calories} kkal</span>
                        ${food.is_halal ? '<span>•</span><span>Halal</span>' : ''}
                        ${food.spiciness > 0 ? '<span>•</span><span>Pedas</span>' : ''}
                    </div>
                    <div class="dish-footer">
                        <span class="dish-price-tag">${formatRp(food.price)}</span>
                        <div class="dish-actions">
                            <button class="btn-dish-detail" data-id="${food.id}">Detail</button>
                            <button class="btn-dish-add" data-id="${food.id}">+ Pesan</button>
                        </div>
                    </div>
                </div>
            `;

            card.querySelector('.dish-visual-box').addEventListener('click', () => openFoodDetail(food.id));
            card.querySelector('.dish-name').addEventListener('click', () => openFoodDetail(food.id));
            card.querySelector('.btn-dish-detail').addEventListener('click', () => openFoodDetail(food.id));

            card.querySelector('.btn-dish-add').addEventListener('click', (e) => {
                e.stopPropagation();
                addToCart(food, 1);
            });

            foodGrid.appendChild(card);
        });
    };

    // --- FOOD DETAIL DIALOG & PAIRINGS ---
    const openFoodDetail = async (foodId) => {
        try {
            const res = await fetch(`/api/foods/${foodId}`);
            if (!res.ok) return;
            const food = await res.json();
            currentDetailFood = food;
            detailQty = 1;

            detailImage.src = food.image_url;
            detailCategoryBadge.textContent = food.category;
            detailJapaneseName.textContent = food.japanese_name || '';
            detailName.textContent = food.name;
            detailRating.textContent = `★ ${food.rating}`;
            detailPrepTime.textContent = `${food.prep_time_min} menit`;
            detailCalories.textContent = `${food.calories} kkal`;
            detailDescription.textContent = food.description;
            detailPrice.textContent = formatRp(food.price);
            detailQtyDisplay.textContent = detailQty;

            // Render tags
            detailTags.innerHTML = '';
            (food.tags || []).forEach(tag => {
                const tagEl = document.createElement('span');
                tagEl.className = 'detail-tag-item';
                tagEl.textContent = tag;
                detailTags.appendChild(tagEl);
            });

            // Fetch pairing recommendations
            detailPairings.innerHTML = '<span style="color: #656978; font-size: 0.78rem;">Memuat pasangan hidangan...</span>';
            const pairRes = await fetch(`/api/ai/recommendations?food_ids=${food.id}`);
            const pairs = await pairRes.json();
            detailPairings.innerHTML = '';

            pairs.forEach(pair => {
                const pCard = document.createElement('div');
                pCard.className = 'pairing-mini-card';
                pCard.innerHTML = `
                    <img src="${pair.image_url}" alt="${pair.name}" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80'">
                    <div class="pairing-mini-info">
                        <h5>${pair.name}</h5>
                        <span>${formatRp(pair.price)}</span>
                    </div>
                `;
                pCard.addEventListener('click', () => openFoodDetail(pair.id));
                detailPairings.appendChild(pCard);
            });

            foodDetailModal.classList.remove('hidden');
        } catch (err) {
            console.error('Error opening food detail:', err);
        }
    };

    closeDetailBtn.addEventListener('click', () => foodDetailModal.classList.add('hidden'));
    foodDetailModal.addEventListener('click', (e) => {
        if (e.target === foodDetailModal) foodDetailModal.classList.add('hidden');
    });

    detailQtyMinus.addEventListener('click', () => {
        if (detailQty > 1) {
            detailQty--;
            detailQtyDisplay.textContent = detailQty;
        }
    });

    detailQtyPlus.addEventListener('click', () => {
        detailQty++;
        detailQtyDisplay.textContent = detailQty;
    });

    detailAddToCartBtn.addEventListener('click', () => {
        if (currentDetailFood) {
            addToCart(currentDetailFood, detailQty);
            foodDetailModal.classList.add('hidden');
        }
    });

    // --- CART FUNCTIONALITY ---
    const addToCart = (food, quantity = 1, notes = '') => {
        if (cart[food.id]) {
            cart[food.id].quantity += quantity;
        } else {
            cart[food.id] = {
                id: food.id,
                name: food.name,
                price: food.price,
                image_url: food.image_url,
                category: food.category,
                quantity: quantity,
                notes: notes
            };
        }
        saveCart();
        showToast(`${food.name} (${quantity} porsi) ditambahkan`);
    };

    const renderCart = () => {
        cartItemsList.innerHTML = '';
        const items = Object.values(cart);

        if (items.length === 0) {
            cartItemsList.innerHTML = `
                <div class="cart-empty-message">
                    <p>Daftar pesanan meja Anda saat ini masih kosong.</p>
                </div>
            `;
            cartSubtotal.textContent = 'Rp 0';
            cartTax.textContent = 'Rp 0';
            cartService.textContent = 'Rp 0';
            cartGrandTotal.textContent = 'Rp 0';
            if (checkoutDirectBtn) {
                checkoutDirectBtn.disabled = true;
                checkoutDirectBtn.style.opacity = '0.5';
            }
            return;
        }

        if (checkoutDirectBtn) {
            checkoutDirectBtn.disabled = false;
            checkoutDirectBtn.style.opacity = '1';
        }

        let subtotal = 0;

        items.forEach(item => {
            const lineTotal = item.price * item.quantity;
            subtotal += lineTotal;

            const row = document.createElement('div');
            row.className = 'cart-dish-row';
            row.innerHTML = `
                <img src="${item.image_url}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80'">
                <div class="cart-dish-meta">
                    <h4 class="cart-dish-name">${item.name}</h4>
                    <span class="cart-dish-price">${formatRp(item.price)}</span>
                    ${item.notes ? `<p class="cart-dish-notes">${item.notes}</p>` : ''}
                </div>
                <div class="cart-controls-col">
                    <div class="cart-stepper">
                        <button class="stepper-btn minus-btn" data-id="${item.id}">−</button>
                        <span class="stepper-val">${item.quantity}</span>
                        <button class="stepper-btn plus-btn" data-id="${item.id}">+</button>
                    </div>
                    <button class="btn-remove-row" data-id="${item.id}">Hapus</button>
                </div>
            `;

            row.querySelector('.minus-btn').addEventListener('click', () => {
                if (cart[item.id].quantity > 1) {
                    cart[item.id].quantity--;
                } else {
                    delete cart[item.id];
                }
                saveCart();
                renderCart();
            });

            row.querySelector('.plus-btn').addEventListener('click', () => {
                cart[item.id].quantity++;
                saveCart();
                renderCart();
            });

            row.querySelector('.btn-remove-row').addEventListener('click', () => {
                delete cart[item.id];
                saveCart();
                renderCart();
            });

            cartItemsList.appendChild(row);
        });

        const tax = Math.round(subtotal * 0.10);
        const service = Math.round(subtotal * 0.05);
        const grandTotal = subtotal + tax + service;

        cartSubtotal.textContent = formatRp(subtotal);
        cartTax.textContent = formatRp(tax);
        cartService.textContent = formatRp(service);
        cartGrandTotal.textContent = formatRp(grandTotal);
    };

    openCartBtn.addEventListener('click', () => {
        renderCart();
        cartDrawer.classList.remove('hidden');
    });

    closeCartBtn.addEventListener('click', () => cartDrawer.classList.add('hidden'));
    cartDrawer.addEventListener('click', (e) => {
        if (e.target === cartDrawer) cartDrawer.classList.add('hidden');
    });

    clearCartBtn.addEventListener('click', () => {
        if (confirm('Kosongkan semua hidangan dari pesanan meja?')) {
            cart = {};
            saveCart();
            renderCart();
            showToast('Daftar pesanan telah dikosongkan');
        }
    });

    modeDineIn.addEventListener('click', () => {
        orderMode = 'dine_in';
        modeDineIn.classList.add('active');
        modeTakeaway.classList.remove('active');
        tableField.classList.remove('hidden');
    });

    modeTakeaway.addEventListener('click', () => {
        orderMode = 'takeaway';
        modeTakeaway.classList.add('active');
        modeDineIn.classList.remove('active');
        tableField.classList.add('hidden');
    });

    // Payment Method Selection Controller (QRIS vs Kasir)
    const setPaymentMethod = (method) => {
        selectedPaymentMethod = method;
        if (method === 'qris') {
            if (payMethodQris) {
                payMethodQris.style.background = 'rgba(197, 160, 89, 0.18)';
                payMethodQris.style.borderColor = 'rgba(197, 160, 89, 0.5)';
            }
            if (payMethodKasir) {
                payMethodKasir.style.background = 'rgba(255, 255, 255, 0.04)';
                payMethodKasir.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            }
            if (checkoutBtnLabel) checkoutBtnLabel.textContent = '📱 Bayar via QRIS & Kirim ke Dapur';
            if (checkoutHelperText) checkoutHelperText.innerHTML = '✅ <strong>Bayar di HP:</strong> Anda bebas antre & <u>tidak perlu ke kasir</u>';
        } else {
            if (payMethodKasir) {
                payMethodKasir.style.background = 'rgba(197, 160, 89, 0.18)';
                payMethodKasir.style.borderColor = 'rgba(197, 160, 89, 0.5)';
            }
            if (payMethodQris) {
                payMethodQris.style.background = 'rgba(255, 255, 255, 0.04)';
                payMethodQris.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            }
            if (checkoutBtnLabel) checkoutBtnLabel.textContent = '🎫 Buat Pesanan & Dapatkan Barcode Kasir';
            if (checkoutHelperText) checkoutHelperText.innerHTML = '💵 <strong>Bayar di Kasir:</strong> Dapatkan barcode untuk di-scan kasir sebelum pesanan dimasak koki';
        }
    };

    if (payMethodQris) {
        payMethodQris.addEventListener('click', () => setPaymentMethod('qris'));
    }
    if (payMethodKasir) {
        payMethodKasir.addEventListener('click', () => setPaymentMethod('kasir'));
    }

    // Fungsi Utama Pengiriman Pesanan ke Database API
    const processOrderSubmission = async (paymentMethod, paymentStatus) => {
        const items = Object.values(cart);
        if (items.length === 0) {
            showToast('Keranjang Anda masih kosong.');
            return false;
        }

        const customerName = customerNameInput.value.trim() || 'Tamu Meja';
        const tableNumber = orderMode === 'dine_in' ? (tableNumberInput.value.trim() || 'Meja Umum') : 'Bungkus / Takeaway';
        const notes = cartNotesInput.value.trim();

        const orderPayload = {
            customer_name: customerName,
            customer_phone: '081234567890',
            order_type: orderMode,
            table_number: tableNumber,
            notes: notes,
            payment_method: paymentMethod,
            payment_status: paymentStatus,
            items: items.map(i => ({
                food_id: i.id,
                quantity: i.quantity,
                notes: i.notes || ''
            }))
        };

        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload)
        });

        if (!res.ok) throw new Error('Gagal memproses pesanan ke server');
        const orderData = await res.json();

        // Banner & Tampilan Header Modal
        const isPaid = paymentStatus === 'lunas';
        const orderSuccessIcon = document.getElementById('orderSuccessIcon');
        const orderSuccessTitle = document.getElementById('orderSuccessTitle');
        const orderSuccessSub = document.getElementById('orderSuccessSub');

        if (isPaid) {
            if (orderSuccessIcon) orderSuccessIcon.innerHTML = '✓';
            if (orderSuccessTitle) orderSuccessTitle.textContent = 'Pesanan Berhasil Terkirim ke Dapur!';
            if (orderSuccessSub) orderSuccessSub.innerHTML = 'Pesanan Anda telah otomatis masuk ke antrean koki Savoria. Anda tidak perlu ke kasir atau memanggil pelayan, hidangan akan diantarkan langsung ke meja Anda.';
            
            receiptBox.innerHTML = `
                <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 8px; padding: 10px 12px; margin-bottom: 12px; text-align: left;">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <strong style="color: #10b981; font-size: 0.88rem;">🟢 LUNAS (QRIS Digital)</strong>
                        <span style="font-size: 0.72rem; background: #10b981; color: #fff; padding: 2px 8px; border-radius: 4px; font-weight: 700;">Bebas Kasir</span>
                    </div>
                    <div style="font-size: 0.76rem; color: #c9ccd6; margin-top: 4px; line-height: 1.4;">
                        🎉 <strong>Anda tidak perlu ke kasir!</strong> Pesanan Anda telah lunas dan sedang dimasak oleh koki. Makanan akan diantar langsung ke meja.
                    </div>
                </div>
                <div class="invoice-row"><strong>No. Nota:</strong> <span style="color: #dfc49f; font-weight: 700;">#${orderData.order_id}</span></div>
                <div class="invoice-row"><strong>Nama Tamu:</strong> <span>${orderData.customer_name}</span></div>
                <div class="invoice-row"><strong>Layanan:</strong> <span style="background: rgba(197, 160, 89, 0.2); color: #d8b26e; padding: 2px 8px; border-radius: 4px; font-weight: 600;">${orderData.order_type === 'dine_in' ? orderData.table_number : 'Takeaway'}</span></div>
                <div class="invoice-items" style="margin: 10px 0; max-height: 140px; overflow-y: auto;">
                    ${orderData.items.map(it => `
                        <div class="invoice-row">
                            <span>${it.quantity}x ${it.name}</span>
                            <span>${formatRp(it.line_total)}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="invoice-row"><span>Subtotal:</span> <span>${formatRp(orderData.subtotal)}</span></div>
                <div class="invoice-row"><span>Pajak Restoran (10%):</span> <span>${formatRp(orderData.tax)}</span></div>
                <div class="invoice-row"><span>Biaya Layanan (5%):</span> <span>${formatRp(orderData.service_fee)}</span></div>
                <div class="invoice-row" style="font-weight: 700; color: #dfc49f; font-size: 1.05rem; margin-top: 0.5rem; padding-top: 6px; border-top: 1px dashed rgba(255,255,255,0.15);">
                    <span>Total Tagihan:</span> <span>${formatRp(orderData.grand_total)}</span>
                </div>
            `;
        } else {
            // TAMPILAN TIKET BARCODE KASIR (HIGH CONTRAST & MUDAH DI-SCAN KASIR)
            if (orderSuccessIcon) orderSuccessIcon.innerHTML = '🎫';
            if (orderSuccessTitle) orderSuccessTitle.textContent = 'Tiket Barcode Pemesanan Kasir';
            if (orderSuccessSub) orderSuccessSub.innerHTML = 'Tunjukkan barcode di bawah ini ke kasir. Pesanan Anda <strong>baru akan dimasak koki setelah kasir memindai (scan) barcode ini</strong> dan menerima pembayaran.';

            receiptBox.innerHTML = `
                <div class="cashier-ticket-card">
                    <div class="cashier-ticket-header">
                        <div class="cashier-ticket-brand">SAVORIA JAPANESE DINING</div>
                        <div class="cashier-ticket-sub">TIKET SCAN PEMESANAN KASIR</div>
                    </div>
                    <div class="cashier-ticket-badge-unpaid">🔴 MENUNGGU SCAN & PEMBAYARAN KASIR</div>
                    <div style="font-size: 0.78rem; color: #4b5563; margin-top: 8px;">
                        Tunjukkan barcode ini ke kasir untuk di-scan:
                    </div>
                    <div class="cashier-ticket-qr-wrap">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(orderData.order_id)}" alt="Barcode Pesanan ${orderData.order_id}">
                    </div>
                    <div class="cashier-ticket-code-row">
                        <span class="cashier-ticket-code">#${orderData.order_id}</span>
                        <button type="button" onclick="navigator.clipboard.writeText('${orderData.order_id}').then(()=>alert('Nomor pesanan disalin!'))" style="background: #111827; color: #fff; border: none; padding: 6px 10px; border-radius: 6px; font-size: 0.72rem; cursor: pointer; font-weight: 600;">📋 Salin</button>
                    </div>
                    <div class="cashier-ticket-instruction">
                        ⚠️ <strong>PERHATIAN:</strong> Koki dapur <u>belum mulai memasak</u> pesanan Anda. Silakan ke kasir sekarang dan tunjukkan barcode ini agar kasir dapat memindai (scan) dan pesanan segera dimasak.
                    </div>
                </div>

                <div class="invoice-row"><strong>Nama Tamu:</strong> <span>${orderData.customer_name}</span></div>
                <div class="invoice-row"><strong>Layanan:</strong> <span style="background: rgba(197, 160, 89, 0.2); color: #d8b26e; padding: 2px 8px; border-radius: 4px; font-weight: 600;">${orderData.order_type === 'dine_in' ? orderData.table_number : 'Takeaway'}</span></div>
                <div class="invoice-items" style="margin: 10px 0; max-height: 120px; overflow-y: auto;">
                    ${orderData.items.map(it => `
                        <div class="invoice-row">
                            <span>${it.quantity}x ${it.name}</span>
                            <span>${formatRp(it.line_total)}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="invoice-row" style="font-weight: 700; color: #dfc49f; font-size: 1.05rem; margin-top: 0.5rem; padding-top: 6px; border-top: 1px dashed rgba(255,255,255,0.15);">
                    <span>Total Tagihan di Kasir:</span> <span>${formatRp(orderData.grand_total)}</span>
                </div>
            `;
        }

        if (successWhatsAppLink) {
            successWhatsAppLink.href = orderData.whatsapp_url;
        }

        cart = {};
        saveCart();
        localStorage.setItem('savoria_last_order_id', orderData.order_id);
        cartDrawer.classList.add('hidden');
        if (qrisPaymentModal) qrisPaymentModal.classList.add('hidden');
        orderSuccessModal.classList.remove('hidden');

        if (isPaid) {
            showToast(`Pesanan #${orderData.order_id} LUNAS & langsung masuk antrean koki!`);
        } else {
            showToast(`Tiket Barcode #${orderData.order_id} dibuat! Tunjukkan ke kasir untuk mulai memasak.`);
        }
        return true;
    };

    // Tombol Kirim Pesanan (Direct Checkout Trigger)
    if (checkoutDirectBtn) {
        checkoutDirectBtn.addEventListener('click', async () => {
            const items = Object.values(cart);
            if (items.length === 0) {
                showToast('Keranjang Anda masih kosong.');
                return;
            }

            const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const tax = Math.round(subtotal * 0.10);
            const service = Math.round(subtotal * 0.05);
            const grandTotal = subtotal + tax + service;

            if (selectedPaymentMethod === 'qris') {
                // Tampilkan Modal QRIS Dinamis
                if (qrisAmountDisplay) qrisAmountDisplay.textContent = formatRp(grandTotal);
                if (qrisCodeImage) {
                    const qrData = `00020101021226610014ID.GO.QRIS.WWW01189360000000000000000215ID102026888SAVO52045812530336054${String(grandTotal).padStart(6, '0')}5802ID5918SAVORIA RESTAURANT6007JAKARTA6304`;
                    qrisCodeImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`;
                }
                cartDrawer.classList.add('hidden');
                if (qrisPaymentModal) qrisPaymentModal.classList.remove('hidden');
            } else {
                // Bayar di Kasir: Buat tiket pemesanan berstatus menunggu_kasir
                try {
                    checkoutDirectBtn.disabled = true;
                    checkoutDirectBtn.innerHTML = `<span>⏳ Membuat Tiket Barcode...</span>`;
                    await processOrderSubmission('kasir', 'belum_bayar');
                } catch (err) {
                    console.error(err);
                    alert('Terjadi kendala saat memproses tiket pesanan kasir.');
                } finally {
                    checkoutDirectBtn.disabled = false;
                    checkoutDirectBtn.innerHTML = `<span id="checkoutBtnLabel">🎫 Buat Pesanan & Dapatkan Barcode Kasir</span>`;
                }
            }
        });
    }

    // Handler Konfirmasi Pembayaran QRIS Sukses
    if (confirmQrisPaidBtn) {
        confirmQrisPaidBtn.addEventListener('click', async () => {
            try {
                confirmQrisPaidBtn.disabled = true;
                confirmQrisPaidBtn.textContent = '⏳ Memproses Pembayaran...';
                await processOrderSubmission('qris', 'lunas');
            } catch (err) {
                console.error(err);
                alert('Gagal mengonfirmasi pembayaran QRIS.');
            } finally {
                confirmQrisPaidBtn.disabled = false;
                confirmQrisPaidBtn.textContent = '✓ Konfirmasi / Simulasi Bayar Berhasil';
            }
        });
    }

    // Handler Batal QRIS / Beralih ke Kasir
    if (cancelQrisBtn) {
        cancelQrisBtn.addEventListener('click', () => {
            if (qrisPaymentModal) qrisPaymentModal.classList.add('hidden');
            setPaymentMethod('kasir');
            cartDrawer.classList.remove('hidden');
            showToast('Metode dialihkan ke Bayar di Kasir');
        });
    }

    closeSuccessBtn.addEventListener('click', () => orderSuccessModal.classList.add('hidden'));

    // --- CUSTOMER ORDER TRACKING CONTROLLER ---
    const openTrackingModal = (orderIdToTrack = '') => {
        const id = orderIdToTrack || localStorage.getItem('savoria_last_order_id') || '';
        if (trackOrderIdInput) trackOrderIdInput.value = id;
        if (trackOrderModal) trackOrderModal.classList.remove('hidden');
        if (id) {
            executeTrackOrder(id);
        } else if (trackOrderResult) {
            trackOrderResult.style.display = 'none';
        }
    };

    const closeTrackingModal = () => {
        if (trackOrderModal) trackOrderModal.classList.add('hidden');
        if (trackPollingTimer) {
            clearInterval(trackPollingTimer);
            trackPollingTimer = null;
        }
    };

    const executeTrackOrder = async (orderId) => {
        const cleanId = (orderId || '').trim();
        if (!cleanId) {
            showToast('Silakan masukkan ID pesanan');
            return;
        }

        if (searchTrackOrderBtn) {
            searchTrackOrderBtn.disabled = true;
            searchTrackOrderBtn.textContent = 'Mencari...';
        }

        try {
            const res = await fetch(`/api/orders/${cleanId}`);
            if (!res.ok) {
                if (trackOrderResult) {
                    trackOrderResult.style.display = 'block';
                    trackOrderResult.innerHTML = `
                        <div class="track-status-banner track-banner-dibatalkan">
                            <span>⚠️ Pesanan dengan nomor <strong>#${cleanId}</strong> tidak ditemukan. Pastikan nomor pesanan sesuai nota Anda.</span>
                        </div>
                    `;
                }
                if (trackPollingTimer) {
                    clearInterval(trackPollingTimer);
                    trackPollingTimer = null;
                }
                return;
            }

            const order = await res.json();
            renderTrackingDetails(order);

            // Auto-polling jika pesanan masih dalam antrean atau sedang dimasak
            if (['menunggu', 'dimasak'].includes(order.status)) {
                if (!trackPollingTimer) {
                    trackPollingTimer = setInterval(() => {
                        executeTrackOrder(cleanId);
                    }, 4000);
                }
            } else {
                if (trackPollingTimer) {
                    clearInterval(trackPollingTimer);
                    trackPollingTimer = null;
                }
            }
        } catch (err) {
            console.error('Error tracking order:', err);
        } finally {
            if (searchTrackOrderBtn) {
                searchTrackOrderBtn.disabled = false;
                searchTrackOrderBtn.textContent = 'Cari Status';
            }
        }
    };

    const renderTrackingDetails = (order) => {
        if (!trackOrderResult) return;
        trackOrderResult.style.display = 'block';

        let progressWidth = '15%';
        let step1Class = 'track-step active current';
        let step2Class = 'track-step';
        let step3Class = 'track-step';
        let bannerClass = 'track-banner-menunggu';
        let bannerIcon = '⏳';
        let bannerText = 'Pesanan Diterima — Menunggu giliran dapur untuk dimasak.';

        if (order.status === 'dimasak') {
            progressWidth = '50%';
            step1Class = 'track-step active completed';
            step2Class = 'track-step active current';
            bannerClass = 'track-banner-dimasak';
            bannerIcon = '👨‍🍳';
            bannerText = 'Sedang Dimasak — Chef Savoria sedang meracik hidangan istimewa Anda.';
        } else if (order.status === 'selesai') {
            progressWidth = '100%';
            step1Class = 'track-step active completed';
            step2Class = 'track-step active completed';
            step3Class = 'track-step active completed';
            bannerClass = 'track-banner-selesai';
            bannerIcon = '✨';
            bannerText = 'Selesai — Hidangan siap disajikan ke meja Anda! Selamat menikmati.';
        } else if (order.status === 'dibatalkan') {
            progressWidth = '0%';
            bannerClass = 'track-banner-dibatalkan';
            bannerIcon = '❌';
            bannerText = 'Pesanan Dibatalkan. Hubungi pelayan restoran jika ada kekeliruan.';
        }

        const isDineIn = order.order_type === 'dine_in';
        const serviceLabel = isDineIn ? `Makan di Tempat (${order.table_number || '-'})` : 'Bungkus / Takeaway';

        const itemsHtml = (order.items || []).map(it => `
            <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                <span>${it.quantity}x <strong>${it.food_name || it.name}</strong></span>
                <span style="color: #dfc49f;">${formatRp(it.line_total)}</span>
            </div>
        `).join('');

        trackOrderResult.innerHTML = `
            <div class="track-status-banner ${bannerClass}">
                <span style="font-size: 1.4rem;">${bannerIcon}</span>
                <div>
                    <div style="font-weight: 700; letter-spacing: 0.04em;">STATUS: ${order.status.toUpperCase()}</div>
                    <div style="font-size: 0.8rem; opacity: 0.9; margin-top: 2px;">${bannerText}</div>
                </div>
            </div>

            ${order.status !== 'dibatalkan' ? `
                <div class="track-stepper">
                    <div class="track-stepper-progress" style="width: ${progressWidth};"></div>
                    <div class="${step1Class}">
                        <div class="track-step-circle">1</div>
                        <span class="track-step-title">Diterima</span>
                    </div>
                    <div class="${step2Class}">
                        <div class="track-step-circle">2</div>
                        <span class="track-step-title">Dimasak</span>
                    </div>
                    <div class="${step3Class}">
                        <div class="track-step-circle">3</div>
                        <span class="track-step-title">Selesai</span>
                    </div>
                </div>
            ` : ''}

            <div class="track-items-summary">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.82rem; color: #8e94a5;">
                    <span>No. Nota: <strong style="color: #fff;">#${order.order_id}</strong></span>
                    <span>${serviceLabel}</span>
                </div>
                <div style="margin-bottom: 8px; font-size: 0.82rem; color: #8e94a5;">
                    Tamu: <strong style="color: #fff;">${order.customer_name}</strong>
                </div>
                <div style="margin-bottom: 8px; font-size: 0.82rem; color: #8e94a5;">
                    Pembayaran: ${order.payment_status === 'lunas' 
                        ? `<span style="color: #10b981; font-weight: 700;">🟢 LUNAS (${order.payment_method === 'qris' ? 'QRIS Digital' : 'Kasir'}) • Bebas ke kasir</span>` 
                        : `<span style="color: #fbbf24; font-weight: 700;">🟡 BELUM BAYAR (Kasir) • Bayar setelah makan</span>`}
                </div>
                <div style="margin-top: 8px;">
                    ${itemsHtml}
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(255,255,255,0.1); font-weight: 700; color: #d8b26e;">
                    <span>Total Pembayaran:</span>
                    <span>${formatRp(order.grand_total)}</span>
                </div>
            </div>
        `;
    };

    if (openTrackBtn) openTrackBtn.addEventListener('click', () => openTrackingModal());
    if (trackFromReceiptBtn) trackFromReceiptBtn.addEventListener('click', () => {
        orderSuccessModal.classList.add('hidden');
        openTrackingModal();
    });
    if (closeTrackModalBtn) closeTrackModalBtn.addEventListener('click', closeTrackingModal);
    if (trackOrderModal) trackOrderModal.addEventListener('click', (e) => {
        if (e.target === trackOrderModal) closeTrackingModal();
    });
    if (searchTrackOrderBtn) searchTrackOrderBtn.addEventListener('click', () => {
        executeTrackOrder(trackOrderIdInput.value);
    });
    if (trackOrderIdInput) trackOrderIdInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') executeTrackOrder(trackOrderIdInput.value);
    });

    // --- SHORTCUTS TO SET MENU PLANNER ---
    if (floatingComboBtn) {
        floatingComboBtn.addEventListener('click', () => {
            comboModal.classList.remove('hidden');
        });
    }

    if (openComboFromEmptyBtn) {
        openComboFromEmptyBtn.addEventListener('click', () => {
            comboModal.classList.remove('hidden');
        });
    }

    // --- SET MENU PLANNER ---
    openComboBtn.addEventListener('click', () => {
        comboModal.classList.remove('hidden');
    });

    closeComboBtn.addEventListener('click', () => comboModal.classList.add('hidden'));
    comboModal.addEventListener('click', (e) => {
        if (e.target === comboModal) comboModal.classList.add('hidden');
    });

    comboBudgetSlider.addEventListener('input', (e) => {
        comboBudgetInput.value = e.target.value;
    });

    comboBudgetInput.addEventListener('input', (e) => {
        comboBudgetSlider.value = e.target.value;
    });

    generateComboBtn.addEventListener('click', async () => {
        const budget = parseInt(comboBudgetInput.value) || 100000;
        const peopleCount = parseInt(comboPeopleSelect.value) || 1;
        const preference = comboTasteSelect.value;

        generateComboBtn.disabled = true;
        generateComboBtn.textContent = 'Menyusun Set Menu...';

        try {
            const res = await fetch('/api/ai/smart-combo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    budget: budget,
                    people_count: peopleCount,
                    preference: preference,
                    is_halal: true,
                    is_vegetarian: false
                })
            });

            if (!res.ok) throw new Error('Gagal menyusun set menu');
            const data = await res.json();
            activeComboItems = data.items;

            comboResultTitle.textContent = data.combo_name;
            comboResultDesc.textContent = data.description;
            comboTotalPrice.textContent = formatRp(data.total_price);
            comboSavingsBadge.textContent = data.savings > 0 ? `Sisa: ${formatRp(data.savings)}` : 'Sesuai Anggaran';
            comboTotalCalories.textContent = `${data.total_calories} kkal`;

            comboItemsList.innerHTML = '';
            data.items.forEach(it => {
                const row = document.createElement('div');
                row.className = 'result-item-row';
                row.innerHTML = `
                    <img src="${it.image_url}" alt="${it.name}" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80'">
                    <div class="result-item-meta">
                        <h5>${it.name}</h5>
                        <span>${it.category} • ${it.calories} kkal</span>
                    </div>
                    <span class="result-item-price">${formatRp(it.price)}</span>
                `;
                comboItemsList.appendChild(row);
            });

            comboResultBox.classList.remove('hidden');
        } catch (err) {
            console.error('Planner error:', err);
            alert('Gagal menyusun rekomendasi paket.');
        } finally {
            generateComboBtn.disabled = false;
            generateComboBtn.textContent = 'Susun Rekomendasi Set Menu';
        }
    });

    addAllComboToCartBtn.addEventListener('click', () => {
        if (!activeComboItems || activeComboItems.length === 0) return;
        activeComboItems.forEach(it => {
            addToCart(it, 1, 'Pilihan Set Menu');
        });
        comboModal.classList.add('hidden');
        renderCart();
        cartDrawer.classList.remove('hidden');
        showToast('Seluruh set hidangan dimasukkan ke pesanan meja');
    });

    // --- SEARCH, FILTERS & SORTING ---
    searchInput.addEventListener('input', (e) => {
        activeFilters.query = e.target.value.trim();
        if (activeFilters.query.length > 0) {
            clearSearchBtn.classList.remove('hidden');
            resultsTitle.textContent = `Hasil pencarian "${activeFilters.query}"`;
        } else {
            clearSearchBtn.classList.add('hidden');
            resultsTitle.textContent = activeFilters.category ? `Kategori ${activeFilters.category}` : 'Daftar Hidangan Pilihan';
        }

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(fetchFoods, 300);
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        activeFilters.query = '';
        clearSearchBtn.classList.add('hidden');
        resultsTitle.textContent = activeFilters.category ? `Kategori ${activeFilters.category}` : 'Daftar Hidangan Pilihan';
        fetchFoods();
        searchInput.focus();
    });

    categoryTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            categoryTabs.forEach(t => t.classList.remove('active'));
            e.currentTarget.classList.add('active');
            activeFilters.category = e.currentTarget.dataset.category;
            resultsTitle.textContent = activeFilters.category ? `Kategori ${activeFilters.category}` : 'Daftar Hidangan Pilihan';
            fetchFoods();
        });
    });

    filterHalalBtn.addEventListener('click', () => {
        const isActive = filterHalalBtn.classList.toggle('active');
        activeFilters.is_halal = isActive ? true : null;
        fetchFoods();
    });

    filterSpicyBtn.addEventListener('click', () => {
        const isActive = filterSpicyBtn.classList.toggle('active');
        activeFilters.is_spicy = isActive ? true : null;
        fetchFoods();
    });

    filterVegBtn.addEventListener('click', () => {
        const isActive = filterVegBtn.classList.toggle('active');
        activeFilters.is_vegetarian = isActive ? true : null;
        fetchFoods();
    });

    sortBySelect.addEventListener('change', (e) => {
        activeFilters.sort_by = e.target.value;
        fetchFoods();
    });

    resetFiltersBtn.addEventListener('click', () => {
        searchInput.value = '';
        activeFilters.query = '';
        activeFilters.category = '';
        activeFilters.is_halal = null;
        activeFilters.is_vegetarian = null;
        activeFilters.is_spicy = null;
        activeFilters.sort_by = 'popular';

        categoryTabs.forEach((t, idx) => t.classList.toggle('active', idx === 0));
        filterHalalBtn.classList.remove('active');
        filterSpicyBtn.classList.remove('active');
        filterVegBtn.classList.remove('active');
        sortBySelect.value = 'popular';
        clearSearchBtn.classList.add('hidden');
        resultsTitle.textContent = 'Daftar Hidangan Pilihan';
        fetchFoods();
    });

    document.getElementById('brandLogo').addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // --- HERO SECTION INTERACTIONS ---
    const heroConciergeTrigger = document.getElementById('heroConciergeTrigger');
    const heroPlannerTrigger = document.getElementById('heroPlannerTrigger');
    const heroScrollMenuBtn = document.getElementById('heroScrollMenuBtn');
    const quickDishTags = document.querySelectorAll('.quick-dish-tag');

    if (heroConciergeTrigger && openChatBtn) {
        heroConciergeTrigger.addEventListener('click', () => openChatBtn.click());
    }

    if (heroPlannerTrigger && openComboBtn) {
        heroPlannerTrigger.addEventListener('click', () => openComboBtn.click());
    }

    if (heroScrollMenuBtn) {
        heroScrollMenuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.getElementById('menuCatalogSection');
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    quickDishTags.forEach(tag => {
        tag.addEventListener('click', () => {
            const query = tag.getAttribute('data-search');
            if (query && searchInput) {
                searchInput.value = query;
                searchInput.dispatchEvent(new Event('input'));
                searchInput.focus();
                const catalog = document.getElementById('menuControlToolbar') || document.getElementById('menuCatalogSection');
                if (catalog) {
                    catalog.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    // Hero Spotlight Dish Switcher (Synchronized with Restaurant Catalog)
    const showcaseDishes = {
        wagyu: {
            id: 4,
            title: "Wagyu Beef Donburi",
            jp: "和牛焼肉丼 • Tender Meltique & Onsen Egg",
            kanji: "和牛焼肉",
            tag: "Paling Diminati",
            price: 85000,
            desc: "Irisan tipis daging sapi Wagyu meltique lembut dalam karamel tare manis gurih, wijen sangrai, dan onsen egg lumer.",
            img: "/static/images/wagyu_don.jpg",
            category: "HIDANGAN UTAMA",
            pairing: "Sandingkan Wagyu Donburi dengan Authentic Iced Matcha Latte untuk perpaduan umami optimal."
        },
        ramen: {
            id: 1,
            title: "Tonkotsu Ramen Spesial",
            jp: "特製豚骨ラーメン • 12-Hour Rich Broth & Chashu",
            kanji: "特製豚骨",
            tag: "Best Seller Tokyo",
            price: 58000,
            desc: "Ramen kuah kaldu tulang gurih kaya rasa dimasak 12 jam, chashu lembut, tamago setengah matang, nori renyah, & jamur kuping.",
            img: "/static/images/ramen.jpg",
            category: "HIDANGAN UTAMA",
            pairing: "Padukan Tonkotsu Ramen dengan Sencha Green Tea hangat untuk membilas rasa gurih kaldu."
        },
        sushi: {
            id: 2,
            title: "Salmon Sushi & Sashimi Platter",
            jp: "サーモン 寿司 盛り合わせ • Fresh Norwegian Salmon",
            kanji: "寿司盛合",
            tag: "Chef Recommendation",
            price: 75000,
            desc: "Kombinasi sushi nigiri salmon segar Norwegia, sashimi tuna maguro grade A, dan salmon avocado roll dengan saus wasabi mayo.",
            img: "/static/images/sushi.jpg",
            category: "HIDANGAN UTAMA",
            pairing: "Nikmati bersama Yuzu Sparkling Mint Cooler untuk sensasi sitrus menyegarkan."
        }
    };

    let activeHeroDishKey = 'wagyu';
    const heroSpotlightImg = document.getElementById('heroSpotlightImg');
    const heroSpotlightKanji = document.getElementById('heroSpotlightKanji');
    const heroSpotlightTag = document.getElementById('heroSpotlightTag');
    const heroSpotlightTitle = document.getElementById('heroSpotlightTitle');
    const heroSpotlightJp = document.getElementById('heroSpotlightJp');
    const heroSpotlightPrice = document.getElementById('heroSpotlightPrice');
    const heroSpotlightDesc = document.getElementById('heroSpotlightDesc');
    const heroSpotlightCategory = document.getElementById('heroSpotlightCategory');
    const heroPairingTip = document.getElementById('heroPairingTip');
    const heroDetailTrigger = document.getElementById('heroDetailTrigger');
    const heroAddOrderTrigger = document.getElementById('heroAddOrderTrigger');
    const switcherItems = document.querySelectorAll('.switcher-item');

    const updateHeroShowcase = (key) => {
        const dish = showcaseDishes[key];
        if (!dish || !heroSpotlightImg) return;
        activeHeroDishKey = key;

        heroSpotlightImg.style.opacity = '0.2';
        setTimeout(() => {
            heroSpotlightImg.src = dish.img;
            heroSpotlightImg.alt = dish.title;
            heroSpotlightImg.style.opacity = '1';
        }, 150);

        if (heroSpotlightKanji) heroSpotlightKanji.textContent = dish.kanji;
        if (heroSpotlightTag) heroSpotlightTag.textContent = dish.tag;
        if (heroSpotlightTitle) heroSpotlightTitle.textContent = dish.title;
        if (heroSpotlightJp) heroSpotlightJp.textContent = dish.jp;
        if (heroSpotlightPrice) heroSpotlightPrice.textContent = formatRp(dish.price);
        if (heroSpotlightDesc) heroSpotlightDesc.textContent = dish.desc;
        if (heroSpotlightCategory) heroSpotlightCategory.textContent = dish.category;
        if (heroPairingTip) heroPairingTip.textContent = dish.pairing;

        switcherItems.forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-dish') === key);
        });
    };

    switcherItems.forEach(item => {
        item.addEventListener('click', () => {
            const key = item.getAttribute('data-dish');
            if (key) updateHeroShowcase(key);
        });
    });

    if (heroDetailTrigger) {
        heroDetailTrigger.addEventListener('click', () => {
            const dish = showcaseDishes[activeHeroDishKey];
            if (dish) openFoodDetail(dish.id);
        });
    }

    if (heroAddOrderTrigger) {
        heroAddOrderTrigger.addEventListener('click', () => {
            const dish = showcaseDishes[activeHeroDishKey];
            if (!dish) return;
            const targetFood = foodsData.find(f => f.id === dish.id) || {
                id: dish.id,
                name: dish.title,
                price: dish.price,
                image_url: dish.img,
                category: dish.category
            };
            addToCart(targetFood, 1);
        });
    }

    // --- QR CODE URL PARAMETER DETECTOR ---
    const parseTableFromUrl = () => {
        const urlParams = new URLSearchParams(window.location.search);
        let tableParam = urlParams.get('table') || urlParams.get('meja');
        let modeParam = urlParams.get('mode');

        // Jika ada di session storage (misal setelah refresh)
        if (!tableParam && !modeParam) {
            tableParam = sessionStorage.getItem('savoria_table_qr');
            modeParam = sessionStorage.getItem('savoria_mode_qr');
        }

        const tableIndicatorBadge = document.getElementById('tableIndicatorBadge');
        const tableIndicatorText = document.getElementById('tableIndicatorText');
        const tableLockBadge = document.getElementById('tableLockBadge');

        if (tableParam) {
            let cleanVal = tableParam.trim();
            let formattedTable = cleanVal;
            // Jika hanya angka (misal: "5" atau "05")
            if (/^\d+$/.test(cleanVal)) {
                formattedTable = `Meja ${cleanVal.padStart(2, '0')}`;
            } else if (!cleanVal.toLowerCase().startsWith('meja')) {
                formattedTable = `Meja ${cleanVal}`;
            }

            sessionStorage.setItem('savoria_table_qr', formattedTable);
            sessionStorage.removeItem('savoria_mode_qr');

            orderMode = 'dine_in';
            if (modeDineIn) modeDineIn.classList.add('active');
            if (modeTakeaway) modeTakeaway.classList.remove('active');
            if (tableField) tableField.classList.remove('hidden');

            if (tableNumberInput) {
                tableNumberInput.value = formattedTable;
                tableNumberInput.readOnly = true;
                tableNumberInput.style.background = 'rgba(197, 160, 89, 0.12)';
                tableNumberInput.style.borderColor = 'rgba(197, 160, 89, 0.45)';
                tableNumberInput.style.color = '#dfc49f';
                tableNumberInput.style.fontWeight = '700';
            }

            if (tableLockBadge) tableLockBadge.style.display = 'inline-block';
            if (tableIndicatorBadge && tableIndicatorText) {
                tableIndicatorText.textContent = formattedTable;
                tableIndicatorBadge.style.display = 'inline-flex';
            }

            showToast(`Selamat datang di ${formattedTable}! Silakan pilih menu langsung.`);
        } else if (modeParam === 'takeaway') {
            sessionStorage.setItem('savoria_mode_qr', 'takeaway');
            sessionStorage.removeItem('savoria_table_qr');

            orderMode = 'takeaway';
            if (modeTakeaway) modeTakeaway.classList.add('active');
            if (modeDineIn) modeDineIn.classList.remove('active');
            if (tableField) tableField.classList.add('hidden');

            if (tableIndicatorBadge && tableIndicatorText) {
                tableIndicatorText.textContent = '🛍️ Bungkus / Takeaway';
                tableIndicatorBadge.style.display = 'inline-flex';
            }

            showToast('Mode Bungkus (Takeaway) aktif.');
        }
    };

    // --- INITIALIZE ---
    parseTableFromUrl();
    updateCartBadge();
    fetchFoods();
});
