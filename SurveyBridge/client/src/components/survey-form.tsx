import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, Minus } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { InsertSurvey } from "@db/schema";

const questionTypes = ["mcq", "checkbox", "text", "rating", "ranking"] as const;
type QuestionType = (typeof questionTypes)[number];

const surveySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  rewardPerResponse: z.string().min(1, "Reward is required"),
  participantQuota: z.number().min(1, "Quota must be at least 1"),
  questions: z.array(z.object({
    type: z.enum(questionTypes),
    text: z.string().min(1, "Question text is required"),
    options: z.array(z.string()).optional(),
    minRating: z.number().optional(),
    maxRating: z.number().optional(),
    required: z.boolean().default(true),
  })).min(1, "At least one question is required"),
});

type SurveyFormData = z.infer<typeof surveySchema>;

interface SurveyFormProps {
  onSubmit: (data: Omit<InsertSurvey, "creatorId" | "status" | "completedResponses" | "createdAt" | "updatedAt">) => void;
  isSubmitting: boolean;
}

export default function SurveyForm({ onSubmit, isSubmitting }: SurveyFormProps) {
  const form = useForm<SurveyFormData>({
    resolver: zodResolver(surveySchema),
    defaultValues: {
      title: "",
      description: "",
      rewardPerResponse: "1.00",
      participantQuota: 100,
      questions: [
        {
          type: "mcq",
          text: "",
          options: ["", ""],
          required: true,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  const handleSubmit = (data: SurveyFormData) => {
    onSubmit({
      ...data,
      rewardPerResponse: data.rewardPerResponse,
      questions: data.questions.map(q => ({
        ...q,
        options: q.type === "text" ? undefined : q.options,
        minRating: q.type === "rating" ? q.minRating : undefined,
        maxRating: q.type === "rating" ? q.maxRating : undefined,
      })),
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Survey Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="rewardPerResponse"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reward per Response ($)</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    step="0.01"
                    min="0.01"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="participantQuota"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Participant Quota</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    min="1"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Questions</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ type: "mcq", text: "", options: ["", ""], required: true })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="p-4 border rounded-lg space-y-4">
              <div className="flex justify-between items-start">
                <FormField
                  control={form.control}
                  name={`questions.${index}.type`}
                  render={({ field }) => (
                    <FormItem className="flex-1 mr-4">
                      <FormLabel>Question Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="mcq">Multiple Choice</SelectItem>
                          <SelectItem value="checkbox">Checkbox</SelectItem>
                          <SelectItem value="text">Free Text</SelectItem>
                          <SelectItem value="rating">Rating Scale</SelectItem>
                          <SelectItem value="ranking">Ranking</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <FormField
                control={form.control}
                name={`questions.${index}.text`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Text</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(form.watch(`questions.${index}.type`) === "mcq" || 
                form.watch(`questions.${index}.type`) === "checkbox" ||
                form.watch(`questions.${index}.type`) === "ranking") && (
                <div className="space-y-2">
                  <FormLabel>Options</FormLabel>
                  {form.watch(`questions.${index}.options`)?.map((_, optionIndex) => (
                    <Input
                      key={optionIndex}
                      {...form.register(`questions.${index}.options.${optionIndex}`)}
                      className="mb-2"
                      placeholder={`Option ${optionIndex + 1}`}
                    />
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const options = form.getValues(`questions.${index}.options`) || [];
                      form.setValue(`questions.${index}.options`, [...options, ""]);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </Button>
                </div>
              )}

              {form.watch(`questions.${index}.type`) === "rating" && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`questions.${index}.minRating`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Rating</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`questions.${index}.maxRating`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Rating</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          Create Survey
        </Button>
      </form>
    </Form>
  );
}