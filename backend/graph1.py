import random
import json


import networkx as nx
import sys
# import networkx as nx
import matplotlib.pyplot as plt

def get_pids_from_title(json_file, title):
    matching_pids = []

    with open(json_file, 'r', encoding='utf-8') as file:
        paper_data = json.load(file)

    for pid, data in paper_data.items():
        if 'title' in data and data['title'].lower() == title.lower():
            matching_pids.append(pid)

    return matching_pids

def extract_citednodes_from_link_file(link_file_path, pid):# from where seed paper cited
    with open(link_file_path, 'r', encoding='utf-8') as file:
        lines = file.readlines()

    node2_list = []

    for line in lines:
        node1, node2 = line.strip().split()
        if node1 == pid:
            node2_list.append(node2)

    return node2_list

def extract_citingnodes_from_link_file(link_file_path, pid):# paper who cited seed paper
    with open(link_file_path, 'r', encoding='utf-8') as file:
        lines = file.readlines()

    node2_list = []

    for line in lines:
        node1, node2 = line.strip().split()
        if node2 == pid:
            node2_list.append(node1)

    return node2_list


def get_date_for_pid(json_file, pid):
    with open(json_file, 'r', encoding='utf-8') as file:
        try:
            data = json.load(file)
        except json.JSONDecodeError as e:
            print(f"Error decoding JSON: {e}")
            return None

    for stored_pid, info in data.items():
        if stored_pid.strip() == pid.strip():
            date = info.get("date")
            if date in [None, ""]:
                return None
            return date

    return None
import random

def create_graph(mainpid, nodesanddates1, nodesanddates2, jsontitle_file):
    G = nx.DiGraph()  # Use DiGraph to create a directed graph

    # Add mainpid as a node
    main_date = get_date_for_pid(jsontitle_file, mainpid)
    G.add_node(mainpid, date=main_date)

    # Sort nodesanddates1 and nodesanddates2 by date in ascending order
    sorted_nodes1 = sorted(nodesanddates1, key=lambda x: x[1])
    sorted_nodes2 = sorted(nodesanddates2, key=lambda x: x[1])

    # Calculate the number of nodes in nodesanddates1 and nodesanddates2
    num_nodes1 = len(sorted_nodes1)
    num_nodes2 = len(sorted_nodes2)

    # Determine the y-values for nodesanddates1 and nodesanddates2
    max_y1 = num_nodes2  # Maximum y-value for nodesanddates1
    min_y2 = -num_nodes1  # Minimum y-value for nodesanddates2

    # Create positions for nodesanddates1 above mainpid
    node_positions = {}
    for idx, (node, _) in enumerate(sorted_nodes1, start=1):
        # Set x value to a random number between -1 and 1
        x_value = random.uniform(-1, 1)
        node_positions[node] = (x_value, max_y1 + idx)

    # Position mainpid
    # Set x value to 0 for mainpid
    node_positions[mainpid] = (0, 0)

    # Create positions for nodesanddates2 below mainpid
    for idx, (node, _) in enumerate(sorted_nodes2, start=1):
        # Set x value to a random number between -1 and 1
        x_value = random.uniform(-1, 1)
        node_positions[node] = (x_value, min_y2 - idx)

    # Add edges between mainpid and each node
    G.add_edges_from([(mainpid, node) for node, _ in sorted_nodes1 ], arrowstyle='->')

    G.add_edges_from([( node,mainpid) for node, _ in sorted_nodes2], arrowstyle='->')

    return G, node_positions





# app = dash.Dash(__name__)

# Get user input for the paper title
user_input = input("Enter the title of the paper: ")

# Path to metadata directory
meta_directory = "./cit-HepTh-abstracts"

jsontitle_file = 'pid_title_date.json'

listofpids = get_pids_from_title(jsontitle_file, user_input)

pid = 0
if len(listofpids) == 0:
    print("Title didn't match. No paper found.")
    sys.exit(1)
elif len(listofpids) > 1:
    print(listofpids,)
    ind = int(input("Which pid you want to see.. enter the index:"))
    pid = listofpids[ind]
else:
    pid = listofpids[0]

jsonindex_file = 'pid_index.json'
link_file_path = "cit-HepTh.txt/Cit-HepTh.txt"

prev_node_list = extract_citednodes_from_link_file(link_file_path, pid)
print(prev_node_list)

nxt_node_list =extract_citingnodes_from_link_file(link_file_path,pid)
print(nxt_node_list)

time_file_path = './cit-HepTh-dates.txt/Cit-HepTh-dates.txt'

nodesanddates1 = []
nodesanddates2=[]
for node2_pid in prev_node_list:
    date = get_date_for_pid(jsontitle_file, node2_pid)
    if date is None or date == "":
        date = "2024-02-01"
    
    nodesanddates1.append((node2_pid, date))
for node2_pid in nxt_node_list:
    date = get_date_for_pid(jsontitle_file, node2_pid)
    if date is None or date == "":
        date = "2024-02-01"
    
    nodesanddates2.append((node2_pid, date))
print(nodesanddates1," ",nodesanddates2)
mainpid = pid
# nodesanddates.append((mainpid, get_date_for_pid(jsontitle_file, mainpid)))
nodesanddates1 = sorted(nodesanddates1, key=lambda x: x[1])

nodesanddates2 = sorted(nodesanddates2, key=lambda x: x[1])

# print(nodesanddates)

# Create a networkx graph
graph, node_positions = create_graph(mainpid, nodesanddates1,nodesanddates2,jsontitle_file)

# Draw the graph with manual positions
nx.draw(graph, pos=node_positions, with_labels=True, font_weight='bold', node_size=1000, node_color='skyblue', font_size=8)
plt.title("Graph with mainpid as source and sorted targets based on ascending date (no overlap)")
plt.show()
