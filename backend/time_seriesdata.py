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
def getyear(pid):
    if pid[0]=='9':
        return '199'+pid[1]
    if pid[0]=='0':
        return '200'+pid[1]
    return None

json_data={}
directory = '../cit-HepTh-abstracts'

inputfile='../cit-HepTh.txt/Cit-HepTh.txt'
all_pids = list_all_pids(directory)

minyr=1992
maxyr=2003
for pid in all_pids:
    json_data[pid]=[0]*12
with open(inputfile,'r') as file:
    for line in file:
        pid1,pid2=line.strip().split('\t')
        pid1 = pid1.zfill(7)
        pid2 = pid2.zfill(7)
        year = int(getyear(pid1))
        if year is None or (year<1992) or (year>2003):
            continue  
        json_data[pid2][year-minyr]+=1
formatted_json = json.dumps({pid: json_data[pid] for pid in sorted(json_data)}, indent=4)
# print(formatted_json)

# Optionally, save the JSON data to a file
with open('timeseries.json', 'w') as outfile:
    outfile.write(formatted_json)
