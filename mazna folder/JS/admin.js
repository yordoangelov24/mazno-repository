import { db } from "./firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { showToast } from "./app.js"; // Взимаме тостовете от главния файл

document.addEventListener("DOMContentLoaded", () => {
    const adminFab = document.getElementById("adminFab");
    const adminModal = document.getElementById("adminModal");
    const closeAdmin = document.querySelector(".close-admin");
    const addProductBtn = document.getElementById("addProductBtn");

    // 1. ОТВАРЯНЕ НА МОДАЛА
    if (adminFab) {
        adminFab.addEventListener("click", () => {
            adminModal.style.display = "flex";
        });
    }

    // 2. ЗАТВАРЯНЕ
    if (closeAdmin) {
        closeAdmin.addEventListener("click", () => {
            adminModal.style.display = "none";
        });
    }

    // Затваряне при клик извън прозореца
    window.addEventListener("click", (e) => {
        if (e.target === adminModal) {
            adminModal.style.display = "none";
        }
    });

    // 3. ДОБАВЯНЕ НА ПРОДУКТ (КЪМ FIREBASE)
    if (addProductBtn) {
        addProductBtn.addEventListener("click", async () => {
            const name = document.getElementById("prodName").value;
            const calories = document.getElementById("prodCal").value;
            const protein = document.getElementById("prodProt").value;
            const fat = document.getElementById("prodFat").value;
            const category = document.getElementById("prodCat").value;

            if (!name || !calories) {
                showToast("Попълни поне име и калории!", "error");
                return;
            }

            try {
                await addDoc(collection(db, "products"), {
                    name: name,
                    calories: Number(calories),
                    protein: Number(protein) || 0,
                    fat: Number(fat) || 0,
                    category: category
                });

                showToast("Продуктът е добавен успешно!", "success");
                
                // Изчистване на полетата
                document.getElementById("prodName").value = "";
                document.getElementById("prodCal").value = "";
                adminModal.style.display = "none";
                
                // Презареждане на страницата, за да се види новият продукт
                setTimeout(() => window.location.reload(), 1000);

            } catch (error) {
                console.error("Error:", error);
                showToast("Грешка при запис!", "error");
            }
        });
    }
});