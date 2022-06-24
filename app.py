from flask import Flask, render_template, send_file
import os
import sys

app = Flask(__name__)

dir_path = os.getcwd()
print(dir_path)

if sys.platform.startswith("linux"):  # could be "linux", "linux2", "linux3", ...
    seperator = '/'
elif sys.platform == "darwin":
    seperator = '/'
else:
    seperator = '\\'


@app.route('/assets/<filename>', methods=['GET'])
def get_asset(filename):
    full_path = f'{dir_path}{seperator}static{seperator}assets{seperator}{filename}'
    return send_file(full_path, mimetype='image/gif')


@app.route('/models/<filename>', methods=['GET'])
def get_models(filename):
    full_path = f'{dir_path}{seperator}static{seperator}models{seperator}{filename}'
    return send_file(full_path, mimetype='image/gif')


@app.route('/sea2/<filename>', methods=['GET'])
def get_sea_image(filename):
    full_path = f'{dir_path}{seperator}static{seperator}sea2{seperator}{filename}'
    return send_file(full_path, mimetype='image/gif')


@app.route('/photo', methods=['GET'])
def facedetect():
    return render_template('facedetect.html')


@app.route("/")
def bella_surfing():
    return render_template('index.html')


@app.route('/black_white/<filename>', methods=['GET'])
def get_sky2_image(filename):
    full_path = f'{dir_path}{seperator}static{seperator}black_white{seperator}{filename}'
    return send_file(full_path, mimetype='image/gif')


@app.route('/sky3/<filename>', methods=['GET'])
def get_sky3_image(filename):
    full_path = f'{dir_path}{seperator}static{seperator}sky3{seperator}{filename}'
    return send_file(full_path, mimetype='image/gif')
