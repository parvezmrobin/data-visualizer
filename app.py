import csv
import os

from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

assert os.getcwd().endswith('data-visualizer')
DATASET_DIR = os.getenv('DATASET_ROOT') or '../../dataset/scrap-github'


@app.route('/directories')
def get_dir_names():
  dir_names = list(filter(
    lambda fn: os.path.isdir(os.path.join(DATASET_DIR, fn)),
    os.listdir(DATASET_DIR),
  ))
  return jsonify(dir_names)


@app.route('/<directory>/files')
def get_filenames(directory: str):
  filenames = os.listdir(os.path.join(DATASET_DIR, directory))
  return jsonify(filenames)


@app.route('/<directory>/<filename>')
def get_file(directory: str, filename: str):
  filepath = os.path.join(DATASET_DIR, directory, filename)
  with open(filepath, 'r', encoding='utf-8') as file:
    content = csv.reader(file)
    return jsonify(list(content))
