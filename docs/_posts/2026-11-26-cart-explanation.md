---
layout: post
title: "장바구니에서 주문 완료까지: Flask와 Firebase를 활용한 주문 처리 흐름"
date: 2026-11-26
---

# 장바구니에서 주문 완료까지: Flask와 Firebase를 활용한 주문 처리 흐름

## Context

이화 붕어빵 프로젝트에서는 사용자가 상품을 장바구니에 담은 뒤, 원하는 상품을 선택하여 주문할 수 있도록 주문 기능을 구현하였습니다.

이를 위해서는 장바구니에 저장된 상품을 실제 Firebase의 상품 정보와 연결하고, 로그인 여부를 확인하며, 배송 정보를 입력받아 하나의 주문 데이터로 구성한 뒤 다시 데이터베이스에 저장합니다.

따라서 이번 주문 기능에서는 **Flask의 session, Firebase 데이터베이스, HTML form, 여러 Flask route가 하나의 흐름으로 연결되도록 구현하는 것**을 목표로 하였습니다.

## Goal

주문 기능을 구현하면서 다음과 같은 동작을 목표로 하였습니다.

- 로그인한 사용자만 주문 가능
- 장바구니에서 선택한 상품의 수량과 Firebase에 저장된 실제 상품 정보를 함께 사용
- 판매 중인 상품만 주문 가능
- 받는 사람, 연락처, 주소 등의 배송 정보를 입력
- 배송비를 포함한 주문 총액 계산
- 사용자가 원할 경우 입력한 배송지를 기본 배송지로 저장
- 생성된 주문 정보를 Firebase에 저장
- 주문한 상품은 장바구니에서 제거
- 저장된 주문 정보를 이용하여 주문 완료 페이지로 이동

## 1. 장바구니 데이터를 주문 상품으로 변환하기

장바구니에는 상품의 모든 정보를 저장하지 않고, 상품명과 수량을 Flask `session`에 저장합니다.

주문 페이지가 열리면 `build_order_items()` 함수에서 session의 장바구니를 확인한 뒤, 각 상품의 실제 정보를 Firebase에서 다시 가져옵니다.

```python
def build_order_items(names):
    cart = session.get("cart", {})
    items = []

    for name in names:
        if name not in cart:
            continue

        item = DB.get_item(name)

        if item and item.get("status") == "판매중":
            items.append({
                "name": name,
                "price": item["price"],
                "qty": cart[name],
                "image": item.get("img_path") or "fish-base.png",
            })

    return items
```

이때 장바구니에 존재하면서 현재 상태가 `"판매중"`인 상품만 주문 목록에 포함합니다.

이 구조를 사용하면 장바구니에 담은 시점의 상품 정보를 그대로 사용하는 것이 아니라, 주문 직전에 Firebase의 데이터를 다시 확인할 수 있습니다.

## 2. 주문 페이지 표시하기

사용자가 주문 페이지에 접근하면 `/order` route가 실행됩니다.

```python
@app.route("/order")
def view_order():
    if not session.get("id"):
        flash("로그인 후 주문할 수 있어요.")
        return redirect(url_for("login"))

    names = request.args.getlist("item") or list(
        session.get("cart", {}).keys()
    )

    items = build_order_items(names)

    if not items:
        flash("주문할 상품을 장바구니에서 선택해 주세요.")
        return redirect(url_for("view_cart"))

    return render_template(
        "order.html",
        items=items,
        fee=ORDER_FEE,
        default_address=DB.get_default_address(session["id"])
    )
```

먼저 `session["id"]`가 존재하는지 확인하여 로그인하지 않은 사용자는 로그인 페이지로 이동시킵니다.

그다음 장바구니에서 선택한 상품 이름을 가져와 `build_order_items()`를 통해 주문 가능한 상품 목록을 생성합니다.

주문할 상품이 없다면 다시 장바구니로 이동시키고, 정상적인 경우에는 상품 목록과 배송비, 사용자의 기본 배송지 정보를 `order.html`에 전달합니다.

즉 주문 페이지가 표시되기 전부터 **사용자 인증, 장바구니 확인, 상품 상태 확인, 사용자 정보 조회**가 순서대로 이루어집니다.

## 3. 배송 정보 확인 및 주문 금액 계산

사용자가 주문 정보를 입력하고 제출하면 `/order_complete`로 POST 요청이 전달됩니다.

```python
required_fields = (
    "receiver",
    "phone",
    "zipcode",
    "address1"
)

if any(
    not form.get(field, "").strip()
    for field in required_fields
):
    flash(
        "받는 분, 연락처, 우편번호, 주소를 모두 입력해주세요."
    )
```

받는 사람, 연락처, 우편번호, 기본 주소는 반드시 입력하도록 하였습니다.

필수 정보가 모두 입력되면 주문 상품을 다시 확인하고 주문 총액을 계산합니다.

```python
total = sum(
    i["price"] * i["qty"]
    for i in items
) + ORDER_FEE
```

각 상품의 `가격 × 수량`을 합한 뒤 배송비를 추가하여 최종 주문 금액을 생성합니다.

## 4. 기본 배송지 저장하기

주문 페이지에서는 사용자가 현재 입력한 주소를 기본 배송지로 저장할 수도 있도록 하였습니다.

```python
if form.get("save_default") == "on":
    saved = DB.save_default_address(
        user_id,
        {
            "receiver": form.get("receiver", "").strip(),
            "phone": form.get("phone", "").strip(),
            "zipcode": form.get("zipcode", "").strip(),
            "address1": form.get("address1", "").strip(),
            "address2": form.get("address2", "").strip(),
        }
    )
```

