import { db, auth } from './firebase.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js';
import Notifier from './notifications.js';

const notifier = new Notifier();

document.addEventListener('DOMContentLoaded', async () => {
  // Get order ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('orderId');
  
  if (!orderId) {
    window.location.href = '/menu.html';
    return;
  }
  
  // Display order ID
  document.getElementById('orderId').textContent = `#${orderId}`;
  
  // Load order details
  await loadOrderDetails(orderId);
  
  // Set up event listeners
  document.getElementById('trackOrderBtn').addEventListener('click', () => {
    window.location.href = `/orders.html?orderId=${orderId}`;
  });
  
  document.getElementById('backToMenuBtn').addEventListener('click', () => {
    window.location.href = '/menu.html';
  });
  
  document.getElementById('signOutBtn').addEventListener('click', signOut);
  
  // Load user photo if available
  if (auth.currentUser?.photoURL) {
    document.getElementById('userPhoto').src = auth.currentUser.photoURL;
  }
});

async function loadOrderDetails(orderId) {
  try {
    const orderDoc = await getDoc(doc(db, 'orders', orderId));
    
    if (!orderDoc.exists()) {
      notifier.show('Order not found', 'error');
      return;
    }
    
    const order = orderDoc.data();
    const orderDetails = document.getElementById('orderDetails');
    
    orderDetails.innerHTML = `
      <div class="detail-row">
        <span>Delivery To:</span>
        <span>${order.customer.name}, ${order.customer.address}</span>
      </div>
      <div class="detail-row">
        <span>Contact:</span>
        <span>${order.customer.phone}</span>
      </div>
      <div class="detail-row">
        <span>Payment Method:</span>
        <span>${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</span>
      </div>
      <div class="detail-row total">
        <span>Order Total:</span>
        <span>₹${order.total.toFixed(2)}</span>
      </div>
    `;
    
  } catch (error) {
    console.error("Error loading order details:", error);
    notifier.show('Failed to load order details', 'error');
  }
}

async function signOut() {
  try {
    await auth.signOut();
    window.location.href = '/';
  } catch (error) {
    notifier.show('Sign out failed: ' + error.message, 'error');
  }
}