-- Firms Table (Multi-Firm Support)
CREATE TABLE firms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    gstin TEXT,
    pan_number TEXT, -- NEW
    logo_path TEXT,
    signature_path TEXT, -- NEW
    financial_year TEXT,
    invoice_theme TEXT, -- 'classic', 'modern'
    
    -- Bank Details
    bank_name TEXT,
    account_number TEXT,
    ifsc_code TEXT,
    bank_branch TEXT, -- NEW
    upi_id TEXT, -- NEW
    
    -- Preferences
    terms_conditions TEXT,
    default_notes TEXT, -- NEW (Invoice Footer)
    gst_type TEXT DEFAULT 'REGULAR', -- REGULAR, COMPOSITION
    
    created_at INTEGER,
    updated_at INTEGER,
    is_synced INTEGER DEFAULT 0
);

-- Parties Table (Customers & Suppliers)
CREATE TABLE parties (
    id TEXT PRIMARY KEY,
    firm_id TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    contact_person TEXT, -- NEW
    
    -- Tax & Reg
    gstin TEXT,
    pan_number TEXT, -- NEW
    
    -- Address
    address TEXT, -- Billing
    state TEXT, 
    shipping_address TEXT, -- NEW
    
    type TEXT NOT NULL, -- CUSTOMER, SUPPLIER
    
    -- Credit
    credit_limit REAL, -- NEW
    credit_days INTEGER, -- NEW
    opening_balance REAL DEFAULT 0.0,
    balance REAL DEFAULT 0.0, -- Current Balance
    
    created_at INTEGER,
    updated_at INTEGER,
    is_synced INTEGER DEFAULT 0,
    FOREIGN KEY(firm_id) REFERENCES firms(id)
);

-- Items Table (Inventory)
CREATE TABLE items (
    id TEXT PRIMARY KEY,
    firm_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    hsn_code TEXT,
    sku TEXT,
    unit TEXT, -- Box, Pcs, Kg
    category TEXT,
    brand TEXT, -- NEW
    
    -- Pricing
    mrp REAL, -- NEW
    purchase_price REAL,
    sale_price REAL NOT NULL,
    wholesale_price REAL, -- NEW
    dealer_price REAL, -- NEW
    
    -- Tax
    tax_rate REAL DEFAULT 0.0, 
    is_tax_inclusive INTEGER DEFAULT 0, -- NEW (0=False, 1=True)
    
    -- Stock
    stock_quantity REAL DEFAULT 0.0,
    opening_stock REAL DEFAULT 0.0, -- NEW
    low_stock_limit REAL,
    rack_location TEXT, -- NEW
    
    -- Media
    image_path TEXT,
    
    created_at INTEGER,
    updated_at INTEGER,
    is_synced INTEGER DEFAULT 0,
    FOREIGN KEY(firm_id) REFERENCES firms(id)
);

-- Sales / Invoices Table
CREATE TABLE invoices (
    id TEXT PRIMARY KEY,
    firm_id TEXT NOT NULL,
    invoice_number TEXT NOT NULL,
    date INTEGER NOT NULL,
    due_date INTEGER,
    
    party_id TEXT,
    party_name TEXT, 
    party_gstin TEXT, 
    place_of_supply TEXT, 
    
    type TEXT NOT NULL, -- SALE, ESTIMATE, CREDIT_NOTE
    status TEXT, -- PAID, PENDING, CANCELLED
    
    -- Amounts
    subtotal REAL,
    discount_amount REAL, -- Global Discount
    round_off_amount REAL, -- NEW (e.g., +0.45 or -0.12)
    
    total_cgst REAL DEFAULT 0.0,
    total_sgst REAL DEFAULT 0.0,
    total_igst REAL DEFAULT 0.0,
    total_tax_amount REAL,
    
    total_amount REAL NOT NULL, -- Final Grand Total
    balance_due REAL,
    
    -- Transport / Meta
    notes TEXT,
    po_number TEXT, -- NEW
    vehicle_number TEXT, -- NEW
    eway_bill_number TEXT, -- NEW
    transport_name TEXT, -- NEW
    
    created_at INTEGER,
    updated_at INTEGER,
    is_synced INTEGER DEFAULT 0,
    FOREIGN KEY(party_id) REFERENCES parties(id),
    FOREIGN KEY(firm_id) REFERENCES firms(id)
);

