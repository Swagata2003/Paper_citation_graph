from flask import Flask, render_template, request, redirect, url_for,jsonify
# from graph1 import get_pids_from_title
import json
import sys
import os
import re
from typing import Any
from flask_cors import CORS


with open('./metadata.json','r') as f:
    json_data=json.load(f)


venue=set()
authorset=set()
for pid,data in json_data.items():
    pattern = r'Journal-ref: ([^\d]+)'

# Extract venue information until the first occurrence of a digit using regular expression
    match = re.search(pattern, data)

    if match:
        word=match.group(1).strip()
        venue.add(word)
    authors_match = re.search(r'Authors?: (.+)', data)
    if authors_match:
        authors = authors_match.group(1)
        authorset.add(authors)

print(len(venue))


# with open("unique_ven.txt", "w") as f:
#     # Join venue names with commas and write to the file
#     f.write(", ".join(venue))
# with open("unique_author.txt", "w") as g:
#     # Join venue names with commas and write to the file
#     g.write(", ".join(authorset))




