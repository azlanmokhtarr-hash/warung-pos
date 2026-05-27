import { useState, useEffect, useRef } from "react";

// ─── QR Library (inline tiny QR via API) ───────────────────────────────────
function QRImg({ value, size = 160 }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&bgcolor=ffffff&color=0a0e1a&margin=10`;
  return <img src={url} alt="QR Code" style={{ width: size, height: size, borderRadius: 8, border: "3px solid #f59e0b" }} />;
}

// ─── Constants ──────────────────────────────────────────────────────────────
const DEFAULT_CATEGORIES = [
  { id: "cat1", name: "Makanan", subcategories: [{ id: "sub1", name: "Nasi" }, { id: "sub2", name: "Mee" }, { id: "sub3", name: "Roti" }] },
  { id: "cat2", name: "Minuman", subcategories: [{ id: "sub4", name: "Panas" }, { id: "sub5", name: "Sejuk" }] },
  { id: "cat3", name: "Dessert", subcategories: [{ id: "sub6", name: "Ais" }, { id: "sub7", name: "Kuih" }] },
];

const DEFAULT_PRODUCTS = [
  { id: 1, name: "Nasi Lemak", price: 5.50, categoryId: "cat1", subcategoryId: "sub1", emoji: "🍚", printerId: "" },
  { id: 2, name: "Mee Goreng", price: 6.00, categoryId: "cat1", subcategoryId: "sub2", emoji: "🍜", printerId: "" },
  { id: 3, name: "Roti Canai", price: 2.50, categoryId: "cat1", subcategoryId: "sub3", emoji: "🫓", printerId: "" },
  { id: 4, name: "Char Kuey Teow", price: 7.00, categoryId: "cat1", subcategoryId: "sub2", emoji: "🍳", printerId: "" },
  { id: 5, name: "Ayam Goreng", price: 8.00, categoryId: "cat1", subcategoryId: "sub1", emoji: "🍗", printerId: "" },
  { id: 6, name: "Satay (10pcs)", price: 9.00, categoryId: "cat1", subcategoryId: "sub1", emoji: "🍢", printerId: "" },
  { id: 7, name: "Teh Tarik", price: 2.50, categoryId: "cat2", subcategoryId: "sub4", emoji: "🧋", printerId: "" },
  { id: 8, name: "Kopi O", price: 2.00, categoryId: "cat2", subcategoryId: "sub4", emoji: "☕", printerId: "" },
  { id: 9, name: "Air Kosong", price: 1.50, categoryId: "cat2", subcategoryId: "sub5", emoji: "💧", printerId: "" },
  { id: 10, name: "Teh Ais", price: 2.50, categoryId: "cat2", subcategoryId: "sub5", emoji: "🥤", printerId: "" },
  { id: 11, name: "Jus Oren", price: 4.00, categoryId: "cat2", subcategoryId: "sub5", emoji: "🍊", printerId: "" },
  { id: 12, name: "Sirap Bandung", price: 3.00, categoryId: "cat2", subcategoryId: "sub5", emoji: "🌸", printerId: "" },
  { id: 13, name: "Cendol", price: 4.50, categoryId: "cat3", subcategoryId: "sub6", emoji: "🍧", printerId: "" },
  { id: 14, name: "Ice Kacang", price: 5.00, categoryId: "cat3", subcategoryId: "sub6", emoji: "🧊", printerId: "" },
  { id: 15, name: "Kuih Lapis", price: 2.00, categoryId: "cat3", subcategoryId: "sub7", emoji: "🍰", printerId: "" },
];

// Default combos: { id, name, emoji, price, items: [{productId, qty}], printerId, categoryId }
const DEFAULT_COMBOS = [
  {
    id: "combo1", name: "Set Nasi A", emoji: "🍱", price: 9.00, categoryId: "cat1",
    items: [{ productId: 1, qty: 1 }, { productId: 7, qty: 1 }],
    printerId: "", description: "Nasi Lemak + Teh Tarik"
  },
  {
    id: "combo2", name: "Set Sarapan", emoji: "🌅", price: 7.00, categoryId: "cat1",
    items: [{ productId: 3, qty: 2 }, { productId: 8, qty: 1 }],
    printerId: "", description: "2x Roti Canai + Kopi O"
  },
];

const EMOJIS = ["🍚","🍜","🫓","🍳","🍗","🍢","🧋","☕","💧","🥤","🍊","🌸","🍧","🧊","🍰","🥗","🍱","🌮","🍕","🍔","🥩","🍣","🍛","🥘","🍲","🧆","🥚","🍞","🧁","🍩","🍦","🍮","🍫","🍬","🧃","🥛","🍵","🍺","🥂","🌅","🎁","⭐","🔥","💫"];

function formatRM(a) { return `RM ${Number(a).toFixed(2)}`; }
function fmtDate(d) { return new Date(d).toLocaleDateString("ms-MY", { day: "2-digit", month: "short", year: "numeric" }); }
function fmtTime(d) { return new Date(d).toLocaleTimeString("ms-MY", { hour: "2-digit", minute: "2-digit" }); }

function useLocalStorage(key, def) {
  const [v, sv] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : def; } catch { return def; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }, [key, v]);
  return [v, sv];
}

// ─── ESC/POS Receipt Builder ─────────────────────────────────────────────────
function buildReceiptBytes(order, shopName = "WARUNG DIGITAL", title = "RESIT") {
  const ESC = 0x1B, GS = 0x1D;
  const enc = new TextEncoder();
  const bytes = [];
  const add = (t) => bytes.push(...enc.encode(t + "\n"));
  bytes.push(ESC, 0x40);
  bytes.push(ESC, 0x61, 0x01);
  add(shopName);
  add("Tel: 03-1234 5678");
  if (title !== "RESIT") add(`--- ${title} ---`);
  bytes.push(ESC, 0x61, 0x00);
  add("-".repeat(32));
  add(`No: #${order.num}  ${new Date(order.time).toLocaleString("ms-MY")}`);
  if (order.tableNo) add(`Meja: ${order.tableNo}`);
  add("-".repeat(32));
  order.cart.forEach(i => {
    const nm = i.isCombo ? `[SET] ${i.name}` : i.name;
    const l = `${nm} x${i.qty}`, r = formatRM(i.price * i.qty);
    add(l + " ".repeat(Math.max(1, 32 - l.length - r.length)) + r);
    // print combo sub-items as indent
    if (i.isCombo && i.comboItems) {
      i.comboItems.forEach(ci => add(`  · ${ci.name} x${ci.qty}`));
    }
  });
  add("-".repeat(32));
  add(`${"Subtotal".padEnd(24)}${formatRM(order.subtotal)}`);
  add(`${"SST (6%)".padEnd(24)}${formatRM(order.tax)}`);
  bytes.push(ESC, 0x45, 0x01);
  add(`${"JUMLAH".padEnd(24)}${formatRM(order.total)}`);
  bytes.push(ESC, 0x45, 0x00);
  if (order.method === "cash") {
    add(`${"Tunai".padEnd(24)}${formatRM(order.cash)}`);
    add(`${"Baki".padEnd(24)}${formatRM(order.change)}`);
  }
  add("-".repeat(32));
  bytes.push(ESC, 0x61, 0x01);
  add("Terima Kasih!");
  add("Sila Datang Lagi");
  bytes.push(ESC, 0x61, 0x00);
  bytes.push(GS, 0x56, 0x41, 0x10);
  return new Uint8Array(bytes);
}

// Kitchen slip - only items for a specific printer
function buildKitchenBytes(order, printerName, items) {
  const ESC = 0x1B, GS = 0x1D;
  const enc = new TextEncoder();
  const bytes = [];
  const add = (t) => bytes.push(...enc.encode(t + "\n"));
  bytes.push(ESC, 0x40);
  bytes.push(ESC, 0x61, 0x01);
  bytes.push(ESC, 0x45, 0x01);
  add("*** ORDER SLIP ***");
  bytes.push(ESC, 0x45, 0x00);
  add(`${printerName.toUpperCase()}`);
  bytes.push(ESC, 0x61, 0x00);
  add("-".repeat(32));
  add(`Order #${order.num}  ${fmtTime(order.time)}`);
  if (order.tableNo) add(`Meja: ${order.tableNo}`);
  add("-".repeat(32));
  items.forEach(i => {
    bytes.push(ESC, 0x45, 0x01);
    add(`${i.name} x${i.qty}`);
    bytes.push(ESC, 0x45, 0x00);
    if (i.isCombo && i.comboItems) {
      i.comboItems.forEach(ci => add(`  · ${ci.name} x${ci.qty}`));
    }
    if (i.notes) add(`  >> ${i.notes}`);
  });
  add("-".repeat(32));
  bytes.push(ESC, 0x61, 0x01);
  add("SEDIA UNTUK MASAK");
  bytes.push(GS, 0x56, 0x41, 0x10);
  return new Uint8Array(bytes);
}

// ── Bluetooth Classic (untuk thermal printer biasa macam MPT-11, Zywell dll) ──
async function printBluetoothClassic(address, data) {
  try {
    const bt = window.bluetoothSerial;
    if (!bt) throw new Error("Bluetooth Serial plugin tidak tersedia");
    return new Promise((resolve) => {
      bt.connect(address, () => {
        // Convert Uint8Array to string for bluetoothSerial
        const str = String.fromCharCode(...data);
        bt.write(str, () => {
          bt.disconnect();
          resolve({ ok: true });
        }, (e) => {
          bt.disconnect();
          resolve({ ok: false, err: e });
        });
      }, (e) => resolve({ ok: false, err: e }));
    });
  } catch (e) { return { ok: false, err: e.message }; }
}

// ── BLE (untuk printer BLE seperti beberapa model Epson baru) ──
async function printBluetoothBLE(deviceId, data) {
  try {
    const { BleClient } = await import("@capacitor-community/bluetooth-le");
    await BleClient.initialize();
    const SVC = "000018f0-0000-1000-8000-00805f9b34fb";
    const CHR = "00002af1-0000-1000-8000-00805f9b34fb";
    await BleClient.connect(deviceId);
    for (let i = 0; i < data.length; i += 512) {
      await BleClient.write(deviceId, SVC, CHR, new DataView(data.slice(i, i + 512).buffer));
    }
    await BleClient.disconnect(deviceId);
    return { ok: true };
  } catch (e) { return { ok: false, err: e.message }; }
}

// ── Auto pilih Bluetooth Classic atau BLE ikut jenis printer ──
async function printBluetooth(deviceId, data, btType = "classic") {
  if (btType === "ble") return printBluetoothBLE(deviceId, data);
  return printBluetoothClassic(deviceId, data);
}

