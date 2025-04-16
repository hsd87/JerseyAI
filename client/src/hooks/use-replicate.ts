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
      try {
        // Validate form data to ensure all required fields are present
        const baseRequiredFields = ['sport', 'kitType', 'primaryColor', 'secondaryColor', 'collarType', 'patternStyle'] as const;
        
        // Check if the form data includes accent colors
        let requiredFields: string[] = [...baseRequiredFields];
        if ('accentColor1' in formData) {
          requiredFields.push('accentColor1');
        }
        if ('accentColor2' in formData) {
          requiredFields.push('accentColor2');
        }
        
        const missingFields = requiredFields.filter(
          field => !formData[field as keyof typeof formData]
        );
        
        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }
        
        // First, create a design record or use existing
        let designRecord: Design;
        if (!designId) {
          console.log("Creating new design record with form data:", formData);
          try {
            const createRes = await apiRequest("POST", "/api/designs", formData);
            designRecord = await createRes.json();
            setDesignId(designRecord.id);
            console.log("Design record created with ID:", designRecord.id);
          } catch (createError) {
            console.error("Failed to create design record:", createError);
            throw new Error(`Failed to create design: ${createError instanceof Error ? createError.message : 'Unknown error'}`);
          }
        } else {
          console.log("Using existing design ID:", designId);
          designRecord = { id: designId } as Design;
        }

        toast({
          title: "Generating design...",
          description: "This may take up to 30-60 seconds while we create your jersey design.",
        });

        // Prepare data payload for generation with extended type to include accent colors
        const cleanedFormData: Record<string, any> = {
          sport: formData.sport,
          kitType: formData.kitType,
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          collarType: formData.collarType,
          patternStyle: formData.patternStyle,
          sleeveStyle: formData.sleeveStyle,
          designNotes: formData.designNotes || ""
        };
        
        // Add accent colors if they exist in the form data
        if ('accentColor1' in formData && formData['accentColor1']) {
          cleanedFormData.accentColor1 = formData['accentColor1'] as string;
        }
        
        if ('accentColor2' in formData && formData['accentColor2']) {
          cleanedFormData.accentColor2 = formData['accentColor2'] as string;
        }
        
        console.log("Sending cleaned form data to generate API:", cleanedFormData);
        
        // Remove automatic retry mechanism to prevent duplicate API calls
        // Simply make a single request with proper error handling
        console.log("Starting design generation for design ID:", designRecord.id);
        
        // Track generation start time for performance metrics
        const startTime = Date.now();
        
        // Set a reasonable timeout for image generation (120 seconds)
        const timeout = 120000; // 2 minutes
        
        // Create a promise that will reject after the timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Request timed out after ${timeout/1000} seconds`)), timeout);
        });
        
        // Create the actual API request promise
        const apiPromise = apiRequest(
          "POST", 
          `/api/designs/${designRecord.id}/generate`, 
          { formData: cleanedFormData }
        );
        
        // Race the API request against the timeout
        const generateRes = await Promise.race([apiPromise, timeoutPromise]) as Response;
        
        const duration = Date.now() - startTime;
        console.log(`Generation request completed in ${duration}ms`);
        
        // Check if the response is OK
        if (!generateRes.ok) {
          const errorData = await generateRes.json().catch(() => null);
          const errorMessage = errorData?.message || `Server responded with status: ${generateRes.status}`;
          throw new Error(errorMessage);
        }
        
        // Process the response data
        const responseData = await generateRes.json();
        console.log("Generation response:", responseData);
        
        // Validate response - ensure images are present
        if (!responseData.frontImageUrl || !responseData.backImageUrl) {
          throw new Error("Generated design is missing one or more images");
        }
        
        return responseData;
      } catch (error) {
        console.error("Error in design generation process:", error);
        throw error;
      }
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
