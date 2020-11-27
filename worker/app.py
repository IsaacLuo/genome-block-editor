from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_celery import make_celery
import time
import redis
import random
import json
import string
import jwt

import algorithms.create_promoter_terminator
import algorithms.do_nothing

with open ('conf.json', 'r', encoding='utf-8') as fp:
    conf = json.load(fp)

REDIS_HOST = 'localhost'
REDIS_PORT = 6379

# the app is an instance of the Flask class
app = Flask(__name__)
app.config['SECRET_KEY'] = 'there is no secret'

# app.config.update takes the following parameters:
# CELERY_BROKER_URL is the URL where the message broker (RabbitMQ) is running
# CELERY_RESULT_BACKEND is required to keep track of task and store the status
app.config.update(
CELERY_BROKER_URL = 'redis://localhost:6379/0',  
CELERY_RESULT_BACKEND='redis://localhost:6379/0'
)

# integrates Flask-SocketIO with the Flask application
socketio = SocketIO(app, message_queue='redis://')
# socketio = SocketIO(app)

# the app is passed to make_celery function, this function sets up celery in order to integrate with the flask application
celery = make_celery(app)

rds = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

# route() decorator is used to define the URL where index() function is registered for
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/new_task')
def sign_in():
    token = request.cookies.get('token')
    try:
        decoded_token = jwt.decode(token, conf['secret']['jwt']['key'], algorithms='HS256')
    except:
        return jsonify({'message': 'token is incorrect'}), 401
    
    session_token = ''.join(random.choice(string.ascii_lowercase) for i in range(10))
    rds.set('GBE_WORKER_SESSION_{}'.format(session_id), token)
    return jsonify({'message':'OK', 'session_token':session_token})

# event handler for connection where the client receives a confirmation message upon the connection to the socket 
@socketio.on('create_task')
def confirmation_message(message):
    if False:
        session_token = message['sessionToken']
        jwt_token = rds.get('GBE_WORKER_SESSION_{}'.format(session_token))
        try:
            decoded_token = jwt.decode(jwt_token, conf['secret']['jwt']['key'], algorithms='HS256')
        except:
            emit('disconnect', {'message':'session id incorrect'})
            return
        
    room_id = ''.join(random.choice(string.ascii_lowercase) for i in range(10))
    join_room(room_id)
    emit('room_created', {'room_id': room_id}, room=room_id)
    message['room_id'] = room_id
    
    run_algorithm.delay(message)

@celery.task(name="task.run_algorithm")
def run_algorithm(message):
    room_id = message['room_id']
    socketio = SocketIO(message_queue='redis://')
    
    for progress in algorithms.do_nothing.do_nothing():
    # for progress in algorithms.create_promoter_terminator.create_promoter_terminator('5fae5da7b6a7d80830f56259', 500, 200):
        socketio.emit('response', {'taskId':room_id, 'percentage':progress['percentage'], 'message':progress['message']}, room=room_id)
        
        
    # count = 5
    # while count > 1 :
    #     count -= 1
    #     socketio.emit('response', {'message': count})
    #     time.sleep(1)
    # socketio.emit('response', {'message': 'name'})

# event handler for name submission by the client 
# @socketio.on('create_task')
# def name_handler(message):
#     print(message)
    # session_id = request.sid
    # roomstr = session_id
    # join_room(roomstr)
    # name = message['name']
    # message_to_client.delay(name, roomstr)
    

# message_to_client() function is meant to run as background tasks, so it needs to be decorated with the celery.task decorator 
# @celery.task(name="task.message")
# def message_to_client(name, room):
#     socketio = SocketIO(message_queue='redis://')
#     count = 5
#     while count > 1 :
#         count -= 1
#         socketio.emit('response', {'count': count}, namespace='/test', room=room)
#         time.sleep(1)
#     socketio.emit('response', {'name': name}, namespace='/test', room=room)


def application():
    socketio.run(app)

if __name__ == "__main__":
    socketio.run(app)


    