import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { SelectSurvey } from "@db/schema";

export default function ParticipantDashboard() {
  const { data: surveys } = useQuery<{ survey: SelectSurvey, creator: { username: string } }[]>({
    queryKey: ["/api/surveys"],
  });

  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Available Surveys</h2>
        <div className="grid gap-4">
          {surveys?.map(({ survey, creator }) => (
            <Card key={survey.id}>
              <CardHeader>
                <CardTitle>{survey.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{survey.description}</p>
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Created by</p>
                    <p className="font-medium">{creator.username}</p>
                  </div>
                  <Button>
                    View Survey
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {!surveys?.length && (
            <p className="text-center text-gray-500 py-8">
              No surveys available at the moment.
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
}