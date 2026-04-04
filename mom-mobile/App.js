import React, { useRef, useState } from 'react';
import { StyleSheet, SafeAreaView, BackHandler, ActivityIndicator, View, Platform, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';

export default function App() {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);

  // Capture hardware back-button on Android
  React.useEffect(() => {
    if (Platform.OS === 'web') return;
    const handleBackButton = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false; // let default behavior happen (close app)
    };
    BackHandler.addEventListener('hardwareBackPress', handleBackButton);
    return () => BackHandler.removeEventListener('hardwareBackPress', handleBackButton);
  }, [canGoBack]);

  const INJECTED_JAVASCRIPT = `
    const style = document.createElement('style');
    style.type = 'text/css';
    style.appendChild(document.createTextNode('::-webkit-scrollbar { display: none; }'));
    document.head.appendChild(style);
    true;
  `;

  // Fallback specifically for testing via the 'W' terminal command (Browser Preview)
  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1 }}>
        <iframe 
          src="https://mom-pearl-delta.vercel.app" 
          style={{ width: '100%', height: '100vh', border: 'none' }}
          title="MOM Web View"
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <WebView
        ref={webViewRef}
        source={{ uri: 'https://mom-pearl-delta.vercel.app' }}
        style={styles.webview}
        injectedJavaScript={INJECTED_JAVASCRIPT}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        allowsBackForwardNavigationGestures
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        domStorageEnabled={true}
        onNavigationStateChange={(navState) => {
          setCanGoBack(navState.canGoBack);
        }}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#000000" />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'android' ? 25 : 0, 
  },
  webview: {
    flex: 1,
  },
  loader: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff'
  }
});

