import os
import shutil
import subprocess
from robotics.connectors.base_connector import BaseConnector
from robotics.services.db import IMPORTS_DIR
from robotics.services.utils import safe_name_from_path, infer_category, split_tags

class ROSConnector(BaseConnector):
    source_name = "ros"

    REPOS = [
        "https://github.com/UniversalRobots/Universal_Robots_ROS2_Description.git",
    ]

    def fetch(self) -> str:
        root = os.path.join(IMPORTS_DIR, self.source_name)
        os.makedirs(root, exist_ok=True)

        for url in self.REPOS:
            repo_name = url.split("/")[-1].replace(".git", "")
            dest = os.path.join(root, repo_name)
            if os.path.exists(dest):
                shutil.rmtree(dest)
            subprocess.run(["git", "clone", "--depth", "1", url, dest], check=True)

        return root

    def scan(self, local_path: str) -> list[dict]:
        items = []
        valid_exts = {".urdf", ".xacro", ".stl", ".dae", ".obj"}

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
                    "metadata": {"repo": "ros"},
                    "file_count": 1,
                })

        return items