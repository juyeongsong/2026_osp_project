/* =========================================================
   후기 목록 페이지 동작
   1) 후기 골라보기: 맛 버튼을 3개씩 보여주고 화살표로 하나씩 돌리기
   2) 예시 후기 그리기: 고른 맛의 후기만, 최신순으로, 한 페이지에 3개
      (js/sample-reviews.js 가 있을 때만. Flask 연결 후에는 서버가 그려줘요)
   3) 페이지 번호: 5개씩 묶어서 보여주기 (1~5, 6~10, ...)

   주소 예시: /review?flavor=sweetpotato&start=1&page=2
     flavor = 고른 맛, start = 맛 버튼 위치, page = 페이지 번호
   ========================================================= */

const PER_PAGE = 3;   // 한 페이지에 보이는 후기 수
const PER_GROUP = 5;  // 한 번에 보이는 페이지 번호 수
const VISIBLE_FLAVORS = 3;
const IMG = '/static/images/review/'; // 후기 페이지 이미지 폴더

const filter = document.querySelector('.flavor-filter');
const flavorItems = Array.from(document.querySelectorAll('.flavor-filter__list li'));
const reviewList = document.querySelector('.review-list');
const pagination = document.querySelector('.pagination');

let params = new URLSearchParams(location.search);
let start = (Number(params.get('start')) || 0) % flavorItems.length; // 맨 왼쪽 맛의 순번

/* 주소 만들기: 지금 값에 바꿀 값만 덮어써요 */
function makeUrl(changes) {
  const next = new URLSearchParams(params);
  next.set('start', start);
  Object.entries(changes).forEach(([key, value]) => {
    if (value === null) next.delete(key);
    else next.set(key, value);
  });
  if (!Number(next.get('start'))) next.delete('start');
  const qs = next.toString();
  return '/review' + (qs ? '?' + qs : '');
}

/* ---------------- 1) 후기 골라보기 (맛 필터) ---------------- */
function renderFilter() {
  const selected = params.get('flavor');
  filter.classList.toggle('flavor-filter--active', Boolean(selected));

  flavorItems.forEach((item) => {
    const chip = item.querySelector('.flavor-chip');
    const isSelected = item.dataset.flavor === selected;
    chip.classList.toggle('is-selected', isSelected);
    if (isSelected) chip.setAttribute('aria-current', 'true');
    else chip.removeAttribute('aria-current');

    // 맛을 바꾸면 1페이지부터. 이미 고른 맛을 다시 누르면 필터 해제.
    chip.href = makeUrl({ flavor: isSelected ? null : item.dataset.flavor, page: null });
    item.hidden = true;
  });

  for (let k = 0; k < Math.min(VISIBLE_FLAVORS, flavorItems.length); k++) {
    // % 연산으로 끝까지 가면 처음으로 돌아가요 (피자 → 팥)
    const item = flavorItems[(start + k) % flavorItems.length];
    item.hidden = false;
    item.style.order = k;
  }
}

filter.querySelectorAll('.flavor-filter__arrow').forEach((button) => {
  button.addEventListener('click', () => {
    const dir = Number(button.dataset.dir); // 왼쪽 -1, 오른쪽 +1
    start = (start + dir + flavorItems.length) % flavorItems.length;
    renderFilter();
    renderPagination(); // 페이지 링크에도 바뀐 위치를 담아요
  });
});

/* ---------------- 2) 예시 후기 그리기 ---------------- */
function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function flavorName(id) {
  const item = flavorItems.find((li) => li.dataset.flavor === id);
  return item ? item.dataset.name : id;
}

function starsHtml(rating) {
  let html = `<span class="stars"><span class="sr-only">별점 ${rating}점</span>`;
  for (let i = 0; i < 5; i++) {
    html += `<img src="${IMG}star${i < rating ? '' : '-empty'}.svg" alt="">`;
  }
  return html + '</span>';
}

// 상세 주소에 지금 목록 상태(맛, 페이지)를 함께 담아서
// '목록으로 돌아가기'를 누르면 보던 목록으로 돌아가요.
function detailUrl(id) {
  const query = new URLSearchParams(params);
  if (start) query.set('start', start);
  query.set('id', id);
  return '/review_detail?' + query.toString();
}

