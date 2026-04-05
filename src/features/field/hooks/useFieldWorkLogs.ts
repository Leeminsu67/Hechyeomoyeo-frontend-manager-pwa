import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { createFieldWorkLog, CreateFieldWorkLogDto } from "../services/fieldWorkLogApi";

export function useCreateFieldWorkLog() {
  return useMutation({
    mutationFn: (dto: CreateFieldWorkLogDto) => createFieldWorkLog(dto),
    onError: () => {
      toast.error("작업 기록 등록에 실패했습니다.");
    },
  });
}
