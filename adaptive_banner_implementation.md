The standard AdMob banner has been replaced with an Adaptive Banner to ensure it renders at the optimal size for the device screen.

### Changes Made:

1.  **Layout Update (`activity_webview.xml`)**:
    - Removed the fixed `<com.google.android.gms.ads.AdView>` which was set to `BANNER` size.
    - Added a `<FrameLayout android:id="@+id/adViewContainer">` to serve as a container for the ad.
    - Updated constraints to position the WebView above this new container.

2.  **Logic Update (`WebViewActivity.kt`)**:
    - Implemented `getAdSize()` to calculate the optimal ad width based on the screen or container width.
    - Implemented `loadBanner()` to programmatically create the `AdView` with the calculated adaptive size.
    - Updated `updatePremiumUiState()` to manage the lifecycle of this programmatic `AdView` (creating it when needed, destroying it when premium is active).
    - Removed the old XML-based AdView initialization.

### Benefit:

The banner will now span the full width of the screen and adjust its height automatically, providing a better visual experience and potentially higher revenue compared to the small 320x50 standard banner.
