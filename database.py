import pyrebase
import json

class DBhandler:
    def __init__(self):
        with open('./authentication/firebase_auth.json') as f:
            config = json.load(f)
        firebase = pyrebase.initialize_app(config)
        self.db = firebase.database()

    def insert_item(self, name, data, img_path):
        item_info = {
            "seller": data['seller'],
            "addr": data['addr'],
            "price": data['price'],
            "status": data['status'],
            "email": data['email'],
            "img_path": img_path,
            "desc": data.get('desc', '') 
        }
        self.db.child("item").child(name).set(item_info)
        return True
    
    def insert_user(self, data, pw):
        user_info = {
            "id": data['id'],
            "pw": pw,
            "email": data.get('email', ''),
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
                    
                if value['id'] == id_string:
                    return False
                
            return True
    
    def get_items(self):
        data = self.db.child("item").get().val()
        return dict(data) if data else {}
        
    def get_user_by_id(self, id_string):
        users = self.db.child("user").get()

        if str(users.val()) == "None":
            return None
        
        for res in users.each():
            value = res.val()

            if value["id"] == id_string:
                return value
            
        return None

    def get_item(self, name):
        return self.db.child("item").child(name).get().val()

    def update_item_status(self, name, status):
        self.db.child("item").child(name).update({"status": status})
        return True
