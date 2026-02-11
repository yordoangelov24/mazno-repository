// =============================================
//      1. FIREBASE НАСТРОЙКИ
// =============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc, getDoc, deleteDoc} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
// 👇 СЛОЖИ ТВОЯ CONFIG ТУК 👇
const firebaseConfig = {
  apiKey: "AIzaSyAlegu3OzRrtBgugj0pk0K2GLYkRLIKogc",
  authDomain: "recepti-5caeb.firebaseapp.com",
  databaseURL: "https://recepti-5caeb-default-rtdb.firebaseio.com",
  projectId: "recepti-5caeb",
  storageBucket: "recepti-5caeb.firebasestorage.app",
  messagingSenderId: "1003802666782",
  appId: "1:1003802666782:web:357ecaaf3f280f6f130b0f",
  measurementId: "G-S2XPTGRDM4"
};
// 👆 ----------------------- 👆

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// =============================================
//      2. ДАННИ (State)
// =============================================
let currentUser = null;
let products = [];
let recipes = [];
let cart = [];
let currentCategory = "all";

// =============================================
//      3. START UP
// =============================================
document.addEventListener("DOMContentLoaded", async () => {
  // Елементи
  const searchInput = document.getElementById("searchInput");
  const categoryChips = document.querySelectorAll(".chip");
  const clearBtn = document.getElementById("clearBtn");
  const generateBtn = document.getElementById("generateBtn");

  // 1. Теглим данните
  await loadDataFromFirebase();

  // 2. Рендираме
  renderProducts(products);
  updateCart();

  // 3. Listeners
  searchInput.addEventListener("input", filterProducts);

  categoryChips.forEach(chip => {
    chip.addEventListener("click", () => {
      categoryChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      currentCategory = chip.dataset.category;
      filterProducts();
    });
  });

  clearBtn.addEventListener("click", () => {
    cart = [];
    updateCart();
    document.getElementById("recipeBox").style.display = "none";
  });
  generateBtn.addEventListener("click", generateRecipe);

  // =============================================
  //      АВТЕНТИКАЦИЯ (Регистрация/Вход/Изход)
 // =============================================
  // 1. Управление на Модала (Отваряне/Затваряне)
  const modal = document.getElementById("authModal");
  const btn = document.getElementById("authBtn");
  const closeSpan = document.getElementsByClassName("close")[0];

 btn.onclick = () => {
    if (currentUser) {
        // Ако вече е влязъл -> Изход (Log out)
        signOut(auth).then(() => {
            alert("Излязохте успешно!");
            window.location.reload(); // Рефреш за по-чисто
        });
    } else {
        // Ако не е влязъл -> Отваряме формата
        modal.style.display = "flex";
    }
  }
  closeSpan.onclick = () => modal.style.display = "none";
  window.onclick = (event) => { if (event.target == modal) modal.style.display = "none"; }

 // Превключване между Вход и Регистрация
document.getElementById("showRegister").onclick = () => {
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("registerForm").style.display = "block";
};
document.getElementById("showLogin").onclick = () => {
    document.getElementById("registerForm").style.display = "none";
    document.getElementById("loginForm").style.display = "block";
};

// 2. Логика за РЕГИСТРАЦИЯ
document.getElementById("regSubmitBtn").addEventListener("click", async () => {
    const email = document.getElementById("regEmail").value;
    const pass = document.getElementById("regPass").value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;
        
        // Създаваме документ за потребителя в базата
        // По подразбиране ролята е 'user'. Ти ще си смениш твоята на 'admin' ръчно в конзолата.
        await setDoc(doc(db, "users", user.uid), {
            email: email,
            role: "user", 
            favorites: []
        });

        alert("Успешна регистрация!");
        modal.style.display = "none";
    } catch (error) {
        alert("Грешка: " + error.message);
    }
});

// 3. Логика за ВХОД
document.getElementById("loginSubmitBtn").addEventListener("click", async () => {
    const email = document.getElementById("loginEmail").value;
    const pass = document.getElementById("loginPass").value;

    try {
        await signInWithEmailAndPassword(auth, email, pass);
        alert("Влязохте успешно!");
        modal.style.display = "none";
    } catch (error) {
        alert("Грешка при вход: " + error.message);
    }
});

// 4. СЛУШАТЕЛ: Какво става, когато някой влезе/излезе?
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        document.getElementById("authBtn").textContent = "Изход (" + user.email + ")";
        
        // Проверяваме дали е Админ
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.role === "admin") {
                document.getElementById("adminFab").style.display = "flex";
               console.log("👑 Админ бутонът е активен!");
            }
        }
    } else {
        currentUser = null;
        document.getElementById("authBtn").textContent = "Вход / Регистрация";
        document.getElementById("adminPanel").style.display = "none";
    }

    // ==========================================
