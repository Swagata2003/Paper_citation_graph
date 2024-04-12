import json
import os

def extract_pid(file_name):
    return os.path.splitext(file_name)[0]

def list_all_pids(directory):
    pids = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            pid = extract_pid(file)
            pids.append(pid)
    return pids

directory = '../cit-HepTh-abstracts'
inputfile='../cit-HepTh.txt/Cit-HepTh.txt'
all_pids = list_all_pids(directory)
json_data={}

for pid in all_pids:
    json_data[pid]={'ref':[],'cite':[]}
with open(inputfile,'r') as file:
    for line in file:
        pid1,pid2=line.strip().split('\t')
        pid1 = pid1.zfill(7)
        pid2 = pid2.zfill(7)

        json_data[pid1]['ref'].append(pid2)
        json_data[pid2]['cite'].append(pid1)


with open('ref_cite.json', 'w') as outfile:
    json.dump(json_data, outfile, indent=4)
