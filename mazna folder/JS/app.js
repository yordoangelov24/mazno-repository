import { db, auth } from "./firebase-config.js";

import { collection, getDocs, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- 🔔 ФУНКЦИЯ ЗА ИЗВЕСТИЯ (TOAST) ---
export function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    
    // Ако случайно си забравил да сложиш контейнера в HTML-а, го създаваме тук:
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'info') icon = 'ℹ️';

    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">${message}</div>
    `;

    container.appendChild(toast);

    // Изчезване след 3 секунди
    setTimeout(() => {
        toast.classList.add('hide');
        toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
}

// Правим я глобална, за да я ползваме и в конзолата ако трябва
window.showToast = showToast;


// --- 📦 ДАННИ И ПРОМЕНЛИВИ ---
let products = [];
let recipes = [];
let cart = [];
let currentCategory = "all";
let currentUser = null;

// --- 🚀 START UP ---
document.addEventListener("DOMContentLoaded", async () => {
  const searchInput = document.getElementById("searchInput");
  const clearBtn = document.getElementById("clearBtn");
  const generateBtn = document.getElementById("generateBtn");
// --- 🌗 DARK MODE LOGIC ---
  const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');
  const currentTheme = localStorage.getItem('theme'); // Проверяваме дали е запомнено

  // 1. Ако потребителят е избрал тъмно преди, го пускаме веднага
  if (currentTheme) {
      document.body.classList.add(currentTheme);
      if (currentTheme === 'dark-mode') {
          toggleSwitch.checked = true;
      }
  }

  // 2. Слушаме за цъкане на бутона
  if (toggleSwitch) {
      toggleSwitch.addEventListener('change', function(e) {
          if (e.target.checked) {
              document.body.classList.add('dark-mode');
              localStorage.setItem('theme', 'dark-mode'); // Запомни за другия път
              showToast("🌙 Нощен режим активиран", "info");
          } else {
              document.body.classList.remove('dark-mode');
              localStorage.setItem('theme', 'light-mode'); // Запомни за другия път
              showToast("☀️ Дневен режим активиран", "success");
          }
      });
  }
  // 1. Теглим данните
  await loadDataFromFirebase();

  // 2. Рендираме (рисуваме)
  updateCart();

  // 3. Слушатели (Listeners)
  if (searchInput) searchInput.addEventListener("input", filterProducts);

  // Категории (Chips / Menu)
  const menuBtns = document.querySelectorAll(".menu-btn, .chip");
  menuBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
        // Махаме active от всички
        menuBtns.forEach(b => b.classList.remove("active"));
        // Слагаме на натиснатия
        e.currentTarget.classList.add("active");
        
        currentCategory = e.currentTarget.dataset.category;
        filterProducts();
    });
  });

  if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if(cart.length === 0) return;
        cart = [];
        updateCart();
        document.getElementById("recipeBox").style.display = "none";
        showToast("Кошницата е изчистена!", "info");
      });
  }

  if (generateBtn) generateBtn.addEventListener("click", generateRecipe);

  setupAuthListeners();
});

// --- 🔥 FIREBASE FETCH ---
export async function loadDataFromFirebase() {
  const pList = document.getElementById("productList");
  pList.innerHTML = "<div style='padding:20px; text-align:center;'>⏳ Зареждане на продукти...</div>";

  try {
    const prodSnap = await getDocs(collection(db, "products"));
    products = prodSnap.docs.map(doc => {
        return { id: Number(doc.id), ...doc.data() }; 
    });

    const recSnap = await getDocs(collection(db, "recipes"));
    recipes = recSnap.docs.map(doc => doc.data());

    console.log("✅ Данните са обновени!");
    filterProducts(); // Показваме продуктите
  } catch (err) {
    console.error("Грешка:", err);
    pList.innerHTML = "❌ Грешка при връзка със сървъра.";
    showToast("Грешка при зареждане на данните", "error");
  }
}

// --- 🔐 AUTH LOGIC (ВХОД / РЕГИСТРАЦИЯ) ---
function setupAuthListeners() {
    const modal = document.getElementById("authModal");
    const authBtnSide = document.getElementById("authBtn"); // Бутона в Sidebar-а
    const authBtnNav = document.getElementById("authBtnNav"); // Ако имаш такъв в мобилно меню
    const closeSpan = document.querySelector(".close");

    // Функция за отваряне на модала или изход
    const handleAuthClick = () => {
        if (currentUser) {
            signOut(auth).then(() => {
                showToast("Довиждане! Излязохте успешно.", "info");
                // window.location.reload(); // Не е задължително да релоудваме, но чисти екрана
            });
        } else {
            modal.style.display = "flex";
        }
    };

    if (authBtnSide) authBtnSide.onclick = handleAuthClick;
    if (authBtnNav) authBtnNav.onclick = handleAuthClick;

    if (closeSpan) closeSpan.onclick = () => modal.style.display = "none";
    window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; };
    
    // Превключване Вход <-> Регистрация
    document.getElementById("showRegister").onclick = () => {
        document.getElementById("loginForm").style.display = "none";
        document.getElementById("registerForm").style.display = "block";
    };
    document.getElementById("showLogin").onclick = () => {
        document.getElementById("registerForm").style.display = "none";
        document.getElementById("loginForm").style.display = "block";
    };

    // --- РЕГИСТРАЦИЯ ---
    document.getElementById("regSubmitBtn").addEventListener("click", async () => {
        const email = document.getElementById("regEmail").value;
        const pass = document.getElementById("regPass").value;
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            await setDoc(doc(db, "users", userCredential.user.uid), {
                email: email, role: "user", favorites: []
            });
            showToast("Успешна регистрация! Добре дошли!", "success");
            modal.style.display = "none";
        } catch (error) { 
            showToast(error.message, "error");
        }
    });

    // --- ВХОД ---
    document.getElementById("loginSubmitBtn").addEventListener("click", async () => {
        const email = document.getElementById("loginEmail").value;
        const pass = document.getElementById("loginPass").value;
        try {
            await signInWithEmailAndPassword(auth, email, pass);
            showToast("Влязохте успешно!", "success");
            modal.style.display = "none";
        } catch (error) { 
            showToast("Грешен имейл или парола!", "error");
        }
    });

    // Следене на статуса (Logged In/Out)
    onAuthStateChanged(auth, async (user) => {
        const btnSide = document.getElementById("authBtn");
        
        if (user) {
            // АКО Е ВЛЕЗНАЛ
            currentUser = user;
            if(btnSide) {
                // Слагаме иконка врата
                btnSide.innerHTML = `🚪 Изход <span style="font-size:10px; opacity:0.7">(${user.email.split('@')[0]})</span>`;
            }
            
            // Проверка за админ
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists() && userDoc.data().role === "admin") {
                const adminFab = document.getElementById("adminFab");
                if(adminFab) adminFab.style.display = "flex"; 
                showToast("Админ права активирани 👑", "info");
            }
        } else {
            // АКО НЕ Е ВЛЕЗНАЛ (ТУК БЕШЕ ПРОБЛЕМА С ТЕКСТА)
            currentUser = null;
            if(btnSide) btnSide.innerHTML = "🔑 Вход / Регистрация";
            
            const adminFab = document.getElementById("adminFab");
            if(adminFab) adminFab.style.display = "none";
        }
    });
}

// --- 🛒 КОЛИЧКА (CART LOGIC) ---
function addToCart(product) {
  const existing = cart.find(i => i.id === product.id);
  if (!existing) {
      cart.push({ ...product, qty: 1 });
      showToast(`Добавихте ${product.name}`, "success"); // <-- ИЗВЕСТИЕ ТУК
  } else {
      existing.qty++;
      showToast(`Увеличихте количеството на ${product.name}`, "info");
  }
  updateCart();
}

function updateCart() {
  const container = document.getElementById("itemsContainer");
  const emptyMsg = document.getElementById("cartEmpty");
  const countTag = document.getElementById("countTag");
  
  container.innerHTML = "";

  if (cart.length === 0) {
    if(emptyMsg) emptyMsg.style.display = "block";
    container.style.display = "none";
    if(countTag) countTag.style.display = "none";
  } else {
    if(emptyMsg) emptyMsg.style.display = "none";
    container.style.display = "flex";
    if(countTag) {
        countTag.textContent = cart.length;
        countTag.style.display = "inline-block";
    }

    cart.forEach(item => {
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <div class="qty">${item.qty}</div>
        <div class="meta"><div class="name">${item.name}</div></div>
        <button class="rm-btn" style="background:none; border:none; cursor:pointer;">❌</button>
      `;
      div.querySelector(".rm-btn").addEventListener("click", () => removeFromCart(item.id));
      container.appendChild(div);
    });
  }
  updateNutrition();
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  updateCart();
}

