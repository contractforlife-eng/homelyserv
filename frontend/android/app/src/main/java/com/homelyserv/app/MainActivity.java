package com.homelyserv.app;

import android.os.Bundle;
import android.view.View;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        View rootView = findViewById(android.R.id.content);
        if (rootView != null) {
            final int[] originalPadding = new int[] {
                rootView.getPaddingLeft(),
                rootView.getPaddingTop(),
                rootView.getPaddingRight(),
                rootView.getPaddingBottom()
            };

            ViewCompat.setOnApplyWindowInsetsListener(rootView, (v, insets) -> {
                int top = insets.getInsets(WindowInsetsCompat.Type.systemBars()).top;
                int bottom = insets.getInsets(WindowInsetsCompat.Type.systemBars()).bottom;
                int left = insets.getInsets(WindowInsetsCompat.Type.systemBars()).left;
                int right = insets.getInsets(WindowInsetsCompat.Type.systemBars()).right;

                v.setPadding(
                    originalPadding[0] + left,
                    originalPadding[1] + top,
                    originalPadding[2] + right,
                    originalPadding[3] + bottom
                );

                return insets;
            });
        }
    }
}
