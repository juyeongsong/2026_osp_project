class _FakeQuery:
    def set(self, value):
        return True
    def push(self, value):
        return True
    def get(self):
        return _FakeQuery()
    def val(self):
        return None
    def each(self):
        return []
    def child(self, *args):
        return _FakeQuery()

class _FakeDB:
    def child(self, *args):
        return _FakeQuery()

class _FakeFirebase:
    def database(self):
        return _FakeDB()

def initialize_app(config):
    return _FakeFirebase()
