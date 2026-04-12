import api from ".";

export interface RegisterData {
  Name: string;
  Email: string;
  PhoneNumber: string;
  NationalId: string;
  Password: string;
  IDFrontImage: File;
  IDBackImage: File;
  ProfileImage: File;
}

export interface AuthReturnData {
  email: string;
  id: string;
  inviteUserToken: string;
  message: string;
  name: string;
  profileImageURL: string;
  success: true;
  token: string;
}

export interface AuthErrorData {
  message: string;
  success: false;
}

export async function registerUser(
  data: RegisterData,
): Promise<AuthReturnData | AuthErrorData> {
  const formData = new FormData();
  formData.append("Name", data.Name);
  formData.append("Email", data.Email);
  formData.append("PhoneNumber", data.PhoneNumber);
  formData.append("NationalId", data.NationalId);
  formData.append("Password", data.Password);
  formData.append("IDFrontImage", data.IDFrontImage);
  formData.append("IDBackImage", data.IDBackImage);
  formData.append("ProfileImage", data.ProfileImage);

  try {
    const response = await api.post("/Account/register", formData);
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      "An error occurred during registration. Please try again.";
    return { success: false, message };
  }
}

export interface VerifyData {
  email: string;
  code: string;
}

export async function verifyRegistration(
  data: VerifyData,
): Promise<AuthReturnData | AuthErrorData> {
  try {
    const response = await api.post("/Account/verify-registration", data);
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      "An error occurred during verification. Please try again.";
    return { success: false, message };
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
    const response = await api.post("/Account/login", data);
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      "An error occurred during login. Please try again.";
    return { success: false, message };
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await api.post("/Account/logout");
  } catch (error) {
    console.error("Logout API error:", error);
  }
}
