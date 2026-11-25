package town.pino.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/** Pino's town, full screen. Everything lives on the website; this is just the window. */
public class MainActivity extends Activity {
    private static final String HOME = "https://pino-bird.netlify.app/";
    private static final String HOST = "pino-bird.netlify.app";
    private WebView web;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        web = new WebView(this);
        web.setBackgroundColor(0xFFF6F1E7);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);              // Pino remembers you through localStorage
        s.setMediaPlaybackRequiresUserGesture(false); // ambience and gramophone
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setUserAgentString(s.getUserAgentString() + " PinoApp/1");

        web.setWebChromeClient(new WebChromeClient()); // shows prompt()/confirm() dialogs
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (HOST.equals(u.getHost())) return false; // stay inside the app
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) { }
                return true; // everything else opens in the phone's browser
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest req, WebResourceError err) {
                if (!req.isForMainFrame()) return;
                view.loadDataWithBaseURL(null,
                    "<html><body style='font-family:sans-serif;background:#f6f1e7;color:#3b3226;text-align:center;padding:30vh 24px'>"
                    + "<div style='font-size:48px'>🥝</div><h2>Pino can't be reached</h2>"
                    + "<p>Check your internet connection.</p>"
                    + "<button style='font-size:18px;padding:10px 22px;border-radius:99px;border:0;background:#c8643b;color:#fff' "
                    + "onclick=\"location.href='" + HOME + "'\">Try again</button></body></html>",
                    "text/html", "utf-8", null);
            }
        });

        if (saved != null) web.restoreState(saved);
        else web.loadUrl(HOME);
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onPause() {
        super.onPause();
        web.onPause(); // quiet the music when the app is in the background
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
    }
}
