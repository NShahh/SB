import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SelectSurvey } from "@db/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Check, X } from "lucide-react";

export default function AdminDashboard() {
  const { data: surveys } = useQuery<{ survey: SelectSurvey }[]>({
    queryKey: ["/api/surveys"],
  });

  const updateStatus = useMutation({
    mutationFn: async ({ surveyId, status }: { surveyId: number; status: "approved" | "rejected" }) => {
      await apiRequest("PATCH", `/api/surveys/${surveyId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
    },
  });

  const pendingSurveys = surveys?.filter((s) => s.survey.status === "pending") ?? [];

  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Pending Surveys</h2>
        <div className="grid gap-4">
          {pendingSurveys.map(({ survey }) => (
            <Card key={survey.id}>
              <CardHeader>
                <CardTitle>{survey.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{survey.description}</p>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Reward per response</p>
                    <p className="font-medium">${Number(survey.rewardPerResponse).toFixed(2)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        updateStatus.mutate({
                          surveyId: survey.id,
                          status: "rejected",
                        })
                      }
                      disabled={updateStatus.isPending}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        updateStatus.mutate({
                          surveyId: survey.id,
                          status: "approved",
                        })
                      }
                      disabled={updateStatus.isPending}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {pendingSurveys.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No pending surveys to review
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
}