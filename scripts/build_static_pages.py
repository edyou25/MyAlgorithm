from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
SITE_DIR = ROOT_DIR / "site"


def copy_tree_contents(source: Path, target: Path) -> None:
    target.mkdir(parents=True, exist_ok=True)

    for entry in source.iterdir():
        destination = target / entry.name
        if entry.is_dir():
            shutil.copytree(entry, destination, dirs_exist_ok=True)
        else:
            shutil.copy2(entry, destination)


def main() -> int:
    subprocess.run([sys.executable, "-m", "mkdocs", "build", "--strict"], cwd=ROOT_DIR, check=True)

    for filename in ("index.html", "styles.css", "script.js", ".nojekyll"):
        shutil.copy2(ROOT_DIR / filename, SITE_DIR / filename)

    copy_tree_contents(ROOT_DIR / "data", SITE_DIR / "data")
    copy_tree_contents(ROOT_DIR / "assets", SITE_DIR / "assets")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
