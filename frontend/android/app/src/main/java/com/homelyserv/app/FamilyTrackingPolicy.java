package com.homelyserv.app;

final class FamilyTrackingPolicy {
    static final long MOVING_INTERVAL_MS = 30_000L;
    static final long STATIONARY_INTERVAL_MS = 5 * 60_000L;
    static final float MOVING_DISTANCE_METERS = 50f;
    static final float STATIONARY_DISTANCE_METERS = 100f;
    static final float MOVING_SPEED_MPS = 1.2f;
    static final long STATIONARY_AFTER_MS = 2 * 60_000L;

    private FamilyTrackingPolicy() {}

    static long interval(boolean moving) {
        return moving ? MOVING_INTERVAL_MS : STATIONARY_INTERVAL_MS;
    }

    static float distance(boolean moving) {
        return moving ? MOVING_DISTANCE_METERS : STATIONARY_DISTANCE_METERS;
    }

    static boolean indicatesMovement(boolean hasSpeed, float speedMetersPerSecond, float displacementMeters) {
        return hasSpeed ? speedMetersPerSecond >= MOVING_SPEED_MPS : displacementMeters >= MOVING_DISTANCE_METERS;
    }
}
