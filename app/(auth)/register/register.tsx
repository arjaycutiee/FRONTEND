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
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/app/services/api';

export default function RegisterScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';

  // Colors matching Login screen
  const primaryBrown = '#A97C50';
  const errorRed = '#EF4444';
  const inputBg = colorScheme === 'dark' ? '#1E1E1E' : '#FFFFFF';
  const textPrimary = colorScheme === 'dark' ? '#ECEDEE' : '#11181C';
  const textSecondary = colorScheme === 'dark' ? '#9BA1A6' : '#666666';
  const borderColorDefault = colorScheme === 'dark' ? '#2E2E2E' : '#E2E8F0';

  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Focus States
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Validation States
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateForm = () => {
    let isValid = true;
    setNameError('');
    setEmailError('');
    setPasswordError('');

    if (!name.trim()) {
      setNameError('Full name is required');
      isValid = false;
    }

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

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await api.post('/api/auth/register', {
        fullName: name,
        email: email,
        password: password,
      });

      setIsLoading(false);
      Alert.alert(
        'Success',
        'Account created successfully! Please log in.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/login/login'),
          },
        ]
      );
    } catch (error: any) {
      setIsLoading(false);
      let errorMessage = 'An error occurred during registration. Please try again.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      if (errorMessage.toLowerCase().includes('email already exists') || errorMessage.toLowerCase().includes('email is already')) {
        setEmailError(errorMessage);
      } else {
        Alert.alert('Registration Failed', errorMessage);
      }
    }
  };

  const handleGoogleSignup = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.replace('/(tabs)/expenses/expenses');
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
          {/* Back button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={24} color={textPrimary} />
          </TouchableOpacity>

          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <FontAwesome5 name="graduation-cap" size={54} color={textPrimary} style={styles.logoIcon} />
            <View style={styles.logoTextContainer}>
              <Text style={[styles.logoTextGab, { color: textPrimary }]}>Gab</Text>
              <Text style={[styles.logoTextAi, { color: primaryBrown }]}>Ai</Text>
            </View>
          </View>

          {/* Welcome Text */}
          <View style={styles.welcomeContainer}>
            <Text style={[styles.welcomeTitle, { color: textPrimary }]}>Create Account</Text>
            <Text style={[styles.welcomeSubtitle, { color: textSecondary }]}>
              Sign up to get started with your journey
            </Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Full Name */}
            <Text style={[styles.inputLabel, { color: textPrimary }]}>Full Name</Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: inputBg,
                  borderColor: nameError
                    ? errorRed
                    : isNameFocused
                      ? primaryBrown
                      : borderColorDefault,
                },
              ]}
            >
              <Feather name="user" size={20} color={nameError ? errorRed : textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { color: textPrimary }]}
                placeholder="Enter your full name"
                placeholderTextColor={textSecondary}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (nameError) setNameError('');
                }}
                onFocus={() => setIsNameFocused(true)}
                onBlur={() => setIsNameFocused(false)}
              />
            </View>
            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

            {/* Email Address */}
            <Text style={[styles.inputLabel, { color: textPrimary, marginTop: 12 }]}>Email Address</Text>
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

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.registerButton, { backgroundColor: primaryBrown, marginTop: 24 }]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.registerButtonText}>Register</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, { backgroundColor: borderColorDefault }]} />
              <Text style={[styles.dividerText, { color: textSecondary }]}>or</Text>
              <View style={[styles.dividerLine, { backgroundColor: borderColorDefault }]} />
            </View>

            {/* Google Signup */}
            <TouchableOpacity
              style={[styles.googleButton, { borderColor: borderColorDefault }]}
              onPress={handleGoogleSignup}
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
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.replace('/login/login')}>
                <Text style={[styles.footerLink, { color: primaryBrown }]}>Login</Text>
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
    paddingTop: 16,
    paddingBottom: 24,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginLeft: -8,
    marginBottom: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoIcon: {
    marginBottom: 6,
  },
  logoTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoTextGab: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  logoTextAi: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 24,
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
  registerButton: {
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
  registerButtonText: {
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
