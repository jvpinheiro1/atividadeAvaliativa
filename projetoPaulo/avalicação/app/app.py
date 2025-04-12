from flask import Flask, jsonify,render_template
from flask_cors import CORS
import random
import mysql.connector
from mysql.connector import Error
import datetime
import requests

app = Flask(__name__)
CORS(app)

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "123456",
    "database": "dados",
}

THINGSPEAK_CONFIG = {
    "api_key": "WKHFFOU2X7UBCZXK",
    "channel_id": "2841557",
    "url": "https://api.thingspeak.com/update"
}

@app.route('/')
def index():
    return render_template('index.html')

def create_connection():
    """Cria conexão com o banco de dados"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        if conn.is_connected():
            return conn
    except Error as e:
        print(f"Erro de conexão MySQL: {e}")
    return None

def generate_sensor_data():
    """Gera dados simulados de sensores conforme a nova estrutura"""
    return {
        "umidade": round(random.uniform(30, 80), 2),
        "tensao": round(random.uniform(110, 240), 2),
        "temperatura": round(random.uniform(15, 40), 2),
        "presenca": random.randint(0, 1),  
        "data": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

def insert_sensor_data(data):
    """Insere dados no banco de dados com a nova estrutura"""
    conn = None
    cursor = None
    try:
        conn = create_connection()
        if not conn:
            return False
            
        cursor = conn.cursor()
        query = """INSERT INTO sensores 
                  (umidade, tensao, temperatura, presenca, data) 
                  VALUES (%s, %s, %s, %s, %s)"""
        
        cursor.execute(query, (
            data['umidade'],
            data['tensao'],
            data['temperatura'],
            data['presenca'],
            data['data']
        ))
        conn.commit()
        return True
    except Error as e:
        print(f"Erro MySQL: {e}")
        if conn:
            conn.rollback()
        return False
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

def post_to_thingspeak(data):
    """Adaptado para a nova estrutura de sensores"""
    try:
        payload = {
            'api_key': THINGSPEAK_CONFIG['api_key'],
            'field1': data['temperatura'],
            'field2': data['umidade'],
            'field3': data['tensao'],
            'field4': data['presenca']
        }
        response = requests.post(THINGSPEAK_CONFIG['url'], params=payload)
        return response.status_code == 200
    except Exception as e:
        print(f"Erro ao enviar para ThingSpeak: {e}")
        return False

@app.route('/sensores', methods=['GET'])
def get_sensor_data():
    """Endpoint principal adaptado"""
    data = generate_sensor_data()
    
    db_success = insert_sensor_data(data)
    
    ts_success = post_to_thingspeak(data)
    
    return jsonify({
        "status": "success",
        "data": data,
        "database": "ok" if db_success else "erro",
        "thingspeak": "enviado" if ts_success else "erro"
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)