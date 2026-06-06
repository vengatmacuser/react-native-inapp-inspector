import React, {forwardRef, useState} from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';

export interface WebViewLog {
  id: number;
  type: 'log' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
}

export interface WebViewNavState {
  url: string;
  title?: string;
  timestamp: number;
}

let OriginalWebView: any = null;
try {
  const RNWebView = require('react-native-webview');
  OriginalWebView = RNWebView.WebView || RNWebView.default;
} catch (e) {
  // Silent fail
}

const injectJS = `
(function() {
    if (!window.__webview_console_overridden__) {
    window.__webview_console_overridden__ = true;
    var originalLog = console.log;
    var originalWarn = console.warn;
    var originalError = console.error;
    var originalInfo = console.info;

    var sendToRN = function(type, args) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        var messageStr = '';
        try {
            var argsList = [];
            for (var i = 0; i < args.length; i++) {
            var arg = args[i];
            if (typeof arg === 'object') {
                try {
                argsList.push(JSON.stringify(arg));
                } catch (e) {
                argsList.push(String(arg));
                }
            } else {
                argsList.push(String(arg));
            }
            }
            messageStr = argsList.join(' ');
        } catch (err) {
            messageStr = String(args);
        }

        try {
            window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'webview-log',
            logType: type,
            message: messageStr
            }));
        } catch (postErr) {}
        }
    };

    console.log = function() {
        if (originalLog) {
        originalLog.apply(console, arguments);
        }
        sendToRN('log', arguments);
    };
    console.warn = function() {
        if (originalWarn) {
        originalWarn.apply(console, arguments);
        }
        sendToRN('warn', arguments);
    };
    console.error = function() {
        if (originalError) {
        originalError.apply(console, arguments);
        }
        sendToRN('error', arguments);
    };
    console.info = function() {
        if (originalInfo) {
        originalInfo.apply(console, arguments);
        }
        sendToRN('info', arguments);
    };
    }

    if (!window.__webview_html_capture_setup__) {
    window.__webview_html_capture_setup__ = true;

    var sendHtmlRetries = 0;
    window.__webview_send_html__ = function() {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        try {
            var html = '';
            try {
            if (document && document.documentElement) {
                html = document.documentElement.outerHTML || '';
            }
            } catch (e) {}

            // Get CSS
            var css = '';
            try {
            var sheets = document.styleSheets;
            if (sheets) {
                for (var i = 0; i < sheets.length; i++) {
                var sheet = sheets[i];
                try {
                    var rules = sheet.cssRules || sheet.rules;
                    if (rules) {
                    for (var j = 0; j < rules.length; j++) {
                        css += rules[j].cssText + String.fromCharCode(10);
                    }
                    }
                } catch (e) {
                    if (sheet.href) {
                    css += '/* External stylesheet: ' + sheet.href + ' */' + String.fromCharCode(10);
                    }
                }
                }
            }
            } catch (e) {}

            try {
            var styles = document.querySelectorAll('style');
            if (styles) {
                for (var i = 0; i < styles.length; i++) {
                var style = styles[i];
                if (style && style.textContent) {
                    if (css.indexOf(style.textContent) === -1) {
                    css += style.textContent + String.fromCharCode(10);
                    }
                }
                }
            }
            } catch (e) {}

            // Get JS
            var js = '';
            try {
            var scripts = document.querySelectorAll('script');
            if (scripts) {
                for (var i = 0; i < scripts.length; i++) {
                var script = scripts[i];
                if (script) {
                    if (script.src) {
                    js += '// External Script: ' + script.src + String.fromCharCode(10);
                    } else if (script.textContent) {
                    js += script.textContent + String.fromCharCode(10);
                    }
                }
                }
            }
            } catch (e) {}

            try {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'webview-html',
                html: html,
                css: css,
                js: js,
                url: window.location.href
            }));
            } catch (postError) {
            try {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'webview-html',
                html: html,
                css: '/* CSS truncated due to size limit */',
                js: '/* JS truncated due to size limit */',
                url: window.location.href
                }));
            } catch (htmlOnlyError) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'webview-html',
                html: '<h1>Page source too large to capture</h1>',
                url: window.location.href
                }));
            }
            }
        } catch (err) {}
        } else if (sendHtmlRetries < 50) {
        sendHtmlRetries++;
        setTimeout(window.__webview_send_html__, 100);
        }
    };

    var debounceTimeout = null;
    window.__webview_debounced_send_html__ = function() {
        if (debounceTimeout) {
        clearTimeout(debounceTimeout);
        }
        debounceTimeout = setTimeout(window.__webview_send_html__, 500);
    };

    // Setup MutationObserver for SPAs
    try {
        var observer = new MutationObserver(function() {
        window.__webview_debounced_send_html__();
        });
        observer.observe(document.documentElement, {
        attributes: true,
        childList: true,
        subtree: true
        });
    } catch (e) {}

    // Setup SPA router state changes
    try {
        var originalPushState = history.pushState;
        history.pushState = function() {
        originalPushState.apply(this, arguments);
        window.__webview_debounced_send_html__();
        };
        var originalReplaceState = history.replaceState;
        history.replaceState = function() {
        originalReplaceState.apply(this, arguments);
        window.__webview_debounced_send_html__();
        };
        window.addEventListener('popstate', window.__webview_debounced_send_html__);
        window.addEventListener('hashchange', window.__webview_debounced_send_html__);
    } catch (e) {}

    window.addEventListener('DOMContentLoaded', window.__webview_send_html__);
    window.addEventListener('load', window.__webview_send_html__);
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
        window.__webview_send_html__();
    }
    } else {
    if (window.__webview_send_html__) {
        window.__webview_send_html__();
    }
    }
})();
true;
`;

