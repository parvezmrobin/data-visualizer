# Data Visualizer

While dealing with large CSV files to understand the quality of the data, it is painful in the table view of pandas or Excel.
So, I build this data-visualizer app. 

It shows one entry at a time with syntax highlighting. I can choose which columns to see and pick entries randomly to better understand the quality/distribution of the data.

## Install dependencies

Install [node.js](https://nodejs.org/en/), [yarn](https://classic.yarnpkg.com/en/docs/install), [python](https://www.python.org/downloads/) ≥ 3.6, and [pip](https://pip.pypa.io/en/stable/installation/).

Then, to install node dependencies, run

```shell
yarn install
```

To install python dependencies, run

```shell
pip intall flask flask-cors
```

## Run The App

To run the app

```shell
export DATASET_ROOT=<dataset_dir>
yarn serve
```

It will run the app on http://localhost:3000.

## Just Like This

![image](https://user-images.githubusercontent.com/13452649/163719271-749cb63c-4c14-445e-b588-c9a34910780e.png)