async function printWifi(ip, port = 9100, data) {
  try {
    const CapHttp = window.Capacitor?.Plugins?.CapacitorHttp;
    if (CapHttp) {
      await CapHttp.request({
        method: "POST", url: `http://${ip}:${port}`,
        headers: { "Content-Type": "application/octet-stream" },
        data: btoa(String.fromCharCode(...data)),
      });
    } else {
      await fetch(`http://${ip}:${port}`, {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: data,
      });
    }
    return { ok: true };
  } catch (e) { return { ok: false, err: e.message }; }
}

// ── Scan Bluetooth Classic ──
async function scanBTClassic() {
  return new Promise((resolve) => {
    const bt = window.bluetoothSerial;
    if (!bt) { resolve([]); return; }
    bt.list((devices) => {
      resolve(devices.map(d => ({ deviceId: d.address, name: d.name || d.address })));
    }, () => resolve([]));
  });
}

// ── Scan BLE ──
async function scanBTBLE() {
  try {
    const { BleClient } = await import("@capacitor-community/bluetooth-le");
    await BleClient.initialize();
    const devs = [];
    await BleClient.requestLEScan({}, r => {
      if (!devs.find(d => d.deviceId === r.device.deviceId))
        devs.push({ deviceId: r.device.deviceId, name: r.device.name || "Unknown" });
    });
    setTimeout(() => BleClient.stopLEScan(), 5000);
    return devs;
  } catch { return []; }
}

// ── Scan ikut jenis ──
async function scanBT(btType = "classic") {
  if (btType === "ble") return scanBTBLE();
  return scanBTClassic();
}

