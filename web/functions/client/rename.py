import os
import shutil
import time
import json
from random import randint


num  = randint(500,100000)
# num  = int(time.time())
src  = "build/index.html";
tgt  = "build/index" + str(num) + ".html";

print(num, tgt)

# rename source file
os.rename(src, tgt)

# save version number
json_string = json.dumps({"version":num})
f = open("version.json", "w")
f.write(json_string)
f.close()