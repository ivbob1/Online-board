from flask import Flask, render_template, request, redirect, url_for, session
from flask_socketio import SocketIO, join_room, leave_room, emit
from flask_session import Session
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
app.debug = True
app.config['SECRET_KEY'] = 'secret'
app.config['SESSION_TYPE'] = 'filesystem'

Session(app)

socketio = SocketIO(app, manage_session=False)

@app.route('/')
def index():
    return render_template('index.html')

# @app.route('/draw', methods=['GET', 'POST'])
# def draw1():
#     if(request.method=='POST'):
#         room = request.form['room']
#         session['room'] = room
#         return render_template('draw.html', session = session)
#     else:
#         if(session.get('username') is not None):
#             return render_template('draw.html', session = session)
#         else:
#             return redirect(url_for('index'))

boards_points={}
@app.route('/draw/<room>', methods=['GET', 'POST'])
def draw2(room):
    session['room'] = room
    if room not in boards_points:
        boards_points[room]=[]
    #print(boards_points[room])
    return render_template('draw.html', room = room, points=boards_points[room])

@socketio.on('join1', namespace='/draw')
def join():
    join_room(session['room'])
    
@socketio.on('draw', namespace='/draw')
def on_draw(line):
    room=session['room']
    if room not in boards_points:
        boards_points[room]=[]
    boards_points[room].append(line)
    emit('draw', line, room=room)
    
if __name__ == '__main__':
    socketio.run(app,debug=True)
