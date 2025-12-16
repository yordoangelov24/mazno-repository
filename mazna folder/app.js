
//                Данни
// =============================================
const products = [
  { id: 1, name: "Мляко", category: "Млечни", calories: 60, protein: 3.2, fat: 3.3, carbs: 5, fiber: 0 },
  { id: 2, name: "Краве масло", category: "Млечни", calories: 717, protein: 0.85, fat: 81, carbs: 0.1, fiber: 0 },
  { id: 3, name: "Яйца", category: "Млечни", calories: 155, protein: 13, fat: 11, carbs: 1.1, fiber: 0 },
  { id: 4, name: "Кайма", category: "Месо", calories: 250, protein: 17, fat: 20, carbs: 0, fiber: 0 },
  { id: 5, name: "Пилешко филе", category: "Месо", calories: 165, protein: 31, fat: 3.6, carbs: 0, fiber: 0 },
  { id: 6, name: "Моркови", category: "Зеленчуци", calories: 41, protein: 0.9, fat: 0.2, carbs: 10, fiber: 2.8 },
  { id: 7, name: "Домати", category: "Зеленчуци", calories: 18, protein: 0.9, fat: 0.2, carbs: 3.9, fiber: 1.2 },
  { id: 8, name: "Ябълки", category: "Плодове", calories: 52, protein: 0.3, fat: 0.2, carbs: 14, fiber: 2.4 },
  { id: 9, name: "Банани", category: "Плодове", calories: 89, protein: 1.1, fat: 0.3, carbs: 23, fiber: 2.6 },
  { id: 10, name: "Шоколад", category: "Сладко", calories: 546, protein: 4.9, fat: 31, carbs: 61, fiber: 3 },
  { id: 11, name: "Мед", category: "Сладко", calories: 304, protein: 0.3, fat: 0, carbs: 82, fiber: 0.2 },
  { id: 12, name: "Киноа", category: "Зърнени", calories: 120, protein: 4.4, fat: 1.9, carbs: 21, fiber: 2.8 },
  { id: 13, name: "Бадеми", category: "Сладко", calories: 579, protein: 21, fat: 50, carbs: 22, fiber: 12 },
  { id: 14, name: "Козе сирене", category: "Млечни", calories: 364, protein: 21, fat: 30, carbs: 1.0, fiber: 0 },
  { id: 15, name: "Спанак", category: "Зеленчуци", calories: 23, protein: 2.9, fat: 0.4, carbs: 3.6, fiber: 2.2 },
  { id: 16,  name: "Киноа", category: "Зърнени", calories:350, protein: 14, fat:6.1, carbs:64, fiber:7 },
  { id: 17,  name: "Бадеми", category: "Ядки", calories:605, protein :20, fat:52, carbs:13, fiber:9},

];

const popularRecipes = [
  { title: "Пица Маргарита", desc: "Тесто, домати, моцарела, босилек" },
  { title: "Зеленчукова супа", desc: "Моркови, картофи, лук, чесън" },
  { title: "Палачинки", desc: "Яйца, мляко, брашно, мед" },
  { title: "Шоколадов мус", desc: "Шоколад, яйца, сметана" }
];

const newProducts = [
  
  { name: "Спанак", category: "Зеленчуци" }
];

const recipes = [
  {
    title: "Яйце на очи",
    level: "лесно",
    ingredients: [3],
    steps: [
      "Загрейте тиган на средна температура.",
      "Разбийте яйцето и го изсипете в тигана.",
      "Гответе 2-3 минути и сервирайте."
    ],
    description: "Бързо и лесно ястие за студенти. Отличен източник на протеин."
  },
  {
    title: "Сандвич с пиле и спанак",
    level: "лесно",
    ingredients: [5,15],
    steps: [
      "Изпечете пилешкото филе.",
      "Направете сандвич с хляб, пиле и спанак.",
      "Сервирайте с домат и малко мед."
    ],
    description: "Лека и питателна храна, подходяща за закуска или обяд."
  },
  {
    title: "Киноа със зеленчуци",
    level: "трудно",
    ingredients: [12,6,7,15],
    steps: [
      "Сварете 1 чаша киноа в 2 чаши вода за около 15 минути.",
      "Нарежете морковите, доматите и спанака на малки парчета.",
      "Запържете зеленчуците в малко зехтин за 5 минути.",
      "Смесете сварената киноа със зеленчуците.",
      "Подправете със сол, черен пипер и лимонов сок."
    ],
    description: "Пълноценно ястие, богато на протеини, фибри и витамини. Отличен избор за здравословно хранене."
  },
  {
    title: "Шоколадов мус",
    level: "трудно",
    ingredients: [10,3],
    steps: [
      "Разтопете шоколада на водна баня.",
      "Разбийте яйцата и добавете шоколада.",
      "Охладете за 2 часа в хладилник преди сервиране."
    ],
    description: "Десерт с високо съдържание на протеин и мазнини, идеален за специални случаи."
  }
];


