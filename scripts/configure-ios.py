import os, plistlib
from pathlib import Path
from urllib.parse import urlsplit
url = os.environ.get('FIRSTLIGHT_SERVER_URL', '').strip()
p = urlsplit(url)
assert p.scheme == 'https' and p.hostname and p.hostname not in ('localhost', '127.0.0.1') and not p.username and not p.password, 'Configure FIRSTLIGHT_SERVER_URL with the actual deployed HTTPS root URL'
assert p.path in ('', '/') and not p.query and not p.fragment, 'Use the HTTPS root URL'
file = Path('ios-src/Info.plist')
info = plistlib.loads(file.read_bytes())
info['FirstLightServerURL'] = url.rstrip('/') + '/'
file.write_bytes(plistlib.dumps(info, sort_keys=False))
print('Configured FirstLightServerURL:', info['FirstLightServerURL'])
