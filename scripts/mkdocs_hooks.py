from __future__ import annotations

import subprocess
import sys
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
GENERATOR = ROOT_DIR / "scripts" / "generate_docs.py"


def on_pre_build(config) -> None:  # noqa: ANN001
    subprocess.run([sys.executable, str(GENERATOR)], cwd=ROOT_DIR, check=True)
