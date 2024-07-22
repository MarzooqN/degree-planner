import mysql.connector
from functools import wraps
from flask import request, jsonify
from flask_login import current_user

#Database connection function 
def get_db_connection(database):
    connection = mysql.connector.connect(
        host="34.162.95.182",
        database=database,
        user="root",
        password="OSUDEGREEPLAN!"
    )
    return connection

def role_required(*roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if current_user.role not in roles:
                return jsonify({"error": "Access denied"}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator