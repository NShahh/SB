import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { SelectSurvey } from "@db/schema";
import { useLocation } from "wouter";
import { Plus, Wallet } from "lucide-react";
import WalletCard from "@/components/wallet-card";

export default function BusinessDashboard() {
  const [, setLocation] = useLocation();
  const { data: surveys } = useQuery<{ survey: SelectSurvey, creator: { username: string } }[]>({
    queryKey: ["/api/surveys"],
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="grid gap-6">
          {/* Wallet Section */}
          <WalletCard />

          {/* Surveys Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">My Surveys</h2>
              <Button onClick={() => setLocation("/create-survey")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Survey
              </Button>
            </div>

            <div className="grid gap-4">
              {surveys?.map(({ survey }) => (
                <Card key={survey.id}>
                  <CardHeader>
                    <CardTitle>{survey.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{survey.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Status</p>
                        <p className="font-medium capitalize">{survey.status}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Questions</p>
                        <p className="font-medium">{survey.questions.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!surveys?.length && (
                <p className="text-center text-gray-500 py-8">
                  No surveys created yet. Click the button above to create your first survey.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}