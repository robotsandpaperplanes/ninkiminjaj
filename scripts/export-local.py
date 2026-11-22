"""Package the current Vite build as a self-contained, offline HTML prototype."""
from pathlib import Path
import base64
import mimetypes
import re
import zipfile

root = Path(__file__).resolve().parent.parent
dist = root / 'dist'
out = root.parent.parent / 'output' / 'admin-panel'
out.mkdir(parents=True, exist_ok=True)

def data_uri(path):
    mime = mimetypes.guess_type(str(path))[0] or 'application/octet-stream'
    return 'data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode()

html = (dist / 'index.html').read_text()
script = re.search(r'<script[^>]*src="([^"]+)"[^>]*></script>', html)
stylesheet = re.search(r'<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>', html)
js = (dist / script.group(1).lstrip('/')).read_text()
css = (dist / stylesheet.group(1).lstrip('/')).read_text()
for asset in (root / 'public').rglob('*'):
    if asset.is_file():
        url = '/' + asset.relative_to(root / 'public').as_posix()
        encoded = data_uri(asset)
        html = html.replace(url, encoded)
        js = js.replace(url, encoded)
        css = css.replace(url, encoded)
html = re.sub(r'<script[^>]*src="[^"]+"[^>]*></script>', lambda _: '<script type="module">' + js.replace('</script', '<\\/script') + '</script>', html)
html = re.sub(r'<link[^>]*rel="stylesheet"[^>]*>', lambda _: '<style>' + css + '</style>', html)
assert not re.search(r'(src|href)="/(assets|brand|fonts)/', html)
assert "url('/fonts/" not in html
destination = out / 'admin-panel-prototype.html'
destination.write_text(html)

with zipfile.ZipFile(out / 'admin-panel-source.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for name in ['package.json', 'package-lock.json', 'tsconfig.json', 'vite.config.ts', 'index.html', 'README.md', '.gitignore']:
        path = root / name
        if path.exists():
            archive.write(path, 'admin-panel/' + name)
    for folder in ['src', 'public', 'scripts', 'docs']:
        for path in (root / folder).rglob('*'):
            if path.is_file():
                archive.write(path, 'admin-panel/' + path.relative_to(root).as_posix())
    handoff = root.parent.parent / 'output' / 'handoff' / 'PROJECT_HANDOFF_EN.md'
    if handoff.exists():
        archive.write(handoff, 'admin-panel/docs/PROJECT_HANDOFF_EN.md')
print(destination)
print('Standalone HTML:', destination.stat().st_size, 'bytes')