//                Кошница

let cart = [];


//                DOM елементи

let productList, itemsContainer, cartEmpty, countTag, recipeBox, recipeText;
let clearBtn, generateBtn, popularContainer, newContainer, categoryChips, searchInput, searchBtn;


//                Инициализация

document.addEventListener("DOMContentLoaded", () => {
  productList = document.getElementById("productList");
  itemsContainer = document.getElementById("itemsContainer");
  cartEmpty = document.getElementById("cartEmpty");
  countTag = document.getElementById("countTag");
  recipeBox = document.getElementById("recipeBox");
  recipeText = document.getElementById("recipeText");
  clearBtn = document.getElementById("clearBtn");
  generateBtn = document.getElementById("generateBtn");
  popularContainer = document.getElementById("popularRecipes");
  newContainer = document.getElementById("newProducts");
  categoryChips = document.querySelectorAll(".chip");
  searchInput = document.getElementById("searchInput");
  searchBtn = document.getElementById("searchBtn");

  renderProducts(products);
  renderPopular();
  renderNew();
  updateCart();

  clearBtn.addEventListener("click", () => {
    cart = [];
    updateCart();
    recipeBox.style.display="none";
  });

  generateBtn.addEventListener("click", generateRecipe);

  categoryChips.forEach(chip => {
    chip.addEventListener("click", () => {
      categoryChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      const cat = chip.dataset.category;
      if(cat==="all") renderProducts(products);
      else renderProducts(products.filter(p => p.category===cat));
    });
  });

  searchBtn.addEventListener("click", () => {
    const term = searchInput.value.toLowerCase();
    const filtered = products.filter(p => p.name.toLowerCase().includes(term));
    renderProducts(filtered);
  });

});


//                Рендер продукти

function renderProducts(list){
  productList.innerHTML = "";
  list.forEach(p => {
    const div = document.createElement("div");
    div.className = "product";
    div.innerHTML = `
      <div class="p-thumb">${p.name.charAt(0)}</div>
      <div class="p-info">
        <div class="p-name">${p.name}</div>
        <div class="p-cat">${p.category}</div>
        <div class="p-nutrition">Кал: ${p.calories} | Пр: ${p.protein} | М: ${p.fat} | В: ${p.carbs} | Ф: ${p.fiber}</div>
      </div>
      <button class="add-btn">Добави</button>
    `;
    div.querySelector("button").addEventListener("click", ()=>addToCart(p));
    productList.appendChild(div);
  });
}


//                Добавяне/Премахване

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

function removeFromCart(id){
  cart = cart.filter(i=>i.id!==id);
  updateCart();
}


//                Обновяване на кошницата

function updateCart(){
  itemsContainer.innerHTML="";
  if(cart.length===0){
    cartEmpty.style.display="block";
    itemsContainer.style.display="none";
  } else {
    cartEmpty.style.display="none";
    itemsContainer.style.display="flex";
    cart.forEach(item=>{
      const div = document.createElement("div");
      div.className="item";
      div.innerHTML=`
        <div class="qty">${item.qty}</div>
        <div class="meta">
          <div class="name">${item.name}</div>
          <div class="small">${item.category}</div>
        </div>
        <button class="add-btn">❌</button>
      `;
      div.querySelector("button").addEventListener("click",()=>removeFromCart(item.id));
      itemsContainer.appendChild(div);
    });
  }
  countTag.textContent=`${cart.length} продукта`;
}

