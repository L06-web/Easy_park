import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';

const CLIENT_ID = 'SEU_CLIENT_ID_AQUI.apps.googleusercontent.com';

export async function signInWithGoogle() {
    try {
        const redirectUri = AuthSession.makeRedirectUri({
        useProxy: true,
    });

    const request = new AuthSession.AuthRequest({
        clientId: CLIENT_ID,
        scopes: ['profile', 'email'],
        redirectUri,
        responseType: AuthSession.ResponseType.Token,
    });

    const result = await request.promptAsync(
        AuthSession.makeDiscoveryDocument({
            authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        })
    );

    if (result.type === 'success') {
        const userInfoResponse = await fetch(
            'https://www.googleapis.com/userinfo/v2/me',
            {
            headers: {
                Authorization: `Bearer ${result.authentication.accessToken}`,
            },
            }
        );

        const user = await userInfoResponse.json();

        await SecureStore.setItemAsync('user', JSON.stringify(user));

        return user;
    }

    return null;
    } catch (error) {
        console.error('Erro no login:', error);
        throw error;
    }
}

export async function getUser() {
    const user = await SecureStore.getItemAsync('user');
    return user ? JSON.parse(user) : null;
}

export async function logout() {
    await SecureStore.deleteItemAsync('user');
}