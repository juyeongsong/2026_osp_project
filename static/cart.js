(() => {
  const list = document.querySelector(".cart__scroll");
  if (!list) return;

  const summary = document.querySelector(".summary");
  const fee = Number(summary.dataset.fee);
  const won = (n) => n.toLocaleString("ko-KR") + "원";
  const selectAll = document.getElementById("select-all");

  const post = (url, body) =>
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => r.json().catch(() => ({})));

  const rows = () => [...list.querySelectorAll(".cart-row")];

  // 체크된 상품 기준으로 오른쪽 요약 다시 그리기
  const renderSummary = () => {
    const checked = rows().filter((r) => r.querySelector(".item-check").checked);
    const ul = document.getElementById("summary-list");
    ul.innerHTML = "";
    let sum = 0;
    checked.forEach((r) => {
      const price = Number(r.dataset.price);
      const qty = Number(r.querySelector(".qty__num").textContent);
      sum += price * qty;
      const li = document.createElement("li");
      li.innerHTML = `<span></span><span class="summary__qty">× ${qty}</span>
                      <span class="summary__amount">${won(price * qty)}</span>`;
      li.firstElementChild.textContent = r.dataset.name; // XSS 방지
      ul.appendChild(li);
    });
    const shipping = checked.length ? fee : 0;
    document.getElementById("fee").textContent = won(shipping);
    document.getElementById("total").textContent = won(sum + shipping);
    document.getElementById("cart-empty").hidden = rows().length > 0;
    selectAll.checked = rows().length > 0 && checked.length === rows().length;
  };

  // 수량 +/-, 삭제 (이벤트 위임)
  list.addEventListener("click", async (e) => {
    const row = e.target.closest(".cart-row");
    if (!row) return;

    if (e.target.closest(".cart-item__remove")) {
      const data = await post("/cart/remove", { name: row.dataset.name });
      if (data.ok) { row.remove(); renderSummary(); }
      return;
    }

    const minus = e.target.closest(".qty__btn--minus");
    const plus = e.target.closest(".qty__btn--plus");
    if (!minus && !plus) return;

    const numEl = row.querySelector(".qty__num");
    const qty = Math.max(1, Math.min(99, Number(numEl.textContent) + (plus ? 1 : -1)));
    if (qty === Number(numEl.textContent)) return;

    const data = await post("/cart/update", { name: row.dataset.name, qty });
    if (!data.ok) return alert(data.message || "수량을 바꾸지 못했어요.");
    numEl.textContent = qty;
    row.querySelector(".line-total").textContent = won(Number(row.dataset.price) * qty);
    renderSummary();
  });

  // 개별 체크
  list.addEventListener("change", (e) => {
    if (e.target.classList.contains("item-check")) renderSummary();
  });

  // 전체 선택
  selectAll.addEventListener("change", () => {
    rows().forEach((r) => (r.querySelector(".item-check").checked = selectAll.checked));
    renderSummary();
  });

  // 주문하기: 체크된 상품만 /order로 이동
  document.getElementById("order").addEventListener("click", () => {
    const names = rows()
      .filter((r) => r.querySelector(".item-check").checked)
      .map((r) => r.dataset.name);
    if (!names.length) return alert("주문할 상품을 선택해 주세요.");
    const params = new URLSearchParams();
    names.forEach((n) => params.append("item", n));
    location.href = "/order?" + params.toString();
  });

  renderSummary();
})();
