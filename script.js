// Global Configuration (Aap ka SHA-256 Hash Yahan Aaye Ga)
const CONFIG = {
  MY_WHATSAPP_NUMBER: "923155593205",
  AUTH_HASH: "0ac4bbd11735d68e2c7e29452d57548727cfb7076cf3f3fafdeb942d980bf5af"
};

// 20 Dish Menu Database
const dishes = [
  { id: 1, name: "Chicken Mutton Karahi", price: "Rs. 1800", img: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300" },
  { id: 2, name: "Special BBQ Platter", price: "Rs. 1400", img: "https://images.unsplash.com/photo-1544025162-d76694265947?w=300" },
  { id: 3, name: "Chicken Biryani", price: "Rs. 350", img: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300" },
  { id: 4, name: "Beef Nihari", price: "Rs. 850", img: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300" },
  { id: 5, name: "Chicken Haleem", price: "Rs. 400", img: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300" },
  { id: 6, name: "Seekh Kabab (4 Pcs)", price: "Rs. 600", img: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300" },
  { id: 7, name: "Chicken Tikka Piece", price: "Rs. 320", img: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300" },
  { id: 8, name: "Mutton Handi", price: "Rs. 2400", img: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300" },
  { id: 9, name: "Rogan Josh", price: "Rs. 1600", img: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300" },
  { id: 10, name: "Reshmi Kabab", price: "Rs. 750", img: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300" },
  { id: 11, name: "Roghani Naan", price: "Rs. 80", img: "https://cdn.discordapp.com/attachments/1540374952367226920/1544742601440362616/images_9.jpeg?ex=6a999d28&is=6a984ba8&hm=d47a0dca29e9f378a432e32552f881512a13fbdfa40853f0970f402b74a66d56" },
  { id: 12, name: "Garlic Naan", price: "Rs. 100", img: "https://cdn.discordapp.com/attachments/1540374952367226920/1544742980378951792/images_11.jpeg?ex=6a999d82&is=6a984c02&hm=65ba244be6b9bfd96b7d11a86a960234c9dd5312a089e99fefa5420f6051b5ae" },
  { id: 13, name: "Chicken Malai Boti", price: "Rs. 900", img: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300" },
  { id: 14, name: "Fish Tikka", price: "Rs. 1400", img: "https://images.unsplash.com/photo-1544025162-d76694265947?w=300" },
  { id: 15, name: "Dal Makhni", price: "Rs. 500", img: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300" },
  { id: 16, name: "Palak Paneer", price: "Rs. 600", img: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300" },
  { id: 18, name: "Gulab Jamun (2 Pcs)", price: "Rs. 180", img: "https://cdn.discordapp.com/attachments/1540374952367226920/1544743441311731752/images_12.jpeg?ex=6a999df0&is=6a984c70&hm=d57d3589eacdda1cc77d66edf60d0e5c2cdf3e8e33dde05c343ad20a7644c7d6" },
  { id: 20, name: "Mint Margarita", price: "Rs. 220", img: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=300" }
];

// Load Saved Dishes or Use Defaults
let dishes = JSON.parse(localStorage.getItem('restaurant_dishes')) || defaultDishes;
let cart = {};
let orders = JSON.parse(localStorage.getItem('restaurant_orders')) || [];

// Main Initialization
document.addEventListener("DOMContentLoaded", () => {
  renderDishes();

  // Navigation Click Handlers
  document.getElementById('contactNavBtn')?.addEventListener('click', scrollToContact);
  document.getElementById('directContactBtn')?.addEventListener('click', openDirectWhatsApp);

  // Modals Listeners
  const adminModal = document.getElementById('adminModal');
  const orderModal = document.getElementById('orderModal');

  document.getElementById('adminBtn')?.addEventListener('click', () => {
    if (adminModal) adminModal.style.display = "flex";
  });
  document.getElementById('closeAdminModal')?.addEventListener('click', () => {
    if (adminModal) adminModal.style.display = "none";
  });
  document.getElementById('closeOrderModal')?.addEventListener('click', () => {
    if (orderModal) orderModal.style.display = "none";
  });
  
  document.getElementById('checkoutBtn')?.addEventListener('click', openOrderModal);
  document.getElementById('orderForm')?.addEventListener('submit', handleOrderSubmit);
  document.getElementById('verifyAdminBtn')?.addEventListener('click', verifyAdminAccess);
  document.getElementById('addDishForm')?.addEventListener('submit', handleAddDish);

  // Mobile Hamburger Drawer Logic (Fixed)
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const navLinks = document.getElementById('navLinks');

  if (hamburgerBtn && navLinks) {
    hamburgerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navLinks.classList.toggle('active');
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
      });
    });

    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && !hamburgerBtn.contains(e.target)) {
        navLinks.classList.remove('active');
      }
    });
  }
});

// Render Dishes Grid
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

// Quantity Adjuster
function updateQty(id, change) {
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
}

// Order Creation & Firebase Push
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
  
  const orderModal = document.getElementById('orderModal');
  if (orderModal) orderModal.style.display = "flex";
}

async function handleOrderSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const address = document.getElementById('custAddress').value.trim();

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

  const newOrder = {
    id: Date.now(),
    customer: { name, phone, address },
    items: currentOrderItems,
    total: totalAmount,
    status: 'Pending',
    date: new Date().toLocaleString()
  };

  // Local Storage Sync
  orders.push(newOrder);
  localStorage.setItem('restaurant_orders', JSON.stringify(orders));

  // Firebase Realtime DB / Firestore sync (If Firebase SDK is loaded in index.html)
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

// Admin Panel Access & Management
async function verifyAdminAccess() {
  const codeInput = document.getElementById('adminAuthCode').value.trim();
  const statusEl = document.getElementById('authStatus');

  const inputHash = await hashPasskey(codeInput);

  if (inputHash === CONFIG.AUTH_HASH) {
    if (statusEl) {
      statusEl.style.color = "green";
      statusEl.innerText = "Access Granted!";
    }
    document.getElementById('adminLoginForm').style.display = "none";
    document.getElementById('adminDashboard').style.display = "block";
    renderAdminOrders();
  } else {
    if (statusEl) {
      statusEl.style.color = "red";
      statusEl.innerText = "ACCESS DENIED: Invalid Passkey!";
    }
  }
}

// Admin Tab Switcher
window.switchAdminTab = function(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');

  if (tabName === 'pending') {
    document.getElementById('tabPending').style.display = 'block';
  } else if (tabName === 'completed') {
    document.getElementById('tabCompleted').style.display = 'block';
  } else if (tabName === 'addDish') {
    document.getElementById('tabAddDish').style.display = 'block';
  }
};

// Render Admin Orders Lists
function renderAdminOrders() {
  const pendingContainer = document.getElementById('pendingOrdersList');
  const completedContainer = document.getElementById('completedOrdersList');

  const pendingOrders = orders.filter(o => o.status === 'Pending');
  const completedOrders = orders.filter(o => o.status === 'Completed');

  if (pendingContainer) {
    if (pendingOrders.length === 0) {
      pendingContainer.innerHTML = "<p>No pending orders.</p>";
    } else {
      pendingContainer.innerHTML = pendingOrders.map(order => `
        <div class="admin-order-card">
          <b>Order ID:</b> #${order.id}<br>
          <b>Customer:</b> ${order.customer.name} (${order.customer.phone})<br>
          <b>Address:</b> ${order.customer.address}<br>
          <b>Items:</b> ${order.items.map(i => `${i.name} x${i.qty}`).join(', ')}<br>
          <b>Total:</b> Rs. ${order.total}<br>
          <button class="btn-done" onclick="markOrderDone(${order.id})">Mark as Done</button>
        </div>
      `).join('');
    }
  }

  if (completedContainer) {
    if (completedOrders.length === 0) {
      completedContainer.innerHTML = "<p>No completed orders yet.</p>";
    } else {
      completedContainer.innerHTML = completedOrders.map(order => `
        <div class="admin-order-card" style="opacity: 0.8;">
          <b>Order ID:</b> #${order.id} | <span style="color:green; font-weight:bold;">DONE</span><br>
          <b>Customer:</b> ${order.customer.name} (${order.customer.phone})<br>
          <b>Items:</b> ${order.items.map(i => `${i.name} x${i.qty}`).join(', ')}<br>
          <b>Total:</b> Rs. ${order.total}
        </div>
      `).join('');
    }
  }
}

// Mark Pending -> Completed
window.markOrderDone = function(orderId) {
  orders = orders.map(o => o.id === orderId ? { ...o, status: 'Completed' } : o);
  localStorage.setItem('restaurant_orders', JSON.stringify(orders));

  if (typeof firebase !== 'undefined' && firebase.database) {
    firebase.database().ref('orders/' + orderId + '/status').set('Completed');
  }

  renderAdminOrders();
};

// Add New Dish Form Handler
function handleAddDish(e) {
  e.preventDefault();

  const name = document.getElementById('newDishName').value.trim();
  const price = parseFloat(document.getElementById('newDishPrice').value);
  const img = document.getElementById('newDishImg').value.trim();

  const newDish = { id: Date.now(), name, price, img };
  dishes.push(newDish);
  localStorage.setItem('restaurant_dishes', JSON.stringify(dishes));

  if (typeof firebase !== 'undefined' && firebase.database) {
    firebase.database().ref('dishes/' + newDish.id).set(newDish);
  }

  renderDishes();
  document.getElementById('addDishForm').reset();
  alert("New Dish Added Successfully!");
}

// Scroll & Direct Chat
function scrollToContact(e) {
  e.preventDefault();
  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
}

function openDirectWhatsApp() {
  const url = `https://wa.me/${CONFIG.MY_WHATSAPP_NUMBER}?text=${encodeURIComponent("Hello! I want to inquire about menu and reservations.")}`;
  window.open(url, '_blank');
}