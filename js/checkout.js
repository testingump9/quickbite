import { db, auth } from './firebase.js';
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js';
import Notifier from './notifications.js';

const notifier = new Notifier();
const MIN_ORDER_AMOUNT = 25;
let cart = JSON.parse(localStorage.getItem('cart')) || [];

document.addEventListener('DOMContentLoaded', () => {
  // Load cart items
  loadOrderSummary();
  
  // Set up event listeners
  document.getElementById('checkoutForm').addEventListener('submit', placeOrder);
  document.getElementById('returnToMenu').addEventListener('click', () => {
    window.location.href = '/menu.html';
  });
  
  // Load user data if available
  if (auth.currentUser) {
    const userRef = doc(db, 'users', auth.currentUser.uid);
    getDoc(userRef).then(doc => {
      if (doc.exists()) {
        const userData = doc.data();
        document.getElementById('name').value = userData.name || '';
        document.getElementById('phone').value = userData.phone || '';
        document.getElementById('address').value = userData.address || '';
      }
    });
    
    if (auth.currentUser.photoURL) {
      document.getElementById('userPhoto').src = auth.currentUser.photoURL;
    }
  }
  
  // Disable online payment option
  document.querySelector('input[value="online"]').disabled = true;
});

function loadOrderSummary() {
  const orderItems = document.getElementById('orderItems');
  const subtotal = document.getElementById('subtotal');
  const grandTotal = document.getElementById('grandTotal');
  const progressBar = document.getElementById('checkoutProgress');
  const progressText = document.getElementById('checkoutProgressText');
  
  // Calculate total
  let total = 0;
  orderItems.innerHTML = '';
  
  if (cart.length === 0) {
    orderItems.innerHTML = '<p>Your cart is empty</p>';
    window.location.href = '/menu.html';
    return;
  }
  
  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    
    const orderItem = document.createElement('div');
    orderItem.className = 'order-item';
    orderItem.innerHTML = `
      <div class="item-info">
        <span class="item-name">${item.quantity} × ${item.name}</span>
        <span class="item-price">₹${itemTotal.toFixed(2)}</span>
      </div>
    `;
    orderItems.appendChild(orderItem);
  });
  
  // Update totals
  subtotal.textContent = `₹${total.toFixed(2)}`;
  grandTotal.textContent = `₹${total.toFixed(2)}`;
  
  // Update progress
  const progressPercent = Math.min((total / MIN_ORDER_AMOUNT) * 100, 100);
  progressBar.style.width = `${progressPercent}%`;
  progressText.textContent = `₹${total.toFixed(2)}/₹${MIN_ORDER_AMOUNT}`;
  
  if (total < MIN_ORDER_AMOUNT) {
    progressBar.style.backgroundColor = '#FF9800';
    progressText.style.color = '#E65100';
    document.getElementById('placeOrderBtn').disabled = true;
    document.getElementById('placeOrderBtn').classList.add('disabled');
  } else {
    progressBar.style.backgroundColor = '#4CAF50';
    progressText.style.color = '#2E7D32';
    document.getElementById('placeOrderBtn').disabled = false;
    document.getElementById('placeOrderBtn').classList.remove('disabled');
  }
}

async function placeOrder(e) {
  e.preventDefault();
  
  // Get form values
  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const address = document.getElementById('address').value.trim();
  const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
  
  // Validate form
  if (!name || !phone || !address) {
    notifier.show('Please fill in all fields', 'warning');
    return;
  }
  
  // Validate phone number
  if (!/^\d{10}$/.test(phone)) {
    notifier.show('Please enter a valid 10-digit phone number', 'warning');
    return;
  }
  
  // Calculate total
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Validate minimum order amount
  if (total < MIN_ORDER_AMOUNT) {
    notifier.show(`Add ₹${(MIN_ORDER_AMOUNT - total).toFixed(2)} more to place your order`, 'warning');
    
    // Highlight progress bar
    const progressBar = document.getElementById('checkoutProgress');
    progressBar.classList.add('highlight-error');
    setTimeout(() => {
      progressBar.classList.remove('highlight-error');
    }, 2000);
    
    return;
  }
  
  // Create order object
  const order = {
    customer: { name, phone, address },
    items: cart.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    })),
    total,
    paymentMethod,
    status: 'pending',
    createdAt: serverTimestamp(),
    userId: auth.currentUser?.uid || null
  };
  
  try {
    // Add to Firestore
    const docRef = await addDoc(collection(db, 'orders'), order);
    
    // Clear cart
    cart = [];
    localStorage.removeItem('cart');
    
    // Show success message
    notifier.show('Order placed successfully!', 'success', 5000);
    
    // Redirect to thank you page
    setTimeout(() => {
      window.location.href = `/thank-you.html?orderId=${docRef.id}`;
    }, 2000);
    
  } catch (error) {
    console.error("Error placing order:", error);
    notifier.show('Failed to place order. Please try again.', 'error');
  }
}