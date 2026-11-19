import os
import math
import hashlib

from flask import Flask, render_template, request, flash, redirect, url_for, session, jsonify, abort
from database import DBhandler, to_int
from flask import Flask, render_template, request, flash, redirect, url_for, session, jsonify
from database import DBhandler
from datetime import datetime
import uuid

app = Flask(__name__)
app.config["SECRET_KEY"] = "helloosp"
DB = DBhandler()

UPLOAD_DIR = os.path.join(app.root_path, "static", "images")
os.makedirs(UPLOAD_DIR, exist_ok=True)
REVIEW_DIR = os.path.join(app.root_path, "static", "images", "reviews")
os.makedirs(REVIEW_DIR, exist_ok=True)
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024  # 업로드 5MB 제한

ADMIN_IDS = {"admin"} #관리자 아이디
PER_PAGE = 6

STATUS_LIST = ["판매중", "준비중", "품절"]
ALLOWED_IMG_EXT = {"png", "jpg", "jpeg", "gif", "webp"}

def is_admin():
    return session.get("id") in ADMIN_IDS

@app.context_processor
def inject_user():
    return {"is_admin": is_admin(), "user_id": session.get("id")}

SORT_OPTIONS = ["price_asc", "price_desc"]

@app.route("/")
def hello():
    items = DB.get_items()

    sort = request.args.get("sort", "price_asc")
    if sort not in SORT_OPTIONS:
            sort = "price_asc"
    
    if sort == "price_desc":
        items = sorted(items, key=lambda x: (-x["price"], x["name"]))
    else:
        items = sorted(items, key=lambda x: (x["price"], x["name"]))
    
    total_pages = max(1, math.ceil(len(items) / PER_PAGE))
    page = min(max(request.args.get("page", 1, type=int), 1), total_pages)
    start = (page - 1) * PER_PAGE
    return render_template(
        "main.html",
        items=items[start:start + PER_PAGE],
        page=page,
        total_pages=total_pages,
        sort=sort,
    )

@app.route("/item/<name>")
def view_item_detail(name):
    item = DB.get_item(name)
    if item is None:
        abort(404)
    return render_template("item_detail.html", item=item, status_list=STATUS_LIST)


@app.route("/item/<name>/update", methods=["POST"])
def update_item(name):
    if not is_admin():
        abort(403)

    data = request.get_json(silent=True) or request.form
    new_name = (data.get("name") or "").strip() or name
    status = data.get("status")
    if status not in STATUS_LIST:
        return jsonify({"ok": False, "message": "판매 상태가 올바르지 않아요."}), 400

    fields = {
        "desc": (data.get("desc") or "").strip(),
        "price": to_int(data.get("price")),
        "status": status,
    }

    # 새 사진이 올라왔으면 static/images에 저장하고 경로 교체
    image_file = request.files.get("img")
    if image_file and image_file.filename:
        ext = image_file.filename.rsplit(".", 1)[-1].lower() if "." in image_file.filename else ""
        if ext not in ALLOWED_IMG_EXT:
            return jsonify({"ok": False, "message": "png, jpg, gif, webp 사진만 올릴 수 있어요."}), 400
        filename = f"item_{uuid.uuid4().hex[:12]}.{ext}"
        image_file.save(os.path.join(UPLOAD_DIR, filename))
        fields["img_path"] = filename

    result = DB.update_item(name, fields, new_name)

    if result == "not_found":
        return jsonify({"ok": False, "message": "상품을 찾을 수 없어요."}), 404
    if result == "duplicate":
        return jsonify({"ok": False, "message": "같은 이름의 상품이 이미 있어요."}), 409
    return jsonify({"ok": True, "url": url_for("view_item_detail", name=new_name)})


@app.route("/item/<name>/delete", methods=["POST"])
def delete_item(name):
    if not is_admin():
        abort(403)
    DB.delete_item(name)
    return jsonify({"ok": True, "url": url_for("hello")})

@app.route("/cart/add", methods=["POST"])
def cart_add():
    data = request.get_json(silent=True) or {}
    name = data.get("name", "")
    qty = max(1, min(to_int(data.get("qty"), 1), 99))

    item = DB.get_item(name)
    if item is None or item.get("status") != "판매중":
        return jsonify({"ok": False, "message": "지금은 담을 수 없는 상품이에요."}), 400

    cart = session.get("cart", {})
    cart[name] = min(cart.get(name, 0) + qty, 99)
    session["cart"] = cart
    return jsonify({"ok": True, "count": sum(cart.values())})
    
