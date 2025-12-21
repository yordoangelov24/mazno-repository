// ==========================================
// 1. ИМПОРТИ (Всичко на едно място)
// ==========================================
import { db, auth } from "./firebase-config.js";

import { 
    collection, 
    getDocs, 
    doc, 
    getDoc, 
    setDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ==========================================
// 2. ГЛОБАЛНИ ПРОМЕНЛИВИ
// ==========================================
let products = [];
let recipes = [];
let cart = [];
let currentCategory = "all";
let currentUser = null;

// ==========================================
// 3. ПОМОЩНИ ФУНКЦИИ (Toast)
// ==========================================
export function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    
    // Създаваме контейнера динамично, ако липсва
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = type === 'error' ? '❌' : (type === 'info' ? 'ℹ️' : '✅');

    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">${message}</div>
    `;

    container.appendChild(toast);

    // Самоизтриване след 3 секунди
    setTimeout(() => {
        toast.classList.add('hide');
        toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
}
// Правим я достъпна глобално
window.showToast = showToast;

// ==========================================
// 4. СТАРТИРАНЕ (Main Logic)
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
    
    // --- Dark Mode ---
    const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');
    const currentTheme = localStorage.getItem('theme');

    if (currentTheme) {
        document.body.classList.add(currentTheme);
        if (currentTheme === 'dark-mode' && toggleSwitch) toggleSwitch.checked = true;
    }

    if (toggleSwitch) {
        toggleSwitch.addEventListener('change', function(e) {
            if (e.target.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark-mode');
                showToast("🌙 Нощен режим", "info");
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('theme', 'light-mode');
                showToast("☀️ Дневен режим", "success");
            }
        });
    }

    // --- Зареждане на данни ---
    await loadDataFromFirebase();
    updateCart();

    // --- Търсачка и Филтри ---
    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.addEventListener("input", filterProducts);

    // Категории (Chips)
    const menuBtns = document.querySelectorAll(".menu-btn, .chip");
    menuBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            menuBtns.forEach(b => b.classList.remove("active"));
            e.currentTarget.classList.add("active");
            currentCategory = e.currentTarget.dataset.category;
            filterProducts();
        });
    });

    // Бутони за количка
    const clearBtn = document.getElementById("clearBtn");
    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            if(cart.length === 0) return;
            cart = [];
            updateCart();
            document.getElementById("recipeBox").style.display = "none";
            showToast("Кошницата е изчистена!", "info");
        });
    }

    const generateBtn = document.getElementById("generateBtn");
    if (generateBtn) generateBtn.addEventListener("click", generateRecipe);

    // --- Активиране на Логин системата ---
    setupAuthListeners();
});

// ==========================================
// 5. FIREBASE ДАННИ
// ==========================================
export async function loadDataFromFirebase() {
    const pList = document.getElementById("productList");
    pList.innerHTML = "<div style='padding:20px; text-align:center;'>⏳ Зареждане...</div>";

    try {
        const prodSnap = await getDocs(collection(db, "products"));
        products = prodSnap.docs.map(doc => ({ id: Number(doc.id), ...doc.data() }));

        const recSnap = await getDocs(collection(db, "recipes"));
        recipes = recSnap.docs.map(doc => doc.data());

        filterProducts(); 
    } catch (err) {
        console.error("Firebase Error:", err);
        pList.innerHTML = "❌ Грешка при връзка със сървъра.";
        showToast("Грешка при зареждане", "error");
    }
}

// ==========================================
// 6. АУТЕНТИКАЦИЯ (ВСИЧКО ЗА ПРОФИЛА)
// ==========================================
function setupAuthListeners() {
    const modal = document.getElementById("authModal");
    const authBtnSide = document.getElementById("authBtn");
    const closeSpan = document.querySelector(".close");

    // --- Отваряне / Изход ---
    const handleAuthClick = () => {
        if (currentUser) {
            signOut(auth).then(() => showToast("Довиждане!", "info"));
        } else {
            if(modal) modal.style.display = "flex";
        }
    };
    if (authBtnSide) authBtnSide.onclick = handleAuthClick;

    // --- Затваряне на модала ---
    if (closeSpan) closeSpan.onclick = () => modal.style.display = "none";
    window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; };

    // --- Табове (Вход / Регистрация) ---
    const tabLogin = document.getElementById("tabLogin");
    const tabRegister = document.getElementById("tabRegister");
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    if (tabLogin && tabRegister) {
        tabLogin.addEventListener("click", () => {
            loginForm.style.display = "block";
            registerForm.style.display = "none";
            tabLogin.classList.add("active");
            tabRegister.classList.remove("active");
        });
        tabRegister.addEventListener("click", () => {
            loginForm.style.display = "none";
            registerForm.style.display = "block";
            tabRegister.classList.add("active");
            tabLogin.classList.remove("active");
        });
    }

    // --- Очички (Покажи парола) ---
    function setupEye(toggleId, inputId) {
        const eyeBtn = document.getElementById(toggleId);
        const input = document.getElementById(inputId);
        if (eyeBtn && input) {
            eyeBtn.addEventListener("click", () => {
                const type = input.getAttribute("type") === "password" ? "text" : "password";
                input.setAttribute("type", type);
                eyeBtn.classList.toggle("fa-eye");
                eyeBtn.classList.toggle("fa-eye-slash");
            });
        }
    }
    setupEye("toggleLoginPass", "loginPass");
    setupEye("toggleRegPass", "regPass");

    // --- Регистрация ---
    const regBtn = document.getElementById("regSubmitBtn");
    if(regBtn) {
        regBtn.addEventListener("click", async () => {
            const email = document.getElementById("regEmail").value;
            const pass = document.getElementById("regPass").value;
            try {
                const cred = await createUserWithEmailAndPassword(auth, email, pass);
                // Създаваме запис в Firestore
                await setDoc(doc(db, "users", cred.user.uid), {
                    email: email, role: "user", favorites: []
                });
                showToast("Успешна регистрация!", "success");
                modal.style.display = "none";
            } catch (error) { 
                showToast(error.message, "error");
            }
        });
    }

    // --- Вход (С АНИМАЦИЯ & SHAKE) ---
    const logBtn = document.getElementById("loginSubmitBtn");
    if(logBtn) {
        logBtn.addEventListener("click", async () => {
            const email = document.getElementById("loginEmail").value;
            const pass = document.getElementById("loginPass").value;
            
            // Запазваме текста и пускаме спинър
            const originalText = logBtn.innerHTML;
            logBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Влизане...`;
            logBtn.disabled = true;

            try {
                await signInWithEmailAndPassword(auth, email, pass);
                showToast("Влязохте успешно!", "success");
                document.getElementById("authModal").style.display = "none";
            } catch (error) { 
                showToast("Грешен имейл или парола!", "error");
                
                // Ефект на разтрисане (Shake)
                const modalContent = document.querySelector(".modal-content");
                if(modalContent) {
                    modalContent.classList.add("shake-animation");
                    setTimeout(() => modalContent.classList.remove("shake-animation"), 500);
                }
            } finally {
                // Връщаме бутона
                logBtn.innerHTML = originalText;
                logBtn.disabled = false;
            }
        });
    }

    // --- Забравена парола ---
    const forgotBtn = document.getElementById("forgotPassBtn");
    if (forgotBtn) {
        forgotBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value;
            if (!email) {
                showToast("Първо въведете имейл горе! 👆", "info");
                return;
            }
            try {
                await sendPasswordResetEmail(auth, email);
                showToast("📧 Линкът е изпратен на пощата!", "success");
            } catch (error) {
                showToast("Грешка при изпращане.", "error");
            }
        });
    }

    // --- Сила на паролата ---
    const regPassInput = document.getElementById("regPass");
    const sFill = document.getElementById("strengthFill");
    const sText = document.getElementById("strengthText");

    if (regPassInput && sFill) {
        regPassInput.addEventListener("input", () => {
            const val = regPassInput.value;
            let score = 0;
            // Точки
            if (val.length > 5) score++;
            if (val.length > 8) score++;
            if (/[0-9]/.test(val)) score++; 
            if (/[^A-Za-z0-9]/.test(val)) score++;

            // Визуализация
            if (val.length === 0) {
                sFill.style.width = "0%";
                sText.textContent = "Парола...";
                sText.style.color = "#888";
            } else if (score < 2) {
                sFill.style.width = "30%";
                sFill.className = "weak-pass";
                sText.textContent = "Слаба 😟";
                sText.style.color = "#ff4757";
            } else if (score < 4) {
                sFill.style.width = "60%";
                sFill.className = "medium-pass";
                sText.textContent = "Става 😐";
                sText.style.color = "#ffa502";
            } else {
                sFill.style.width = "100%";
                sFill.className = "strong-pass";
                sText.textContent = "Бетон! 💪";
                sText.style.color = "#2ed573";
            }
        });
    }

    // --- Следене на статус (Check Auth) ---
    onAuthStateChanged(auth, async (user) => {
        const btnSide = document.getElementById("authBtn");
        
        if (user) {
            currentUser = user;
            if(btnSide) btnSide.innerHTML = `🚪 Изход`;
            
            // Админ проверка
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists() && userDoc.data().role === "admin") {
                    const adminFab = document.getElementById("adminFab");
                    if(adminFab) adminFab.style.display = "flex"; 
                    showToast("Admin Mode 👑", "info");
                }
            } catch(e) { console.error(e); }
        } else {
            currentUser = null;
            if(btnSide) btnSide.innerHTML = "🔑 Вход";
            const adminFab = document.getElementById("adminFab");
            if(adminFab) adminFab.style.display = "none";
        }
    });
}