// ════════════════════════════════════════════════════════════════════════════
// CUSTOMER ORDER PAGE (for QR scan)
// ════════════════════════════════════════════════════════════════════════════
function CustomerOrderPage({ products, combos, categories, onSubmitOrder, tableNo }) {
  const [cart, setCart] = useState([]);
  const [fCat, setFCat] = useState("all");
  const [search, setSearch] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [orderRef, setOrderRef] = useState(null);
  const [showCombo, setShowCombo] = useState(false);

  const sub = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = sub * 0.06;
  const total = sub + tax;

  const filtered = products.filter(p =>
    (fCat === "all" || p.categoryId === fCat) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredCombos = combos.filter(c =>
    (fCat === "all" || c.categoryId === fCat) &&
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  function addToCart(item, isCombo = false) {
    const key = isCombo ? `combo_${item.id}` : `item_${item.id}`;
    setCart(prev => {
      const e = prev.find(i => i._key === key);
      if (e) return prev.map(i => i._key === key ? { ...i, qty: i.qty + 1 } : i);
      const cartItem = isCombo
        ? { _key: key, id: item.id, name: item.name, emoji: item.emoji, price: item.price, qty: 1, isCombo: true, comboItems: item.items?.map(ci => { const p = products.find(x => x.id === ci.productId); return { productId: ci.productId, name: p?.name || "?", qty: ci.qty }; }) }
        : { _key: key, id: item.id, name: item.name, emoji: item.emoji, price: item.price, qty: 1, isCombo: false };
      return [...prev, cartItem];
    });
  }

  function updQty(key, d) {
    setCart(prev => prev.map(i => i._key === key ? { ...i, qty: i.qty + d } : i).filter(i => i.qty > 0));
  }

  function handleSubmit() {
    if (cart.length === 0) return;
    const ref = onSubmitOrder({ cart, subtotal: sub, tax, total, tableNo });
    setOrderRef(ref);
    setSubmitted(true);
  }

  const ST = {
    page: { minHeight: "100vh", background: "#fef9f0", fontFamily: "'Segoe UI',sans-serif", paddingBottom: 120 },
    header: { background: "linear-gradient(135deg,#f59e0b,#ef4444)", padding: "18px 16px", textAlign: "center", color: "#fff" },
    card: { background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,.08)", margin: "10px 12px", padding: "12px 14px" },
    btn: (active) => ({ padding: "6px 12px", borderRadius: 20, border: "none", fontSize: 12, cursor: "pointer", background: active ? "#f59e0b" : "#f0f0f0", color: active ? "#fff" : "#555", fontWeight: active ? 700 : 400 }),
    itemBtn: { width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: 0 },
    cartBar: { position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #eee", padding: "12px 16px" },
  };

  if (submitted) return (
    <div style={ST.page}>
      <div style={ST.header}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Order Dihantar!</div>
        <div style={{ fontSize: 14, opacity: 0.9 }}>Meja {tableNo}</div>
      </div>
      <div style={{ ...ST.card, textAlign: "center", marginTop: 20 }}>
        <div style={{ fontSize: 14, color: "#666", marginBottom: 6 }}>Nombor Order:</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: "#f59e0b" }}>#{orderRef}</div>
        <div style={{ fontSize: 13, color: "#888", marginTop: 8 }}>Sila tunggu, kami akan sediakan pesanan anda 🙏</div>
      </div>
      <div style={ST.card}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#333" }}>Ringkasan Order:</div>
        {cart.map(i => (
          <div key={i._key} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4, color: "#555" }}>
            <span>{i.emoji} {i.name} x{i.qty}</span>
            <span style={{ fontWeight: 600 }}>{formatRM(i.price * i.qty)}</span>
          </div>
        ))}
        <div style={{ borderTop: "1px dashed #ddd", marginTop: 8, paddingTop: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, color: "#f59e0b" }}>
            <span>Jumlah (incl. SST)</span><span>{formatRM(total)}</span>
          </div>
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: "#aaa", textAlign: "center" }}>Bayaran dibuat di kaunter</div>
      </div>
    </div>
  );

  return (
    <div style={ST.page}>
      <div style={ST.header}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 1 }}>🏪 Warung Digital</div>
        <div style={{ fontSize: 13, opacity: 0.9, marginTop: 2 }}>Meja {tableNo} · Order Sendiri</div>
      </div>

      {/* Toggle Normal/Combo */}
      <div style={{ display: "flex", gap: 8, padding: "10px 12px 0" }}>
        <button style={ST.btn(!showCombo)} onClick={() => setShowCombo(false)}>🍽️ Menu</button>
        <button style={ST.btn(showCombo)} onClick={() => setShowCombo(true)}>🍱 Set/Combo ({combos.length})</button>
      </div>

      {/* Search + Category */}
      <div style={{ padding: "8px 12px 0" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Cari..." style={{ width: "100%", padding: "8px 12px", borderRadius: 20, border: "1px solid #ddd", fontSize: 13, boxSizing: "border-box", outline: "none" }} />
      </div>
      <div style={{ display: "flex", gap: 6, padding: "8px 12px", overflowX: "auto" }}>
        <button style={ST.btn(fCat === "all")} onClick={() => setFCat("all")}>Semua</button>
        {categories.map(c => <button key={c.id} style={ST.btn(fCat === c.id)} onClick={() => setFCat(c.id)}>{c.name}</button>)}
      </div>

      {/* Items / Combos */}
      {!showCombo && filtered.map(p => (
        <div key={p.id} style={ST.card}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 32 }}>{p.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#222" }}>{p.name}</div>
              <div style={{ fontSize: 13, color: "#f59e0b", fontWeight: 700 }}>{formatRM(p.price)}</div>
            </div>
            {(() => {
              const inCart = cart.find(i => i._key === `item_${p.id}`);
              return inCart ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button onClick={() => updQty(`item_${p.id}`, -1)} style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid #f59e0b", background: "none", color: "#f59e0b", cursor: "pointer", fontSize: 16, fontWeight: 700 }}>−</button>
                  <span style={{ fontWeight: 700, minWidth: 18, textAlign: "center" }}>{inCart.qty}</span>
                  <button onClick={() => updQty(`item_${p.id}`, 1)} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "#f59e0b", color: "#fff", cursor: "pointer", fontSize: 16, fontWeight: 700 }}>+</button>
                </div>
              ) : (
                <button onClick={() => addToCart(p)} style={{ padding: "6px 14px", background: "#f59e0b", border: "none", borderRadius: 20, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>Tambah</button>
              );
            })()}
          </div>
        </div>
      ))}

      {showCombo && filteredCombos.map(c => (
        <div key={c.id} style={ST.card}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 32 }}>{c.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#222" }}>{c.name}</div>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>{c.description || c.items?.map(ci => { const p = products.find(x => x.id === ci.productId); return `${p?.name || "?"} x${ci.qty}`; }).join(" + ")}</div>
              <div style={{ fontSize: 13, color: "#f59e0b", fontWeight: 700 }}>{formatRM(c.price)}</div>
            </div>
            {(() => {
              const inCart = cart.find(i => i._key === `combo_${c.id}`);
              return inCart ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button onClick={() => updQty(`combo_${c.id}`, -1)} style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid #f59e0b", background: "none", color: "#f59e0b", cursor: "pointer", fontSize: 16, fontWeight: 700 }}>−</button>
                  <span style={{ fontWeight: 700, minWidth: 18, textAlign: "center" }}>{inCart.qty}</span>
                  <button onClick={() => updQty(`combo_${c.id}`, 1)} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "#f59e0b", color: "#fff", cursor: "pointer", fontSize: 16, fontWeight: 700 }}>+</button>
                </div>
              ) : (
                <button onClick={() => addToCart(c, true)} style={{ padding: "6px 14px", background: "#f59e0b", border: "none", borderRadius: 20, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>Tambah</button>
              );
            })()}
          </div>
        </div>
      ))}

      {cart.length > 0 && (
        <div style={ST.cartBar}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontSize: 12, color: "#666" }}>{cart.reduce((s, i) => s + i.qty, 0)} item</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#f59e0b" }}>{formatRM(total)} <span style={{ fontSize: 10, fontWeight: 400, color: "#aaa" }}>(incl. SST)</span></div>
          </div>
          <button onClick={handleSubmit} style={{ width: "100%", padding: 12, background: "linear-gradient(135deg,#f59e0b,#ef4444)", border: "none", borderRadius: 10, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
            🛒 Hantar Order
          </button>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [products, setProducts] = useLocalStorage("pos_products", DEFAULT_PRODUCTS);
  const [categories, setCategories] = useLocalStorage("pos_categories", DEFAULT_CATEGORIES);
  const [combos, setCombos] = useLocalStorage("pos_combos", DEFAULT_COMBOS);
  const [printers, setPrinters] = useLocalStorage("pos_printers", []);
  const [salesHistory, setSalesHistory] = useLocalStorage("pos_history", []);
  const [pendingOrders, setPendingOrders] = useLocalStorage("pos_pending", []);
  const [cart, setCart] = useState([]);
  const [page, setPage] = useState("pos");
  const [fCat, setFCat] = useState("all");
  const [fSub, setFSub] = useState("all");
  const [search, setSearch] = useState("");
  const [showCombos, setShowCombos] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payMethod, setPayMethod] = useState("cash");
  const [cashIn, setCashIn] = useState("");
  const [receipt, setReceipt] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [orderNum, setOrderNum] = useLocalStorage("pos_ordernum", 1042);
  const [notif, setNotif] = useState(null);
  const [notifClr, setNotifClr] = useState("#93c5fd");
  const [printSt, setPrintSt] = useState({});

  // QR Order state
  const [qrModal, setQrModal] = useState(false);
  const [qrTable, setQrTable] = useState("1");
  const [qrPreview, setQrPreview] = useState(false); // simulate customer view
  const [qrTablePreview, setQrTablePreview] = useState("1");

  // History filter
  const [histFilter, setHistFilter] = useState("all"); // today | week | all
  const [histSearch, setHistSearch] = useState("");
  const [histDetail, setHistDetail] = useState(null);

  // Combo modals
  const [comboModal, setComboModal] = useState(false);
  const [editCombo, setEditCombo] = useState(null);
  const [comboF, setComboF] = useState({ name: "", emoji: "🍱", price: "", categoryId: "cat1", description: "", printerId: "", items: [] });
  const [emojiPickCombo, setEmojiPickCombo] = useState(false);
  const [comboItemCatFilter, setComboItemCatFilter] = useState("all"); // filter item dalam combo modal

  // item modals
  const [itemModal, setItemModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [itemF, setItemF] = useState({ name: "", price: "", categoryId: "", subcategoryId: "", emoji: "🍚", printerId: "" });
  const [emojiPick, setEmojiPick] = useState(false);
  const [catModal, setCatModal] = useState(false);
  const [subModal, setSubModal] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [editSub, setEditSub] = useState(null);
  const [catF, setCatF] = useState({ name: "" });
  const [subF, setSubF] = useState({ name: "", catId: "" });
  const [expCat, setExpCat] = useState(null);
  const [printerModal, setPrinterModal] = useState(false);
  const [editPrinter, setEditPrinter] = useState(null);
  const [pF, setPF] = useState({ name: "", type: "wifi", ip: "", port: "9100", deviceId: "", location: "Kaunter" });
  const [scanning, setScanning] = useState(false);
  const [btDevs, setBtDevs] = useState([]);

  const sub = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = sub * 0.06;
  const total = sub + tax;
  const change = parseFloat(cashIn) - total;

  const pendingCount = pendingOrders.filter(o => o.status === "pending").length;

  function toast(msg, clr = "#93c5fd") { setNotif(msg); setNotifClr(clr); setTimeout(() => setNotif(null), 2500); }

  // ── Cart helpers ──────────────────────────────────────────────────────────
  function addCart(p, isCombo = false) {
    const key = isCombo ? `combo_${p.id}` : `item_${p.id}`;
    setCart(prev => {
      const e = prev.find(i => i._key === key);
      if (e) return prev.map(i => i._key === key ? { ...i, qty: i.qty + 1 } : i);
      if (isCombo) {
        return [...prev, {
          _key: key, id: p.id, name: p.name, emoji: p.emoji, price: p.price, qty: 1,
          isCombo: true, printerId: p.printerId || "",
          // Simpan printerId setiap sub-item dalam combo
          comboItems: p.items?.map(ci => {
            const prod = products.find(x => x.id === ci.productId);
            return { productId: ci.productId, name: prod?.name || "?", qty: ci.qty, printerId: ci.printerId || "" };
          })
        }];
      }
      return [...prev, { _key: key, id: p.id, name: p.name, emoji: p.emoji, price: p.price, qty: 1, isCombo: false, printerId: p.printerId || "" }];
    });
    toast(`${p.emoji} ${p.name} ditambah`);
  }

  function updQty(key, d) { setCart(prev => prev.map(i => i._key === key ? { ...i, qty: i.qty + d } : i).filter(i => i.qty > 0)); }

  // ── Print routing ─────────────────────────────────────────────────────────
  async function doPrint(printer, data) {
    setPrintSt(s => ({ ...s, [printer.id]: "⏳" }));
    const r = printer.type === "bluetooth"
      ? await printBluetooth(printer.deviceId, data, printer.btType || "classic")
      : await printWifi(printer.ip, parseInt(printer.port) || 9100, data);
    setPrintSt(s => ({ ...s, [printer.id]: r.ok ? "✅" : "❌" }));
    toast(r.ok ? `🖨️ ${printer.name} OK!` : `❌ ${printer.name}: ${r.err}`, r.ok ? "#4ade80" : "#f87171");
    setTimeout(() => setPrintSt(s => { const n = { ...s }; delete n[printer.id]; return n; }), 4000);
  }

  // Print receipt to cashier printers, kitchen/bar slips ikut printer yang di-assign setiap item
  async function doPrintAll(order) {
    const data = buildReceiptBytes(order);
    // Print resit penuh ke semua printer (cashier)
    for (const p of printers) await doPrint(p, data);

    // Kumpul items ikut printer yang di-assign
    const groups = {};

    order.cart.forEach(item => {
      if (item.isCombo && item.comboItems) {
        // Combo — setiap sub-item ada printer sendiri
        item.comboItems.forEach(ci => {
          const pid = ci.printerId || "";
          if (!pid) return;
          if (!groups[pid]) groups[pid] = [];
          groups[pid].push({
            name: `[${item.name}] ${ci.name}`,
            qty: ci.qty * item.qty,
            emoji: "🍱",
            price: 0,
          });
        });
      } else {
        // Item biasa
        const pid = item.printerId || "";
        if (!pid) return;
        if (!groups[pid]) groups[pid] = [];
        groups[pid].push(item);
      }
    });

    // Print slip ke setiap printer kitchen/bar
    for (const [pid, items] of Object.entries(groups)) {
      const printer = printers.find(p => p.id === pid);
      if (!printer) continue;
      const slipData = buildKitchenBytes(order, printer.location || printer.name, items);
      await doPrint(printer, slipData);
    }
  }

  async function testPrint(p) {
    toast(`🖨️ Test ${p.name}...`);
    const o = { cart: [{ id: 1, name: "Test Item", price: 1, qty: 1, emoji: "🧪", isCombo: false }], subtotal: 1, tax: 0.06, total: 1.06, method: "cash", cash: 2, change: 0.94, num: 9999, time: new Date() };
    await doPrint(p, buildReceiptBytes(o));
  }

  // ── Checkout ──────────────────────────────────────────────────────────────
  async function checkout(fromPending = null) {
    const orderCart = fromPending ? fromPending.cart : cart;
    const orderSub = orderCart.reduce((s, i) => s + i.price * i.qty, 0);
    const orderTax = orderSub * 0.06;
    const orderTotal = orderSub + orderTax;
    const o = {
      cart: [...orderCart], subtotal: orderSub, tax: orderTax, total: orderTotal,
      method: payMethod, cash: parseFloat(cashIn) || 0, change: parseFloat(cashIn) - orderTotal,
      num: orderNum, time: new Date(),
      tableNo: fromPending?.tableNo || null,
      source: fromPending ? "qr" : "pos"
    };
    setSalesHistory(h => [o, ...h]);
    setLastOrder(o);
    setOrderNum(n => n + 1);
    if (fromPending) {
      setPendingOrders(p => p.map(x => x.id === fromPending.id ? { ...x, status: "done" } : x));
    } else {
      setCart([]);
    }
    setPaying(false); setReceipt(true); setCashIn("");
    await doPrintAll(o);
  }

  // ── QR Order submission (from customer page) ──────────────────────────────
  function handleQROrder({ cart: qrCart, subtotal, tax: qrTax, total: qrTotal, tableNo }) {
    const newOrder = {
      id: `qr_${Date.now()}`,
      cart: qrCart, subtotal, tax: qrTax, total: qrTotal,
      tableNo, time: new Date(), status: "pending",
      num: orderNum,
    };
    setPendingOrders(p => [newOrder, ...p]);
    setOrderNum(n => n + 1);
    toast(`🔔 Order baru dari Meja ${tableNo}!`, "#4ade80");

    // Print kitchen slips for incoming QR order
    const groups = {};
    qrCart.forEach(item => {
      if (!item.printerId) {
        if (!groups["_all"]) groups["_all"] = [];
        groups["_all"].push(item);
        return;
      }
      if (!groups[item.printerId]) groups[item.printerId] = [];
      groups[item.printerId].push(item);
    });
    for (const [pid, items] of Object.entries(groups)) {
      const printer = pid === "_all" ? printers[0] : printers.find(p => p.id === pid);
      if (!printer) continue;
      const kitchenData = buildKitchenBytes(newOrder, printer.location || printer.name, items);
      doPrint(printer, kitchenData);
    }
    return newOrder.num;
  }

  async function doScan() {
    setScanning(true); toast("📡 Scan Bluetooth...");
    const d = await scanBT(pF.btType || "classic"); setBtDevs(d); setScanning(false);
    toast(d.length ? `${d.length} device jumpa` : "Tiada device", d.length ? "#4ade80" : "#f87171");
  }

  // ── Item CRUD ─────────────────────────────────────────────────────────────
  const openAddItem = () => { setEditItem(null); setItemF({ name: "", price: "", categoryId: categories[0]?.id || "", subcategoryId: categories[0]?.subcategories[0]?.id || "", emoji: "🍚", printerId: "" }); setItemModal(true); };
  const openEditItem = (item) => { setEditItem(item); setItemF({ name: item.name, price: item.price.toString(), categoryId: item.categoryId, subcategoryId: item.subcategoryId, emoji: item.emoji, printerId: item.printerId || "" }); setItemModal(true); };
  const saveItem = () => {
    if (!itemF.name || !itemF.price) return;
    if (editItem) setProducts(p => p.map(i => i.id === editItem.id ? { ...i, ...itemF, price: parseFloat(itemF.price) } : i));
    else setProducts(p => [...p, { id: Date.now(), ...itemF, price: parseFloat(itemF.price) }]);
    toast(editItem ? "✅ Item dikemaskini" : "✅ Item ditambah"); setItemModal(false);
  };
  const delItem = (id) => { if (window.confirm("Padam item?")) { setProducts(p => p.filter(i => i.id !== id)); toast("🗑️ Dipadam"); } };

  // ── Category CRUD ─────────────────────────────────────────────────────────
  const openAddCat = () => { setEditCat(null); setCatF({ name: "" }); setCatModal(true); };
  const openEditCat = (c) => { setEditCat(c); setCatF({ name: c.name }); setCatModal(true); };
  const saveCat = () => {
    if (!catF.name) return;
    if (editCat) setCategories(p => p.map(c => c.id === editCat.id ? { ...c, name: catF.name } : c));
    else setCategories(p => [...p, { id: `c${Date.now()}`, name: catF.name, subcategories: [] }]);
    toast(editCat ? "✅ Dikemaskini" : "✅ Ditambah"); setCatModal(false);
  };
  const delCat = (id) => { if (window.confirm("Padam kategori?")) { setCategories(p => p.filter(c => c.id !== id)); setProducts(p => p.filter(i => i.categoryId !== id)); toast("🗑️ Dipadam"); } };
  const openAddSub = (catId) => { setEditSub(null); setSubF({ name: "", catId }); setSubModal(true); };
  const openEditSub = (s, catId) => { setEditSub(s); setSubF({ name: s.name, catId }); setSubModal(true); };
  const saveSub = () => {
    if (!subF.name) return;
    if (editSub) setCategories(p => p.map(c => c.id === subF.catId ? { ...c, subcategories: c.subcategories.map(s => s.id === editSub.id ? { ...s, name: subF.name } : s) } : c));
    else setCategories(p => p.map(c => c.id === subF.catId ? { ...c, subcategories: [...c.subcategories, { id: `s${Date.now()}`, name: subF.name }] } : c));
    toast(editSub ? "✅ Dikemaskini" : "✅ Ditambah"); setSubModal(false);
  };
  const delSub = (sId, cId) => { if (window.confirm("Padam sub?")) { setCategories(p => p.map(c => c.id === cId ? { ...c, subcategories: c.subcategories.filter(s => s.id !== sId) } : c)); toast("🗑️ Dipadam"); } };

  // ── Printer CRUD ──────────────────────────────────────────────────────────
  const openAddPrinter = () => { setEditPrinter(null); setPF({ name: "", type: "bluetooth", btType: "classic", ip: "", port: "9100", deviceId: "", location: "Kaunter" }); setBtDevs([]); setPrinterModal(true); };
  const openEditPrinter = (p) => { setEditPrinter(p); setPF({ name: p.name, type: p.type, btType: p.btType || "classic", ip: p.ip || "", port: p.port || "9100", deviceId: p.deviceId || "", location: p.location || "Kaunter" }); setPrinterModal(true); };
  const savePrinter = () => {
    if (!pF.name) return;
    const d = { ...pF, id: editPrinter ? editPrinter.id : `pr${Date.now()}` };
    if (editPrinter) setPrinters(p => p.map(i => i.id === editPrinter.id ? d : i));
    else setPrinters(p => [...p, d]);
    toast(editPrinter ? "✅ Printer dikemaskini" : "✅ Printer ditambah"); setPrinterModal(false);
  };
  const delPrinter = (id) => { if (window.confirm("Padam printer?")) { setPrinters(p => p.filter(i => i.id !== id)); toast("🗑️ Dipadam"); } };

  // ── Combo CRUD ────────────────────────────────────────────────────────────
  const openAddCombo = () => { setEditCombo(null); setComboF({ name: "", emoji: "🍱", price: "", categoryId: categories[0]?.id || "cat1", description: "", printerId: "", items: [] }); setComboModal(true); };
  const openEditCombo = (c) => { setEditCombo(c); setComboF({ name: c.name, emoji: c.emoji, price: c.price.toString(), categoryId: c.categoryId || "cat1", description: c.description || "", printerId: c.printerId || "", items: [...(c.items || [])] }); setComboModal(true); };
  const saveCombo = () => {
    if (!comboF.name || !comboF.price) return;
    const d = { ...comboF, price: parseFloat(comboF.price), id: editCombo ? editCombo.id : `combo_${Date.now()}` };
    if (editCombo) setCombos(p => p.map(c => c.id === editCombo.id ? d : c));
    else setCombos(p => [...p, d]);
    toast(editCombo ? "✅ Combo dikemaskini" : "✅ Combo ditambah"); setComboModal(false);
  };
  const delCombo = (id) => { if (window.confirm("Padam combo?")) { setCombos(p => p.filter(c => c.id !== id)); toast("🗑️ Dipadam"); } };

  function addComboItem(productId) {
    setComboF(f => {
      const ex = f.items.find(i => i.productId === productId);
      if (ex) return { ...f, items: f.items.map(i => i.productId === productId ? { ...i, qty: i.qty + 1 } : i) };
      return { ...f, items: [...f.items, { productId, qty: 1, printerId: "" }] };
    });
  }
  function removeComboItem(productId) {
    setComboF(f => ({ ...f, items: f.items.filter(i => i.productId !== productId) }));
  }

  // ── History helpers ───────────────────────────────────────────────────────
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekAgo = today - 6 * 86400000;
  const filteredHistory = salesHistory.filter(o => {
    const t = new Date(o.time).getTime();
    if (histFilter === "today" && t < today) return false;
    if (histFilter === "week" && t < weekAgo) return false;
    if (histSearch && !`#${o.num} ${o.cart.map(i => i.name).join(" ")}`.toLowerCase().includes(histSearch.toLowerCase())) return false;
    return true;
  });
  const totalRevToday = salesHistory.filter(o => new Date(o.time).getTime() >= today).reduce((s, o) => s + o.total, 0);
  const totalRevWeek = salesHistory.filter(o => new Date(o.time).getTime() >= weekAgo).reduce((s, o) => s + o.total, 0);

  // ── Derived ───────────────────────────────────────────────────────────────
  const filtered = products.filter(p => (fCat === "all" || p.categoryId === fCat) && (fSub === "all" || p.subcategoryId === fSub) && p.name.toLowerCase().includes(search.toLowerCase()));
  const filteredCombos = combos.filter(c => (fCat === "all" || c.categoryId === fCat) && c.name.toLowerCase().includes(search.toLowerCase()));
  const catSubs = fCat !== "all" ? (categories.find(c => c.id === fCat)?.subcategories || []) : [];
  const itemSubs = categories.find(c => c.id === itemF.categoryId)?.subcategories || [];

  // ── Styles ────────────────────────────────────────────────────────────────
  const N = (a) => ({ padding: "7px 12px", borderRadius: 8, border: "1px solid", fontSize: 12, cursor: "pointer", fontWeight: a ? 700 : 400, background: a ? "#f59e0b" : "transparent", color: a ? "#000" : "#94a3b8", borderColor: a ? "#f59e0b" : "#2a3d5e" });
  const INP = { width: "100%", background: "#0f1629", border: "1px solid #1e2d4a", borderRadius: 8, padding: "10px 12px", color: "#e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box" };
  const SEL = { ...INP, background: "#0a0e1a" };
  const MODAL = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 };
  const MBOX = { background: "#0f1629", border: "1px solid #1e2d4a", borderRadius: 16, padding: 22, width: "100%", maxWidth: 400, maxHeight: "90vh", overflowY: "auto" };
  const LBL = { fontSize: 12, color: "#94a3b8", marginBottom: 5, display: "block" };

  // QR Preview mode
  if (qrPreview) return (
    <CustomerOrderPage
      products={products}
      combos={combos}
      categories={categories}
      tableNo={qrTablePreview}
      onSubmitOrder={(data) => {
        const ref = handleQROrder({ ...data, tableNo: qrTablePreview });
        setQrPreview(false);
        toast(`✅ Order dari Meja ${qrTablePreview} diterima!`, "#4ade80");
        return ref;
      }}
    />
  );

  // Receipt screen
  if (receipt && lastOrder) return (
    <div style={{ minHeight: "100vh", background: "#0a0e1a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Courier New',monospace", padding: 20 }}>
      <div style={{ background: "#fff", width: 340, borderRadius: 4, padding: "28px 24px", boxShadow: "0 0 60px rgba(0,0,0,.5)" }}>
        <div style={{ textAlign: "center", borderBottom: "2px dashed #ddd", paddingBottom: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 26 }}>🏪</div>
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: 2 }}>WARUNG DIGITAL</div>
          <div style={{ fontSize: 11, color: "#888" }}>Tel: 03-1234 5678</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 10, color: "#666" }}>
          <span>No. #{lastOrder.num}</span><span>{new Date(lastOrder.time).toLocaleString("ms-MY")}</span>
        </div>
        {lastOrder.tableNo && <div style={{ textAlign: "center", background: "#fef3c7", borderRadius: 6, padding: "4px 10px", fontSize: 12, color: "#92400e", marginBottom: 8 }}>📍 Meja {lastOrder.tableNo}</div>}
        <div style={{ borderTop: "1px dashed #ddd", paddingTop: 10 }}>
          {lastOrder.cart.map(i => (
            <div key={i._key || i.id} style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span>{i.emoji} {i.isCombo ? "[SET] " : ""}{i.name} x{i.qty}</span>
                <span>{formatRM(i.price * i.qty)}</span>
              </div>
              {i.isCombo && i.comboItems && <div style={{ fontSize: 11, color: "#888", paddingLeft: 20 }}>{i.comboItems.map(ci => `· ${ci.name} x${ci.qty}`).join(", ")}</div>}
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px dashed #ddd", marginTop: 10, paddingTop: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#666", marginBottom: 3 }}><span>Subtotal</span><span>{formatRM(lastOrder.subtotal)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#666", marginBottom: 7 }}><span>SST (6%)</span><span>{formatRM(lastOrder.tax)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700, borderTop: "2px solid #000", paddingTop: 7 }}><span>JUMLAH</span><span>{formatRM(lastOrder.total)}</span></div>
          {lastOrder.method === "cash" && <>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#666", marginTop: 5 }}><span>Tunai</span><span>{formatRM(lastOrder.cash)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, color: "#16a34a" }}><span>Baki</span><span>{formatRM(lastOrder.change)}</span></div>
          </>}
        </div>
        {printers.length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px dashed #ddd" }}>
            <div style={{ fontSize: 11, color: "#888", textAlign: "center", marginBottom: 6 }}>Print semula:</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {printers.map(p => <button key={p.id} onClick={() => doPrint(p, buildReceiptBytes(lastOrder))} style={{ flex: 1, padding: "6px 8px", background: "#f0f0f0", border: "1px solid #ddd", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>🖨️ {p.name} {printSt[p.id] || ""}</button>)}
            </div>
          </div>
        )}
        <div style={{ textAlign: "center", marginTop: 16, paddingTop: 14, borderTop: "2px dashed #ddd", fontSize: 12, color: "#888" }}>✨ Terima Kasih ✨<br />Sila Datang Lagi!</div>
        <button onClick={() => setReceipt(false)} style={{ width: "100%", marginTop: 16, padding: 11, background: "#0a0e1a", color: "#fff", border: "none", borderRadius: 4, fontFamily: "inherit", fontSize: 13, cursor: "pointer" }}>← TRANSAKSI BARU</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0e1a", color: "#e2e8f0", fontFamily: "'Segoe UI',sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#0f1629", borderBottom: "1px solid #1e2d4a", padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, background: "linear-gradient(135deg,#f59e0b,#ef4444)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏪</div>
          <div><div style={{ fontWeight: 700, fontSize: 15 }}>Warung Digital POS</div><div style={{ fontSize: 11, color: "#64748b" }}>Sistem Jualan Pintar</div></div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[
            ["pos", "🛒 Jualan"],
            ["pending", pendingCount > 0 ? `🔔 Order (${pendingCount})` : "🔔 Order QR"],
            ["history", "📊 History"],
            ["menu", "🍽️ Menu"],
            ["combos", "🍱 Set/Combo"],
            ["categories", "📂 Kategori"],
            ["printers", `🖨️ Printer${printers.length > 0 ? ` (${printers.length})` : ""}`],
          ].map(([k, l]) => (
            <button key={k} style={{ ...N(page === k), ...(k === "pending" && pendingCount > 0 ? { borderColor: "#4ade80", color: page === k ? "#000" : "#4ade80", background: page === k ? "#4ade80" : "transparent" } : {}) }} onClick={() => setPage(k)}>{l}</button>
          ))}
        </div>
      </div>

      {notif && <div style={{ position: "fixed", top: 18, right: 18, background: "#1a2d4a", border: `1px solid ${notifClr}`, borderRadius: 8, padding: "10px 15px", fontSize: 13, zIndex: 999, color: notifClr }}>{notif}</div>}

      {/* ── POS PAGE ── */}
      {page === "pos" && (
        <div style={{ display: "flex", height: "calc(100vh - 57px)" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid #1e2d4a" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Cari menu..." style={{ ...INP, marginBottom: 8 }} />
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 6 }}>
                <button style={N(!showCombos)} onClick={() => setShowCombos(false)}>🍽️ Menu</button>
                <button style={N(showCombos)} onClick={() => setShowCombos(true)}>🍱 Set ({combos.length})</button>
                <div style={{ width: 1, background: "#2a3d5e", margin: "0 4px" }} />
                <button style={N(fCat === "all")} onClick={() => { setFCat("all"); setFSub("all"); }}>Semua</button>
                {categories.map(c => <button key={c.id} style={N(fCat === c.id)} onClick={() => { setFCat(c.id); setFSub("all"); }}>{c.name}</button>)}
              </div>
              {!showCombos && fCat !== "all" && catSubs.length > 0 && (
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  <button style={{ ...N(fSub === "all"), fontSize: 11, padding: "3px 8px" }} onClick={() => setFSub("all")}>Semua</button>
                  {catSubs.map(s => <button key={s.id} style={{ ...N(fSub === s.id), fontSize: 11, padding: "3px 8px" }} onClick={() => setFSub(s.id)}>{s.name}</button>)}
                </div>
              )}
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 10, alignContent: "start" }}>
              {!showCombos && filtered.map(p => (
                <button key={p.id} onClick={() => addCart(p)} style={{ background: "#0f1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "14px 10px", cursor: "pointer", textAlign: "center", color: "#e2e8f0" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#f59e0b"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e2d4a"; e.currentTarget.style.transform = "translateY(0)"; }}>
                  <div style={{ fontSize: 28, marginBottom: 5 }}>{p.emoji}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{p.name}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b" }}>{formatRM(p.price)}</div>
                  {p.printerId && <div style={{ fontSize: 9, color: "#64748b", marginTop: 2 }}>🖨️ {printers.find(x => x.id === p.printerId)?.location || ""}</div>}
                </button>
              ))}
              {showCombos && filteredCombos.map(c => (
                <button key={c.id} onClick={() => addCart(c, true)} style={{ background: "#0f1629", border: "1px solid #f59e0b22", borderRadius: 12, padding: "14px 10px", cursor: "pointer", textAlign: "center", color: "#e2e8f0", position: "relative" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#f59e0b"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#f59e0b22"; e.currentTarget.style.transform = "translateY(0)"; }}>
                  <div style={{ position: "absolute", top: 6, right: 8, background: "#f59e0b", borderRadius: 4, fontSize: 8, padding: "1px 4px", color: "#000", fontWeight: 700 }}>SET</div>
                  <div style={{ fontSize: 28, marginBottom: 5 }}>{c.emoji}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{c.name}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b" }}>{formatRM(c.price)}</div>
                  <div style={{ fontSize: 9, color: "#64748b", marginTop: 2 }}>{c.items?.length || 0} item</div>
                </button>
              ))}
              {!showCombos && filtered.length === 0 && <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#4b5563", padding: 40 }}>😕 Tiada item</div>}
              {showCombos && filteredCombos.length === 0 && <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#4b5563", padding: 40 }}>😕 Tiada combo</div>}
            </div>
          </div>

          {/* Cart */}
          <div style={{ width: 290, background: "#0f1629", borderLeft: "1px solid #1e2d4a", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid #1e2d4a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>🛒 Troli ({cart.reduce((s, i) => s + i.qty, 0)})</div>
              {cart.length > 0 && <button onClick={() => setCart([])} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 12 }}>Kosongkan</button>}
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px" }}>
              {cart.length === 0 ? <div style={{ textAlign: "center", color: "#4b5563", paddingTop: 50 }}><div style={{ fontSize: 36, marginBottom: 8 }}>🛒</div><div style={{ fontSize: 13 }}>Troli kosong</div></div>
                : cart.map(i => (
                  <div key={i._key} style={{ borderBottom: "1px solid #1a2a3a", paddingBottom: 8, marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ fontSize: 18 }}>{i.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{i.isCombo ? <span style={{ color: "#f59e0b", fontSize: 9 }}>[SET] </span> : null}{i.name}</div>
                        <div style={{ fontSize: 11, color: "#f59e0b" }}>{formatRM(i.price)}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <button onClick={() => updQty(i._key, -1)} style={{ width: 22, height: 22, borderRadius: 5, border: "1px solid #2a3d5e", background: "none", color: "#e2e8f0", cursor: "pointer", fontSize: 13 }}>−</button>
                        <span style={{ fontSize: 12, fontWeight: 600, minWidth: 16, textAlign: "center" }}>{i.qty}</span>
                        <button onClick={() => updQty(i._key, 1)} style={{ width: 22, height: 22, borderRadius: 5, border: "1px solid #2a3d5e", background: "none", color: "#e2e8f0", cursor: "pointer", fontSize: 13 }}>+</button>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, minWidth: 46, textAlign: "right" }}>{formatRM(i.price * i.qty)}</div>
                    </div>
                    {i.isCombo && i.comboItems && <div style={{ fontSize: 10, color: "#64748b", paddingLeft: 26, marginTop: 3 }}>{i.comboItems.map(ci => `· ${ci.name} x${ci.qty}`).join("  ")}</div>}
                  </div>
                ))}
            </div>
            {cart.length > 0 && !paying && (
              <div style={{ padding: "12px 14px", borderTop: "1px solid #1e2d4a" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#94a3b8", marginBottom: 3 }}><span>Subtotal</span><span>{formatRM(sub)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#94a3b8", marginBottom: 10 }}><span>SST (6%)</span><span>{formatRM(tax)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 17, fontWeight: 700, color: "#f59e0b", marginBottom: 12 }}><span>JUMLAH</span><span>{formatRM(total)}</span></div>
                <button onClick={() => setPaying(true)} style={{ width: "100%", padding: 12, background: "linear-gradient(135deg,#f59e0b,#ef4444)", border: "none", borderRadius: 10, color: "#000", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>💳 BAYAR</button>
              </div>
            )}
            {paying && (
              <div style={{ padding: "12px 14px", borderTop: "1px solid #1e2d4a" }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Kaedah Bayaran</div>
                <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
                  {[["cash", "💵 Tunai"], ["card", "💳 Kad"], ["qr", "📱 QR"]].map(([id, l]) => (
                    <button key={id} onClick={() => setPayMethod(id)} style={{ flex: 1, padding: "6px 3px", border: "1px solid", borderRadius: 7, fontSize: 10, cursor: "pointer", background: payMethod === id ? "#f59e0b" : "transparent", color: payMethod === id ? "#000" : "#94a3b8", borderColor: payMethod === id ? "#f59e0b" : "#2a3d5e", fontWeight: payMethod === id ? 700 : 400 }}>{l}</button>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700, color: "#f59e0b", marginBottom: 10 }}><span>JUMLAH</span><span>{formatRM(total)}</span></div>
                {payMethod === "cash" && (
                  <div style={{ marginBottom: 8 }}>
                    <input type="number" value={cashIn} onChange={e => setCashIn(e.target.value)} placeholder="Jumlah tunai..." style={{ ...INP, fontSize: 15, fontWeight: 700, marginBottom: 5 }} />
                    <div style={{ display: "flex", gap: 4, marginBottom: 5 }}>
                      {[10, 20, 50, 100].map(a => <button key={a} onClick={() => setCashIn(a.toString())} style={{ flex: 1, padding: "4px 0", background: "#0a0e1a", border: "1px solid #2a3d5e", borderRadius: 5, color: "#94a3b8", cursor: "pointer", fontSize: 11 }}>RM{a}</button>)}
                    </div>
                    {cashIn && parseFloat(cashIn) >= total && <div style={{ background: "#052e16", border: "1px solid #166534", borderRadius: 7, padding: "6px 10px", fontSize: 12, color: "#4ade80", display: "flex", justifyContent: "space-between" }}><span>Baki:</span><span style={{ fontWeight: 700 }}>{formatRM(change)}</span></div>}
                    {cashIn && parseFloat(cashIn) < total && <div style={{ background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 7, padding: "6px 10px", fontSize: 11, color: "#f87171" }}>⚠️ Wang tidak mencukupi</div>}
                  </div>
                )}
                {payMethod === "qr" && <div style={{ textAlign: "center", padding: "10px 0", marginBottom: 8 }}><div style={{ background: "#fff", width: 90, height: 90, margin: "0 auto 5px", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 45 }}>📱</div><div style={{ fontSize: 11, color: "#94a3b8" }}>DuitNow / TnG / GrabPay</div></div>}
                {payMethod === "card" && <div style={{ textAlign: "center", padding: "10px 0", marginBottom: 8 }}><div style={{ fontSize: 38, marginBottom: 5 }}>💳</div><div style={{ fontSize: 11, color: "#94a3b8" }}>Ketuk atau lap kad</div></div>}
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setPaying(false)} style={{ flex: 1, padding: 9, background: "none", border: "1px solid #2a3d5e", borderRadius: 8, color: "#94a3b8", cursor: "pointer", fontSize: 12 }}>← Balik</button>
                  <button onClick={() => checkout()} disabled={payMethod === "cash" && (!cashIn || parseFloat(cashIn) < total)}
                    style={{ flex: 2, padding: 9, background: payMethod === "cash" && (!cashIn || parseFloat(cashIn) < total) ? "#1a2a3a" : "linear-gradient(135deg,#16a34a,#15803d)", border: "none", borderRadius: 8, color: payMethod === "cash" && (!cashIn || parseFloat(cashIn) < total) ? "#4b5563" : "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>✅ SAHKAN</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PENDING QR ORDERS PAGE ── */}
      {page === "pending" && (
        <div style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>🔔 Order QR Masuk</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{pendingOrders.filter(o => o.status === "pending").length} pending · {pendingOrders.length} jumlah</div>
            </div>
            <button onClick={() => setQrModal(true)} style={{ padding: "8px 16px", background: "#f59e0b", border: "none", borderRadius: 8, color: "#000", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>📱 Jana QR</button>
          </div>

          {pendingOrders.length === 0 && (
            <div style={{ background: "#0f1629", border: "1px dashed #2a3d5e", borderRadius: 12, padding: 40, textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📱</div>
              <div style={{ fontSize: 14, color: "#64748b", marginBottom: 6 }}>Belum ada order QR</div>
              <div style={{ fontSize: 12, color: "#4b5563" }}>Klik "Jana QR" untuk generate QR code meja</div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pendingOrders.map(o => (
              <div key={o.id} style={{ background: "#0f1629", border: `1px solid ${o.status === "pending" ? "#f59e0b" : "#1e2d4a"}`, borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>Order #{o.num} · Meja {o.tableNo}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{fmtDate(o.time)} {fmtTime(o.time)}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b" }}>{formatRM(o.total)}</div>
                    <div style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: o.status === "pending" ? "#451a03" : "#052e16", color: o.status === "pending" ? "#f59e0b" : "#4ade80" }}>
                      {o.status === "pending" ? "⏳ Pending" : "✅ Done"}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10 }}>
                  {o.cart.map(i => `${i.emoji} ${i.name} x${i.qty}`).join("  ·  ")}
                </div>
                {o.status === "pending" && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => {
                      setCart(o.cart); setPage("pos");
                      setPendingOrders(p => p.map(x => x.id === o.id ? { ...x, status: "done" } : x));
                      toast("Order dimuatkan ke troli", "#4ade80");
                    }} style={{ flex: 1, padding: "7px 0", background: "#1e3a5f", border: "none", borderRadius: 7, color: "#93c5fd", cursor: "pointer", fontSize: 12 }}>📋 Muat ke Troli</button>
                    <button onClick={() => {
                      setLastOrder({ ...o, method: "qr_pending", cash: 0, change: 0 });
                      setReceipt(true);
                      setSalesHistory(h => [{ ...o, method: "cash", cash: o.total, change: 0, source: "qr" }, ...h]);
                      setPendingOrders(p => p.map(x => x.id === o.id ? { ...x, status: "done" } : x));
                    }} style={{ flex: 1, padding: "7px 0", background: "#052e16", border: "none", borderRadius: 7, color: "#4ade80", cursor: "pointer", fontSize: 12 }}>✅ Selesai + Print</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── HISTORY PAGE ── */}
      {page === "history" && (
        <div style={{ padding: 18 }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>📊 History Jualan</div>

          {/* Stats cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10, marginBottom: 16 }}>
            {[
              { label: "Hari Ini", value: formatRM(totalRevToday), count: salesHistory.filter(o => new Date(o.time).getTime() >= today).length, clr: "#f59e0b" },
              { label: "7 Hari", value: formatRM(totalRevWeek), count: salesHistory.filter(o => new Date(o.time).getTime() >= weekAgo).length, clr: "#93c5fd" },
              { label: "Semua Masa", value: formatRM(salesHistory.reduce((s, o) => s + o.total, 0)), count: salesHistory.length, clr: "#4ade80" },
            ].map(s => (
              <div key={s.label} style={{ background: "#0f1629", border: `1px solid ${s.clr}33`, borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.clr }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{s.count} transaksi</div>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
            {[["all", "Semua"], ["today", "Hari Ini"], ["week", "7 Hari"]].map(([k, l]) => (
              <button key={k} style={N(histFilter === k)} onClick={() => setHistFilter(k)}>{l}</button>
            ))}
            <input value={histSearch} onChange={e => setHistSearch(e.target.value)} placeholder="🔍 Cari order..." style={{ ...INP, flex: 1, minWidth: 160 }} />
          </div>

          {filteredHistory.length === 0 && (
            <div style={{ background: "#0f1629", border: "1px dashed #2a3d5e", borderRadius: 12, padding: 40, textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
              <div style={{ fontSize: 14, color: "#64748b" }}>Tiada rekod jualan</div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filteredHistory.map(o => (
              <div key={o.num} style={{ background: "#0f1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "12px 14px", cursor: "pointer" }}
                onClick={() => setHistDetail(histDetail?.num === o.num ? null : o)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Order #{o.num} {o.source === "qr" ? <span style={{ fontSize: 10, color: "#93c5fd", background: "#1e3a5f", padding: "1px 6px", borderRadius: 4 }}>QR</span> : ""}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{fmtDate(o.time)} · {fmtTime(o.time)} · {o.cart.length} item · {o.method === "cash" ? "💵" : o.method === "card" ? "💳" : "📱"}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#f59e0b" }}>{formatRM(o.total)}</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>{histDetail?.num === o.num ? "▲ tutup" : "▼ detail"}</div>
                  </div>
                </div>
                {histDetail?.num === o.num && (
                  <div style={{ marginTop: 10, borderTop: "1px solid #1e2d4a", paddingTop: 10 }}>
                    {o.tableNo && <div style={{ fontSize: 11, color: "#93c5fd", marginBottom: 6 }}>📍 Meja {o.tableNo}</div>}
                    {o.cart.map(i => (
                      <div key={i._key || i.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#94a3b8", marginBottom: 3 }}>
                        <span>{i.emoji} {i.isCombo ? "[SET] " : ""}{i.name} x{i.qty}</span>
                        <span>{formatRM(i.price * i.qty)}</span>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", marginTop: 4 }}><span>SST (6%)</span><span>{formatRM(o.tax)}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: "#f59e0b", marginTop: 4 }}><span>Jumlah</span><span>{formatRM(o.total)}</span></div>
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      {printers.map(p => (
                        <button key={p.id} onClick={(e) => { e.stopPropagation(); doPrint(p, buildReceiptBytes(o)); }} style={{ flex: 1, padding: "5px 8px", background: "#1e3a5f", border: "none", borderRadius: 6, color: "#93c5fd", cursor: "pointer", fontSize: 11 }}>
                          🖨️ {p.name} {printSt[p.id] || ""}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MENU PAGE ── */}
      {page === "menu" && (
        <div style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div><div style={{ fontSize: 18, fontWeight: 700 }}>🍽️ Pengurusan Menu</div><div style={{ fontSize: 12, color: "#64748b" }}>{products.length} item</div></div>
            <button onClick={openAddItem} style={{ padding: "8px 16px", background: "#f59e0b", border: "none", borderRadius: 8, color: "#000", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>+ Tambah Item</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 10 }}>
            {products.map(item => {
              const cat = categories.find(c => c.id === item.categoryId);
              const s = cat?.subcategories.find(s => s.id === item.subcategoryId);
              const assignedPrinter = printers.find(p => p.id === item.printerId);
              return (
                <div key={item.id} style={{ background: "#0f1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 30 }}>{item.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{cat?.name}{s ? ` › ${s.name}` : ""}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b" }}>{formatRM(item.price)}</div>
                    {assignedPrinter && <div style={{ fontSize: 10, color: "#93c5fd" }}>🖨️ {assignedPrinter.name} ({assignedPrinter.location})</div>}
                  </div>
                  <div style={{ display: "flex", gap: 5 }}>
                    <button onClick={() => openEditItem(item)} style={{ padding: "5px 9px", background: "#1e3a5f", border: "none", borderRadius: 6, color: "#93c5fd", cursor: "pointer", fontSize: 12 }}>✏️</button>
                    <button onClick={() => delItem(item.id)} style={{ padding: "5px 9px", background: "#3f1515", border: "none", borderRadius: 6, color: "#f87171", cursor: "pointer", fontSize: 12 }}>🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── COMBO PAGE ── */}
      {page === "combos" && (
        <div style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div><div style={{ fontSize: 18, fontWeight: 700 }}>🍱 Set / Combo</div><div style={{ fontSize: 12, color: "#64748b" }}>{combos.length} combo</div></div>
            <button onClick={openAddCombo} style={{ padding: "8px 16px", background: "#f59e0b", border: "none", borderRadius: 8, color: "#000", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>+ Tambah Set</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 10 }}>
            {combos.map(c => {
              const assignedPrinter = printers.find(p => p.id === c.printerId);
              return (
                <div key={c.id} style={{ background: "#0f1629", border: "1px solid #f59e0b33", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                    <div style={{ fontSize: 30 }}>{c.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</div>
                      <div style={{ fontSize: 13, color: "#f59e0b", fontWeight: 700 }}>{formatRM(c.price)}</div>
                      {c.description && <div style={{ fontSize: 11, color: "#64748b" }}>{c.description}</div>}
                      {assignedPrinter && <div style={{ fontSize: 10, color: "#93c5fd" }}>🖨️ {assignedPrinter.name}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 5 }}>
                      <button onClick={() => openEditCombo(c)} style={{ padding: "5px 9px", background: "#1e3a5f", border: "none", borderRadius: 6, color: "#93c5fd", cursor: "pointer", fontSize: 12 }}>✏️</button>
                      <button onClick={() => delCombo(c.id)} style={{ padding: "5px 9px", background: "#3f1515", border: "none", borderRadius: 6, color: "#f87171", cursor: "pointer", fontSize: 12 }}>🗑️</button>
                    </div>
                  </div>
                  <div style={{ background: "#0a0e1a", borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Kandungan set:</div>
                    {c.items?.map(ci => {
                      const p = products.find(x => x.id === ci.productId);
                      return p ? <div key={ci.productId} style={{ fontSize: 12, color: "#94a3b8" }}>· {p.emoji} {p.name} × {ci.qty}</div> : null;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── CATEGORIES PAGE ── */}
      {page === "categories" && (
        <div style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div><div style={{ fontSize: 18, fontWeight: 700 }}>📂 Pengurusan Kategori</div><div style={{ fontSize: 12, color: "#64748b" }}>{categories.length} kategori</div></div>
            <button onClick={openAddCat} style={{ padding: "8px 16px", background: "#f59e0b", border: "none", borderRadius: 8, color: "#000", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>+ Tambah Kategori</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {categories.map(cat => (
              <div key={cat.id} style={{ background: "#0f1629", border: "1px solid #1e2d4a", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button onClick={() => setExpCat(expCat === cat.id ? null : cat.id)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 14 }}>{expCat === cat.id ? "▼" : "▶"}</button>
                    <div><div style={{ fontWeight: 700, fontSize: 14 }}>{cat.name}</div><div style={{ fontSize: 11, color: "#64748b" }}>{cat.subcategories.length} sub · {products.filter(p => p.categoryId === cat.id).length} item</div></div>
                  </div>
                  <div style={{ display: "flex", gap: 5 }}>
                    <button onClick={() => openAddSub(cat.id)} style={{ padding: "5px 9px", background: "#1a3a2a", border: "none", borderRadius: 6, color: "#4ade80", cursor: "pointer", fontSize: 12 }}>+ Sub</button>
                    <button onClick={() => openEditCat(cat)} style={{ padding: "5px 9px", background: "#1e3a5f", border: "none", borderRadius: 6, color: "#93c5fd", cursor: "pointer", fontSize: 12 }}>✏️</button>
                    <button onClick={() => delCat(cat.id)} style={{ padding: "5px 9px", background: "#3f1515", border: "none", borderRadius: 6, color: "#f87171", cursor: "pointer", fontSize: 12 }}>🗑️</button>
                  </div>
                </div>
                {expCat === cat.id && (
                  <div style={{ borderTop: "1px solid #1e2d4a", padding: "8px 14px 12px" }}>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>Sub-kategori:</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {cat.subcategories.map(s => (
                        <div key={s.id} style={{ background: "#0a0e1a", border: "1px solid #2a3d5e", borderRadius: 7, padding: "5px 10px", display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 12 }}>{s.name}</span>
                          <button onClick={() => openEditSub(s, cat.id)} style={{ background: "none", border: "none", color: "#93c5fd", cursor: "pointer", fontSize: 11 }}>✏️</button>
                          <button onClick={() => delSub(s.id, cat.id)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 11 }}>✕</button>
                        </div>
                      ))}
                      {cat.subcategories.length === 0 && <div style={{ fontSize: 12, color: "#4b5563" }}>Tiada sub-kategori</div>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PRINTERS PAGE ── */}
      {page === "printers" && (
        <div style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div><div style={{ fontSize: 18, fontWeight: 700 }}>🖨️ Pengurusan Printer</div><div style={{ fontSize: 12, color: "#64748b" }}>{printers.length} printer</div></div>
            <button onClick={openAddPrinter} style={{ padding: "8px 16px", background: "#f59e0b", border: "none", borderRadius: 8, color: "#000", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>+ Tambah Printer</button>
          </div>
          {printers.length === 0 && (
            <div style={{ background: "#0f1629", border: "1px dashed #2a3d5e", borderRadius: 12, padding: 40, textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🖨️</div>
              <div style={{ fontSize: 14, color: "#64748b", marginBottom: 6 }}>Belum ada printer</div>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {printers.map(p => (
              <div key={p.id} style={{ background: "#0f1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 28 }}>{p.type === "bluetooth" ? "📶" : "📡"}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{p.type === "bluetooth" ? `Bluetooth · ${p.deviceId || "Belum set"}` : `WiFi · ${p.ip || "Belum set"}:${p.port || 9100}`}</div>
                    <div style={{ fontSize: 11, color: "#f59e0b" }}>📍 {p.location}</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>
                      Item: {products.filter(x => x.printerId === p.id).length} menu · {combos.filter(x => x.printerId === p.id).length} combo
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => testPrint(p)} style={{ padding: "6px 10px", background: "#1a3a2a", border: "none", borderRadius: 6, color: "#4ade80", cursor: "pointer", fontSize: 12 }}>{printSt[p.id] || "🖨️ Test"}</button>
                  <button onClick={() => openEditPrinter(p)} style={{ padding: "6px 10px", background: "#1e3a5f", border: "none", borderRadius: 6, color: "#93c5fd", cursor: "pointer", fontSize: 12 }}>✏️</button>
                  <button onClick={() => delPrinter(p.id)} style={{ padding: "6px 10px", background: "#3f1515", border: "none", borderRadius: 6, color: "#f87171", cursor: "pointer", fontSize: 12 }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18, background: "#0f1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>ℹ️ Cara assign printer ke menu/combo</div>
            <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.9 }}>
              <div>1. Setup printer dulu (WiFi atau Bluetooth)</div>
              <div>2. Pergi ke <b style={{ color: "#e2e8f0" }}>🍽️ Menu</b> → Edit item → pilih printer dapur/kaunter</div>
              <div>3. Pergi ke <b style={{ color: "#e2e8f0" }}>🍱 Set/Combo</b> → Edit combo → pilih printer</div>
              <div>4. Semasa checkout, resit ke semua printer, slip dapur ke printer yang di-assign</div>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODALS ══════════════════════════════════════════════════════════ */}

      {/* QR Generator Modal */}
      {qrModal && (
        <div style={MODAL} onClick={() => setQrModal(false)}>
          <div style={MBOX} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>📱 Jana QR Order</div>
            <div style={{ marginBottom: 14 }}>
              <label style={LBL}>Nombor Meja</label>
              <input value={qrTable} onChange={e => setQrTable(e.target.value)} placeholder="1" style={INP} />
            </div>
            <div style={{ background: "#0a0e1a", borderRadius: 12, padding: 20, textAlign: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>QR Code untuk Meja {qrTable}</div>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <QRImg value={`${window.location.href}?table=${qrTable}&order=1`} size={180} />
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 8, wordBreak: "break-all" }}>
                {`${window.location.href}?table=${qrTable}`}
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14, background: "#0a0e1a", borderRadius: 8, padding: "10px 12px" }}>
              💡 <b style={{ color: "#f59e0b" }}>Cara guna:</b> Print QR ini letak atas meja. Customer scan, buat order terus dari phone. Order akan masuk dalam tab <b style={{ color: "#93c5fd" }}>🔔 Order QR</b>.
            </div>
            <button onClick={() => { setQrTablePreview(qrTable); setQrModal(false); setQrPreview(true); }} style={{ width: "100%", padding: 10, background: "#1e3a5f", border: "1px solid #2a3d5e", borderRadius: 8, color: "#93c5fd", cursor: "pointer", fontSize: 13, marginBottom: 8 }}>
              👁️ Preview Paparan Customer (Meja {qrTable})
            </button>
            <button onClick={() => setQrModal(false)} style={{ width: "100%", padding: 10, background: "#f59e0b", border: "none", borderRadius: 8, color: "#000", fontWeight: 700, cursor: "pointer" }}>Tutup</button>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {itemModal && (
        <div style={MODAL} onClick={() => setItemModal(false)}>
          <div style={MBOX} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>{editItem ? "✏️ Edit Item" : "➕ Tambah Item"}</div>
            <div style={{ marginBottom: 10 }}>
              <label style={LBL}>Emoji</label>
              <button onClick={() => setEmojiPick(!emojiPick)} style={{ background: "#0a0e1a", border: "1px solid #1e2d4a", borderRadius: 8, padding: "7px 14px", fontSize: 22, cursor: "pointer" }}>{itemF.emoji}</button>
              {emojiPick && <div style={{ background: "#0a0e1a", border: "1px solid #1e2d4a", borderRadius: 8, padding: 8, marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4, maxHeight: 120, overflowY: "auto" }}>{EMOJIS.map(e => <button key={e} onClick={() => { setItemF(f => ({ ...f, emoji: e })); setEmojiPick(false); }} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>{e}</button>)}</div>}
            </div>
            <div style={{ marginBottom: 10 }}><label style={LBL}>Nama Item</label><input value={itemF.name} onChange={e => setItemF(f => ({ ...f, name: e.target.value }))} placeholder="Contoh: Nasi Lemak" style={INP} /></div>
            <div style={{ marginBottom: 10 }}><label style={LBL}>Harga (RM)</label><input type="number" value={itemF.price} onChange={e => setItemF(f => ({ ...f, price: e.target.value }))} placeholder="0.00" style={INP} /></div>
            <div style={{ marginBottom: 10 }}><label style={LBL}>Kategori</label><select value={itemF.categoryId} onChange={e => setItemF(f => ({ ...f, categoryId: e.target.value, subcategoryId: categories.find(c => c.id === e.target.value)?.subcategories[0]?.id || "" }))} style={SEL}>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div style={{ marginBottom: 10 }}><label style={LBL}>Sub-kategori</label><select value={itemF.subcategoryId} onChange={e => setItemF(f => ({ ...f, subcategoryId: e.target.value }))} style={SEL}><option value="">-- Tiada --</option>{itemSubs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div style={{ marginBottom: 18 }}>
              <label style={LBL}>🖨️ Print ke Printer (Dapur/Kaunter)</label>
              <select value={itemF.printerId} onChange={e => setItemF(f => ({ ...f, printerId: e.target.value }))} style={SEL}>
                <option value="">-- Ikut resit biasa --</option>
                {printers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.location})</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setItemModal(false)} style={{ flex: 1, padding: 10, background: "none", border: "1px solid #2a3d5e", borderRadius: 8, color: "#94a3b8", cursor: "pointer" }}>Batal</button>
              <button onClick={saveItem} style={{ flex: 2, padding: 10, background: "#f59e0b", border: "none", borderRadius: 8, color: "#000", fontWeight: 700, cursor: "pointer" }}>Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {catModal && (
        <div style={MODAL} onClick={() => setCatModal(false)}>
          <div style={MBOX} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>{editCat ? "✏️ Edit Kategori" : "➕ Tambah Kategori"}</div>
            <div style={{ marginBottom: 18 }}><label style={LBL}>Nama Kategori</label><input value={catF.name} onChange={e => setCatF({ name: e.target.value })} placeholder="Contoh: Makanan" style={INP} /></div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setCatModal(false)} style={{ flex: 1, padding: 10, background: "none", border: "1px solid #2a3d5e", borderRadius: 8, color: "#94a3b8", cursor: "pointer" }}>Batal</button>
              <button onClick={saveCat} style={{ flex: 2, padding: 10, background: "#f59e0b", border: "none", borderRadius: 8, color: "#000", fontWeight: 700, cursor: "pointer" }}>Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-category Modal */}
      {subModal && (
        <div style={MODAL} onClick={() => setSubModal(false)}>
          <div style={MBOX} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>{editSub ? "✏️ Edit Sub-kategori" : "➕ Tambah Sub-kategori"}</div>
            <div style={{ marginBottom: 8 }}><label style={LBL}>Dalam Kategori</label><div style={{ fontSize: 14, fontWeight: 600, color: "#f59e0b" }}>{categories.find(c => c.id === subF.catId)?.name}</div></div>
            <div style={{ marginBottom: 18 }}><label style={LBL}>Nama Sub-kategori</label><input value={subF.name} onChange={e => setSubF(f => ({ ...f, name: e.target.value }))} placeholder="Contoh: Nasi" style={INP} /></div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setSubModal(false)} style={{ flex: 1, padding: 10, background: "none", border: "1px solid #2a3d5e", borderRadius: 8, color: "#94a3b8", cursor: "pointer" }}>Batal</button>
              <button onClick={saveSub} style={{ flex: 2, padding: 10, background: "#f59e0b", border: "none", borderRadius: 8, color: "#000", fontWeight: 700, cursor: "pointer" }}>Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Printer Modal */}
      {printerModal && (
        <div style={MODAL} onClick={() => setPrinterModal(false)}>
          <div style={MBOX} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>{editPrinter ? "✏️ Edit Printer" : "➕ Tambah Printer"}</div>
            <div style={{ marginBottom: 10 }}><label style={LBL}>Nama Printer</label><input value={pF.name} onChange={e => setPF(f => ({ ...f, name: e.target.value }))} placeholder="Contoh: Printer Dapur" style={INP} /></div>
            <div style={{ marginBottom: 10 }}><label style={LBL}>Lokasi</label><input value={pF.location} onChange={e => setPF(f => ({ ...f, location: e.target.value }))} placeholder="Contoh: Kaunter / Dapur" style={INP} /></div>
            <div style={{ marginBottom: 10 }}>
              <label style={LBL}>Jenis Sambungan</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[["wifi", "📡 WiFi"], ["bluetooth", "📶 Bluetooth"]].map(([t, l]) => (
                  <button key={t} onClick={() => setPF(f => ({ ...f, type: t }))} style={{ flex: 1, padding: 10, border: "1px solid", borderRadius: 8, cursor: "pointer", background: pF.type === t ? "#f59e0b" : "transparent", color: pF.type === t ? "#000" : "#94a3b8", borderColor: pF.type === t ? "#f59e0b" : "#2a3d5e", fontWeight: pF.type === t ? 700 : 400, fontSize: 13 }}>{l}</button>
                ))}
              </div>
            </div>
            {pF.type === "wifi" && <>
              <div style={{ marginBottom: 10 }}><label style={LBL}>IP Address Printer</label><input value={pF.ip} onChange={e => setPF(f => ({ ...f, ip: e.target.value }))} placeholder="192.168.1.100" style={INP} /></div>
              <div style={{ marginBottom: 14 }}><label style={LBL}>Port (default: 9100)</label><input value={pF.port} onChange={e => setPF(f => ({ ...f, port: e.target.value }))} placeholder="9100" style={INP} /></div>
            </>}
            {pF.type === "bluetooth" && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ marginBottom: 10 }}>
                  <label style={LBL}>Jenis Bluetooth</label>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <button onClick={() => setPF(f => ({ ...f, btType: "classic" }))} style={{ flex: 1, padding: "8px", border: "1px solid", borderRadius: 8, cursor: "pointer", background: (pF.btType || "classic") === "classic" ? "#f59e0b" : "transparent", color: (pF.btType || "classic") === "classic" ? "#000" : "#94a3b8", borderColor: (pF.btType || "classic") === "classic" ? "#f59e0b" : "#2a3d5e", fontWeight: (pF.btType || "classic") === "classic" ? 700 : 400, fontSize: 12 }}>
                      🖨️ Classic<br/><span style={{ fontSize: 10, fontWeight: 400 }}>MPT-11, Zywell, Epson TM</span>
                    </button>
                    <button onClick={() => setPF(f => ({ ...f, btType: "ble" }))} style={{ flex: 1, padding: "8px", border: "1px solid", borderRadius: 8, cursor: "pointer", background: pF.btType === "ble" ? "#f59e0b" : "transparent", color: pF.btType === "ble" ? "#000" : "#94a3b8", borderColor: pF.btType === "ble" ? "#f59e0b" : "#2a3d5e", fontWeight: pF.btType === "ble" ? 700 : 400, fontSize: 12 }}>
                      📶 BLE<br/><span style={{ fontSize: 10, fontWeight: 400 }}>Printer BLE baru</span>
                    </button>
                  </div>
                </div>
                <label style={LBL}>Device Bluetooth</label>
                <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                  <input value={pF.deviceId} onChange={e => setPF(f => ({ ...f, deviceId: e.target.value }))} placeholder="AA:BB:CC:DD:EE:FF" style={{ ...INP, flex: 1 }} />
                  <button onClick={doScan} disabled={scanning} style={{ padding: "10px 12px", background: "#1e3a5f", border: "none", borderRadius: 8, color: "#93c5fd", cursor: "pointer", fontSize: 12 }}>{scanning ? "⏳" : "📡 Scan"}</button>
                </div>
                {btDevs.length > 0 && (
                  <div style={{ background: "#0a0e1a", border: "1px solid #1e2d4a", borderRadius: 8, padding: 8, maxHeight: 110, overflowY: "auto" }}>
                    {btDevs.map(d => <button key={d.deviceId} onClick={() => setPF(f => ({ ...f, deviceId: d.deviceId }))} style={{ width: "100%", textAlign: "left", background: pF.deviceId === d.deviceId ? "#1e3a5f" : "none", border: "none", borderRadius: 6, padding: "5px 8px", color: "#e2e8f0", cursor: "pointer", fontSize: 12, marginBottom: 2 }}>📶 {d.name} <span style={{ color: "#64748b" }}>({d.deviceId})</span></button>)}
                  </div>
                )}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setPrinterModal(false)} style={{ flex: 1, padding: 10, background: "none", border: "1px solid #2a3d5e", borderRadius: 8, color: "#94a3b8", cursor: "pointer" }}>Batal</button>
              <button onClick={savePrinter} style={{ flex: 2, padding: 10, background: "#f59e0b", border: "none", borderRadius: 8, color: "#000", fontWeight: 700, cursor: "pointer" }}>Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Combo Modal */}
      {comboModal && (
        <div style={MODAL} onClick={() => setComboModal(false)}>
          <div style={MBOX} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>{editCombo ? "✏️ Edit Set/Combo" : "➕ Tambah Set/Combo"}</div>
            <div style={{ marginBottom: 10 }}>
              <label style={LBL}>Emoji</label>
              <button onClick={() => setEmojiPickCombo(!emojiPickCombo)} style={{ background: "#0a0e1a", border: "1px solid #1e2d4a", borderRadius: 8, padding: "7px 14px", fontSize: 22, cursor: "pointer" }}>{comboF.emoji}</button>
              {emojiPickCombo && <div style={{ background: "#0a0e1a", border: "1px solid #1e2d4a", borderRadius: 8, padding: 8, marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4, maxHeight: 100, overflowY: "auto" }}>{EMOJIS.map(e => <button key={e} onClick={() => { setComboF(f => ({ ...f, emoji: e })); setEmojiPickCombo(false); }} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>{e}</button>)}</div>}
            </div>
            <div style={{ marginBottom: 10 }}><label style={LBL}>Nama Set</label><input value={comboF.name} onChange={e => setComboF(f => ({ ...f, name: e.target.value }))} placeholder="Contoh: Set Sarapan A" style={INP} /></div>
            <div style={{ marginBottom: 10 }}><label style={LBL}>Harga Set (RM)</label><input type="number" value={comboF.price} onChange={e => setComboF(f => ({ ...f, price: e.target.value }))} placeholder="0.00" style={INP} /></div>
            <div style={{ marginBottom: 10 }}><label style={LBL}>Keterangan (optional)</label><input value={comboF.description} onChange={e => setComboF(f => ({ ...f, description: e.target.value }))} placeholder="Contoh: Nasi + Ayam + Teh" style={INP} /></div>
            <div style={{ marginBottom: 10 }}>
              <label style={LBL}>🖨️ Printer Default Set (Cashier)</label>
              <select value={comboF.printerId} onChange={e => setComboF(f => ({ ...f, printerId: e.target.value }))} style={SEL}>
                <option value="">-- Ikut resit biasa --</option>
                {printers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.location})</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={LBL}>Item dalam Set — setiap item boleh assign printer sendiri</label>
              <div style={{ background: "#0a0e1a", border: "1px solid #1e2d4a", borderRadius: 8, padding: 10, marginBottom: 6, maxHeight: 200, overflowY: "auto" }}>
                {comboF.items.length === 0 && <div style={{ fontSize: 12, color: "#4b5563" }}>Belum ada item dipilih</div>}
                {comboF.items.map(ci => {
                  const p = products.find(x => x.id === ci.productId);
                  return p ? (
                    <div key={ci.productId} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, background: "#0f1629", borderRadius: 8, padding: "6px 8px" }}>
                      <span style={{ fontSize: 16 }}>{p.emoji}</span>
                      <span style={{ fontSize: 12, flex: 1, fontWeight: 600 }}>{p.name}</span>
                      <span style={{ fontSize: 11, color: "#64748b" }}>×{ci.qty}</span>
                      <select value={ci.printerId || ""} onChange={e => setComboF(f => ({ ...f, items: f.items.map(i => i.productId === ci.productId ? { ...i, printerId: e.target.value } : i) }))}
                        style={{ fontSize: 10, background: "#0a0e1a", border: "1px solid #2a3d5e", borderRadius: 5, color: "#e2e8f0", padding: "3px 4px", maxWidth: 100 }}>
                        <option value="">🖨️ Printer</option>
                        {printers.map(pr => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
                      </select>
                      <button onClick={() => removeComboItem(ci.productId)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 13 }}>✕</button>
                    </div>
                  ) : null;
                })}
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 5 }}>Tambah item (ikut kategori):</div>
              <div style={{ display: "flex", gap: 5, marginBottom: 6, flexWrap: "wrap" }}>
                <button onClick={() => setComboItemCatFilter("all")} style={{ padding: "3px 8px", borderRadius: 5, border: "1px solid", fontSize: 11, cursor: "pointer", background: comboItemCatFilter === "all" ? "#f59e0b" : "transparent", color: comboItemCatFilter === "all" ? "#000" : "#94a3b8", borderColor: comboItemCatFilter === "all" ? "#f59e0b" : "#2a3d5e" }}>Semua</button>
                {categories.map(c => (
                  <button key={c.id} onClick={() => setComboItemCatFilter(c.id)} style={{ padding: "3px 8px", borderRadius: 5, border: "1px solid", fontSize: 11, cursor: "pointer", background: comboItemCatFilter === c.id ? "#f59e0b" : "transparent", color: comboItemCatFilter === c.id ? "#000" : "#94a3b8", borderColor: comboItemCatFilter === c.id ? "#f59e0b" : "#2a3d5e" }}>{c.name}</button>
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxHeight: 120, overflowY: "auto" }}>
                {products.filter(p => comboItemCatFilter === "all" || p.categoryId === comboItemCatFilter).map(p => (
                  <button key={p.id} onClick={() => addComboItem(p.id)} style={{ padding: "4px 8px", background: comboF.items.find(i => i.productId === p.id) ? "#1a3a2a" : "#0a0e1a", border: "1px solid", borderColor: comboF.items.find(i => i.productId === p.id) ? "#4ade80" : "#2a3d5e", borderRadius: 5, color: "#e2e8f0", cursor: "pointer", fontSize: 11 }}>
                    {p.emoji} {p.name} {comboF.items.find(i => i.productId === p.id) ? `✓${comboF.items.find(i => i.productId === p.id).qty}` : ""}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button onClick={() => setComboModal(false)} style={{ flex: 1, padding: 10, background: "none", border: "1px solid #2a3d5e", borderRadius: 8, color: "#94a3b8", cursor: "pointer" }}>Batal</button>
              <button onClick={saveCombo} style={{ flex: 2, padding: 10, background: "#f59e0b", border: "none", borderRadius: 8, color: "#000", fontWeight: 700, cursor: "pointer" }}>Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}