"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import AskInput from "@/components/AskInput";
import QuickAccessCards from "@/components/QuickAccessCards";
import Response from "@/components/Response";
import Footer from "@/components/Footer";
import { findAnswer, logQuery, Topic, AnswerResult } from "@/lib/data";

export default function HomePage() {
  const [question, setQuestion] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState("");
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const executeAsk = async (q: string) => {
    if (!q || isLoading) return;

    setIsLoading(true);
    setSubmittedQuestion(q);
    setAnswerResult(null);

    // Simula latência. No futuro: substituir por fetch("/api/ask", { body: q }).
    await new Promise((resolve) =>
      setTimeout(resolve, 900 + Math.random() * 600)
    );

    const result = findAnswer(q);
    logQuery(q, result);
    setAnswerResult(result);
    setIsLoading(false);
  };

  const handleAsk = () => executeAsk(question.trim());

  const handleRetry = () => executeAsk(submittedQuestion);

  const handleSuggestionSelect = (q: string) => {
    setQuestion(q);
    executeAsk(q);
  };

  const handleTopicSelect = (topic: Topic) => {
    setQuestion(topic.examplePrompt);
    // Foca no input após preencher (UX para mobile)
    setTimeout(() => {
      const el = document.getElementById("ask-question") as HTMLTextAreaElement;
      el?.focus();
      el?.setSelectionRange(el.value.length, el.value.length);
    }, 50);
  };

  return (
    <div className="grain-bg flex min-h-dvh flex-col bg-gradient-to-b from-cream-50 via-cream-50 to-cream-100/60">
      <div className="relative z-10 mx-auto flex w-full max-w-[440px] flex-1 flex-col">
        <Header />
        <Hero />
        <AskInput
          value={question}
          onChange={setQuestion}
          onSubmit={handleAsk}
          isLoading={isLoading}
        />

        <Response
          question={submittedQuestion}
          answerResult={answerResult}
          isLoading={isLoading}
          onRetry={handleRetry}
          onSuggestionSelect={handleSuggestionSelect}
        />

        <QuickAccessCards onSelect={handleTopicSelect} />

        <Footer />
      </div>
    </div>
  );
}
