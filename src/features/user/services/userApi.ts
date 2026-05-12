import apiClient from "@/lib/axios";
import type {
  UserListParams,
  UserListResponse,
  UserListItem,
  UserDetail,
  CreateUserDto,
  UpdateUserDto,
} from "@/types/user";

export const getUsers = async (
  params: UserListParams
): Promise<UserListResponse> => {
  const response = await apiClient.get("/user", { params });
  return response.data;
};

export const getUser = async (id: string): Promise<UserDetail> => {
  const response = await apiClient.get(`/user/${id}`);
  return response.data.data;
};

export const createUser = async (dto: CreateUserDto): Promise<UserListItem> => {
  const response = await apiClient.post("/user", dto);
  return response.data.data;
};

export const updateUser = async ({
  id,
  dto,
}: {
  id: string;
  dto: UpdateUserDto;
}): Promise<UserListItem> => {
  const response = await apiClient.patch(`/user/${id}`, dto);
  return response.data.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await apiClient.delete(`/user/${id}`);
};