// ==========================================
// 7. КОЛИЧКА & ПРОДУКТИ
// ==========================================
function addToCart(product) {
    const existing = cart.find(i => i.id === product.id);
    if (!existing) {
        cart.push({ ...product, qty: 1 });
        showToast(`Добавихте ${product.name}`, "success");
    } else {
        existing.qty++;
        showToast(`Увеличихте ${product.name}`, "info");
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

// Изчисляване на протеин/мазнини
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

// ==========================================
// 8. РЕЦЕПТИ (Logic Generator)
// ==========================================
function generateRecipe() {
    const recipeBox = document.getElementById("recipeBox");
    const recipeText = document.getElementById("recipeText");
    
    if (cart.length === 0) {
        showToast("Кошницата е празна!", "error");
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
            
            if (confirm(`За "${almostMatch.title}" липсват: ${names}. Да ги добавя ли?`)) {
                missingProducts.forEach(p => {
                    const ex = cart.find(i => i.id === p.id);
                    if(!ex) cart.push({...p, qty: 1});
                    else ex.qty++;
                });
                updateCart(); 
                matchedRecipe = almostMatch;
                showToast("Продуктите са добавени!", "success");
            }
        }
    }

    // Калории
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
            <p>📊 <strong>Общо:</strong> Кал: ${total.calories.toFixed(0)} | Пр: ${total.protein.toFixed(1)}g</p>
        `;
        showToast("Рецептата е намерена!", "success");
    } else {
        recipeText.innerHTML = `
            <h3>Няма точна рецепта 🤷‍♂️</h3>
            <p>Пробвай да сготвиш нещо с наличните продукти.</p>
            <hr>
            <p>Кал: ${total.calories.toFixed(0)} | Пр: ${total.protein.toFixed(1)}g</p>
        `;
        showToast("Няма намерена точна рецепта.", "info");
    }
}

// ==========================================
// 9. RENDER (Показване на екрана)
// ==========================================
function filterProducts() {
    const term = document.getElementById("searchInput").value.toLowerCase();
    const filtered = products.filter(p => {
        return p.name.toLowerCase().includes(term) && (currentCategory === "all" || p.category === currentCategory);
    });
    renderProducts(filtered);
}

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