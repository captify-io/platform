import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, ArrowLeft } from "lucide-react";

interface InterviewQuestion {
  id: string;
  title: string;
  question: string;
  type: "text" | "textarea" | "select";
  placeholder?: string;
  options?: { value: string; label: string }[];
}

interface InterviewState {
  currentStep: number;
  totalSteps: number;
  completed: boolean;
  responses: Record<string, unknown>;
  lastUpdated: string;
}

interface ProfileInterviewProps {
  agentId: string;
  onComplete: (instructions: string) => void;
  onCancel: () => void;
}

export default function ProfileInterview({
  agentId,
  onComplete,
  onCancel,
}: ProfileInterviewProps) {
  const [interviewState, setInterviewState] = useState<InterviewState | null>(
    null
  );
  const [currentQuestion, setCurrentQuestion] =
    useState<InterviewQuestion | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Load interview state on mount
  const loadInterviewState = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/agents/${agentId}/interview`);
      if (!response.ok) throw new Error("Failed to load interview state");

      const data = await response.json();
      setInterviewState(data.interviewState);

      // If not completed, get the current question
      if (!data.interviewState.completed) {
        const questionResponse = await fetch(
          `/api/agents/${agentId}/interview`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "start" }),
          }
        );

        if (questionResponse.ok) {
          const questionData = await questionResponse.json();
          setCurrentQuestion(questionData.nextQuestion);
          setInterviewState(questionData.interviewState);

          // Load existing answer if available
          const prevResponse =
            questionData.interviewState.responses[
              questionData.interviewState.currentStep
            ];
          if (
            prevResponse &&
            typeof prevResponse === "object" &&
            "value" in prevResponse
          ) {
            setCurrentAnswer(String(prevResponse.value) || "");
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load interview");
    } finally {
      setIsLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    loadInterviewState();
  }, [loadInterviewState]);

  const submitStep = async () => {
    if (!interviewState || !currentQuestion || !currentAnswer.trim()) return;

    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(`/api/agents/${agentId}/interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_step",
          currentStep: interviewState.currentStep,
          stepData: {
            questionId: currentQuestion.id,
            value: currentAnswer,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to submit answer");

      const data = await response.json();

      if (data.completed) {
        // Interview completed
        onComplete(data.personalizedInstructions);
      } else {
        // Move to next question
        setInterviewState(data.interviewState);
        setCurrentQuestion(data.nextQuestion);

        // Load existing answer for next question
        const existingAnswer =
          data.interviewState.responses[data.interviewState.currentStep];
        setCurrentAnswer(existingAnswer?.value || "");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit answer");
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = async () => {
    if (!interviewState || interviewState.currentStep <= 0) return;

    const prevStep = interviewState.currentStep - 1;
    const prevResponse = interviewState.responses[prevStep];

    setInterviewState({
      ...interviewState,
      currentStep: prevStep,
    });

    setCurrentQuestion(getQuestionForStep(prevStep));
    setCurrentAnswer(
      prevResponse &&
        typeof prevResponse === "object" &&
        "value" in prevResponse
        ? (prevResponse as { value: string }).value
        : ""
    );
  };

  const getQuestionForStep = (step: number): InterviewQuestion => {
    const questions = [
      {
        id: "role_context",
        title: "Your Professional Role",
        question:
          "What is your primary role or profession? This helps me understand the context in which you work.",
        type: "text" as const,
        placeholder:
          "e.g., Data Scientist, Marketing Manager, Software Engineer",
      },
      {
        id: "daily_tasks",
        title: "Daily Responsibilities",
        question:
          "What are your main daily tasks and responsibilities? What do you spend most of your time doing?",
        type: "textarea" as const,
        placeholder:
          "Describe your typical workday and key responsibilities...",
      },
      {
        id: "challenges",
        title: "Current Challenges",
        question:
          "What are the biggest challenges or pain points you face in your work? What would you like help with?",
        type: "textarea" as const,
        placeholder:
          "Describe the challenges you face and areas where you need support...",
      },
      {
        id: "communication_style",
        title: "Communication Preferences",
        question:
          "How do you prefer to receive information and communicate? What style works best for you?",
        type: "select" as const,
        options: [
          {
            value: "detailed",
            label: "Detailed and comprehensive explanations",
          },
          { value: "concise", label: "Concise and to-the-point responses" },
          {
            value: "conversational",
            label: "Conversational and friendly tone",
          },
          { value: "formal", label: "Formal and professional tone" },
          { value: "technical", label: "Technical and data-driven approach" },
        ],
      },
      {
        id: "goals",
        title: "Goals and Objectives",
        question:
          "What are your main goals or objectives? What would success look like for you?",
        type: "textarea" as const,
        placeholder: "Describe your short-term and long-term goals...",
      },
    ];

    return questions[step];
  };

  if (isLoading && !currentQuestion) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading interview...</p>
        </CardContent>
      </Card>
    );
  }

  if (!interviewState || !currentQuestion) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6 text-center">
          <p className="text-red-600">
            Failed to load interview. Please try again.
          </p>
          <Button onClick={loadInterviewState} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const progress =
    ((interviewState.currentStep + 1) / interviewState.totalSteps) * 100;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Personalize Your Digital Twin</CardTitle>
            <CardDescription>
              Step {interviewState.currentStep + 1} of{" "}
              {interviewState.totalSteps}
            </CardDescription>
          </div>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
        <Progress value={progress} className="w-full" />
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold mb-2">
            {currentQuestion.title}
          </h3>
          <p className="text-gray-600 mb-4">{currentQuestion.question}</p>

          {currentQuestion.type === "text" && (
            <div>
              <Label htmlFor="answer">Your Answer</Label>
              <Input
                id="answer"
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder={currentQuestion.placeholder}
                className="mt-1"
              />
            </div>
          )}

          {currentQuestion.type === "textarea" && (
            <div>
              <Label htmlFor="answer">Your Answer</Label>
              <Textarea
                id="answer"
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder={currentQuestion.placeholder}
                rows={4}
                className="mt-1"
              />
            </div>
          )}

          {currentQuestion.type === "select" && currentQuestion.options && (
            <div>
              <Label htmlFor="answer">Select Your Preference</Label>
              <Select value={currentAnswer} onValueChange={setCurrentAnswer}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose an option..." />
                </SelectTrigger>
                <SelectContent>
                  {currentQuestion.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={interviewState.currentStep <= 0 || isLoading}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Button
            onClick={submitStep}
            disabled={!currentAnswer.trim() || isLoading}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <ArrowRight className="w-4 h-4 mr-2" />
            )}
            {interviewState.currentStep >= interviewState.totalSteps - 1
              ? "Complete"
              : "Next"}
          </Button>
        </div>

        {/* Progress indicators */}
        <div className="flex justify-center space-x-2 pt-4">
          {Array.from({ length: interviewState.totalSteps }, (_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i < interviewState.currentStep
                  ? "bg-green-500"
                  : i === interviewState.currentStep
                  ? "bg-blue-500"
                  : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
