---
layout: post
title: "[Concept] Flask session이란?"
date: 2026-11-24
---

## 1. 배경
저희 팀은 Flask와 Firebase로 붕어빵 주문 웹 '이화붕어빵'을 만들고 있습니다. 
회원가입과 로그인 기능을 만든 뒤, 팀원들이 각자 페이지를 개발하다 보니 공통적으로 이런 기능이 필요해졌습니다. 

  - 로그인한 사용자에게만 헤더의 MY 버튼 보여주기
  - 로그인하지 않은 사용자가 마이페이지, 후기 작성 페이지에 들어오면 로그인 페이지로 보내기
  - 다른 페이지로 이동해도 장바구니에 담은 상품 유지하기

  이 기능들은 모두 서버가 "지금 요청한 사용자가 누구인지"를 알고 있어야 만들 수 있었습니다. 그래서 저희 팀은 Flask의 session을 사용하기로 했고, 이번 글에서는 session이 무엇인지와 저희 프로젝트에서 어떻게 사용햇는지 정리해 보았습니다. 

## 2. session이란?
웹(HTTP)은 요청이 끝나면 사용자를 기억하지 못합니다. 로그인에 성공해도 다음페이지를 열면 서버는 이 사용자가 누구인지 모릅니다.

session은 이 문제를 해결하기 위해 사용자 정보를 요청 사이에 기억해 두는 방법입니다. 
쉽게 비유하자면, 가게에서 손님에게 도장이 찍힌 쿠폰을 주고 손님이 올 때마다 그 쿠폰을 가게에 보여주는 것과 비슷합니다. 

Flask의 기본 session은 데이터를 쿠키에 담아 브라우저에 보관하고, 브라우저는 다음 요청마다 그 쿠기를 같이 보냅니다. 사용자는 그 쿠키의 내용을 볼 수 있으며 고칠 수도 있기 때문에, 로그인 같은 보안이 필요한 것에는 session을 씁니다. session은 secret_key로 서명된 쿠키이며, 이 서명 때문에 하나만 고쳐도 서버가 바로 알아챌 수 있습니다. 

## 3. 프로젝트에서 활용한 방법
### 3-1. SECRET_KEY 설정
```python
app = Flask(__name__)
app.config["SECRET_KEY"] = "..."
```
session을 사용하려면 `SECRET_KEY`를 먼저 설정해야 합니다. 이 값으로 session 쿠키에 서명합니다.

### 3-2. 로그인과 로그아웃
```python
@app.route("/login_confirm", methods=["POST"])
def login_confirm():
	id = request.form["id"]
	pw = request.form["pw"]
	user = DB.get_user_by_id(id)
	pw_hash = hashlib.sha256(pw.encode("utf-8")).hexdigest()

	if user is not None and user["pw"] == pw_hash:
		session["id"] = id
		return redirect(url_for("hello"))
	else:
		flash("아이디 또는 비밀번호가 일치하지 않습니다!")
		return redirect(url_for("login"))

@app.route("/logout")
def logout():
	session.pop("id", None)
	return redirect(url_for("hello"))
```
로그인에 성공하면 `session["id"]`에 아이디를 저장하고, 로그아웃할 때는 `session.pop()`으로 지웁니다.
session에는 아이디만 저장하고 비밀번호는 저장하지 않았습니다.

### 3-3. 로그인 상태에 따라 화면 다르게 보여 주기
{% raw %}
```html
{% if session.get('id') %}
<a href="{{ url_for('view_mypage') }}" class="my-btn">MY</a>
{% endif %}
```
{% endraw %}
템플릿에서도 `session`을 바로 사용할 수 있어서, 로그인한 경우에만 MY 버튼이 보이도록 했습니다.

### 3-4. 로그인하지 않은 사용자 막기

```python
@app.route("/mypage")
def view_mypage():
	user_id = session.get("id")
	if not user_id:
		return redirect(url_for("login"))
	...
```
버튼을 숨겨도 주소를 직접 입력하면 들어올 수 있기 때문에, 서버에서도 로그인 여부를 확인했습니다.
`session["id"]` 대신 `session.get("id")`를 사용하면 값이 없을 때 에러 대신 `None`이 반환됩니다.

### 3-5. 장바구니 저장
```python
cart = session.get("cart", {})
cart[name] = min(cart.get(name, 0) + qty, 99)
session["cart"] = cart
```
장바구니는 `{상품 이름: 수량}` 형태로 session에 저장했습니다.
마지막 줄처럼 `session["cart"]`에 다시 대입해야 Flask가 변경된 것을 알고 저장합니다.

## 4. 결과
![로그인 전 헤더]({{ '/images/before_login.png' | relative_url }})
![로그인 후 헤더]({{ '/images/after_login.png' | relative_url }})
![마이페이지 접속 시도]({{ '/images/mypage.png' | relative_url }})
![로그인으로 이동]({{ '/images/login.png' | relative_url }})
![장바구니]({{ '/images/basket.png' | relative_url }})

로그인 후에는 페이지를 이동해도 로그인 상태가 유지되고, 로그인 여부에 따라 MY 버튼이 보이거나 숨겨집니다.
장바구니에 담은 상품도 다른 페이지에 다녀와도 그대로 남아 있습니다.

## 5. 배운 점
- HTTP는 사용자를 기억하지 못하기 때문에, 로그인 유지 같은 기능에는 session이 필요하다.
- Flask session은 쿠키에 저장되므로 꼭 필요한 정보만 넣어야 한다.
- 화면에서 버튼을 숨기는 것과 서버에서 접근을 막는 것은 따로 처리해야 한다.
- 현재는 `SECRET_KEY`가 코드에 직접 적혀 있어서, 나중에는 환경 변수로 분리하는 것이 좋겠다.

## 6. 참고 자료
- [Flask 공식 문서 - Sessions](https://flask.palletsprojects.com/en/stable/quickstart/#sessions)
- 2026 오픈소프트웨어플랫폼 강의 자료
- [이화붕어빵 GitHub 저장소](https://github.com/juyeongsong/2026_osp_project)
