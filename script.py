import re
import random
import os

input_file = r'C:/Users/Madhan/.gemini/antigravity-ide/brain/995e5318-3882-4c8e-b845-e2f5dd5c26ca/scratch/stations.txt'
output_file = r'C:/Users/Madhan/OneDrive/Desktop/RIYAZ SIR/backend/seed_extended.py'

stations = []
with open(input_file, 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if not line or not '|' in line:
            continue
        # Example: 1. Chennai Central | Code: MAS | Category: NSG1
        parts = line.split('|')
        name_part = parts[0].split('.', 1)[-1].strip()
        
        # Clean up some weird names like "|Angamali for kaladi"
        name_part = name_part.lstrip('|()[] ').rstrip('|()[] ')
        
        code_part = parts[1].split(':', 1)[-1].strip()
        cat_part = parts[2].split(':', 1)[-1].strip() if len(parts) > 2 else 'NSG6'
        
        if not code_part:
            continue
            
        stations.append({
            'name': name_part,
            'code': code_part,
            'cat': cat_part
        })

# Existing divisions
divs = ['MAS', 'SA', 'CBE', 'PGT', 'TVC']

# Create the python code block
out_lines = ['    stations_data = [']
for i, s in enumerate(stations):
    # Assign random GPS around South India (Lat: 8-13, Lng: 76-80)
    lat = round(8.0 + random.random() * 5.0, 4)
    lng = round(76.0 + random.random() * 4.0, 4)
    div = divs[i % len(divs)]
    
    out_lines.append(f'        dict(name="{s["name"]}", code="{s["code"]}", cat="{s["cat"]}", div="{div}", lat={lat}, lng={lng}),')
out_lines.append('    ]')

new_stations_block = '\n'.join(out_lines)

# Now inject it into seed_extended.py
with open(output_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the start and end of stations_data
start_idx = content.find('stations_data = [')
end_idx = content.find(']', start_idx) + 1

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + new_stations_block + content[end_idx:]
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully updated seed_extended.py with", len(stations), "stations.")
else:
    print("Could not find stations_data block in seed_extended.py")
