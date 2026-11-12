// 상품 상세 페이지 동작
//  - 수량 +/-  → 가격(단가 × 수량) 같이 변경
//  - 장바구니 / 구매하기
//  - [관리자] ⋮ 메뉴, 수정 모드, 저장, 삭제
(() => {
    const card = document.getElementById("detail-card");
    if (!card) return;

    const $ = (id) => document.getElementById(id);
    const unitPrice = Number(card.dataset.unitPrice);
    const itemName = card.dataset.name;
    const MIN_QTY = 1;
    const MAX_QTY = 99;

    let qty = 1;

    const won = (n) => n.toLocaleString("ko-KR") + "원";

    const toast = (msg) => {
        const el = $("toast");
        el.textContent = msg;
        el.classList.add("is-show");
        clearTimeout(toast.timer);
        toast.timer = setTimeout(() => el.classList.remove("is-show"), 1800);
    };

    const post = async (url, body = {}) => {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        return { ok: res.ok && data.ok, data };
    };

    // ---------- 수량 / 가격 ----------
    const renderQty = () => {
        $("qty-num").textContent = qty;
        $("total-price").textContent = won(unitPrice * qty);
    };

    $("qty-minus").addEventListener("click", () => {
        qty = Math.max(MIN_QTY, qty - 1);
        renderQty();
    });
    $("qty-plus").addEventListener("click", () => {
        qty = Math.min(MAX_QTY, qty + 1);
        renderQty();
    });

    // ---------- 장바구니 / 구매하기 ----------
    const addToCart = async () => {
        const { ok, data } = await post("/cart/add", { name: itemName, qty });
        if (!ok) toast(data.message || "담지 못했어요.");
        return ok;
    };

    $("cart-btn").addEventListener("click", async () => {
        if (await addToCart()) toast("장바구니에 담았어요!");
    });
    $("buy-btn").addEventListener("click", async () => {
        if (await addToCart()) location.href = "/cart";
    });

    // ---------- [관리자] 이 아래는 관리자일 때만 요소가 있음 ----------
    const kebabBtn = $("kebab-btn");
    if (!kebabBtn) return;

    const menu = $("kebab-menu");
    const pills = card.querySelectorAll(".status-pill");
    let selectedStatus = card.dataset.status;

    const closeMenu = () => {
        menu.hidden = true;
        kebabBtn.setAttribute("aria-expanded", "false");
    };

    kebabBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        menu.hidden = !menu.hidden;
        kebabBtn.setAttribute("aria-expanded", String(!menu.hidden));
    });
    document.addEventListener("click", (e) => {
        if (!menu.contains(e.target)) closeMenu();
    });

    // 수정 모드 켜기 / 끄기
    const setEditing = (on) => {
        card.classList.toggle("is-editing", on);
        pills.forEach((p) => {
            p.tabIndex = on ? 0 : -1;
        });
    };

    $("edit-btn").addEventListener("click", () => {
        closeMenu();
        setEditing(true);
        $("name-input").focus();
    });

    $("cancel-btn").addEventListener("click", () => location.reload());

    // 상태 선택
    pills.forEach((pill) => {
        pill.addEventListener("click", () => {
            if (!card.classList.contains("is-editing")) return;
            selectedStatus = pill.dataset.status;
            pills.forEach((p) => p.classList.toggle("is-selected", p === pill));
        });
    });

    // 저장
    $("save-btn").addEventListener("click", async () => {
        const name = $("name-input").value.trim();
        const price = Number($("price-input").value);
        if (!name) return toast("상품명을 입력해 주세요.");
        if (!Number.isFinite(price) || price < 0) return toast("가격을 확인해 주세요.");

        const { ok, data } = await post(`/item/${encodeURIComponent(itemName)}/update`, {
            name,
            desc: $("desc-input").value,
            price,
            status: selectedStatus,
        });
        if (ok) location.href = data.url; // 이름이 바뀌었을 수 있으니 새 주소로
        else toast(data.message || "저장하지 못했어요.");
    });

    // 삭제
    $("delete-btn").addEventListener("click", async () => {
        closeMenu();
        if (!confirm(`'${itemName}' 상품을 삭제할까요?`)) return;
        const { ok, data } = await post(`/item/${encodeURIComponent(itemName)}/delete`);
        if (ok) location.href = data.url;
        else toast(data.message || "삭제하지 못했어요.");
    });
})();