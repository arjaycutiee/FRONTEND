import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import api from '@/app/services/api';
import { localDb } from '@/app/services/localDb';
import { validateLoginForm } from '../utils';

/** Pull the account fields out of whatever shape the backend returns. */
function extractUser(data: any, fallbackEmail: string) {
  const u = data?.user ?? data?.data?.user ?? data?.data ?? data ?? {};
  return {
    id: u.id ?? u._id ?? u.userId,
    name: u.fullName ?? u.name ?? u.username ?? fallbackEmail.split('@')[0],
    email: u.email ?? fallbackEmail,
    course: u.course ?? u.program,
  };
}

export function useLogin() {
  const router = useRouter();

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Focus States
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Validation States
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleLogin = async () => {
    const { isValid, errors } = validateLoginForm({ email, password });
    setEmailError(errors.email || '');
    setPasswordError(errors.password || '');

    if (!isValid) return;

    setIsLoading(true);
    try {
      const response = await api.post('/api/auth/login', {
        email: email,
        password: password,
      });

      // Make the signed-in account the app's current user (no hardcoded default),
      // and keep the access token so protected API calls are authenticated.
      localDb.setAuthToken(response.data?.token ?? null);
      localDb.setCurrentUser(extractUser(response.data, email.trim()));

      setIsLoading(false);
      router.replace('/(tabs)/dashboard/dashboard');
    } catch (error: any) {
      setIsLoading(false);
      let errorMessage = 'An error occurred during login. Please try again.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Login Failed', errorMessage);
    }
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // Placeholder until real Google auth is wired up.
      localDb.setCurrentUser({ name: 'Google User', email: 'google-user@gabai.edu.ph' });
      router.replace('/(tabs)/dashboard/dashboard');
    }, 1200);
  };

  const handleForgotPassword = () => {
    router.push('/(auth)/forgot-password/forgot-password');
  };

  const handleNavigateRegister = () => {
    router.replace('/(auth)/register/register');
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    passwordVisible,
    setPasswordVisible,
    isLoading,
    isEmailFocused,
    setIsEmailFocused,
    isPasswordFocused,
    setIsPasswordFocused,
    emailError,
    setEmailError,
    passwordError,
    setPasswordError,
    handleLogin,
    handleGoogleLogin,
    handleForgotPassword,
    handleNavigateRegister,
  };
}
