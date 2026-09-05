// Global Configuration
const CONFIG = {
  MY_WHATSAPP_NUMBER: "923006809142",
  AUTH_HASH: "0ac4bbd11735d68e2c7e29452d57548727cfb7076cf3f3fafdeb942d980bf5af"
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, set, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyA9TtLxBxm58ZwXYiWfNUhAmgsj2bWOKIc",
  authDomain: "resturant-db-f2cd9.firebaseapp.com",
  databaseURL: "https://resturant-db-f2cd9-default-rtdb.firebaseio.com",
  projectId: "resturant-db-f2cd9",
  storageBucket: "resturant-db-f2cd9.firebasestorage.app",
  messagingSenderId: "46488397895",
  appId: "1:46488397895:web:f63d63e1c2d43cfa636962",
  measurementId: "G-6V0D99D5C3"
};

// Initialize Firebase Database
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Export for usage across script
export { db, ref, push, set, onValue, update, remove };

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
  listenToFirebaseDishes();

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

    // Check if active order was marked as completed
    if (activeOrderId) {
      const activeOrderObj = orders.find(o => o.id === activeOrderId);
      if (activeOrderObj && activeOrderObj.status === 'Completed') {
        clearClientChat();
      }
    }

    renderAdminOrders();
  });
}

// Function to clear chat on client end
function clearClientChat() {
  localStorage.removeItem('active_order_id');
  activeOrderId = null;
  const chatItem = document.getElementById('hamburgerChatItem');
  if (chatItem) chatItem.remove();

  const chatModal = document.getElementById('chatModal');
  if (chatModal) chatModal.style.display = 'none';
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
      authStatus.innerText = "Invalid Passkey! Try again.";
    }
  }
}

// Add New Dish
async function addNewDish() {
  const nameInput = document.getElementById('dishNameInput');
  const priceInput = document.getElementById('dishPriceInput');
  const imgInput = document.getElementById('dishImgInput');

  const name = nameInput?.value.trim();
  const price = parseFloat(priceInput?.value);
  const img = imgInput?.value.trim() || "https://via.placeholder.com/300?text=No+Image";

  if (!name || isNaN(price)) {
    alert("Please enter a valid dish name and price.");
    return;
  }

  const newDish = { id: Date.now(), name, price, img };

  try {
    const dishRef = push(ref(db, 'dishes'));
    await set(dishRef, newDish);

    newDish.firebaseKey = dishRef.key;
    dishes.push(newDish);
    localStorage.setItem('restaurant_dishes', JSON.stringify(dishes));

    renderDishes();
    renderAdminDishes();

    alert("Dish has been added successfully!");
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
  if (confirm("Do you want to delete this dish?")) {
    try {
      if (firebaseKey) {
        await remove(ref(db, `dishes/${firebaseKey}`));
      }
      dishes = dishes.filter(d => d.firebaseKey !== firebaseKey);
      localStorage.setItem('restaurant_dishes', JSON.stringify(dishes));
      
      renderDishes();
      renderAdminDishes();
    } catch (err) {
      console.error("Delete Dish Error:", err);
    }
  }
};

// Render Admin Orders
function renderAdminOrders() {
  const pendingContainer = document.getElementById('pendingOrdersList');
  const completedContainer = document.getElementById('completedOrdersList');

  const pendingOrders = orders.filter(o => o.status === 'Pending');
  const completedOrders = orders.filter(o => o.status === 'Completed');

  if (pendingContainer) {
    pendingContainer.innerHTML = pendingOrders.length === 0 ? "<p>There are no pending orders.</p>" : pendingOrders.map(order => `
      <div style="border:1px solid #ccc; padding:10px; margin-bottom:10px; border-radius:5px; background:#fff;">
        <h4>Order #${order.id}</h4>
        <p><b>Name:</b> ${order.customer?.name} | <b>Phone:</b> ${order.customer?.phone}</p>
        <p><b>Address:</b> ${order.customer?.address}</p>
        <p><b>Items:</b> ${order.items?.map(i => `${i.name} x${i.qty}`).join(', ')}</p>
        <p><b>Total:</b> Rs. ${order.total}</p>
        <div style="margin-top:10px;">
          <button onclick="updateOrderStatus('${order.firebaseKey}', 'Completed')" style="background:#2b9348; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; margin-right:5px;">Mark Completed</button>
          <button onclick="openAdminChat('${order.id}')" style="background:#023e8a; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; margin-right:5px;">💬 Open Chat</button>
          <button onclick="deleteOrder('${order.firebaseKey}')" style="background:#d90429; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">Delete</button>
        </div>
      </div>
    `).join('');
  }

  if (completedContainer) {
    completedContainer.innerHTML = completedOrders.length === 0 ? "<p>No completed orders found.</p>" : completedOrders.map(order => `
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
    if (newStatus === 'Completed') {
      alert("Order marked as completed! Customer chat is now closed.");
    }
  } catch (err) {
    console.error("Order Status Update Error:", err);
  }
};

window.deleteOrder = async function(firebaseKey) {
  if (confirm("Do you want to delete this order record?")) {
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
  const name = document.getElementById('custName')?.value.trim();
  const phone = document.getElementById('custPhone')?.value.trim();
  const address = document.getElementById('custAddress')?.value.trim();

  if (!name || !phone || !address) {
    alert("Kindly complete all required details!");
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

  if (currentOrderItems.length === 0) {
    alert("Please select at least one dish!");
    return;
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

    // Save Active Order
    localStorage.setItem('active_order_id', orderId);
    activeOrderId = orderId;

    // Reset Cart & UI
    cart = {};
    const cartCountEl = document.getElementById('cartCount');
    const checkoutBtnEl = document.getElementById('checkoutBtn');
    if (cartCountEl) cartCountEl.innerText = "0";
    if (checkoutBtnEl) checkoutBtnEl.disabled = true;
    renderDishes();

    // Close Modal
    document.getElementById('orderModal').style.display = "none";
    showChatInHamburger(orderId);

    // Form Reset
    document.getElementById('orderForm')?.reset();

    if (type === 'whatsapp') {
      let orderText = `*NEW ORDER RECEIVED (#${newOrder.id})*\nName: ${name}\nPhone: ${phone}\nTotal: Rs. ${totalAmount}`;
      const waLink = `https://wa.me/${CONFIG.MY_WHATSAPP_NUMBER}?text=${encodeURIComponent(orderText)}`;
      window.open(waLink, '_blank');
    } else {
      alert(`Order Submitted Successfully!\nYour Order ID is #${orderId}`);
    }

  } catch (error) {
    console.error("Firebase Database Save Error:", error);
    alert("Failed to submit order. Please check your connection!");
  }
};

// Hamburger Chat Feature for Client
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
      openChatWindow(orderId, "Customer");
    });
  }
}

