---
layout: post
title: "Windows에서 이화 붕어빵 사이트 로컬 실행하기 (Flask + Pyrebase4 + Firebase)"
date: 2026-11-24 11:00:00 +0900
categories: Guide
---

## 배경

이화 붕어빵 웹 사이트는 Flask로 만들고 Firebase Realtime Database에 데이터를 저장한다. 그런데 GitHub 저장소를 처음 clone한 사람은 바로 실행하기 어렵다. 저장소에 README가 없고, Firebase 접속 정보가 들어 있는 `authentication/firebase_auth.json` 파일은 보안 때문에 저장소에 올라가 있지 않기 때문이다. 이 글은 처음 실행해 보는 사람이 막히지 않도록 필요한 과정을 순서대로 정리한 안내서다.

## 목표

Windows PC에서 프로젝트를 내려받고, 내 Firebase Realtime Database에 연결해서 `http://127.0.0.1:5000`에 메인 페이지를 띄운다.

## 준비물과 확인한 환경

* Windows와 PowerShell
* Python 3.13.2, Flask 3.1.3, Pyrebase4 4.9.0 (이 환경에서 확인했다)
* Git
* Firebase를 사용할 Google 계정

---

## Step 1. 저장소 내려받기

```powershell
git clone https://github.com/juyeongsong/2026_osp_project.git
cd 2026_osp_project
```

폴더 안에는 `app.py`(Flask 서버), `database.py`(Firebase 연결과 데이터 처리), `static`, `templates`가 있다.

## Step 2. 가상환경 만들기

```powershell
python -m venv venv
venv\Scripts\Activate.ps1
```

가상환경을 쓰면 다른 프로젝트에 설치된 패키지와 섞이지 않는다. 활성화되면 프롬프트 앞에 `(venv)`가 붙는다. PowerShell에서 스크립트 실행이 막혔다는 오류가 나면 `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`를 실행한 뒤 다시 시도하거나, 명령 프롬프트(cmd)에서 `venv\Scripts\activate.bat`를 사용한다.

## Step 3. 패키지 설치

```powershell
pip install Flask Pyrebase4
```

이 프로젝트가 직접 사용하는 외부 패키지는 이 두 개뿐이다. `app.py`와 `database.py`의 나머지 import는 Python 기본 라이브러리다. 설치할 때는 `Pyrebase4`라고 쓰지만 코드에서는 `import pyrebase`로 불러오는 점이 헷갈리기 쉽다.

## Step 4. Firebase Realtime Database 만들기

이 프로젝트는 Firebase 중에서 **Realtime Database**만 사용한다. 로그인은 Firebase Authentication이 아니라 DB의 `user` 노드에 직접 저장해서 처리하고, 상품 이미지는 Firebase Storage가 아니라 `static/images` 폴더에 저장한다. 그래서 Authentication이나 Storage는 설정하지 않아도 된다.

1. Firebase 콘솔에서 새 프로젝트를 만든다.
2. 왼쪽 메뉴에서 **데이터베이스 및 스토리지 → Realtime Database → 데이터베이스 만들기**를 누른다.
3. 데이터베이스 위치는 **싱가포르(`asia-southeast1`)**를 선택했다.
4. 보안 규칙은 **테스트 모드**로 시작한다. 상단 **규칙** 탭에서 `.read`와 `.write`가 허용되어 있는지 확인한다.

> 테스트 모드의 기본 규칙에는 만료일이 들어 있다. `now < 숫자` 형태의 숫자가 만료 시각이고, 이 시각이 지나면 모든 읽기와 쓰기가 거부되어 사이트가 동작하지 않는다. 그때는 날짜를 늘리거나 규칙을 직접 수정해야 한다. 또 테스트 모드는 데이터베이스 주소를 아는 사람이면 누구나 읽고 쓸 수 있으므로, 실제 개인정보는 넣지 말고 개발용으로만 사용한다.

## Step 5. 웹 앱 등록하고 설정값 확인하기

