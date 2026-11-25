---
layout: post
title: "후기를 써도 후기 목록에 아무것도 안 보였던 이유"
date: 2026-11-24
---

> 이화 붕어빵 후기 목록을 예시 데이터에서 Firebase DB로 바꾸던 중, 후기를 저장해도 목록이 텅 비어 있던 문제를 찾고 고친 기록입니다.

## Context: 무엇을 하고 있었나

이화 붕어빵의 후기 목록 페이지(`/review`)는 처음에 화면을 만들 때 넣어 둔 **예시 후기 31개**(`sample-reviews.js`)를 보여주고 있었습니다. 후기 작성 기능이 생기면서, 이 예시 데이터를 **Firebase에 저장된 실제 후기**로 바꾸는 작업을 했습니다.

후기 목록은 다음 순서로 동작합니다.

1. Flask(`app.py`)가 DB에서 후기를 읽어 템플릿에 넘깁니다.
2. 템플릿(`review.html`)이 그 데이터를 페이지 안에 넣어 둡니다.
3. JavaScript(`review.js`)가 데이터를 읽어서, 맛 필터와 페이지 번호에 맞게 후기 카드를 그립니다.

```python
# app.py
@app.route("/review")
def view_review():
    return render_template("review.html", reviews=review_cards())
```

`review_cards()`는 DB 후기를 화면이 쓰는 모양(작성자, 상품, 별점, 내용, 사진 주소 등)으로 바꿔 주는 함수입니다. 후기 상세 페이지(`/review_detail`)도 같은 데이터를 받습니다.

## Problem: 무엇이 문제였나

후기 작성 페이지에서 후기를 등록하면 후기 목록으로 이동합니다. 그런데 목록에 **아무것도 나오지 않았습니다.** 이상한 점이 하나 더 있었습니다. 후기가 0개일 때 나와야 하는 **"아직 이 맛의 후기가 없어요."** 문구조차 보이지 않았습니다.

![후기를 써도 비어 있는 후기 목록]({{ '/assets/images/review-empty.png' | relative_url }})

## Steps: 원인을 찾고 고친 과정

### 1. 저장은 되고 있었는지 확인하기

먼저 "저장이 안 된 건지, 저장은 됐는데 안 보이는 건지"를 나눴습니다. 후기를 등록한 순간 Flask 터미널에 이런 로그가 찍혔습니다.

```text
"POST /submit_review_post HTTP/1.1" 302 -
"GET /review HTTP/1.1" 200 -
```

`302`는 저장이 끝나고 목록으로 이동(redirect)했다는 뜻입니다. Firebase 콘솔의 `review` 아래에도 방금 쓴 후기가 들어 있었습니다. **저장은 정상이고, 보여주는 쪽이 문제**라는 걸 알 수 있었습니다.

### 2. "빈 문구조차 없다"는 단서

후기 카드를 그리는 함수는 아래와 같습니다.

```js
// static/review.js
function renderSampleReviews() {
  const data = window.REVIEWS;   // ← 문제의 줄
  if (!data) return;             // 데이터가 없으면 여기서 바로 끝

  const rows = data.filter(/* 고른 맛만 */).sort(/* 최신순 */);
  ...
  reviewList.innerHTML = pageRows.length
    ? pageRows.map(cardHtml).join("")
    : '<li class="review-list__empty">아직 이 맛의 후기가 없어요.</li>';
}
```

후기가 0개라면 `data`는 빈 배열 `[]`이고, 마지막 줄에서 빈 문구를 그려야 합니다. 그런데 빈 문구도 없었다는 건, 함수가 **마지막 줄까지 가지 못하고 `if (!data) return;`에서 멈췄다**는 뜻입니다. 즉 `data`가 빈 배열이 아니라 아예 `undefined`였습니다.

### 3. 데이터를 넘기는 방식이 바뀌어 있었다

처음에는 템플릿에서 이렇게 데이터를 넘겼습니다.

{% raw %}
```html
<script>window.REVIEWS = {{ reviews|tojson }};</script>
```
{% endraw %}

`{{ ... }}`는 Flask(Jinja) 문법이라 실행하면 진짜 JSON으로 바뀝니다. 하지만 VS Code는 `<script>` 안을 순수 JavaScript로 검사해서 빨간 오류 줄을 띄웠습니다. 실행에는 문제가 없었지만 팀원이 진짜 오류로 착각할 수 있어서, **JSON 전용 script 태그**로 바꿨습니다.

{% raw %}
```html
<!-- templates/review.html, templates/review_detail.html -->
<script id="reviews-data" type="application/json">{{ reviews|tojson }}</script>
```
{% endraw %}

`type="application/json"`인 태그는 브라우저가 실행하지 않고 데이터로만 들고 있기 때문에, 편집기 오류도 사라집니다. 대신 JavaScript에서 이 태그의 글자를 직접 읽어서 `JSON.parse`로 바꿔야 합니다.

문제는 여기서 생겼습니다. 이 방식에 맞춰 **`review-detail.js`는 고쳤지만, `review.js`는 예전처럼 `window.REVIEWS`를 읽고 있었습니다.** 이제 아무도 `window.REVIEWS`를 만들지 않으니 값은 `undefined`였고, 그래서 2번처럼 함수가 첫 줄에서 끝나 버린 것입니다.

### 4. 한 줄 고치기

`review.js`도 새 방식으로 데이터를 읽도록 바꿨습니다.

```js
// static/review.js
function renderSampleReviews() {
  const data = JSON.parse(document.getElementById("reviews-data").textContent);
  if (!data) return;
  ...
}
```

`document.getElementById("reviews-data").textContent`로 JSON 태그 안의 글자를 꺼내고, `JSON.parse`로 JavaScript 배열로 바꿉니다. `review-detail.js`도 같은 줄을 쓰고 있는지 다시 확인했습니다.

## Result: 결과

이 한 줄을 고친 뒤 후기를 등록하자 목록에 바로 나타났습니다. 맛 필터와 페이지 번호도 그대로 동작했고, 후기를 누르면 상세 페이지에 전체 내용과 사진이 나왔습니다. 후기가 없는 맛을 고르면 "아직 이 맛의 후기가 없어요." 문구도 제대로 보였습니다.

![DB 후기가 나오는 후기 목록]({{ '/assets/images/review-fixed.png' | relative_url }})

## What I learned: 배운 점

- **데이터를 주고받는 방식을 바꾸면, 그 데이터를 읽는 곳을 전부 같이 바꿔야 합니다.** 이번에는 같은 데이터를 두 파일(`review.js`, `review-detail.js`)이 읽고 있었는데 한 곳만 고쳤습니다. 이런 변경을 할 때는 예전 이름(`REVIEWS`)으로 프로젝트 전체를 검색(Ctrl+Shift+F)해서 남은 곳이 없는지 확인하는 습관이 필요합니다.
- **"무엇이 안 보이는지"가 원인을 알려 줍니다.** 목록이 비어 있다는 것보다 "빈 문구조차 없다"는 점이 결정적인 단서였습니다. 화면에 나와야 할 것과 실제로 나온 것을 비교하면 코드가 어디서 멈췄는지 좁힐 수 있습니다.
- **저장과 표시를 나눠서 확인하면 빠릅니다.** 터미널 로그와 Firebase 콘솔로 저장이 정상인 것을 먼저 확인했기 때문에, 화면 코드만 보면 된다는 걸 일찍 알 수 있었습니다.