@app.route("/cart/update", methods=["POST"])
def cart_update():
    data = request.get_json(silent=True) or {}
    name = data.get("name", "")
    qty = max(1, min(to_int(data.get("qty"), 1), 99))

    cart = session.get("cart", {})
    if name not in cart:
        return jsonify({"ok": False, "message": "장바구니에 없는 상품이에요."}), 404
    cart[name] = qty
    session["cart"] = cart
    return jsonify({"ok": True})


@app.route("/cart/remove", methods=["POST"])
def cart_remove():
    data = request.get_json(silent=True) or {}
    cart = session.get("cart", {})
    cart.pop(data.get("name", ""), None)
    session["cart"] = cart
    return jsonify({"ok": True})


@app.route("/logout")
def logout():
    session.pop("id", None)
    return redirect(url_for("hello"))
    
@app.route("/login")
def login():
    return render_template("login.html")

@app.route("/login_confirm", methods=["POST"])
def login_confirm():
    id = request.form["id"]
    pw = request.form["pw"]

    user = DB.get_user_by_id(id)

    pw_hash = hashlib.sha256(
        pw.encode("utf-8")
    ).hexdigest()

    if user is not None and user["pw"] == pw_hash:
        session["id"] = id
        return redirect(url_for("hello"))

    else:
        flash("아이디 또는 비밀번호가 일치하지 않습니다!")
        return redirect(url_for("login"))

@app.route("/signup")
def signup():
    return render_template("signup.html")

@app.route("/signup_post", methods=["POST"])
def register_user():
    data = request.form
    pw = request.form['pw']

    pw_hash = hashlib.sha256(
        pw.encode('utf-8')
    ).hexdigest()

    if DB.insert_user(data, pw_hash):
        flash("회원가입이 완료되었습니다. 로그인해주세요!")
        return redirect(url_for("login"))
    else: 
        return render_template(
            "signup.html",
            error="User ID already exists!"
        )
    
@app.route("/check_id", methods=["POST"])
def check_id():
    id = request.form["id"]

    available = DB.user_duplicate_check(id)

    return jsonify({
        "available": available
    })

@app.route("/review")
def view_review():
    return render_template("review.html")

@app.route("/mypage")
def view_mypage():
    user_id = session.get("id")
    if not user_id:
        return redirect(url_for("login"))
    user = DB.get_user_by_id(user_id) or {}
    orders = [] #주문 저장 기능 생길 시 DB에서 이 사람만 주문만 불러오도록 수정 필요
    return render_template("mypage.html", user_id=user_id, email=user.get("email", ""), orders=orders)

@app.route("/review_detail")
def view_review_detail():
    return render_template("review_detail.html")

@app.route("/reg_items")
def reg_item():
    return render_template("reg_items.html")

@app.route("/reg_reviews")
def reg_review():
    if not session.get("id"):
        flash("로그인 후 후기를 쓸 수 있어요.")
        return redirect(url_for("login"))
    return render_template(
        "reg_reviews.html",
        items=DB.get_items(),
        selected=request.args.get("product", ""),  # 마이페이지에서 ?product=상품명
    )


@app.route("/submit_review_post", methods=["POST"])
def submit_review_post():
    user_id = session.get("id")  # 폼 값 대신 로그인 정보 사용 (저장되는 값은 같아요)
    if not user_id:
        return redirect(url_for("login"))

    form = request.form
    product = form.get("product", "").strip()
    title = form.get("title", "").strip()
    content = form.get("content", "").strip()
    rating = to_int(form.get("rating"), 0)

    item_names = {i["name"] for i in DB.get_items()}
    print("입력한 상품명:", repr(product), "/ DB 상품명:", item_names)
    if product not in item_names or not title or not content or not 1 <= rating <= 5:
        flash("입력 내용을 다시 확인해 주세요. (상품명은 등록된 상품 중에서 골라 주세요)")
        return redirect(url_for("reg_review", product=product))

    # 사진 여러 장 → 파일명 리스트
    files = [f for f in request.files.getlist("file_input") if f and f.filename]
    if len(files) > 4:
        flash("사진은 최대 4장까지 올릴 수 있어요.")
        return redirect(url_for("reg_review", product=product))

    img_paths = []
    for f in files:
        ext = f.filename.rsplit(".", 1)[-1].lower() if "." in f.filename else ""
        if ext not in {"png", "jpg", "jpeg"}:
            flash("JPG, PNG 사진만 올릴 수 있어요.")
            return redirect(url_for("reg_review", product=product))
        name = f"review_{uuid.uuid4().hex[:12]}.{ext}"
        f.save(os.path.join(REVIEW_DIR, name))
        img_paths.append(name)

    try:
        DB.insert_review({
            "user": user_id,
            "product": product,
            "title": title,
            "rating": rating,
            "content": content,
            "img_path": img_paths,
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        })
    except Exception as e:
        print("후기 저장 실패:", repr(e))
        flash("후기를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.")
        return redirect(url_for("reg_review", product=product))
    return redirect(url_for("view_review"))

