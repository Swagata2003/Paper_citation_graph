import json
import os

def extract_pid(file_name):
    return os.path.splitext(file_name)[0]

def list_all_pids(directory):
    return [extract_pid(file) for _, _, files in os.walk(directory) for file in files]

directory = '../cit-HepTh-abstracts' 
all_pids = list_all_pids(directory)
linkfile = '../cit-HepTh.txt/Cit-HepTh.txt'

disruptionscore={}

for pid in all_pids:
    reflist=[]
    citelist=[]
    with open(linkfile,'r') as file:
        for line in file:
            pid1,pid2=line.strip().split('\t')
            pid1=pid1.zfill(7)
            pid2=pid2.zfill(7)
            if pid1==pid:
                reflist.append(pid2)
            if pid2==pid:
                citelist.append(pid1)
    ref_cite_list=[]

    with open(linkfile,'r') as f:
        for line in f:
            pid1,pid2=line.strip().split('\t')
            pid1=pid1.zfill(7)
            pid2=pid2.zfill(7)
            if pid2 in reflist and pid1 != pid :
                ref_cite_list.append(pid1)

    common_list=set(citelist).intersection(set(ref_cite_list))
    onlyfocal=set(citelist)-common_list
    onlyref=set(ref_cite_list)-common_list

    ni=len(onlyfocal)
    nj=len(common_list)
    nk=len(onlyref)
    score=0;
    if (ni+nj+nk) !=0 :
        score=(ni-nj)/(ni+nj+nk)
    disruptionscore[pid]=score


with open('./disruptscore.json','w') as out:
    json.dump(disruptionscore, out, indent=4)





    