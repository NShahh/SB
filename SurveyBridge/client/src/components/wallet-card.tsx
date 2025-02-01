import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SelectTransaction } from "@db/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const depositSchema = z.object({
  amount: z.string().min(1).refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Amount must be greater than 0",
  }),
});

type DepositFormData = z.infer<typeof depositSchema>;

export default function WalletCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const depositForm = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
    defaultValues: { amount: "" },
  });

  const { data: walletData } = useQuery<{ balance: string; transactions: SelectTransaction[] }>({
    queryKey: ["/api/wallet"],
  });

  const depositMutation = useMutation({
    mutationFn: async (data: DepositFormData) => {
      await apiRequest("POST", "/api/wallet/deposit", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      depositForm.reset();
      toast({
        title: "Success",
        description: "Funds have been added to your wallet",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  let balanceDescription = "";
  switch(user?.role) {
    case "business":
      balanceDescription = "Available for creating surveys";
      break;
    case "participant":
      balanceDescription = "Earned from completing surveys";
      break;
    case "admin":
      balanceDescription = "Platform commissions earned";
      break;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Balance: ${Number(walletData?.balance || 0).toFixed(2)}</CardTitle>
        <p className="text-sm text-muted-foreground">{balanceDescription}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {user?.role === "business" && (
          <Form {...depositForm}>
            <form onSubmit={depositForm.handleSubmit(data => depositMutation.mutate(data))} className="space-y-4">
              <FormField
                control={depositForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Add Funds</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full"
                disabled={depositMutation.isPending}
              >
                Add Funds
              </Button>
            </form>
          </Form>
        )}

        <div>
          <h3 className="font-medium mb-2">Transaction History</h3>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {walletData?.transactions?.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium">{tx.description}</p>
                    <p className="text-sm text-gray-500">
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <span
                    className={
                      tx.type === "credit" ? "text-green-600" : "text-red-600"
                    }
                  >
                    {tx.type === "credit" ? "+" : "-"}${Number(tx.amount).toFixed(2)}
                  </span>
                </div>
              ))}
              {!walletData?.transactions?.length && (
                <p className="text-center text-gray-500 py-4">No transactions yet</p>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}