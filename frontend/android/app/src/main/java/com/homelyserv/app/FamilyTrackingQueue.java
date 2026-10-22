package com.homelyserv.app;

import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

import java.util.ArrayList;
import java.util.List;

final class FamilyTrackingQueue extends SQLiteOpenHelper {
    private static final int MAX_RECORDS = 500;

    FamilyTrackingQueue(Context context) {
        super(context, "family_tracking_queue.db", null, 1);
    }

    @Override
    public void onCreate(SQLiteDatabase database) {
        database.execSQL("CREATE TABLE observations (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL)");
    }

    @Override
    public void onUpgrade(SQLiteDatabase database, int oldVersion, int newVersion) {}

    synchronized void enqueue(String json) throws Exception {
        SQLiteDatabase database = getWritableDatabase();
        database.execSQL("INSERT INTO observations(payload) VALUES(?)", new Object[]{FamilyTrackingCrypto.encrypt(json)});
        database.execSQL("DELETE FROM observations WHERE id IN (SELECT id FROM observations ORDER BY id ASC LIMIT MAX((SELECT COUNT(*) FROM observations) - ?, 0))", new Object[]{MAX_RECORDS});
    }

    synchronized List<Entry> peek(int limit) throws Exception {
        List<Entry> entries = new ArrayList<>();
        try (Cursor cursor = getReadableDatabase().rawQuery(
            "SELECT id, payload FROM observations ORDER BY id ASC LIMIT ?", new String[]{String.valueOf(limit)}
        )) {
            while (cursor.moveToNext()) entries.add(new Entry(cursor.getLong(0), FamilyTrackingCrypto.decrypt(cursor.getString(1))));
        }
        return entries;
    }

    synchronized void removeThrough(long id) {
        getWritableDatabase().delete("observations", "id <= ?", new String[]{String.valueOf(id)});
    }

    synchronized void clear() {
        getWritableDatabase().delete("observations", null, null);
    }

    synchronized int size() {
        try (Cursor cursor = getReadableDatabase().rawQuery("SELECT COUNT(*) FROM observations", null)) {
            return cursor.moveToFirst() ? cursor.getInt(0) : 0;
        }
    }

    static final class Entry {
        final long id;
        final String json;
        Entry(long id, String json) { this.id = id; this.json = json; }
    }
}
