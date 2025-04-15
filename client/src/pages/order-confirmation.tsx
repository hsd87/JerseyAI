import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function OrderConfirmationPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="container max-w-2xl py-12">
      <Card className="text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Order Confirmed!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-6">
            Thank you for your order. We'll start processing it right away. You'll receive an email confirmation with your order details shortly.
          </p>
          
          <div className="bg-muted p-4 rounded-md mb-6">
            <h3 className="font-semibold text-lg mb-2">What's Next?</h3>
            <ol className="text-left list-decimal list-inside space-y-2">
              <li>Your order details have been saved to our system</li>
              <li>Our team will review your design for production</li>
              <li>Production typically takes 5-7 business days</li>
              <li>Once shipped, you'll receive tracking information via email</li>
            </ol>
          </div>
          
          <p className="text-sm text-muted-foreground">
            If you have any questions or need to make changes to your order, please contact our customer support team at support@projersey.com
          </p>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => setLocation("/")}>
            Back to Home
          </Button>
          <Button onClick={() => setLocation("/dashboard")}>
            View Orders
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}