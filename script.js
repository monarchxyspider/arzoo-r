// 1. Firebase Modules Import
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  updateDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 2. Firebase App Credentials
const firebaseConfig = {
  apiKey: "AIzaSyA9TtLxBxm58ZwXYiWfNUhAmgsj2bWOKIc",
  authDomain: "resturant-db-f2cd9.firebaseapp.com",
  projectId: "resturant-db-f2cd9",
  storageBucket: "resturant-db-f2cd9.firebasestorage.app",
  messagingSenderId: "46488397895",
  appId: "1:46488397895:web:f63d63e1c2d43cfa636962",
  measurementId: "G-6V0D99D5C3"
};

// Initialize Cloud Services
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// App Config & Secrets
const CONFIG = {
  MY_WHATSAPP_NUMBER: "923155593205",
  AUTH_SECRET_PASS: "123456"
};

let dishes = [];
let orders = [];
let cart = {};

// 3. Page Load & Event Handlers
document.addEventListener("DOMContentLoaded", () => {
  // Realtime Cloud Synchronization
  initRealtimeSync();

  // Navigation & Button Wire-ups
  const contactNavBtn = document.getElementById('contactNavBtn');
  const directContactBtn = document.getElementById('directContactBtn');
  if (contactNavBtn) contactNavBtn.addEventListener('click', scrollToContact);
  if (directContactBtn) directContactBtn.addEventListener('click', openDirectWhatsApp);

  const adminModal = document.getElementById('adminModal');
  const orderModal = document.getElementById('orderModal');
  const adminBtn = document.getElementById('adminBtn');
  const closeAdminBtn = document.getElementById('closeAdminModal');
  const closeOrderBtn = document.getElementById('closeOrderModal');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const orderForm = document.getElementById('orderForm');
  const verifyAdminBtn = document.getElementById('verifyAdminBtn');

  if (adminBtn) adminBtn.addEventListener('click', () => adminModal.style.display = "flex");
  if (closeAdminBtn) closeAdminBtn.addEventListener('click', () => adminModal.style.display = "none");
  if (closeOrderBtn) closeOrderBtn.addEventListener('click', () => orderModal.style.display = "none");
  if (checkoutBtn) checkoutBtn.addEventListener('click', openOrderModal);
  if (orderForm) orderForm.addEventListener('submit', handleOrderSubmit);
  if (verifyAdminBtn) verifyAdminBtn.addEventListener('click', verifyAdminAccess);
});

// 4. Realtime Firestore Listeners
function initRealtimeSync() {
  // Live Menu Sync
  onSnapshot(collection(db, "dishes"), (snapshot) => {
    dishes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Default dishes setup agar database empty ho
    if (dishes.length === 0) {
      seedInitialDishes();
    } else {
      renderDishes();
    }
  });

  // Live Orders Sync
  onSnapshot(collection(db, "orders"), (snapshot) => {
    orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const adminOrdersList = document.getElementById('adminOrdersList');
    if (adminOrdersList) {
      renderAdminOrders('all');
    }
  });
}