function updateNutrition() {
  const totals = cart.reduce((acc, item) => {
    acc.protein += (item.protein || 0) * item.qty;
    acc.fat += (item.fat || 0) * item.qty;
    return acc;
  }, { protein: 0, fat: 0 });

  updateBar("protein", totals.protein, 100);
  updateBar("fat", totals.fat, 70);
}

function updateBar(type, value, limit) {
  const percent = Math.min((value / limit) * 100, 100);
  const bar = document.getElementById(`${type}Bar`);
  const label = document.getElementById(`${type}Val`);
  
  if (bar && label) {
      bar.style.width = percent + "%";
      label.textContent = `${value.toFixed(1)}g / ${limit}g`;
  }
}

// --- 👨‍🍳 РЕЦЕПТИ ---
function generateRecipe() {
  const recipeBox = document.getElementById("recipeBox");
  const recipeText = document.getElementById("recipeText");
  
  if (cart.length === 0) {
    showToast("Кошницата е празна! Добави продукти.", "error");
    return;
  }

  const cartIds = cart.map(i => i.id);
  // Търсим пълно съвпадение
  const possibleRecipes = recipes.filter(r => r.ingredients.every(id => cartIds.includes(id)));
  possibleRecipes.sort((a, b) => b.ingredients.length - a.ingredients.length);
  
  let matchedRecipe = possibleRecipes.length > 0 ? possibleRecipes[0] : null;

  // Ако няма, търсим частично
  if (!matchedRecipe) {
    let almostMatch = recipes.find(r => {
       const missing = r.ingredients.filter(id => cartIds.includes(id));
       return missing.length > 0 && missing.length <= 2;
    });

    if (almostMatch) {
      const missingIds = almostMatch.ingredients.filter(id => !cartIds.includes(id));
      const missingProducts = products.filter(p => missingIds.includes(p.id));
      const names = missingProducts.map(p => p.name).join(", ");
      
      // Тук ползваме confirm, защото изисква отговор ДА/НЕ
      if (confirm(`За "${almostMatch.title}" ви липсват: ${names}. Да ги добавя ли?`)) {
        missingProducts.forEach(p => {
            const ex = cart.find(i => i.id === p.id);
            if(!ex) cart.push({...p, qty: 1});
            else ex.qty++;
        });
        updateCart(); 
        matchedRecipe = almostMatch;
        showToast("Продуктите са добавени автоматично!", "success");
      }
    }
  }

  // Смятане на калории
  const total = cart.reduce((acc, item) => ({
    calories: acc.calories + item.calories * item.qty,
    protein: acc.protein + item.protein * item.qty,
    fat: acc.fat + item.fat * item.qty,
  }), { calories: 0, protein: 0, fat: 0 });

  recipeBox.style.display = "block";
  
  if (matchedRecipe) {
    recipeText.innerHTML = `
        <h3 style="color:var(--primary)">${matchedRecipe.title}</h3>
        <p><strong>Ниво:</strong> ${matchedRecipe.level}</p>
        <p>${matchedRecipe.description}</p>
        <hr style="border:0; border-top:1px solid #ddd; margin:10px 0;">
        <p><strong>📊 Общо за продуктите:</strong><br> 
        Кал: ${total.calories.toFixed(0)} | Пр: ${total.protein.toFixed(1)}g | М: ${total.fat.toFixed(1)}g</p>
    `;
    showToast("Рецептата е намерена!", "success");
  } else {
    recipeText.innerHTML = `
        <h3>Няма точна рецепта 🤷‍♂️</h3>
        <p>Пробвай да сготвиш нещо с: <b>${cart.map(i => i.name).join(", ")}</b></p>
        <hr>
        <p>Кал: ${total.calories.toFixed(0)} | Пр: ${total.protein.toFixed(1)}g | М: ${total.fat.toFixed(1)}g</p>
    `;
    showToast("Няма намерена точна рецепта.", "info");
  }
}

