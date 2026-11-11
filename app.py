import os
import hashlib

from flask import Flask, render_template, request, flash, redirect, url_for, session
from database import DBhandler

app = Flask(__name__)
app.config["SECRET_KEY"] = "helloosp"
DB = DBhandler()

UPLOAD_DIR = os.path.join(app.root_path, "static", "images")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.route("/")
def hello():
    return render_template("index.html")
    
@app.route("/login")
def login():
    return render_template("login.html")

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

@app.route("/list")
def view_list():
    return render_template("list.html")

@app.route("/review")
def view_review():
    return render_template("review.html")

@app.route("/reg_items")
def reg_item():
    return render_template("reg_items.html")

@app.route("/reg_reviews")
def reg_review():
    return render_template("reg_reviews.html")
    
@app.route("/cart")
def view_cart():
    # 임시 데이터 (시안과 동일). 나중에 DB 연동 시 교체
    items = [
        {"name": "피자 붕어빵", "price": 1000, "qty": 1, "image": "pizza.png"},
        {"name": "말차 붕어빵", "price": 500, "qty": 3, "image": "matcha.png"},
    ]
    return render_template("cart.html", items=items, fee=1500)

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
