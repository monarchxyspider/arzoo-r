// Global Configuration
const CONFIG = {
  MY_WHATSAPP_NUMBER: "923006809142",
  AUTH_HASH: "0ac4bbd11735d68e2c7e29452d57548727cfb7076cf3f3fafdeb942d980bf5af"
};

// CDN Module Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getDatabase, ref, set, push, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyA9TtLxBxm58ZwXYiWfNUhAmgsj2bWOKIc",
  authDomain: "resturant-db-f2cd9.firebaseapp.com",
  projectId: "resturant-db-f2cd9",
  storageBucket: "resturant-db-f2cd9.firebasestorage.app",
  messagingSenderId: "46488397895",
  appId: "1:46488397895:web:f63d63e1c2d43cfa636962",
  measurementId: "G-6V0D99D5C3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

let defaultDishes = [
  { id: 1, name: "Chicken Mutton Karahi", price: 1800, img: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=500&q=80" },
  { id: 2, name: "Special BBQ Platter", price: 1400, img: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=500&q=80" },
  { id: 3, name: "Chicken Biryani", price: 350, img: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=500&q=80" }
];

let dishes = JSON.parse(localStorage.getItem('restaurant_dishes')) || defaultDishes;
let cart = {};
let orders = [];
let activeOrderId = localStorage.getItem('active_order_id') || null;

document.addEventListener("DOMContentLoaded", () => {
  renderDishes();
  setupHamburgerMenu();
  listenToFirebaseOrders();
  listenToFirebaseDishes(); // Live Firebase Dishes Sync

  if (activeOrderId) {
    showChatInHamburger(activeOrderId);
  }

  // Modals & Button Listeners
  document.getElementById('checkoutBtn')?.addEventListener('click', openOrderModal);
  document.getElementById('closeOrderModal')?.addEventListener('click', () => {
    document.getElementById('orderModal').style.display = "none";
  });
  document.getElementById('closeAdminModal')?.addEventListener('click', () => {
    document.getElementById('adminModal').style.display = "none";
  });
  document.getElementById('adminBtn')?.addEventListener('click', () => {
    document.getElementById('adminModal').style.display = "flex";
  });
  document.getElementById('directContactBtn')?.addEventListener('click', openDirectWhatsApp);

  // Admin Listeners
  document.getElementById('verifyAdminBtn')?.addEventListener('click', verifyAdminPasskey);
  document.getElementById('addDishBtn')?.addEventListener('click', addNewDish);
});

// Realtime Sync: Firebase Orders
function listenToFirebaseOrders() {
  const ordersRef = ref(db, 'orders');
  onValue(ordersRef, (snapshot) => {
    const data = snapshot.val();
    orders = [];
    if (data) {
      Object.keys(data).forEach(key => {
        orders.push({ firebaseKey: key, ...data[key] });
      });
    }
    renderAdminOrders(); // Refresh Admin Panel Orders
  });
}

// Realtime Sync: Firebase Dishes
function listenToFirebaseDishes() {
  const dishesRef = ref(db, 'dishes');
  onValue(dishesRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      dishes = Object.keys(data).map(key => ({ firebaseKey: key, ...data[key] }));
      localStorage.setItem('restaurant_dishes', JSON.stringify(dishes));
      renderDishes();
      renderAdminDishes();
    }
  });
}

// SHA-256 Passkey Hashing
async function hashPasskey(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Admin Passkey Verification
async function verifyAdminPasskey() {
  const inputPasskey = document.getElementById('adminAuthCode')?.value.trim();
  const authStatus = document.getElementById('authStatus');

  if (!inputPasskey) {
    if (authStatus) {
      authStatus.style.color = "#d90429";
      authStatus.innerText = "Please enter passkey first!";
    }
    return;
  }

  const hashedInput = await hashPasskey(inputPasskey);

  if (hashedInput === CONFIG.AUTH_HASH) {
    if (authStatus) authStatus.innerText = "";
    document.getElementById('adminLoginForm').style.display = "none";
    document.getElementById('adminDashboard').style.display = "block";
    renderAdminOrders();
    renderAdminDishes();
  } else {
    if (authStatus) {
      authStatus.style.color = "#d90429";
      authStatus.innerText = " Invalid Passkey! Try again.";
    }
  }
}

// Add New Dish (Firebase + Local)
async function addNewDish() {
  const nameInput = document.getElementById('dishNameInput');
  const priceInput = document.getElementById('dishPriceInput');
  const imgInput = document.getElementById('dishImgInput');

  const name = nameInput?.value.trim();
  const price = parseFloat(priceInput?.value);
  const img = imgInput?.value.trim() || "https://via.placeholder.com/300?text=No+Image";

  if (!name || isNaN(price)) {
    alert("paste valid values of dish price and name");
    return;
  }

  const newDish = { id: Date.now(), name, price, img };

  try {
    const dishRef = push(ref(db, 'dishes'));
    await set(dishRef, newDish);
    alert(“Dish have been Added!”);
    if (nameInput) nameInput.value = '';
    if (priceInput) priceInput.value = '';
    if (imgInput) imgInput.value = '';
  } catch (err) {
    console.error("Dish Add Error:", err);
  }
}

// Render Admin Dishes
function renderAdminDishes() {
  const container = document.getElementById('adminDishesList');
  if (!container) return;

  container.innerHTML = dishes.map(dish => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:8px; border-bottom:1px solid #eee;">
      <span><b>${dish.name}</b> - Rs. ${dish.price}</span>
      <button onclick="deleteDish('${dish.firebaseKey}')" style="background:#d90429; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">Delete</button>
    </div>
  `).join('');
}

window.deleteDish = async function(firebaseKey) {
  if (confirm("Do you want to delete this dish!.")) {
    try {
      await remove(ref(db, `dishes/${firebaseKey}`));
    } catch (err) {
      console.error("Delete Dish Error:", err);
    }
  }
};

// Render Admin Orders (Pending & Completed)
function renderAdminOrders() {
  const pendingContainer = document.getElementById('pendingOrdersList');
  const completedContainer = document.getElementById('completedOrdersList');

  const pendingOrders = orders.filter(o => o.status === 'Pending');
  const completedOrders = orders.filter(o => o.status === 'Completed');

  if (pendingContainer) {
    pendingContainer.innerHTML = pendingOrders.length === 0 ? "<p>There is no pending order.</p>" : pendingOrders.map(order => `
      <div style="border:1px solid #ccc; padding:10px; margin-bottom:10px; border-radius:5px; background:#fff;">
        <h4>Order #${order.id}</h4>
        <p><b>Name:</b> ${order.customer?.name} | <b>Phone:</b> ${order.customer?.phone}</p>
        <p><b>Address:</b> ${order.customer?.address}</p>
        <p><b>Items:</b> ${order.items?.map(i => `${i.name} x${i.qty}`).join(', ')}</p>
        <p><b>Total:</b> Rs. ${order.total}</p>
        <button onclick="updateOrderStatus('${order.firebaseKey}', 'Completed')" style="background:#2b9348; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">Mark Completed</button>
        <button onclick="deleteOrder('${order.firebaseKey}')" style="background:#d90429; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">Delete</button>
      </div>
    `).join('');
  }

  if (completedContainer) {
    completedContainer.innerHTML = completedOrders.length === 0 ? "<p>Koi completed order nahi hai.</p>" : completedOrders.map(order => `
      <div style="border:1px solid #e0e0e0; padding:10px; margin-bottom:10px; border-radius:5px; background:#f9f9f9;">
        <h4>Order #${order.id} (Completed)</h4>
        <p><b>Customer:</b> ${order.customer?.name} (${order.customer?.phone})</p>
        <p><b>Total:</b> Rs. ${order.total}</p>
        <button onclick="deleteOrder('${order.firebaseKey}')" style="background:#d90429; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">Delete Record</button>
      </div>
    `).join('');
  }
}

window.updateOrderStatus = async function(firebaseKey, newStatus) {
  try {
    await update(ref(db, `orders/${firebaseKey}`), { status: newStatus });
  } catch (err) {
    console.error("Order Status Update Error:", err);
  }
};

window.deleteOrder = async function(firebaseKey) {
  if (confirm("Do you want to delete this order records?")) {
    try {
      await remove(ref(db, `orders/${firebaseKey}`));
    } catch (err) {
      console.error("Delete Order Error:", err);
    }
  }
};

// Hamburger Navigation Setup
function setupHamburgerMenu() {
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const navLinks = document.getElementById('navLinks');
  const navBackdrop = document.getElementById('navBackdrop');

  if (hamburgerBtn && navLinks) {
    hamburgerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      hamburgerBtn.classList.toggle('active');
      navLinks.classList.toggle('active');
      navBackdrop?.classList.toggle('active');
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
      link.addEventListener('click', () => {
        hamburgerBtn.classList.remove('active');
        navLinks.classList.remove('active');
        navBackdrop?.classList.remove('active');
      });
    });

    navBackdrop?.addEventListener('click', () => {
      hamburgerBtn.classList.remove('active');
      navLinks.classList.remove('active');
      navBackdrop.classList.remove('active');
    });

    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && !hamburgerBtn.contains(e.target)) {
        hamburgerBtn.classList.remove('active');
        navLinks.classList.remove('active');
        navBackdrop?.classList.remove('active');
      }
    });
  }
}

// Render Menu
function renderDishes() {
  const container = document.getElementById('dishesContainer');
  if (!container) return;

  container.innerHTML = dishes.map(dish => `
    <div class="dish-card">
      <img src="${dish.img}" alt="${dish.name}" onerror="this.src='https://via.placeholder.com/300?text=No+Image'">
      <h3>${dish.name}</h3>
      <p style="font-weight:bold; color:#d90429;">Rs. ${dish.price}</p>
      <div class="qty-controls">
        <button onclick="updateQty('${dish.id}', -1)">-</button>
        <span id="qty-${dish.id}">${cart[dish.id] || 0}</span>
        <button onclick="updateQty('${dish.id}', 1)">+</button>
      </div>
    </div>
  `).join('');
}

window.updateQty = function(id, change) {
  if (!cart[id]) cart[id] = 0;
  cart[id] += change;
  if (cart[id] < 0) cart[id] = 0;

  const qtyEl = document.getElementById(`qty-${id}`);
  if (qtyEl) qtyEl.innerText = cart[id];

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartCountEl = document.getElementById('cartCount');
  const checkoutBtnEl = document.getElementById('checkoutBtn');

  if (cartCountEl) cartCountEl.innerText = totalItems;
  if (checkoutBtnEl) checkoutBtnEl.disabled = totalItems === 0;
};

function openOrderModal() {
  const summaryBox = document.getElementById('orderSummaryBox');
  let summaryHTML = '<h4>Order Items:</h4><ul>';
  for (let id in cart) {
    if (cart[id] > 0) {
      const item = dishes.find(d => d.id == id);
      if (item) summaryHTML += `<li>${item.name} x ${cart[id]}</li>`;
    }
  }
  summaryHTML += '</ul>';
  if (summaryBox) summaryBox.innerHTML = summaryHTML;
  document.getElementById('orderModal').style.display = "flex";
}

// Order Processing
window.processOrder = async function(type) {
  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const address = document.getElementById('custAddress').value.trim();

  if (!name || !phone || !address) {
    alert("kindly complete following details");
    return;
  }

  const currentOrderItems = [];
  let totalAmount = 0;

  for (let id in cart) {
    if (cart[id] > 0) {
      const item = dishes.find(d => d.id == id);
      if (item) {
        currentOrderItems.push({ name: item.name, qty: cart[id], price: item.price });
        totalAmount += item.price * cart[id];
      }
    }
  }

  const orderId = 'ORD-' + Date.now();
  const newOrder = {
    id: orderId,
    customer: { name, phone, address },
    items: currentOrderItems,
    total: totalAmount,
    status: 'Pending',
    date: new Date().toLocaleString()
  };

  try {
    const newOrderRef = push(ref(db, 'orders'));
    await set(newOrderRef, newOrder);
  } catch (error) {
    console.error("Firebase Database Save Error:", error);
  }

  localStorage.setItem('active_order_id', orderId);
  activeOrderId = orderId;

  document.getElementById('orderModal').style.display = "none";
  showChatInHamburger(orderId);

  if (type === 'whatsapp') {
    let orderText = `*NEW ORDER RECEIVED (#${newOrder.id})*\nName: ${name}\nPhone: ${phone}\nTotal: Rs. ${totalAmount}`;
    const waLink = `https://wa.me/${CONFIG.MY_WHATSAPP_NUMBER}?text=${encodeURIComponent(orderText)}`;
    window.open(waLink, '_blank');
  } else {
    alert("Order Done!its no get save");
  }
};

// Hamburger Chat Feature
function showChatInHamburger(orderId) {
  const navLinks = document.getElementById('navLinks');
  if (!navLinks) return;

  let chatItem = document.getElementById('hamburgerChatItem');
  if (!chatItem) {
    chatItem = document.createElement('li');
    chatItem.id = 'hamburgerChatItem';
    chatItem.innerHTML = `<a href="#" id="openChatBtn">💬 Order Chat (#${orderId})</a>`;
    navLinks.appendChild(chatItem);

    document.getElementById('openChatBtn').addEventListener('click', (e) => {
      e.preventDefault();
      openChatWindow(orderId);
    });
  }
}

// Live Chat Window
function openChatWindow(orderId) {
  let chatModal = document.getElementById('chatModal');
  if (!chatModal) {
    chatModal = document.createElement('div');
    chatModal.id = 'chatModal';
    chatModal.className = 'modal';
    chatModal.style.display = 'flex';
    chatModal.innerHTML = `
      <div class="modal-content" style="max-width:400px;">
        <span class="close-btn" id="closeChatModal">&times;</span>
        <h3>Order Support Chat (#${orderId})</h3>
        <div id="chatBox" style="height:200px; overflow-y:auto; border:1px solid #ccc; padding:10px; margin:10px 0;"></div>
        <div style="display:flex; gap:5px;">
          <input type="text" id="chatMsgInput" placeholder="Type message..." style="flex:1;">
          <button id="sendChatBtn" class="btn-main">Send</button>
        </div>
      </div>
    `;
    document.body.appendChild(chatModal);

    document.getElementById('closeChatModal').onclick = () => chatModal.style.display = 'none';
    document.getElementById('sendChatBtn').onclick = () => sendChatMessage(orderId);
  } else {
    chatModal.style.display = 'flex';
  }
}

async function sendChatMessage(orderId) {
  const input = document.getElementById('chatMsgInput');
  const text = input.value.trim();
  if (!text) return;

  const chatBox = document.getElementById('chatBox');
  if (chatBox) {
    chatBox.innerHTML += `<p><b>You:</b> ${text}</p>`;
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  try {
    const msgRef = push(ref(db, `chats/${orderId}`));
    await set(msgRef, {
      sender: "Customer",
      message: text,
      timestamp: Date.now()
    });
  } catch (err) {
    console.error("Firebase Chat Save Error:", err);
  }

  input.value = '';
}

function openDirectWhatsApp() {
  const url = `https://wa.me/${CONFIG.MY_WHATSAPP_NUMBER}?text=${encodeURIComponent("Hello! I want to inquire about menu and reservations.")}`;
  window.open(url, '_blank');
}

// Admin Tabs Switcher (Exposed to Global Window Scope)
window.switchAdminTab = function(tabName) {
  // Hide all tab contents
  const tabs = document.querySelectorAll('.admin-tab-content');
  tabs.forEach(tab => tab.style.display = 'none');

  // Remove active class from buttons
  const buttons = document.querySelectorAll('.admin-tab-btn');
  buttons.forEach(btn => btn.classList.remove('active'));

  // Show selected tab content
  const selectedTab = document.getElementById(`tab-${tabName}`);
  if (selectedTab) {
    selectedTab.style.display = 'block';
  }

  // Set active state on current button
  if (event && event.currentTarget) {
    event.currentTarget.classList.add('active');
  }
};