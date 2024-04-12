import os
import json
import math

def extract_pid(file_name):
    return os.path.splitext(file_name)[0]

def list_all_pids(directory):
    return [extract_pid(file) for _, _, files in os.walk(directory) for file in files]

def score(pid_list, metrics_data):
    s = 0
    for pid in pid_list:
        no = metrics_data.get(pid, {}).get('total')
        if no and no != 1:
            s += 1 / math.log(no, 10)
    return s

directory = '../cit-HepTh-abstracts'  # Replace this with the actual directory path
metricsfile = './metrics.json'
linkfile = '../cit-HepTh.txt/Cit-HepTh.txt'

with open(metricsfile, 'r') as f:
    metrics_data = json.load(f)

all_pids = list_all_pids(directory)
pid_pairs = [(all_pids[i], all_pids[j]) for i in range(len(all_pids)) for j in range(i + 1, len(all_pids))]

cocitation = {pid_pair: score(set(), metrics_data) for pid_pair in pid_pairs}

with open('./cocitationscore.json', 'w') as f:
    json.dump(cocitation, f, indent=4)
