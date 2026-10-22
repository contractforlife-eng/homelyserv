package com.homelyserv.app;

import org.junit.Test;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

public class FamilyTrackingPolicyTest {
    @Test
    public void movingModeSamplesMoreFrequentlyThanStationaryMode() {
        assertEquals(30_000L, FamilyTrackingPolicy.interval(true));
        assertEquals(300_000L, FamilyTrackingPolicy.interval(false));
        assertTrue(FamilyTrackingPolicy.distance(true) < FamilyTrackingPolicy.distance(false));
    }

    @Test
    public void speedAndDisplacementCanIndicateMovement() {
        assertTrue(FamilyTrackingPolicy.indicatesMovement(true, 1.2f, 0f));
        assertFalse(FamilyTrackingPolicy.indicatesMovement(true, 0.5f, 200f));
        assertTrue(FamilyTrackingPolicy.indicatesMovement(false, 0f, 50f));
        assertFalse(FamilyTrackingPolicy.indicatesMovement(false, 0f, 49f));
    }
}
