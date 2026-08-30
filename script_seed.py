import random

input_file = r'C:/Users/Madhan/.gemini/antigravity-ide/brain/995e5318-3882-4c8e-b845-e2f5dd5c26ca/scratch/stations.txt'
output_file = r'C:/Users/Madhan/OneDrive/Desktop/RIYAZ SIR/backend/seed.py'

stations = []
with open(input_file, 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if not line or not '|' in line:
            continue
        parts = line.split('|')
        name_part = parts[0].split('.', 1)[-1].strip().lstrip('|()[] ').rstrip('|()[] ')
        code_part = parts[1].split(':', 1)[-1].strip()
        cat_part = parts[2].split(':', 1)[-1].strip() if len(parts) > 2 else 'NSG6'
        
        if not code_part: continue
        stations.append({'name': name_part, 'code': code_part, 'cat': cat_part})

divs = ['MAS', 'TPJ']

out_lines = ['    station_data = [']
for i, s in enumerate(stations):
    lat = round(8.0 + random.random() * 5.0, 4)
    lng = round(76.0 + random.random() * 4.0, 4)
    div = divs[i % len(divs)]
    out_lines.append(f'        {{"name": "{s["name"]}", "code": "{s["code"]}", "category": "{s["cat"]}", "div": "{div}", "lat": {lat}, "lng": {lng}}},')
out_lines.append('    ]')
new_stations_block = '\n'.join(out_lines)

with open(output_file, 'r', encoding='utf-8') as f:
    content = f.read()

start_idx = content.find('    station_data = [')
end_idx = content.find(']', start_idx) + 1

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + new_stations_block + content[end_idx:]
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully updated seed.py with", len(stations), "stations.")
else:
    print("Could not find station_data block in seed.py")
