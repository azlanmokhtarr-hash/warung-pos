import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, setDoc, getDoc, query, orderBy } from "firebase/firestore";

// ─── Firebase Config ─────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCnH_0m3T_IDRuwVxDpDquwE8a-X0lPp2M",
  authDomain: "warung-pos-76430.firebaseapp.com",
  projectId: "warung-pos-76430",
  storageBucket: "warung-pos-76430.firebasestorage.app",
  messagingSenderId: "321981346807",
  appId: "1:321981346807:web:8f3b46fd66b2ff5050b4f2"
};
const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);

// ─── QR Library ─────────────────────────────────────────────────────────────
function QRImg({ value, size = 160, id }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&bgcolor=ffffff&color=0a0e1a&margin=10`;
  return <img id={id} src={url} alt="QR" style={{ width: size, height: size, borderRadius: 8, border: "3px solid #f59e0b" }} crossOrigin="anonymous" />;
}

// ─── Constants ───────────────────────────────────────────────────────────────
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

const DEFAULT_COMBOS = [
  { id: "combo1", name: "Set Nasi A", emoji: "🍱", price: 9.00, categoryId: "cat1", items: [{ productId: 1, qty: 1, printerId: "" }, { productId: 7, qty: 1, printerId: "" }], printerId: "", description: "Nasi Lemak + Teh Tarik" },
  { id: "combo2", name: "Set Sarapan", emoji: "🌅", price: 7.00, categoryId: "cat1", items: [{ productId: 3, qty: 2, printerId: "" }, { productId: 8, qty: 1, printerId: "" }], printerId: "", description: "2x Roti Canai + Kopi O" },
];

const DEFAULT_TABLES = [
  { id: "t1", name: "Meja 1", section: "Dalam" },
  { id: "t2", name: "Meja 2", section: "Dalam" },
  { id: "t3", name: "Meja 3", section: "Dalam" },
  { id: "t4", name: "Meja 4", section: "Dalam" },
  { id: "t5", name: "Meja 5", section: "Luar" },
  { id: "t6", name: "Meja 6", section: "Luar" },
  { id: "t7", name: "Meja 7", section: "Luar" },
  { id: "t8", name: "Meja 8", section: "Luar" },
];

const EMOJIS = ["🍚","🍜","🫓","🍳","🍗","🍢","🧋","☕","💧","🥤","🍊","🌸","🍧","🧊","🍰","🥗","🍱","🌮","🍕","🍔","🥩","🍣","🍛","🥘","🍲","🧆","🥚","🍞","🧁","🍩","🍦","🍮","🍫","🍬","🧃","🥛","🍵","🍺","🥂","🌅","🎁","⭐","🔥","💫"];

const ORDER_TYPES = [
  { id: "dinein", label: "Dine In", emoji: "🍽️", color: "#3b82f6" },
  { id: "takeaway", label: "Takeaway", emoji: "🥡", color: "#f59e0b" },
  { id: "delivery", label: "Delivery", emoji: "🛵", color: "#10b981" },
];

function formatRM(a) { return `RM ${Number(a).toFixed(2)}`; }
function fmtTime(d) { return new Date(d).toLocaleTimeString("ms-MY", { hour: "2-digit", minute: "2-digit" }); }
function fmtDate(d) { return new Date(d).toLocaleDateString("ms-MY", { day: "2-digit", month: "short", year: "numeric" }); }

function useLocalStorage(key, def) {
  const [v, sv] = useState(() => { try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : def; } catch { return def; } });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }, [key, v]);
  return [v, sv];
}

// ─── ESC/POS Builders ────────────────────────────────────────────────────────
// printerWidth: "58" = 32 chars, "80" = 48 chars
function getPrintWidth(printerWidth) { return printerWidth === "80" ? 48 : 32; }

// ─── Logo image → ESC/POS raster bitmap ──────────────────────────────────────
function loadImageEl(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Convert a base64 image into ESC/POS GS v 0 raster bitmap bytes (monochrome, dithered by threshold)
async function imageToEscPosRaster(base64, maxWidthDots = 240) {
  try {
    const img = await loadImageEl(base64);
    const scale = Math.min(1, maxWidthDots / img.width);
    let w = Math.max(8, Math.round(img.width * scale));
    let h = Math.max(1, Math.round(img.height * scale));
    w = w - (w % 8) || 8; // width must be a multiple of 8 dots
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const imgData = ctx.getImageData(0, 0, w, h).data;
    const widthBytes = w / 8;
    const data = new Uint8Array(widthBytes * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const r = imgData[idx], g = imgData[idx + 1], b = imgData[idx + 2], a = imgData[idx + 3];
        const lum = a < 128 ? 255 : (0.299 * r + 0.587 * g + 0.114 * b);
        if (lum < 160) data[y * widthBytes + (x >> 3)] |= (0x80 >> (x % 8));
      }
    }
    const GS = 0x1D;
    const header = [GS, 0x76, 0x30, 0x00, widthBytes & 0xFF, (widthBytes >> 8) & 0xFF, h & 0xFF, (h >> 8) & 0xFF];
    const out = new Uint8Array(header.length + data.length);
    out.set(header, 0);
    out.set(data, header.length);
    return out;
  } catch (e) { return null; }
}

// openDrawer: kicks the cash drawer (ESC p 0 25 250) — only meaningful for printers wired to a drawer
async function buildReceiptBytes(order, receiptConfig = {}, printerWidth = "58", openDrawer = false) {
  const { shopName = "WARUNG DIGITAL", phone = "03-1234 5678", address = "", footer = "Terima Kasih! Sila Datang Lagi", logoBase64 = "" } = receiptConfig;
  const ESC = 0x1B, GS = 0x1D;
  const W = getPrintWidth(printerWidth);
  const enc = new TextEncoder();
  const bytes = [];
  const add = (t) => bytes.push(...enc.encode(t + "\n"));
  bytes.push(ESC, 0x40);
  if (openDrawer) bytes.push(ESC, 0x70, 0x00, 0x19, 0xFA);
  bytes.push(ESC, 0x61, 0x01);
  if (logoBase64) {
    const maxDots = printerWidth === "80" ? 360 : 240;
    const logoRaster = await imageToEscPosRaster(logoBase64, maxDots);
    if (logoRaster) { bytes.push(...logoRaster); add(""); }
  }
  add(shopName);
  if (phone) add(phone);
  if (address) add(address);
  bytes.push(ESC, 0x61, 0x00);
  add("-".repeat(W));
  add(`No: #${order.num}  ${new Date(order.time).toLocaleString("ms-MY")}`);
  if (order.tableNo) add(`Meja: ${order.tableNo}`);
  if (order.orderType) add(`Jenis: ${order.orderType}`);
  if (order.customerName) add(`Nama: ${order.customerName}`);
  if (order.customerPhone) add(`Tel: ${order.customerPhone}`);
  add("-".repeat(W));
  order.cart.forEach(i => {
    const nm = i.isCombo ? `[SET] ${i.name}` : i.name;
    // Wrap nama kalau panjang, harga kekal kat baris nama pertama
    const price = formatRM(i.price * i.qty);
    const firstLine = `${nm} x${i.qty}`;
    if (firstLine.length + price.length + 1 <= W) {
      add(firstLine + " ".repeat(Math.max(1, W - firstLine.length - price.length)) + price);
    } else {
      // Nama terlalu panjang — wrap nama, letak harga kat baris tersendiri
      add(firstLine);
      add(" ".repeat(Math.max(1, W - price.length)) + price);
    }
    // Print sub-items (extras) bawah item utama
    if (i.comboItems && i.comboItems.length > 0) {
      i.comboItems.forEach(ci => add(`  + ${ci.name} x${ci.qty}`));
    }
    if (i.note) add(`  >> ${i.note}`);
  });
  add("-".repeat(W));
  const padW = W - 8;
  add(`${"Subtotal".padEnd(padW)}${formatRM(order.subtotal)}`);
  if (order.tax > 0) add(`${"SST (6%)".padEnd(padW)}${formatRM(order.tax)}`);
  if ((order.discount || 0) > 0) add(`${"Diskaun".padEnd(padW)}-${formatRM(order.discount)}`);
  if ((order.topup || 0) > 0) add(`${"Topup/Extra".padEnd(padW)}+${formatRM(order.topup)}`);
  if (order.deliveryCharge > 0) add(`${"Caj Penghantaran".padEnd(padW)}${formatRM(order.deliveryCharge)}`);
  bytes.push(ESC, 0x45, 0x01);
  add(`${"JUMLAH".padEnd(padW)}${formatRM(order.total)}`);
  bytes.push(ESC, 0x45, 0x00);
  if (order.method === "cash") {
    const cashLine = `${"Tunai".padEnd(padW)}${formatRM(order.cash)}`;
    const bakiLine = `${"Baki".padEnd(padW)}${formatRM(order.change)}`;
    add(cashLine);
    add(bakiLine);
  }
  add("-".repeat(W));
  bytes.push(ESC, 0x61, 0x01);
  add(footer || "Terima Kasih! Sila Datang Lagi");
  bytes.push(ESC, 0x61, 0x00);
  bytes.push(GS, 0x56, 0x41, 0x10);
  return new Uint8Array(bytes);
}

function buildOrderSlipBytes(order, printerName, items, showPrice = false, printerWidth = "58") {
  const ESC = 0x1B, GS = 0x1D;
  const W = getPrintWidth(printerWidth);
  const enc = new TextEncoder();
  const bytes = [];
  const add = (t) => bytes.push(...enc.encode(t + "\n"));
  bytes.push(ESC, 0x40);
  bytes.push(ESC, 0x61, 0x01);
  bytes.push(ESC, 0x45, 0x01);
  add("*** ORDER SLIP ***");
  bytes.push(ESC, 0x45, 0x00);
  add(printerName.toUpperCase());
  bytes.push(ESC, 0x61, 0x00);
  add("-".repeat(W));
  add(`Order #${order.num}  ${fmtTime(order.time)}`);
  if (order.tableNo) add(`Meja: ${order.tableNo}`);
  if (order.orderType) add(`Jenis: ${order.orderType}`);
  if (order.customerName) add(`Nama: ${order.customerName}`);
  if (order.customerPhone) add(`Tel: ${order.customerPhone}`);
  add("-".repeat(W));
  items.forEach(i => {
    bytes.push(ESC, 0x45, 0x01);
    if (showPrice) {
      const l = `${i.name} x${i.qty}`, r = formatRM(i.price * i.qty);
      add(l + " ".repeat(Math.max(1, W - l.length - r.length)) + r);
    } else {
      add(`${i.name} x${i.qty}`);
    }
    bytes.push(ESC, 0x45, 0x00);
    // Item dalam set — print bawah nama set (bukan tepi)
    if (i.comboItems && i.comboItems.length > 0) i.comboItems.forEach(ci => add(`  - ${ci.name} x${ci.qty}`));
    if (i.note) { bytes.push(ESC, 0x45, 0x01); add(`  >> ${i.note}`); bytes.push(ESC, 0x45, 0x00); }
    if (i.notes) add(`  >> ${i.notes}`);
  });
  add("-".repeat(W));
  if (showPrice) {
    const padW = W - 8;
    add(`${"JUMLAH".padEnd(padW)}${formatRM(items.reduce((s, i) => s + i.price * i.qty, 0))}`);
    add("-".repeat(W));
  }
  bytes.push(ESC, 0x61, 0x01);
  add("SEDIA");
  bytes.push(GS, 0x56, 0x41, 0x10);
  return new Uint8Array(bytes);
}

// ─── Printer functions ───────────────────────────────────────────────────────
async function printBluetoothClassic(address, data) {
  try {
    const bt = window.bluetoothSerial;
    if (!bt) throw new Error("Plugin tidak tersedia");
    return new Promise((resolve) => {
      bt.connect(address, () => {
        bt.write(String.fromCharCode(...data), () => { bt.disconnect(); resolve({ ok: true }); }, (e) => { bt.disconnect(); resolve({ ok: false, err: e }); });
      }, (e) => resolve({ ok: false, err: e }));
    });
  } catch (e) { return { ok: false, err: e.message }; }
}

async function printBluetoothBLE(deviceId, data) {
  try {
    const { BleClient } = await import("@capacitor-community/bluetooth-le");
    await BleClient.initialize();
    const SVC = "000018f0-0000-1000-8000-00805f9b34fb";
    const CHR = "00002af1-0000-1000-8000-00805f9b34fb";
    await BleClient.connect(deviceId);
    for (let i = 0; i < data.length; i += 512) await BleClient.write(deviceId, SVC, CHR, new DataView(data.slice(i, i + 512).buffer));
    await BleClient.disconnect(deviceId);
    return { ok: true };
  } catch (e) { return { ok: false, err: e.message }; }
}

async function printWifi(ip, port = 9100, data) {
  try {
    // Guna native TcpPrinterPlugin Java yang kita buat
    const TcpPrinter = window.Capacitor?.Plugins?.TcpPrinter;
    if (TcpPrinter) {
      const b64 = btoa(String.fromCharCode(...data));
      const result = await TcpPrinter.print({ ip, port, data: b64 });
      return { ok: true };
    }
    // Fallback XMLHttpRequest
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `http://${ip}:${port}`, true);
      xhr.overrideMimeType("application/octet-stream");
      xhr.timeout = 10000;
      xhr.onload = () => resolve({ ok: true });
      xhr.onerror = () => resolve({ ok: false, err: "Connection failed" });
      xhr.ontimeout = () => resolve({ ok: false, err: "Timeout" });
      xhr.send(data);
    });
  } catch (e) { return { ok: false, err: e.message }; }
}

async function scanBTClassic() {
  return new Promise((resolve) => {
    const bt = window.bluetoothSerial;
    if (!bt) { resolve([]); return; }
    bt.list((d) => resolve(d.map(x => ({ deviceId: x.address, name: x.name || x.address }))), () => resolve([]));
  });
}

