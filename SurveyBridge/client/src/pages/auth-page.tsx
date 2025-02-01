import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const authSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  role: z.enum(["business", "participant", "admin"]),
});

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const form = useForm({
    resolver: zodResolver(authSchema),
    defaultValues: {
      username: "",
      password: "",
      role: "business" as const,
    },
  });

  if (user) {
    setLocation(`/${user.role}`);
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to SurveyBridge</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form className="space-y-4" onSubmit={form.handleSubmit(async (data) => {
                try {
                  await loginMutation.mutateAsync(data);
                } catch {
                  await registerMutation.mutateAsync(data);
                }
              })}>
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>I am a...</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="participant">Participant</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loginMutation.isPending || registerMutation.isPending}
                >
                  Login or Register
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <div className="hidden md:flex flex-col justify-center">
          <h1 className="text-4xl font-bold mb-4">SurveyBridge</h1>
          <p className="text-lg text-gray-600">
            Connect with survey participants, manage your research, and earn rewards
            through our comprehensive survey management platform.
          </p>
        </div>
      </div>
    </div>
  );
}