// Initial Database Seeding
async function seedInitialDishes() {
  const defaultDishes = [
    { name: "Chicken Mutton Karahi", price: 1800, img: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300" },
    { name: "Special BBQ Platter", price: 1400, img: "https://images.unsplash.com/photo-1544025162-d76694265947?w=300" },
    { name: "Chicken Biryani", price: 350, img: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300" },
    { name: "Beef Nihari", price: 850, img: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300" },
    { name: "Chicken Haleem", price: 400, img: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300" },
    { name: "Seekh Kabab (4 Pcs)", price: 600, img: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300" },
    { name: "Chicken Tikka Piece", price: 320, img: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300" },
    { name: "Mutton Handi", price: 2400, img: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300" },
    { name: "Rogan Josh", price: 1600, img: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300" },
    { name: "Reshmi Kabab", price: 750, img: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300" }
  ];

  for (const dish of defaultDishes) {
    await addDoc(collection(db, "dishes"), dish);
  }
}

// 5. Menu Render & Dynamic Control
function renderDishes() {
  const container = document.getElementById('dishesContainer');
  if (!container) return;

  container.innerHTML = dishes.map(dish => `
    <div class="dish-card">
      <img src="${dish.img}" alt="${dish.name}">
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

// 6. Checkout & Order Processing
function openOrderModal() {
  const summaryBox = document.getElementById('orderSummaryBox');
  if (!summaryBox) return;

  let summaryHTML = '<h4>Order Items:</h4><ul>';
  for (let id in cart) {
    if (cart[id] > 0) {
      const item = dishes.find(d => d.id === id);
      if (item) summaryHTML += `<li>${item.name} x ${cart[id]}</li>`;
    }
  }
  summaryHTML += '</ul>';
  summaryBox.innerHTML = summaryHTML;

  const orderModal = document.getElementById('orderModal');
  if (orderModal) orderModal.style.display = "flex";
}

async function handleOrderSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const address = document.getElementById('custAddress').value.trim();

  const pkPhoneRegex = /^((\+92)|(0092)|(0))3[0-9]{9}$/;
  if (!pkPhoneRegex.test(phone.replace(/[\s-]/g, ''))) {
    alert("Please enter a valid Pakistani phone number.");
    return;
  }

  const currentOrderItems = [];
  let totalAmount = 0;

  for (let id in cart) {
    if (cart[id] > 0) {
      const item = dishes.find(d => d.id === id);
      if (item) {
        currentOrderItems.push({ name: item.name, qty: cart[id], price: item.price });
        totalAmount += item.price * cart[id];
      }
    }
  }

  const newOrder = {
    customer: { name, phone, address },
    items: currentOrderItems,
    total: totalAmount,
    status: 'Pending',
    date: new Date().toLocaleString()
  };

  try {
    // Cloud Firestore Mein Permanent Order Save
    const docRef = await addDoc(collection(db, "orders"), newOrder);

    // WhatsApp Format
    let orderText = `*NEW ORDER RECEIVED (#${docRef.id})*\n\n`;
    orderText += `*Customer Details:*\n- Name: ${name}\n- Phone: ${phone}\n- Address: ${address}\n\n`;
    orderText += `*Ordered Items:*\n`;
    currentOrderItems.forEach(i => {
      orderText += `- ${i.name} (Qty: ${i.qty})\n`;
    });
    orderText += `\n*Total Amount:* Rs. ${totalAmount}`;

    const waLink = `https://wa.me/${CONFIG.MY_WHATSAPP_NUMBER}?text=${encodeURIComponent(orderText)}`;
    window.open(waLink, '_blank');

    // Cart Reset
    cart = {};
    document.getElementById('cartCount').innerText = 0;
    document.getElementById('orderModal').style.display = "none";
    document.getElementById('orderForm').reset();

    alert("Order Saved to Cloud & Redirecting to WhatsApp!");
  } catch (err) {
    alert("Error submitting order: " + err.message);
  }
}

// 7. Admin Dashboard Controls
function verifyAdminAccess() {
  const codeEl = document.getElementById('adminAuthCode');
  const statusEl = document.getElementById('authStatus');
  if (!codeEl || !statusEl) return;

  if (codeEl.value.trim() === CONFIG.AUTH_SECRET_PASS) {
    statusEl.style.color = "green";
    statusEl.innerText = "Access Granted!";
    loadAdminDashboard();
  } else {
    statusEl.style.color = "red";
    statusEl.innerText = "ACCESS DENIED: Invalid Auth Secret!";
  }
}

function loadAdminDashboard() {
  const dashboardContainer = document.getElementById('adminDashboard');
  if (!dashboardContainer) return;

  dashboardContainer.innerHTML = `
    <div style="display:flex; gap:20px; margin-top:15px;">
      <div style="width:20%; border-right:1px solid #ccc; padding-right:10px;">
        <button onclick="renderAdminOrders('all')">All Orders</button><br><br>
        <button onclick="renderAdminOrders('Pending')">Pending Orders</button><br><br>
        <button onclick="renderAdminOrders('Completed')">Completed Orders</button>
      </div>
      <div style="width:80%;" id="adminOrdersList"></div>
    </div>
  `;
  renderAdminOrders('all');
}

window.renderAdminOrders = function(filterStatus) {
  const listContainer = document.getElementById('adminOrdersList');
  if (!listContainer) return;

  let filteredOrders = orders;
  if (filterStatus !== 'all') {
    filteredOrders = orders.filter(o => o.status === filterStatus);
  }

  if (filteredOrders.length === 0) {
    listContainer.innerHTML = "<p>No orders found.</p>";
    return;
  }

  listContainer.innerHTML = filteredOrders.map(order => `
    <div style="border:1px solid #ddd; padding:10px; margin-bottom:10px; border-radius:5px;">
      <b>Order ID:</b> #${order.id} | <b>Status:</b> <span style="color:${order.status === 'Pending' ? 'orange' : 'green'}">${order.status}</span><br>
      <b>Customer:</b> ${order.customer.name} (${order.customer.phone})<br>
      <b>Address:</b> ${order.customer.address}<br>
      <b>Items:</b> ${order.items.map(i => `${i.name} x${i.qty}`).join(', ')}<br>
      <b>Total:</b> Rs. ${order.total}<br>
      <b>Date:</b> ${order.date}<br><br>
      ${order.status === 'Pending' ? `<button onclick="toggleOrderStatus('${order.id}', 'Completed')">Mark as Completed</button>` : `<button onclick="toggleOrderStatus('${order.id}', 'Pending')">Mark as Pending</button>`}
    </div>
  `).join('');
};

window.toggleOrderStatus = async function(orderId, newStatus) {
  try {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, { status: newStatus });
  } catch (err) {
    alert("Error updating order: " + err.message);
  }
};

// Navigation Helpers
function scrollToContact(e) {
  e.preventDefault();
  const contactEl = document.getElementById('contact');
  if (contactEl) contactEl.scrollIntoView({ behavior: 'smooth' });
}

function openDirectWhatsApp() {
  const url = `https://wa.me/${CONFIG.MY_WHATSAPP_NUMBER}?text=${encodeURIComponent("Hello! I want to inquire about menu and reservations.")}`;
  window.open(url, '_blank');
}

