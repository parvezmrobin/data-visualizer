import os

import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS
from pandas.io.parsers.readers import read_csv
from pandas.io.pickle import read_pickle

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


@app.route('/<directory>/<filename>', methods=['GET'])
def get_file(directory: str, filename: str):
  filepath = os.path.join(DATASET_DIR, directory, filename)
  if filepath.endswith('.pkl') or filepath.endswith('.pkl.gz'):
    df = read_pickle(filepath).astype(str)
  else:
    df = read_csv(filepath, dtype=str, keep_default_na=False)
  if df[df.columns[0]].nunique() != len(df[df.columns[0]]) and 'index' not in df.columns:
    df.insert(0, 'index', df.index.astype(str))
  list_of_rows = [
    df.columns.tolist(),
    *df.values.tolist(),
  ]
  return jsonify(list_of_rows)


@app.route('/<directory>/<filename>', methods=['PUT'])
def update_file(directory: str, filename: str):
  file_content = request.json
  df = pd.DataFrame(file_content[1:], columns=file_content[0])
  filepath = os.path.join(DATASET_DIR, directory, filename)
  df.to_csv(filepath, index=False)

  return jsonify(success=True)