체크박스를 선택한 경우 입력된 배송 정보를 현재 로그인한 사용자의 정보에 저장합니다.

다음 주문에서는 `DB.get_default_address()`를 통해 이 정보를 다시 불러올 수 있기 때문에 같은 배송 정보를 반복해서 입력해야 하는 불편을 줄일 수 있습니다.

## 5. Firebase에 주문 정보 저장하기

배송 정보와 주문 상품이 모두 확인되면 하나의 주문 데이터가 Firebase에 저장됩니다.

```python
order_key = DB.insert_order({
    "order_id": order_id,
    "user": user_id,
    "created_at": now.strftime("%Y-%m-%d %H:%M:%S"),
    "status": "주문 접수",
    "products": products,
    "fee": ORDER_FEE,
    "total": total,
    "receiver": form.get("receiver", ""),
    "phone": form.get("phone", ""),
    "address": address,
    "zipcode": form.get("zipcode", "").strip(),
    "delivery_request": form.get("request", "").strip(),
})
```

저장되는 주문에는 사용자 ID뿐 아니라 주문 상품, 상품별 가격과 수량, 배송비, 전체 주문 금액, 배송지, 배송 요청사항 등이 함께 포함됩니다.

또한 새로운 주문의 초기 상태는 `"주문 접수"`로 저장합니다.

이렇게 저장한 주문 데이터는 이후 마이페이지의 주문 내역에서도 다시 사용됩니다.

## 6. 주문 완료 후 장바구니 정리하기

주문 저장이 성공하면 주문한 상품은 session의 장바구니에서 제거합니다.

```python
cart = session.get("cart", {})

for p in products:
    cart.pop(p["name"], None)

session["cart"] = cart
```

장바구니 전체를 무조건 비우는 것이 아니라 **실제로 주문한 상품만 삭제**합니다.

따라서 사용자가 일부 상품만 선택하여 주문한 경우에는 선택하지 않은 상품을 장바구니에 그대로 남겨둘 수 있습니다.

이후 생성된 주문의 key를 이용하여 주문 완료 페이지로 이동합니다.

## 7. 저장된 주문으로 주문 완료 페이지 구성하기

주문 완료 페이지에서는 URL로 전달된 주문 key를 이용하여 Firebase에서 주문을 다시 조회합니다.

```python
saved_order = DB.get_order(order_key)

if not saved_order or saved_order.get("user") != user_id:
    abort(404)
```

주문 데이터가 존재하는지 확인할 뿐만 아니라, 해당 주문을 생성한 사용자와 현재 로그인한 사용자가 같은지도 확인합니다.

검증이 완료되면 주문번호, 주문 일시, 받는 사람, 연락처, 주소, 상품 목록, 총액 등의 정보를 `order_complete.html`로 전달하여 최종 주문 결과가 나타나게 됩니다.

## Result

최종적으로 주문 기능은 다음과 같은 순서로 동작합니다.

**장바구니 상품 선택 → 로그인 확인 → 상품 정보 재조회 → 배송 정보 입력 → 주문 금액 계산 → Firebase에 주문 저장 → 주문 상품 장바구니에서 삭제 → 주문 완료 페이지 표시**

이 과정에서 Flask의 `session`은 사용자의 로그인 상태와 장바구니 상태를 유지하고, Firebase는 상품 및 주문과 같이 지속적으로 저장되어야 하는 데이터를 관리하는 역할을 합니다.

아래는 실제 구현한 화면의 모습입니다.

<p align="center">
  <img src="{{ site.baseurl }}/assets/images/order_item.png"
       alt="배송 정보 입력 및 주문 상품 확인 화면"
       width="800">
</p>

<p align="center">
  <img src="{{ site.baseurl }}/assets/images/order_complete.png"
       alt="주문 완료 화면"
       width="800">
</p>

주문 완료 후 Firebase Realtime Database에 주문번호, 배송 정보, 상품 정보, 배송비, 총 주문 금액 등이 저장된 모습입니다.

<p align="center">
  <img src="{{ site.baseurl }}/assets/images/firebase_order.png"
       alt="firebase realtime database"
       width="800">
</p>

## What I Learned

주문 페이지를 구현하면서 하나의 웹 페이지가 독립적으로 동작하는 것이 아니라 여러 기능과 데이터를 연결하는 역할을 한다는 점을 알게 되었습니다.

특히 장바구니의 상품을 바로 주문 데이터로 사용하는 것이 아니라, 주문 직전에 Firebase에서 상품 상태와 가격을 다시 확인하도록 구현하면서 session과 데이터베이스가 서로 다른 역할을 담당한다는 것을 이해할 수 있었습니다.

또한 사용자가 입력한 값을 그대로 저장하기 전에 필수 항목을 검증하고, 주문 저장이 성공한 이후에만 장바구니를 변경하도록 처리하는 것이 중요하다는 점을 배웠습니다.

이번 구현을 통해 Flask route 사이에서 데이터를 전달하는 방법, session을 활용해 사용자의 상태를 유지하는 방법, Firebase의 여러 데이터를 연결하여 하나의 주문 흐름을 구성하는 방법을 경험할 수 있었습니다.

## References

- [Flask 공식 문서](https://flask.palletsprojects.com/ko/stable/)
- [Firebase Realtime Database 공식 문서](https://firebase.google.com/docs/database/)
- [이화 붕어빵 프로젝트 GitHub Repository](https://github.com/juyeongsong/2026_osp_project)
