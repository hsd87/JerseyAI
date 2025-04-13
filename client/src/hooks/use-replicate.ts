import { apiRequest } from '@/lib/queryClient';
import { useDesignStore } from '@/hooks/use-design-store';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Design } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

export function useReplicate() {
  const {
    formData,
    setGenerating,
    setHasGenerated,
    setImages,
    setDesignId,
    designId
  } = useDesignStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const generateDesignMutation = useMutation({
    mutationFn: async () => {
      // First, create a design record
      let designRecord: Design;
      if (!designId) {
        const createRes = await apiRequest("POST", "/api/designs", formData);
        designRecord = await createRes.json();
        setDesignId(designRecord.id);
      } else {
        // Use existing design
        designRecord = { id: designId } as Design;
      }

      toast({
        title: "Generating design...",
        description: "This may take up to 30-60 seconds while we create your jersey design.",
      });

      // Then, generate images for it - pass form data to ensure it has the latest values
      console.log("Sending form data to generate API:", formData);
      const generateRes = await apiRequest(
        "POST", 
        `/api/designs/${designRecord.id}/generate`, 
        { formData }
      );
      return await generateRes.json();
    },
    onMutate: () => {
      setGenerating(true);
    },
    onSuccess: (data: Design) => {
      // Update the store with generated images
      if (data.frontImageUrl && data.backImageUrl) {
        setImages(data.frontImageUrl, data.backImageUrl);
        setHasGenerated(true);
      }
      // Invalidate designs query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/designs"] });
      
      toast({
        title: "Design generated!",
        description: "Your custom jersey design is ready.",
      });
    },
    onError: (error) => {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setGenerating(false);
    }
  });

  const saveCustomizationsMutation = useMutation({
    mutationFn: async (customizations: any) => {
      if (!designId) {
        throw new Error("No design to save customizations for");
      }
      
      const res = await apiRequest(
        "PATCH", 
        `/api/designs/${designId}`, 
        { customizations }
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/designs"] });
      toast({
        title: "Changes saved",
        description: "Your customizations have been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return {
    generateDesign: generateDesignMutation.mutateAsync,
    isGenerating: generateDesignMutation.isPending,
    saveCustomizations: saveCustomizationsMutation.mutateAsync,
    isSaving: saveCustomizationsMutation.isPending
  };
}
