# Family Tracking Android mode

Family Tracking is opt-in and does not start when a student is linked. The student must start the visible activation flow, satisfy the age safeguard, grant Android foreground location, notification, and background location permissions, and complete native-key verification.

## Smart battery-saving defaults

- Moving: balanced-power fused locations, at least 30 seconds and 50 metres apart.
- Stationary: balanced-power fused locations, at least 5 minutes and 100 metres apart.
- Motion: Android step detector and reported GPS speed switch to moving mode. Two minutes without movement returns to stationary mode.
- Batching: Android may delay delivery up to twice the selected interval.
- Queue: at most 500 AES-GCM encrypted observations, uploaded in batches of 20 with stable UUIDs.

These values prioritize useful family movement history over continuous high-accuracy polling. Android may defer or suppress updates because of battery, hardware, connectivity, or platform restrictions. HomelyServ does not guarantee continuous or real-time tracking.

The foreground service never starts at boot. It uses `START_NOT_STICKY`, requires a persistent notification, stops when permissions or server authorization fail, and clears its encrypted queue on pause, disable, logout, or account switching.

## Production attestation blocker

The local native proof uses an Android Keystore signing key and can prove that the shipped native plugin created the activation request after checking OS permissions. It is not a substitute for app/device integrity attestation because a modified client could register another key. The backend therefore rejects native completion when `NODE_ENV=production`. Production activation must remain unavailable until HomelyServ approves and configures Play Integrity or an equivalently verified Android key-attestation chain.
