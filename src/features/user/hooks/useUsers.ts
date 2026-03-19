import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} from "../services/userApi";
import type { UserListParams, CreateUserDto, UpdateUserDto } from "@/types/user";

export const USER_KEYS = {
  all: ["users"] as const,
  list: (params: UserListParams) => ["users", "list", params] as const,
  detail: (id: string) => ["users", "detail", id] as const,
};

export function useUserList(params: UserListParams) {
  return useQuery({
    queryKey: USER_KEYS.list(params),
    queryFn: () => getUsers(params),
    placeholderData: (prev) => prev,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: USER_KEYS.detail(id),
    queryFn: () => getUser(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateUserDto) => createUser(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
      toast.success("인력이 등록되었습니다.");
    },
    onError: () => {
      toast.error("인력 등록에 실패했습니다.");
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateUserDto }) =>
      updateUser({ id, dto }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
      toast.success("인력 정보가 수정되었습니다.");
    },
    onError: () => {
      toast.error("인력 정보 수정에 실패했습니다.");
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
      toast.success("인력이 삭제되었습니다.");
    },
    onError: () => {
      toast.error("인력 삭제에 실패했습니다.");
    },
  });
}