async function scanBTBLE() {
  try {
    const { BleClient } = await import("@capacitor-community/bluetooth-le");
    await BleClient.initialize();
    const devs = [];
    await BleClient.requestLEScan({}, r => { if (!devs.find(d => d.deviceId === r.device.deviceId)) devs.push({ deviceId: r.device.deviceId, name: r.device.name || "Unknown" }); });
    setTimeout(() => BleClient.stopLEScan(), 5000);
    return devs;
  } catch { return []; }
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [products, setProducts] = useLocalStorage("pos_products", DEFAULT_PRODUCTS);
  const [categories, setCategories] = useLocalStorage("pos_categories", DEFAULT_CATEGORIES);
  const [combos, setCombos] = useLocalStorage("pos_combos", DEFAULT_COMBOS);
  const [printers, setPrinters] = useLocalStorage("pos_printers", []);
  const [tables, setTables] = useLocalStorage("pos_tables", DEFAULT_TABLES);
  const [activeOrders, setActiveOrders] = useLocalStorage("pos_active_orders", {}); // { tableId: order }
  const [salesHistory, setSalesHistory] = useLocalStorage("pos_history", []);
  const [orderNum, setOrderNum] = useLocalStorage("pos_ordernum", 1042);
  const [taxConfig, setTaxConfig] = useLocalStorage("pos_tax_config", { enabled: true, rate: 6, label: "SST" });
  const [receiptConfig, setReceiptConfig] = useLocalStorage("pos_receipt_config", { shopName: "WARUNG DIGITAL", phone: "03-1234 5678", address: "", footer: "Terima Kasih! Sila Datang Lagi", logoBase64: "" });
  const [alertVolume, setAlertVolume] = useLocalStorage("pos_alert_volume", 0.7); // 0.0 - 1.0
  const wakeLockRef = useRef(null);

  // App state
  const [page, setPage] = useState("tables");
  const [notif, setNotif] = useState(null);
  const [notifClr, setNotifClr] = useState("#93c5fd");
  const [printSt, setPrintSt] = useState({});
  const [sendingOrder, setSendingOrder] = useState(false);

  // Order creation flow
  const [showOrderTypeModal, setShowOrderTypeModal] = useState(false);
  const [showDeliveryInfoModal, setShowDeliveryInfoModal] = useState(false);
  const [deliveryName, setDeliveryName] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [deliveryChargeInput, setDeliveryChargeInput] = useState("");
  const [showTableModal, setShowTableModal] = useState(false);
  const [currentOrderType, setCurrentOrderType] = useState(null);
  const [currentTable, setCurrentTable] = useState(null);
  const [cart, setCart] = useState([]);
  const [editingDraftKey, setEditingDraftKey] = useState(null);
  const [fCat, setFCat] = useState("all");
  const [fSub, setFSub] = useState("all");
  const [search, setSearch] = useState("");
  const [showCombos, setShowCombos] = useState(false);

  // Item notes
  const [noteModal, setNoteModal] = useState(false);
  const [noteTargetKey, setNoteTargetKey] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [savedNotes, setSavedNotes] = useLocalStorage("pos_saved_notes", ["Taknak bawang", "Pedas sikit", "Tak pedas", "Extra sos", "Kurang manis", "Tapau", "Sikit nasi"]);
  const [newSavedNote, setNewSavedNote] = useState("");

  // Table view
  const [selectedTable, setSelectedTable] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState("cash");
  const [cashIn, setCashIn] = useState("");
  const [discountInput, setDiscountInput] = useState("");
  const [topupInput, setTopupInput] = useState("");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);

  // Settings modals
  const [itemModal, setItemModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [itemF, setItemF] = useState({ name: "", price: "", categoryId: "", subcategoryId: "", emoji: "🍚", printerId: "", variants: [], imageBase64: "", items: [], customItems: [], addons: [] });
  const [variantModal, setVariantModal] = useState(false);
  const [addonModal, setAddonModal] = useState(false);
  const [addonItem, setAddonItem] = useState(null);
  const [addonVariantOpt, setAddonVariantOpt] = useState(null); // carry forward variant selection if both exist
  const [selectedAddons, setSelectedAddons] = useState({}); // { addonId: true/false }
  const [variantItem, setVariantItem] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [emojiPick, setEmojiPick] = useState(false);
  const [catModal, setCatModal] = useState(false);
  const [subModal, setSubModal] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [editSub, setEditSub] = useState(null);
  const [catF, setCatF] = useState({ name: "" });
  const [subF, setSubF] = useState({ name: "", catId: "" });
  const [printerModal, setPrinterModal] = useState(false);
  const [editPrinter, setEditPrinter] = useState(null);
  const [pF, setPF] = useState({ name: "", type: "bluetooth", btType: "classic", ip: "", port: "9100", deviceId: "", location: "Kaunter", role: "cashier", showPrice: false });
  const [btDevs, setBtDevs] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [comboModal, setComboModal] = useState(false);
  const [editCombo, setEditCombo] = useState(null);
  const [comboF, setComboF] = useState({ name: "", emoji: "🍱", price: "", categoryId: "cat1", description: "", printerId: "", items: [], customItems: [] });
  const [emojiPickCombo, setEmojiPickCombo] = useState(false);
  const [comboItemCatFilter, setComboItemCatFilter] = useState("all");
  const [comboDropdownVal, setComboDropdownVal] = useState("");
  const [showCustomItemForm, setShowCustomItemForm] = useState(false);
  const [customItemF, setCustomItemF] = useState({ name: "", printerId: "", qty: "1" });
  const [itemDropdownVal, setItemDropdownVal] = useState("");
  const [showItemCustomItemForm, setShowItemCustomItemForm] = useState(false);
  const [itemCustomItemF, setItemCustomItemF] = useState({ name: "", printerId: "", qty: "1" });
  const [tableSetupModal, setTableSetupModal] = useState(false);
  const [tableF, setTableF] = useState({ name: "", section: "Dalam" });
  const [editTable, setEditTable] = useState(null);
  const [histDetail, setHistDetail] = useState(null);
  const [histFilter, setHistFilter] = useState("all");
  const [histDateFilter, setHistDateFilter] = useState(""); // YYYY-MM-DD
  const [settingsTab, setSettingsTab] = useState("menu"); // menu | printers | categories | tables
  const [menuSearch, setMenuSearch] = useState("");
  const [menuCatFilter, setMenuCatFilter] = useState("all");
  const [salesFilter, setSalesFilter] = useState("week");
  const [salesPickDate, setSalesPickDate] = useState("");
  const [salesPickMonth, setSalesPickMonth] = useState("");
  const [salesPickYear, setSalesPickYear] = useState("");
  const [salesPrintItems, setSalesPrintItems] = useState(false);
  const [salesPrintModal, setSalesPrintModal] = useState(false);

  // Shift / Opening / Closing
  const [currentShift, setCurrentShift] = useLocalStorage("pos_current_shift", null); // { id, name, openTime, openFloat, orders:[] }
  const [shiftHistory, setShiftHistory] = useLocalStorage("pos_shift_history", []);
  const [shiftModal, setShiftModal] = useState(false); // open shift modal
  const [closeShiftModal, setCloseShiftModal] = useState(false);
  const [shiftF, setShiftF] = useState({ name: "", float: "" }); // open shift form
  const [closeF, setCloseF] = useState({ actualCash: "" }); // close shift form

  // Import/Export menu
  const [importModal, setImportModal] = useState(false);

  // Merge order
  const [mergeMode, setMergeMode] = useState(false);
  const [mergeSourceKey, setMergeSourceKey] = useState(null); // key in activeOrders
  const [moveTableModal, setMoveTableModal] = useState(false);
  const [moveSourceKey, setMoveSourceKey] = useState(null); // key in activeOrders being moved

  // Edit order modal — draft state (not saved until "Selesai Edit")
  const [editOrderKey, setEditOrderKey] = useState(null); // key in activeOrders
  const [editOrderDraft, setEditOrderDraft] = useState(null); // draft cart, not committed yet
  const [editOrderNewItems, setEditOrderNewItems] = useState([]); // track newly added items for auto-print
  const [editOrderCat, setEditOrderCat] = useState("all");
  const [editOrderSearch, setEditOrderSearch] = useState("");
  const [editOrderShowCombos, setEditOrderShowCombos] = useState(false);

  // Split bill
  const [splitMode, setSplitMode] = useState(false);
  const [splitOrderKey, setSplitOrderKey] = useState(null);
  const [splitSelected, setSplitSelected] = useState({}); // { _key: qty }
  const [splitPayMethod, setSplitPayMethod] = useState("cash");
  const [splitCashIn, setSplitCashIn] = useState("");

  // QR Order (Option 2) — customer self-order via WiFi
  const [pendingOrders, setPendingOrders] = useState([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrSelectedTable, setQrSelectedTable] = useState(null);
  const [newPendingCount, setNewPendingCount] = useState(0);
  const [pendingAlert, setPendingAlert] = useState(null); // { order, countdown }
  const [alertCountdown, setAlertCountdown] = useState(0);

  const processingAccept = useRef(false);

  // Realtime listener dari Firestore
  useEffect(() => {
    const q = query(collection(db, "pendingOrders"), orderBy("time", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const orders = snap.docs.map(d => ({ ...d.data(), _docId: d.id }));
      setPendingOrders(orders);
      const newOnes = orders.filter(o => o.status === "pending");
      setNewPendingCount(newOnes.length);
      if (newOnes.length > 0) {
        setPendingAlert(prev => {
          if (!prev || prev._docId !== newOnes[0]._docId) {
            setAlertCountdown(30);
            playAlertSound();
            return newOnes[0];
          }
          return prev;
        });
      } else {
        // Jangan clear kalau tengah proses auto-accept
        if (!processingAccept.current) setPendingAlert(null);
      }
    });
    return () => unsub();
  }, []);

  const pendingAlertRef = useRef(null);
  useEffect(() => { if (pendingAlert) pendingAlertRef.current = pendingAlert; }, [pendingAlert]);
  const acceptPendingOrderRef = useRef(null);
  useEffect(() => { acceptPendingOrderRef.current = acceptPendingOrder; });

  // Countdown timer for auto-accept — interval-based, immune to state clears
  useEffect(() => {
    if (!pendingAlert) return;
    setAlertCountdown(30);
    const interval = setInterval(() => {
      setAlertCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          const toAccept = pendingAlertRef.current;
          if (toAccept && !processingAccept.current) {
            setPendingAlert(null);
            acceptPendingOrderRef.current?.(toAccept);
          }
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [pendingAlert?._docId]);

  // QR Base URL — Vercel deployment
  const qrBaseUrl = "https://warung-pos-nine.vercel.app";

  const sub = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const taxRate = taxConfig.enabled ? (taxConfig.rate / 100) : 0;
  const tax = sub * taxRate;
  const total = sub + tax;

  // Auto-save draft bila cart berubah masa edit draft sedia ada
  useEffect(() => {
    if (!editingDraftKey) return;
    if (cart.length === 0) return; // jangan save draft kosong
    setActiveOrders(prev => {
      const existing = prev[editingDraftKey];
      if (!existing) return prev;
      const newSub = cart.reduce((s, i) => s + i.price * i.qty, 0);
      const newTax = newSub * taxRate;
      const deliveryCharge = currentOrderType?.id === "delivery" ? (parseFloat(deliveryChargeInput) || 0) : (existing.deliveryCharge || 0);
      return { ...prev, [editingDraftKey]: { ...existing, cart: [...cart], subtotal: newSub, tax: newTax, total: newSub + newTax + deliveryCharge, deliveryCharge } };
    });
  }, [cart, editingDraftKey]);

  function toast(msg, clr = "#93c5fd") { setNotif(msg); setNotifClr(clr); setTimeout(() => setNotif(null), 2500); }

  // ── Wake Lock — prevent tablet sleep bila app terbuka ──────────────────────
  useEffect(() => {
    if (isQROrderPage) return;
    async function requestWakeLock() {
      try {
        if ("wakeLock" in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
        }
      } catch (e) { /* wakeLock tak supported — okay je */ }
    }
    requestWakeLock();
    // Reacquire wake lock bila page visible balik (contoh: balik dari apps lain)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        await requestWakeLock();
        // Re-check pending orders bila app resume
        try {
          const { getDocs } = await import("firebase/firestore");
          const { getDocs: gd } = await import("firebase/firestore");
        } catch {}
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      wakeLockRef.current?.release?.();
    };
  }, [isQROrderPage]);

  // ── Alert sound untuk order baru masuk ──────────────────────────────────────
  function playAlertSound(volume = alertVolume) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const times = [0, 0.15, 0.3];
      times.forEach(t => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.type = "sine";
        gain.gain.setValueAtTime(0, ctx.currentTime + t);
        gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + t + 0.05);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + t + 0.2);
        osc.start(ctx.currentTime + t);
        osc.stop(ctx.currentTime + t + 0.25);
      });
    } catch (e) {}
  }

  // ── Print functions ──────────────────────────────────────────────────────
  async function doPrint(printer, data) {
    setPrintSt(s => ({ ...s, [printer.id]: "⏳" }));
    let r;
    if (printer.type === "bluetooth") {
      r = printer.btType === "ble" ? await printBluetoothBLE(printer.deviceId, data) : await printBluetoothClassic(printer.deviceId, data);
    } else {
      r = await printWifi(printer.ip, parseInt(printer.port) || 9100, data);
    }
    setPrintSt(s => ({ ...s, [printer.id]: r.ok ? "✅" : "❌" }));
    toast(r.ok ? `🖨️ ${printer.name} OK!` : `❌ ${printer.name}: ${r.err}`, r.ok ? "#4ade80" : "#f87171");
    setTimeout(() => setPrintSt(s => { const n = { ...s }; delete n[printer.id]; return n; }), 4000);
  }

  // Print order slips to kitchen/bar printers (NO receipt)
  async function printOrderSlips(order) {
    const groups = {};

    order.cart.forEach(item => {
      if (item.comboItems && item.comboItems.length > 0) {
        const mainPid = item.printerId || "";

        // 1. Hantar item UTAMA ke printer dia sendiri (dengan extras yang takde printer assign)
        const unassignedExtras = item.comboItems.filter(ci => !ci.printerId);
        if (mainPid) {
          if (!groups[mainPid]) groups[mainPid] = [];
          groups[mainPid].push({ ...item, comboItems: unassignedExtras });
        }

        // 2. Hantar extras yang ada printer assign ke printer masing-masing
        const assignedExtras = item.comboItems.filter(ci => ci.printerId);
        const extraPrinters = [...new Set(assignedExtras.map(ci => ci.printerId))];
        extraPrinters.forEach(pid => {
          if (!groups[pid]) groups[pid] = [];
          const subItems = assignedExtras.filter(ci => ci.printerId === pid);
          // Print item utama sekali sebagai konteks, tapi highlight extras
          groups[pid].push({ ...item, comboItems: subItems });
        });
      } else {
        const pid = item.printerId || "";
        if (!pid) return;
        if (!groups[pid]) groups[pid] = [];
        groups[pid].push(item);
      }
    });

    if (Object.keys(groups).length === 0) {
      const kitchenPrinter = printers.find(p => p.role !== "cashier");
      if (kitchenPrinter) groups[kitchenPrinter.id] = order.cart;
    }

    for (const [pid, items] of Object.entries(groups)) {
      let printer = printers.find(p => p.id === pid);
      if (!printer && printers.length > 0) printer = printers[0];
      if (!printer) continue;

      const slipData = buildOrderSlipBytes(
        order,
        printer.location || printer.name,
        items,
        printer.showPrice || false,
        printer.printerWidth || "58"
      );

      await doPrint(printer, slipData);
      await new Promise(res => setTimeout(res, 1200));
    }
  }

  // Print receipt (cashier only)
  async function printReceipt(order) {
    const cashierPrinters = printers.filter(p => p.role === "cashier" || !p.role);
    const isCash = order.method === "cash";
    if (cashierPrinters.length === 0 && printers.length > 0) {
      const pr = printers[0];
      const data = await buildReceiptBytes(order, receiptConfig, pr.printerWidth || "58", isCash && !!pr.cashDrawer);
      await doPrint(pr, data);
    } else {
      for (const p of cashierPrinters) {
        const data = await buildReceiptBytes(order, receiptConfig, p.printerWidth || "58", isCash && !!p.cashDrawer);
        await doPrint(p, data);
      }
    }
  }

  // ── Shift ────────────────────────────────────────────────────────────────
  function openShift() {
    if (!shiftF.name.trim()) return toast("⚠️ Masukkan nama shift", "#f59e0b");
    const float = parseFloat(shiftF.float) || 0;
    const shift = { id: `shift_${Date.now()}`, name: shiftF.name.trim(), openTime: new Date().toISOString(), openFloat: float, orders: [] };
    setCurrentShift(shift);
    setShiftModal(false);
    setShiftF({ name: "", float: "" });
    toast(`✅ Shift "${shift.name}" dibuka`, "#22c55e");
    setDoc(doc(db, "config", "menu"), { products, combos, categories, taxRate, taxConfig, tables, shiftOpen: true }).catch(() => {});
  }

  function closeShift() {
    if (!currentShift) return;
    const actualCash = parseFloat(closeF.actualCash) || 0;
    // Kira dari history yang dalam shift ni
    const shiftOrders = salesHistory.filter(o => currentShift.orders.includes(o.num));
    const cashSales = shiftOrders.filter(o => o.method === "cash").reduce((s, o) => s + o.total, 0);
    const qrSales = shiftOrders.filter(o => o.method === "qr").reduce((s, o) => s + o.total, 0);
    const cardSales = shiftOrders.filter(o => o.method === "card").reduce((s, o) => s + o.total, 0);
    const totalSales = cashSales + qrSales + cardSales;
    const expectedCash = currentShift.openFloat + cashSales;
    const diff = actualCash - expectedCash;
    const closed = { ...currentShift, closeTime: new Date().toISOString(), actualCash, cashSales, qrSales, cardSales, totalSales, expectedCash, diff, orderCount: shiftOrders.length };
    setShiftHistory(h => [closed, ...h]);
    setCurrentShift(null);
    setCloseShiftModal(false);
    setCloseF({ actualCash: "" });
    toast(`✅ Shift "${closed.name}" ditutup`, "#22c55e");
    setDoc(doc(db, "config", "menu"), { products, combos, categories, taxRate, taxConfig, tables, shiftOpen: false }).catch(() => {});
    // Auto print report
    printShiftReport(closed, true);
  }

  async function printShiftReport(shift, autoPrint = false) {
    const cashierP = printers.find(p => p.role === "cashier" || !p.role);
    if (!cashierP && !autoPrint) return toast("⚠️ Tiada printer cashier", "#f59e0b");
    if (!cashierP) return;
    const ESC = 0x1B, GS = 0x1D;
    const W = getPrintWidth(cashierP?.printerWidth || "58");
    const enc = new TextEncoder();
    const bytes = [];
    const add = (t) => bytes.push(...enc.encode(t + "\n"));
    const pad = (l, r) => l + " ".repeat(Math.max(1, W - l.length - r.length)) + r;
    bytes.push(ESC, 0x40, ESC, 0x61, 0x01, ESC, 0x45, 0x01);
    add(receiptConfig.shopName || "WARUNG DIGITAL");
    add("LAPORAN PENUTUPAN SHIFT");
    bytes.push(ESC, 0x45, 0x00);
    add("-".repeat(W));
    bytes.push(ESC, 0x61, 0x00);
    add(`Shift: ${shift.name}`);
    add(`Buka: ${new Date(shift.openTime).toLocaleString("ms-MY")}`);
    add(`Tutup: ${new Date(shift.closeTime).toLocaleString("ms-MY")}`);
    add(`Bil. Order: ${shift.orderCount}`);
    add("-".repeat(W));
    add(pad("Float Pembuka:", formatRM(shift.openFloat)));
    add("-".repeat(W));
    bytes.push(ESC, 0x45, 0x01);
    add("JUALAN MENGIKUT CARA BAYAR:");
    bytes.push(ESC, 0x45, 0x00);
    add(pad("Tunai (Cash):", formatRM(shift.cashSales)));
    add(pad("QR Pay:", formatRM(shift.qrSales)));
    add(pad("Kad (Card):", formatRM(shift.cardSales)));
    add("-".repeat(W));
    bytes.push(ESC, 0x45, 0x01);
    add(pad("JUMLAH JUALAN:", formatRM(shift.totalSales)));
    bytes.push(ESC, 0x45, 0x00);
    add("-".repeat(W));
    add(pad("Dijangka (Cash):", formatRM(shift.expectedCash)));
    add(pad("Sebenar (Cash):", formatRM(shift.actualCash)));
    bytes.push(ESC, 0x45, 0x01);
    const diffLabel = shift.diff >= 0 ? `LEBIH: +${formatRM(shift.diff)}` : `KURANG: ${formatRM(shift.diff)}`;
    add(pad("Selisih:", shift.diff === 0 ? "RM 0.00 ✓" : diffLabel));
    bytes.push(ESC, 0x45, 0x00);
    add("-".repeat(W));
    bytes.push(ESC, 0x61, 0x01);
    add("Terima Kasih!");
    bytes.push(GS, 0x56, 0x41, 0x10);
    await doPrint(cashierP, new Uint8Array(bytes));
  }

  // ── Import / Export Menu ─────────────────────────────────────────────────
  async function exportMenuCSV() {
    const header = "Nama,Harga,Kategori,Sub-Kategori,Emoji,Printer ID";
    const rows = products.map(p => {
      const cat = categories.find(c => c.id === p.categoryId);
      const sub = cat?.subcategories?.find(s => s.id === p.subcategoryId);
      return [p.name, p.price, cat?.name || "", sub?.name || "", p.emoji || "", p.printerId || ""].map(v => `"${v}"`).join(",");
    });
    const csv = [header, ...rows].join("\n");
    try {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      const { Share } = await import("@capacitor/share");
      const fileName = `menu-export-${new Date().toISOString().slice(0,10)}.csv`;
      await Filesystem.writeFile({ path: fileName, data: btoa(unescape(encodeURIComponent(csv))), directory: Directory.Cache });
      const fileUri = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
      await Share.share({ title: "Export Menu", url: fileUri.uri, dialogTitle: "Simpan atau share menu CSV" });
    } catch {
      // Fallback untuk browser
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "menu-export.csv"; a.click();
      URL.revokeObjectURL(url);
    }
    toast("✅ Menu dieksport!", "#22c55e");
  }

  async function downloadMenuTemplate() {
    const header = "Nama,Harga,Kategori,Sub-Kategori,Emoji,Printer ID";
    const example = [
      '"Nasi Goreng","7.50","Makanan","Nasi","🍳",""',
      '"Teh O Ais","2.00","Minuman","Sejuk","🧊",""',
      '"Roti Bakar","3.00","Makanan","Roti","🍞",""',
    ].join("\n");
    const csv = [header, example].join("\n");
    try {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      const { Share } = await import("@capacitor/share");
      await Filesystem.writeFile({ path: "template-menu.csv", data: btoa(unescape(encodeURIComponent(csv))), directory: Directory.Cache });
      const fileUri = await Filesystem.getUri({ path: "template-menu.csv", directory: Directory.Cache });
      await Share.share({ title: "Template Menu", url: fileUri.uri, dialogTitle: "Simpan template CSV" });
    } catch {
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "template-menu.csv"; a.click();
      URL.revokeObjectURL(url);
    }
    toast("✅ Template dimuat turun!", "#22c55e");
  }

  function importMenuCSV(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split("\n").slice(1).filter(l => l.trim());
        let added = 0, skipped = 0;
        const newProducts = [...products];
        lines.forEach(line => {
          const cols = line.split(",").map(c => c.replace(/^"|"$/g, "").trim());
          const [name, price, catName, subName, emoji, printerId] = cols;
          if (!name || !price) { skipped++; return; }
          const cat = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
          if (!cat) { skipped++; return; }
          const sub = cat.subcategories?.find(s => s.name.toLowerCase() === subName.toLowerCase());
          const exists = newProducts.find(p => p.name.toLowerCase() === name.toLowerCase());
          if (exists) { skipped++; return; }
          newProducts.push({ id: `prod_${Date.now()}_${added}`, name, price: parseFloat(price) || 0, categoryId: cat.id, subcategoryId: sub?.id || "", emoji: emoji || "🍽️", printerId: printerId || "", variants: [] });
          added++;
        });
        setProducts(newProducts);
        setImportModal(false);
        toast(`✅ ${added} item ditambah, ${skipped} dilangkau`, "#22c55e");
      } catch (err) {
        toast("❌ Error baca file", "#ef4444");
      }
    };
    reader.readAsText(file);
  }

  // ── Cart ─────────────────────────────────────────────────────────────────
  function addCart(p, isCombo = false) {
    if (!isCombo && p.variants && p.variants.length > 0) {
      setVariantItem(p); setSelectedVariant(null); setVariantModal(true);
      return;
    }
    // Check add-ons
    if (!isCombo && p.addons && p.addons.length > 0) {
      setAddonItem(p); setAddonVariantOpt(null); setSelectedAddons({}); setAddonModal(true);
      return;
    }
    addCartDirect(p, isCombo);
  }

  function addCartDirect(p, isCombo = false, variantOpt = null, chosenAddons = []) {
    const variantSuffix = variantOpt ? `_${variantOpt.name}` : "";
    const addonSuffix = chosenAddons.length > 0 ? `_ao${chosenAddons.map(a => a.id).join("")}` : "";
    const key = isCombo ? `combo_${p.id}_${Date.now()}` : `item_${p.id}${variantSuffix}${addonSuffix}_${Date.now()}`;
    const basePrice = variantOpt ? (p.price + (variantOpt.extraPrice || 0)) : p.price;
    const addonTotal = chosenAddons.reduce((s, a) => s + (a.price || 0), 0);
    const finalPrice = basePrice + addonTotal;
    const finalName = variantOpt ? `${p.name} (${variantOpt.name})` : p.name;
    const buildExtras = (prod) => [
      ...(prod.items?.map(ci => { const x = products.find(z => z.id === ci.productId); return { productId: ci.productId, name: x?.name || "?", qty: ci.qty, printerId: ci.printerId || "" }; }) || []),
      ...(prod.customItems?.map(ci => ({ customId: ci.customId, name: ci.name, qty: ci.qty, printerId: ci.printerId || "", isCustom: true })) || []),
      ...chosenAddons.map(a => ({ customId: `ao_${a.id}`, name: `+ ${a.name}`, qty: 1, printerId: p.printerId || "", isCustom: true })),
    ];
    setCart(prev => {
      if (isCombo) return [...prev, { _key: key, id: p.id, name: p.name, emoji: p.emoji, price: p.price, qty: 1, isCombo: true, printerId: p.printerId || "", comboItems: buildExtras(p) }];
      return [...prev, { _key: key, id: p.id, name: finalName, emoji: p.emoji, price: finalPrice, qty: 1, isCombo: false, printerId: p.printerId || "", comboItems: buildExtras(p) }];
    });
    toast(`${p.emoji} ${finalName} ditambah${chosenAddons.length > 0 ? ` + ${chosenAddons.length} add-on` : ""}`);
  }

  function updQty(key, d) { setCart(prev => prev.map(i => i._key === key ? { ...i, qty: i.qty + d } : i).filter(i => i.qty > 0)); }

  // ── Create Order ─────────────────────────────────────────────────────────
  async function createOrder() {
    if (cart.length === 0) return;
    const num = orderNum;
    const isDelivery = currentOrderType?.id === "delivery";
    const deliveryChargeNum = isDelivery ? (parseFloat(deliveryChargeInput) || 0) : 0;
    const order = {
      id: `order_${Date.now()}`,
      num, cart: [...cart],
      subtotal: sub, tax, total: total + deliveryChargeNum,
      deliveryCharge: deliveryChargeNum,
      customerName: isDelivery ? deliveryName.trim() : "",
      customerPhone: isDelivery ? deliveryPhone.trim() : "",
      tableNo: currentTable?.name || "-",
      tableId: currentTable?.id || null,
      orderType: currentOrderType?.label || "Takeaway",
      time: new Date(), status: "active",
    };
    setOrderNum(n => n + 1);

    // Save to active orders — SENTIASA simpan ikut order.id (nombor order)
    // Ini membolehkan meja sama ada banyak order serentak
    const orderKey = `order_${num}`;
    const orderWithKey = {
      ...order,
      orderKey, // key untuk identify dalam activeOrders
      displayName: currentTable ? `${currentTable.name} (Order #${num})` : `Order #${num}`,
    };
    setActiveOrders(prev => {
      const n = { ...prev };
      if (editingDraftKey) delete n[editingDraftKey]; // buang draft lama, ganti dengan order sebenar
      n[orderKey] = orderWithKey;
      return n;
    });

    // Show sending animation then print
    setSendingOrder(true);
    await printOrderSlips(order);
    setSendingOrder(false);

    toast(`✅ Order #${num} dibuat!`, "#4ade80");
    setCart([]);
    setPage("tables");
    setCurrentTable(null);
    setCurrentOrderType(null);
    setDeliveryName(""); setDeliveryPhone(""); setDeliveryChargeInput("");
    setEditingDraftKey(null);
  }

  // ── Checkout / Pay ───────────────────────────────────────────────────────
  async function checkout(order, printRec = true) {
    const discount = parseFloat(discountInput) || 0;
    const topup = parseFloat(topupInput) || 0;
    const finalTotal = Math.max(0, order.total - discount + topup);
    const paidOrder = {
      ...order,
      discount,
      topup,
      total: finalTotal,
      method: payMethod,
      cash: parseFloat(cashIn) || 0,
      change: parseFloat(cashIn) - finalTotal,
      status: "paid",
      paidAt: new Date(),
    };

    // Remove from active orders — guna orderKey
    const key = order.orderKey || order.id;
    setActiveOrders(prev => { const n = { ...prev }; delete n[key]; return n; });

    // Save to history
    setSalesHistory(prev => [paidOrder, ...prev]);
    setLastOrder(paidOrder);

    // Record dalam shift semasa
    if (currentShift) setCurrentShift(s => ({ ...s, orders: [...(s.orders || []), paidOrder.num] }));

    // Print receipt if requested
    if (printRec) await printReceipt(paidOrder);

    setShowPayModal(false);
    setShowReceiptModal(true);
    setSelectedTable(null);
    setCashIn("");
    toast("✅ Bayaran berjaya!", "#4ade80");
  }

  // ── Settings CRUD ────────────────────────────────────────────────────────
  const openAddItem = () => { setEditItem(null); setItemF({ name: "", price: "", categoryId: categories[0]?.id || "", subcategoryId: categories[0]?.subcategories[0]?.id || "", emoji: "🍚", printerId: "", variants: [], imageBase64: "", items: [], customItems: [], addons: [] }); setItemModal(true); };
  const openEditItem = (item) => { setEditItem(item); setItemF({ name: item.name, price: item.price.toString(), categoryId: item.categoryId, subcategoryId: item.subcategoryId, emoji: item.emoji, printerId: item.printerId || "", variants: item.variants || [], imageBase64: item.imageBase64 || "", items: item.items || [], customItems: item.customItems || [], addons: item.addons || [] }); setItemModal(true); };
  const toggleSoldOut = (id) => {
    setProducts(p => p.map(i => i.id === id ? { ...i, soldOut: !i.soldOut } : i));
  };
  const toggleComboSoldOut = (id) => {
    setCombos(p => p.map(c => c.id === id ? { ...c, soldOut: !c.soldOut } : c));
  };

  const saveItem = () => {
    if (!itemF.name || !itemF.price) return;
    if (editItem) setProducts(p => p.map(i => i.id === editItem.id ? { ...i, ...itemF, price: parseFloat(itemF.price) } : i));
    else setProducts(p => [...p, { id: Date.now(), ...itemF, price: parseFloat(itemF.price) }]);
    toast(editItem ? "✅ Item dikemaskini" : "✅ Item ditambah"); setItemModal(false);
  };
  const delItem = (id) => { if (window.confirm("Padam item?")) { setProducts(p => p.filter(i => i.id !== id)); toast("🗑️ Dipadam"); } };

  const openAddCat = () => { setEditCat(null); setCatF({ name: "" }); setCatModal(true); };
  const openEditCat = (c) => { setEditCat(c); setCatF({ name: c.name }); setCatModal(true); };
  const saveCat = () => { if (!catF.name) return; if (editCat) setCategories(p => p.map(c => c.id === editCat.id ? { ...c, name: catF.name } : c)); else setCategories(p => [...p, { id: `c${Date.now()}`, name: catF.name, subcategories: [] }]); toast("✅ Dikemaskini"); setCatModal(false); };
  const delCat = (id) => { if (window.confirm("Padam kategori?")) { setCategories(p => p.filter(c => c.id !== id)); setProducts(p => p.filter(i => i.categoryId !== id)); toast("🗑️ Dipadam"); } };
  const openAddSub = (catId) => { setEditSub(null); setSubF({ name: "", catId }); setSubModal(true); };
  const openEditSub = (s, catId) => { setEditSub(s); setSubF({ name: s.name, catId }); setSubModal(true); };
  const saveSub = () => { if (!subF.name) return; if (editSub) setCategories(p => p.map(c => c.id === subF.catId ? { ...c, subcategories: c.subcategories.map(s => s.id === editSub.id ? { ...s, name: subF.name } : s) } : c)); else setCategories(p => p.map(c => c.id === subF.catId ? { ...c, subcategories: [...c.subcategories, { id: `s${Date.now()}`, name: subF.name }] } : c)); toast("✅ Dikemaskini"); setSubModal(false); };
  const delSub = (sId, cId) => { if (window.confirm("Padam sub?")) { setCategories(p => p.map(c => c.id === cId ? { ...c, subcategories: c.subcategories.filter(s => s.id !== sId) } : c)); toast("🗑️ Dipadam"); } };

  const openAddPrinter = () => { setEditPrinter(null); setPF({ name: "", type: "bluetooth", btType: "classic", ip: "", port: "9100", deviceId: "", location: "Kaunter", role: "cashier", showPrice: false, printerWidth: "58", cashDrawer: false }); setBtDevs([]); setPrinterModal(true); };
  const openEditPrinter = (p) => { setEditPrinter(p); setPF({ name: p.name, type: p.type, btType: p.btType || "classic", ip: p.ip || "", port: p.port || "9100", deviceId: p.deviceId || "", location: p.location || "Kaunter", role: p.role || "cashier", showPrice: p.showPrice || false, printerWidth: p.printerWidth || "58", cashDrawer: p.cashDrawer || false }); setPrinterModal(true); };
  const savePrinter = () => { if (!pF.name) return; const d = { ...pF, id: editPrinter ? editPrinter.id : `pr${Date.now()}` }; if (editPrinter) setPrinters(p => p.map(i => i.id === editPrinter.id ? d : i)); else setPrinters(p => [...p, d]); toast("✅ Printer disimpan"); setPrinterModal(false); };
  const delPrinter = (id) => { if (window.confirm("Padam printer?")) { setPrinters(p => p.filter(i => i.id !== id)); toast("🗑️ Dipadam"); } };
  const doScan = async () => { setScanning(true); toast("📡 Scan..."); const d = await (pF.btType === "ble" ? scanBTBLE() : scanBTClassic()); setBtDevs(d); setScanning(false); toast(d.length ? `${d.length} device` : "Tiada device", d.length ? "#4ade80" : "#f87171"); };

  const openAddCombo = () => { setEditCombo(null); setComboF({ name: "", emoji: "🍱", price: "", categoryId: categories[0]?.id || "cat1", description: "", printerId: "", items: [], customItems: [] }); setComboModal(true); };
  const openEditCombo = (c) => { setEditCombo(c); setComboF({ name: c.name, emoji: c.emoji, price: c.price.toString(), categoryId: c.categoryId || "cat1", description: c.description || "", printerId: c.printerId || "", items: [...(c.items || [])], customItems: [...(c.customItems || [])] }); setComboModal(true); };
  const saveCombo = () => { if (!comboF.name || !comboF.price) return; const d = { ...comboF, price: parseFloat(comboF.price), id: editCombo ? editCombo.id : `combo_${Date.now()}` }; if (editCombo) setCombos(p => p.map(c => c.id === editCombo.id ? d : c)); else setCombos(p => [...p, d]); toast("✅ Combo disimpan"); setComboModal(false); };
  const delCombo = (id) => { if (window.confirm("Padam combo?")) { setCombos(p => p.filter(c => c.id !== id)); toast("🗑️ Dipadam"); } };
  const addComboItem = (pid) => setComboF(f => { const nid = Number(pid); const e = f.items.find(i => i.productId === nid); if (e) return { ...f, items: f.items.map(i => i.productId === nid ? { ...i, qty: i.qty + 1 } : i) }; return { ...f, items: [...f.items, { productId: nid, qty: 1, printerId: "" }] }; });
  const removeComboItem = (pid) => setComboF(f => ({ ...f, items: f.items.filter(i => i.productId !== pid) }));
  const addCustomComboItem = () => {
    if (!customItemF.name.trim()) return;
    const newItem = { customId: `custom_${Date.now()}`, name: customItemF.name.trim(), qty: parseInt(customItemF.qty) || 1, printerId: customItemF.printerId || "", isCustom: true };
    setComboF(f => ({ ...f, customItems: [...(f.customItems || []), newItem] }));
    setCustomItemF({ name: "", printerId: "", qty: "1" });
    setShowCustomItemForm(false);
  };
  const removeCustomComboItem = (customId) => setComboF(f => ({ ...f, customItems: (f.customItems || []).filter(i => i.customId !== customId) }));

  const addItemExtra = (pid) => setItemF(f => { const nid = Number(pid); const e = (f.items || []).find(i => i.productId === nid); if (e) return { ...f, items: f.items.map(i => i.productId === nid ? { ...i, qty: i.qty + 1 } : i) }; return { ...f, items: [...(f.items || []), { productId: nid, qty: 1, printerId: "" }] }; });
  const removeItemExtra = (pid) => setItemF(f => ({ ...f, items: (f.items || []).filter(i => i.productId !== pid) }));
  const addCustomItemExtra = () => {
    if (!itemCustomItemF.name.trim()) return;
    const newItem = { customId: `custom_${Date.now()}`, name: itemCustomItemF.name.trim(), qty: parseInt(itemCustomItemF.qty) || 1, printerId: itemCustomItemF.printerId || "", isCustom: true };
    setItemF(f => ({ ...f, customItems: [...(f.customItems || []), newItem] }));
    setItemCustomItemF({ name: "", printerId: "", qty: "1" });
    setShowItemCustomItemForm(false);
  };
  const removeCustomItemExtra = (customId) => setItemF(f => ({ ...f, customItems: (f.customItems || []).filter(i => i.customId !== customId) }));

  const openAddTable = () => { setEditTable(null); setTableF({ name: "", section: "Dalam" }); setTableSetupModal(true); };
  const openEditTable = (t) => { setEditTable(t); setTableF({ name: t.name, section: t.section }); setTableSetupModal(true); };
  const saveTable = () => { if (!tableF.name) return; const d = { ...tableF, id: editTable ? editTable.id : `t${Date.now()}` }; if (editTable) setTables(p => p.map(t => t.id === editTable.id ? d : t)); else setTables(p => [...p, d]); toast("✅ Meja disimpan"); setTableSetupModal(false); };
  const delTable = (id) => { if (window.confirm("Padam meja?")) { setTables(p => p.filter(t => t.id !== id)); toast("🗑️ Dipadam"); } };

  // ── Merge Orders ─────────────────────────────────────────────────────────
  function startMerge(sourceKey) { setMergeMode(true); setMergeSourceKey(sourceKey); toast("Pilih order nak digabungkan", "#f59e0b"); }
  function doMerge(targetKey) {
    if (targetKey === mergeSourceKey) { setMergeMode(false); setMergeSourceKey(null); return; }
    const source = activeOrders[mergeSourceKey];
    const target = activeOrders[targetKey];
    if (!source || !target) return;
    const mergedCart = [...target.cart];
    source.cart.forEach(si => {
      const ex = mergedCart.find(i => i._key === si._key);
      if (ex) { ex.qty += si.qty; } else { mergedCart.push({ ...si }); }
    });
    const newSub = mergedCart.reduce((s, i) => s + i.price * i.qty, 0);
    const newTax = newSub * taxRate;
    const merged = { ...target, cart: mergedCart, subtotal: newSub, tax: newTax, total: newSub + newTax };
    setActiveOrders(prev => { const n = { ...prev }; n[targetKey] = merged; delete n[mergeSourceKey]; return n; });
    setMergeMode(false); setMergeSourceKey(null);
    toast("✅ Order digabungkan!", "#4ade80");
  }

  // ── Move / Pindah Table ──────────────────────────────────────────────────
  function startMoveTable(key) { setMoveSourceKey(key); setMoveTableModal(true); }
  function doMoveTable(targetTable) {
    const source = activeOrders[moveSourceKey];
    if (!source) { setMoveTableModal(false); return; }
    const occupied = Object.entries(activeOrders).some(([k, o]) => k !== moveSourceKey && o.tableId === targetTable.id);
    if (occupied) { toast(`⚠️ ${targetTable.name} dah ada order. Guna Merge je.`, "#f59e0b"); return; }
    setActiveOrders(prev => {
      const n = { ...prev };
      n[moveSourceKey] = { ...source, tableId: targetTable.id, tableNo: targetTable.name, displayName: `${targetTable.name} (Order #${source.num})` };
      return n;
    });
    setMoveTableModal(false); setMoveSourceKey(null);
    toast(`✅ Dipindah ke ${targetTable.name}`, "#4ade80");
  }

  // ── Edit Order (Draft — only committed on "Selesai Edit") ────────────────
  function openEditOrder(key) {
    const order = activeOrders[key];
    if (!order) return;
    setEditOrderKey(key);
    setEditOrderDraft([...order.cart.map(i => ({ ...i }))]);
    setEditOrderNewItems([]);
    setEditOrderCat("all");
    setEditOrderSearch("");
    setEditOrderShowCombos(false);
  }
  function editOrderAddItem(p, isCombo = false) {
    const key = isCombo ? `combo_${p.id}` : `item_${p.id}`;
    const buildComboItems = (p) => [
      ...(p.items?.map(ci => { const prod = products.find(x => x.id === ci.productId); return { productId: ci.productId, name: prod?.name || "?", qty: ci.qty, printerId: ci.printerId || "" }; }) || []),
      ...(p.customItems?.map(ci => ({ customId: ci.customId, name: ci.name, qty: ci.qty, printerId: ci.printerId || "", isCustom: true })) || [])
    ];
    setEditOrderDraft(prev => {
      const draft = prev ? [...prev] : [];
      const ex = draft.find(i => i._key === key);
      if (ex) {
        ex.qty += 1;
        setEditOrderNewItems(ni => {
          const n = [...ni]; const e2 = n.find(i => i._key === key);
          if (e2) e2.qty += 1; else n.push({ _key: key, id: p.id, name: p.name, emoji: p.emoji, price: p.price, qty: 1, isCombo, printerId: p.printerId || "", comboItems: buildComboItems(p) });
          return n;
        });
      } else {
        const newItem = { _key: key, id: p.id, name: p.name, emoji: p.emoji, price: p.price, qty: 1, isCombo, printerId: p.printerId || "", comboItems: buildComboItems(p) };
        draft.push(newItem);
        setEditOrderNewItems(ni => {
          const n = [...ni]; const e2 = n.find(i => i._key === key);
          if (e2) e2.qty += 1; else n.push({ ...newItem, qty: 1 });
          return n;
        });
      }
      return draft;
    });
  }
  function editOrderRemoveItem(itemKey) {
    setEditOrderDraft(prev => {
      if (!prev) return prev;
      return prev.map(i => i._key === itemKey ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0);
    });
  }
  async function commitEditOrder() {
    if (!editOrderKey) return;
    const draft = editOrderDraft || [];
    if (draft.length === 0) {
      // Delete order if cart is empty
      setActiveOrders(prev => { const n = { ...prev }; delete n[editOrderKey]; return n; });
      setEditOrderKey(null);
      setEditOrderDraft(null);
      setEditOrderNewItems([]);
      toast("🗑️ Order dikosongkan & dibuang", "#f87171");
    } else {
      const order = activeOrders[editOrderKey];
      const newSub = draft.reduce((s, i) => s + i.price * i.qty, 0);
      setActiveOrders(prev => ({ ...prev, [editOrderKey]: { ...order, cart: draft, subtotal: newSub, tax: newSub * taxRate, total: newSub * (1 + taxRate) + (order.deliveryCharge || 0) } }));
      setEditOrderKey(null);
      setEditOrderDraft(null);
      // Auto-print new items to kitchen/bar printer with sending overlay
      if (editOrderNewItems.length > 0) {
        const orderForPrint = { ...order, cart: editOrderNewItems };
        setSendingOrder(true);
        await printOrderSlips(orderForPrint);
        setSendingOrder(false);
        toast("✅ Edit disimpan & dihantar ke dapur!", "#4ade80");
      } else {
        toast("✅ Edit disimpan!", "#4ade80");
      }
      setEditOrderNewItems([]);
    }
  }

  // ── Split Bill ───────────────────────────────────────────────────────────
  function openSplit(key) { setSplitOrderKey(key); setSplitMode(true); setSplitSelected({}); setSplitCashIn(""); setSplitPayMethod("cash"); }
  function toggleSplitItem(itemKey, maxQty) {
    setSplitSelected(prev => {
      const cur = prev[itemKey] || 0;
      if (cur >= maxQty) { const n = { ...prev }; delete n[itemKey]; return n; }
      return { ...prev, [itemKey]: cur + 1 };
    });
  }
  function getSplitTotal() {
    if (!splitOrderKey) return 0;
    const order = activeOrders[splitOrderKey];
    if (!order) return 0;
    const sub = order.cart.reduce((s, i) => { const qty = splitSelected[i._key] || 0; return s + i.price * qty; }, 0);
    return sub * (1 + taxRate);
  }
  async function doSplitCheckout(printRec) {
    const order = activeOrders[splitOrderKey];
    if (!order) return;
    const splitCartItems = order.cart.map(i => ({ ...i, qty: splitSelected[i._key] || 0 })).filter(i => i.qty > 0);
    const splitSub = splitCartItems.reduce((s, i) => s + i.price * i.qty, 0);
    const splitTax = splitSub * taxRate;
    const splitTotal = splitSub + splitTax;
    const splitOrder = { ...order, id: `split_${Date.now()}`, num: orderNum, cart: splitCartItems, subtotal: splitSub, tax: splitTax, total: splitTotal, method: splitPayMethod, cash: parseFloat(splitCashIn) || 0, change: parseFloat(splitCashIn) - splitTotal, status: "paid", paidAt: new Date() };
    setOrderNum(n => n + 1);
    // Remove paid items from original order
    const remainCart = order.cart.map(i => ({ ...i, qty: i.qty - (splitSelected[i._key] || 0) })).filter(i => i.qty > 0);
    if (remainCart.length === 0) {
      // All paid — remove order entirely
      setActiveOrders(prev => { const n = { ...prev }; delete n[splitOrderKey]; return n; });
    } else {
      const remSub = remainCart.reduce((s, i) => s + i.price * i.qty, 0);
      setActiveOrders(prev => ({ ...prev, [splitOrderKey]: { ...order, cart: remainCart, subtotal: remSub, tax: remSub * taxRate, total: remSub * (1 + taxRate) } }));
    }
    setSalesHistory(prev => [splitOrder, ...prev]);
    setLastOrder(splitOrder);
    if (printRec) await printReceipt(splitOrder);
    setSplitMode(false); setSplitOrderKey(null); setSplitSelected({});
    setShowReceiptModal(true);
    toast("✅ Split bayaran berjaya!", "#4ade80");
  }

  // ── Pending QR Orders ────────────────────────────────────────────────────
  async function acceptPendingOrder(pending) {
    processingAccept.current = true;
    try {
    const num = orderNum;
    const order = {
      id: `order_${Date.now()}`,
      num,
      cart: pending.cart,
      subtotal: pending.subtotal,
      tax: pending.tax,
      total: pending.total,
      tableNo: pending.tableNo,
      tableId: pending.tableId,
      orderType: "Dine In",
      orderKey: `order_${num}`,
      displayName: `${pending.tableNo} (Order #${num})`,
      customerName: pending.customerName,
      customerPhone: pending.customerPhone,
      orderNote: pending.orderNote || "",
      time: new Date(),
      status: "active",
    };
    setOrderNum(n => n + 1);
    setActiveOrders(prev => ({ ...prev, [`order_${num}`]: order }));
    await updateDoc(doc(db, "pendingOrders", pending._docId), { status: "accepted" });
    setQrOrderHistory(h => [{ ...pending, status: "accepted", acceptedAt: new Date().toISOString() }, ...h.slice(0, 99)]);
    setSendingOrder(true);
    await printOrderSlips(order);
    setSendingOrder(false);
    toast(`✅ Order #${num} dari ${pending.customerName} diterima!`, "#4ade80");
    } finally { processingAccept.current = false; }
  }
  async function rejectPendingOrder(pending) {
    await updateDoc(doc(db, "pendingOrders", pending._docId), { status: "rejected" });
    setQrOrderHistory(h => [{ ...pending, status: "rejected", rejectedAt: new Date().toISOString() }, ...h.slice(0, 99)]);
    toast("❌ Order ditolak", "#ef4444");
  }
  function clearDonePendingOrders() {
    // Just UI filter — Firestore data kekal, tapi boleh tambah delete later
    toast("Done orders disembunyikan", "#94a3b8");
  }
  const filtered = products.filter(p => (fCat === "all" || p.categoryId === fCat) && (fSub === "all" || p.subcategoryId === fSub) && p.name.toLowerCase().includes(search.toLowerCase()));
  const filteredWithSoldOut = filtered; // keep all, show sold-out visually but disable click
  const catSubs = fCat !== "all" ? (categories.find(c => c.id === fCat)?.subcategories || []) : [];
  const itemSubs = categories.find(c => c.id === itemF.categoryId)?.subcategories || [];
  const sections = [...new Set(tables.map(t => t.section))];
  const change = parseFloat(cashIn) - (selectedTable ? activeOrders[selectedTable.id]?.total || 0 : 0);
  // Today's orders only
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayOrders = salesHistory.filter(o => new Date(o.time) >= todayStart);

  // Sales report data
  const now = new Date();
  const weekStart = new Date(now - 6 * 86400000); weekStart.setHours(0,0,0,0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yesterdayStart = new Date(now); yesterdayStart.setDate(yesterdayStart.getDate() - 1); yesterdayStart.setHours(0,0,0,0);
  const yesterdayEnd = new Date(yesterdayStart); yesterdayEnd.setHours(23,59,59,999);

  const salesByFilter = salesHistory.filter(o => {
    const t = new Date(o.time);
    if (salesFilter === "yesterday") return t >= yesterdayStart && t <= yesterdayEnd;
    if (salesFilter === "week") return t >= weekStart;
    if (salesFilter === "month") return t >= monthStart;
    if (salesFilter === "year") return t >= yearStart;
    if (salesFilter === "pickdate" && salesPickDate) {
      const ds = new Date(salesPickDate + "T00:00:00"); const de = new Date(salesPickDate + "T23:59:59");
      return t >= ds && t <= de;
    }
    if (salesFilter === "pickmonth" && salesPickMonth) {
      const [yr, mo] = salesPickMonth.split("-").map(Number);
      return t.getFullYear() === yr && t.getMonth() + 1 === mo;
    }
    if (salesFilter === "pickyear" && salesPickYear) {
      return t.getFullYear() === parseInt(salesPickYear);
    }
    return true;
  });

  // Group by day for chart
  const salesByDay = {};
  salesByFilter.forEach(o => {
    const day = fmtDate(o.time);
    if (!salesByDay[day]) salesByDay[day] = { total: 0, count: 0 };
    salesByDay[day].total += o.total;
    salesByDay[day].count += 1;
  });

  const totalSalesFilter = salesByFilter.reduce((s, o) => s + o.total, 0);
  const totalSales = salesHistory.reduce((s, o) => s + o.total, 0);

  // ── Styles ───────────────────────────────────────────────────────────────
  const S = {
    modal: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 },
    mbox: { background: "#fff", borderRadius: 16, padding: 24, width: "100%", maxWidth: 440, maxHeight: "90vh", overflowY: "auto" },
    inp: { width: "100%", border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fff", color: "#1e293b" },
    sel: { width: "100%", border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fff", color: "#1e293b" },
    lbl: { fontSize: 13, color: "#475569", marginBottom: 5, display: "block", fontWeight: 600 },
    btn: (color = "#3b82f6") => ({ padding: "10px 20px", background: color, border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }),
  };

  // Sync menu ke Firestore bila products berubah (untuk QR order page)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isQROrderPage) return;
    if (isFirstRender.current) { isFirstRender.current = false; return; } // skip first render
    const syncMenu = async () => {
      try {
        await setDoc(doc(db, "config", "menu"), { products, combos, categories, taxRate, taxConfig, tables, shiftOpen: !!currentShift });
      } catch (e) { console.error("Firestore sync error:", e); }
    };
    const timer = setTimeout(syncMenu, 2000);
    return () => clearTimeout(timer);
  }, [products, combos, categories, taxRate, taxConfig, tables]);
  // ════════════════════════════════════════════════════════════════════════
  const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const isQROrderPage = urlParams.get("qrorder") === "1";
  const qrTableId = urlParams.get("table") || "";
  const qrTableNameFromUrl = urlParams.get("tname") || "";
  const qrTableName = qrTableNameFromUrl || tables.find(t => t.id === qrTableId)?.name || `Meja ${qrTableId}`;

  const [qrCart, setQrCart] = useState([]);
  const [qrName, setQrName] = useState("");
  const [qrPhone, setQrPhone] = useState("");
  const [qrNote, setQrNote] = useState("");
  const [qrItemNoteModal, setQrItemNoteModal] = useState(false);
  const [qrItemNoteKey, setQrItemNoteKey] = useState(null);
  const [qrItemNoteText, setQrItemNoteText] = useState("");
  const [qrOrderHistory, setQrOrderHistory] = useLocalStorage("pos_qr_history", []);
  const [showQrHistory, setShowQrHistory] = useState(false);
  const [showReprintModal, setShowReprintModal] = useState(false);
  const [reprintOrder, setReprintOrder] = useState(null);
  const [orderPreview, setOrderPreview] = useState(null);
  const [qrSubmitted, setQrSubmitted] = useState(false);
  const [qrCatFilter, setQrCatFilter] = useState("all");
  const [qrShowCombos, setQrShowCombos] = useState(false);
  const [qrSearch, setQrSearch] = useState("");
  const [qrCheckoutOpen, setQrCheckoutOpen] = useState(false); // checkout modal
  const [qrVariantItem, setQrVariantItem] = useState(null); // variant picker
  const [qrVariantSelected, setQrVariantSelected] = useState({});
  const [qrAddonItem, setQrAddonItem] = useState(null);
  const [qrAddonVariantOpt, setQrAddonVariantOpt] = useState(null);
  const [qrSelectedAddons, setQrSelectedAddons] = useState({});
  const [qrMenuLoaded, setQrMenuLoaded] = useState(!isQROrderPage);

  // Load menu dari Firestore untuk QR page
  const [qrShiftOpen, setQrShiftOpen] = useState(false); // block until Firestore confirms open
  useEffect(() => {
    if (!isQROrderPage) return;
    getDoc(doc(db, "config", "menu")).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.products) setProducts(data.products);
        if (data.combos) setCombos(data.combos);
        if (data.categories) setCategories(data.categories);
        if (data.tables) setTables(data.tables);
        if (typeof data.taxRate === "number") {
          setTaxConfig(data.taxRate > 0 ? { enabled: true, rate: Math.round(data.taxRate * 100), label: "SST" } : { enabled: false, rate: 6, label: "SST" });
        }
        if (typeof data.shiftOpen === "boolean") setQrShiftOpen(data.shiftOpen);
      }
      setQrMenuLoaded(true);
    }).catch(() => setQrMenuLoaded(true));
  }, []);

  if (isQROrderPage) {
    if (!qrMenuLoaded) return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}><div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div><div style={{ fontSize: 14, color: "#64748b" }}>Memuatkan menu...</div></div>
      </div>
    );
    if (!qrShiftOpen) return (
      <div style={{ minHeight: "100vh", background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", color: "#fff" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🌙</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Kedai Sedang Tutup</div>
          <div style={{ fontSize: 14, color: "#94a3b8" }}>Terima kasih! Sila datang semula apabila kedai dibuka.</div>
        </div>
      </div>
    );
    const qrFiltered = products.filter(p =>
      !p.soldOut &&
      (qrCatFilter === "all" || p.categoryId === qrCatFilter) &&
      p.name.toLowerCase().includes(qrSearch.toLowerCase())
    );
    const qrSub = qrCart.reduce((s, i) => s + i.price * i.qty, 0);
    const qrTax = Math.round(qrSub * taxRate * 100) / 100;
    const qrTotal = Math.round((qrSub + qrTax) * 100) / 100;

    // Malaysia phone: 01x-xxxxxxx, 8-11 digits after removing +60/0
    const validatePhone = (p) => {
      const cleaned = p.replace(/[\s\-]/g, "");
      return /^(01[0-9]{7,9}|601[0-9]{7,9})$/.test(cleaned);
    };

    function qrAddItem(p, isCombo = false) {
      if (!isCombo && p.variants && p.variants.length > 0) {
        setQrVariantItem(p); setQrVariantSelected({});
        return;
      }
      if (!isCombo && p.addons && p.addons.length > 0) {
        setQrAddonItem(p); setQrAddonVariantOpt(null); setQrSelectedAddons({});
        return;
      }
      const key = isCombo ? `combo_${p.id}` : `item_${p.id}_`;
      const buildExtras = (prod) => [
        ...(prod.items?.map(ci => { const x = products.find(z => z.id === ci.productId); return { productId: ci.productId, name: x?.name || "?", qty: ci.qty, printerId: ci.printerId || "" }; }) || []),
        ...(prod.customItems?.map(ci => ({ customId: ci.customId, name: ci.name, qty: ci.qty, printerId: ci.printerId || "", isCustom: true })) || [])
      ];
      setQrCart(prev => {
        const e = prev.find(i => i._key === key);
        if (e) return prev.map(i => i._key === key ? { ...i, qty: i.qty + 1 } : i);
        if (isCombo) return [...prev, { _key: key, id: p.id, name: p.name, emoji: p.emoji, price: p.price, qty: 1, isCombo: true, printerId: p.printerId || "", comboItems: buildExtras(p) }];
        return [...prev, { _key: key, id: p.id, name: p.name, emoji: p.emoji, price: p.price, qty: 1, isCombo: false, variantLabel: "", printerId: p.printerId || "", comboItems: buildExtras(p) }];
      });
    }
    function qrUpdQty(key, d) { setQrCart(prev => prev.map(i => i._key === key ? { ...i, qty: i.qty + d } : i).filter(i => i.qty > 0)); }

    async function qrSubmitOrder() {
      if (!qrName.trim()) return alert("Sila masukkan nama anda");
      if (!validatePhone(qrPhone)) return alert("No. telefon tidak sah. Mesti bermula dengan 01 (contoh: 0123456789)");
      if (qrCart.length === 0) return alert("Sila pilih sekurang-kurangnya 1 item");

      const pending = {
        tableId: qrTableId,
        tableNo: qrTableName,
        customerName: qrName.trim(),
        customerPhone: qrPhone.trim(),
        orderNote: qrNote.trim(),
        cart: qrCart,
        subtotal: qrSub,
        tax: qrTax,
        total: qrTotal,
        time: new Date().toISOString(),
        status: "pending",
        orderType: "Dine In",
      };
      try {
        await addDoc(collection(db, "pendingOrders"), pending);
        setQrSubmitted(true);
        setQrNote("");
      } catch (e) {
        alert("Gagal hantar order. Pastikan ada internet.");
      }
    }

    if (qrSubmitted) return (
      <div style={{ minHeight: "100vh", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 32, maxWidth: 380, width: "100%", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,.1)" }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#166534", marginBottom: 8 }}>Order Diterima!</div>
          <div style={{ fontSize: 14, color: "#64748b", marginBottom: 20 }}>Order untuk <b>{qrTableName}</b> sedang diproses. Staff kami akan membantu anda.</div>
          <div style={{ background: "#f0fdf4", border: "1px solid #22c55e", borderRadius: 12, padding: 14, marginBottom: 12, textAlign: "left" }}>
            {qrCart.map(i => <div key={i._key} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}><span>{i.emoji} {i.name}{i.variantLabel ? ` (${i.variantLabel})` : ""} ×{i.qty}</span><span style={{ fontWeight: 700 }}>{formatRM(i.price * i.qty)}</span></div>)}
            <div style={{ borderTop: "1px dashed #e2e8f0", marginTop: 8, paddingTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3, color: "#64748b" }}><span>Subtotal</span><span>{formatRM(qrSub)}</span></div>
              {qrTax > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3, color: "#64748b" }}><span>Tax ({(taxRate * 100).toFixed(0)}%)</span><span>{formatRM(qrTax)}</span></div>}
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15, marginTop: 4 }}><span>JUMLAH</span><span>{formatRM(qrTotal)}</span></div>
            </div>
          </div>
          <div style={{ background: "#fef9c3", border: "1px solid #fde047", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#713f12" }}>
            📸 <b>Sila screenshot halaman ini</b> sebagai rujukan order anda.
          </div>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>Bayaran di kaunter. Terima kasih, {qrName}! 🙏</div>
        </div>
      </div>
    );

    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI',sans-serif" }}>
        {/* Header */}
        <div style={{ background: "#1e293b", padding: "14px 20px", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ fontSize: 24 }}>🏪</div>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{receiptConfig.shopName || "Warung Digital"}</div>
              <div style={{ color: "#f59e0b", fontSize: 12, fontWeight: 600 }}>📍 {qrTableName}</div>
            </div>
          </div>
        </div>

        {/* Variant Picker Modal */}
        {qrVariantItem && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div style={{ background: "#fff", borderRadius: 20, padding: 24, width: "100%", maxWidth: 400 }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{qrVariantItem.emoji} {qrVariantItem.name}</div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>Pilih varian:</div>
              {qrVariantItem.variants?.map(v => (
                <button key={v.name} onClick={() => setQrVariantSelected(s => ({ ...s, [qrVariantItem.id]: v }))}
                  style={{ width: "100%", padding: "12px 16px", marginBottom: 8, border: `2px solid ${qrVariantSelected[qrVariantItem.id]?.name === v.name ? "#3b82f6" : "#e2e8f0"}`, borderRadius: 10, background: qrVariantSelected[qrVariantItem.id]?.name === v.name ? "#eff6ff" : "#fff", display: "flex", justifyContent: "space-between", cursor: "pointer" }}>
                  <span style={{ fontWeight: 600 }}>{v.name}</span>
                  <span style={{ color: "#3b82f6", fontWeight: 700 }}>{formatRM(qrVariantItem.price + (v.extraPrice || 0))}</span>
                </button>
              ))}
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button onClick={() => { setQrVariantItem(null); setQrVariantSelected({}); }} style={{ flex: 1, padding: 12, background: "#f1f5f9", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>Batal</button>
                <button onClick={() => {
                  const sel = qrVariantSelected[qrVariantItem.id];
                  if (!sel && qrVariantItem.variants?.length > 0) { alert("Sila pilih varian"); return; }
                  if (qrVariantItem.addons && qrVariantItem.addons.length > 0) {
                    setQrAddonItem(qrVariantItem); setQrAddonVariantOpt(sel || null); setQrSelectedAddons({});
                    setQrVariantItem(null); setQrVariantSelected({});
                    return;
                  }
                  const price = sel ? qrVariantItem.price + (sel.extraPrice || 0) : qrVariantItem.price;
                  const key = `item_${qrVariantItem.id}_${sel?.name || ""}`;
                  setQrCart(prev => {
                    const e = prev.find(i => i._key === key);
                    if (e) return prev.map(i => i._key === key ? { ...i, qty: i.qty + 1 } : i);
                    return [...prev, { _key: key, id: qrVariantItem.id, name: qrVariantItem.name, emoji: qrVariantItem.emoji, price, qty: 1, isCombo: false, variantLabel: sel?.name || "", printerId: qrVariantItem.printerId || "", comboItems: [
                      ...(qrVariantItem.items?.map(ci => { const x = products.find(z => z.id === ci.productId); return { productId: ci.productId, name: x?.name || "?", qty: ci.qty, printerId: ci.printerId || "" }; }) || []),
                      ...(qrVariantItem.customItems?.map(ci => ({ customId: ci.customId, name: ci.name, qty: ci.qty, printerId: ci.printerId || "", isCustom: true })) || [])
                    ] }];
                  });
                  setQrVariantItem(null);
                  setQrVariantSelected({});
                }} style={{ flex: 2, padding: 12, background: "#3b82f6", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: "pointer" }}>+ Tambah ke Cart</button>
              </div>
            </div>
          </div>
        )}

        {/* QR Item Note Modal */}
        {qrItemNoteModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: "100%", maxWidth: 380 }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>📝 Nota untuk Item</div>
              <textarea value={qrItemNoteText} onChange={e => setQrItemNoteText(e.target.value)} placeholder="cth: Taknak bawang, pedas sikit..." rows={3} style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 12px", fontSize: 14, resize: "none", boxSizing: "border-box", marginBottom: 12 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setQrCart(c => c.map(i => i._key === qrItemNoteKey ? { ...i, note: "" } : i)); setQrItemNoteModal(false); }} style={{ flex: 1, padding: 10, background: "#f1f5f9", border: "none", borderRadius: 8, color: "#64748b", cursor: "pointer", fontWeight: 600 }}>🗑️ Clear</button>
                <button onClick={() => { setQrCart(c => c.map(i => i._key === qrItemNoteKey ? { ...i, note: qrItemNoteText.trim() } : i)); setQrItemNoteModal(false); }} style={{ flex: 2, padding: 10, background: "#f59e0b", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer" }}>✅ Simpan</button>
              </div>
            </div>
          </div>
        )}

        {/* QR Add-On Modal */}
        {qrAddonItem && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div style={{ background: "#fff", borderRadius: 20, padding: 24, width: "100%", maxWidth: 400 }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{qrAddonItem.emoji} {qrAddonItem.name}{qrAddonVariantOpt ? ` (${qrAddonVariantOpt.name})` : ""}</div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>Tambah extra? (optional)</div>
              {qrAddonItem.addons.map(a => {
                const checked = !!qrSelectedAddons[a.id];
                return (
                  <button key={a.id} onClick={() => setQrSelectedAddons(s => ({ ...s, [a.id]: !s[a.id] }))}
                    style={{ width: "100%", padding: "12px 16px", marginBottom: 8, border: `2px solid ${checked ? "#22c55e" : "#e2e8f0"}`, borderRadius: 10, background: checked ? "#f0fdf4" : "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${checked ? "#22c55e" : "#cbd5e1"}`, background: checked ? "#22c55e" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>{checked ? "✓" : ""}</div>
                      <span style={{ fontWeight: 600, color: "#1e293b" }}>{a.name}</span>
                    </div>
                    <span style={{ color: "#22c55e", fontWeight: 700 }}>+{formatRM(a.price)}</span>
                  </button>
                );
              })}
              {Object.values(qrSelectedAddons).some(Boolean) && (
                <div style={{ background: "#f0fdf4", borderRadius: 8, padding: "8px 12px", marginBottom: 8, display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: "#166534" }}>
                  <span>Tambahan:</span>
                  <span>+{formatRM(qrAddonItem.addons.filter(a => qrSelectedAddons[a.id]).reduce((s, a) => s + a.price, 0))}</span>
                </div>
              )}
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button onClick={() => { setQrAddonItem(null); setQrAddonVariantOpt(null); setQrSelectedAddons({}); }} style={{ flex: 1, padding: 12, background: "#f1f5f9", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>Batal</button>
                <button onClick={() => {
                  const chosenAddons = qrAddonItem.addons.filter(a => qrSelectedAddons[a.id]);
                  const basePrice = qrAddonVariantOpt ? qrAddonItem.price + (qrAddonVariantOpt.extraPrice || 0) : qrAddonItem.price;
                  const addonTotal = chosenAddons.reduce((s, a) => s + a.price, 0);
                  const finalPrice = basePrice + addonTotal;
                  const key = `item_${qrAddonItem.id}_${qrAddonVariantOpt?.name || ""}_ao${chosenAddons.map(a => a.id).join("")}_${Date.now()}`;
                  setQrCart(prev => [...prev, {
                    _key: key, id: qrAddonItem.id, name: qrAddonItem.name, emoji: qrAddonItem.emoji,
                    price: finalPrice, qty: 1, isCombo: false,
                    variantLabel: qrAddonVariantOpt?.name || "",
                    printerId: qrAddonItem.printerId || "",
                    comboItems: [
                      ...(qrAddonItem.items?.map(ci => { const x = products.find(z => z.id === ci.productId); return { productId: ci.productId, name: x?.name || "?", qty: ci.qty, printerId: ci.printerId || "" }; }) || []),
                      ...(qrAddonItem.customItems?.map(ci => ({ customId: ci.customId, name: ci.name, qty: ci.qty, isCustom: true })) || []),
                      ...chosenAddons.map(a => ({ customId: `ao_${a.id}`, name: `+ ${a.name}`, qty: 1, isCustom: true }))
                    ]
                  }]);
                  setQrAddonItem(null); setQrAddonVariantOpt(null); setQrSelectedAddons({});
                }} style={{ flex: 2, padding: 12, background: "#22c55e", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                  ✅ {Object.values(qrSelectedAddons).some(Boolean) ? "Tambah ke Cart" : "Terus tanpa Add-On"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Checkout Modal */}
        {qrCheckoutOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", padding: 24, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }}>
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 16 }}>📋 Semak & Hantar Order</div>
              {/* Order summary with per-item notes */}
              <div style={{ background: "#f8fafc", borderRadius: 12, padding: 14, marginBottom: 16 }}>
                {qrCart.map(i => (
                  <div key={i._key} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span>{i.emoji} {i.name}{i.variantLabel ? ` (${i.variantLabel})` : ""} ×{i.qty}</span>
                      <span style={{ fontWeight: 700 }}>{formatRM(i.price * i.qty)}</span>
                    </div>
                    <button onClick={() => { setQrItemNoteKey(i._key); setQrItemNoteText(i.note || ""); setQrItemNoteModal(true); }}
                      style={{ marginTop: 3, padding: "3px 10px", background: i.note ? "#fff7ed" : "#f1f5f9", border: `1px solid ${i.note ? "#f59e0b" : "#e2e8f0"}`, borderRadius: 6, fontSize: 11, color: i.note ? "#f59e0b" : "#94a3b8", cursor: "pointer" }}>
                      {i.note ? `📝 ${i.note}` : "+ Tambah nota item"}
                    </button>
                  </div>
                ))}
                <div style={{ borderTop: "1px dashed #e2e8f0", marginTop: 8, paddingTop: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748b", marginBottom: 2 }}><span>Subtotal</span><span>{formatRM(qrSub)}</span></div>
                  {qrTax > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748b", marginBottom: 2 }}><span>Tax ({(taxRate * 100).toFixed(0)}%)</span><span>{formatRM(qrTax)}</span></div>}
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15 }}><span>JUMLAH</span><span style={{ color: "#f59e0b" }}>{formatRM(qrTotal)}</span></div>
                </div>
              </div>
              {/* Name & Phone */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 5 }}>Nama *</label>
                <input value={qrName} onChange={e => setQrName(e.target.value)} placeholder="Nama anda" style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "11px 14px", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 5 }}>No. Telefon * <span style={{ fontWeight: 400, color: "#94a3b8" }}>(contoh: 0123456789)</span></label>
                <input value={qrPhone} onChange={e => setQrPhone(e.target.value)} placeholder="01xxxxxxxx" type="tel" style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "11px 14px", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setQrCheckoutOpen(false)} style={{ flex: 1, padding: 14, background: "#f1f5f9", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>← Balik</button>
                <button onClick={qrSubmitOrder} style={{ flex: 2, padding: 14, background: "#22c55e", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>📨 Hantar Order</button>
              </div>
            </div>
          </div>
        )}

        {/* Category tabs */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", overflowX: "auto", whiteSpace: "nowrap", padding: "10px 12px", display: "flex", gap: 8 }}>
          <button onClick={() => { setQrCatFilter("all"); setQrShowCombos(false); }} style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid", fontSize: 12, fontWeight: 600, cursor: "pointer", background: qrCatFilter === "all" && !qrShowCombos ? "#1e293b" : "transparent", color: qrCatFilter === "all" && !qrShowCombos ? "#fff" : "#64748b", borderColor: qrCatFilter === "all" && !qrShowCombos ? "#1e293b" : "#e2e8f0", flexShrink: 0 }}>📋 Semua</button>
          <button onClick={() => setQrShowCombos(true)} style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid", fontSize: 12, fontWeight: 600, cursor: "pointer", background: qrShowCombos ? "#f59e0b" : "transparent", color: qrShowCombos ? "#000" : "#64748b", borderColor: qrShowCombos ? "#f59e0b" : "#e2e8f0", flexShrink: 0 }}>🍱 Set</button>
          {categories.map(c => <button key={c.id} onClick={() => { setQrCatFilter(c.id); setQrShowCombos(false); }} style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid", fontSize: 12, fontWeight: 600, cursor: "pointer", background: qrCatFilter === c.id && !qrShowCombos ? "#3b82f6" : "transparent", color: qrCatFilter === c.id && !qrShowCombos ? "#fff" : "#64748b", borderColor: qrCatFilter === c.id && !qrShowCombos ? "#3b82f6" : "#e2e8f0", flexShrink: 0 }}>{c.name}</button>)}
        </div>

        {/* Search */}
        <div style={{ padding: "10px 14px", background: "#fff", borderBottom: "1px solid #e2e8f0" }}>
          <input value={qrSearch} onChange={e => setQrSearch(e.target.value)} placeholder="🔍 Cari menu..." style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        </div>

        {/* Menu Grid */}
        <div style={{ padding: 14, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10, paddingBottom: qrCart.length > 0 ? 180 : 20 }}>
          {(qrShowCombos ? combos.filter(c => !c.soldOut) : qrFiltered).map(p => {
            const isCombo = qrShowCombos;
            const hasVariants = !isCombo && p.variants?.length > 0;
            // For items with variants, show count across all variants
            const cartQty = qrCart.filter(i => i.id === p.id && !i.isCombo).reduce((s, i) => s + i.qty, 0);
            const cartItem = !hasVariants ? qrCart.find(i => i._key === (isCombo ? `combo_${p.id}` : `item_${p.id}_`)) : null;
            return (
              <div key={p.id} style={{ background: "#fff", border: "2px solid #e2e8f0", borderRadius: 14, padding: "12px 10px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
                {p.imageBase64 ? <img src={p.imageBase64} alt={p.name} style={{ width: "100%", height: 70, objectFit: "cover", borderRadius: 8, marginBottom: 6 }} /> : <div style={{ fontSize: 32, marginBottom: 6 }}>{p.emoji}</div>}
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: isCombo ? "#f59e0b" : "#3b82f6", marginBottom: 10 }}>{formatRM(p.price)}</div>
                {hasVariants ? (
                  <button onClick={() => { setQrVariantItem(p); setQrVariantSelected({}); }} style={{ width: "100%", padding: "7px 0", background: cartQty > 0 ? "#eff6ff" : "#3b82f6", border: cartQty > 0 ? "2px solid #3b82f6" : "none", borderRadius: 8, color: cartQty > 0 ? "#3b82f6" : "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    {cartQty > 0 ? `${cartQty} dipilih ✓` : "+ Pilih Varian"}
                  </button>
                ) : cartItem ? (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <button onClick={() => qrUpdQty(cartItem._key, -1)} style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fef2f2", color: "#ef4444", cursor: "pointer", fontSize: 16, fontWeight: 700 }}>−</button>
                      <span style={{ fontSize: 15, fontWeight: 700, minWidth: 20, textAlign: "center" }}>{cartItem.qty}</span>
                      <button onClick={() => qrAddItem(p, isCombo)} style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f0fdf4", color: "#22c55e", cursor: "pointer", fontSize: 16, fontWeight: 700 }}>+</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => qrAddItem(p, isCombo)} style={{ width: "100%", padding: "7px 0", background: "#3b82f6", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Tambah</button>
                )}
              </div>
            );
          })}
        </div>

        {/* Floating cart bar */}
        {qrCart.length > 0 && (
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#1e293b", padding: "14px 20px", boxShadow: "0 -4px 20px rgba(0,0,0,.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ color: "#94a3b8", fontSize: 13 }}>{qrCart.reduce((s, i) => s + i.qty, 0)} item</div>
              <div style={{ color: "#f59e0b", fontWeight: 700, fontSize: 18 }}>{formatRM(qrTotal)}</div>
            </div>
            <button onClick={() => setQrCheckoutOpen(true)} style={{ width: "100%", padding: 14, background: "#22c55e", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
              🛒 Semak Order & Hantar ({qrTableName})
            </button>
          </div>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // RECEIPT SCREEN
  // ════════════════════════════════════════════════════════════════════════
  if (showReceiptModal && lastOrder) return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", width: 340, borderRadius: 12, padding: "28px 24px", boxShadow: "0 4px 24px rgba(0,0,0,.12)", fontFamily: "'Courier New',monospace" }}>
        <div style={{ textAlign: "center", borderBottom: "2px dashed #e2e8f0", paddingBottom: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 28 }}>🏪</div>
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: 2 }}>WARUNG DIGITAL</div>
          <div style={{ fontSize: 11, color: "#888" }}>Tel: 03-1234 5678</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 10, color: "#666" }}>
          <span>No. #{lastOrder.num}</span><span>{new Date(lastOrder.time).toLocaleString("ms-MY")}</span>
        </div>
        {lastOrder.tableNo && <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>Meja: {lastOrder.tableNo} · {lastOrder.orderType}</div>}
        <div style={{ borderTop: "1px dashed #ddd", paddingTop: 10 }}>
          {lastOrder.cart.map(i => (
            <div key={i._key} style={{ marginBottom: 5 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span>{i.emoji} {i.name} x{i.qty}</span><span>{formatRM(i.price * i.qty)}</span></div>
              {i.comboItems && i.comboItems.length > 0 && i.comboItems.map(ci => <div key={ci.productId || ci.customId} style={{ fontSize: 11, color: "#888", paddingLeft: 16 }}>· {ci.name} x{ci.qty}</div>)}
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px dashed #ddd", marginTop: 10, paddingTop: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#666", marginBottom: 3 }}><span>Subtotal</span><span>{formatRM(lastOrder.subtotal)}</span></div>
          {lastOrder.tax > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#666", marginBottom: 7 }}><span>{taxConfig.label} ({taxConfig.rate}%)</span><span>{formatRM(lastOrder.tax)}</span></div>}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700, borderTop: "2px solid #000", paddingTop: 7 }}><span>JUMLAH</span><span>{formatRM(lastOrder.total)}</span></div>
          {lastOrder.method === "cash" && <>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#666", marginTop: 5 }}><span>Tunai</span><span>{formatRM(lastOrder.cash)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, color: "#16a34a" }}><span>Baki</span><span>{formatRM(lastOrder.change)}</span></div>
          </>}
        </div>
        <div style={{ textAlign: "center", marginTop: 16, paddingTop: 14, borderTop: "2px dashed #ddd", fontSize: 12, color: "#888" }}>✨ Terima Kasih ✨<br />Sila Datang Lagi!</div>
        <button onClick={() => { setShowReceiptModal(false); setPage("tables"); }} style={{ width: "100%", marginTop: 16, padding: 12, background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>← Balik ke Dashboard</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Segoe UI',sans-serif" }}>

      {/* Notification */}
      {notif && <div style={{ position: "fixed", top: 16, right: 16, background: "#1e293b", border: `1px solid ${notifClr}`, borderRadius: 10, padding: "10px 16px", fontSize: 13, zIndex: 9999, color: notifClr, boxShadow: "0 4px 12px rgba(0,0,0,.3)" }}>{notif}</div>}

      {/* Sending Order Overlay */}
      {sendingOrder && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9998 }}>
          <div style={{ background: "#1e293b", border: "2px solid #22c55e", borderRadius: 20, padding: "36px 48px", textAlign: "center", boxShadow: "0 8px 40px rgba(0,0,0,.5)" }}>
            <div style={{ fontSize: 52, marginBottom: 16, animation: "spin 1s linear infinite" }}>🖨️</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#22c55e", marginBottom: 8 }}>Sending Order...</div>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>Menghantar ke dapur / bar</div>
            <div style={{ marginTop: 20, display: "flex", justifyContent: "center", gap: 6 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e", opacity: 0.4 + i * 0.3 }} />)}
            </div>
          </div>
        </div>
      )}

      {/* ── ORDER TYPE MODAL ── */}
      {showOrderTypeModal && (
        <div style={S.modal}>
          <div style={{ ...S.mbox, maxWidth: 500 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>Pilih Jenis Order</div>
              <button onClick={() => setShowOrderTypeModal(false)} style={{ background: "#ef4444", border: "none", borderRadius: 8, width: 36, height: 36, color: "#fff", fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {ORDER_TYPES.map(t => (
                <button key={t.id} onClick={() => {
                  setCurrentOrderType(t);
                  setShowOrderTypeModal(false);
                  if (t.id === "dinein") setShowTableModal(true);
                  else if (t.id === "delivery") { setDeliveryName(""); setDeliveryPhone(""); setDeliveryChargeInput(""); setShowDeliveryInfoModal(true); }
                  else { setCurrentTable(null); setPage("order"); setCart([]); }
                }} style={{ padding: "20px 10px", background: "#f8fafc", border: `2px solid ${t.color}`, borderRadius: 12, cursor: "pointer", textAlign: "center" }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>{t.emoji}</div>
                  <div style={{ fontWeight: 700, color: t.color, fontSize: 14 }}>{t.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── DELIVERY INFO MODAL ── */}
      {showDeliveryInfoModal && (
        <div style={S.modal}>
          <div style={{ ...S.mbox, maxWidth: 420 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>🛵 Maklumat Delivery</div>
              <button onClick={() => { setShowDeliveryInfoModal(false); setShowOrderTypeModal(true); }} style={{ background: "#ef4444", border: "none", borderRadius: 8, width: 36, height: 36, color: "#fff", fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>Isi maklumat customer sebelum mula order.</div>
            <label style={S.lbl}>Nama Customer</label>
            <input value={deliveryName} onChange={e => setDeliveryName(e.target.value)} placeholder="cth: Ahmad" style={S.inp} />
            <label style={S.lbl}>No. Telefon</label>
            <input value={deliveryPhone} onChange={e => setDeliveryPhone(e.target.value)} placeholder="cth: 012-3456789" style={S.inp} />
            <label style={S.lbl}>Caj Penghantaran (RM)</label>
            <input type="number" value={deliveryChargeInput} onChange={e => setDeliveryChargeInput(e.target.value)} placeholder="0.00" style={S.inp} />
            <button onClick={() => { setCurrentTable(null); setPage("order"); setCart([]); setShowDeliveryInfoModal(false); }} style={{ width: "100%", padding: 14, background: "#10b981", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 8 }}>
              Teruskan ke Menu →
            </button>
          </div>
        </div>
      )}

      {/* ── TABLE SELECT MODAL ── */}
      {showTableModal && (
        <div style={S.modal}>
          <div style={{ ...S.mbox, maxWidth: 500 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>Pilih Meja</div>
              <button onClick={() => setShowTableModal(false)} style={{ background: "#ef4444", border: "none", borderRadius: 8, width: 36, height: 36, color: "#fff", fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>
            {sections.map(section => (
              <div key={section} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 8 }}>{section}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {tables.filter(t => t.section === section).map(t => {
                    const tableOrderCount = Object.values(activeOrders).filter(o => o.tableId === t.id && !o.isDraft).length;
                    return (
                      <button key={t.id}
                        onClick={() => {
                          setCurrentTable(t);
                          setShowTableModal(false);
                          setPage("order");
                          setCart([]);
                        }}
                        style={{ padding: "16px 8px", background: tableOrderCount > 0 ? "#fff7ed" : "#f0fdf4", border: `2px solid ${tableOrderCount > 0 ? "#f59e0b" : "#22c55e"}`, borderRadius: 10, cursor: "pointer", textAlign: "center" }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: tableOrderCount > 0 ? "#92400e" : "#166534" }}>{t.name.replace("Meja ", "")}</div>
                        <div style={{ fontSize: 10, color: tableOrderCount > 0 ? "#92400e" : "#166534" }}>{tableOrderCount > 0 ? `⚡ ${tableOrderCount} order` : "Kosong"}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ADDON MODAL ── */}
      {addonModal && addonItem && (
        <div style={S.modal} onClick={() => { setAddonModal(false); setAddonItem(null); }}>
          <div style={{ ...S.mbox, maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 18, marginBottom: 4, textAlign: "center" }}>{addonItem.emoji}</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2, color: "#1e293b", textAlign: "center" }}>{addonItem.name}{addonVariantOpt ? ` (${addonVariantOpt.name})` : ""}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14, textAlign: "center" }}>Pilih add-on (optional):</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {addonItem.addons.map(a => {
                const checked = !!selectedAddons[a.id];
                return (
                  <button key={a.id} onClick={() => setSelectedAddons(s => ({ ...s, [a.id]: !s[a.id] }))}
                    style={{ padding: "12px 16px", background: checked ? "#f0fdf4" : "#f8fafc", border: `2px solid ${checked ? "#22c55e" : "#e2e8f0"}`, borderRadius: 10, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${checked ? "#22c55e" : "#cbd5e1"}`, background: checked ? "#22c55e" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>{checked ? "✓" : ""}</div>
                      <span style={{ fontWeight: 600, color: "#1e293b", fontSize: 14 }}>{a.name}</span>
                    </div>
                    <span style={{ color: "#22c55e", fontWeight: 700, fontSize: 14 }}>+{formatRM(a.price)}</span>
                  </button>
                );
              })}
            </div>
            {Object.values(selectedAddons).some(Boolean) && (
              <div style={{ background: "#f0fdf4", borderRadius: 8, padding: "8px 12px", marginBottom: 12, display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: "#166534" }}>
                <span>Tambahan:</span>
                <span>+{formatRM(addonItem.addons.filter(a => selectedAddons[a.id]).reduce((s, a) => s + a.price, 0))}</span>
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setAddonModal(false); setAddonItem(null); }} style={{ flex: 1, padding: 10, background: "#f1f5f9", border: "none", borderRadius: 8, color: "#64748b", cursor: "pointer", fontWeight: 600 }}>Batal</button>
              <button onClick={() => {
                const chosen = addonItem.addons.filter(a => selectedAddons[a.id]);
                addCartDirect(addonItem, false, addonVariantOpt, chosen);
                setAddonModal(false); setAddonItem(null); setAddonVariantOpt(null); setSelectedAddons({});
              }} style={{ flex: 2, padding: 10, background: "#22c55e", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
                ✅ {Object.values(selectedAddons).some(Boolean) ? "Tambah ke Cart" : "Terus tanpa Add-On"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── NOTE MODAL ── */}
      {noteModal && (
        <div style={S.modal} onClick={() => setNoteModal(false)}>
          <div style={{ ...S.mbox, maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>📝 Note untuk Item</div>
              <button onClick={() => setNoteModal(false)} style={{ background: "#ef4444", border: "none", borderRadius: 8, width: 32, height: 32, color: "#fff", fontSize: 16, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>Saved notes — tekan untuk guna:</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
              {savedNotes.map((n, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <button onClick={() => setNoteText(noteText ? `${noteText}, ${n}` : n)} style={{ padding: "4px 10px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 20, fontSize: 12, cursor: "pointer", color: "#1e293b" }}>{n}</button>
                  <button onClick={() => setSavedNotes(s => s.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 11, padding: "0 2px" }}>✕</button>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              <input value={newSavedNote} onChange={e => setNewSavedNote(e.target.value)} placeholder="Tambah saved note baru..." style={{ ...S.inp, flex: 1, marginBottom: 0, fontSize: 12 }} />
              <button onClick={() => { if (newSavedNote.trim()) { setSavedNotes(s => [...s, newSavedNote.trim()]); setNewSavedNote(""); } }} style={{ padding: "8px 12px", background: "#3b82f6", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>+ Simpan</button>
            </div>
            <label style={S.lbl}>Note untuk item ini:</label>
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="cth: Taknak bawang, pedas sikit..." rows={3} style={{ width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, resize: "vertical", boxSizing: "border-box", marginBottom: 12 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setCart(c => c.map(i => i._key === noteTargetKey ? { ...i, note: "" } : i)); setNoteModal(false); }} style={{ flex: 1, padding: 10, background: "#f1f5f9", border: "none", borderRadius: 8, color: "#64748b", cursor: "pointer", fontWeight: 600 }}>🗑️ Clear</button>
              <button onClick={() => { setCart(c => c.map(i => i._key === noteTargetKey ? { ...i, note: noteText.trim() } : i)); setNoteModal(false); }} style={{ flex: 2, padding: 10, background: "#f59e0b", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer" }}>✅ Simpan Note</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ORDER PREVIEW MODAL ── */}
      {orderPreview && (
        <div style={S.modal} onClick={() => setOrderPreview(null)}>
          <div style={{ ...S.mbox, maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{orderPreview.displayName || orderPreview.tableNo} — Order #{orderPreview.num}</div>
              <button onClick={() => setOrderPreview(null)} style={{ background: "#ef4444", border: "none", borderRadius: 8, width: 32, height: 32, color: "#fff", fontSize: 16, cursor: "pointer" }}>✕</button>
            </div>
            {orderPreview.customerName && <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>👤 {orderPreview.customerName} · 📞 {orderPreview.customerPhone}</div>}
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12, marginBottom: 14 }}>
              {orderPreview.cart.map((i, idx) => (
                <div key={idx}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                    <span>{i.emoji} {i.name} ×{i.qty}</span>
                    <span style={{ fontWeight: 700 }}>{formatRM(i.price * i.qty)}</span>
                  </div>
                  {i.note && <div style={{ fontSize: 11, color: "#f59e0b", paddingLeft: 16, marginBottom: 3 }}>📝 {i.note}</div>}
                  {i.comboItems?.length > 0 && i.comboItems.map(ci => <div key={ci.customId || ci.productId} style={{ fontSize: 11, color: "#94a3b8", paddingLeft: 16 }}>· {ci.name} ×{ci.qty}</div>)}
                </div>
              ))}
              <div style={{ borderTop: "1px dashed #e2e8f0", marginTop: 8, paddingTop: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b" }}><span>Subtotal</span><span>{formatRM(orderPreview.subtotal)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700, marginTop: 4 }}><span>JUMLAH</span><span style={{ color: "#f59e0b" }}>{formatRM(orderPreview.total)}</span></div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => {
                const key = orderPreview.orderKey || orderPreview.id;
                setOrderPreview(null);
                openEditOrder(key);
              }} style={{ flex: 1, padding: 12, background: "#3b82f6", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                ✏️ Edit Order
              </button>
              <button onClick={async () => {
                // Print bill preview (order slip with prices, without payment info)
                const billOrder = { ...orderPreview, method: "bill", cash: 0, change: 0 };
                await printReceipt(billOrder);
                toast("✅ Bill diprint!", "#4ade80");
              }} style={{ flex: 1, padding: 12, background: "#475569", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                🧾 Print Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── QR ORDER HISTORY MODAL ── */}
      {showQrHistory && (
        <div style={S.modal} onClick={() => setShowQrHistory(false)}>
          <div style={{ ...S.mbox, maxWidth: 520, maxHeight: "80vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>📜 QR Order History</div>
              <button onClick={() => setShowQrHistory(false)} style={{ background: "#ef4444", border: "none", borderRadius: 8, width: 32, height: 32, color: "#fff", fontSize: 16, cursor: "pointer" }}>✕</button>
            </div>
            {qrOrderHistory.length === 0 && <div style={{ color: "#94a3b8", fontSize: 13 }}>Tiada history lagi.</div>}
            {qrOrderHistory.map((o, i) => (
              <div key={i} style={{ background: o.status === "accepted" ? "#f0fdf4" : "#fef2f2", border: `1px solid ${o.status === "accepted" ? "#22c55e" : "#ef4444"}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>📍 {o.tableNo} · 👤 {o.customerName}</div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: o.status === "accepted" ? "#166534" : "#dc2626", background: o.status === "accepted" ? "#dcfce7" : "#fee2e2", borderRadius: 6, padding: "2px 8px" }}>{o.status === "accepted" ? "✅ Diterima" : "❌ Ditolak"}</span>
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>📞 {o.customerPhone} · {o.acceptedAt || o.rejectedAt ? new Date(o.acceptedAt || o.rejectedAt).toLocaleString("ms-MY") : ""}</div>
                <div style={{ fontSize: 12, marginBottom: 8 }}>{o.cart?.map((ci, j) => <div key={j}>• {ci.name} ×{ci.qty} — {formatRM(ci.price * ci.qty)}</div>)}</div>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Jumlah: {formatRM(o.total)}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={async () => { await acceptPendingOrder(o); toast("✅ Order diproses semula!", "#4ade80"); }} style={{ flex: 1, padding: "7px 0", background: "#22c55e", border: "none", borderRadius: 7, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>▶ Accept & Print</button>
                  <button onClick={() => setQrOrderHistory(h => h.filter((_, j) => j !== i))} style={{ padding: "7px 12px", background: "#fef2f2", border: "1px solid #ef4444", borderRadius: 7, color: "#ef4444", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── REPRINT MODAL ── */}
      {showReprintModal && reprintOrder && (
        <div style={S.modal} onClick={() => setShowReprintModal(false)}>
          <div style={{ ...S.mbox, maxWidth: 360, maxHeight: "80vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>🖨️ Reprint</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>Order #{reprintOrder.num} — {reprintOrder.tableNo}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {printers.map(pr => (
                <div key={pr.id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px" }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>🖨️ {pr.name} <span style={{ fontWeight: 400, color: "#64748b", fontSize: 11 }}>({pr.role === "cashier" ? "Cashier" : pr.location || "Dapur"})</span></div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {pr.role !== "cashier" && <button onClick={async () => {
                      const items = reprintOrder.cart;
                      const data = buildOrderSlipBytes(reprintOrder, pr.name, items, pr.showPrice, pr.printerWidth || "58");
                      await doPrint(pr, data);
                      setShowReprintModal(false);
                      toast(`✅ Slip → ${pr.name}`, "#4ade80");
                    }} style={{ flex: 1, padding: "7px 0", background: "#f59e0b", border: "none", borderRadius: 7, color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>🍳 Print Slip</button>}
                    {(pr.role === "cashier" || !pr.role) && <button onClick={async () => {
                      const data = await buildReceiptBytes({ ...reprintOrder, method: reprintOrder.method || "cash", cash: reprintOrder.cash || 0, change: reprintOrder.change || 0 }, receiptConfig, pr.printerWidth || "58", false);
                      await doPrint(pr, data);
                      setShowReprintModal(false);
                      toast(`✅ Resit → ${pr.name}`, "#4ade80");
                    }} style={{ flex: 1, padding: "7px 0", background: "#3b82f6", border: "none", borderRadius: 7, color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>🧾 Print Resit</button>}
                  </div>
                </div>
              ))}
              <button onClick={async () => {
                // Print semua — slip ke semua dapur, SKIP cashier (drawer)
                await printOrderSlips(reprintOrder);
                setShowReprintModal(false);
                toast("✅ Print semua dapur!", "#4ade80");
              }} style={{ padding: 12, background: "#475569", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>🖨️ Print Semua Dapur</button>
              <button onClick={() => setShowReprintModal(false)} style={{ padding: 10, background: "#f1f5f9", border: "none", borderRadius: 8, color: "#64748b", cursor: "pointer", fontWeight: 600 }}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MOVE TABLE MODAL (Pindah Meja) ── */}
      {moveTableModal && (
        <div style={S.modal} onClick={() => { setMoveTableModal(false); setMoveSourceKey(null); }}>
          <div style={{ ...S.mbox, maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>↔️ Pindah Meja</div>
              <button onClick={() => { setMoveTableModal(false); setMoveSourceKey(null); }} style={{ background: "#ef4444", border: "none", borderRadius: 8, width: 36, height: 36, color: "#fff", fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
              {activeOrders[moveSourceKey]?.displayName || activeOrders[moveSourceKey]?.tableNo || `Order #${activeOrders[moveSourceKey]?.num}`} — pilih meja destinasi
            </div>
            {sections.map(section => (
              <div key={section} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 8 }}>{section}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                  {tables.filter(t => t.section === section).map(t => {
                    const isSource = activeOrders[moveSourceKey]?.tableId === t.id;
                    const tableOrderCount = Object.values(activeOrders).filter(o => o.tableId === t.id && (o.orderKey || o.id) !== moveSourceKey).length;
                    return (
                      <button key={t.id}
                        disabled={isSource}
                        onClick={() => doMoveTable(t)}
                        style={{ padding: "16px 8px", background: isSource ? "#e2e8f0" : tableOrderCount > 0 ? "#fff7ed" : "#f0fdf4", border: `2px solid ${isSource ? "#94a3b8" : tableOrderCount > 0 ? "#f59e0b" : "#22c55e"}`, borderRadius: 10, cursor: isSource ? "not-allowed" : "pointer", textAlign: "center", opacity: isSource ? 0.6 : 1 }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: isSource ? "#64748b" : tableOrderCount > 0 ? "#92400e" : "#166534" }}>{t.name.replace("Meja ", "")}</div>
                        <div style={{ fontSize: 10, color: isSource ? "#64748b" : tableOrderCount > 0 ? "#92400e" : "#166534" }}>{isSource ? "Meja semasa" : tableOrderCount > 0 ? `⚡ ${tableOrderCount} order` : "Kosong"}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PAY MODAL ── */}
      {showPayModal && selectedTable && activeOrders[selectedTable.id] && (
        <div style={S.modal}>
          <div style={{ ...S.mbox, maxWidth: 420 }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>💳 Bayaran — {selectedTable.name}</div>
            {activeOrders[selectedTable.id]?.customerName && <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>👤 {activeOrders[selectedTable.id].customerName} · 📞 {activeOrders[selectedTable.id].customerPhone || "-"}</div>}
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14, marginBottom: 16, marginTop: activeOrders[selectedTable.id]?.customerName ? 0 : 12 }}>
              {activeOrders[selectedTable.id]?.cart.map(i => (
                <div key={i._key} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span>{i.emoji} {i.name} x{i.qty}</span><span>{formatRM(i.price * i.qty)}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 8, paddingTop: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", marginBottom: 3 }}><span>Subtotal</span><span>{formatRM(activeOrders[selectedTable.id]?.subtotal || 0)}</span></div>
                {(activeOrders[selectedTable.id]?.tax || 0) > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", marginBottom: 3 }}><span>{taxConfig.label} ({taxConfig.rate}%)</span><span>{formatRM(activeOrders[selectedTable.id]?.tax || 0)}</span></div>}
                {(activeOrders[selectedTable.id]?.deliveryCharge || 0) > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", marginBottom: 6 }}><span>🛵 Caj Penghantaran</span><span>{formatRM(activeOrders[selectedTable.id].deliveryCharge)}</span></div>}
                {(parseFloat(discountInput) || 0) > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#ef4444", marginBottom: 6 }}><span>🏷️ Diskaun</span><span>-{formatRM(parseFloat(discountInput) || 0)}</span></div>}
                {(parseFloat(topupInput) || 0) > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#8b5cf6", marginBottom: 6 }}><span>➕ Topup/Extra</span><span>+{formatRM(parseFloat(topupInput) || 0)}</span></div>}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 700, color: "#1e293b" }}><span>JUMLAH</span><span>{formatRM(Math.max(0, (activeOrders[selectedTable.id]?.total || 0) - (parseFloat(discountInput) || 0) + (parseFloat(topupInput) || 0)))}</span></div>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.lbl}>🏷️ Diskaun (RM) — optional</label>
              <input type="number" value={discountInput} onChange={e => setDiscountInput(e.target.value)} placeholder="0.00" style={{ ...S.inp, marginBottom: 0 }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.lbl}>➕ Topup / Extra Caj (RM) — optional</label>
              <input type="number" value={topupInput} onChange={e => setTopupInput(e.target.value)} placeholder="0.00" style={{ ...S.inp, marginBottom: 0 }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.lbl}>Kaedah Bayaran</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[["cash", "💵 Tunai"], ["card", "💳 Kad"], ["qr", "📱 QR"]].map(([id, l]) => (
                  <button key={id} onClick={() => setPayMethod(id)} style={{ flex: 1, padding: 10, border: "2px solid", borderRadius: 8, cursor: "pointer", background: payMethod === id ? "#3b82f6" : "#f8fafc", color: payMethod === id ? "#fff" : "#64748b", borderColor: payMethod === id ? "#3b82f6" : "#e2e8f0", fontWeight: 600, fontSize: 13 }}>{l}</button>
                ))}
              </div>
            </div>
            {payMethod === "cash" && (
              <div style={{ marginBottom: 12 }}>
                <label style={S.lbl}>Jumlah Tunai</label>
                <input type="number" value={cashIn} onChange={e => setCashIn(e.target.value)} placeholder="0.00" style={{ ...S.inp, fontSize: 18, fontWeight: 700, marginBottom: 8 }} />
                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  {[10, 20, 50, 100].map(a => <button key={a} onClick={() => setCashIn(a.toString())} style={{ flex: 1, padding: "8px 0", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#000" }}>RM{a}</button>)}
                </div>
                {cashIn && parseFloat(cashIn) >= Math.max(0, (activeOrders[selectedTable.id]?.total || 0) - (parseFloat(discountInput) || 0) + (parseFloat(topupInput) || 0)) && (
                  <div style={{ background: "#f0fdf4", border: "1px solid #22c55e", borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between", fontSize: 14, color: "#166534", fontWeight: 600 }}>
                    <span>Baki:</span><span>{formatRM(parseFloat(cashIn) - Math.max(0, (activeOrders[selectedTable.id]?.total || 0) - (parseFloat(discountInput) || 0) + (parseFloat(topupInput) || 0)))}</span>
                  </div>
                )}
                {cashIn && parseFloat(cashIn) < Math.max(0, (activeOrders[selectedTable.id]?.total || 0) - (parseFloat(discountInput) || 0) + (parseFloat(topupInput) || 0)) && (
                  <div style={{ background: "#fef2f2", border: "1px solid #ef4444", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#dc2626" }}>⚠️ Wang tidak mencukupi</div>
                )}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button onClick={() => { if (payMethod === "cash" && (!cashIn || parseFloat(cashIn) < (activeOrders[selectedTable.id]?.total || 0))) return; checkout(activeOrders[selectedTable.id], false); }}
                disabled={payMethod === "cash" && (!cashIn || parseFloat(cashIn) < (activeOrders[selectedTable.id]?.total || 0))}
                style={{ flex: 1, padding: 12, background: payMethod === "cash" && (!cashIn || parseFloat(cashIn) < (activeOrders[selectedTable.id]?.total || 0)) ? "#e2e8f0" : "#64748b", border: "none", borderRadius: 8, color: payMethod === "cash" && (!cashIn || parseFloat(cashIn) < (activeOrders[selectedTable.id]?.total || 0)) ? "#94a3b8" : "#fff", fontWeight: 700, fontSize: 13, cursor: payMethod === "cash" && (!cashIn || parseFloat(cashIn) < (activeOrders[selectedTable.id]?.total || 0)) ? "not-allowed" : "pointer" }}>✅ Bayar (Tanpa Print)</button>
              <button onClick={() => checkout(activeOrders[selectedTable.id], true)}
                disabled={payMethod === "cash" && (!cashIn || parseFloat(cashIn) < (activeOrders[selectedTable.id]?.total || 0))}
                style={{ flex: 1, padding: 12, background: payMethod === "cash" && (!cashIn || parseFloat(cashIn) < (activeOrders[selectedTable.id]?.total || 0)) ? "#e2e8f0" : "#22c55e", border: "none", borderRadius: 8, color: payMethod === "cash" && (!cashIn || parseFloat(cashIn) < (activeOrders[selectedTable.id]?.total || 0)) ? "#94a3b8" : "#fff", fontWeight: 700, fontSize: 13, cursor: payMethod === "cash" && (!cashIn || parseFloat(cashIn) < (activeOrders[selectedTable.id]?.total || 0)) ? "not-allowed" : "pointer" }}>🖨️ Bayar + Print Resit</button>
            </div>
            <button onClick={() => setShowPayModal(false)} style={{ width: "100%", marginTop: 8, padding: 10, background: "none", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", color: "#64748b" }}>← Batal</button>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{ background: "#1e293b", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#f59e0b,#ef4444)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏪</div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Warung Digital POS</div>
          {/* Shift status */}
          {currentShift ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", animation: "pulse 2s infinite" }}></div>
              <span style={{ color: "#86efac", fontSize: 11, fontWeight: 600 }}>SHIFT: {currentShift.name}</span>
              <button onClick={() => setCloseShiftModal(true)} style={{ padding: "3px 8px", background: "#ef4444", border: "none", borderRadius: 4, color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>TUTUP</button>
            </div>
          ) : (
            <button onClick={() => setShiftModal(true)} style={{ padding: "4px 10px", background: "#f59e0b", border: "none", borderRadius: 4, color: "#000", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>▶ BUKA SHIFT</button>
          )}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[["tables","🍽️ Order"],["history","📋 Past Order"],["sales","📊 Sales Report"],["settings","⚙️ Settings"]].map(([k, l]) => (
            <button key={k} onClick={() => { setPage(k); if (k === "settings") setSettingsTab("menu"); }} style={{ padding: "6px 12px", background: page === k ? "#f59e0b" : "transparent", border: "1px solid", borderColor: page === k ? "#f59e0b" : "#334155", borderRadius: 6, color: page === k ? "#000" : "#94a3b8", fontSize: 11, fontWeight: page === k ? 700 : 400, cursor: "pointer" }}>{l}</button>
          ))}
          <button onClick={() => setShowQRModal(true)} style={{ padding: "6px 12px", background: "#8b5cf6", border: "1px solid #8b5cf6", borderRadius: 6, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", position: "relative" }}>
            📱 QR Order
            {newPendingCount > 0 && <span style={{ position: "absolute", top: -6, right: -6, background: "#ef4444", color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{newPendingCount}</span>}
          </button>
          <button onClick={() => setShowQrHistory(true)} style={{ padding: "6px 12px", background: "#475569", border: "1px solid #475569", borderRadius: 6, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>📜 QR History</button>
        </div>
      </div>

      {/* ══ ORDER PAGE ══ */}
      {page === "order" && (
        <div style={{ display: "flex", height: "calc(100vh - 56px)" }}>
          {/* Left: Categories */}
          <div style={{ width: 160, background: "#1e293b", overflowY: "auto", padding: "12px 8px" }}>
            <button onClick={() => { setFCat("all"); setFSub("all"); setShowCombos(false); }}
              style={{ width: "100%", padding: "10px 8px", marginBottom: 4, background: fCat === "all" && !showCombos ? "#f59e0b" : "transparent", border: "none", borderRadius: 8, color: fCat === "all" && !showCombos ? "#000" : "#94a3b8", fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
              📋 Semua
            </button>
            <button onClick={() => setShowCombos(true)}
              style={{ width: "100%", padding: "10px 8px", marginBottom: 4, background: showCombos ? "#f59e0b" : "transparent", border: "none", borderRadius: 8, color: showCombos ? "#000" : "#94a3b8", fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
              🍱 Set/Combo
            </button>
            {categories.map(c => (
              <button key={c.id} onClick={() => { setFCat(c.id); setFSub("all"); setShowCombos(false); }}
                style={{ width: "100%", padding: "10px 8px", marginBottom: 4, background: fCat === c.id && !showCombos ? "#3b82f6" : "transparent", border: "none", borderRadius: 8, color: fCat === c.id && !showCombos ? "#fff" : "#94a3b8", fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
                {c.name}
              </button>
            ))}
          </div>

          {/* Middle: Products */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "10px 14px", background: "#fff", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Cari menu..." style={{ ...S.inp, flex: 1 }} />
                <div style={{ fontSize: 13, color: "#64748b", whiteSpace: "nowrap" }}>
                  {currentOrderType && <span style={{ background: currentOrderType.color, color: "#fff", padding: "4px 10px", borderRadius: 20, fontWeight: 600 }}>{currentOrderType.emoji} {currentOrderType.label}</span>}
                  {currentTable && <span style={{ background: "#f59e0b", color: "#000", padding: "4px 10px", borderRadius: 20, fontWeight: 600, marginLeft: 6 }}>🪑 {currentTable.name}</span>}
                </div>
              </div>
              {!showCombos && fCat !== "all" && catSubs.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button onClick={() => setFSub("all")} style={{ padding: "3px 10px", borderRadius: 20, border: "1px solid", fontSize: 11, cursor: "pointer", background: fSub === "all" ? "#3b82f6" : "transparent", color: fSub === "all" ? "#fff" : "#64748b", borderColor: fSub === "all" ? "#3b82f6" : "#e2e8f0" }}>Semua</button>
                  {catSubs.map(s => <button key={s.id} onClick={() => setFSub(s.id)} style={{ padding: "3px 10px", borderRadius: 20, border: "1px solid", fontSize: 11, cursor: "pointer", background: fSub === s.id ? "#3b82f6" : "transparent", color: fSub === s.id ? "#fff" : "#64748b", borderColor: fSub === s.id ? "#3b82f6" : "#e2e8f0" }}>{s.name}</button>)}
                </div>
              )}
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 10, alignContent: "start" }}>
              {showCombos ? combos.map(c => (
                <button key={c.id} onClick={() => !c.soldOut && addCart(c, true)} style={{ background: c.soldOut ? "#f1f5f9" : "#fff", border: `2px solid ${c.soldOut ? "#e2e8f0" : "#e2e8f0"}`, borderRadius: 12, padding: "14px 10px", cursor: c.soldOut ? "not-allowed" : "pointer", textAlign: "center", transition: "all .15s", opacity: c.soldOut ? 0.6 : 1, position: "relative" }}
                  onMouseEnter={e => { if (!c.soldOut) e.currentTarget.style.borderColor = "#f59e0b"; }}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "#e2e8f0"}>
                  <div style={{ fontSize: 28, marginBottom: 5 }}>{c.emoji}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2, color: "#1e293b" }}>{c.name}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 4 }}>{c.description}</div>
                  {c.soldOut ? <div style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", background: "#fef2f2", borderRadius: 6, padding: "2px 8px" }}>SOLD OUT</div> : <div style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b" }}>{formatRM(c.price)}</div>}
                </button>
              )) : filtered.map(p => (
                <button key={p.id} onClick={() => !p.soldOut && addCart(p)} style={{ background: p.soldOut ? "#f1f5f9" : "#fff", border: "2px solid #e2e8f0", borderRadius: 12, padding: "14px 10px", cursor: p.soldOut ? "not-allowed" : "pointer", textAlign: "center", transition: "all .15s", opacity: p.soldOut ? 0.6 : 1 }}
                  onMouseEnter={e => { if (!p.soldOut) e.currentTarget.style.borderColor = "#3b82f6"; }}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "#e2e8f0"}>
                  {p.imageBase64 ? <img src={p.imageBase64} alt={p.name} style={{ width: "100%", height: 60, objectFit: "cover", borderRadius: 8, marginBottom: 5 }} /> : <div style={{ fontSize: 28, marginBottom: 5 }}>{p.emoji}</div>}
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#1e293b" }}>{p.name}</div>
                  {p.soldOut ? <div style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", background: "#fef2f2", borderRadius: 6, padding: "2px 8px" }}>SOLD OUT</div> : <div style={{ fontSize: 14, fontWeight: 700, color: "#3b82f6" }}>{formatRM(p.price)}</div>}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Cart */}
          <div style={{ width: 300, background: "#fff", borderLeft: "1px solid #e2e8f0", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>🛒 Cart ({cart.reduce((s, i) => s + i.qty, 0)} item)</div>
              {cart.length > 0 && <button onClick={() => setCart([])} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Clear All</button>}
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 14px" }}>
              {cart.length === 0 ? <div style={{ textAlign: "center", color: "#94a3b8", paddingTop: 50 }}><div style={{ fontSize: 36, marginBottom: 8 }}>🛒</div><div style={{ fontSize: 13 }}>No items in cart</div></div>
                : cart.map(i => (
                  <div key={i._key} style={{ padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{i.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{i.name}</div>
                        <div style={{ fontSize: 12, color: "#3b82f6" }}>{formatRM(i.price)}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <button onClick={() => updQty(i._key, -1)} style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid #e2e8f0", background: "#f1f5f9", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>−</button>
                        <span style={{ fontSize: 13, fontWeight: 700, minWidth: 18, textAlign: "center" }}>{i.qty}</span>
                        <button onClick={() => updQty(i._key, 1)} style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid #e2e8f0", background: "#f1f5f9", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>+</button>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, minWidth: 52, textAlign: "right" }}>{formatRM(i.price * i.qty)}</div>
                    </div>
                    {i.comboItems && i.comboItems.length > 0 && <div style={{ paddingLeft: 28, marginTop: 3 }}>{i.comboItems.map(ci => <div key={ci.productId || ci.customId} style={{ fontSize: 11, color: "#94a3b8" }}>· {ci.name} x{ci.qty}</div>)}</div>}
                    <div style={{ paddingLeft: 28, marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                      {i.note && <span style={{ fontSize: 10, color: "#f59e0b", background: "#fff7ed", borderRadius: 4, padding: "1px 6px", border: "1px solid #f59e0b" }}>📝 {i.note}</span>}
                      <button onClick={() => { setNoteTargetKey(i._key); setNoteText(i.note || ""); setNoteModal(true); }} style={{ fontSize: 10, color: "#94a3b8", background: "none", border: "none", cursor: "pointer", padding: 0 }}>{i.note ? "✏️ Edit note" : "+ Add note"}</button>
                    </div>
                  </div>
                ))}
            </div>
            {cart.length > 0 && (
              <div style={{ padding: "14px 16px", borderTop: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", marginBottom: 3 }}><span>Subtotal</span><span>{formatRM(sub)}</span></div>
                {tax > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", marginBottom: 3 }}><span>{taxConfig.label} ({taxConfig.rate}%)</span><span>{formatRM(tax)}</span></div>}
                {currentOrderType?.id === "delivery" && (parseFloat(deliveryChargeInput) || 0) > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", marginBottom: 10 }}><span>🛵 Caj Penghantaran</span><span>{formatRM(parseFloat(deliveryChargeInput) || 0)}</span></div>}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 14 }}><span>JUMLAH</span><span>{formatRM(total + (currentOrderType?.id === "delivery" ? (parseFloat(deliveryChargeInput) || 0) : 0))}</span></div>
                <button onClick={createOrder} style={{ width: "100%", padding: 14, background: "#22c55e", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                  🖨️ CREATE ORDER
                </button>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button onClick={() => { setPage("tables"); setCart([]); setEditingDraftKey(null); setCurrentTable(null); setCurrentOrderType(null); }} style={{ flex: 1, padding: 10, background: "none", border: "1px solid #e2e8f0", borderRadius: 8, color: "#64748b", cursor: "pointer", fontSize: 12 }}>← Balik {editingDraftKey ? "(draft tersimpan)" : ""}</button>
                  <button onClick={() => {
                    if (cart.length === 0) return;
                    const draftKey = editingDraftKey || `draft_${Date.now()}`;
                    const draft = {
                      orderKey: draftKey, id: draftKey, num: orderNum, cart: [...cart],
                      subtotal: sub, tax, total: total + (currentOrderType?.id === "delivery" ? (parseFloat(deliveryChargeInput) || 0) : 0),
                      deliveryCharge: currentOrderType?.id === "delivery" ? (parseFloat(deliveryChargeInput) || 0) : 0,
                      customerName: deliveryName.trim(), customerPhone: deliveryPhone.trim(),
                      tableNo: currentTable?.name || "-", tableId: currentTable?.id || null,
                      orderType: currentOrderType?.label || "Takeaway",
                      time: new Date(), status: "draft", isDraft: true,
                      displayName: currentTable ? `${currentTable.name} (Draft)` : `Draft #${orderNum}`,
                    };
                    setActiveOrders(prev => ({ ...prev, [draftKey]: draft }));
                    if (!editingDraftKey) setOrderNum(n => n + 1);
                    setCart([]); setPage("tables"); setCurrentTable(null); setCurrentOrderType(null); setEditingDraftKey(null);
                    toast("💾 Draft disimpan!", "#8b5cf6");
                  }} style={{ flex: 1, padding: 10, background: "#ede9fe", border: "1px solid #8b5cf6", borderRadius: 8, color: "#7c3aed", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>💾 Save Draft</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ TABLES / ORDER PAGE ══ */}
      {page === "tables" && (
        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#1e293b" }}>🍽️ Order Dashboard</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>{Object.keys(activeOrders).length} order aktif</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {newPendingCount > 0 && (
                <button onClick={() => setShowQRModal(true)} style={{ padding: "10px 16px", background: "#fef3c7", border: "2px solid #f59e0b", borderRadius: 10, color: "#92400e", fontWeight: 700, fontSize: 13, cursor: "pointer", animation: "pulse 2s infinite" }}>
                  🔔 {newPendingCount} QR Order Baru
                </button>
              )}
              <button onClick={() => { if (!currentShift) { toast("⚠️ Buka shift dulu sebelum boleh buat order!", "#ef4444"); return; } setShowOrderTypeModal(true); }} style={{ padding: "12px 24px", background: currentShift ? "#3b82f6" : "#94a3b8", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 15, cursor: currentShift ? "pointer" : "not-allowed" }}>+ Create New Order</button>
            </div>
          </div>

          {Object.keys(activeOrders).length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
              <div style={{ fontSize: 60, marginBottom: 16 }}>🍽️</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: "#64748b" }}>NO NEW ORDER</div>
              <div style={{ fontSize: 13 }}>Tiada order buat masa ini</div>
            </div>
          )}

          {sections.map(section => {
            // Kumpul semua order yang tableId dalam section ni
            const sectionOrders = Object.values(activeOrders).filter(o => {
              const tbl = tables.find(t => t.id === o.tableId);
              return tbl && tbl.section === section;
            });
            if (sectionOrders.length === 0) return null;
            return (
              <div key={section} style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#64748b", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>{section}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
                  {sectionOrders.map(order => {
                    const oKey = order.orderKey || order.id;
                    const isMergeTarget = mergeMode && mergeSourceKey !== oKey;
                    const isMergeSource = mergeMode && mergeSourceKey === oKey;
                    return (
                      <div key={oKey} style={{ background: isMergeTarget ? "#f0fdf4" : isMergeSource ? "#fef9c3" : "#fff7ed", border: `2px solid ${isMergeTarget ? "#22c55e" : isMergeSource ? "#f59e0b" : "#f59e0b"}`, borderRadius: 14, padding: 14, boxShadow: "0 2px 12px rgba(245,158,11,.15)" }}>
                        <div onClick={() => !mergeMode && setOrderPreview(order)} style={{ cursor: mergeMode ? "default" : "pointer", marginBottom: 6 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#92400e" }}>{order.displayName || order.tableNo}</div>
                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                              {!mergeMode && <span style={{ fontSize: 10, color: "#f59e0b" }}>👆 tap</span>}
                              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
                            </div>
                          </div>
                          {order.customerName && <div style={{ fontSize: 11, color: "#92400e", marginBottom: 2 }}>👤 {order.customerName} · 📞 {order.customerPhone}</div>}
                          <div style={{ fontSize: 11, color: "#92400e", marginBottom: 2 }}>{order.cart.length} item · {fmtTime(order.time)} · {order.orderType}</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: "#f59e0b" }}>{formatRM(order.total)}</div>
                        </div>
                        {mergeMode ? (
                          <button onClick={() => isMergeSource ? (setMergeMode(false), setMergeSourceKey(null)) : doMerge(oKey)}
                            style={{ width: "100%", padding: "8px 0", background: isMergeSource ? "#f59e0b" : "#22c55e", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                            {isMergeSource ? "✕ Batal" : "⬅ Gabung ke sini"}
                          </button>
                        ) : (
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
                            <button onClick={() => { setSelectedTable({ id: oKey, name: order.displayName || order.tableNo }); setShowPayModal(true); setCashIn(""); setPayMethod("cash"); setDiscountInput(""); setTopupInput(""); }} style={{ padding: "7px 4px", background: "#22c55e", border: "none", borderRadius: 7, color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>💳 Bayar</button>
                            <button onClick={() => openEditOrder(oKey)} style={{ padding: "7px 4px", background: "#3b82f6", border: "none", borderRadius: 7, color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>✏️ Edit</button>
                            <button onClick={() => startMoveTable(oKey)} style={{ padding: "7px 4px", background: "#06b6d4", border: "none", borderRadius: 7, color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>↔️ Pindah</button>
                            <button onClick={() => startMerge(oKey)} style={{ padding: "7px 4px", background: "#8b5cf6", border: "none", borderRadius: 7, color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>🔗 Merge</button>
                            <button onClick={() => openSplit(oKey)} style={{ padding: "7px 4px", background: "#f59e0b", border: "none", borderRadius: 7, color: "#000", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>✂️ Split</button>
                            <button onClick={() => { setReprintOrder(order); setShowReprintModal(true); }} style={{ padding: "7px 4px", background: "#475569", border: "none", borderRadius: 7, color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>🖨️ Reprint</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Draft Orders */}
          {Object.values(activeOrders).filter(o => o.isDraft).length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#7c3aed", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>💾 Draft (Belum Create)</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
                {Object.values(activeOrders).filter(o => o.isDraft).map(order => {
                  const oKey = order.orderKey || order.id;
                  return (
                    <div key={oKey} style={{ background: "#faf5ff", border: "2px dashed #8b5cf6", borderRadius: 14, padding: 14 }}>
                      <div style={{ fontWeight: 700, color: "#7c3aed", marginBottom: 4 }}>{order.displayName || `Draft #${order.num}`}</div>
                      <div style={{ fontSize: 12, color: "#7c3aed", marginBottom: 2 }}>{order.cart.length} item · {order.orderType}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#8b5cf6", marginBottom: 10 }}>{formatRM(order.total)}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                        <button onClick={() => {
                          setCart(order.cart); setCurrentTable(order.tableId ? tables.find(t => t.id === order.tableId) || null : null);
                          setCurrentOrderType(ORDER_TYPES.find(t => t.label === order.orderType) || null);
                          setEditingDraftKey(oKey);
                          setPage("order");
                        }} style={{ padding: "7px 4px", background: "#8b5cf6", border: "none", borderRadius: 7, color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>▶ Sambung</button>
                        <button onClick={() => { if (window.confirm("Padam draft?")) { setActiveOrders(prev => { const n = { ...prev }; delete n[oKey]; return n; }); } }} style={{ padding: "7px 4px", background: "#fef2f2", border: "1px solid #ef4444", borderRadius: 7, color: "#ef4444", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>🗑️ Padam</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Takeaway/Delivery */}
          {Object.values(activeOrders).filter(o => !o.tableId && !o.isDraft).length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#64748b", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Takeaway / Delivery</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
                {Object.values(activeOrders).filter(o => !o.tableId && !o.isDraft).map(order => {
                  const oKey = order.orderKey || order.id;
                  const isMergeTarget = mergeMode && mergeSourceKey !== oKey;
                  const isMergeSource = mergeMode && mergeSourceKey === oKey;
                  return (
                    <div key={oKey} style={{ background: isMergeTarget ? "#f0fdf4" : isMergeSource ? "#fef9c3" : "#f0fdf4", border: `2px solid ${isMergeTarget ? "#22c55e" : isMergeSource ? "#f59e0b" : "#22c55e"}`, borderRadius: 14, padding: 14 }}>
                      <div onClick={() => !mergeMode && setOrderPreview(order)} style={{ cursor: mergeMode ? "default" : "pointer", marginBottom: 6 }}>
                        <div style={{ fontWeight: 700, color: "#166534", marginBottom: 2 }}>Order #{order.num} {!mergeMode && <span style={{ fontSize: 10, color: "#22c55e", fontWeight: 400 }}>👆 tap item</span>}</div>
                        {order.customerName && <div style={{ fontSize: 11, color: "#166534", marginBottom: 2 }}>👤 {order.customerName} · 📞 {order.customerPhone || "-"}</div>}
                        <div style={{ fontSize: 12, color: "#166534", marginBottom: 2 }}>{order.cart.length} item · {order.orderType}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "#22c55e" }}>{formatRM(order.total)}</div>
                      </div>
                      {mergeMode ? (
                        <button onClick={() => isMergeSource ? (setMergeMode(false), setMergeSourceKey(null)) : doMerge(oKey)}
                          style={{ width: "100%", padding: "8px 0", background: isMergeSource ? "#f59e0b" : "#22c55e", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                          {isMergeSource ? "✕ Batal" : "⬅ Gabung ke sini"}
                        </button>
                      ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
                          <button onClick={() => { setSelectedTable({ id: oKey, name: `Order #${order.num}` }); setShowPayModal(true); setCashIn(""); setPayMethod("cash"); setDiscountInput(""); setTopupInput(""); }} style={{ padding: "7px 4px", background: "#22c55e", border: "none", borderRadius: 7, color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>💳 Bayar</button>
                          <button onClick={() => openEditOrder(oKey)} style={{ padding: "7px 4px", background: "#3b82f6", border: "none", borderRadius: 7, color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>✏️ Edit</button>
                          <button onClick={() => startMoveTable(oKey)} style={{ padding: "7px 4px", background: "#06b6d4", border: "none", borderRadius: 7, color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>↔️ Pindah</button>
                          <button onClick={() => startMerge(oKey)} style={{ padding: "7px 4px", background: "#8b5cf6", border: "none", borderRadius: 7, color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>🔗 Merge</button>
                          <button onClick={() => openSplit(oKey)} style={{ padding: "7px 4px", background: "#f59e0b", border: "none", borderRadius: 7, color: "#000", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>✂️ Split</button>
                          <button onClick={() => { setReprintOrder(order); setShowReprintModal(true); }} style={{ padding: "7px 4px", background: "#475569", border: "none", borderRadius: 7, color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>🖨️ Reprint</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ PAST ORDER PAGE ══ */}
      {page === "history" && (
        <div style={{ padding: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>📋 Past Order</div>

          {/* Date filter */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={() => setHistDateFilter("")} style={{ padding: "7px 16px", background: histDateFilter === "" ? "#3b82f6" : "#fff", border: "1px solid", borderColor: histDateFilter === "" ? "#3b82f6" : "#e2e8f0", borderRadius: 8, color: histDateFilter === "" ? "#fff" : "#1e293b", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Hari Ini</button>
            <input
              type="date"
              value={histDateFilter}
              max={new Date().toISOString().split("T")[0]}
              onChange={e => setHistDateFilter(e.target.value)}
              style={{ padding: "7px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#1e293b", background: histDateFilter ? "#eff6ff" : "#fff", fontWeight: histDateFilter ? 700 : 400, cursor: "pointer", outline: "none" }}
            />
            {histDateFilter && <button onClick={() => setHistDateFilter("")} style={{ padding: "7px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#ef4444", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>✕ Clear</button>}
          </div>

          {(() => {
            let filtered;
            if (histDateFilter) {
              const selStart = new Date(histDateFilter + "T00:00:00");
              const selEnd = new Date(histDateFilter + "T23:59:59");
              filtered = salesHistory.filter(o => { const t = new Date(o.time); return t >= selStart && t <= selEnd; });
            } else {
              filtered = todayOrders;
            }
            const displayDate = histDateFilter ? new Date(histDateFilter + "T00:00:00").toLocaleDateString("ms-MY", { day: "2-digit", month: "long", year: "numeric" }) : fmtDate(new Date());
            return (
              <>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>{displayDate}</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
                  <div style={{ background: "#f0fdf4", border: "1px solid #22c55e", borderRadius: 8, padding: "8px 16px", fontSize: 14, fontWeight: 700, color: "#166534" }}>
                    Jumlah: {formatRM(filtered.reduce((s, o) => s + o.total, 0))}
                  </div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>{filtered.length} order</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {filtered.length === 0 && <div style={{ textAlign: "center", color: "#94a3b8", padding: 40 }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
                    Tiada order untuk tarikh ini
                  </div>}
                  {filtered.map(o => (
                    <div key={o.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px", cursor: "pointer" }} onClick={() => setHistDetail(histDetail?.id === o.id ? null : o)}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>Order #{o.num}</div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>{fmtTime(o.time)} · {o.tableNo} · {o.orderType}</div>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: "#22c55e" }}>{formatRM(o.total)}</div>
                      </div>
                      {histDetail?.id === o.id && (
                        <div style={{ marginTop: 10, borderTop: "1px solid #f1f5f9", paddingTop: 10 }}>
                          {o.cart.map(i => <div key={i._key} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3, color: "#1e293b" }}><span>{i.emoji} {i.name} x{i.qty}</span><span>{formatRM(i.price * i.qty)}</span></div>)}
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, marginTop: 6, paddingTop: 6, borderTop: "1px solid #f1f5f9", color: "#1e293b" }}><span>Kaedah: {o.method}</span><span>{formatRM(o.total)}</span></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ══ SALES REPORT PAGE ══ */}
      {page === "sales" && (
        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#1e293b" }}>📊 Sales Report</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#64748b", cursor: "pointer" }}>
                <input type="checkbox" checked={salesPrintItems} onChange={e => setSalesPrintItems(e.target.checked)} />
                Sertakan Item
              </label>
              <button onClick={() => setSalesPrintModal(true)} style={{ padding: "8px 16px", background: "#3b82f6", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>🖨️ Print / Download</button>
            </div>
          </div>

          {/* Filter buttons */}
          <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
            {[["yesterday","Semalam"],["week","7 Hari"],["month","Bulan Ini"],["year","Tahun Ini"],["pickdate","📅 Tarikh"],["pickmonth","🗓️ Bulan"],["pickyear","📆 Tahun"]].map(([k,l]) => (
              <button key={k} onClick={() => setSalesFilter(k)} style={{ padding: "8px 14px", background: salesFilter === k ? "#3b82f6" : "#fff", border: "1px solid", borderColor: salesFilter === k ? "#3b82f6" : "#e2e8f0", borderRadius: 8, color: salesFilter === k ? "#fff" : "#1e293b", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>{l}</button>
            ))}
          </div>

          {/* Custom date/month/year pickers */}
          {salesFilter === "pickdate" && (
            <div style={{ marginBottom: 12 }}>
              <input type="date" value={salesPickDate} max={new Date().toISOString().split("T")[0]} onChange={e => setSalesPickDate(e.target.value)} style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", background: salesPickDate ? "#eff6ff" : "#fff", color: "#1e293b" }} />
            </div>
          )}
          {salesFilter === "pickmonth" && (
            <div style={{ marginBottom: 12 }}>
              <input type="month" value={salesPickMonth} max={new Date().toISOString().slice(0,7)} onChange={e => setSalesPickMonth(e.target.value)} style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", background: salesPickMonth ? "#eff6ff" : "#fff", color: "#1e293b" }} />
            </div>
          )}
          {salesFilter === "pickyear" && (
            <div style={{ marginBottom: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(yr => (
                <button key={yr} onClick={() => setSalesPickYear(String(yr))} style={{ padding: "8px 16px", background: salesPickYear === String(yr) ? "#3b82f6" : "#f1f5f9", border: "1px solid", borderColor: salesPickYear === String(yr) ? "#3b82f6" : "#e2e8f0", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", color: salesPickYear === String(yr) ? "#fff" : "#1e293b" }}>{yr}</button>
              ))}
            </div>
          )}

          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Jumlah Jualan</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#22c55e" }}>{formatRM(totalSalesFilter)}</div>
            </div>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Bilangan Order</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#3b82f6" }}>{salesByFilter.length}</div>
            </div>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Purata Per Order</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#f59e0b" }}>{formatRM(salesByFilter.length ? totalSalesFilter / salesByFilter.length : 0)}</div>
            </div>
          </div>

          {/* Daily Breakdown */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>Jualan Mengikut Hari</div>
            {Object.keys(salesByDay).length === 0 && <div style={{ color: "#94a3b8", fontSize: 13 }}>Tiada data</div>}
            {Object.entries(salesByDay).sort((a,b) => new Date(b[0]) - new Date(a[0])).map(([day, data]) => (
              <div key={day} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{day}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{data.count} order</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#22c55e" }}>{formatRM(data.total)}</div>
              </div>
            ))}
          </div>

          {/* Top Items */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>Item Paling Laris</div>
            {(() => {
              const itemCount = {};
              salesByFilter.forEach(o => o.cart.forEach(i => {
                if (!itemCount[i.name]) itemCount[i.name] = { qty: 0, total: 0, emoji: i.emoji };
                itemCount[i.name].qty += i.qty;
                itemCount[i.name].total += i.price * i.qty;
              }));
              const sorted = Object.entries(itemCount).sort((a,b) => b[1].qty - a[1].qty).slice(0,10);
              if (sorted.length === 0) return <div style={{ color: "#94a3b8", fontSize: 13 }}>Tiada data</div>;
              return sorted.map(([name, data], i) => (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", minWidth: 20 }}>#{i+1}</div>
                  <div style={{ fontSize: 18 }}>{data.emoji}</div>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{name}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{data.qty}x</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#22c55e" }}>{formatRM(data.total)}</div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* ══ SETTINGS PAGE ══ */}
      {page === "settings" && (
        <div style={{ display: "flex", height: "calc(100vh - 56px)" }}>
          {/* Settings sidebar */}
          <div style={{ width: 180, background: "#1e293b", padding: "16px 10px" }}>
            {[["menu","🍽️ Menu"],["printers","🖨️ Printer"],["categories","📂 Kategori"],["tables","🪑 Setup Meja"],["tax","💰 Tax / Caj"],["receipt","🧾 Resit"]].map(([k,l]) => (
              <button key={k} onClick={() => setSettingsTab(k)} style={{ width: "100%", padding: "10px 12px", marginBottom: 4, background: settingsTab === k ? "#f59e0b" : "transparent", border: "none", borderRadius: 8, color: settingsTab === k ? "#000" : "#94a3b8", fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>{l}</button>
            ))}
          </div>

          {/* Settings content */}
          <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>

            {/* Menu Tab */}
            {settingsTab === "menu" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>🍽️ Pengurusan Menu</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={openAddItem} style={{ padding: "8px 16px", background: "#3b82f6", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>+ Item</button>
                    <button onClick={openAddCombo} style={{ padding: "8px 16px", background: "#f59e0b", border: "none", borderRadius: 8, color: "#000", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>+ Set</button>
                    <button onClick={exportMenuCSV} style={{ padding: "8px 16px", background: "#10b981", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>📤 Export</button>
                    <button onClick={() => setImportModal(true)} style={{ padding: "8px 16px", background: "#6366f1", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>📥 Import</button>
                    <button onClick={async () => {
                      try {
                        await setDoc(doc(db, "config", "menu"), { products, combos, categories, taxRate, taxConfig, tables, shiftOpen: !!currentShift });
                        toast("✅ Menu berjaya sync ke QR!", "#22c55e");
                      } catch { toast("❌ Sync gagal — check internet", "#ef4444"); }
                    }} style={{ padding: "8px 16px", background: "#f59e0b", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>🔄 Sync QR</button>
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 10 }}>Item Menu ({products.length})</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <input value={menuSearch} onChange={e => setMenuSearch(e.target.value)} placeholder="🔍 Cari item..." style={{ ...S.inp, flex: 1, marginBottom: 0 }} />
                  <select value={menuCatFilter} onChange={e => setMenuCatFilter(e.target.value)} style={{ ...S.sel, minWidth: 140 }}>
                    <option value="all">Semua Kategori</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 10, marginBottom: 24 }}>
                  {products.filter(item => (menuCatFilter === "all" || item.categoryId === menuCatFilter) && item.name.toLowerCase().includes(menuSearch.toLowerCase())).map(item => {
                    const cat = categories.find(c => c.id === item.categoryId);
                    const s = cat?.subcategories.find(x => x.id === item.subcategoryId);
                    const printer = printers.find(p => p.id === item.printerId);
                    return (
                      <div key={item.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                        {item.imageBase64 ? <img src={item.imageBase64} alt={item.name} style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} /> : <div style={{ fontSize: 28 }}>{item.emoji}</div>}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>{item.name}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>{cat?.name}{s ? ` › ${s.name}` : ""}</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#3b82f6" }}>{formatRM(item.price)}</div>
                          {printer && <div style={{ fontSize: 10, color: "#f59e0b" }}>🖨️ {printer.name}</div>}
                        </div>
                        <div style={{ display: "flex", gap: 5 }}>
                          <button onClick={() => toggleSoldOut(item.id)} style={{ padding: "5px 9px", background: item.soldOut ? "#fef2f2" : "#f0fdf4", border: "none", borderRadius: 6, color: item.soldOut ? "#ef4444" : "#22c55e", cursor: "pointer", fontSize: 10, fontWeight: 700 }}>{item.soldOut ? "🚫 SOLD" : "✅ ADA"}</button>
                          <button onClick={() => openEditItem(item)} style={{ padding: "5px 9px", background: "#eff6ff", border: "none", borderRadius: 6, color: "#3b82f6", cursor: "pointer" }}>✏️</button>
                          <button onClick={() => delItem(item.id)} style={{ padding: "5px 9px", background: "#fef2f2", border: "none", borderRadius: 6, color: "#ef4444", cursor: "pointer" }}>🗑️</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 10 }}>Set/Combo ({combos.length})</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 10 }}>
                  {combos.map(c => (
                    <div key={c.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <div style={{ fontSize: 28 }}>{c.emoji}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>{c.name}</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b" }}>{formatRM(c.price)}</div>
                        </div>
                        <div style={{ display: "flex", gap: 5 }}>
                          <button onClick={() => toggleComboSoldOut(c.id)} style={{ padding: "5px 9px", background: c.soldOut ? "#fef2f2" : "#f0fdf4", border: "none", borderRadius: 6, color: c.soldOut ? "#ef4444" : "#22c55e", cursor: "pointer", fontSize: 10, fontWeight: 700 }}>{c.soldOut ? "🚫 SOLD" : "✅ ADA"}</button>
                          <button onClick={() => openEditCombo(c)} style={{ padding: "5px 9px", background: "#eff6ff", border: "none", borderRadius: 6, color: "#3b82f6", cursor: "pointer" }}>✏️</button>
                          <button onClick={() => delCombo(c.id)} style={{ padding: "5px 9px", background: "#fef2f2", border: "none", borderRadius: 6, color: "#ef4444", cursor: "pointer" }}>🗑️</button>
                        </div>
                      </div>
                      <div style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 10px" }}>
                        {c.items?.map(ci => { const p = products.find(x => x.id === ci.productId); const pr = printers.find(x => x.id === ci.printerId); return p ? <div key={ci.productId} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", marginBottom: 2 }}><span>· {p.emoji} {p.name} × {ci.qty}</span>{pr && <span style={{ color: "#f59e0b", fontSize: 10 }}>🖨️ {pr.name}</span>}</div> : null; })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Printers Tab */}
            {settingsTab === "printers" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>🖨️ Pengurusan Printer</div>
                  <button onClick={openAddPrinter} style={{ padding: "8px 16px", background: "#3b82f6", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>+ Tambah Printer</button>
                </div>
                {printers.length === 0 && <div style={{ background: "#fff", border: "2px dashed #e2e8f0", borderRadius: 12, padding: 40, textAlign: "center", color: "#94a3b8" }}><div style={{ fontSize: 40, marginBottom: 10 }}>🖨️</div>Belum ada printer</div>}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {printers.map(p => (
                    <div key={p.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ fontSize: 28 }}>{p.type === "bluetooth" ? "📶" : "📡"}</div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>{p.name}</div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>{p.type === "bluetooth" ? `${p.btType === "ble" ? "BLE" : "Classic"} · ${p.deviceId || "Belum set"}` : `WiFi · ${p.ip || "Belum set"}:${p.port || 9100}`}</div>
                          <div style={{ fontSize: 11, color: "#f59e0b" }}>📍 {p.location}</div>
                          <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
                            <span style={{ fontSize: 10, background: p.role === "cashier" ? "#f0fdf4" : "#fff7ed", color: p.role === "cashier" ? "#166534" : "#92400e", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>
                              {p.role === "cashier" ? "💰 Cashier" : p.role === "kitchen" ? "🍳 Kitchen" : p.role === "bar" ? "🥤 Bar" : "⚙️ Custom"}
                            </span>
                            <span style={{ fontSize: 10, background: "#f8fafc", color: "#64748b", padding: "2px 6px", borderRadius: 4 }}>
                              {p.showPrice ? "💰 + Harga" : "📋 Order Only"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={async () => { toast(`🖨️ Test ${p.name}...`); const o = { cart: [{ _key: "t1", id: 1, name: "Test Item", price: 1, qty: 1, emoji: "🧪" }], subtotal: 1, tax: 0.06, total: 1.06, num: 9999, time: new Date(), tableNo: "Test" }; await doPrint(p, buildOrderSlipBytes(o, p.name, o.cart, p.showPrice, p.printerWidth || "58")); }} style={{ padding: "6px 10px", background: "#f0fdf4", border: "none", borderRadius: 6, color: "#22c55e", cursor: "pointer", fontSize: 12 }}>{printSt[p.id] || "🖨️ Test"}</button>
                        <button onClick={() => openEditPrinter(p)} style={{ padding: "6px 10px", background: "#eff6ff", border: "none", borderRadius: 6, color: "#3b82f6", cursor: "pointer" }}>✏️</button>
                        <button onClick={() => delPrinter(p.id)} style={{ padding: "6px 10px", background: "#fef2f2", border: "none", borderRadius: 6, color: "#ef4444", cursor: "pointer" }}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Categories Tab */}
            {settingsTab === "categories" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>📂 Pengurusan Kategori</div>
                  <button onClick={openAddCat} style={{ padding: "8px 16px", background: "#3b82f6", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>+ Tambah Kategori</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {categories.map(cat => (
                    <div key={cat.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
                      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ fontWeight: 700, color: "#1e293b" }}>{cat.name} <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 400 }}>({cat.subcategories.length} sub · {products.filter(p => p.categoryId === cat.id).length} item)</span></div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => openAddSub(cat.id)} style={{ padding: "5px 10px", background: "#f0fdf4", border: "none", borderRadius: 6, color: "#22c55e", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>+ Sub</button>
                          <button onClick={() => openEditCat(cat)} style={{ padding: "5px 9px", background: "#eff6ff", border: "none", borderRadius: 6, color: "#3b82f6", cursor: "pointer" }}>✏️</button>
                          <button onClick={() => delCat(cat.id)} style={{ padding: "5px 9px", background: "#fef2f2", border: "none", borderRadius: 6, color: "#ef4444", cursor: "pointer" }}>🗑️</button>
                        </div>
                      </div>
                      {cat.subcategories.length > 0 && (
                        <div style={{ borderTop: "1px solid #f1f5f9", padding: "8px 16px 12px", display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {cat.subcategories.map(s => (
                            <div key={s.id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "4px 10px", display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 13, color: "#1e293b" }}>{s.name}</span>
                              <button onClick={() => openEditSub(s, cat.id)} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: 11 }}>✏️</button>
                              <button onClick={() => delSub(s.id, cat.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 11 }}>✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tables Setup Tab */}
            {settingsTab === "tables" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>🪑 Setup Meja ({tables.length} meja)</div>
                  <button onClick={openAddTable} style={{ padding: "8px 16px", background: "#3b82f6", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>+ Tambah Meja</button>
                </div>
                {sections.map(section => (
                  <div key={section} style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 10 }}>{section}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }}>
                      {tables.filter(t => t.section === section).map(t => (
                        <div key={t.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ fontWeight: 600, color: "#1e293b" }}>{t.name}</div>
                          <div style={{ display: "flex", gap: 5 }}>
                            <button onClick={() => openEditTable(t)} style={{ padding: "4px 8px", background: "#eff6ff", border: "none", borderRadius: 5, color: "#3b82f6", cursor: "pointer", fontSize: 11 }}>✏️</button>
                            <button onClick={() => delTable(t.id)} style={{ padding: "4px 8px", background: "#fef2f2", border: "none", borderRadius: 5, color: "#ef4444", cursor: "pointer", fontSize: 11 }}>🗑️</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tax / Service Charge Tab */}
            {settingsTab === "tax" && (
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 20 }}>💰 Tax / Service Charge</div>
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, maxWidth: 480 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid #f1f5f9" }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>Aktifkan Tax / Caj</div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Bila dimatikan, tiada tax dikenakan dan tak keluar kat resit</div>
                    </div>
                    <button onClick={() => setTaxConfig(c => ({ ...c, enabled: !c.enabled }))}
                      style={{ width: 52, height: 28, borderRadius: 14, border: "none", cursor: "pointer", background: taxConfig.enabled ? "#22c55e" : "#e2e8f0", position: "relative", transition: "background .2s" }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: taxConfig.enabled ? 27 : 3, transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.2)" }} />
                    </button>
                  </div>
                  <div style={{ marginBottom: 16, opacity: taxConfig.enabled ? 1 : 0.4 }}>
                    <label style={{ fontSize: 13, color: "#475569", marginBottom: 6, display: "block", fontWeight: 600 }}>Nama Caj (contoh: SST, GST, Service Charge)</label>
                    <input value={taxConfig.label} onChange={e => setTaxConfig(c => ({ ...c, label: e.target.value }))} disabled={!taxConfig.enabled} placeholder="SST"
                      style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fff", color: "#1e293b" }} />
                  </div>
                  <div style={{ marginBottom: 20, opacity: taxConfig.enabled ? 1 : 0.4 }}>
                    <label style={{ fontSize: 13, color: "#475569", marginBottom: 6, display: "block", fontWeight: 600 }}>Kadar (%)</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <input type="number" value={taxConfig.rate} onChange={e => setTaxConfig(c => ({ ...c, rate: parseFloat(e.target.value) || 0 }))} disabled={!taxConfig.enabled} min="0" max="100" step="0.5"
                        style={{ width: 100, border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px", fontSize: 16, fontWeight: 700, outline: "none", background: "#fff", color: "#1e293b" }} />
                      <span style={{ fontSize: 16, color: "#1e293b", fontWeight: 600 }}>%</span>
                      <div style={{ display: "flex", gap: 5 }}>
                        {[6, 8, 10].map(r => (
                          <button key={r} onClick={() => setTaxConfig(c => ({ ...c, rate: r }))} disabled={!taxConfig.enabled}
                            style={{ padding: "6px 12px", background: taxConfig.rate === r ? "#3b82f6" : "#f1f5f9", border: "1px solid", borderColor: taxConfig.rate === r ? "#3b82f6" : "#e2e8f0", borderRadius: 6, color: taxConfig.rate === r ? "#fff" : "#1e293b", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>{r}%</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>PREVIEW (contoh: RM 10.00)</div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#1e293b", marginBottom: 3 }}><span>Subtotal</span><span>RM 10.00</span></div>
                    {taxConfig.enabled && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748b", marginBottom: 3 }}><span>{taxConfig.label || "Tax"} ({taxConfig.rate}%)</span><span>{formatRM(10 * taxConfig.rate / 100)}</span></div>}
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700, color: "#1e293b", borderTop: "1px solid #e2e8f0", paddingTop: 8, marginTop: 5 }}><span>JUMLAH</span><span>{taxConfig.enabled ? formatRM(10 + 10 * taxConfig.rate / 100) : "RM 10.00"}</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* Receipt Tab */}
            {settingsTab === "receipt" && (
              <div style={{ background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>🧾 Tetapan Resit</div>
                <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                  <label style={S.lbl}>🔔 Volume Alert Order QR</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12 }}>🔈</span>
                    <input type="range" min="0" max="1" step="0.1" value={alertVolume} onChange={e => setAlertVolume(parseFloat(e.target.value))} style={{ flex: 1 }} />
                    <span style={{ fontSize: 12 }}>🔊</span>
                    <span style={{ fontSize: 12, fontWeight: 700, minWidth: 32 }}>{Math.round(alertVolume * 100)}%</span>
                    <button onClick={() => playAlertSound(alertVolume)} style={{ padding: "4px 10px", background: "#3b82f6", border: "none", borderRadius: 6, color: "#fff", fontSize: 11, cursor: "pointer" }}>Test</button>
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Bunyi ni akan berbunyi bila order QR baru masuk.</div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={S.lbl}>Nama Kedai</label>
                  <input value={receiptConfig.shopName} onChange={e => setReceiptConfig(c => ({ ...c, shopName: e.target.value }))} placeholder="WARUNG DIGITAL" style={S.inp} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={S.lbl}>No. Telefon</label>
                  <input value={receiptConfig.phone} onChange={e => setReceiptConfig(c => ({ ...c, phone: e.target.value }))} placeholder="03-1234 5678" style={S.inp} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={S.lbl}>Alamat (optional)</label>
                  <input value={receiptConfig.address} onChange={e => setReceiptConfig(c => ({ ...c, address: e.target.value }))} placeholder="No 1, Jalan Warung, KL" style={S.inp} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={S.lbl}>Footer Resit</label>
                  <input value={receiptConfig.footer} onChange={e => setReceiptConfig(c => ({ ...c, footer: e.target.value }))} placeholder="Terima Kasih! Sila Datang Lagi" style={S.inp} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={S.lbl}>Logo Kedai (akan print atas resit)</label>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {receiptConfig.logoBase64 ? (
                      <div style={{ position: "relative", display: "inline-block" }}>
                        <img src={receiptConfig.logoBase64} alt="Logo" style={{ width: 80, height: 80, objectFit: "contain", borderRadius: 8, border: "1px solid #e2e8f0" }} />
                        <button onClick={() => setReceiptConfig(c => ({ ...c, logoBase64: "" }))} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#ef4444", border: "none", color: "#fff", fontSize: 11, cursor: "pointer", fontWeight: 700 }}>✕</button>
                      </div>
                    ) : (
                      <div style={{ width: 80, height: 80, borderRadius: 8, border: "2px dashed #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 11 }}>Tiada Logo</div>
                    )}
                    <label style={{ padding: "8px 14px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#1e293b" }}>
                      📁 Upload Logo
                      <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = ev => setReceiptConfig(c => ({ ...c, logoBase64: ev.target.result }));
                        reader.readAsDataURL(file);
                      }} />
                    </label>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>PNG/JPG, max 200KB. Logo akan print sebagai imej (bitmap) atas resit, di tengah header sebelum nama kedai.</div>
                  </div>
                </div>
                {/* Preview */}
                <div style={{ background: "#f8fafc", borderRadius: 8, padding: 14, border: "1px solid #e2e8f0", fontFamily: "monospace", fontSize: 11, whiteSpace: "pre", lineHeight: 1.6, color: "#1e293b" }}>
                  {[
                    receiptConfig.shopName || "WARUNG DIGITAL",
                    receiptConfig.phone || "",
                    receiptConfig.address || "",
                    "--------------------------------",
                    "No: #1234  23/5/2026, 3:00:00 PTG",
                    "Meja: Meja 1",
                    "Jenis: Dine In",
                    "--------------------------------",
                    "Nasi Lemak x1              RM5.50",
                    "Teh Tarik x1               RM2.50",
                    "--------------------------------",
                    "Subtotal               RM 8.00",
                    "SST (6%)               RM 0.48",
                    "JUMLAH                 RM 8.48",
                    "--------------------------------",
                    receiptConfig.footer || "Terima Kasih! Sila Datang Lagi",
                  ].filter(Boolean).join("\n")}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* ══ MODALS ══ */}

      {/* Item Modal */}
      {itemModal && (
        <div style={S.modal} onClick={() => setItemModal(false)}>
          <div style={S.mbox} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#1e293b" }}>{editItem ? "✏️ Edit Item" : "➕ Tambah Item"}</div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.lbl}>Emoji</label>
              <button onClick={() => setEmojiPick(!emojiPick)} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 14px", fontSize: 22, cursor: "pointer" }}>{itemF.emoji}</button>
              {emojiPick && <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 8, marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4, maxHeight: 120, overflowY: "auto" }}>{EMOJIS.map(e => <button key={e} onClick={() => { setItemF(f => ({ ...f, emoji: e })); setEmojiPick(false); }} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>{e}</button>)}</div>}
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.lbl}>Gambar Makanan (optional — kalau ada, gambar ni akan paparkan dalam grid menu, ganti emoji)</label>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {itemF.imageBase64 ? (
                  <div style={{ position: "relative", display: "inline-block" }}>
                    <img src={itemF.imageBase64} alt={itemF.name} style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, border: "1px solid #e2e8f0" }} />
                    <button onClick={() => setItemF(f => ({ ...f, imageBase64: "" }))} style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: "#ef4444", border: "none", color: "#fff", fontSize: 10, cursor: "pointer", fontWeight: 700 }}>✕</button>
                  </div>
                ) : (
                  <div style={{ width: 64, height: 64, borderRadius: 8, border: "2px dashed #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 10, textAlign: "center" }}>Tiada Gambar</div>
                )}
                <label style={{ padding: "8px 14px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#1e293b" }}>
                  📁 Upload Gambar
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = ev => setItemF(f => ({ ...f, imageBase64: ev.target.result }));
                    reader.readAsDataURL(file);
                  }} />
                </label>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}><label style={S.lbl}>Nama Item</label><input value={itemF.name} onChange={e => setItemF(f => ({ ...f, name: e.target.value }))} placeholder="Contoh: Nasi Lemak" style={S.inp} /></div>
            <div style={{ marginBottom: 12 }}><label style={S.lbl}>Harga (RM)</label><input type="number" value={itemF.price} onChange={e => setItemF(f => ({ ...f, price: e.target.value }))} placeholder="0.00" style={S.inp} /></div>
            <div style={{ marginBottom: 12 }}><label style={S.lbl}>Kategori</label><select value={itemF.categoryId} onChange={e => setItemF(f => ({ ...f, categoryId: e.target.value, subcategoryId: categories.find(c => c.id === e.target.value)?.subcategories[0]?.id || "" }))} style={S.sel}>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div style={{ marginBottom: 12 }}><label style={S.lbl}>Sub-kategori</label><select value={itemF.subcategoryId} onChange={e => setItemF(f => ({ ...f, subcategoryId: e.target.value }))} style={S.sel}><option value="">-- Tiada --</option>{itemSubs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div style={{ marginBottom: 18 }}><label style={S.lbl}>🖨️ Print ke Printer</label><select value={itemF.printerId} onChange={e => setItemF(f => ({ ...f, printerId: e.target.value }))} style={S.sel}><option value="">-- Ikut cashier --</option>{printers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.location})</option>)}</select></div>
            {/* Variants */}
            <div style={{ marginBottom: 18 }}>
              <label style={S.lbl}>🔀 Varian (optional) — kalau ada, wajib pilih masa order</label>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                {(itemF.variants || []).length === 0 && <div style={{ fontSize: 12, color: "#94a3b8" }}>Tiada varian — item terus masuk cart</div>}
                <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                  {(itemF.variants || []).length > 0 && <>
                    <div style={{ flex: 2, fontSize: 10, color: "#64748b", fontWeight: 600, paddingLeft: 2 }}>Nama Varian</div>
                    <div style={{ flex: 1, fontSize: 10, color: "#64748b", fontWeight: 600, paddingLeft: 2 }}>+ Harga (RM)</div>
                    <div style={{ width: 24 }}></div>
                  </>}
                </div>
                {(itemF.variants || []).map((v, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                    <input value={v.name} onChange={e => setItemF(f => ({ ...f, variants: f.variants.map((x, i) => i === idx ? { ...x, name: e.target.value } : x) }))} placeholder="cth: Ais, Panas, Pedas" style={{ ...S.inp, flex: 2, padding: "6px 10px", fontSize: 12, marginBottom: 0 }} />
                    <input type="number" value={v.extraPrice ?? 0} onChange={e => setItemF(f => ({ ...f, variants: f.variants.map((x, i) => i === idx ? { ...x, extraPrice: parseFloat(e.target.value) || 0 } : x) }))} placeholder="0" style={{ ...S.inp, flex: 1, padding: "6px 10px", fontSize: 12, marginBottom: 0 }} />
                    <button onClick={() => setItemF(f => ({ ...f, variants: f.variants.filter((_, i) => i !== idx) }))} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16, width: 24 }}>✕</button>
                  </div>
                ))}
                <button onClick={() => setItemF(f => ({ ...f, variants: [...(f.variants || []), { name: "", extraPrice: 0 }] }))} style={{ padding: "5px 12px", background: "#f1f5f9", border: "1px dashed #94a3b8", borderRadius: 6, fontSize: 12, cursor: "pointer", color: "#64748b", fontWeight: 600, marginTop: 4 }}>+ Tambah Varian</button>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.lbl}>🍟 Add-On (optional) — pilihan tambahan yang customer/cashier boleh pilih masa order, ada caj tambahan</label>
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                {(itemF.addons || []).length === 0 && <div style={{ fontSize: 12, color: "#94a3b8" }}>Tiada add-on</div>}
                {(itemF.addons || []).map((a, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                    <input value={a.name} onChange={e => setItemF(f => ({ ...f, addons: f.addons.map((x, i) => i === idx ? { ...x, name: e.target.value } : x) }))} placeholder="Nama add-on (cth: Extra Nasi)" style={{ ...S.inp, flex: 2, marginBottom: 0, fontSize: 12, padding: "7px 10px" }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 11, color: "#64748b" }}>+RM</span>
                      <input type="number" min="0" step="0.50" value={a.price} onChange={e => setItemF(f => ({ ...f, addons: f.addons.map((x, i) => i === idx ? { ...x, price: parseFloat(e.target.value) || 0 } : x) }))} style={{ ...S.inp, width: 70, marginBottom: 0, fontSize: 12, padding: "7px 8px" }} />
                    </div>
                    <button onClick={() => setItemF(f => ({ ...f, addons: f.addons.filter((_, i) => i !== idx) }))} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16 }}>✕</button>
                  </div>
                ))}
                <button onClick={() => setItemF(f => ({ ...f, addons: [...(f.addons || []), { id: `ao_${Date.now()}`, name: "", price: 0 }] }))} style={{ padding: "5px 12px", background: "#f0fdf4", border: "1px dashed #22c55e", borderRadius: 6, fontSize: 12, cursor: "pointer", color: "#166534", fontWeight: 600, marginTop: 4 }}>+ Tambah Add-On</button>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.lbl}>🎁 Item Tambahan (optional) — sentiasa sertakan sekali bila item ni di-order (cth: air free dalam set)</label>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 10, marginBottom: 8, maxHeight: 180, overflowY: "auto" }}>
                {(itemF.items || []).length === 0 && (itemF.customItems || []).length === 0 && <div style={{ fontSize: 12, color: "#94a3b8" }}>Tiada item tambahan</div>}
                {(itemF.items || []).map(ci => {
                  const p = products.find(x => x.id === ci.productId);
                  return p ? (
                    <div key={ci.productId} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, background: "#fff", borderRadius: 8, padding: "6px 8px", border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: 16 }}>{p.emoji}</span>
                      <span style={{ fontSize: 13, flex: 1, fontWeight: 600 }}>{p.name}</span>
                      <span style={{ fontSize: 11, color: "#64748b" }}>×{ci.qty}</span>
                      <select value={ci.printerId || ""} onChange={e => setItemF(f => ({ ...f, items: f.items.map(i => i.productId === ci.productId ? { ...i, printerId: e.target.value } : i) }))}
                        style={{ fontSize: 11, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, color: "#1e293b", padding: "3px 5px", maxWidth: 110 }}>
                        <option value="">🖨️ Printer</option>
                        {printers.map(pr => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
                      </select>
                      <button onClick={() => removeItemExtra(ci.productId)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14 }}>✕</button>
                    </div>
                  ) : null;
                })}
                {(itemF.customItems || []).map(ci => (
                  <div key={ci.customId} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, background: "#fff7ed", borderRadius: 8, padding: "6px 8px", border: "1px solid #f59e0b" }}>
                    <span style={{ fontSize: 16 }}>✏️</span>
                    <span style={{ fontSize: 13, flex: 1, fontWeight: 600 }}>{ci.name}</span>
                    <span style={{ fontSize: 10, color: "#f59e0b", background: "#fff", borderRadius: 4, padding: "1px 5px", border: "1px solid #f59e0b" }}>Custom</span>
                    <span style={{ fontSize: 11, color: "#64748b" }}>×{ci.qty}</span>
                    <select value={ci.printerId || ""} onChange={e => setItemF(f => ({ ...f, customItems: (f.customItems || []).map(i => i.customId === ci.customId ? { ...i, printerId: e.target.value } : i) }))}
                      style={{ fontSize: 11, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, color: "#1e293b", padding: "3px 5px", maxWidth: 110 }}>
                      <option value="">🖨️ Printer</option>
                      {printers.map(pr => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
                    </select>
                    <button onClick={() => removeCustomItemExtra(ci.customId)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14 }}>✕</button>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6, fontWeight: 600 }}>Tambah item (pilih dari dropdown):</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                <select value={itemDropdownVal} onChange={e => { const val = e.target.value; if (val) { addItemExtra(val); setItemDropdownVal(""); } else { setItemDropdownVal(""); } }}
                  style={{ ...S.sel, flex: 1, fontSize: 13 }}>
                  <option value="">— Pilih item untuk tambah —</option>
                  {categories.map(cat => (
                    <optgroup key={cat.id} label={cat.name}>
                      {products.filter(p => p.categoryId === cat.id).map(p => {
                        const added = (itemF.items || []).find(i => i.productId === p.id);
                        return <option key={p.id} value={p.id}>{p.emoji} {p.name} {added ? `(✓${added.qty})` : ""}</option>;
                      })}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div style={{ borderTop: "1px dashed #e2e8f0", paddingTop: 8 }}>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6, fontWeight: 600 }}>➕ Tambah item custom (khusus untuk item ini):</div>
                {!showItemCustomItemForm ? (
                  <button onClick={() => setShowItemCustomItemForm(true)} style={{ padding: "6px 14px", background: "#fff7ed", border: "1px dashed #f59e0b", borderRadius: 8, color: "#92400e", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✏️ + Item Custom</button>
                ) : (
                  <div style={{ background: "#fff7ed", border: "1px solid #f59e0b", borderRadius: 8, padding: 10 }}>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ ...S.lbl, fontSize: 11 }}>Nama Item</label>
                      <input value={itemCustomItemF.name} onChange={e => setItemCustomItemF(f => ({ ...f, name: e.target.value }))} placeholder="cth: Sos Cili Extra, Air Sirap..." style={{ ...S.inp, fontSize: 12, padding: "7px 10px" }} />
                    </div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ ...S.lbl, fontSize: 11 }}>Qty</label>
                        <input type="number" min="1" value={itemCustomItemF.qty} onChange={e => setItemCustomItemF(f => ({ ...f, qty: e.target.value }))} style={{ ...S.inp, fontSize: 12, padding: "7px 10px" }} />
                      </div>
                      <div style={{ flex: 2 }}>
                        <label style={{ ...S.lbl, fontSize: 11 }}>Printer</label>
                        <select value={itemCustomItemF.printerId} onChange={e => setItemCustomItemF(f => ({ ...f, printerId: e.target.value }))} style={{ ...S.sel, fontSize: 12, padding: "7px 10px" }}>
                          <option value="">— Pilih Printer —</option>
                          {printers.map(pr => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => { setShowItemCustomItemForm(false); setItemCustomItemF({ name: "", printerId: "", qty: "1" }); }} style={{ flex: 1, padding: "7px 0", background: "#f1f5f9", border: "none", borderRadius: 6, color: "#64748b", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Batal</button>
                      <button onClick={addCustomItemExtra} style={{ flex: 2, padding: "7px 0", background: "#f59e0b", border: "none", borderRadius: 6, color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 700 }}>✅ Tambah</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setItemModal(false)} style={{ flex: 1, padding: 12, background: "#f1f5f9", border: "none", borderRadius: 8, color: "#64748b", cursor: "pointer", fontWeight: 600 }}>Batal</button>
              <button onClick={saveItem} style={{ flex: 2, padding: 12, background: "#3b82f6", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer" }}>Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Variant Selection Modal */}
      {variantModal && variantItem && (
        <div style={S.modal} onClick={() => setVariantModal(false)}>
          <div style={{ ...S.mbox, maxWidth: 340 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 18, marginBottom: 4, textAlign: "center" }}>{variantItem.emoji}</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: "#1e293b", textAlign: "center" }}>{variantItem.name}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16, textAlign: "center" }}>Pilih varian:</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {variantItem.variants.map((v, idx) => (
                <button key={idx} onClick={() => setSelectedVariant(v)}
                  style={{ padding: "12px 16px", background: selectedVariant?.name === v.name ? "#eff6ff" : "#f8fafc", border: `2px solid ${selectedVariant?.name === v.name ? "#3b82f6" : "#e2e8f0"}`, borderRadius: 10, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600, color: "#1e293b", fontSize: 14 }}>{v.name}</span>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, color: "#3b82f6", fontSize: 14 }}>{formatRM(variantItem.price + (v.extraPrice || 0))}</div>
                    {(v.extraPrice || 0) > 0 && <div style={{ fontSize: 10, color: "#94a3b8" }}>+{formatRM(v.extraPrice)}</div>}
                    {(v.extraPrice || 0) === 0 && <div style={{ fontSize: 10, color: "#94a3b8" }}>tiada tambahan</div>}
                  </div>
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setVariantModal(false)} style={{ flex: 1, padding: 10, background: "#f1f5f9", border: "none", borderRadius: 8, color: "#64748b", cursor: "pointer", fontWeight: 600 }}>Batal</button>
              <button onClick={() => {
                if (!selectedVariant) return;
                if (variantItem.addons && variantItem.addons.length > 0) {
                  setAddonItem(variantItem); setAddonVariantOpt(selectedVariant); setSelectedAddons({});
                  setVariantModal(false); setVariantItem(null); setAddonModal(true);
                } else {
                  addCartDirect(variantItem, false, selectedVariant); setVariantModal(false); setVariantItem(null);
                }
              }}
                disabled={!selectedVariant}
                style={{ flex: 2, padding: 10, background: selectedVariant ? "#3b82f6" : "#e2e8f0", border: "none", borderRadius: 8, color: selectedVariant ? "#fff" : "#94a3b8", fontWeight: 700, cursor: selectedVariant ? "pointer" : "not-allowed", fontSize: 14 }}>
                ✅ Tambah ke Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Open Shift Modal ── */}
      {shiftModal && (
        <div style={S.modal} onClick={() => setShiftModal(false)}>
          <div style={{ ...S.mbox, maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 20, textAlign: "center", marginBottom: 4 }}>▶️</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#1e293b", textAlign: "center", marginBottom: 16 }}>Buka Shift Baru</div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.lbl}>Nama Shift / Petugas</label>
              <input value={shiftF.name} onChange={e => setShiftF(f => ({ ...f, name: e.target.value }))} placeholder="cth: Pagi - Ali, Shift 1" style={S.inp} autoFocus />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={S.lbl}>Duit Float (RM) — duit dalam drawer masa buka</label>
              <input type="number" value={shiftF.float} onChange={e => setShiftF(f => ({ ...f, float: e.target.value }))} placeholder="0.00" style={S.inp} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShiftModal(false)} style={{ flex: 1, padding: 12, background: "#f1f5f9", border: "none", borderRadius: 8, color: "#64748b", fontWeight: 600, cursor: "pointer" }}>Batal</button>
              <button onClick={openShift} style={{ flex: 2, padding: 12, background: "#22c55e", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>▶ Buka Shift</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Close Shift Modal ── */}
      {closeShiftModal && currentShift && (
        <div style={S.modal} onClick={() => setCloseShiftModal(false)}>
          <div style={{ ...S.mbox, maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 20, textAlign: "center", marginBottom: 4 }}>⏹️</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#1e293b", textAlign: "center", marginBottom: 4 }}>Tutup Shift</div>
            <div style={{ fontSize: 13, color: "#64748b", textAlign: "center", marginBottom: 16 }}>{currentShift.name}</div>
            {(() => {
              const shiftOrders = salesHistory.filter(o => currentShift.orders.includes(o.num));
              const cashSales = shiftOrders.filter(o => o.method === "cash").reduce((s, o) => s + o.total, 0);
              const qrSales = shiftOrders.filter(o => o.method === "qr").reduce((s, o) => s + o.total, 0);
              const cardSales = shiftOrders.filter(o => o.method === "card").reduce((s, o) => s + o.total, 0);
              const expectedCash = currentShift.openFloat + cashSales;
              const actual = parseFloat(closeF.actualCash) || 0;
              const diff = actual - expectedCash;
              return (
                <div>
                  <div style={{ background: "#f8fafc", borderRadius: 8, padding: 12, marginBottom: 14, fontSize: 13 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ color: "#64748b" }}>Bil. Order</span><span style={{ fontWeight: 600 }}>{shiftOrders.length}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ color: "#64748b" }}>Jualan Cash</span><span style={{ fontWeight: 600, color: "#22c55e" }}>{formatRM(cashSales)}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ color: "#64748b" }}>Jualan QR</span><span style={{ fontWeight: 600, color: "#3b82f6" }}>{formatRM(qrSales)}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ color: "#64748b" }}>Jualan Kad</span><span style={{ fontWeight: 600, color: "#8b5cf6" }}>{formatRM(cardSales)}</span></div>
                    <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 6, marginTop: 4, display: "flex", justifyContent: "space-between" }}><span style={{ fontWeight: 700 }}>Jumlah Jualan</span><span style={{ fontWeight: 700 }}>{formatRM(cashSales + qrSales + cardSales)}</span></div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={S.lbl}>Duit Cash Sebenar dalam Drawer (RM)</label>
                    <input type="number" value={closeF.actualCash} onChange={e => setCloseF(f => ({ ...f, actualCash: e.target.value }))} placeholder={formatRM(expectedCash)} style={S.inp} autoFocus />
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Dijangka: {formatRM(expectedCash)} (Float {formatRM(currentShift.openFloat)} + Cash {formatRM(cashSales)})</div>
                  </div>
                  {closeF.actualCash && (
                    <div style={{ padding: "8px 12px", borderRadius: 8, marginBottom: 12, background: diff === 0 ? "#f0fdf4" : diff > 0 ? "#eff6ff" : "#fff7ed", border: `1px solid ${diff === 0 ? "#86efac" : diff > 0 ? "#93c5fd" : "#fcd34d"}` }}>
                      <span style={{ fontWeight: 700, color: diff === 0 ? "#16a34a" : diff > 0 ? "#1d4ed8" : "#b45309" }}>
                        {diff === 0 ? "✅ Tepat!" : diff > 0 ? `↑ Lebih ${formatRM(diff)}` : `↓ Kurang ${formatRM(Math.abs(diff))}`}
                      </span>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setCloseShiftModal(false)} style={{ flex: 1, padding: 12, background: "#f1f5f9", border: "none", borderRadius: 8, color: "#64748b", fontWeight: 600, cursor: "pointer" }}>Batal</button>
                    <button onClick={closeShift} style={{ flex: 2, padding: 12, background: "#ef4444", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>⏹ Tutup & Print Report</button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Import Menu Modal ── */}
      {importModal && (
        <div style={S.modal} onClick={() => setImportModal(false)}>
          <div style={{ ...S.mbox, maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>📥 Import Menu dari CSV</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>Upload file CSV dengan format yang betul. Item yang nama sama akan dilangkau.</div>
            <div style={{ background: "#f8fafc", borderRadius: 8, padding: 12, marginBottom: 14, fontSize: 11, fontFamily: "monospace", color: "#475569" }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Format CSV:</div>
              <div>Nama, Harga, Kategori, Sub-Kategori, Emoji, Printer ID</div>
              <div style={{ color: "#94a3b8", marginTop: 4 }}>* Kategori mesti sama dengan yang ada dalam app</div>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <button onClick={downloadMenuTemplate} style={{ flex: 1, padding: "10px 0", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 8, color: "#475569", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>⬇️ Download Template</button>
              <button onClick={exportMenuCSV} style={{ flex: 1, padding: "10px 0", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 8, color: "#475569", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>📤 Export Menu Semasa</button>
            </div>
            <label style={{ display: "block", padding: "14px 0", background: "#eff6ff", border: "2px dashed #93c5fd", borderRadius: 8, textAlign: "center", cursor: "pointer", color: "#1d4ed8", fontWeight: 700, fontSize: 14 }}>
              📁 Pilih File CSV untuk Import
              <input type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={e => importMenuCSV(e.target.files?.[0])} />
            </label>
            <button onClick={() => setImportModal(false)} style={{ width: "100%", marginTop: 10, padding: 10, background: "#f1f5f9", border: "none", borderRadius: 8, color: "#64748b", cursor: "pointer", fontWeight: 600 }}>Tutup</button>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {catModal && (
        <div style={S.modal} onClick={() => setCatModal(false)}>
          <div style={S.mbox} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{editCat ? "✏️ Edit Kategori" : "➕ Tambah Kategori"}</div>
            <div style={{ marginBottom: 18 }}><label style={S.lbl}>Nama</label><input value={catF.name} onChange={e => setCatF({ name: e.target.value })} placeholder="Contoh: Makanan" style={S.inp} /></div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setCatModal(false)} style={{ flex: 1, padding: 12, background: "#f1f5f9", border: "none", borderRadius: 8, color: "#64748b", cursor: "pointer", fontWeight: 600 }}>Batal</button>
              <button onClick={saveCat} style={{ flex: 2, padding: 12, background: "#3b82f6", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer" }}>Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-category Modal */}
      {subModal && (
        <div style={S.modal} onClick={() => setSubModal(false)}>
          <div style={S.mbox} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{editSub ? "✏️ Edit Sub-kategori" : "➕ Tambah Sub-kategori"}</div>
            <div style={{ marginBottom: 8 }}><label style={S.lbl}>Dalam Kategori</label><div style={{ fontWeight: 700, color: "#3b82f6" }}>{categories.find(c => c.id === subF.catId)?.name}</div></div>
            <div style={{ marginBottom: 18 }}><label style={S.lbl}>Nama</label><input value={subF.name} onChange={e => setSubF(f => ({ ...f, name: e.target.value }))} placeholder="Contoh: Nasi" style={S.inp} /></div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setSubModal(false)} style={{ flex: 1, padding: 12, background: "#f1f5f9", border: "none", borderRadius: 8, color: "#64748b", cursor: "pointer", fontWeight: 600 }}>Batal</button>
              <button onClick={saveSub} style={{ flex: 2, padding: 12, background: "#3b82f6", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer" }}>Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Printer Modal */}
      {printerModal && (
        <div style={S.modal} onClick={() => setPrinterModal(false)}>
          <div style={S.mbox} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{editPrinter ? "✏️ Edit Printer" : "➕ Tambah Printer"}</div>
            <div style={{ marginBottom: 12 }}><label style={S.lbl}>Nama Printer</label><input value={pF.name} onChange={e => setPF(f => ({ ...f, name: e.target.value }))} placeholder="Contoh: Printer Dapur" style={S.inp} /></div>
            <div style={{ marginBottom: 12 }}><label style={S.lbl}>Lokasi</label><input value={pF.location} onChange={e => setPF(f => ({ ...f, location: e.target.value }))} placeholder="Dapur / Bar / Kaunter" style={S.inp} /></div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.lbl}>Role Printer</label>
              <select value={pF.role} onChange={e => setPF(f => ({ ...f, role: e.target.value }))} style={S.sel}>
                <option value="cashier">💰 Cashier — Print resit penuh masa bayar</option>
                <option value="kitchen">🍳 Kitchen — Print slip order masa create order</option>
                <option value="bar">🥤 Bar — Print slip order masa create order</option>
                <option value="custom">⚙️ Custom — Ikut assignment item</option>
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.lbl}>Saiz Kertas Printer</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[["58", "58mm (Standard)"], ["80", "80mm (Lebar)"]].map(([w, l]) => (
                  <button key={w} onClick={() => setPF(f => ({ ...f, printerWidth: w }))} style={{ flex: 1, padding: 10, border: "2px solid", borderRadius: 8, cursor: "pointer", background: (pF.printerWidth || "58") === w ? "#3b82f6" : "#f8fafc", color: (pF.printerWidth || "58") === w ? "#fff" : "#64748b", borderColor: (pF.printerWidth || "58") === w ? "#3b82f6" : "#e2e8f0", fontWeight: 600, fontSize: 13 }}>{l}</button>
                ))}
              </div>
            </div>
            {pF.role === "cashier" && (
              <div style={{ marginBottom: 12 }}>
                <label style={S.lbl}>🗄️ Laci Duit (Cash Drawer)</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setPF(f => ({ ...f, cashDrawer: false }))} style={{ flex: 1, padding: 10, border: "2px solid", borderRadius: 8, cursor: "pointer", background: !pF.cashDrawer ? "#3b82f6" : "#f8fafc", color: !pF.cashDrawer ? "#fff" : "#64748b", borderColor: !pF.cashDrawer ? "#3b82f6" : "#e2e8f0", fontWeight: 600, fontSize: 13 }}>Tiada</button>
                  <button onClick={() => setPF(f => ({ ...f, cashDrawer: true }))} style={{ flex: 1, padding: 10, border: "2px solid", borderRadius: 8, cursor: "pointer", background: pF.cashDrawer ? "#3b82f6" : "#f8fafc", color: pF.cashDrawer ? "#fff" : "#64748b", borderColor: pF.cashDrawer ? "#3b82f6" : "#e2e8f0", fontWeight: 600, fontSize: 13 }}>Buka Auto (Cash)</button>
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Kalau "Buka Auto" dipilih, laci akan terbuka sendiri lepas bayaran TUNAI dicetak melalui printer ni (laci kena disambung ke port RJ11 printer).</div>
              </div>
            )}
            {pF.role !== "cashier" && (
              <div style={{ marginBottom: 12 }}>
                <label style={S.lbl}>Kandungan Slip</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setPF(f => ({ ...f, showPrice: false }))} style={{ flex: 1, padding: 10, border: "2px solid", borderRadius: 8, cursor: "pointer", background: !pF.showPrice ? "#3b82f6" : "#f8fafc", color: !pF.showPrice ? "#fff" : "#64748b", borderColor: !pF.showPrice ? "#3b82f6" : "#e2e8f0", fontWeight: 600, fontSize: 13 }}>📋 Order Only</button>
                  <button onClick={() => setPF(f => ({ ...f, showPrice: true }))} style={{ flex: 1, padding: 10, border: "2px solid", borderRadius: 8, cursor: "pointer", background: pF.showPrice ? "#3b82f6" : "#f8fafc", color: pF.showPrice ? "#fff" : "#64748b", borderColor: pF.showPrice ? "#3b82f6" : "#e2e8f0", fontWeight: 600, fontSize: 13 }}>💰 Order + Harga</button>
                </div>
              </div>
            )}
            <div style={{ marginBottom: 12 }}>
              <label style={S.lbl}>Jenis Sambungan</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[["bluetooth", "📶 Bluetooth"], ["wifi", "📡 WiFi"]].map(([t, l]) => (
                  <button key={t} onClick={() => setPF(f => ({ ...f, type: t }))} style={{ flex: 1, padding: 10, border: "2px solid", borderRadius: 8, cursor: "pointer", background: pF.type === t ? "#3b82f6" : "#f8fafc", color: pF.type === t ? "#fff" : "#64748b", borderColor: pF.type === t ? "#3b82f6" : "#e2e8f0", fontWeight: 600, fontSize: 13 }}>{l}</button>
                ))}
              </div>
            </div>
            {pF.type === "wifi" && <>
              <div style={{ marginBottom: 12 }}><label style={S.lbl}>IP Address</label><input value={pF.ip} onChange={e => setPF(f => ({ ...f, ip: e.target.value }))} placeholder="192.168.1.100" style={S.inp} /></div>
              <div style={{ marginBottom: 14 }}><label style={S.lbl}>Port (default: 9100)</label><input value={pF.port} onChange={e => setPF(f => ({ ...f, port: e.target.value }))} placeholder="9100" style={S.inp} /></div>
            </>}
            {pF.type === "bluetooth" && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ marginBottom: 10 }}>
                  <label style={S.lbl}>Jenis Bluetooth</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setPF(f => ({ ...f, btType: "classic" }))} style={{ flex: 1, padding: "10px 8px", border: "2px solid", borderRadius: 8, cursor: "pointer", background: (pF.btType || "classic") === "classic" ? "#3b82f6" : "#f8fafc", color: (pF.btType || "classic") === "classic" ? "#fff" : "#64748b", borderColor: (pF.btType || "classic") === "classic" ? "#3b82f6" : "#e2e8f0", fontWeight: 600, fontSize: 12 }}>
                      🖨️ Classic<br /><span style={{ fontSize: 10, fontWeight: 400 }}>MPT-11, Zywell, Epson</span>
                    </button>
                    <button onClick={() => setPF(f => ({ ...f, btType: "ble" }))} style={{ flex: 1, padding: "10px 8px", border: "2px solid", borderRadius: 8, cursor: "pointer", background: pF.btType === "ble" ? "#3b82f6" : "#f8fafc", color: pF.btType === "ble" ? "#fff" : "#64748b", borderColor: pF.btType === "ble" ? "#3b82f6" : "#e2e8f0", fontWeight: 600, fontSize: 12 }}>
                      📶 BLE<br /><span style={{ fontSize: 10, fontWeight: 400 }}>Printer BLE baru</span>
                    </button>
                  </div>
                </div>
                <label style={S.lbl}>Device ID / MAC Address</label>
                <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                  <input value={pF.deviceId} onChange={e => setPF(f => ({ ...f, deviceId: e.target.value }))} placeholder="AA:BB:CC:DD:EE:FF" style={{ ...S.inp, flex: 1 }} />
                  <button onClick={doScan} disabled={scanning} style={{ padding: "10px 12px", background: "#3b82f6", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>{scanning ? "⏳" : "📡 Scan"}</button>
                </div>
                {btDevs.length > 0 && (
                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 8, maxHeight: 110, overflowY: "auto" }}>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Tap untuk pilih:</div>
                    {btDevs.map(d => <button key={d.deviceId} onClick={() => setPF(f => ({ ...f, deviceId: d.deviceId }))} style={{ width: "100%", textAlign: "left", background: pF.deviceId === d.deviceId ? "#eff6ff" : "none", border: "none", borderRadius: 6, padding: "5px 8px", color: "#1e293b", cursor: "pointer", fontSize: 12, marginBottom: 2 }}>📶 {d.name} <span style={{ color: "#94a3b8" }}>({d.deviceId})</span></button>)}
                  </div>
                )}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setPrinterModal(false)} style={{ flex: 1, padding: 12, background: "#f1f5f9", border: "none", borderRadius: 8, color: "#64748b", cursor: "pointer", fontWeight: 600 }}>Batal</button>
              <button onClick={savePrinter} style={{ flex: 2, padding: 12, background: "#3b82f6", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer" }}>Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Combo Modal */}
      {comboModal && (
        <div style={S.modal} onClick={() => setComboModal(false)}>
          <div style={S.mbox} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{editCombo ? "✏️ Edit Set/Combo" : "➕ Tambah Set/Combo"}</div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.lbl}>Emoji</label>
              <button onClick={() => setEmojiPickCombo(!emojiPickCombo)} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "7px 14px", fontSize: 22, cursor: "pointer" }}>{comboF.emoji}</button>
              {emojiPickCombo && <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 8, marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4, maxHeight: 100, overflowY: "auto" }}>{EMOJIS.map(e => <button key={e} onClick={() => { setComboF(f => ({ ...f, emoji: e })); setEmojiPickCombo(false); }} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>{e}</button>)}</div>}
            </div>
            <div style={{ marginBottom: 12 }}><label style={S.lbl}>Nama Set</label><input value={comboF.name} onChange={e => setComboF(f => ({ ...f, name: e.target.value }))} placeholder="Set Burger Double" style={S.inp} /></div>
            <div style={{ marginBottom: 12 }}><label style={S.lbl}>Harga Set (RM)</label><input type="number" value={comboF.price} onChange={e => setComboF(f => ({ ...f, price: e.target.value }))} placeholder="0.00" style={S.inp} /></div>
            <div style={{ marginBottom: 12 }}><label style={S.lbl}>Keterangan</label><input value={comboF.description} onChange={e => setComboF(f => ({ ...f, description: e.target.value }))} placeholder="Burger + Air + Fries" style={S.inp} /></div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.lbl}>Item dalam Set — assign printer setiap item</label>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 10, marginBottom: 8, maxHeight: 200, overflowY: "auto" }}>
                {comboF.items.length === 0 && (comboF.customItems || []).length === 0 && <div style={{ fontSize: 12, color: "#94a3b8" }}>Belum ada item</div>}
                {comboF.items.map(ci => {
                  const p = products.find(x => x.id === ci.productId);
                  return p ? (
                    <div key={ci.productId} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, background: "#fff", borderRadius: 8, padding: "6px 8px", border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: 16 }}>{p.emoji}</span>
                      <span style={{ fontSize: 13, flex: 1, fontWeight: 600 }}>{p.name}</span>
                      <span style={{ fontSize: 11, color: "#64748b" }}>×{ci.qty}</span>
                      <select value={ci.printerId || ""} onChange={e => setComboF(f => ({ ...f, items: f.items.map(i => i.productId === ci.productId ? { ...i, printerId: e.target.value } : i) }))}
                        style={{ fontSize: 11, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, color: "#1e293b", padding: "3px 5px", maxWidth: 110 }}>
                        <option value="">🖨️ Printer</option>
                        {printers.map(pr => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
                      </select>
                      <button onClick={() => removeComboItem(ci.productId)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14 }}>✕</button>
                    </div>
                  ) : null;
                })}
                {(comboF.customItems || []).map(ci => (
                  <div key={ci.customId} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, background: "#fff7ed", borderRadius: 8, padding: "6px 8px", border: "1px solid #f59e0b" }}>
                    <span style={{ fontSize: 16 }}>✏️</span>
                    <span style={{ fontSize: 13, flex: 1, fontWeight: 600 }}>{ci.name}</span>
                    <span style={{ fontSize: 10, color: "#f59e0b", background: "#fff", borderRadius: 4, padding: "1px 5px", border: "1px solid #f59e0b" }}>Custom</span>
                    <span style={{ fontSize: 11, color: "#64748b" }}>×{ci.qty}</span>
                    <select value={ci.printerId || ""} onChange={e => setComboF(f => ({ ...f, customItems: (f.customItems || []).map(i => i.customId === ci.customId ? { ...i, printerId: e.target.value } : i) }))}
                      style={{ fontSize: 11, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, color: "#1e293b", padding: "3px 5px", maxWidth: 110 }}>
                      <option value="">🖨️ Printer</option>
                      {printers.map(pr => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
                    </select>
                    <button onClick={() => removeCustomComboItem(ci.customId)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14 }}>✕</button>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6, fontWeight: 600 }}>Tambah item (pilih dari dropdown):</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                <select value={comboDropdownVal} onChange={e => { const val = e.target.value; if (val) { addComboItem(val); setComboDropdownVal(""); } else { setComboDropdownVal(""); } }}
                  style={{ ...S.sel, flex: 1, fontSize: 13 }}>
                  <option value="">— Pilih item untuk tambah —</option>
                  {categories.map(cat => (
                    <optgroup key={cat.id} label={cat.name}>
                      {products.filter(p => p.categoryId === cat.id).map(p => {
                        const added = comboF.items.find(i => i.productId === p.id);
                        return <option key={p.id} value={p.id}>{p.emoji} {p.name} {added ? `(✓${added.qty})` : ""}</option>;
                      })}
                    </optgroup>
                  ))}
                </select>
              </div>
              {/* Custom item — tak ada dalam menu */}
              <div style={{ borderTop: "1px dashed #e2e8f0", paddingTop: 8 }}>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6, fontWeight: 600 }}>➕ Tambah item custom (khusus untuk set ini):</div>
                {!showCustomItemForm ? (
                  <button onClick={() => setShowCustomItemForm(true)} style={{ padding: "6px 14px", background: "#fff7ed", border: "1px dashed #f59e0b", borderRadius: 8, color: "#92400e", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✏️ + Item Custom</button>
                ) : (
                  <div style={{ background: "#fff7ed", border: "1px solid #f59e0b", borderRadius: 8, padding: 10 }}>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ ...S.lbl, fontSize: 11 }}>Nama Item</label>
                      <input value={customItemF.name} onChange={e => setCustomItemF(f => ({ ...f, name: e.target.value }))} placeholder="cth: Sos Cili Extra, Double Patty..." style={{ ...S.inp, fontSize: 12, padding: "7px 10px" }} />
                    </div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ ...S.lbl, fontSize: 11 }}>Qty</label>
                        <input type="number" min="1" value={customItemF.qty} onChange={e => setCustomItemF(f => ({ ...f, qty: e.target.value }))} style={{ ...S.inp, fontSize: 12, padding: "7px 10px" }} />
                      </div>
                      <div style={{ flex: 2 }}>
                        <label style={{ ...S.lbl, fontSize: 11 }}>Printer</label>
                        <select value={customItemF.printerId} onChange={e => setCustomItemF(f => ({ ...f, printerId: e.target.value }))} style={{ ...S.sel, fontSize: 12, padding: "7px 10px" }}>
                          <option value="">— Pilih Printer —</option>
                          {printers.map(pr => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => { setShowCustomItemForm(false); setCustomItemF({ name: "", printerId: "", qty: "1" }); }} style={{ flex: 1, padding: "7px 0", background: "#f1f5f9", border: "none", borderRadius: 6, color: "#64748b", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Batal</button>
                      <button onClick={addCustomComboItem} style={{ flex: 2, padding: "7px 0", background: "#f59e0b", border: "none", borderRadius: 6, color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 700 }}>✅ Tambah</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button onClick={() => setComboModal(false)} style={{ flex: 1, padding: 12, background: "#f1f5f9", border: "none", borderRadius: 8, color: "#64748b", cursor: "pointer", fontWeight: 600 }}>Batal</button>
              <button onClick={saveCombo} style={{ flex: 2, padding: 12, background: "#3b82f6", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer" }}>Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Table Modal */}
      {tableSetupModal && (
        <div style={S.modal} onClick={() => setTableSetupModal(false)}>
          <div style={S.mbox} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{editTable ? "✏️ Edit Meja" : "➕ Tambah Meja"}</div>
            <div style={{ marginBottom: 12 }}><label style={S.lbl}>Nama Meja</label><input value={tableF.name} onChange={e => setTableF(f => ({ ...f, name: e.target.value }))} placeholder="Contoh: Meja 9" style={S.inp} /></div>
            <div style={{ marginBottom: 18 }}><label style={S.lbl}>Bahagian</label><input value={tableF.section} onChange={e => setTableF(f => ({ ...f, section: e.target.value }))} placeholder="Dalam / Luar / VIP" style={S.inp} /></div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setTableSetupModal(false)} style={{ flex: 1, padding: 12, background: "#f1f5f9", border: "none", borderRadius: 8, color: "#64748b", cursor: "pointer", fontWeight: 600 }}>Batal</button>
              <button onClick={saveTable} style={{ flex: 2, padding: 12, background: "#3b82f6", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer" }}>Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT ORDER MODAL ── */}
      {editOrderKey && activeOrders[editOrderKey] && editOrderDraft !== null && (
        <div style={S.modal} onClick={() => { setEditOrderKey(null); setEditOrderDraft(null); setEditOrderNewItems([]); }}>
          <div style={{ ...S.mbox, maxWidth: 680, maxHeight: "92vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>✏️ Edit Order — {activeOrders[editOrderKey].tableNo} <span style={{ color: "#64748b", fontSize: 13 }}>#{activeOrders[editOrderKey].num}</span></div>
              <button onClick={() => { setEditOrderKey(null); setEditOrderDraft(null); setEditOrderNewItems([]); }} style={{ background: "#ef4444", border: "none", borderRadius: 8, width: 32, height: 32, color: "#fff", fontSize: 16, cursor: "pointer" }}>✕</button>
            </div>

            {/* Draft badge */}
            {editOrderNewItems.length > 0 && (
              <div style={{ background: "#fef9c3", border: "1px solid #f59e0b", borderRadius: 8, padding: "6px 12px", marginBottom: 10, fontSize: 12, color: "#92400e" }}>
                ⚡ {editOrderNewItems.length} item baru akan auto-print ke dapur/bar bila selesai
              </div>
            )}

            {/* Current items in draft */}
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12, marginBottom: 14, maxHeight: 180, overflowY: "auto" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>ITEM DALAM ORDER</div>
              {editOrderDraft.length === 0 && <div style={{ fontSize: 12, color: "#f87171", fontWeight: 600 }}>⚠️ Kosong — order akan dibuang bila Selesai Edit</div>}
              {editOrderDraft.map(i => (
                <div key={i._key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, background: "#fff", borderRadius: 8, padding: "6px 10px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: 18 }}>{i.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{i.name}</div>
                    <div style={{ fontSize: 12, color: "#3b82f6" }}>{formatRM(i.price)}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <button onClick={() => editOrderRemoveItem(i._key)} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #e2e8f0", background: "#fef2f2", color: "#ef4444", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>−</button>
                    <span style={{ fontSize: 13, fontWeight: 700, minWidth: 20, textAlign: "center" }}>{i.qty}</span>
                    <button onClick={() => editOrderAddItem(i.isCombo ? (combos.find(c => c.id === i.id) || i) : (products.find(p => p.id === i.id) || i), i.isCombo)} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #e2e8f0", background: "#f0fdf4", color: "#22c55e", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>+</button>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, minWidth: 58, textAlign: "right" }}>{formatRM(i.price * i.qty)}</div>
                </div>
              ))}
              {editOrderDraft.length > 0 && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8, paddingTop: 8, borderTop: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>Jumlah: {formatRM(editOrderDraft.reduce((s, i) => s + i.price * i.qty, 0) * (1 + taxRate))}</span>
                </div>
              )}
            </div>

            {/* Add new items */}
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>TAMBAH ITEM</div>
            <select onChange={e => {
              const val = e.target.value;
              if (!val) return;
              const [type, id] = val.split(":");
              if (type === "combo") { const p = combos.find(c => String(c.id) === id); if (p) editOrderAddItem(p, true); }
              else { const p = products.find(x => String(x.id) === id); if (p) editOrderAddItem(p, false); }
              e.target.value = "";
            }} style={{ ...S.sel, width: "100%", marginBottom: 8, fontSize: 13 }}>
              <option value="">— Pilih item untuk tambah —</option>
              <optgroup label="🍱 Set/Combo">
                {combos.map(c => <option key={c.id} value={`combo:${c.id}`}>{c.emoji || "🍱"} {c.name} — {formatRM(c.price)}</option>)}
              </optgroup>
              {categories.map(cat => (
                <optgroup key={cat.id} label={cat.name}>
                  {products.filter(p => p.categoryId === cat.id).map(p => <option key={p.id} value={`item:${p.id}`}>{p.emoji} {p.name} — {formatRM(p.price)}</option>)}
                </optgroup>
              ))}
            </select>
            <button onClick={commitEditOrder} style={{ marginTop: 12, width: "100%", padding: 11, background: "#22c55e", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>✅ Selesai Edit</button>
          </div>
        </div>
      )}

      {/* ── SALES REPORT PRINT MODAL ── */}
      {salesPrintModal && (
        <div style={S.modal} onClick={() => setSalesPrintModal(false)}>
          <div style={{ ...S.mbox, maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>🖨️ Print Sales Report</div>
              <button onClick={() => setSalesPrintModal(false)} style={{ background: "#ef4444", border: "none", borderRadius: 8, width: 32, height: 32, color: "#fff", fontSize: 16, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#1e293b", cursor: "pointer", marginBottom: 10, fontWeight: 600 }}>
                <input type="checkbox" checked={salesPrintItems} onChange={e => setSalesPrintItems(e.target.checked)} style={{ width: 16, height: 16 }} />
                Sertakan senarai item
              </label>
            </div>
            {printers.length > 0 && (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>PRINT KE PRINTER</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                  {printers.map(p => (
                    <button key={p.id} onClick={async () => {
                      setSalesPrintModal(false);
                      const filterLabel = salesFilter === "yesterday" ? "Semalam" : salesFilter === "week" ? "7 Hari" : salesFilter === "month" ? "Bulan Ini" : salesFilter === "year" ? "Tahun Ini" : salesFilter === "pickdate" ? salesPickDate : salesFilter === "pickmonth" ? salesPickMonth : salesPickYear || "Semua";
                      const ESC = 0x1B, GS = 0x1D;
                      const enc = new TextEncoder();
                      const bytes = [];
                      const add = (t) => bytes.push(...enc.encode(t + "\n"));
                      bytes.push(ESC, 0x40);
                      bytes.push(ESC, 0x61, 0x01);
                      bytes.push(ESC, 0x45, 0x01);
                      add("WARUNG DIGITAL");
                      add("SALES REPORT");
                      bytes.push(ESC, 0x45, 0x00);
                      add(`Tempoh: ${filterLabel}`);
                      bytes.push(ESC, 0x61, 0x00);
                      const W = getPrintWidth(p.printerWidth || "58");
                      add("-".repeat(W));
                      const padW = W - 8;
                      add(`${"Jumlah Jualan".padEnd(padW)}${formatRM(totalSalesFilter)}`);
                      add(`${"Bil. Order".padEnd(padW)}${salesByFilter.length}`);
                      add(`${"Purata/Order".padEnd(padW)}${formatRM(salesByFilter.length ? totalSalesFilter / salesByFilter.length : 0)}`);
                      add("-".repeat(W));
                      add("JUALAN MENGIKUT HARI:");
                      Object.entries(salesByDay).sort((a,b) => new Date(b[0]) - new Date(a[0])).forEach(([day, data]) => {
                        const l = day, r = formatRM(data.total);
                        add(l + " ".repeat(Math.max(1, W - l.length - r.length)) + r);
                        add(`  ${data.count} order`);
                      });
                      if (salesPrintItems) {
                        add("-".repeat(W));
                        add("ITEM PALING LARIS:");
                        const itemCount = {};
                        salesByFilter.forEach(o => o.cart.forEach(i => {
                          if (!itemCount[i.name]) itemCount[i.name] = { qty: 0, total: 0 };
                          itemCount[i.name].qty += i.qty; itemCount[i.name].total += i.price * i.qty;
                        }));
                        Object.entries(itemCount).sort((a,b) => b[1].qty - a[1].qty).forEach(([name, d], idx) => {
                          const l = `${idx+1}. ${name}`, r = `${d.qty}x ${formatRM(d.total)}`;
                          const nameW = W - r.length - 2;
                          add(l.substring(0, nameW) + " ".repeat(Math.max(1, W - Math.min(l.length, nameW) - r.length)) + r);
                        });
                      }
                      add("-".repeat(W));
                      add(`Dicetak: ${new Date().toLocaleString("ms-MY")}`);
                      bytes.push(GS, 0x56, 0x41, 0x10);
                      await doPrint(p, new Uint8Array(bytes));
                    }} style={{ padding: "10px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, textAlign: "left" }}>
                      <span style={{ fontSize: 20 }}>{p.type === "bluetooth" ? "📶" : "📡"}</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{p.location} · {p.role}</div>
                      </div>
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, textAlign: "center" }}>— atau —</div>
              </>
            )}
            <button onClick={() => {
              setSalesPrintModal(false);
              const filterLabel = salesFilter === "yesterday" ? "Semalam" : salesFilter === "week" ? "7 Hari" : salesFilter === "month" ? "Bulan Ini" : salesFilter === "year" ? "Tahun Ini" : salesFilter === "pickdate" ? salesPickDate : salesFilter === "pickmonth" ? salesPickMonth : salesPickYear || "Semua";
              const lines = ["=".repeat(40), "         WARUNG DIGITAL — SALES REPORT", `         Tempoh: ${filterLabel}`, "=".repeat(40),
                `Jumlah Jualan : ${formatRM(totalSalesFilter)}`, `Bilangan Order: ${salesByFilter.length}`,
                `Purata/Order  : ${formatRM(salesByFilter.length ? totalSalesFilter / salesByFilter.length : 0)}`, "-".repeat(40), "JUALAN MENGIKUT HARI:"];
              Object.entries(salesByDay).sort((a,b) => new Date(b[0]) - new Date(a[0])).forEach(([day, data]) => {
                lines.push(`  ${day.padEnd(20)} ${data.count}x  ${formatRM(data.total)}`);
              });
              if (salesPrintItems) {
                lines.push("-".repeat(40), "ITEM PALING LARIS:");
                const itemCount = {};
                salesByFilter.forEach(o => o.cart.forEach(i => {
                  if (!itemCount[i.name]) itemCount[i.name] = { qty: 0, total: 0 };
                  itemCount[i.name].qty += i.qty; itemCount[i.name].total += i.price * i.qty;
                }));
                Object.entries(itemCount).sort((a,b) => b[1].qty - a[1].qty).forEach(([name, d], idx) => {
                  lines.push(`  ${String(idx+1).padStart(2)}. ${name.padEnd(20)} ${String(d.qty)+"x"}  ${formatRM(d.total)}`);
                });
              }
              lines.push("=".repeat(40), `Dicetak: ${new Date().toLocaleString("ms-MY")}`);
              const blob = new Blob([lines.join("\n")], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url; a.download = `sales_report_${filterLabel.replace(/[/ :]/g,"_")}.txt`;
              a.click(); URL.revokeObjectURL(url);
              toast("📥 Sales report dimuat turun!", "#4ade80");
            }} style={{ width: "100%", padding: 11, background: "#64748b", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>📥 Download sebagai .txt</button>
          </div>
        </div>
      )}

      {/* ── BIG QR ORDER ALERT ── */}
      {pendingAlert && !isQROrderPage && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 28, maxWidth: 420, width: "100%", boxShadow: "0 8px 40px rgba(0,0,0,.3)" }}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🔔</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#1e293b" }}>Order Baru Masuk!</div>
              <div style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>dari <b>{pendingAlert.customerName}</b> · 📞 {pendingAlert.customerPhone}</div>
              {pendingAlert.orderNote && <div style={{ fontSize: 13, color: "#f59e0b", marginTop: 4, background: "#fff7ed", borderRadius: 8, padding: "4px 10px" }}>📝 {pendingAlert.orderNote}</div>}
              <div style={{ fontSize: 13, color: "#f59e0b", fontWeight: 700, marginTop: 2 }}>📍 {pendingAlert.tableNo}</div>
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: 12, marginBottom: 16 }}>
              {pendingAlert.cart?.map((i, idx) => <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}><span>{i.emoji} {i.name}{i.variantLabel ? ` (${i.variantLabel})` : ""} ×{i.qty}</span><span style={{ fontWeight: 700 }}>{formatRM(i.price * i.qty)}</span></div>)}
              <div style={{ borderTop: "1px dashed #e2e8f0", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15 }}><span>JUMLAH</span><span style={{ color: "#f59e0b" }}>{formatRM(pendingAlert.total)}</span></div>
            </div>
            {/* Countdown bar */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                <span>Auto terima dalam</span><span style={{ fontWeight: 700, color: alertCountdown <= 10 ? "#ef4444" : "#22c55e" }}>{alertCountdown}s</span>
              </div>
              <div style={{ background: "#e2e8f0", borderRadius: 99, height: 8 }}>
                <div style={{ background: alertCountdown <= 10 ? "#ef4444" : "#22c55e", borderRadius: 99, height: 8, width: `${(alertCountdown / 30) * 100}%`, transition: "width 1s linear" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { rejectPendingOrder(pendingAlert); setPendingAlert(null); }} style={{ flex: 1, padding: 14, background: "#fef2f2", border: "2px solid #ef4444", borderRadius: 12, color: "#ef4444", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>✕ Tolak</button>
              <button onClick={() => { acceptPendingOrder(pendingAlert); setPendingAlert(null); }} style={{ flex: 2, padding: 14, background: "#22c55e", border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>✅ Terima ({alertCountdown}s)</button>
            </div>
          </div>
        </div>
      )}

      {/* ── QR ORDER MODAL ── */}
      {showQRModal && (
        <div style={S.modal}>
          <div style={{ ...S.mbox, maxWidth: 560 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>📱 QR Order — Self Order per Meja</div>
              <button onClick={() => setShowQRModal(false)} style={{ background: "#ef4444", border: "none", borderRadius: 8, width: 32, height: 32, color: "#fff", fontSize: 16, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14, background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, padding: "8px 12px" }}>
              💡 Customer scan QR → buka dalam WiFi kedai → isi nama + phone → order terus masuk dashboard
            </div>

            {/* Pending Orders Section */}
            {pendingOrders.filter(o => o.status === "pending").length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#ef4444", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                  🔔 Order Menunggu ({pendingOrders.filter(o => o.status === "pending").length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflowY: "auto" }}>
                  {pendingOrders.filter(o => o.status === "pending").map(o => (
                    <div key={o.id} style={{ background: "#fff7ed", border: "2px solid #f59e0b", borderRadius: 12, padding: "12px 14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "#92400e" }}>👤 {o.customerName} · 📞 {o.customerPhone}</div>
                          {o.orderNote && <div style={{ fontSize: 12, color: "#f59e0b", marginTop: 2 }}>📝 {o.orderNote}</div>}
                          <div style={{ fontSize: 12, color: "#92400e" }}>📍 {o.tableNo} · {fmtTime(o.time)}</div>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: "#f59e0b" }}>{formatRM(o.total)}</div>
                      </div>
                      <div style={{ background: "#fff", borderRadius: 8, padding: "8px 10px", marginBottom: 8 }}>
                        {o.cart.map(i => <div key={i._key} style={{ fontSize: 12, color: "#64748b", marginBottom: 2 }}>{i.emoji} {i.name} ×{i.qty} — {formatRM(i.price * i.qty)}</div>)}
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => acceptPendingOrder(o)} style={{ flex: 1, padding: "8px 0", background: "#22c55e", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>✅ Terima & Buat Order</button>
                        <button onClick={() => rejectPendingOrder(o)} style={{ padding: "8px 14px", background: "#ef4444", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>✕ Tolak</button>
                      </div>
                    </div>
                  ))}
                </div>
                {pendingOrders.filter(o => o.status !== "pending").length > 0 && (
                  <button onClick={clearDonePendingOrders} style={{ marginTop: 8, padding: "6px 12px", background: "#f1f5f9", border: "none", borderRadius: 6, color: "#64748b", fontSize: 11, cursor: "pointer" }}>🗑️ Clear order yang dah selesai</button>
                )}
              </div>
            )}

            {/* QR Codes per table */}
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>QR Code Mengikut Meja</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12, maxHeight: 340, overflowY: "auto" }}>
              {tables.map(t => {
                const qrUrl = `${qrBaseUrl}?qrorder=1&table=${t.id}&tname=${encodeURIComponent(t.name)}`;
                const imgId = `qr-img-${t.id}`;

                function saveQR() {
                  const img = document.getElementById(imgId);
                  if (!img) return;
                  const canvas = document.createElement("canvas");
                  const pad = 24;
                  const qrSize = 200;
                  const textH = 60;
                  canvas.width = qrSize + pad * 2;
                  canvas.height = qrSize + pad * 2 + textH;
                  const ctx = canvas.getContext("2d");
                  ctx.fillStyle = "#ffffff";
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                  // Border
                  ctx.strokeStyle = "#f59e0b";
                  ctx.lineWidth = 4;
                  ctx.roundRect(4, 4, canvas.width - 8, canvas.height - 8, 12);
                  ctx.stroke();
                  // Table name
                  ctx.fillStyle = "#1e293b";
                  ctx.font = "bold 18px Segoe UI, sans-serif";
                  ctx.textAlign = "center";
                  ctx.fillText(t.name, canvas.width / 2, pad + 20);
                  ctx.font = "12px Segoe UI, sans-serif";
                  ctx.fillStyle = "#64748b";
                  ctx.fillText("Scan untuk order", canvas.width / 2, pad + 38);
                  // QR image
                  try {
                    ctx.drawImage(img, pad, pad + textH - 10, qrSize, qrSize);
                  } catch {
                    toast("⚠️ Sila tunggu QR load dulu", "#f59e0b");
                    return;
                  }
                  const link = document.createElement("a");
                  link.download = `QR-${t.name.replace(/\s/g, "_")}.png`;
                  link.href = canvas.toDataURL("image/png");
                  link.click();
                  toast(`📥 QR ${t.name} disimpan!`, "#4ade80");
                }

                function printQR() {
                  const img = document.getElementById(imgId);
                  if (!img) return;
                  const win = window.open("", "_blank");
                  win.document.write(`
                    <html><head><title>QR ${t.name}</title>
                    <style>
                      body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #fff; font-family: 'Segoe UI', sans-serif; }
                      .card { border: 3px solid #f59e0b; border-radius: 16px; padding: 24px; text-align: center; width: 260px; }
                      h2 { margin: 0 0 4px; font-size: 20px; color: #1e293b; }
                      p { margin: 0 0 14px; font-size: 13px; color: #64748b; }
                      img { width: 200px; height: 200px; border: 3px solid #f59e0b; border-radius: 8px; }
                      small { display: block; margin-top: 10px; font-size: 10px; color: #94a3b8; word-break: break-all; }
                    </style></head>
                    <body><div class="card">
                      <h2>${t.name}</h2>
                      <p>Scan untuk order</p>
                      <img src="${img.src}" />
                      <small>${qrUrl}</small>
                    </div></body></html>
                  `);
                  win.document.close();
                  win.onload = () => { win.print(); };
                }

                return (
                  <div key={t.id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 14, textAlign: "center" }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", marginBottom: 8 }}>📍 {t.name}</div>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                      <QRImg value={qrUrl} size={130} id={imgId} />
                    </div>
                    <div style={{ fontSize: 9, color: "#94a3b8", wordBreak: "break-all", marginBottom: 8 }}>{qrUrl}</div>
                    <div style={{ display: "flex", gap: 5 }}>
                      <button onClick={() => navigator.clipboard?.writeText(qrUrl).then(() => toast("📋 URL disalin!", "#4ade80"))} style={{ flex: 1, padding: "5px 0", background: "#eff6ff", border: "none", borderRadius: 6, color: "#3b82f6", fontSize: 10, cursor: "pointer", fontWeight: 600 }}>📋 Salin</button>
                      <button onClick={saveQR} style={{ flex: 1, padding: "5px 0", background: "#f0fdf4", border: "none", borderRadius: 6, color: "#22c55e", fontSize: 10, cursor: "pointer", fontWeight: 600 }}>💾 Simpan</button>
                      <button onClick={printQR} style={{ flex: 1, padding: "5px 0", background: "#fff7ed", border: "none", borderRadius: 6, color: "#f59e0b", fontSize: 10, cursor: "pointer", fontWeight: 600 }}>🖨️ Print</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── SPLIT BILL MODAL ── */}
      {splitMode && splitOrderKey && activeOrders[splitOrderKey] && (
        <div style={S.modal} onClick={() => setSplitMode(false)}>
          <div style={{ ...S.mbox, maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>✂️ Split Bill — {activeOrders[splitOrderKey].tableNo}</div>
              <button onClick={() => setSplitMode(false)} style={{ background: "#ef4444", border: "none", borderRadius: 8, width: 32, height: 32, color: "#fff", fontSize: 16, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>Tap item yang nak dibayar sekarang. Boleh pilih sebahagian quantity.</div>

            <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12, marginBottom: 14, maxHeight: 280, overflowY: "auto" }}>
              {activeOrders[splitOrderKey].cart.map(i => {
                const selectedQty = splitSelected[i._key] || 0;
                return (
                  <div key={i._key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, background: selectedQty > 0 ? "#f0fdf4" : "#fff", borderRadius: 8, padding: "8px 10px", border: `1px solid ${selectedQty > 0 ? "#22c55e" : "#e2e8f0"}` }}>
                    <span style={{ fontSize: 20 }}>{i.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{i.name}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{formatRM(i.price)} × {i.qty}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <button onClick={() => setSplitSelected(prev => { const cur = prev[i._key] || 0; if (cur <= 0) return prev; const n = { ...prev }; if (cur === 1) delete n[i._key]; else n[i._key] = cur - 1; return n; })} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #e2e8f0", background: "#fef2f2", color: "#ef4444", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>−</button>
                      <span style={{ fontSize: 14, fontWeight: 700, minWidth: 24, textAlign: "center", color: selectedQty > 0 ? "#22c55e" : "#94a3b8" }}>{selectedQty}</span>
                      <button onClick={() => toggleSplitItem(i._key, i.qty)} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #e2e8f0", background: "#f0fdf4", color: "#22c55e", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>+</button>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, minWidth: 58, textAlign: "right", color: selectedQty > 0 ? "#22c55e" : "#94a3b8" }}>{formatRM(i.price * selectedQty)}</div>
                  </div>
                );
              })}
            </div>

            {/* Split total */}
            <div style={{ background: "#f0fdf4", border: "1px solid #22c55e", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 700, color: "#166534" }}>
                <span>Jumlah Bayar Sekarang</span><span>{formatRM(getSplitTotal())}</span>
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Balance yang tinggal akan kekal dalam order</div>
            </div>

            {/* Payment method */}
            <div style={{ marginBottom: 12 }}>
              <label style={S.lbl}>Kaedah Bayaran</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[["cash","💵 Tunai"],["card","💳 Kad"],["qr","📱 QR"]].map(([id,l]) => (
                  <button key={id} onClick={() => setSplitPayMethod(id)} style={{ flex: 1, padding: 9, border: "2px solid", borderRadius: 8, cursor: "pointer", background: splitPayMethod === id ? "#3b82f6" : "#f8fafc", color: splitPayMethod === id ? "#fff" : "#64748b", borderColor: splitPayMethod === id ? "#3b82f6" : "#e2e8f0", fontWeight: 600, fontSize: 12 }}>{l}</button>
                ))}
              </div>
            </div>
            {splitPayMethod === "cash" && (
              <div style={{ marginBottom: 12 }}>
                <label style={S.lbl}>Jumlah Tunai</label>
                <input type="number" value={splitCashIn} onChange={e => setSplitCashIn(e.target.value)} placeholder="0.00" style={{ ...S.inp, fontSize: 16, fontWeight: 700, marginBottom: 6 }} />
                <div style={{ display: "flex", gap: 6 }}>
                  {[10,20,50,100].map(a => <button key={a} onClick={() => setSplitCashIn(a.toString())} style={{ flex: 1, padding: "7px 0", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#000" }}>RM{a}</button>)}
                </div>
                {splitCashIn && parseFloat(splitCashIn) >= getSplitTotal() && getSplitTotal() > 0 && (
                  <div style={{ background: "#f0fdf4", border: "1px solid #22c55e", borderRadius: 8, padding: "7px 10px", marginTop: 8, display: "flex", justifyContent: "space-between", fontSize: 13, color: "#166534", fontWeight: 600 }}>
                    <span>Baki:</span><span>{formatRM(parseFloat(splitCashIn) - getSplitTotal())}</span>
                  </div>
                )}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => doSplitCheckout(false)} disabled={getSplitTotal() === 0} style={{ flex: 1, padding: 11, background: getSplitTotal() === 0 ? "#e2e8f0" : "#64748b", border: "none", borderRadius: 8, color: getSplitTotal() === 0 ? "#94a3b8" : "#fff", fontWeight: 700, fontSize: 12, cursor: getSplitTotal() === 0 ? "not-allowed" : "pointer" }}>✅ Bayar (Tanpa Print)</button>
              <button onClick={() => doSplitCheckout(true)} disabled={getSplitTotal() === 0 || (splitPayMethod === "cash" && (!splitCashIn || parseFloat(splitCashIn) < getSplitTotal()))} style={{ flex: 1, padding: 11, background: getSplitTotal() === 0 || (splitPayMethod === "cash" && (!splitCashIn || parseFloat(splitCashIn) < getSplitTotal())) ? "#e2e8f0" : "#22c55e", border: "none", borderRadius: 8, color: getSplitTotal() === 0 || (splitPayMethod === "cash" && (!splitCashIn || parseFloat(splitCashIn) < getSplitTotal())) ? "#94a3b8" : "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>🖨️ Bayar + Print</button>
            </div>
            <button onClick={() => setSplitMode(false)} style={{ width: "100%", marginTop: 8, padding: 9, background: "none", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", color: "#64748b", fontSize: 13 }}>← Batal</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// WIFI RAW TCP PRINT SUPPORT (ADDED - ORIGINAL CODE NOT REMOVED)
// Untuk thermal printer macam Zywell / 9Printer / XPrinter
// Printer & phone cuma perlu connect WiFi sama.
// TAK perlu internet.
// ─────────────────────────────────────────────────────────────

// INSTALL (kalau belum ada):
// npm install react-native-tcp-socket






// CONTOH GUNA:
//
// await printWifiRaw(
//   "192.168.0.200",
//   slipData,
//   9100
// );
//
// slipData = ESC/POS bytes daripada buildOrderSlipBytes()
//
// Sesuai untuk:
// - Zywell
// - 9Printer
// - XPrinter
// - Epson TM series
//
// Lebih stabil dari Bluetooth untuk POS.
