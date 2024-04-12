

import os
import json

minyr = 1992
maxyr = 2003

# This dictionary will store all the data
# Key: Filename without .abs extension
# Value: File content
all_data = {}

for year in range(minyr, maxyr + 1):
    # Construct the directory path for the current year
    data_directory = f'../cit-HepTh-abstracts/{year}'
    
    # Check if the directory exists
    if os.path.exists(data_directory):
        # List all files in the directory
        for filename in os.listdir(data_directory):
            # Construct the full path of the file
            file_path = os.path.join(data_directory, filename)
            
            # Check if it's a file and has a .abs extension
            if os.path.isfile(file_path) and filename.endswith('.abs'):
                # Open and read the file content
                with open(file_path, 'r', encoding='utf-8') as file:
                    file_data = file.read()
                    
                    # Remove the .abs extension from the filename for the key
                    key_name = filename[:-4]
                    # Add the file data to the all_data dictionary
                    all_data[key_name] = file_data

# Now, save the all_data dictionary to a JSON file
with open('metadata.json', 'w', encoding='utf-8') as json_file:
    json.dump(all_data, json_file, ensure_ascii=False, indent=4)

print("Data extraction and JSON creation complete.")

        