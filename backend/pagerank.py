import networkx as nx
import json

G = nx.DiGraph()
inputfile = "../cit-HepTh.txt/Cit-HepTh.txt"

with open(inputfile, "r") as file:
    for line in file:
        parts = line.strip().split("\t")
        paper_id = parts[0].zfill(7)
        G.add_node(paper_id)  # Ensure the paper itself is added as a node
        # Assuming all other parts of the line are references
        for reference_id in parts[1:]:
            reference_id = reference_id.zfill(7)
            G.add_node(reference_id)  # Ensure the reference is also added as a node
            G.add_edge(reference_id, paper_id)  # Add an edge FROM reference TO paper

page_ranks = nx.pagerank(G)

# Saving PageRank scores to a JSON file
page_ranks_json = {paper_id: {"score": rank} for paper_id, rank in page_ranks.items()}
output_json_file = "page_ranks.json"
with open(output_json_file, "w") as f:
    json.dump(page_ranks_json, f, indent=4)

print(f"PageRank scores have been saved to {output_json_file}.")
