// Global Configuration
const CONFIG = {
  MY_WHATSAPP_NUMBER: "923006809142",
  AUTH_HASH: "0ac4bbd11735d68e2c7e29452d57548727cfb7076cf3f3fafdeb942d980bf5af"
};

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
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

let defaultDishes = [
  { id: 1, name: "Chicken Mutton Karahi", price: 1800, img: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=500&q=80" },
  { id: 2, name: "Special BBQ Platter", price: 1400, img: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=500&q=80" },
  { id: 3, name: "Chicken Biryani", price: 350, img: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=500&q=80" }
];

let dishes = JSON.parse(localStorage.getItem('restaurant_dishes')) || defaultDishes;
let cart = {};
let orders = JSON.parse(localStorage.getItem('restaurant_orders')) || [];
let activeOrderId = localStorage.getItem('active_order_id') || null;

document.addEventListener("DOMContentLoaded", () => {
  renderDishes();
  setupHamburgerMenu();
  
  if (activeOrderId) {
    showChatInHamburger(activeOrderId);
  }

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
});

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
        <button onclick="updateQty(${dish.id}, -1)">-</button>
        <span id="qty-${dish.id}">${cart[dish.id] || 0}</span>
        <button onclick="updateQty(${dish.id}, 1)">+</button>
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
    alert("Saari Details Bharein!");
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

  orders.push(newOrder);
  localStorage.setItem('restaurant_orders', JSON.stringify(orders));
  localStorage.setItem('active_order_id', orderId);
  activeOrderId = orderId;

  document.getElementById('orderModal').style.display = "none";
  showChatInHamburger(orderId);

  if (type === 'whatsapp') {
    let orderText = `*NEW ORDER RECEIVED (#${newOrder.id})*\nName: ${name}\nPhone: ${phone}\nTotal: Rs. ${totalAmount}`;
    const waLink = `https://wa.me/${CONFIG.MY_WHATSAPP_NUMBER}?text=${encodeURIComponent(orderText)}`;
    window.open(waLink, '_blank');
  } else {
    alert("Order Done! Hamburger menu mein Chat active kar di gayi hai.");
  }
};

// Hamburger Chat Feature for Admin & Customer
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
  input.value = '';
}

function openDirectWhatsApp() {
  const url = `https://wa.me/${CONFIG.MY_WHATSAPP_NUMBER}?text=${encodeURIComponent("Hello! I want to inquire about menu and reservations.")}`;
  window.open(url, '_blank');
}