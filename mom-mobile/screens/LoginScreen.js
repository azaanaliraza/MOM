import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';

export default function LoginScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();

  const handleLogin = async () => {
    // This is a simplified login for simulation
    // A complete implementation would include a custom form
    // or OAuth flow via WebBrowser
    if (!isLoaded) return;
    try {
      console.log('Login flows here');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mother of Marketing</Text>
      <Text style={styles.subtitle}>Log in to access your dashboard natively</Text>
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Sign In / Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#000',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