-- Invoice Items Table
CREATE TABLE invoice_items (
    id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL,
    item_id TEXT,
    item_name TEXT NOT NULL,
    hsn_code TEXT,
    
    quantity REAL NOT NULL,
    unit_price REAL NOT NULL,
    
    -- Discount
    discount_percent REAL DEFAULT 0.0, -- NEW
    discount_amount REAL DEFAULT 0.0, -- NEW
    
    -- Tax
    tax_rate REAL, 
    is_tax_inclusive INTEGER DEFAULT 0, -- NEW
    cgst_amount REAL DEFAULT 0.0,
    sgst_amount REAL DEFAULT 0.0,
    igst_amount REAL DEFAULT 0.0,
    
    total_amount REAL NOT NULL, -- (Qty * Price) - Disc + Tax (if exclusive)
    
    -- Batch
    batch_id TEXT,
    batch_number TEXT,
    
    FOREIGN KEY(invoice_id) REFERENCES invoices(id),
    FOREIGN KEY(item_id) REFERENCES items(id)
);

-- Accounts Table (Cash & Bank)
CREATE TABLE accounts (
    id TEXT PRIMARY KEY,
    firm_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    account_number TEXT,
    balance REAL DEFAULT 0.0,
    is_default INTEGER DEFAULT 0,
    created_at INTEGER,
    updated_at INTEGER,
    is_synced INTEGER DEFAULT 0,
    FOREIGN KEY(firm_id) REFERENCES firms(id)
);

-- Transactions Table (Payments)
CREATE TABLE transactions (
    id TEXT PRIMARY KEY,
    firm_id TEXT NOT NULL,
    party_id TEXT,
    invoice_id TEXT,
    account_id TEXT,
    amount REAL NOT NULL,
    type TEXT NOT NULL, 
    mode TEXT, 
    date INTEGER NOT NULL,
    notes TEXT,
    created_at INTEGER,
    updated_at INTEGER,
    is_synced INTEGER DEFAULT 0,
    FOREIGN KEY(party_id) REFERENCES parties(id),
    FOREIGN KEY(invoice_id) REFERENCES invoices(id),
    FOREIGN KEY(firm_id) REFERENCES firms(id)
);

-- Users Table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    pin TEXT NOT NULL,
    role TEXT NOT NULL, 
    firm_ids TEXT, 
    created_at INTEGER,
    updated_at INTEGER,
    is_active INTEGER DEFAULT 1
);

-- Online Orders
CREATE TABLE online_orders (
    id TEXT PRIMARY KEY,
    firm_id TEXT NOT NULL,
    customer_name TEXT,
    customer_phone TEXT,
    total_amount REAL,
    status TEXT, 
    items_json TEXT, 
    created_at INTEGER,
    updated_at INTEGER,
    is_synced INTEGER DEFAULT 0,
    FOREIGN KEY(firm_id) REFERENCES firms(id)
);

-- Expenses
CREATE TABLE expense_categories (
    id TEXT PRIMARY KEY,
    firm_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'EXPENSE',
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY(firm_id) REFERENCES firms(id)
);

CREATE TABLE expenses (
    id TEXT PRIMARY KEY,
    firm_id TEXT NOT NULL,
    category_id TEXT,
    amount REAL NOT NULL,
    date INTEGER NOT NULL,
    payment_mode TEXT, 
    notes TEXT,
    related_bill_id TEXT, 
    receipt_path TEXT,
    created_at INTEGER,
    updated_at INTEGER,
    is_synced INTEGER DEFAULT 0,
    FOREIGN KEY(firm_id) REFERENCES firms(id),
    FOREIGN KEY(category_id) REFERENCES expense_categories(id)
);

-- Godowns
CREATE TABLE godowns (
    id TEXT PRIMARY KEY,
    firm_id TEXT NOT NULL,
    name TEXT NOT NULL,
    location TEXT,
    is_default INTEGER DEFAULT 0,
    created_at INTEGER,
    updated_at INTEGER,
    is_synced INTEGER DEFAULT 0,
    FOREIGN KEY (firm_id) REFERENCES firms (id)
);

CREATE TABLE item_stock (
    item_id TEXT NOT NULL,
    godown_id TEXT NOT NULL,
    quantity REAL DEFAULT 0,
    created_at INTEGER,
    updated_at INTEGER,
    is_synced INTEGER DEFAULT 0,
    PRIMARY KEY (item_id, godown_id),
    FOREIGN KEY (item_id) REFERENCES items (id),
    FOREIGN KEY (godown_id) REFERENCES godowns (id)
);

