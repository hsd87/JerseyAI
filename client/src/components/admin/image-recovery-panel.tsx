import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Image, Loader2, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from '@/hooks/use-toast';

type ImageRecoveryResult = {
  success: boolean;
  message: string;
  total: number;
  missing: number;
  recovered?: number;
  details?: { designId: number; imagePath: string; fullPath: string }[];
};

export default function ImageRecoveryPanel() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [verifyResult, setVerifyResult] = useState<ImageRecoveryResult | null>(null);
  const [recoveryResult, setRecoveryResult] = useState<ImageRecoveryResult | null>(null);
  const { toast } = useToast();

  // Verify image paths
  const handleVerifyImages = async () => {
    setIsVerifying(true);
    try {
      const response = await apiRequest('GET', '/api/admin/verify-images');
      const result = await response.json();
      setVerifyResult(result);
      
      toast({
        title: "Image Verification Complete",
        description: `Found ${result.missing} missing files out of ${result.total} designs.`,
        variant: result.missing > 0 ? "destructive" : "default",
      });
    } catch (error) {
      console.error("Error verifying images:", error);
      toast({
        title: "Verification Failed",
        description: "There was an error verifying image files. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Recover missing images
  const handleRecoverImages = async () => {
    setIsRecovering(true);
    try {
      const response = await apiRequest('POST', '/api/admin/recover-images');
      const result = await response.json();
      setRecoveryResult(result);
      
      toast({
        title: "Image Recovery Complete",
        description: `Recovered ${result.recovered} of ${result.missing} missing images.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error recovering images:", error);
      toast({
        title: "Recovery Failed",
        description: "There was an error recovering image files. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Jersey Image File Management
        </CardTitle>
        <CardDescription>
          Identify and fix missing image files for jersey designs
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-medium">Verify Image Files</h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleVerifyImages}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Verify Images
                </>
              )}
            </Button>
          </div>
          
          {verifyResult && (
            <div className="rounded-md bg-gray-50 p-4">
              <div className="flex">
                {verifyResult.missing > 0 ? (
                  <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                )}
                <div>
                  <h4 className="text-sm font-medium">Verification Results</h4>
                  <div className="mt-1 text-sm text-gray-700">
                    <p>{verifyResult.message}</p>
                    <div className="mt-2 flex gap-2">
                      <Badge variant="outline">{verifyResult.total} Total Designs</Badge>
                      <Badge variant={verifyResult.missing > 0 ? "destructive" : "secondary"}>
                        {verifyResult.missing} Missing Files
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-medium">Recover Missing Images</h3>
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleRecoverImages}
              disabled={isRecovering}
            >
              {isRecovering ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recovering...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Recover Images
                </>
              )}
            </Button>
          </div>
          
          {recoveryResult && (
            <div className="rounded-md bg-gray-50 p-4">
              <div className="flex">
                {recoveryResult.recovered === 0 ? (
                  <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                )}
                <div>
                  <h4 className="text-sm font-medium">Recovery Results</h4>
                  <div className="mt-1 text-sm text-gray-700">
                    <p>{recoveryResult.message}</p>
                    <div className="mt-2 flex gap-2">
                      <Badge variant="outline">{recoveryResult.total} Total Designs</Badge>
                      <Badge variant="outline">{recoveryResult.missing} Missing Images</Badge>
                      <Badge variant={recoveryResult.recovered && recoveryResult.recovered > 0 ? "default" : "secondary"}>
                        {recoveryResult.recovered || 0} Recovered
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="border-t bg-gray-50/50 px-6 py-3">
        <p className="text-xs text-gray-500">
          This utility helps maintain consistency between database records and the file system by 
          finding and fixing missing image references.
        </p>
      </CardFooter>
    </Card>
  );
}