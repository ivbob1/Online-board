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

@socketio.on('erase_all', namespace='/draw')
def erase_all():
    room=session['room']
    if room not in boards_points:
        boards_points[room]=[]
    boards_points[room]=[]
    emit('erase_all', room=room)

@socketio.on('erase', namespace='/draw')
def erase(data):
    room=session['room']
    if room not in boards_points:
        boards_points[room]=[]
    points_new=[];
    for i in boards_points[room]:
        x1=i['from']['x']
        y1=i['from']['y']
        x3=i['to']['x']
        y3=i['to']['y']
        x2=data['center']['x']
        y2=data['center']['y']
        if (x1-x2)**2+(y1-y2)**2 > data['R']*data['R'] and (x3-x2)**2+(y3-y2)**2 > data['R']*data['R']:
            points_new.append(i)
    boards_points[room]=points_new
    emit('erase', data, room=room)
    
if __name__ == '__main__':
    socketio.run(app,debug=True)
