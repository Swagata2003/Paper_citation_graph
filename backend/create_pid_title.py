import os
import re
import json

def extract_title_and_pid(file_path):
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
        content = file.read()

    title_match = re.search(r'Title:(.+?)Author', content, re.DOTALL)
    pid_match = re.search(r'hep-th/(\d+)', content)

    if title_match and pid_match:
        title = title_match.group(1).replace('\n', ' ').strip()
        pid = pid_match.group(1)
        return title.lower(), pid
    else:
        return None, None

def process_directory(directory, output_file):
    paper_data = {}

    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.abs'):
                file_path = os.path.join(root, file)
                title, pid = extract_title_and_pid(file_path)
                if title and pid:
                    # Check if title already exists in paper_data dictionary
                    if title in paper_data:
                        paper_data[title].append(pid)
                    else:
                        paper_data[title] = [pid]

    with open(output_file, 'w', encoding='utf-8') as json_file:
        json.dump(paper_data, json_file, indent=4)

# Replace 'your_main_directory' and 'output.json' with your actual directory and desired output file name.
main_directory = '../cit-HepTh-abstracts'
output_file = 'pid_title.json'

process_directory(main_directory, output_file)

print(f"JSON file created successfully")
