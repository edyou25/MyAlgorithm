from __future__ import annotations

import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
SITE_DIR = ROOT_DIR / "site"
BUILD_VERSION_PLACEHOLDER = "__BUILD_VERSION__"


def copy_tree_contents(source: Path, target: Path) -> None:
    target.mkdir(parents=True, exist_ok=True)

    for entry in source.iterdir():
        destination = target / entry.name
        if entry.is_dir():
            shutil.copytree(entry, destination, dirs_exist_ok=True)
        else:
            shutil.copy2(entry, destination)


def render_root_index(build_version: str) -> None:
    template = (ROOT_DIR / "index.html").read_text(encoding="utf-8")
    rendered = template.replace(BUILD_VERSION_PLACEHOLDER, build_version)
    (SITE_DIR / "index.html").write_text(rendered, encoding="utf-8")


def main() -> int:
    build_version = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    subprocess.run([sys.executable, "-m", "mkdocs", "build", "--strict"], cwd=ROOT_DIR, check=True)

    for filename in ("styles.css", "script.js", ".nojekyll"):
        shutil.copy2(ROOT_DIR / filename, SITE_DIR / filename)

    render_root_index(build_version)
    copy_tree_contents(ROOT_DIR / "data", SITE_DIR / "data")
    copy_tree_contents(ROOT_DIR / "assets", SITE_DIR / "assets")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
