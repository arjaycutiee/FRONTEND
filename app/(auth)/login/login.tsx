import api from '@/app/services/api';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();

  // Color Palette matching mockup
  const primaryBrown = '#A97C50';
  const errorRed = '#EF4444';
  const inputBg = colorScheme === 'dark' ? '#1E1E1E' : '#FFFFFF';
  const textPrimary = colorScheme === 'dark' ? '#ECEDEE' : '#11181C';
  const textSecondary = colorScheme === 'dark' ? '#9BA1A6' : '#666666';
  const borderColorDefault = colorScheme === 'dark' ? '#2E2E2E' : '#E2E8F0';

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Focus States for Inputs (Premium visual feedback)
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Validation States
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Validation Logic
  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email address is required');
      isValid = false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      isValid = false;
    }

    return isValid;
  };

  // Login handler
  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await api.post('/api/auth/login', {
        email: email,
        password: password,
      });

      setIsLoading(false);
      // Navigate to main application tabs
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

  // Google Login mock
  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.replace('/(tabs)/dashboard/dashboard');
    }, 1200);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#121212' : '#FFFFFF' }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <FontAwesome5 name="graduation-cap" size={68} color={textPrimary} style={styles.logoIcon} />
            <View style={styles.logoTextContainer}>
              <Text style={[styles.logoTextGab, { color: textPrimary }]}>Gab</Text>
              <Text style={[styles.logoTextAi, { color: primaryBrown }]}>Ai</Text>
            </View>
          </View>

          {/* Welcome Text */}
          <View style={styles.welcomeContainer}>
            <Text style={[styles.welcomeTitle, { color: textPrimary }]}>Welcome Back!</Text>
            <Text style={[styles.welcomeSubtitle, { color: textSecondary }]}>
              Login to continue to your account
            </Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Email Address */}
            <Text style={[styles.inputLabel, { color: textPrimary }]}>Email Address</Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: inputBg,
                  borderColor: emailError
                    ? errorRed
                    : isEmailFocused
                      ? primaryBrown
                      : borderColorDefault,
                },
              ]}
            >
              <Feather name="mail" size={20} color={emailError ? errorRed : textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { color: textPrimary }]}
                placeholder="Enter your email"
                placeholderTextColor={textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError('');
                }}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
              />
            </View>
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

            {/* Password */}
            <Text style={[styles.inputLabel, { color: textPrimary, marginTop: 12 }]}>Password</Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: inputBg,
                  borderColor: passwordError
                    ? errorRed
                    : isPasswordFocused
                      ? primaryBrown
                      : borderColorDefault,
                },
              ]}
            >
              {/* Using Feather lock-closed-outline or similar. Feather lock is clean! */}
              <Feather name="lock" size={20} color={passwordError ? errorRed : textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { color: textPrimary }]}
                placeholder="Enter your password"
                placeholderTextColor={textSecondary}
                secureTextEntry={!passwordVisible}
                autoCapitalize="none"
                autoCorrect={false}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) setPasswordError('');
                }}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
              />
              <Pressable
                onPress={() => setPasswordVisible(!passwordVisible)}
                style={styles.eyeButton}
              >
                <Feather
                  name={passwordVisible ? 'eye' : 'eye-off'}
                  size={20}
                  color={textSecondary}
                />
              </Pressable>
            </View>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

            {/* Forgot Password Link */}
            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password/forgot-password')}
              activeOpacity={0.7}
              style={styles.forgotPasswordWrapper}
            >
              <Text style={[styles.forgotPasswordText, { color: primaryBrown }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: primaryBrown }]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, { backgroundColor: borderColorDefault }]} />
              <Text style={[styles.dividerText, { color: textSecondary }]}>or</Text>
              <View style={[styles.dividerLine, { backgroundColor: borderColorDefault }]} />
            </View>

            {/* Google Sign-in */}
            <TouchableOpacity
              style={[styles.googleButton, { borderColor: borderColorDefault }]}
              onPress={handleGoogleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Image
                source="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.png"
                style={styles.googleIcon}
              />
              <Text style={[styles.googleButtonText, { color: textPrimary }]}>
                Continue with Google
              </Text>
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footerContainer}>
              <Text style={[styles.footerText, { color: textSecondary }]}>
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/register/register')}>
                <Text style={[styles.footerLink, { color: primaryBrown }]}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoIcon: {
    marginBottom: 8,
  },
  logoTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoTextGab: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  logoTextAi: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 4,
  },
  forgotPasswordWrapper: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    width: '100%',
  },
  googleIcon: {
    width: 22,
    height: 22,
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
