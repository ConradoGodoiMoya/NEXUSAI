import os
import shutil
import subprocess
from robotics.connectors.base_connector import BaseConnector
from robotics.services.db import IMPORTS_DIR
from robotics.services.utils import safe_name_from_path, infer_category, split_tags

class SparkFunConnector(BaseConnector):
    source_name = "sparkfun"

    REPO = "https://github.com/sparkfun/SparkFun-KiCad-Libraries.git"

    def fetch(self) -> str:
        root = os.path.join(IMPORTS_DIR, self.source_name)
        os.makedirs(root, exist_ok=True)

        dest = os.path.join(root, "SparkFun-KiCad-Libraries")
        if os.path.exists(dest):
            shutil.rmtree(dest)

        subprocess.run(["git", "clone", "--depth", "1", self.REPO, dest], check=True)
        return root

    def scan(self, local_path: str) -> list[dict]:
        items = []
        valid_exts = {".kicad_sym", ".step", ".stp", ".wrl", ".wrz", ".kicad_mod"}

        for base, _, files in os.walk(local_path):
            for file in files:
                ext = os.path.splitext(file)[1].lower()
                if ext not in valid_exts:
                    continue

                full = os.path.join(base, file)
                name = safe_name_from_path(file)

                items.append({
                    "source": self.source_name,
                    "source_path": full,
                    "name": name,
                    "category": infer_category(name),
                    "extension": ext,
                    "tags": split_tags(name),
                    "metadata": {"repo": "sparkfun"},
                    "file_count": 1,
                })

        return items