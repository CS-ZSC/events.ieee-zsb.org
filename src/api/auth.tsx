import api from ".";
import axios from "axios";

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone_number: string;
  national_id: string;
}

export interface AuthReturnData {
  email: string;
  id: string;
  inviteUserToken: string;
  message: string;
  name: string;
  profileImageURL: string;
  success: boolean;
  token: string;
  verification_sent?: boolean;
}

export interface AuthErrorData {
  message: string;
  success: false;
}

export interface ResetPasswordData {
  email: string;
  verification_code: string;
  password: string;
  password_confirmation: string;
}

// Helper: translates raw API error messages into user-friendly English
function getFriendlyErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback;

  const data = error.response?.data;

  // Extract first validation error if present
  if (data?.errors) {
    const firstError = Object.values(data.errors)[0] as string[];
    if (firstError?.[0]) return translateMessage(firstError[0]);
  }

  if (data?.message) return translateMessage(data.message);

  return fallback;
}

// Translates known backend messages to friendly user-facing messages
function translateMessage(message: string): string {
  const map: Record<string, string> = {
    "Invalid credentials": "Incorrect email or password. Please try again.",
    "The email has already been taken":
      "This email is already registered. Please login or use a different email.",
    "The email field is required": "Please enter your email address.",
    "The password field is required": "Please enter your password.",
    "The name field is required": "Please enter your full name.",
    "The phone number field is required": "Please enter your phone number.",
    "The national id field is required": "Please enter your national ID.",
    "The password confirmation does not match":
      "Passwords do not match. Please try again.",
    "Validation failed":
      "Some fields are invalid. Please check your input and try again.",
    "Unauthenticated.": "Your session has expired. Please login again.",
    "Too Many Attempts.":
      "Too many attempts. Please wait a moment and try again.",
    "The verification code is invalid":
      "The verification code is incorrect. Please check your email and try again.",
    "The verification code has expired":
      "The verification code has expired. Please request a new one.",
    "Email not found": "No account found with this email address.",
    "User not found": "No account found with this email address.",
    "Account already verified":
      "Your account is already verified. Please login.",
  };

  return map[message] ?? message;
}

export async function registerUser(
  data: RegisterData,
): Promise<AuthReturnData | AuthErrorData> {
  try {
    const response = await api.post("/eventsgate/register", data);
    return { ...response.data, success: response.data.verification_sent };
  } catch (error: unknown) {
    return {
      success: false,
      message: getFriendlyErrorMessage(
        error,
        "An error occurred during registration. Please try again.",
      ),
    };
  }
}

export interface VerifyData {
  email: string;
  verification_code: string;
}

export async function verifyRegistration(
  data: VerifyData,
): Promise<AuthReturnData | AuthErrorData> {
  try {
    const response = await api.post("/eventsgate/verify-registration", data);
    const user = response.data.data;
    return {
      success: !!response.data.token,
      token: response.data.token,
      id: String(user?.id ?? ""),
      email: user?.email ?? "",
      name: user?.name ?? "",
      profileImageURL: user?.avatar_src ?? "",
      inviteUserToken: "",
      message: response.data.message,
    };
  } catch (error: unknown) {
    return {
      success: false,
      message: getFriendlyErrorMessage(
        error,
        "An error occurred during verification. Please try again.",
      ),
    };
  }
}

export interface LoginData {
  email: string;
  password: string;
}

export async function loginUser(
  data: LoginData,
): Promise<AuthReturnData | AuthErrorData> {
  try {
    const response = await api.post("/eventsgate/login", data);
    const user = response.data.data;
    return {
      success: !!response.data.token,
      token: response.data.token,
      id: String(user?.id ?? ""),
      email: user?.email ?? "",
      name: user?.name ?? "",
      profileImageURL: user?.avatar_src ?? "",
      inviteUserToken: "",
      message: response.data.message,
    };
  } catch (error: unknown) {
    return {
      success: false,
      message: getFriendlyErrorMessage(
        error,
        "An error occurred during login. Please try again.",
      ),
    };
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await api.post("/eventsgate/logout");
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error("Logout API error:", error.response?.data?.message);
    }
  }
}

export interface ForgotPasswordData {
  email: string;
}

export async function sendPasswordResetCode(
  data: ForgotPasswordData,
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await api.post(
      "/eventsgate/send-password-reset-code",
      data,
    );
    return {
      success: true,
      message:
        response.data?.message ||
        "Verification code sent successfully. Please check your email.",
    };
  } catch (error: unknown) {
    return {
      success: false,
      message: getFriendlyErrorMessage(
        error,
        "An error occurred. Please try again.",
      ),
    };
  }
}

export async function resetPassword(
  data: ResetPasswordData,
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await api.post("/eventsgate/reset-password", data);
    return {
      success: true,
      message:
        response.data?.message ||
        "Password reset successfully. You can now login.",
    };
  } catch (error: unknown) {
    return {
      success: false,
      message: getFriendlyErrorMessage(
        error,
        "An error occurred. Please try again.",
      ),
    };
  }
}
