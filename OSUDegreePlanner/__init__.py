from flask import Flask

app = Flask(__name__)
app.secret_key = 'abc123'

from OSUDegreePlanner import routes, courses, login, schedule, select_degree