@app.route("/product_register")
def view_product_register():
    return render_template("product_register.html")

@app.route("/taste_select")
def view_taste_select():
    return render_template("taste_select.html")

@app.route("/ladder")
def view_ladder():
    return render_template("ladder.html")
    
# 레이아웃 확인용 임시 데이터 (제출 후 기능 연결되면 삭제)
SAMPLE_CART_ITEMS = [
    {"name": "피자 붕어빵", "price": 1000, "qty": 1, "image": "pizza.png"},
    {"name": "말차 붕어빵", "price": 500, "qty": 3, "image": "matcha.png"},
]

@app.route("/cart")
def view_cart():
    items = []
    for name, qty in session.get("cart", {}).items():
        item = DB.get_item(name)
        if item:
            items.append({
                "name": name,
                "price": item["price"],
                "qty": qty,
                "image": item.get("img_path") or "",
            })
    # 담은 상품이 없으면 임시 데이터로 레이아웃을 보여 줌
    if not items:
        items = SAMPLE_CART_ITEMS
    return render_template("cart.html", items=items, fee=1500)

@app.route("/submit_item_post", methods=["POST"])
def reg_item_submit_post():
    image_file = request.files["file_input"]
    image_file.save(os.path.join(UPLOAD_DIR, image_file.filename))
    data = request.form
    DB.insert_item(data['name'], data, image_file.filename)
    return redirect(url_for("view_item_detail", name=data['name']))

ORDER_FEE = 1500

def build_order_items(names):
    """세션 장바구니 수량 + DB 가격으로 주문 상품 목록 만들기"""
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


@app.route("/order")
def view_order():
    if not session.get("id"):
        flash("로그인 후 주문할 수 있어요.")
        return redirect(url_for("login"))
    names = request.args.getlist("item") or list(session.get("cart", {}).keys())
    items = build_order_items(names)
    if not items:
        flash("주문할 상품을 장바구니에서 선택해 주세요.")
        return redirect(url_for("view_cart"))
    return render_template("order.html", items=items, fee=ORDER_FEE, default_address=DB.get_default_address(session["id"]))


@app.route("/order_complete", methods=["POST"])
def order_complete():
    user_id = session.get("id")
    if not user_id:
        return redirect(url_for("login"))

    form = request.form
    required_fields = ("receiver", "phone", "zipcode", "address1")

    if any(not form.get(field, "").strip() for field in required_fields):
        flash("받는 분, 연락처, 우편번호, 주소를 모두 입력해주세요.")
        return redirect(
            url_for("view_order", item=form.getlist("item"))
        )
    items = build_order_items(form.getlist("item"))
    if not items:
        flash("주문할 상품이 없어요.")
        return redirect(url_for("view_cart"))

    now = datetime.now()
    total = sum(i["price"] * i["qty"] for i in items) + ORDER_FEE
    order_id = DB.next_order_id(now)
    address = f'{form.get("address1", "")} {form.get("address2", "")}'.strip()
    products = [{"name": i["name"], "price": i["price"], "qty": i["qty"]} for i in items]

    try:
        if form.get("save_default") == "on":
            saved = DB.save_default_address(user_id, {
                "receiver": form.get("receiver", "").strip(),
                "phone": form.get("phone", "").strip(),
                "zipcode": form.get("zipcode", "").strip(),
                "address1": form.get("address1", "").strip(),
                "address2": form.get("address2", "").strip(),
            })
            if not saved:
                raise ValueError("기본 배송지를 저장할 회원을 찾지 못했습니다.")

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
    except Exception as e:
        print("주문 저장 실패:", repr(e))
        flash("주문을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.")
        return redirect(url_for("view_order"))

    # 주문한 상품은 장바구니에서 제거
    cart = session.get("cart", {})
    for p in products:
        cart.pop(p["name"], None)
    session["cart"] = cart

    return redirect(
        url_for("view_order_complete", order_key=order_key),
        code=303
    )

@app.route("/order_complete/<order_key>")
def view_order_complete(order_key):
    user_id = session.get("id")
    if not user_id:
        return redirect(url_for("login"))

    saved_order = DB.get_order(order_key)

    if not saved_order or saved_order.get("user") != user_id:
        abort(404)

    order = {
        "id": saved_order["order_id"],
        "paid_at": saved_order["created_at"],
        "receiver": saved_order["receiver"],
        "phone": saved_order["phone"],
        "address": saved_order["address"],
        "products": saved_order["products"],
        "total": saved_order["total"],
    }

    return render_template("order_complete.html", order=order)

if __name__ == "__main__":
    app.run(debug=True)
