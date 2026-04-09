"""Remove solid black background from twooky logo PNG via edge flood-fill."""
from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image


def is_background(r: int, g: int, b: int) -> bool:
    """True for black / dark gray matte (anti-alias to black), not for colored letters."""
    spread = max(r, g, b) - min(r, g, b)
    avg = (r + g + b) / 3
    # Uniform dark = background; navy/teal/yellow have higher spread or channel separation
    if spread <= 14 and avg < 58:
        return True
    # Near-pure black
    if r <= 22 and g <= 22 and b <= 22:
        return True
    return False


def transparent_edge_background(path: Path) -> None:
    img = Image.open(path).convert("RGBA")
    w, h = img.size
    pix = img.load()
    visited = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()

    for x in range(w):
        for y in (0, h - 1):
            r, g, b, _ = pix[x, y]
            if is_background(r, g, b):
                q.append((x, y))
    for y in range(1, h - 1):
        for x in (0, w - 1):
            r, g, b, _ = pix[x, y]
            if is_background(r, g, b):
                q.append((x, y))

    while q:
        x, y = q.popleft()
        if visited[y][x]:
            continue
        r, g, b, _ = pix[x, y]
        if not is_background(r, g, b):
            continue
        visited[y][x] = True
        pix[x, y] = (r, g, b, 0)
        for dx, dy in ((0, 1), (0, -1), (1, 0), (-1, 0)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not visited[ny][nx]:
                nr, ng, nb, _ = pix[nx, ny]
                if is_background(nr, ng, nb):
                    q.append((nx, ny))

    img.save(path, optimize=True)


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    for name in ("twooky-logo.png", "twooky-logo-email.png"):
        p = root / "public" / "images" / name
        if p.exists():
            transparent_edge_background(p)
            print(f"Updated {p}")


if __name__ == "__main__":
    main()
