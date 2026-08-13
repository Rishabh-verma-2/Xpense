import { Platform, NativeModules } from 'react-native';

export interface GoogleAuthResult {
  idToken?: string;
  accessToken?: string;
  email?: string;
  name?: string;
  photo?: string;
}

const isRNGoogleSigninAvailable = !!(
  NativeModules &&
  (NativeModules.RNGoogleSignin || NativeModules.RNGoogleSigninModule)
);

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';

export async function promptGoogleNativeAuth(): Promise<GoogleAuthResult> {
  const clientId = GOOGLE_WEB_CLIENT_ID.trim();

  if (!clientId || clientId.includes('YOUR_') || clientId.includes('example')) {
    throw new Error(
      'Google Sign-In requires a valid EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in your .env file. Please get it from Firebase Console -> Authentication -> Google.'
    );
  }

  // 1. If running in custom native build with RNGoogleSignin module compiled
  if (isRNGoogleSigninAvailable) {
    try {
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      GoogleSignin.configure({
        webClientId: clientId,
        offlineAccess: true,
        scopes: ['profile', 'email'],
      });

      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }
      const response = await GoogleSignin.signIn();
      if (response && response.data) {
        const { idToken, user } = response.data;
        return {
          idToken: idToken || undefined,
          email: user.email,
          name: user.name || user.givenName || 'Google User',
          photo: user.photo || undefined,
        };
      }
    } catch (error: any) {
      console.warn('Native Google Auth picker warning:', error.message);
    }
  }

  // 2. Fallback to Google's official OAuth 2.0 WebBrowser flow (works in Expo Go & Managed Expo)
  try {
    const WebBrowser = require('expo-web-browser');
    const { makeRedirectUri } = require('expo-auth-session');

    if (WebBrowser && WebBrowser.openAuthSessionAsync) {
      WebBrowser.maybeCompleteAuthSession();

      const redirectUri = makeRedirectUri({ scheme: 'xpense' });
      console.log('🔑 Google Auth Redirect URI:', redirectUri);
      const nonce = Math.random().toString(36).substring(2, 15);

      const authQueryParams = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'id_token token',
        scope: 'openid profile email',
        nonce: nonce,
        prompt: 'select_account',
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${authQueryParams.toString()}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === 'success' && result.url) {
        const hashOrQuery = result.url.split('#')[1] || result.url.split('?')[1] || '';
        const params = new URLSearchParams(hashOrQuery);

        const idToken = params.get('id_token') || undefined;
        const accessToken = params.get('access_token') || undefined;

        let email: string | undefined;
        let name: string | undefined;
        let photo: string | undefined;

        if (accessToken) {
          try {
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (res.ok) {
              const info = await res.json();
              email = info.email;
              name = info.name || info.given_name;
              photo = info.picture;
            }
          } catch (e: any) {
            console.warn('Google UserInfo fetch error:', e.message);
          }
        }

        if (idToken || accessToken || email) {
          return {
            idToken,
            accessToken,
            email,
            name: name || 'Google User',
            photo,
          };
        }
      }
    }
  } catch (err: any) {
    console.warn('Google OAuth WebBrowser warning:', err.message);
  }

  return {};
}

export default promptGoogleNativeAuth;