CREATE TABLE stock_transfers (
    id TEXT PRIMARY KEY,
    firm_id TEXT NOT NULL,
    from_godown_id TEXT NOT NULL,
    to_godown_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    quantity REAL NOT NULL,
    date INTEGER NOT NULL,
    notes TEXT,
    user_id TEXT,
    created_at INTEGER,
    updated_at INTEGER,
    is_synced INTEGER DEFAULT 0,
    FOREIGN KEY (firm_id) REFERENCES firms (id),
    FOREIGN KEY (from_godown_id) REFERENCES godowns (id),
    FOREIGN KEY (to_godown_id) REFERENCES godowns (id),
    FOREIGN KEY (item_id) REFERENCES items (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Item Batches
CREATE TABLE item_batches (
    id TEXT PRIMARY KEY,
    firm_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    godown_id TEXT NOT NULL,
    batch_number TEXT NOT NULL,
    expiry_date INTEGER,
    quantity REAL DEFAULT 0,
    mrp REAL,
    created_at INTEGER,
    updated_at INTEGER,
    is_synced INTEGER DEFAULT 0,
    FOREIGN KEY(firm_id) REFERENCES firms(id),
    FOREIGN KEY(item_id) REFERENCES items(id),
    FOREIGN KEY(godown_id) REFERENCES godowns(id)
);

-- Loans
CREATE TABLE loans (
    id TEXT PRIMARY KEY,
    firm_id TEXT NOT NULL,
    party_id TEXT,
    name TEXT NOT NULL,
    type TEXT NOT NULL, 
    principal_amount REAL NOT NULL,
    interest_rate REAL, 
    start_date INTEGER NOT NULL,
    tenure_months INTEGER,
    emi_amount REAL,
    status TEXT DEFAULT 'ACTIVE', 
    created_at INTEGER,
    updated_at INTEGER,
    is_synced INTEGER DEFAULT 0,
    FOREIGN KEY(firm_id) REFERENCES firms(id)
);

CREATE TABLE emi_schedule (
    id TEXT PRIMARY KEY,
    loan_id TEXT NOT NULL,
    emi_number INTEGER NOT NULL,
    due_date INTEGER NOT NULL,
    amount REAL NOT NULL,
    principal_component REAL,
    interest_component REAL,
    status TEXT DEFAULT 'PENDING', 
    paid_date INTEGER,
    transaction_id TEXT,
    created_at INTEGER,
    updated_at INTEGER,
    is_synced INTEGER DEFAULT 0,
    FOREIGN KEY(loan_id) REFERENCES loans(id)
);

-- Settings
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- Sales Returns
CREATE TABLE sales_returns (
    id TEXT PRIMARY KEY,
    firm_id TEXT NOT NULL,
    return_number TEXT NOT NULL,
    original_invoice_id TEXT,
    party_id TEXT,
    date INTEGER NOT NULL,
    total_amount REAL NOT NULL,
    reason TEXT,
    created_at INTEGER,
    updated_at INTEGER,
    is_synced INTEGER DEFAULT 0,
    FOREIGN KEY(firm_id) REFERENCES firms(id),
    FOREIGN KEY(party_id) REFERENCES parties(id),
    FOREIGN KEY(original_invoice_id) REFERENCES invoices(id)
);

CREATE TABLE sales_return_items (
    id TEXT PRIMARY KEY,
    firm_id TEXT NOT NULL, 
    return_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    quantity REAL NOT NULL,
    rate REAL NOT NULL,
    amount REAL NOT NULL,
    FOREIGN KEY(return_id) REFERENCES sales_returns(id),
    FOREIGN KEY(item_id) REFERENCES items(id)
);

-- Purchase
CREATE TABLE purchase_bills (
    id TEXT PRIMARY KEY,
    firm_id TEXT NOT NULL,
    bill_number TEXT,
    party_id TEXT,
    date INTEGER NOT NULL,
    total_amount REAL NOT NULL,
    notes TEXT,
    status TEXT, 
    created_at INTEGER,
    updated_at INTEGER,
    is_synced INTEGER DEFAULT 0,
    FOREIGN KEY(firm_id) REFERENCES firms(id),
    FOREIGN KEY(party_id) REFERENCES parties(id)
);

CREATE TABLE purchase_items (
    id TEXT PRIMARY KEY,
    bill_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    quantity REAL NOT NULL,
    rate REAL NOT NULL,
    amount REAL NOT NULL,
    batch_number TEXT,
    expiry_date INTEGER,
    FOREIGN KEY(bill_id) REFERENCES purchase_bills(id),
    FOREIGN KEY(item_id) REFERENCES items(id)
);