function cardHtml(review) {
  const date = review.createdAt.slice(0, 10);    // 2026-10-09
  const shownDate = date.replace(/-/g, '.');      // 2026.10.09
  return `
        <li>
          <a class="review-card" href="${detailUrl(review.id)}">
            <span class="avatar avatar--${escapeHtml(review.avatar)}"><img src="${IMG}fish.png" alt=""></span>
            <div class="review-card__body">
              <div class="review-card__meta">
                <span class="review-card__user">${escapeHtml(review.user)}</span>
                <span class="review-card__flavor">구매: ${escapeHtml(flavorName(review.flavor))} 붕어빵</span>
                ${starsHtml(review.rating)}
              </div>
              <p class="review-card__title">${escapeHtml(review.title)}</p>
              <p class="review-card__excerpt">${escapeHtml(review.excerpt)}</p>
              <div class="review-card__footer">
                <span class="review-card__more">··· 더 보기</span>
                <time class="review-card__date" datetime="${date}">${shownDate}</time>
              </div>
            </div>
            <div class="review-card__thumb">
              <span class="bungeo">
                <img class="bungeo__fish" src="${IMG}fish.png" alt="">
                <img class="bungeo__filling" src="${IMG}filling-${escapeHtml(review.flavor)}.svg" alt="">
              </span>
            </div>
          </a>
        </li>`;
}

function renderSampleReviews() {
  const data = window.SAMPLE_REVIEWS;
  if (!data) return; // Flask가 카드를 그려 주는 경우에는 아무것도 안 해요

  const selected = params.get('flavor');
  const rows = data
    .filter((r) => !selected || r.flavor === selected)          // 고른 맛만
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));     // 최신순

  const total = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  pagination.dataset.totalPages = total;

  const page = Math.min(Math.max(Number(params.get('page')) || 1, 1), total);
  const pageRows = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  reviewList.innerHTML = pageRows.length
    ? pageRows.map(cardHtml).join('')
    : '<li class="review-list__empty">아직 이 맛의 후기가 없어요.</li>';
}

/* ---------------- 3) 페이지 번호 ---------------- */
function renderPagination() {
  const total = Math.max(1, Number(pagination.dataset.totalPages) || 1);
  let current = Number(params.get('page')) || Number(pagination.dataset.currentPage) || 1;
  current = Math.min(Math.max(current, 1), total);

  // 현재 페이지가 속한 묶음: 1~5, 6~10, 11~15 ...
  const groupStart = Math.floor((current - 1) / PER_GROUP) * PER_GROUP + 1;
  const groupEnd = Math.min(groupStart + PER_GROUP - 1, total);

  const ol = pagination.querySelector('.pagination__list');
  ol.innerHTML = '';
  for (let p = groupStart; p <= groupEnd; p++) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.className = 'pagination__link' + (p === current ? ' is-current' : '');
    a.href = makeUrl({ page: p });
    a.textContent = p;
    if (p === current) a.setAttribute('aria-current', 'page');
    li.appendChild(a);
    ol.appendChild(li);
  }

  // 화살표: 한 페이지씩 이동 (5에서 ▶ 누르면 6, 즉 6~10 묶음으로)
  setArrow(pagination.querySelector('.pagination__prev'), current > 1, current - 1);
  setArrow(pagination.querySelector('.pagination__next'), current < total, current + 1);
}

function setArrow(link, enabled, page) {
  link.classList.toggle('is-disabled', !enabled);
  if (enabled) {
    link.href = makeUrl({ page });
    link.removeAttribute('aria-disabled');
  } else {
    link.removeAttribute('href');
    link.setAttribute('aria-disabled', 'true');
  }
}

/* ---------------- 화면 전체 다시 그리기 ---------------- */
function update(nextParams) {
  params = nextParams;
  renderFilter();
  renderSampleReviews();
  renderPagination();
}

document.querySelector('.flavor-filter__list').classList.add('is-ready');
update(params);
