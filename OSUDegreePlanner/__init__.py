from flask import Flask

app = Flask(__name__)
app.secret_key = 'abc123'

from . import routes, courses, login, schedule, select_degree