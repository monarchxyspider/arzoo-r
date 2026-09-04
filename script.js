// Global Configuration
const CONFIG = {
  MY_WHATSAPP_NUMBER: "923006809142",
  AUTH_HASH: "0ac4bbd11735d68e2c7e29452d57548727cfb7076cf3f3fafdeb942d980bf5af"
};

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
  { id: 1, name: "Chicken Mutton Karahi", price: 1800, img: "images/karahi.webp" },
  { id: 2, name: "Special BBQ Platter", price: 1400, img: "images/bbq.webp" },
  { id: 3, name: "Chicken Biryani", price: 350, img: "images/biryani.webp" }
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
});

<<<<<<< HEAD
// Hamburger Navigation Setup
function setupHamburgerMenu() {
=======
  // Mobile Hamburger Drawer Logic (Strictly Fixed)
>>>>>>> 64c139747638d215c5e560b217edfa47ae19f6f5
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

<<<<<<< HEAD
=======
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

>>>>>>> 64c139747638d215c5e560b217edfa47ae19f6f5
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
  document.getElementById('cartCount').innerText = totalItems;
  document.getElementById('checkoutBtn').disabled = totalItems === 0;
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

// Step 2: Order Processing with Modern Firebase Write
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

  // Firebase v9 Async Save
  try {
    const orderRef = ref(database, 'orders/' + newOrder.id);
    await set(orderRef, newOrder);
    console.log("Order saved to Firebase successfully!");

<<<<<<< HEAD
    orders.push(newOrder);
    localStorage.setItem('restaurant_orders', JSON.stringify(orders));
    localStorage.setItem('active_order_id', orderId);
    activeOrderId = orderId;
=======
  // Firebase Realtime DB / Firestore sync
  if (typeof firebase !== 'undefined' && firebase.database) {
    try {
      await firebase.database().ref('orders/' + newOrder.id).set(newOrder);
    } catch (err) {
      console.log("Firebase sync warning:", err);
    }
  }

  // WhatsApp Redirect Format
  let orderText = `*NEW ORDER RECEIVED (#${newOrder.id})*\n\n`;
  orderText += `*Customer Details:*\n- Name: ${name}\n- Phone: ${phone}\n- Address: ${address}\n\n`;
  orderText += `*Ordered Items:*\n`;
  currentOrderItems.forEach(i => {
    orderText += `- ${i.name} (Qty: ${i.qty})\n`;
  });
  orderText += `\n*Total Amount:* Rs. ${totalAmount}`;

  const waLink = `https://wa.me/${CONFIG.MY_WHATSAPP_NUMBER}?text=${encodeURIComponent(orderText)}`;
  window.open(waLink, '_blank');

  document.getElementById('orderModal').style.display = "none";
  alert("Order Sent to WhatsApp & Database!");
}

// SHA-256 Helper Function
async function hashPasskey(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
>>>>>>> 64c139747638d215c5e560b217edfa47ae19f6f5

    document.getElementById('orderModal').style.display = "none";
    showChatInHamburger(orderId);

    if (type === 'whatsapp') {
      let orderText = `*NEW ORDER RECEIVED (#${newOrder.id})*\nName: ${name}\nPhone: ${phone}\nTotal: Rs. ${totalAmount}`;
      const waLink = `https://wa.me/${CONFIG.MY_WHATSAPP_NUMBER}?text=${encodeURIComponent(orderText)}`;
      window.open(waLink, '_blank');
    } else {
      alert("Order Done! Hamburger menu mein Chat active kar di gayi hai.");
    }

  } catch (err) {
    console.error("Firebase save failed:", err);
    alert("Database Error: " + err.message);
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

// Live Chat Window Sync
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

  // Realtime Listen to Messages
  const chatRef = ref(database, 'chats/' + orderId);
  onValue(chatRef, (snapshot) => {
    const data = snapshot.val();
    const chatBox = document.getElementById('chatBox');
    if (!chatBox) return;

    chatBox.innerHTML = '';
    if (data) {
      Object.values(data).forEach(msg => {
        chatBox.innerHTML += `<p><b>${msg.sender}:</b> ${msg.text}</p>`;
      });
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  });
}

<<<<<<< HEAD
async function sendChatMessage(orderId) {
  const input = document.getElementById('chatMsgInput');
  const text = input.value.trim();
  if (!text) return;

  try {
    const chatRef = ref(database, 'chats/' + orderId);
    const newMsgRef = push(chatRef);
    await set(newMsgRef, {
      sender: 'Customer',
      text: text,
      timestamp: Date.now()
    });
    input.value = '';
  } catch (err) {
    console.error("Chat send error:", err);
  }
}
=======
function openDirectWhatsApp() {
  const url = `https://wa.me/${CONFIG.MY_WHATSAPP_NUMBER}?text=${encodeURIComponent("Hello! I want to inquire about menu and reservations.")}`;
  window.open(url, '_blank');
}
>>>>>>> 64c139747638d215c5e560b217edfa47ae19f6f5