//      АДМИН ФУНКЦИИ (Добави & Изтрий)
// ==========================================

// 1. ДОБАВЯНЕ НА ПРОДУКТ (С изчистване на полетата)
document.getElementById("submitNewProduct").addEventListener("click", async () => {
    // Взимаме стойностите
    const id = document.getElementById("newProdId").value;
    const name = document.getElementById("newProdName").value;
    const category = document.getElementById("newProdCat").value;
    
    // Превръщаме числата
    const calories = Number(document.getElementById("newCal").value);
    const protein = Number(document.getElementById("newProt").value);
    const fat = Number(document.getElementById("newFat").value);
    const carbs = Number(document.getElementById("newCarbs").value);
    const fiber = Number(document.getElementById("newFiber").value);

    if (!id || !name) {
        alert("Моля, попълнете поне ID и Име!");
        return;
    }

    try {
        // Записваме в Firebase
        await setDoc(doc(db, "products", id), {
            name: name,
            category: category,
            calories: calories,
            protein: protein,
            fat: fat,
            carbs: carbs,
            fiber: fiber
        });

        alert(`✅ Продуктът "${name}" е добавен успешно!`);
        
        // --- ТУК Е ПРОМЯНАТА: Изчистваме всички полета ---
        document.getElementById("newProdId").value = "";
        document.getElementById("newProdName").value = "";
        document.getElementById("newProdCat").value = "";
        document.getElementById("newCal").value = "";
        document.getElementById("newProt").value = "";
        document.getElementById("newFat").value = "";
        document.getElementById("newCarbs").value = "";
        document.getElementById("newFiber").value = "";
        // -------------------------------------------------
        
        // Презареждаме списъка
        loadDataFromFirebase();

    } catch (error) {
        console.error("Грешка:", error);
        alert("Грешка при запис: " + error.message);
    }
});

// 2. ИЗТРИВАНЕ НА ПРОДУКТ
document.getElementById("deleteProdBtn").addEventListener("click", async () => {
    const idToDelete = document.getElementById("deleteProdId").value;

    if (!idToDelete) return alert("Пиши ID!");

    if (confirm(`Сигурен ли си, че искаш да изтриеш продукт с ID ${idToDelete}?`)) {
        try {
            await deleteDoc(doc(db, "products", idToDelete));
            alert("🗑️ Продуктът е изтрит завинаги!");
            document.getElementById("deleteProdId").value = "";
            loadDataFromFirebase(); // Рефреш на списъка
        } catch (error) {
            alert("Грешка: " + error.message);
        }
    }
  });
  });
  });

// =============================================
//      4. FIREBASE ФУНКЦИЯ (С FIX ЗА ID-тата)
// =============================================
async function loadDataFromFirebase() {
  const pList = document.getElementById("productList");
  pList.innerHTML = "<div style='padding:20px'>⏳ Зареждане на данни...</div>";

  try {
    // Взимаме Продуктите
    const prodSnap = await getDocs(collection(db, "products"));
    products = prodSnap.docs.map(doc => {
        // 🔥 ВАЖНО: Правим ID-то число, за да работи със старите ти функции!
        return { id: Number(doc.id), ...doc.data() }; 
    });

    // Взимаме Рецептите
    const recSnap = await getDocs(collection(db, "recipes"));
    recipes = recSnap.docs.map(doc => doc.data());

    console.log("✅ Данните са заредени!", products, recipes);
    pList.innerHTML = ""; 
  } catch (err) {
    console.error("Грешка:", err);
    pList.innerHTML = "❌ Проблем с базата данни.";
  }
 }