Python 코드가 Firebase에 접속하려면 설정값이 필요하다. **프로젝트 설정의 일반 탭 → 내 앱**에서 웹 앱(`</>`)을 등록하면 `firebaseConfig`라는 설정 코드가 나타난다.

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  ...
};
```

이 중에서 우리가 쓰는 값은 `apiKey`, `authDomain`, `databaseURL`, `storageBucket` 네 가지다. 싱가포르처럼 미국이 아닌 지역에 만든 데이터베이스는 `databaseURL`에 지역 이름이 들어가서 형식이 다르다. 직접 조합하지 말고 콘솔에 표시된 값을 그대로 복사한다.

## Step 6. `firebase_auth.json` 만들기

`database.py`는 `./authentication/firebase_auth.json` 파일에서 설정을 읽는다. 이 폴더는 저장소에 없으므로 프로젝트 루트에 `authentication` 폴더를 만들고 그 안에 `firebase_auth.json`을 작성한다.

```json
{
  "apiKey": "YOUR_API_KEY",
  "authDomain": "YOUR_PROJECT.firebaseapp.com",
  "databaseURL": "YOUR_DATABASE_URL",
  "storageBucket": "YOUR_PROJECT.firebasestorage.app"
}
```

콘솔은 설정을 JavaScript 객체로 보여주기 때문에 JSON 형식으로 바꿔야 한다. 키 이름도 큰따옴표로 감싸고, 마지막 항목 뒤에는 쉼표를 붙이지 않는다. 이 파일에는 접속 정보가 들어 있으므로 GitHub에 올리지 않고 `.gitignore`에 넣어 둔다.

## Step 7. 서버 실행하기

```powershell
python app.py
```

반드시 프로젝트 루트 폴더에서 실행한다. 설정 파일 경로가 상대 경로로 적혀 있어서, `templates` 같은 다른 폴더에서 실행하면 파일을 찾지 못한다. 서버가 켜지면 브라우저에서 `http://127.0.0.1:5000`에 접속한다.

---

## 결과

![이화 붕어빵 메인 페이지](/2026_osp_project/assets/images/local-main-page.png)

처음에는 데이터베이스가 비어 있어서 메인 페이지에 상품이 보이지 않는다. `/product_register` 페이지에서 상품을 등록하면 Firebase 콘솔의 **데이터** 탭에 `item` 노드가 생기고, 메인 페이지에 상품이 나타난다.

![상품 등록 후 Firebase 데이터 탭](/2026_osp_project/assets/images/firebase-item-added.png)

## 자주 만나는 오류

* **`FileNotFoundError: ./authentication/firebase_auth.json`**: 프로젝트 루트에서 실행했는지, 폴더와 파일 이름이 정확한지 확인한다.
* **`ModuleNotFoundError: No module named 'pyrebase'`**: 가상환경이 활성화되어 있는지, `pip install Pyrebase4`를 실행했는지 확인한다.
* **Firebase에서 `Permission denied` 계열 오류**: 보안 규칙의 만료일이 지났거나 규칙이 읽기와 쓰기를 막고 있는 것이다.
* **`Activate.ps1`을 실행할 수 없다는 오류**: Step 2의 실행 정책 변경이나 cmd 방법을 사용한다.

## 배운 점

* 비밀 정보가 담긴 설정 파일은 저장소에 올리지 않기 때문에, 처음 받는 사람을 위한 안내가 따로 필요하다.
* 상대 경로로 파일을 읽는 코드는 실행하는 위치에 따라 결과가 달라진다.
* Firebase 테스트 모드 규칙은 만료일이 있고 누구나 접근할 수 있으므로, 기간과 공개 범위를 항상 확인해야 한다.

## 참고 자료

* Flask 공식 문서: [https://flask.palletsprojects.com](https://flask.palletsprojects.com)
* Pyrebase4 (PyPI): [https://pypi.org/project/Pyrebase4/](https://pypi.org/project/Pyrebase4/)
* Firebase Realtime Database 문서: [https://firebase.google.com/docs/database](https://firebase.google.com/docs/database)
