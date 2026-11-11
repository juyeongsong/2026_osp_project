/* =========================================================
   후기 상세 페이지: 주소의 id로 예시 후기를 찾아 화면에 채워요.
   예) /review_detail?id=4&flavor=sweetpotato&page=1
   (js/sample-reviews.js 가 있을 때만. Flask 연결 후에는 서버가 그려줘요)
   ========================================================= */

const DETAIL_IMG = '/static/images/review/'; // 후기 페이지 이미지 폴더

function escapeDetailHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

/* 상세 카드(article.review-detail) 안을 review 내용으로 채우기 */
function renderReviewDetail(root, review) {
  const names = window.SAMPLE_FLAVOR_NAMES || {};
  const date = review.createdAt.slice(0, 10);

  root.querySelector('.avatar').className = 'avatar avatar--' + review.avatar;
  root.querySelector('.review-detail__user').textContent = review.user;
  root.querySelector('.review-detail__flavor').textContent =
    '구매: ' + (names[review.flavor] || review.flavor) + ' 붕어빵';

  let stars = `<span class="sr-only">별점 ${review.rating}점</span>`;
  for (let i = 0; i < 5; i++) {
    stars += `<img src="${DETAIL_IMG}star${i < review.rating ? '' : '-empty'}.svg" alt="">`;
  }
  root.querySelector('.stars').innerHTML = stars;

  const time = root.querySelector('.review-detail__date');
  time.dateTime = date;
  time.textContent = date.replace(/-/g, '.');

  root.querySelector('.review-detail__content').textContent = review.content || review.excerpt;

  // 첨부 사진 (예시라서 붕어빵 그림으로 대신 보여줘요)
  const flavor = escapeDetailHtml(review.flavor);
  let photos = '';
  for (let i = 0; i < (review.photos || 0); i++) {
    photos += `
          <li>
            <span class="bungeo">
              <img class="bungeo__fish" src="${DETAIL_IMG}fish.png" alt="">
              <img class="bungeo__filling" src="${DETAIL_IMG}filling-${flavor}.svg" alt="">
            </span>
          </li>`;
  }
  const list = root.querySelector('.review-detail__photos');
  list.innerHTML = photos;
  list.hidden = !photos;
}

/* 상세 페이지에서 직접 열었을 때 */
(function () {
  const root = document.querySelector('.review-detail');
  if (!root) return;

  const params = new URLSearchParams(location.search);

  // 목록으로 돌아가기: 보던 맛·페이지 그대로
  const back = new URLSearchParams(params);
  back.delete('id');
  const qs = back.toString();
  document.querySelector('.back-link').href = '/review' + (qs ? '?' + qs : '');

  const data = window.SAMPLE_REVIEWS;
  const id = Number(params.get('id'));
  if (!data || !id) return; // id가 없으면 HTML에 적힌 예시(chooo9) 그대로

  const review = data.find((r) => r.id === id);
  if (review) {
    renderReviewDetail(root, review);
  } else {
    root.innerHTML = '<p class="review-detail__content">찾는 후기가 없어요. 목록에서 다시 골라 주세요.</p>';
  }
})();
