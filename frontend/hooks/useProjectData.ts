"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Project } from "@/types";

const DEFAULT_PROJECT_ID = "default-project";

export function useProjectData(projectId: string = DEFAULT_PROJECT_ID) {
  const queryClient = useQueryClient();

  // 1. Fetch Project Query
  const projectQuery = useQuery<Project, Error>({
    queryKey: ["project", projectId],
    queryFn: async () => {
      try {
        return await api.getProject(projectId);
      } catch (err: any) {
        // If project doesn't exist yet on backend, auto-create it
        try {
          return await api.createProject("Image Project");
        } catch {
          throw err;
        }
      }
    },
  });

  const invalidateProject = () => {
    queryClient.invalidateQueries({ queryKey: ["project", projectId] });
  };

  // 2. Add Class Mutation
  const addClassMutation = useMutation({
    mutationFn: (name: string) => api.addClass(projectId, name),
    onSuccess: (newClass) => {
      toast.success(`Class "${newClass.name}" added`);
      invalidateProject();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add class");
    },
  });

  // 3. Rename Class Mutation
  const renameClassMutation = useMutation({
    mutationFn: ({ classId, name }: { classId: string; name: string }) =>
      api.updateClass(classId, { name }),
    onSuccess: (updated) => {
      toast.success(`Renamed to "${updated.name}"`);
      invalidateProject();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to rename class");
    },
  });

  // 4. Toggle Disable Class Mutation
  const toggleDisableMutation = useMutation({
    mutationFn: ({ classId, disabled }: { classId: string; disabled: boolean }) =>
      api.updateClass(classId, { disabled }),
    onSuccess: (updated) => {
      toast.info(`Class "${updated.name}" ${updated.disabled ? "disabled" : "enabled"}`);
      invalidateProject();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update class state");
    },
  });

  // 5. Delete Class Mutation
  const deleteClassMutation = useMutation({
    mutationFn: (classId: string) => api.deleteClass(classId),
    onSuccess: () => {
      toast.success("Class deleted");
      invalidateProject();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete class");
    },
  });

  // 6. Upload Images Mutation
  const uploadImagesMutation = useMutation({
    mutationFn: ({ classId, files }: { classId: string; files: File[] }) =>
      api.uploadImages(classId, files),
    onSuccess: (items) => {
      toast.success(`Uploaded ${items.length} image${items.length > 1 ? "s" : ""}`);
      invalidateProject();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to upload images");
    },
  });

  // 7. Capture Image Mutation
  const captureImageMutation = useMutation({
    mutationFn: ({ classId, base64Image }: { classId: string; base64Image: string }) =>
      api.captureImage(classId, base64Image),
    onSuccess: () => {
      invalidateProject();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save captured frame");
    },
  });

  // 8. Delete Image Mutation
  const deleteImageMutation = useMutation({
    mutationFn: (imageId: string) => api.deleteImage(imageId),
    onSuccess: () => {
      toast.success("Image removed");
      invalidateProject();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to remove image");
    },
  });

  // 9. Clear All Class Images Mutation
  const clearClassImagesMutation = useMutation({
    mutationFn: (classId: string) => api.clearClassImages(classId),
    onSuccess: (res) => {
      toast.success(`Cleared ${res.deleted_count} sample${res.deleted_count !== 1 ? "s" : ""}`);
      invalidateProject();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to clear class samples");
    },
  });

  // 10. Reset Project Mutation
  const resetProjectMutation = useMutation({
    mutationFn: () => api.resetProject(projectId),
    onSuccess: () => {
      toast.info("Project dataset erased and reset.");
      invalidateProject();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to reset project");
    },
  });

  return {
    project: projectQuery.data as Project | undefined,
    isLoading: projectQuery.isLoading,
    isError: projectQuery.isError,
    error: projectQuery.error,
    refetch: projectQuery.refetch,
    addClass: (name?: string) => {
      const currentCount = projectQuery.data?.classes.length || 0;
      const className = name || `Class ${currentCount + 1}`;
      addClassMutation.mutate(className);
    },
    renameClass: (classId: string, name: string) =>
      renameClassMutation.mutate({ classId, name }),
    toggleDisableClass: (classId: string, currentDisabled?: boolean) =>
      toggleDisableMutation.mutate({ classId, disabled: !currentDisabled }),
    deleteClass: (classId: string) => deleteClassMutation.mutate(classId),
    removeClass: (classId: string) => deleteClassMutation.mutate(classId),
    uploadImages: (classId: string, files: File[]) =>
      uploadImagesMutation.mutateAsync({ classId, files }),
    captureImage: (classId: string, base64Image: string) =>
      captureImageMutation.mutateAsync({ classId, base64Image }),
    deleteImage: (imageId: string) => deleteImageMutation.mutate(imageId),
    clearClassImages: (classId: string) => clearClassImagesMutation.mutate(classId),
    resetProject: () => resetProjectMutation.mutateAsync(),
    isUploading: uploadImagesMutation.isPending,
  };
}
