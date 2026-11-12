import pyrebase
import json
def to_int(value, default=0):
    try:
        return int(str(value).replace(",", "").strip())
    except (ValueError, TypeError):
        return default

class DBhandler:
    def __init__(self):
        with open('./authentication/firebase_auth.json') as f:
            config = json.load(f)
        firebase = pyrebase.initialize_app(config)
        self.db = firebase.database()

    def insert_item(self, name, data, img_path):
        item_info = {
            "seller": data.get('seller', '이화 붕어'),
            "addr": data.get('addr', '서울특별시 서대문구 이화여대길52'),
            "price": data.get['price'],
            "status": data.get('status', ''),
            "email": data.get('email', ''),
            "img_path": img_path,
            "desc": data.get('desc', ''),
            "order": to_int(data.get('order'), 999),
        }
        self.db.child("item").child(name).set(item_info)
        return True
    
    def _clean_item(self, name, value):
        item = dict(value)
        item["name"] = name
        item["price"] = to_int(item.get("price"))
        item["order"] = to_int(item.get("order"), 999)
        item["status"] = str(item.get("status", "")).replace(" ", "")
        return item
    
    def get_items(self):
        snap = self.db.child("item").get()
        entries = snap.each() or []
        items = [self._clean_item(res.key(), res.val()) for res in entries]
        items.sort(key=lambda x: (x["order"], x["name"]))
        return items
    
    def get_item(self, name):
        value = self.db.child("item").child(name).get().val()
        if value is None:
            return None
        return self._clean_item(name, value)
    
    def update_item(self, old_name, fields, new_name=None):
        current = self.db.child("item").child(old_name).get().val()
        if current is None:
            return "not_found"

        new_name = new_name or old_name
        if new_name == old_name:
            self.db.child("item").child(old_name).update(fields)
            return "ok"

        if self.db.child("item").child(new_name).get().val() is not None:
            return "duplicate"

        merged = dict(current)
        merged.update(fields)
        self.db.child("item").child(new_name).set(merged)
        self.db.child("item").child(old_name).remove()
        return "ok"

    def delete_item(self, name):
        self.db.child("item").child(name).remove()
        return True

    def insert_user(self, data, pw):
        user_info = {
            "id": data['id'],
            "pw": pw,
            "email": data['email'],
            "phnum": data.get('phnum', '')
        }
        if self.user_duplicate_check(str(data['id'])):
            self.db.child("user").push(user_info)
            return True
        else:
            return False
        
    def user_duplicate_check(self, id_string):
        users=self.db.child("user").get()

        if str(users.val()) == "None":
            return True
        else: 
            for res in users.each():
                value = res.val()
                    
                if value.get('id') == id_string:
                    return False
                
            return True
        
    def get_user_by_id(self, id_string):
        users = self.db.child("user").get()

        if str(users.val()) == "None":
            return None
        
        for res in users.each():
            value = res.val()

            if value.get('id') == id_string:
                return value
            
        return None

