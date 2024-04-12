import json

def getyear(pid):
    if pid[0]=='9':
        return '199'+pid[1]
    if pid[0]=='0':
        return '200'+pid[1]
    return None
json_data={}

inputfile='./timeseries.json'

minyr=1992
maxyr=2003

with open(inputfile,'r') as f:
    json_data=json.load(f)

citation={}

for pid,data in json_data.items():
    year=int(getyear(pid))

    if year is not None:
        total=sum(data)
        maxcite=0
        maxcityr=year
        c5= data[year-minyr+5] if year - minyr+ 5 < len(data) else -1
        c10=data[year-minyr+10] if year-minyr+10<len(data)else -1
        
        mean=total/(maxyr-year+1)
        for i in range(0,12) :
            if data[i] > maxcite:
                maxcityr=1992+i
                maxcite=data[i]
        citation[pid]={
            'total': total,
            'c5': c5,
            'c10': c10,
            'mean': mean,
            'max': maxcite,
            'maxyr':maxcityr
        }
with open('metrics.json', 'w') as outfile:
    json.dump(citation, outfile, indent=4)

