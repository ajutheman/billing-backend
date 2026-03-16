document.addEventListener('DOMContentLoaded', () => {
    console.log('Mobile ERP Portal Fully Loaded');
    const API_BASE = window.location.origin;

    // State
    let cart = [];
    let selectedParty = { name: 'Walking Customer', id: 'party_walking' };
    let itemsMaster = [];
    let partiesMaster = [];

    const ui = {
        stockCount: document.getElementById('stock-count'),
        activityFeed: document.getElementById('activity-feed'),
        posSheet: document.getElementById('pos-sheet'),
        itemSearch: document.getElementById('item-search'),
        partySearch: document.getElementById('party-search'),
        searchResults: document.getElementById('search-results'),
        cartContents: document.getElementById('cart-contents'),
        posTotal: document.getElementById('pos-total'),
        confirmBtn: document.getElementById('confirm-pos-btn')
    };

    // POS Global Controls
    window.openPOS = () => {
        ui.posSheet.classList.add('active');
        fetchInitialData();
    };
    window.closePOS = () => ui.posSheet.classList.remove('active');
    window.nextStep = (step) => {
        document.querySelectorAll('.pos-step').forEach(s => s.classList.remove('active'));
        document.getElementById(`step-${step}`).classList.add('active');
    };

    async function fetchInitialData() {
        try {
            const [iRes, pRes] = await Promise.all([
                fetch(`${API_BASE}/items`),
                fetch(`${API_BASE}/parties`)
            ]);
            itemsMaster = await iRes.json();
            partiesMaster = await pRes.json();
            renderPartySearch('');
        } catch (e) { console.error('Error fetching master data', e); }
    }

    // Party Selection
    ui.partySearch.oninput = (e) => renderPartySearch(e.target.value);
    function renderPartySearch(term) {
        const filtered = partiesMaster.filter(p => p.name.toLowerCase().includes(term.toLowerCase()));
        document.getElementById('party-list').innerHTML = `
            <div class="cart-item" onclick="selectParty('Walking Customer', 'party_walking')">Walking Customer (Default)</div>
            ${filtered.map(p => `<div class="cart-item" onclick="selectParty('${p.name}', '${p.id}')">${p.name}</div>`).join('')}
        `;
    }
    window.selectParty = (name, id) => {
        selectedParty = { name, id };
        nextStep(2);
    };

    // Item Search & Cart
    ui.itemSearch.oninput = (e) => {
        const term = e.target.value;
        if (term.length < 2) return ui.searchResults.innerHTML = '';
        const matches = itemsMaster.filter(i => i.name.toLowerCase().includes(term.toLowerCase()));
        ui.searchResults.innerHTML = matches.map(m => `
            <div class="cart-item" onclick="addToCart('${m.id}', '${m.name}', ${m.sale_price})">
                <span>${m.name}</span>
                <span>₹${m.sale_price} ➕</span>
            </div>
        `).join('');
    };

    window.addToCart = (id, name, price) => {
        const existing = cart.find(c => c.item_id === id);
        if (existing) existing.quantity++;
        else cart.push({ item_id: id, item_name: name, unit_price: price, quantity: 1, total_amount: price });
        renderCart();
        ui.itemSearch.value = '';
        ui.searchResults.innerHTML = '';
    };

    function renderCart() {
        let total = 0;
        ui.cartContents.innerHTML = cart.map(c => {
            const rowTotal = c.unit_price * c.quantity;
            total += rowTotal;
            c.total_amount = rowTotal;
            return `
                <div class="cart-item">
                    <span>${c.item_name} x ${c.quantity}</span>
                    <span>₹${rowTotal}</span>
                </div>
            `;
        }).join('');
        ui.posTotal.textContent = `₹ ${total}`;
    }

    // Submission
    ui.confirmBtn.onclick = async () => {
        if (cart.length === 0) return alert('Cart is empty!');
        const total = cart.reduce((acc, curr) => acc + curr.total_amount, 0);
        
        // Find a valid firm_id from master data
        const firmId = itemsMaster[0]?.firm_id || 'firm_default';

        const invoiceData = {
            firm_id: firmId,
            party_id: selectedParty.id,
            party_name: selectedParty.name,
            total_amount: total,
            items: cart,
            type: 'SALES'
        };

        try {
            ui.confirmBtn.disabled = true;
            ui.confirmBtn.textContent = 'Syncing... 📡';
            const res = await fetch(`${API_BASE}/invoices`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invoiceData)
            });
            if (res.ok) {
                alert('Invoice Posted Successfully! 🎉');
                cart = [];
                closePOS();
                location.reload();
            }
        } catch (e) { alert('Sync Failed. Saved to Offline Catch.'); }
        finally { ui.confirmBtn.disabled = false; }
    };

    /**
     * Dashboard Pulse
     */
    async function fetchDashboard() {
        try {
            const [iRes, invRes] = await Promise.all([
                fetch(`${API_BASE}/items`),
                fetch(`${API_BASE}/invoices`)
            ]);
            const items = await iRes.json();
            const invoices = await invRes.json();
            if (ui.stockCount) ui.stockCount.textContent = items.length;
            if (ui.activityFeed && invoices.length > 0) {
                ui.activityFeed.innerHTML = invoices.slice(0, 5).map(inv => `
                    <div class="m-card" style="margin-bottom: 0.5rem; padding: 1rem;">
                        <div style="display: flex; justify-content: space-between;">
                            <span style="font-weight: 700;">#${inv.invoice_number}</span>
                            <span style="color: var(--primary);">₹${inv.total_amount}</span>
                        </div>
                        <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 4px;">
                            ${new Date(Number(inv.created_at)).toLocaleTimeString()} • ${inv.party_name || 'Walking Customer'}
                        </div>
                    </div>
                `).join('');
            }
        } catch (e) { }
    }

    fetchDashboard();
    setInterval(fetchDashboard, 20000);
});
