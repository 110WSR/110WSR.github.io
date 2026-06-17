import subprocess
import os

os.chdir("f:/5ednd")
subprocess.run(["git", "add", "-A"], check=True)
subprocess.run(["git", "commit", "-m", "refactor: split CharacterCreator into components"], check=True)
print("OK")