import { db, auth } from './firebase.js';
import { collection, getDocs, query, where, orderBy } from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js';
import Notifier from './notifications.js';

const notifier = new Notifier();
let menuItems = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];

document.addEventListener('DOMContentLoaded', async () => {
  // Load menu items
  await loadMenuItems();
  
  // Set up event listeners
  document.getElementById('searchInput').addEventListener('input', filterMenuItems);
  document.getElementById('categoryFilter').addEventListener('change', filterMenuItems);
  document.getElementById('viewCart').addEventListener('click', toggleCart);
  document.getElementById('signOutBtn').addEventListener('click', signOut);
  document.querySelector('.close-cart').addEventListener('click', toggleCart);
  
  // Update cart count
  updateCartCount();
  
  // Load user photo if available
  if (auth.currentUser?.photoURL) {
    document.getElementById('userPhoto').src = auth.currentUser.photoURL;
  }
});

async function loadMenuItems() {
  const menuContainer = document.getElementById('menuContainer');
  menuContainer.innerHTML = '<p>Loading menu...</p>';
  
  try {
    const q = query(collection(db, 'menuItems'), orderBy('name'));
    const querySnapshot = await getDocs(q);
    
    menuItems = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    renderMenuItems(menuItems);
  } catch (error) {
    console.error("Error loading menu items:", error);
    menuContainer.innerHTML = '<p>Failed to load menu. Please try again.</p>';
    notifier.show('Failed to load menu items', 'error');
  }
}

function renderMenuItems(items) {
  const menuContainer = document.getElementById('menuContainer');
  
  if (items.length === 0) {
    menuContainer.innerHTML = '<p>No menu items found</p>';
    return;
  }
  
  menuContainer.innerHTML = '';
  
  items.forEach(item => {
    const menuItem = document.createElement('div');
    menuItem.className = 'menu-item';
    menuItem.innerHTML = `
      <div class="item-image">
        <img src="${item.image || 'images/menu-items/default.jpg'}" alt="${item.name}">
      </div>
      <div class="item-details">
        <h3>${item.name}</h3>
        <p class="item-description">${item.description}</p>
        <div class="item-footer">
          <span class="item-price">₹${item.price.toFixed(2)}</span>
          <button class="btn add-to-cart" data-id="${item.id}">Add to Cart</button>
        </div>
      </div>
    `;
    
    menuContainer.appendChild(menuItem);
    
    // Add event listener
    menuItem.querySelector('.add-to-cart').addEventListener('click', () => {
      addToCart(item);
    });
  });
}

function filterMenuItems() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const category = document.getElementById('categoryFilter').value;
  
  const filtered = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm) || 
                         item.description.toLowerCase().includes(searchTerm);
    const matchesCategory = category === 'all' || item.category === category;
    return matchesSearch && matchesCategory;
  });
  
  renderMenuItems(filtered);
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
  
  // Update cart in localStorage
  localStorage.setItem('cart', JSON.stringify(cart));
  
  // Update UI
  updateCartCount();
  updateCartUI();
  
  // Show notification
  notifier.show(`${item.name} added to cart`, 'success');
  
  // Show cart if hidden
  document.querySelector('.cart-sidebar').classList.add('active');
}

function updateCartCount() {
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  document.getElementById('cartCount').textContent = totalItems;
}

function toggleCart() {
  document.querySelector('.cart-sidebar').classList.toggle('active');
  updateCartUI();
}

async function signOut() {
  try {
    await auth.signOut();
    localStorage.removeItem('cart');
    window.location.href = '/';
  } catch (error) {
    notifier.show('Sign out failed: ' + error.message, 'error');
  }
}