// 1. ИМПОРТИ (Много важно да са най-горе!)
import { db, auth } from "./firebase-config.js";
import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Глобални променливи
let recipes = [];
let currentUser = null;

// Тази функция показва съобщенията (Тостовете)
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) return; // Защита
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = type === 'error' ? '❌' : (type === 'info' ? 'ℹ️' : '✅');
    toast.innerHTML = `<div class="toast-icon">${icon}</div><div class="toast-content">${message}</div>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('hide');
        toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
}

// 2. СТАРТИРАНЕ НА СКРИПТА
document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 JS Recipes: Зареждане...");

    // Setup на бутони и логин
    setupAuth();

    // Dark Mode
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
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('theme', 'light-mode');
            }
        });
    }

    // Филтър бутон
    const btnFav = document.getElementById("btnFavFilter");
    if (btnFav) {
        let showFavs = false;
        btnFav.addEventListener("click", () => {
            showFavs = !showFavs;
            btnFav.innerHTML = showFavs ? "📃 Покажи всички" : "❤️ Само любими";
            renderRecipes(showFavs);
        });
    }
});

// 3. АУТЕНТИКАЦИЯ (Тук е проблема с бутона)
function setupAuth() {
    const btn = document.getElementById("authBtn");
    const modal = document.getElementById("authModal");
    const closeBtn = document.querySelector(".close");

    // ЛОГИКА ЗА БУТОНА (КЛИК)
    if (btn) {
        // Премахваме всички стари event listeners като го клонираме (трик)
        // или просто слагаме нов onclick, който презаписва старите.
        btn.onclick = function() {
            console.log("🖱️ Кликнат е бутонът. User:", currentUser);
            
            if (currentUser) {
                // Ако има юзър -> Излизаме
                signOut(auth).then(() => {
                    showToast("Излязохте успешно!", "info");
                }).catch((error) => {
                    console.error(error);
                });
            } else {
                // Ако няма юзър -> Отваряме модала
                if (modal) {
                    modal.style.display = "flex";
                    console.log("🔓 Отварям модала...");
                } else {
                    console.error("❌ Грешка: Модалът липсва в HTML-а!");
                }
            }
        };
    } else {
        console.error("❌ Грешка: Бутонът authBtn не е намерен!");
    }

    // СЛУШАТЕЛ ЗА FIREBASE (Само сменя текста и зарежда рецепти)
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("✅ Потребител: Влязъл");
            currentUser = user;
            if (btn) btn.innerHTML = "🚪 Изход";
            loadRecipes(); 
        } else {
            console.log("👤 Потребител: Гост");
            currentUser = null;
            if (btn) btn.innerHTML = "🔑 Вход";
            loadRecipes();
        }
    });

    // МОДАЛ ЛОГИКА (Затваряне)
    if (closeBtn) closeBtn.onclick = () => modal.style.display = "none";
    window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; };

    // ЛОГИН ЛОГИКА
    const loginBtn = document.getElementById("loginSubmitBtn");
    if (loginBtn) {
        loginBtn.addEventListener("click", async () => {
            const email = document.getElementById("loginEmail").value;
            const pass = document.getElementById("loginPass").value;
            try {
                await signInWithEmailAndPassword(auth, email, pass);
                if (modal) modal.style.display = "none";
                showToast("Успешен вход!");
            } catch (e) {
                console.error(e);
                showToast("Грешка при вход!", "error");
            }
        });
    }
    // --- НОВО: ЛОГИКА ЗА ТАБОВЕТЕ ---
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

    // --- НОВО: ПОКАЗВАНЕ НА ПАРОЛА (ОЧИЧКИ) ---
    function setupEye(toggleId, inputId) {
        const eyeBtn = document.getElementById(toggleId);
        const input = document.getElementById(inputId);
        
        if (eyeBtn && input) {
            eyeBtn.addEventListener("click", () => {
                // Сменяме типа от password на text и обратно
                const type = input.getAttribute("type") === "password" ? "text" : "password";
                input.setAttribute("type", type);
                
                // Сменяме иконката (затворено/отворено око)
                eyeBtn.classList.toggle("fa-eye");
                eyeBtn.classList.toggle("fa-eye-slash");
            });
        }
    }

    setupEye("toggleLoginPass", "loginPass");
    setupEye("toggleRegPass", "regPass");
}

// 4. ЗАРЕЖДАНЕ НА РЕЦЕПТИ
async function loadRecipes() {
    const grid = document.getElementById("recipeGrid");
    if(!grid) return;

    // Само ако масивът е празен, го теглим от базата
    if (recipes.length === 0) {
        grid.innerHTML = "Loading recipes...";
        try {
            const snap = await getDocs(collection(db, "recipes"));
            recipes = snap.docs.map(d => d.data());
        } catch (e) {
            console.error("Грешка при теглене:", e);
            grid.innerHTML = "Грешка при зареждане.";
            return;
        }
    }
    renderRecipes(false);
}

// 5. РЕНДИРАНЕ (Рисуване на екрана)
async function renderRecipes(filterFavs) {
    const grid = document.getElementById("recipeGrid");
    grid.innerHTML = ""; 

    // Взимаме любимите от базата
    let userFavs = [];
    if (currentUser) {
        try {
            const uSnap = await getDoc(doc(db, "users", currentUser.uid));
            if (uSnap.exists()) userFavs = uSnap.data().favorites || [];
        } catch(e) { console.error(e); }
    }

    // Уникални рецепти (без дубликати)
    const uniqueRecipesMap = new Map();
    recipes.forEach(r => {
        if (!r.title) return;
        const cleanTitle = r.title.trim().toLowerCase();
        if (!uniqueRecipesMap.has(cleanTitle)) {
            uniqueRecipesMap.set(cleanTitle, r);
        }
    });
    let list = Array.from(uniqueRecipesMap.values());

    // Филтър
    if (filterFavs) {
        if (!currentUser) {
            showToast("Влез в профила си!", "error");
            // Връщаме всички, ако не е логнат
            renderRecipes(false);
            return;
        }
        list = list.filter(r => userFavs.includes(r.title));
    }

    if (list.length === 0) {
        grid.innerHTML = "<div style='padding:20px'>Няма намерени рецепти.</div>";
        return;
    }

    // HTML генериране
    list.forEach((r, index) => {
        const isFav = userFavs.includes(r.title);
        const div = document.createElement("div");
        div.className = "recipe-card";
        div.style.animation = "popIn 0.5s forwards";
        div.style.animationDelay = `${index * 0.05}s`;
        div.style.opacity = "0";

        div.innerHTML = `
            <button class="fav-btn ${isFav ? 'is-favorite' : ''}">❤️</button>
            <h3>${r.title}</h3>
            <div style="font-size:11px; color:#888; text-transform:uppercase; margin-bottom:5px; font-weight:bold;">${r.level || 'Лесно'}</div>
            <p>${r.description}</p>
        `;

        const btn = div.querySelector(".fav-btn");
        btn.addEventListener("click", () => toggleFavorite(r.title, btn));
        grid.appendChild(div);
    });
}

// 6. ЛЮБИМИ (Toggle)
async function toggleFavorite(title, btn) {
    if (!currentUser) {
        showToast("Моля, влезте в профила си!", "info");
        const modal = document.getElementById("authModal");
        if(modal) modal.style.display = "flex";
        return;
    }
    
    const ref = doc(db, "users", currentUser.uid);
    const isFav = btn.classList.contains("is-favorite");

    try {
        if (isFav) {
            await updateDoc(ref, { favorites: arrayRemove(title) });
            btn.classList.remove("is-favorite");
            showToast("Премахнато от любими", "info");
        } else {
            await updateDoc(ref, { favorites: arrayUnion(title) });
            btn.classList.add("is-favorite");
            showToast("Добавено в любими!", "success");
        }
    } catch (e) {
        console.error(e);
        showToast("Грешка при запис", "error");
    }
}