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

  // FormData(사진 포함)를 보낼 때 사용
  const postForm = async (url, formData) => {
    const res = await fetch(url, { method: "POST", body: formData });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok && data.ok, data };
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

  // 사진 바꾸기: 수정 모드에서 그림 클릭 → 파일 선택 → 미리보기
  const mediaImg = $("media-img");
  const imgInput = $("img-input");
  const imgEl = mediaImg.querySelector(".bungeo-img");
  const MAX_MB = 5;
  let newImage = null;

  mediaImg.addEventListener("click", (e) => {
    if (!card.classList.contains("is-editing")) return;
    if (e.target === imgInput) return;
    imgInput.click();
  });

  imgInput.addEventListener("change", () => {
    const file = imgInput.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      imgInput.value = "";
      return toast("이미지 파일만 올릴 수 있어요.");
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      imgInput.value = "";
      return toast(`${MAX_MB}MB 이하 사진만 올릴 수 있어요.`);
    }
    newImage = file;
    if (imgEl.dataset.preview) URL.revokeObjectURL(imgEl.dataset.preview);
    imgEl.dataset.preview = URL.createObjectURL(file);
    imgEl.src = imgEl.dataset.preview;
  });

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
    if (!Number.isFinite(price) || price < 0)
      return toast("가격을 확인해 주세요.");

    const form = new FormData();
    form.append("name", name);
    form.append("desc", $("desc-input").value);
    form.append("price", price);
    form.append("status", selectedStatus);
    if (newImage) form.append("img", newImage);

    const { ok, data } = await postForm(
      `/item/${encodeURIComponent(itemName)}/update`,
      form
    );
    if (ok) location.href = data.url;
    else toast(data.message || "저장하지 못했어요.");
  });

  // 삭제
  $("delete-btn").addEventListener("click", async () => {
    closeMenu();
    if (!confirm(`'${itemName}' 상품을 삭제할까요?`)) return;
    const { ok, data } = await post(
      `/item/${encodeURIComponent(itemName)}/delete`
    );
    if (ok) location.href = data.url;
    else toast(data.message || "삭제하지 못했어요.");
  });
})();