function generateRecipe() {
  if (cart.length === 0) {
    recipeText.textContent = "Кошницата е празна! Добавете продукти първо.";
    recipeBox.style.display = "block";
    return;
  }

  const cartIds = cart.map(i => i.id);

  // --- ПРОМЕНЕНА ЧАСТ ---
  // Вместо .find(), ползваме .filter() и сортиране
  const possibleRecipes = recipes.filter(r => r.ingredients.every(id => cartIds.includes(id)));
  
  // Сортираме по брой съставки (низходящ ред) -> най-богатата рецепта печели
  possibleRecipes.sort((a, b) => b.ingredients.length - a.ingredients.length);
  
  let matchedRecipe = possibleRecipes.length > 0 ? possibleRecipes[0] : null;


  // 2. Логика за "почти съвпадение" (ако нямаме matchedRecipe)
  if (!matchedRecipe) {
    // ... (старият ти код за almostMatch си остава тук)
    let almostMatch = recipes.find(r => {
       const missing = r.ingredients.filter(id => cartIds.includes(id));
       return missing.length > 0 && missing.length <= 2;
    });
    // Ако сме намерили такава "почти" рецепта
    if (almostMatch) {
      const missingIds = almostMatch.ingredients.filter(id => !cartIds.includes(id));
      const missingProducts = products.filter(p => missingIds.includes(p.id));
      const names = missingProducts.map(p => p.name).join(", ");

      // ТУК питаме потребителя (само след натискане на бутона)
      if (confirm(`За рецептата "${almostMatch.title}" ви липсват: ${names}.\nИскате ли да ги добавя автоматично? 🍽️`)) {
        
        // Добавяме липсващите продукти
        missingProducts.forEach(p => {
            const ex = cart.find(i => i.id === p.id);
            if(!ex) cart.push({...p, qty: 1});
            // Ако искаш да се увеличава бройката ако го има: else ex.qty++;
        });
        
        updateCart(); // Обновяваме визията на кошницата
        matchedRecipe = almostMatch; // Вече имаме рецепта за показване!
      }
    }
  }

  // Изчисляване на общите нутриенти (независимо дали има рецепта или не)
  const total = cart.reduce((acc, item) => ({
    calories: acc.calories + item.calories * item.qty,
    protein: acc.protein + item.protein * item.qty,
    fat: acc.fat + item.fat * item.qty,
    carbs: acc.carbs + item.carbs * item.qty,
    fiber: acc.fiber + item.fiber * item.qty
  }), { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 });

  // 3. Показване на резултата
  if (matchedRecipe) {
    // Имаме рецепта (или точна, или потребителят е приел да добави продуктите)
    recipeText.textContent = `${matchedRecipe.title} (${matchedRecipe.level})\n\n` + 
                             `Описание: ${matchedRecipe.description}\n\n` +
                             `Стъпки:\n${matchedRecipe.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\n` +
                             `--- Хранителни стойности на кошницата ---\n` +
                             `Калории: ${total.calories.toFixed(0)} kcal | Протеин: ${total.protein.toFixed(1)} g | ` +
                             `Мазнини: ${total.fat.toFixed(1)} g | Въглехидрати: ${total.carbs.toFixed(1)} g`;
  } else {
    // Няма рецепта и потребителят е отказал добавяне или няма близки съвпадения
    recipeText.textContent = `Не открихме точна рецепта с тези продукти, но ето какво съдържа вашата кошница:\n\n` + 
                             `Продукти: ${cart.map(i => i.name).join(", ")}\n\n` +
                             `--- Общи хранителни стойности ---\n` +
                             `Калории: ${total.calories.toFixed(0)} kcal\n` +
                             `Протеин: ${total.protein.toFixed(1)} g\n` +
                             `Мазнини: ${total.fat.toFixed(1)} g\n` +
                             `Въглехидрати: ${total.carbs.toFixed(1)} g\n` +
                             `Фибри: ${total.fiber.toFixed(1)} g`;
  }

  recipeBox.style.display = "block";
}


//                Рендер популярни и нови

function renderPopular(){
  popularContainer.innerHTML="";
  popularRecipes.forEach(r=>{
    const div=document.createElement("div");
    div.className="recipe-card";
    div.innerHTML=`<h4>${r.title}</h4><p>${r.desc}</p>`;
    popularContainer.appendChild(div);
  });
}

function renderNew(){
  newContainer.innerHTML="";
  newProducts.forEach(p=>{
    const div=document.createElement("div");
    div.className="product-card";
    div.innerHTML=`<h4>${p.name}</h4><p>${p.category}</p>`;
    newContainer.appendChild(div);
  });
}