// =============================================
//      5. ТВОИТЕ ОРИГИНАЛНИ ФУНКЦИИ
// =============================================

// Твоята функция за добавяне (1:1)
function addToCart(product) {
  // Проверка дали продуктът вече е в кошницата
  const existing = cart.find(i => i.id === product.id);

  if (!existing) {
    // Ако го няма, добавяме го с количество 1
    cart.push({ ...product, qty: 1 });
  } else {
    // Ако го има, увеличаваме бройката
    existing.qty += 1;
  }

  // Само обновяваме визуално кошницата
  updateCart();
}

// Твоята функция за рецепти (1:1 + малък fix за логиката)
function generateRecipe() {
  const recipeBox = document.getElementById("recipeBox");
  const recipeText = document.getElementById("recipeText");

  if (cart.length === 0) {
    recipeText.textContent = "Кошницата е празна! Добавете продукти първо.";
    recipeBox.style.display = "block";
    return;
  }

  const cartIds = cart.map(i => i.id);

  // Вместо .find(), ползваме .filter() и сортиране
  const possibleRecipes = recipes.filter(r => r.ingredients.every(id => cartIds.includes(id)));
  
  // Сортираме по брой съставки (низходящ ред) -> най-богатата рецепта печели
  possibleRecipes.sort((a, b) => b.ingredients.length - a.ingredients.length);
  
  let matchedRecipe = possibleRecipes.length > 0 ? possibleRecipes[0] : null;

  // 2. Логика за "почти съвпадение"
  if (!matchedRecipe) {
    let almostMatch = recipes.find(r => {
       const missing = r.ingredients.filter(id => cartIds.includes(id));
       return missing.length > 0 && missing.length <= 2;
    });

    // Ако сме намерили такава "почти" рецепта
    if (almostMatch) {
      const missingIds = almostMatch.ingredients.filter(id => !cartIds.includes(id));
      const missingProducts = products.filter(p => missingIds.includes(p.id));
      const names = missingProducts.map(p => p.name).join(", ");

      // ТУК питаме потребителя
      if (confirm(`За рецептата "${almostMatch.title}" ви липсват: ${names}.\nИскате ли да ги добавя автоматично? 🍽️`)) {
        
        // Добавяме липсващите продукти
        missingProducts.forEach(p => {
            const ex = cart.find(i => i.id === p.id);
            if(!ex) cart.push({...p, qty: 1});
            else ex.qty++;
        });
        
        updateCart();
        matchedRecipe = almostMatch; 
      }
    }
  }

  // Изчисляване на общите нутриенти
  const total = cart.reduce((acc, item) => ({
    calories: acc.calories + item.calories * item.qty,
    protein: acc.protein + item.protein * item.qty,
    fat: acc.fat + item.fat * item.qty,
    carbs: acc.carbs + item.carbs * item.qty,
    fiber: acc.fiber + item.fiber * item.qty
  }), { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 });

  // 3. Показване на резултата
  recipeBox.style.display = "block";

  if (matchedRecipe) {
    recipeText.textContent = `${matchedRecipe.title} (${matchedRecipe.level})\n\n` + 
                             `Описание: ${matchedRecipe.description}\n\n` +
                             `Стъпки:\n${matchedRecipe.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\n` +
                             `--- Хранителни стойности на кошницата ---\n` +
                             `Калории: ${total.calories.toFixed(0)} kcal | Протеин: ${total.protein.toFixed(1)} g | ` +
                             `Мазнини: ${total.fat.toFixed(1)} g | Въглехидрати: ${total.carbs.toFixed(1)} g`;
  } else {
    recipeText.textContent = `Не открихме точна рецепта с тези продукти, но ето какво съдържа вашата кошница:\n\n` + 
                             `Продукти: ${cart.map(i => i.name).join(", ")}\n\n` +
                             `--- Общи хранителни стойности ---\n` +
                             `Калории: ${total.calories.toFixed(0)} kcal\n` +
                             `Протеин: ${total.protein.toFixed(1)} g\n` +
                             `Мазнини: ${total.fat.toFixed(1)} g\n` +
                             `Въглехидрати: ${total.carbs.toFixed(1)} g\n` +
                             `Фибри: ${total.fiber.toFixed(1)} g`;
  }
 }

