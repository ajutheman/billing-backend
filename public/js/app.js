document.addEventListener('DOMContentLoaded', () => {
    console.log('ERP Intelligence Dashboard Initialized');
    
    // Core API Base
    const API_BASE = window.location.origin;

    // UI Element Selectors
    const ui = {
        resntTransactions: document.getElementById('recent-transactions'),
        inventoryList: document.getElementById('inventory-list'),
        firmCount: document.getElementById('firm-count'),
        invoiceCount: document.getElementById('invoice-count')
    };

    // Modal Global Functions
    window.openModal = (id) => document.getElementById(id).classList.add('active');
    window.closeModal = (id) => document.getElementById(id).classList.remove('active');

    /**
     * Toast System
     */
    function showToast(msg, type = 'success') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; 
            padding: 1rem 2rem; border-radius: 12px; z-index: 9999;
            background: ${type === 'success' ? 'var(--success-color)' : '#f87171'};
            color: white; box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            animation: fadeIn 0.3s ease forwards;
        `;
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    /**
     * Form Handlers
     */
    document.getElementById('firm-form').onsubmit = async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        try {
            const res = await fetch(`${API_BASE}/firms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                showToast('Branch registered successfully!');
                closeModal('firm-modal');
                updateFirms();
                e.target.reset();
            }
        } catch (e) { showToast('Error saving branch', 'error'); }
    };

    document.getElementById('item-form').onsubmit = async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        try {
            const res = await fetch(`${API_BASE}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                showToast('Item added to inventory!');
                closeModal('item-modal');
                updateItems();
                e.target.reset();
            }
        } catch (e) { showToast('Error saving item', 'error'); }
    };

    document.getElementById('party-form').onsubmit = async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        try {
            const res = await fetch(`${API_BASE}/parties`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                showToast('Party registered successfully!');
                closeModal('party-modal');
                e.target.reset();
            }
        } catch (e) { showToast('Error saving party', 'error'); }
    };

    /**
     * Fetch and Update Firms
     */
    async function updateFirms() {
        try {
            const res = await fetch(`${API_BASE}/firms`);
            const firms = await res.json();
            if (Array.isArray(firms)) {
                if (constSelectors.firmCount) constSelectors.firmCount.textContent = firms.length;
            }
        } catch (e) { console.error('Firms Fetch Error:', e); }
    }

    /**
     * Fetch and Update Invoices
     */
    async function updateInvoices() {
        try {
            const res = await fetch(`${API_BASE}/invoices`);
            const invoices = await res.json();
            if (Array.isArray(invoices)) {
                if (constSelectors.invoiceCount) constSelectors.invoiceCount.textContent = invoices.length;
                
                // Populate Table
                if (constSelectors.resntTransactions) {
                    constSelectors.resntTransactions.innerHTML = invoices.slice(0, 5).map(inv => `
                        <tr>
                            <td>#${inv.id.split('_')[1] || inv.id}</td>
                            <td>${inv.party_name || 'Generic Sale'}</td>
                            <td>₹ ${inv.total_amount.toLocaleString()}</td>
                            <td><span class="badge badge-blue">SUCCESS</span></td>
                            <td>${new Date(Number(inv.created_at)).toLocaleTimeString()}</td>
                        </tr>
                    `).join('');
                }
            }
        } catch (e) { console.error('Invoices Fetch Error:', e); }
    }

    /**
     * Fetch and Update Items
     */
    async function updateItems() {
        try {
            const res = await fetch(`${API_BASE}/items`);
            const items = await res.json();
            if (Array.isArray(items) && constSelectors.inventoryList) {
                constSelectors.inventoryList.innerHTML = items.slice(0, 3).map(item => `
                    <div style="margin-bottom: 1rem; border-bottom: 1px solid var(--card-border); padding-bottom: 0.5rem;">
                        <div style="display: flex; justify-content: space-between;">
                            <span>${item.name}</span>
                            <span style="color: ${item.stock_quantity > 10 ? 'var(--success-color)' : '#f87171'}">${item.stock_quantity} ${item.unit || 'pcs'}</span>
                        </div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary)">SKU: ${item.sku || 'N/A'}</div>
                    </div>
                `).join('');
            }
        } catch (e) { console.error('Items Fetch Error:', e); }
    }

    // Initial Load
    updateFirms();
    updateInvoices();
    updateItems();

    // Polling for "Pulse" effect
    setInterval(() => {
        updateInvoices();
        updateItems();
    }, 30000);
});
