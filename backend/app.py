from flask import Flask, render_template, request, redirect, url_for,jsonify
# from graph1 import get_pids_from_title
import json
import sys
import os
import math
import re
from typing import Any
from flask_cors import CORS
def parse_paper_data(data):
    paper_info = {}

    # Extract PID
    pattern = r'hep-th/(\d+)'

    # Search for the pattern in the data
    pidmatch = re.search(pattern, data)

    if pidmatch:
        # Extract the PID from the matched group
        paper_info['pid']= pidmatch.group(1)
    else:
        paper_info['pid']="NA"

    # Extract title
    title_match = re.search(r'Title: (.+)', data)
    if title_match:
        paper_info['title'] = title_match.group(1)
    #journal match
    journal_match=re.search(r'Journal-ref: (.+)',data)
    if journal_match:
        paper_info['journal']=journal_match.group(1)

    # Extract authors
    authors_match = re.search(r'Authors?: (.+)', data)
    if authors_match:
        authors = authors_match.group(1)
        paper_info['authors'] =authors
    else:
        authors_match = re.search(r'Author: (.+)', data)
        if authors_match:
            authors = authors_match.group(1)
            paper_info['authors'] =authors
        else:
            paper_info['authors'] =" "
     

    # Extract comments
    comments_match = re.search(r'Comments: (.+)', data)
    if comments_match:
        paper_info['comments'] = comments_match.group(1)

    # Extract body
    substring=data.split("\\")
    paper_info['body'] = substring[4]
    

    return paper_info
def getfolder(pid):
    if pid[0]=='9':
        return '199'+pid[1]
    if pid[0]=='0':
        return '200'+pid[1]
    return None
def get_pids_from_title(json_file, title):
    matching_pids = []

    with open(json_file, 'r', encoding='utf-8') as file:
        paper_data = json.load(file)

    if title.lower() in paper_data:
        # Access the array of PIDs corresponding to the title
        # print("A\n")
        matching_pids = paper_data[title.lower()]

    return matching_pids
def get_data_for_pid(pid):
    # Split the PID string by '/'
    parts = pid.split('/')
    # Extract the PID from the last part of the string
    pid = parts[-1]
    # Define the path to the directory containing the data files
    folder=getfolder(pid)
    
    data_directory = f'../cit-HepTh-abstracts/{folder}'
    # print(data_directory)
    # Construct the file path for the PID
    abs_file_path = os.path.join(data_directory, f'{pid}.abs')
    # Check if the file exists
    # print(pid)
    if os.path.exists(abs_file_path):
        # Read the data from the file
        with open(abs_file_path, 'r') as abs_file:
            data = abs_file.read()
            # print(data)
        return data
    else:
        return None


app = Flask(__name__)
CORS(app)

@app.route("/")
def hello():
	return "Hello World"

@app.route('/api/search_results', methods=['GET'])
def search_results():
    query = request.args.get('query')
    if not query:
        return jsonify({'error': 'Query parameter is missing or empty'}), 400
    

    jsontitle_file = './pid_title.json'
    pid=0
    listofpids = get_pids_from_title(jsontitle_file, query)
   
    data_list = []
    for pid in listofpids:
        data = get_data_for_pid(pid)
        parse=parse_paper_data(data)
        if parse:
            data_list.append(parse)
    
    return jsonify({'query':query,'data_list':data_list})

@app.route('/api/paper',methods=["GET"])
def paper():
    query=request.args.get('query')
    level1ref = set()
    level2ref = set()
    level1cite = set()
    level2cite = set()

    file_path = '../cit-HepTh.txt/Cit-HepTh.txt'
    with open(file_path, 'r') as f:
        for line in f:
            pid1, pid2 = line.strip().split('\t')
            pid1 = pid1.zfill(7)
            pid2 = pid2.zfill(7)
            if query == pid1:
                level1ref.add(pid2)
            elif query == pid2:
                level1cite.add(pid1)

    with open(file_path, 'r') as f:
        for pid in level1ref:
            for line in f:
                pid1, pid2 = line.strip().split('\t')
                pid1 = pid1.zfill(7)
                pid2 = pid2.zfill(7)

                if pid1 == pid:
                    level2ref.add(pid2)

    with open(file_path, 'r') as f:
        for pid in level1cite:
            for line in f:
                pid1, pid2 = line.strip().split('\t')
                pid1 = pid1.zfill(7)
                pid2 = pid2.zfill(7)
                if pid2 == pid:
                    level2cite.add(pid1)

    ref=list(level1ref.union(level2ref))
    cite=list(level1cite.union(level2cite))
    refdatalist=[]
    citedatalist=[]
    for pid in ref:
        data=get_data_for_pid(pid)
        if data is not None:
            refdatalist.append(parse_paper_data(data))
    for pid in cite:
        data=get_data_for_pid(pid)
        if data is not None:
            citedatalist.append(parse_paper_data(data))
    # print("afff",ref,"cff",cite)
    querydata=parse_paper_data(get_data_for_pid(query))
    return jsonify({'query':querydata,'reflist':refdatalist,'citelist':citedatalist})

@app.route('/api/getcitationno', methods=["GET"])
def getcitationno():
    pids = request.args.get('query')
    results = {}

    if pids:
        pids_list = pids.split(',')  # Split comma-separated string into a list of PIDs
        with open('metrics.json', 'r') as f:
            data = json.load(f)
        for pid in pids_list:
            if pid in data:  # Check if the PID exists in the metrics data
                results[pid] = data[pid]['total']
    else:
        results.append("No PIDs provided")  # Handle case when no PIDs are provided in the query

    return jsonify(results)

@app.route('/api/getmaxciteyr',methods=["GET"])
def getmaxciteyr():
    pids = request.args.get('query')
    results = {}

    if pids:
        pids_list = pids.split(',')  # Split comma-separated string into a list of PIDs
        with open('metrics.json', 'r') as f:
            data = json.load(f)
        for pid in pids_list:
            if pid in data:  # Check if the PID exists in the metrics data
                results[pid] = data[pid]['maxyr']
    else:
        results.append("No PIDs provided")  # Handle case when no PIDs are provided in the query

    return jsonify(results)
@app.route('/api/getpagerank',methods=["GET"])
def getpagerank():
    pids=request.args.get('query')
    result={}
    if pids:
        pids_list = pids.split(',')
        with open('page_ranks.json','r') as f:
            data=json.load(f)
        for pid in pids_list:
            if pid in data:
                # print(data[pid]," ")
                result[pid]=math.log(data[pid]['score'])
    else:
        result.append("No PIDs provided")  # Handle case when no PIDs are provided in the query

    return jsonify(result)
    

if __name__ == '__main__':
    app.run(debug=True)
