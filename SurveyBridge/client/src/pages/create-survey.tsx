import Layout from "@/components/layout";
import SurveyForm from "@/components/survey-form";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { InsertSurvey } from "@db/schema";

export default function CreateSurvey() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  // Redirect if not a business user
  if (user?.role !== "business") {
    setLocation("/");
    return null;
  }

  const createSurveyMutation = useMutation({
    mutationFn: async (data: Omit<InsertSurvey, "creatorId" | "status">) => {
      // Convert numerical values to strings for decimal fields
      const surveyData = {
        ...data,
        rewardPerResponse: data.rewardPerResponse.toString(),
      };
      return apiRequest("POST", "/api/surveys", surveyData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
      toast({
        title: "Survey Created",
        description: "Your survey has been submitted for review",
      });
      setLocation("/business");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create New Survey</CardTitle>
          </CardHeader>
          <CardContent>
            <SurveyForm
              onSubmit={(data) => createSurveyMutation.mutate(data)}
              isSubmitting={createSurveyMutation.isPending}
            />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}