import re

with open('server.ts', 'r') as f:
    content = f.read()

# Let's check where app.use(express.json()) is.

print("express.json() location:")
lines = content.split('\n')
for i, line in enumerate(lines):
    if 'express.json()' in line:
        print(f"{i+1}: {line}")
