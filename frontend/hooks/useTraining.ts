"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { TrainingConfig, TrainingState, TrainingMetrics } from "@/types";

const DEFAULT_PROJECT_ID = "default-project";

export function useTraining(projectId: string = DEFAULT_PROJECT_ID) {
  const queryClient = useQueryClient();

  // Poll training status every 1 second if training is active
  const statusQuery = useQuery<any, Error>({
    queryKey: ["trainingStatus", projectId],
    queryFn: () => api.getTrainingStatus(projectId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "training" ? 1000 : false;
    },
    staleTime: 500,
  });

  useEffect(() => {
    if (statusQuery.data?.status === "completed") {
      queryClient.invalidateQueries({ queryKey: ["modelStatus", projectId] });
    }
  }, [statusQuery.data?.status, projectId, queryClient]);

  const startTrainingMutation = useMutation({
    mutationFn: (config: TrainingConfig) => api.startTraining(projectId, config),
    onSuccess: () => {
      toast.info("Training started in backend...");
      queryClient.invalidateQueries({ queryKey: ["trainingStatus", projectId] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to start model training");
    },
  });

  const cancelTrainingMutation = useMutation({
    mutationFn: () => api.cancelTraining(projectId),
    onSuccess: () => {
      toast.info("Training cancelled.");
      queryClient.invalidateQueries({ queryKey: ["trainingStatus", projectId] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to cancel training");
    },
  });

  const data = statusQuery.data || {};
  const status: "idle" | "training" | "completed" | "error" = data.status || "idle";
  const progress: number = data.progress ?? 0;
  const currentEpoch: number = data.current_epoch ?? 0;
  const totalEpochs: number = data.total_epochs ?? 50;
  const elapsedTime: number = data.elapsed_time ?? 0;
  const formattedElapsedTime: string = data.formatted_elapsed_time || "0s";
  const metrics: TrainingMetrics | null = data.metrics || null;
  const error: string | null = data.error || null;
  const hasTrainedModel: boolean = Boolean(data.has_trained_model);

  return {
    status,
    progress,
    currentEpoch,
    totalEpochs,
    elapsedTime,
    formattedElapsedTime,
    metrics,
    error,
    hasTrainedModel,
    isTraining: status === "training",
    isLoadingStatus: statusQuery.isLoading,
    startTraining: (config: TrainingConfig) => startTrainingMutation.mutate(config),
    cancelTraining: () => cancelTrainingMutation.mutate(),
    isCancelling: cancelTrainingMutation.isPending,
    refetchStatus: statusQuery.refetch,
  };
}
