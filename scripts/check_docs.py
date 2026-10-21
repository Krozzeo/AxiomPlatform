from pathlib import Path
import re
from urllib.parse import unquote

root = Path(__file__).resolve().parents[1]
required = ["README.md", "LICENSE", "docs/MASTER_PLAN.md", "docs/ROADMAP.md", "docs/P0_ACCEPTANCE.md", "docs/AI_HANDOFF.md", "docs/adr/0001-platform-foundation.md"]
errors = [f"Missing {name}" for name in required if not (root / name).is_file()]
files = sorted(root.rglob("*.md"))
for path in files:
    if any(part in {".git", ".axiom", "node_modules"} for part in path.relative_to(root).parts):
        continue
    for match in re.finditer(r"!?\[[^\]]*\]\(([^)]+)\)", path.read_text(encoding="utf-8")):
        target = match.group(1).strip().split(" ", 1)[0].strip("<>")
        if not target or target.startswith(("https:", "http:", "mailto:", "#")):
            continue
        dest = (path.parent / unquote(target.split("#", 1)[0])).resolve()
        if not dest.is_relative_to(root) or not dest.exists():
            errors.append(f"{path.relative_to(root)}: invalid local link {target}")
if (root / "LICENSE").is_file() and not (root / "LICENSE").read_text(encoding="utf-8").startswith("MIT License"):
    errors.append("Expected MIT license")
if errors:
    raise SystemExit("\n".join(errors))
print(f"Documentation verified: {len(files)} Markdown files; required deliverables and local links valid; MIT license present.")
