# HTTPS deployment

Render Blueprint: render.yaml; Node service, npm ci, npm start, /health.
PORT is supplied by Render. No application secret is required.

The iOS workflow builds on a push to main or a manual dispatch. It runs the
test suite, builds the browser engine, and bundles it with the shell in the
unsigned IPA. The app opens its bundled resources through a local WebKit scheme.
Render is used for the hosted browser version and the existing HTTP APIs.

Case storage in the packaged app is scoped to the local app origin. For data
from the earlier hosted-origin app or website, export a JSON backup there and
import it in the packaged app.

The free Render plan sleeps after inactivity. Its filesystem is ephemeral:
history files are not durable across redeploys/restarts. For persistence choose
a disk-capable paid service, mount a disk and set DATA_DIR to its mount path.
History currently belongs to the service, without per-user isolation/authentication.
Do not treat it as private account storage.

/api/report and /api/synastry/report intentionally return HTTP 501.
Local HTTP verification: node scripts/smoke.mjs http://127.0.0.1:18765
Production verification: FIRSTLIGHT_SERVER_URL=<actual HTTPS root> node scripts/smoke.mjs
The smoke check writes one synthetic history record and verifies readback.
