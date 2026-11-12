import os
import math
import hashlib

from flask import Flask, render_template, request, flash, redirect, url_for, session, jsonify, abort
from database import DBhandler, to_int

app = Flask(__name__)
app.config["SECRET_KEY"] = "helloosp"
DB = DBhandler()

UPLOAD_DIR = os.path.join(app.root_path, "static", "images")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ADMIN_IDS = {"admin"} #관리자 아이디
PER_PAGE = 6

STATUS_LIST = ["판매중", "준비중", "품절"]

def is_admin():
    return session.get("id") in ADMIN_IDS

@app.context_processor
def inject_user():
    return {"is_admin": is_admin(), "user_id": session.get("id")}

@app.route("/")
def hello():
    items = DB.get_items()
    total_pages = max(1, math.ceil(len(items) / PER_PAGE))
    page = min(max(request.args.get("page", 1, type=int), 1), total_pages)
    start = (page - 1) * PER_PAGE
    return render_template(
        "main.html",
        items=items[start:start + PER_PAGE],
        page=page,
        total_pages=total_pages,
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

    data = request.get_json(silent=True) or {}
    new_name = (data.get("name") or "").strip() or name
    status = data.get("status")
    if status not in STATUS_LIST:
        return jsonify({"ok": False, "message": "판매 상태가 올바르지 않아요."}), 400

    fields = {
        "desc": (data.get("desc") or "").strip(),
        "price": to_int(data.get("price")),
        "status": status,
    }
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
    print(data)
    pw = request.form['pw']

    pw_hash = hashlib.sha256(
        pw.encode('utf-8')
    ).hexdigest()

    if DB.insert_user(data, pw_hash):
        return render_template("login.html")
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

@app.route("/list")
def view_list():
    return render_template("list.html")

@app.route("/review")
def view_review():
    return render_template("review.html")

@app.route("/mypage")
def view_mypage():
    return render_template("mypage.html")

@app.route("/review_detail")
def view_review_detail():
    return render_template("review_detail.html")

@app.route("/reg_items")
def reg_item():
    return render_template("reg_items.html")

@app.route("/reg_reviews")
def reg_review():
    return render_template("reg_reviews.html")

@app.route("/product_register")
def view_product_register():
    return render_template("product_register.html")

@app.route("/taste_select")
def view_taste_select():
    return render_template("taste_select.html")

@app.route("/ladder")
def view_ladder():
    return render_template("ladder.html")
    
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
    return render_template("cart.html", items=items, fee=1500 if items else 0)

@app.route("/submit_item_post", methods=["POST"])
def reg_item_submit_post():
    image_file = request.files["file_input"]
    image_file.save(os.path.join(UPLOAD_DIR, image_file.filename))
    data = request.form
    DB.insert_item(data['name'], data, image_file.filename)
    return render_template("result.html", data=data,
                           img_path="images/" + image_file.filename)

if __name__ == "__main__":
    app.run(debug=True)
