---
layout: post
title: "오늘의 붕어빵은? 맛 선택 + 사다리 타기 페이지 구조와 동작"
date: 2026-11-24
---
## Context

이화 붕어빵 프로젝트는 캠퍼스에서 붕어빵을 사고파는 마켓 서비스인데, 메뉴를 등록하고 주문하는 기능 외에 "오늘 뭐 먹을지 고민될 때 재미있게 정해 주는" 기능도 하나 있으면 좋겠다는 아이디어가 나왔습니다. 그 부분을 맡아서 **맛 선택(taste_select)** 페이지와 **사다리 타기(ladder)** 페이지를 구현했습니다. 두 페이지는 따로 존재하지만, 사용자 입장에서는 이어져서 하나의 미니 게임처럼 보이도록 설계했습니다.

## Problem or goal

목표는 두 가지였습니다. 사용자가 7가지 맛 중 정확히 6개를 고르게 하는 것, 그리고 고른 맛을 두고 사다리 타기로 랜덤하게 하나를 뽑아 주는 것입니다. 별도의 API나 데이터베이스 저장 없이, 서버는 화면만 내려 주고 나머지는 전부 프론트엔드 자바스크립트만으로 구현하는 것도 하나의 조건이었습니다. Flask 쪽(`app.py`)은 `render_template("taste_select.html")`, `render_template("ladder.html")`만 호출하는 단순 GET 라우트이고, 실제 게임 로직은 각 템플릿 안의 `<script>`가 전부 처리합니다.

## Steps

맛 선택 페이지는 `pickedFlavors`라는 `Set`으로 선택 상태를 관리합니다.

```js
card.addEventListener("click", () => {
  if (pickedFlavors.has(f.name)) pickedFlavors.delete(f.name);
  else {
    if (pickedFlavors.size >= REQUIRED) return;
    pickedFlavors.add(f.name);
  }
  render();
});
```

클릭할 때마다 추가·삭제한 뒤 `render()`를 다시 불러, 선택 개수 표시(`(n / 6개 선택됨)`)와 "사다리 타러 가기" 버튼의 활성화 여부를 한 번에 갱신합니다. 정확히 6개가 채워지면 버튼이 풀리고, 누르면 토스트 메시지가 잠깐 떴다가 `/ladder`로 이동합니다. 여기서 고른 6개 맛이 실제로 사다리 페이지까지 전달되지는 않는다는 점도 코드를 보며 알게 되었습니다.

사다리 페이지는 `<svg>` 위에 세로선 6개와 고정 배열 `FIXED_RUNGS`만큼 가로선을 그립니다.

```js
const FIXED_RUNGS = [[3], [1], [0, 4], [2], [1], [0], []];
```

배열의 각 원소는 한 행(row)에서 몇 번째 칸과 그 다음 칸을 가로선으로 잇는지를 뜻합니다. 사다리 모양 자체는 랜덤이 아니라 고정이고, 대신 사용자가 고르는 출발 번호에 따라 도착지가 달라집니다. `tracePathSegments()`가 출발 칸부터 한 행씩 내려가며, 그 행에 가로선이 있으면 좌우로 한 칸 이동하고 없으면 그대로 내려가는 식으로 경로를 계산합니다. 이 경로를 `requestAnimationFrame`으로 짧게(110ms) 끊어 그리면, 선이 실제로 사다리를 타고 내려가는 것처럼 보이는 애니메이션이 완성됩니다. 또한 "사다리 타기" 버튼을 누르기 전에는 번호 버튼이 모두 비활성 상태라, 애니메이션이 끝나기 전에 다른 번호를 또 누르는 상황도 자연스럽게 막아 둡니다.

## Result
<img width="1440" alt="taste-select" src="https://github.com/user-attachments/assets/a4a5acfe-9818-4d0b-bf88-7b1ac53f7d70" />
<img width="1440" alt="ladder-work" src="https://github.com/user-attachments/assets/71986182-5582-416f-b519-37b9f7454ca9" />

## What I learned

Set 하나로 선택 상태를 다루는 패턴이 생각보다 간단했고, SVG 좌표를 직접 계산해 선을 그려 보며 애니메이션 원리를 이해할 수 있었습니다. 다만 코드를 다시 보면서, 맛 선택 페이지에서 고른 6개가 실제로 사다리 페이지까지 전달되지는 않는다는 점을 발견했습니다. 지금은 두 화면이 "보기엔 이어져 있지만 데이터로는 분리된" 상태라, 다음 과제로 남겨 두었습니다.

## References

- [MDN: Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)
- [MDN: requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)
- [MDN: SVG line element](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/line)

