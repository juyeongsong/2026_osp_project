document.addEventListener("DOMContentLoaded", () => {
    const card = document.getElementById("detailCard");
    if (!card) return;

    // 수량
    const qtyNum = document.getElementById("qtyNum");
    card.querySelectorAll(".qty__btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            let n = parseInt(qtyNum.textContent, 10);
            n = btn.dataset.act === "plus" ? n + 1 : Math.max(1, n - 1);
            qtyNum.textContent = n;
        });
    });

    // 장바구니 (임시: localStorage)
    function addToCart() {
        let cart = {};
        try { cart = JSON.parse(localStorage.getItem("cart") || "{}"); } catch (e) { }
        const id = card.dataset.id;
        const qty = parseInt(qtyNum.textContent, 10);
        cart[id] = {
            name: card.dataset.name, price: +card.dataset.price,
            qty: (cart[id] ? cart[id].qty : 0) + qty
        };
        try { localStorage.setItem("cart", JSON.stringify(cart)); } catch (e) { }
    }
    const addBtn = document.getElementById("addCartBtn");
    if (addBtn) addBtn.addEventListener("click", () => { addToCart(); alert("장바구니에 담았어요!"); });
    const buyBtn = document.getElementById("buyBtn");
    if (buyBtn) buyBtn.addEventListener("click", () => { addToCart(); alert("주문 페이지는 준비 중이에요."); });

    // 관리자: 케밥 메뉴 / 수정 모드
    const kebab = document.getElementById("kebabBtn");
    const menu = document.getElementById("kebabMenu");
    if (kebab && menu) {
        kebab.addEventListener("click", (e) => { e.stopPropagation(); menu.hidden = !menu.hidden; });
        document.addEventListener("click", () => { menu.hidden = true; });
        document.getElementById("editBtn").addEventListener("click", () => {
            card.classList.add("editing");
            menu.hidden = true;
        });
        document.getElementById("deleteBtn").addEventListener("click", () => {
            menu.hidden = true;
            alert("상품 삭제는 상품 DB 연동 후 구현 예정이에요."); // TODO
        });
    }
});