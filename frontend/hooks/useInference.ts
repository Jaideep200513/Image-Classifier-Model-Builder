"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ModelStatusResponse, PredictionResponse } from "@/types";

const DEFAULT_PROJECT_ID = "default-project";

export function useInference(projectId: string = DEFAULT_PROJECT_ID) {
  const [predictionResult, setPredictionResult] = useState<PredictionResponse | null>(null);

  // Poll model status every 3 seconds if no model, or 10 seconds if model exists
  const statusQuery = useQuery<ModelStatusResponse, Error>({
    queryKey: ["modelStatus", projectId],
    queryFn: () => api.getModelStatus(projectId),
    refetchInterval: (query) => (query.state.data?.has_model ? 10000 : 3000),
    staleTime: 2000,
  });

  const predictImageMutation = useMutation({
    mutationFn: (file: File) => api.predictImage(projectId, file),
    onSuccess: (res) => {
      setPredictionResult(res);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to predict image");
    },
  });

  const predictWebcamMutation = useMutation({
    mutationFn: (base64Image: string) => api.predictWebcam(projectId, base64Image),
    onSuccess: (res) => {
      setPredictionResult(res);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to predict webcam frame");
    },
  });

  const statusData = statusQuery.data || { has_model: false, classes: [] };

  return {
    hasModel: Boolean(statusData.has_model),
    modelClasses: statusData.classes || [],
    isLoadingStatus: statusQuery.isLoading,
    predictionResult,
    isPredicting: predictImageMutation.isPending || predictWebcamMutation.isPending,
    predictImage: (file: File) => predictImageMutation.mutateAsync(file),
    predictWebcam: (base64Image: string) => predictWebcamMutation.mutateAsync(base64Image),
    clearPrediction: () => setPredictionResult(null),
    refetchModelStatus: statusQuery.refetch,
  };
}
