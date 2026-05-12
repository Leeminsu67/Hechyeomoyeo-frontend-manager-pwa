import apiClient from "@/lib/axios";

export interface ChangeMyPasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface ChangeMyPasswordResponse {
  data: {
    isFirstLogin: boolean;
  };
  message?: string;
}

export const changeMyPassword = async (
  dto: ChangeMyPasswordDto,
): Promise<ChangeMyPasswordResponse> => {
  const response = await apiClient.patch<ChangeMyPasswordResponse>(
    "/user/me/password",
    dto,
  );
  return response.data;
};