// =============================================
//      6. ПОМОЩНИ ФУНКЦИИ (UI)
// =============================================

function updateCart() {
  const container = document.getElementById("itemsContainer");
  const emptyMsg = document.getElementById("cartEmpty");
  const countTag = document.getElementById("countTag");
  
  container.innerHTML = "";

  if (cart.length === 0) {
    emptyMsg.style.display = "block";
    container.style.display = "none";
  } else {
    emptyMsg.style.display = "none";
    container.style.display = "flex";
    cart.forEach(item => {
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <div class="qty">${item.qty}</div>
        <div class="meta">
            <div class="name">${item.name}</div>
        </div>
        <button class="add-btn" style="background:none; color:red; padding:0;" onclick="return false;">❌</button>
      `;
      div.querySelector("button").addEventListener("click", () => removeFromCart(item.id));
      container.appendChild(div);
    });
  }

  countTag.textContent = `${cart.length} продукта`;
  updateNutrition(); // Обновяваме и цветните барове
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  updateCart();
}

function filterProducts() {
  const term = document.getElementById("searchInput").value.toLowerCase();
  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(term);
    const matchesCategory = currentCategory === "all" || p.category === currentCategory;
    return matchesSearch && matchesCategory;
  });
  renderProducts(filtered);
}

function renderProducts(list) {
  const productList = document.getElementById("productList");
  productList.innerHTML = "";
  
  if (list.length === 0) {
      productList.innerHTML = "<div style='padding:20px'>Няма резултати.</div>";
      return;
  }

  list.forEach(p => {
    const div = document.createElement("div");
    div.className = "product";
    div.style.animation = "fadeIn 0.5s ease";
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

// Nutrition Bars Logic
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

  // Смятаме процента (максимум 100 за ширината, но логиката може да ползва и повече)
  const percent = Math.min((value / limit) * 100, 100);
  const rawPercent = (value / limit) * 100; // Реалният процент без ограничение

  const bar = document.getElementById(`${type}Bar`);
  const label = document.getElementById(`${type}Val`);
  
  if (bar && label) {
      bar.style.width = percent + "%";
      label.textContent = `${value.toFixed(1)}g / ${limit}g`;
      
      // --- НОВА ЛОГИКА ---
      
      if (type === "protein") {
          // ЗА ПРОТЕИН: Целта е да пълним бара (Повече е по-добре)
          if (rawPercent < 50) {
              bar.style.background = "#ff4d4d"; // Червено (Още си далеч)
          } else if (rawPercent < 100) {
              bar.style.background = "#f7b267"; // Оранжево (Приближаваш се)
          } else {
              bar.style.background = "#4CAF50"; // Зелено (Браво, целта е изпълнена!)
          }

      } else {
          // ЗА МАЗНИНИ/ВЪГЛЕХИДРАТИ: Целта е да НЕ прекаляваме (Лимит)
          if (rawPercent > 100) {
              bar.style.background = "#ff4d4d"; // Червено (Прекали!)
          } else if (rawPercent > 80) {
              bar.style.background = "#f7b267"; // Оранжево (Внимавай)
          } else {
              bar.style.background = "#4CAF50"; // Зелено (Всичко е точно)
          }
      }
  }
  const adminFab = document.getElementById("adminFab");
    const adminModal = document.getElementById("adminModal");
    const closeAdmin = document.querySelector(".close-admin");

    if (adminFab) {
        adminFab.addEventListener("click", () => {
            adminModal.style.display = "flex";
        });
    }

    if (closeAdmin) {
        closeAdmin.addEventListener("click", () => {
            adminModal.style.display = "none";
        });
    }

    // Затваряне при клик извън формата
    window.addEventListener("click", (e) => {
        if (e.target === adminModal) {
            adminModal.style.display = "none";
        }
    });
}

