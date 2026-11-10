/* =========================================================
   마이페이지: 주문·배송 내역을 한 화면에 하나씩 보여주기
   (DB 연결 후 주문이 많아지면 서버에서 나눠도 돼요)
   ========================================================= */
(function () {
  const PER_PAGE = 1;
  const list = document.querySelector('.order-list');
  const nav = document.querySelector('.mypage .pagination');
  if (!list || !nav) return;

  const orders = Array.from(list.children);
  const total = Math.max(1, Math.ceil(orders.length / PER_PAGE));
  const ol = nav.querySelector('.pagination__list');
  const prev = nav.querySelector('.pagination__prev');
  const next = nav.querySelector('.pagination__next');
  let current = 1;

  function show(page) {
    current = Math.min(Math.max(page, 1), total);
    orders.forEach((li, i) => {
      li.hidden = Math.floor(i / PER_PAGE) + 1 !== current;
    });

    ol.innerHTML = '';
    for (let p = 1; p <= total; p++) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.className = 'pagination__link' + (p === current ? ' is-current' : '');
      a.href = '#';
      a.textContent = p;
      if (p === current) a.setAttribute('aria-current', 'page');
      a.addEventListener('click', (e) => { e.preventDefault(); show(p); });
      li.appendChild(a);
      ol.appendChild(li);
    }
    prev.classList.toggle('is-disabled', current === 1);
    next.classList.toggle('is-disabled', current === total);
  }

  prev.addEventListener('click', (e) => { e.preventDefault(); show(current - 1); });
  next.addEventListener('click', (e) => { e.preventDefault(); show(current + 1); });

  list.classList.add('is-ready');
  show(1);
})();
