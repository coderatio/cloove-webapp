"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiClient } from "@/app/lib/api-client";
import { toast } from "sonner";

export interface ExtractedService {
  name: string;
  summary: string | null;
  priceMin: number | null;
  priceMax: number | null;
  currency: string | null;
  durationLabel: string | null;
  confidence: number;
}

export interface ServiceImportResult {
  total: number;
  created: number;
  updated: number;
  failed: number;
  errors: Array<{ index: number; name: string; error: string }>;
}

export interface ServiceImportPayload {
  services: Array<{
    name: string;
    summary?: string | null;
    priceMin?: number | null;
    priceMax?: number | null;
    currency?: string | null;
    durationLabel?: string | null;
  }>;
}

export function useServiceImport() {
  const queryClient = useQueryClient();

  const extract = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiClient.request<{ services: ExtractedService[] }>("/services/import-extract", {
        method: "POST",
        body: formData,
        headers: { "Content-Type": undefined as unknown as string },
      });
    },
    onError: (error: ApiError) =>
      toast.error(error?.message ?? "Could not read that file."),
  });

  const bulkImport = useMutation({
    mutationFn: (payload: ServiceImportPayload) =>
      apiClient.post<ServiceImportResult>("/services/bulk-import", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services"] }),
    onError: (error: ApiError) => toast.error(error?.message ?? "Import failed."),
  });

  return { extract, bulkImport };
}
