import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';

  // Theme matching Login screen
  const primaryBrown = '#A97C50';
  const errorRed = '#EF4444';
  const inputBg = colorScheme === 'dark' ? '#1E1E1E' : '#FFFFFF';
  const textPrimary = colorScheme === 'dark' ? '#ECEDEE' : '#11181C';
  const textSecondary = colorScheme === 'dark' ? '#9BA1A6' : '#666666';
  const borderColorDefault = colorScheme === 'dark' ? '#2E2E2E' : '#E2E8F0';

  const [email, setEmail] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleResetPassword = () => {
    setEmailError('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email address is required');
      return;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSent(true);
    }, 1500);
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
            <FontAwesome5 name="graduation-cap" size={48} color={textPrimary} style={styles.logoIcon} />
            <Text style={[styles.logoText, { color: textPrimary }]}>
              Gab<Text style={{ color: primaryBrown }}>Ai</Text>
            </Text>
          </View>

          {isSent ? (
            <View style={styles.successContainer}>
              <View style={[styles.successIconWrapper, { backgroundColor: primaryBrown + '20' }]}>
                <Feather name="check" size={32} color={primaryBrown} />
              </View>
              <Text style={[styles.successTitle, { color: textPrimary }]}>Reset Link Sent!</Text>
              <Text style={[styles.successSubtitle, { color: textSecondary }]}>
                We have sent password reset instructions to {email}.
              </Text>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: primaryBrown }]}
                onPress={() => router.back()}
              >
                <Text style={styles.buttonText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formContainer}>
              <Text style={[styles.title, { color: textPrimary }]}>Forgot Password?</Text>
              <Text style={[styles.subtitle, { color: textSecondary }]}>
                Enter your email address below and we'll send you instructions to reset your password.
              </Text>

              {/* Email Address */}
              <Text style={[styles.inputLabel, { color: textPrimary }]}>Email Address</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: inputBg,
                    borderColor: emailError
                      ? errorRed
                      : isFocused
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
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
              </View>
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: primaryBrown, marginTop: 24 }]}
                onPress={handleResetPassword}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
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
    marginBottom: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoIcon: {
    marginBottom: 6,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 32,
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
  primaryButton: {
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
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  successContainer: {
    alignItems: 'center',
    width: '100%',
    paddingTop: 16,
  },
  successIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 32,
  },
});