// Admin Chat Launcher
window.openAdminChat = function(orderId) {
  openChatWindow(orderId, "Admin");
};

// Live Chat Window (Shared for Admin & Customer)
function openChatWindow(orderId, senderRole = "Customer") {
  let chatModal = document.getElementById('chatModal');
  if (!chatModal) {
    chatModal = document.createElement('div');
    chatModal.id = 'chatModal';
    chatModal.className = 'modal';
    chatModal.style.display = 'flex';
    chatModal.innerHTML = `
      <div class="modal-content" style="max-width:400px; position:relative;">
        <span class="close-btn" id="closeChatModal" style="cursor:pointer; float:right; font-weight:bold;">&times;</span>
        <h3 id="chatTitle">Support Chat (#${orderId})</h3>
        <div id="chatBox" style="height:220px; overflow-y:auto; border:1px solid #ccc; padding:10px; margin:10px 0; background:#fefefe; border-radius:5px;"></div>
        <div id="chatControls" style="display:flex; gap:5px;">
          <input type="text" id="chatMsgInput" placeholder="Type message..." style="flex:1; padding:8px; border:1px solid #ccc; border-radius:4px;">
          <button id="sendChatBtn" style="background:#d90429; color:white; border:none; padding:8px 15px; border-radius:4px; cursor:pointer;">Send</button>
        </div>
      </div>
    `;
    document.body.appendChild(chatModal);
  } else {
    chatModal.style.display = 'flex';
    document.getElementById('chatTitle').innerText = `Support Chat (#${orderId})`;
  }

  document.getElementById('closeChatModal').onclick = () => chatModal.style.display = 'none';
  
  const sendBtn = document.getElementById('sendChatBtn');
  sendBtn.onclick = () => sendChatMessage(orderId, senderRole);

  // Sync Messages from Firebase Realtime DB
  const chatRef = ref(db, `chats/${orderId}`);
  onValue(chatRef, (snapshot) => {
    const chatBox = document.getElementById('chatBox');
    if (!chatBox) return;

    chatBox.innerHTML = '';
    const data = snapshot.val();
    if (data) {
      Object.values(data).forEach(msg => {
        const isSelf = msg.sender === senderRole;
        chatBox.innerHTML += `
          <div style="margin-bottom:8px; text-align:${isSelf ? 'right' : 'left'};">
            <span style="display:inline-block; background:${isSelf ? '#023e8a' : '#e0e0e0'}; color:${isSelf ? '#fff' : '#000'}; padding:6px 10px; border-radius:8px; max-width:80%; font-size:14px;">
              <b>${msg.sender}:</b> ${msg.message}
            </span>
          </div>
        `;
      });
      chatBox.scrollTop = chatBox.scrollHeight;
    } else {
      chatBox.innerHTML = '<p style="color:#888; font-size:12px; text-align:center;">No messages yet.</p>';
    }
  });
}

async function sendChatMessage(orderId, senderRole) {
  const input = document.getElementById('chatMsgInput');
  const text = input?.value.trim();
  if (!text) return;

  try {
    const msgRef = push(ref(db, `chats/${orderId}`));
    await set(msgRef, {
      sender: senderRole,
      message: text,
      timestamp: Date.now()
    });
    if (input) input.value = '';
  } catch (err) {
    console.error("Firebase Chat Save Error:", err);
  }
}

function openDirectWhatsApp() {
  const url = `https://wa.me/${CONFIG.MY_WHATSAPP_NUMBER}?text=${encodeURIComponent("Hello! I want to inquire about menu and reservations.")}`;
  window.open(url, '_blank');
}

// Admin Tabs Switcher
window.switchAdminTab = function(tabName) {
  const tabs = document.querySelectorAll('.admin-tab-content');
  tabs.forEach(tab => tab.style.display = 'none');

  const buttons = document.querySelectorAll('.admin-tab-btn');
  buttons.forEach(btn => btn.classList.remove('active'));

  const selectedTab = document.getElementById(`tab-${tabName}`);
  if (selectedTab) {
    selectedTab.style.display = 'block';
  }

  if (window.event && window.event.currentTarget) {
    window.event.currentTarget.classList.add('active');
  }
};