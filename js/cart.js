import { db, auth } from './firebase.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js';
import Notifier from './notifications.js';

const notifier = new Notifier();
let cart = JSON.parse(localStorage.getItem('cart')) || [];
const MIN_ORDER_AMOUNT = 25;
let popularItems = [];

document.addEventListener('DOMContentLoaded', async () => {
  // Load popular items for suggestions
  await loadPopularItems();
  
  // Initialize cart UI
  updateCartUI();
  
  // Set up event listeners
  document.getElementById('checkoutBtn').addEventListener('click', proceedToCheckout);
});

function updateCartUI() {
  const cartItems = document.getElementById('cartItems');
  const cartTotal = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const itemSuggestions = document.getElementById('itemSuggestions');
  
  // Calculate total
  let total = 0;
  cart.forEach(item => {
    total += item.price * item.quantity;
  });
  
  // Update cart items list
  cartItems.innerHTML = '';
  
  if (cart.length === 0) {
    cartItems.innerHTML = '<p>Your cart is empty</p>';
  } else {
    cart.forEach(item => {
      const cartItem = document.createElement('div');
      cartItem.className = 'cart-item';
      cartItem.innerHTML = `
        <div class="item-image">
          <img src="${item.image || 'images/menu-items/default.jpg'}" alt="${item.name}">
        </div>
        <div class="item-details">
          <h4>${item.name}</h4>
          <div class="item-controls">
            <button class="btn-quantity minus" data-id="${item.id}">-</button>
            <span class="quantity">${item.quantity}</span>
            <button class="btn-quantity plus" data-id="${item.id}">+</button>
            <span class="item-price">₹${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        </div>
        <button class="btn-remove" data-id="${item.id}">
          <span class="material-icons">delete</span>
        </button>
      `;
      
      cartItems.appendChild(cartItem);
      
      // Add event listeners
      cartItem.querySelector('.minus').addEventListener('click', () => updateQuantity(item.id, -1));
      cartItem.querySelector('.plus').addEventListener('click', () => updateQuantity(item.id, 1));
      cartItem.querySelector('.btn-remove').addEventListener('click', () => removeItem(item.id));
    });
  }
  
  // Update total and progress
  cartTotal.textContent = `₹${total.toFixed(2)}`;
  
  const progressPercent = Math.min((total / MIN_ORDER_AMOUNT) * 100, 100);
  progressBar.style.width = `${progressPercent}%`;
  progressText.textContent = `₹${total.toFixed(2)}/₹${MIN_ORDER_AMOUNT}`;
  
  // Update progress colors
  if (total < MIN_ORDER_AMOUNT) {
    progressBar.style.backgroundColor = '#FF9800';
    progressText.style.color = '#E65100';
    checkoutBtn.disabled = true;
    checkoutBtn.classList.add('disabled');
    
    // Show suggestions if available
    if (popularItems.length > 0) {
      showItemSuggestions(total);
      itemSuggestions.style.display = 'block';
    }
  } else {
    progressBar.style.backgroundColor = '#4CAF50';
    progressText.style.color = '#2E7D32';
    checkoutBtn.disabled = false;
    checkoutBtn.classList.remove('disabled');
    itemSuggestions.style.display = 'none';
  }
  
  // Update cart count in header
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById('cartCount').textContent = totalItems;
}

function updateQuantity(itemId, change) {
  const item = cart.find(item => item.id === itemId);
  
  if (item) {
    item.quantity += change;
    
    // Remove if quantity reaches 0
    if (item.quantity <= 0) {
      cart = cart.filter(i => i.id !== itemId);
      notifier.show(`${item.name} removed from cart`, 'info');
    }
    
    // Update localStorage and UI
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
  }
}

function removeItem(itemId) {
  const item = cart.find(item => item.id === itemId);
  if (item) {
    cart = cart.filter(i => i.id !== itemId);
    localStorage.setItem('cart', JSON.stringify(cart));
    notifier.show(`${item.name} removed from cart`, 'info');
    updateCartUI();
  }
}

async function loadPopularItems() {
  try {
    const q = query(collection(db, 'menuItems'), orderBy('orderCount', 'desc'), limit(5));
    const querySnapshot = await getDocs(q);
    popularItems = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error loading popular items:", error);
  }
}

function showItemSuggestions(currentTotal) {
  const neededAmount = MIN_ORDER_AMOUNT - currentTotal;
  const suggestionsContainer = document.querySelector('.suggestion-list');
  suggestionsContainer.innerHTML = '';
  
  // Find items that would help reach minimum
  const helpfulItems = popularItems.filter(item => 
    !cart.some(cartItem => cartItem.id === item.id) && // Not already in cart
    (item.price >= neededAmount || item.price >= neededAmount * 0.7) // Close to or exceeds needed amount
  ).slice(0, 3); // Show max 3 suggestions
  
  if (helpfulItems.length === 0) return;
  
  helpfulItems.forEach(item => {
    const suggestion = document.createElement('div');
    suggestion.className = 'suggestion-item';
    suggestion.innerHTML = `
      <img src="${item.image || 'images/menu-items/default.jpg'}" alt="${item.name}">
      <div class="suggestion-info">
        <h5>${item.name}</h5>
        <p>₹${item.price.toFixed(2)}</p>
      </div>
      <button class="btn-add" data-id="${item.id}">+ Add</button>
    `;
    suggestionsContainer.appendChild(suggestion);
    
    // Add click handler
    suggestion.querySelector('.btn-add').addEventListener('click', () => {
      addToCart(item);
    });
  });
}

function addToCart(item) {
  // Check if item already in cart
  const existingItem = cart.find(cartItem => cartItem.id === item.id);
  
  if (existingItem) {
    existingItem.quantity++;
  } else {
    cart.push({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1
    });
  }
  
  // Update localStorage and UI
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartUI();
  
  // Show notification
  notifier.show(`${item.name} added to cart`, 'success');
}

function proceedToCheckout() {
  // Verify minimum amount again (just in case)
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  if (total < MIN_ORDER_AMOUNT) {
    notifier.show(`Add ₹${(MIN_ORDER_AMOUNT - total).toFixed(2)} more to place your order`, 'warning');
    return;
  }
  
  // Proceed to checkout
  window.location.href = '/checkout.html';
}