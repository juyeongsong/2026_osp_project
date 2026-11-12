const PER_PAGE = 3;
const PER_GROUP = 5;
const VISIBLE_FLAVORS = 3;
const IMG = "/static/images/review/";

const filter = document.querySelector(".flavor-filter");
const flavorItems = Array.from(
  document.querySelectorAll(".flavor-filter__list li")
);
const reviewList = document.querySelector(".review-list");
const pagination = document.querySelector(".pagination");

let params = new URLSearchParams(location.search);
let start = (Number(params.get("start")) || 0) % flavorItems.length;

function makeUrl(changes) {
  const next = new URLSearchParams(params);
  next.set("start", start);
  Object.entries(changes).forEach(([key, value]) => {
    if (value === null) next.delete(key);
    else next.set(key, value);
  });
  if (!Number(next.get("start"))) next.delete("start");
  const qs = next.toString();
  return "/review" + (qs ? "?" + qs : "");
}

/* ---------------- 1) 후기 골라보기 (맛 필터) ---------------- */
function renderFilter() {
  const selected = params.get("flavor");
  filter.classList.toggle("flavor-filter--active", Boolean(selected));

  flavorItems.forEach((item) => {
    const chip = item.querySelector(".flavor-chip");
    const isSelected = item.dataset.flavor === selected;
    chip.classList.toggle("is-selected", isSelected);
    if (isSelected) chip.setAttribute("aria-current", "true");
    else chip.removeAttribute("aria-current");

    chip.href = makeUrl({
      flavor: isSelected ? null : item.dataset.flavor,
      page: null,
    });
    item.hidden = true;
  });

  for (let k = 0; k < Math.min(VISIBLE_FLAVORS, flavorItems.length); k++) {
    const item = flavorItems[(start + k) % flavorItems.length];
    item.hidden = false;
    item.style.order = k;
  }
}

filter.querySelectorAll(".flavor-filter__arrow").forEach((button) => {
  button.addEventListener("click", () => {
    const dir = Number(button.dataset.dir);
    start = (start + dir + flavorItems.length) % flavorItems.length;
    renderFilter();
    renderPagination();
  });
});

/* ---------------- 2) 예시 후기 그리기 ---------------- */
function escapeHtml(text) {
  return String(text).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c])
  );
}

function flavorName(id) {
  const item = flavorItems.find((li) => li.dataset.flavor === id);
  return item ? item.dataset.name : id;
}

function starsHtml(rating) {
  let html = `<span class="stars"><span class="sr-only">별점 ${rating}점</span>`;
  for (let i = 0; i < 5; i++) {
    html += `<img src="${IMG}star${i < rating ? "" : "-empty"}.svg" alt="">`;
  }
  return html + "</span>";
}

function detailUrl(id) {
  const query = new URLSearchParams(params);
  if (start) query.set("start", start);
  query.set("id", id);
  return "/review_detail?" + query.toString();
}

function cardHtml(review) {
  const date = review.createdAt.slice(0, 10);
  const shownDate = date.replace(/-/g, ".");
  return `
        <li>
          <a class="review-item" href="${detailUrl(review.id)}">
            <span class="avatar avatar--${escapeHtml(
              review.avatar
            )}"><img src="${IMG}fish.png" alt=""></span>
            <div class="review-item__body">
              <div class="review-item__meta">
                <span class="review-item__user">${escapeHtml(
                  review.user
                )}</span>
                <span class="review-item__flavor">구매: ${escapeHtml(
                  flavorName(review.flavor)
                )} 붕어빵</span>
                ${starsHtml(review.rating)}
              </div>
              <p class="review-item__title">${escapeHtml(review.title)}</p>
              <p class="review-item__excerpt">${escapeHtml(review.excerpt)}</p>
              <div class="review-item__footer">
                <span class="review-item__more">··· 더 보기</span>
                <time class="review-item__date" datetime="${date}">${shownDate}</time>
              </div>
            </div>
            <div class="review-item__thumb">
              <span class="bungeo">
                <img class="bungeo__fish" src="${IMG}fish.png" alt="">
                <img class="bungeo__filling" src="${IMG}filling-${escapeHtml(
    review.flavor
  )}.svg" alt="">
              </span>
            </div>
          </a>
        </li>`;
}

function renderSampleReviews() {
  const data = window.SAMPLE_REVIEWS;
  if (!data) return;

  const selected = params.get("flavor");
  const rows = data
    .filter((r) => !selected || r.flavor === selected) // 고른 맛만
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)); // 최신순

  const total = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  pagination.dataset.totalPages = total;

  const page = Math.min(Math.max(Number(params.get("page")) || 1, 1), total);
  const pageRows = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  reviewList.innerHTML = pageRows.length
    ? pageRows.map(cardHtml).join("")
    : '<li class="review-list__empty">아직 이 맛의 후기가 없어요.</li>';
}

/* ---------------- 3) 페이지 번호 ---------------- */
function renderPagination() {
  const total = Math.max(1, Number(pagination.dataset.totalPages) || 1);
  let current =
    Number(params.get("page")) || Number(pagination.dataset.currentPage) || 1;
  current = Math.min(Math.max(current, 1), total);

  const groupStart = Math.floor((current - 1) / PER_GROUP) * PER_GROUP + 1;
  const groupEnd = Math.min(groupStart + PER_GROUP - 1, total);

  const ol = pagination.querySelector(".pagination__list");
  ol.innerHTML = "";
  for (let p = groupStart; p <= groupEnd; p++) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.className = "pagination__link" + (p === current ? " is-current" : "");
    a.href = makeUrl({ page: p });
    a.textContent = p;
    if (p === current) a.setAttribute("aria-current", "page");
    li.appendChild(a);
    ol.appendChild(li);
  }

  setArrow(
    pagination.querySelector(".pagination__prev"),
    current > 1,
    current - 1
  );
  setArrow(
    pagination.querySelector(".pagination__next"),
    current < total,
    current + 1
  );
}

function setArrow(link, enabled, page) {
  link.classList.toggle("is-disabled", !enabled);
  if (enabled) {
    link.href = makeUrl({ page });
    link.removeAttribute("aria-disabled");
  } else {
    link.removeAttribute("href");
    link.setAttribute("aria-disabled", "true");
  }
}

function update(nextParams) {
  params = nextParams;
  renderFilter();
  renderSampleReviews();
  renderPagination();
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("a.flavor-chip, .pagination a");
  if (!link || !link.getAttribute("href")) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0)
    return;
  event.preventDefault();
  const href = link.getAttribute("href");
  history.pushState(null, "", href);
  update(new URLSearchParams(href.split("?")[1] || ""));
});

window.addEventListener("popstate", () => {
  const next = new URLSearchParams(location.search);
  start = (Number(next.get("start")) || 0) % flavorItems.length;
  update(next);
});

document.querySelector(".flavor-filter__list").classList.add("is-ready");
update(params);
