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
        const requiredFields = ['sport', 'kitType', 'primaryColor', 'secondaryColor', 'collarType', 'patternStyle'] as const;
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

        // Prepare data payload for generation
        const cleanedFormData = {
          sport: formData.sport,
          kitType: formData.kitType,
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          collarType: formData.collarType,
          patternStyle: formData.patternStyle,
          sleeveStyle: formData.sleeveStyle,
          designNotes: formData.designNotes || ""
        };
        
        console.log("Sending cleaned form data to generate API:", cleanedFormData);
        
        // Add retry mechanism with exponential backoff
        let attempt = 0;
        const maxAttempts = 3;
        let generateRes;
        let lastError = null;
        
        while (attempt < maxAttempts) {
          try {
            console.log(`Generation attempt ${attempt + 1}/${maxAttempts}`);
            
            // Track generation start time for performance metrics
            const startTime = Date.now();
            
            generateRes = await apiRequest(
              "POST", 
              `/api/designs/${designRecord.id}/generate`, 
              { formData: cleanedFormData }
            );
            
            const duration = Date.now() - startTime;
            console.log(`Generation request completed in ${duration}ms`);
            
            break; // Success, exit retry loop
          } catch (err) {
            lastError = err;
            attempt++;
            
            // Log details about the error
            console.error(
              `Generation attempt ${attempt} failed:`, 
              err instanceof Error ? err.message : err
            );
            
            if (attempt >= maxAttempts) {
              console.error("All retry attempts failed, giving up.");
              throw new Error(`Failed after ${maxAttempts} attempts: ${lastError instanceof Error ? lastError.message : 'API error'}`);
            }
            
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
            console.warn(`Retrying in ${delay}ms (attempt ${attempt}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
        
        if (!generateRes) {
          throw new Error("Failed to generate design: No response received");
        }
        
        try {
          const responseData = await generateRes.json();
          console.log("Generation response:", responseData);
          
          // Validate response - ensure images are present
          if (!responseData.frontImageUrl || !responseData.backImageUrl) {
            throw new Error("Generated design is missing one or more images");
          }
          
          return responseData;
        } catch (parseError) {
          console.error("Failed to parse generation response:", parseError);
          throw new Error("Failed to parse design response");
        }
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