export const WebView = forwardRef((props: any, ref: any) => {
  if (!OriginalWebView) {
    console.warn('[NetworkInspector] react-native-webview not found. Make sure it is installed.');
    return null;
  }

  const [loading, setLoading] = useState(false);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'webview-log') {
        addWebViewLog(data.logType, data.message);
      } else if (data.type === 'webview-html') {
        addWebViewHtml(data.url, data.html, data.css, data.js);
      }
    } catch (e) {}
    if (props.onMessage) {
      props.onMessage(event);
    }
  };

  const handleNavigationStateChange = (navState: any) => {
    addWebViewNav(navState.url, navState.title);
    if (props.onNavigationStateChange) {
      props.onNavigationStateChange(navState);
    }
  };

  const handleLoadStart = (syntheticEvent: any) => {
    setLoading(true);
    if (props.onLoadStart) {
      props.onLoadStart(syntheticEvent);
    }
  };

  const handleLoadEnd = (syntheticEvent: any) => {
    setLoading(false);
    if (props.onLoadEnd) {
      props.onLoadEnd(syntheticEvent);
    }
  };

  // Register initial URL
  React.useEffect(() => {
    if (props.source && props.source.uri) {
      addWebViewNav(props.source.uri, 'Initial Page');
    }
  }, [props.source?.uri]);

  const combinedInjectedJSBefore =
    props.injectedJavaScriptBeforeContentLoaded
      ? `${injectJS}\n${props.injectedJavaScriptBeforeContentLoaded}`
      : injectJS;

  const combinedInjectedJS = props.injectedJavaScript
    ? `${injectJS}\n${props.injectedJavaScript}`
    : injectJS;

  const showLoader = props.showLoader !== false;

  return React.createElement(
    View,
    { style: props.style || { flex: 1 } },
    React.createElement(OriginalWebView, {
      ...props,
      style: { flex: 1 },
      ref: ref,
      injectedJavaScriptBeforeContentLoaded: combinedInjectedJSBefore,
      injectedJavaScript: combinedInjectedJS,
      onMessage: handleMessage,
      onNavigationStateChange: handleNavigationStateChange,
      onLoadStart: handleLoadStart,
      onLoadEnd: handleLoadEnd,
    }),
    loading && showLoader && React.createElement(
      View,
      {
        style: {
          ...StyleSheet.absoluteFill,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.4)',
        },
      },
      React.createElement(ActivityIndicator, { size: 'large', color: '#684B9B' })
    )
  );
});

// Perform monkey-patching to intercept react-native-webview exports globally
try {
  const RNWebView = require('react-native-webview');
  if (RNWebView) {
    const defineProp = (obj: any, prop: string, value: any) => {
      try {
        Object.defineProperty(obj, prop, {
          value: value,
          configurable: true,
          writable: true,
          enumerable: true,
        });
      } catch (e) {
        try {
          obj[prop] = value;
        } catch (err) {}
      }
    };

    if (RNWebView.WebView) {
      defineProp(RNWebView, 'WebView', WebView);
    }
    if (RNWebView.default) {
      if (RNWebView.default.WebView) {
        defineProp(RNWebView.default, 'WebView', WebView);
      }
      defineProp(RNWebView, 'default', WebView);
    }
  }
} catch (e) {
  // Silent fail
}

let logs: WebViewLog[] = [];
let navHistory: WebViewNavState[] = [];
let currentHtml: string = '';
let currentCss: string = '';
let currentJs: string = '';
let currentHtmlUrl: string = '';
let listeners: (() => void)[] = [];
let counter = 0;

const notify = () => {
  const snapshotLogs = [...logs];
  const snapshotHistory = [...navHistory];
  listeners.forEach(cb => cb());
};

export const addWebViewLog = (
  type: 'log' | 'info' | 'warn' | 'error',
  message: string,
) => {
  logs.unshift({
    id: counter++,
    type,
    message,
    timestamp: Date.now(),
  });
  logs = logs.slice(0, 100);
  notify();
};

export const addWebViewNav = (url: string, title?: string) => {
  // Prevent duplicate consecutive navigation events for the same URL
  if (navHistory.length > 0 && navHistory[0].url === url) {
    if (title && !navHistory[0].title) {
      navHistory[0].title = title;
      notify();
    }
    return;
  }

  navHistory.unshift({
    url,
    title,
    timestamp: Date.now(),
  });
  navHistory = navHistory.slice(0, 5);
  notify();
};

export const addWebViewHtml = (
  url: string,
  html: string,
  css?: string,
  js?: string,
) => {
  currentHtml = html;
  currentCss = css || '';
  currentJs = js || '';
  currentHtmlUrl = url;
  notify();
};

export const getWebViewLogs = () => [...logs];
export const getWebViewNavHistory = () => [...navHistory];
export const getWebViewHtml = () => currentHtml;
export const getWebViewCss = () => currentCss;
export const getWebViewJs = () => currentJs;
export const getWebViewHtmlUrl = () => currentHtmlUrl;

export const clearWebViewData = () => {
  logs = [];
  navHistory = [];
  currentHtml = '';
  currentCss = '';
  currentJs = '';
  currentHtmlUrl = '';
  notify();
};

export const subscribeWebView = (cb: () => void) => {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter(l => l !== cb);
  };
};
