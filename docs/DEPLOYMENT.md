# HTTPS deployment

Render Blueprint: render.yaml; Node service, npm ci, npm start, /health.
PORT is supplied by Render. No application secret is required.

After Render deploys, set GitHub repository Actions variable FIRSTLIGHT_SERVER_URL
to the actual HTTPS root URL. Run Build FirstLight IPA manually. The workflow
checks live HTTP endpoints and writes that URL into Info.plist before compiling.
Until that variable is present the IPA job is skipped; no placeholder IPA is produced.

The free Render plan sleeps after inactivity. Its filesystem is ephemeral:
history files are not durable across redeploys/restarts. For persistence choose
a disk-capable paid service, mount a disk and set DATA_DIR to its mount path.
History currently belongs to the service, without per-user isolation/authentication.
Do not treat it as private account storage.

/api/report and /api/synastry/report intentionally return HTTP 501.
Local HTTP verification: node scripts/smoke.mjs http://127.0.0.1:18765
Production verification: FIRSTLIGHT_SERVER_URL=<actual HTTPS root> node scripts/smoke.mjs
The smoke check writes one synthetic history record and verifies readback.
