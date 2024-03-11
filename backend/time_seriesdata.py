import json

def getyear(pid):
    if pid[0]=='9':
        return '199'+pid[1]
    if pid[0]=='0':
        return '200'+pid[1]
    return None

json_data={}

inputfile='../cit-HepTh.txt/Cit-HepTh.txt'

minyr=1992
maxyr=2003

with open(inputfile,'r') as file:
    for line in file:
        pid1,pid2=line.strip().split('\t')
        pid1 = pid1.zfill(7)
        pid2 = pid2.zfill(7)
        year = int(getyear(pid1))
        if year is None or (year<1992) or (year>2003):
            continue  
        if pid2 not in json_data:
            json_data[pid2] = [0]*12
        json_data[pid2][year-minyr]+=1
formatted_json = json.dumps({pid: json_data[pid] for pid in sorted(json_data)}, indent=4)
# print(formatted_json)

# Optionally, save the JSON data to a file
with open('timeseries.json', 'w') as outfile:
    outfile.write(formatted_json)
