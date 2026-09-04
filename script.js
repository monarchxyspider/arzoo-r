// Global Configuration
const CONFIG = {
  MY_WHATSAPP_NUMBER: "923155593205",
  AUTH_HASH: "0ac4bbd11735d68e2c7e29452d57548727cfb7076cf3f3fafdeb942d980bf5af"
};

// Initial Dishes Data
let defaultDishes = [
  { id: 1, name: "Chicken Mutton Karahi", price: 1800, img: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300" },
  { id: 2, name: "Special BBQ Platter", price: 1400, img: "https://images.unsplash.com/photo-1544025162-d76694265947?w=300" },
  { id: 3, name: "Chicken Biryani", price: 350, img: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300" }
];

let dishes = JSON.parse(localStorage.getItem('restaurant_dishes')) || defaultDishes;
let cart = {};
let orders = JSON.parse(localStorage.getItem('restaurant_orders')) || [];

// Main Initialization Event
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

  // Mobile Hamburger Drawer Logic
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const navLinks = document.getElementById('navLinks');

  if (hamburgerBtn && navLinks) {
    hamburgerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navLinks.classList.toggle('active');
    });

    // Close menu when link clicked
    document.querySelectorAll('.nav-links a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
      });
    });

    // Close menu on outside click
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

// Order Creation
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

function handleOrderSubmit(e) {
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

  orders.push(newOrder);
  localStorage.setItem('restaurant_orders', JSON.stringify(orders));

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
  alert("Order Sent to WhatsApp & Saved!");
}

async function hashPasskey(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

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

window.markOrderDone = function(orderId) {
  orders = orders.map(o => o.id === orderId ? { ...o, status: 'Completed' } : o);
  localStorage.setItem('restaurant_orders', JSON.stringify(orders));
  renderAdminOrders();
};

function handleAddDish(e) {
  e.preventDefault();

  const name = document.getElementById('newDishName').value.trim();
  const price = parseFloat(document.getElementById('newDishPrice').value);
  const img = document.getElementById('newDishImg').value.trim();

  const newDish = { id: Date.now(), name, price, img };
  dishes.push(newDish);
  localStorage.setItem('restaurant_dishes', JSON.stringify(dishes));

  renderDishes();
  document.getElementById('addDishForm').reset();
  alert("New Dish Added Successfully!");
}

function scrollToContact(e) {
  e.preventDefault();
  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
}

function openDirectWhatsApp() {
  const url = `https://wa.me/${CONFIG.MY_WHATSAPP_NUMBER}?text=${encodeURIComponent("Hello! I want to inquire about menu and reservations.")}`;
  window.open(url, '_blank');
}