// --- 🔍 ТЪРСЕНЕ И ФИЛТЪР ---
function filterProducts() {
  const term = document.getElementById("searchInput").value.toLowerCase();
  const filtered = products.filter(p => {
    return p.name.toLowerCase().includes(term) && (currentCategory === "all" || p.category === currentCategory);
  });
  renderProducts(filtered);
}

// --- 🎨 RENDER PRODUCTS (С АНИМАЦИЯ) ---
function renderProducts(list) {
  const productList = document.getElementById("productList");
  productList.innerHTML = "";
  
  if (list.length === 0) { 
      productList.innerHTML = "<div style='grid-column: span 3; text-align:center; padding:20px; color:var(--text-muted)'>Няма намерени продукти.</div>"; 
      return; 
  }

  list.forEach((p, index) => {
    const div = document.createElement("div");
    div.className = "product";
    
    // 🔥 МАГИЯТА ЗА АНИМАЦИЯТА (Закъснение според номера)
    div.style.animationDelay = `${index * 0.05}s`; 

    div.innerHTML = `
      <div class="p-thumb">${p.name.charAt(0)}</div>
      <div class="p-info">
        <div class="p-name">${p.name}</div>
        <div class="p-nutrition">${p.calories} kcal</div>
      </div>
      <button class="add-btn">Добави</button>
    `;
    
    div.querySelector("button").addEventListener("click", () => addToCart(p));
    
    productList.appendChild(div);
  });
}