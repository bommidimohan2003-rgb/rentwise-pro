import sys
sys.path.insert(0, r"c:\Users\bommi\payent_project\rentwise-pro\backend")
from dbutils import pooled_db
import inspect

print("PooledDB.__init__ docstring:")
print(inspect.getdoc(pooled_db.PooledDB.__init__))
