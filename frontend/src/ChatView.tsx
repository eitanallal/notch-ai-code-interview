import styled from "styled-components";
import { FormEvent, useEffect, useState } from "react";
import { ChatMessage, IChatMessage } from "./ChatMessage";
import { MainBodyWrapper, Header } from "./shared";

const ChatMessagesWrapper = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  overflow-y: scroll;
  flex: 1;
`;

const Form = styled.form`
  display: flex;
  gap: 8px;
  margin-inline: auto;
  width: 100%;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #2563eb;
  cursor: pointer;
  font-size: 0.95rem;
  padding: 4px 0;
  align-self: flex-start;
  &:hover {
    text-decoration: underline;
  }
`;

export function ChatView({
  conversationId,
  onBack,
}: {
  conversationId: string;
  onBack: () => void;
}) {
  const [chatMessages, setChatMessages] = useState<IChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:3000/conversations/${conversationId}`)
      .then((r) => r.json())
      .then((convo) => {
        setChatMessages(
          convo.messages.map(
            (m: { role: string; content: string }, i: number) => ({
              id: `${i}`,
              role: m.role === "assistant" ? "agent" : "user",
              content: m.content,
            }),
          ),
        );
      });
  }, [conversationId]);

  const formOnSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.querySelector("input") as HTMLInputElement;
    const message = input.value.trim();
    if (!message || isLoading) return;

    setChatMessages((prev) => [
      ...prev,
      { id: `${Date.now()}`, role: "user", content: message },
    ]);
    input.value = "";
    setIsLoading(true);

    try {
      const res = await fetch(
        `http://localhost:3000/conversations/${conversationId}/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        },
      );
      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        { id: `${Date.now()}`, role: "agent", content: data.reply },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}`,
          role: "agent",
          content: "Something went wrong.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainBodyWrapper>
      <Header>Welcome to Notch! ✦</Header>
      <BackButton onClick={onBack}>← Back to conversations</BackButton>
      <ChatMessagesWrapper>
        {chatMessages.map((chatMessage) => (
          <ChatMessage {...chatMessage} key={chatMessage.id} />
        ))}
        {isLoading && <ChatMessage id="loading" role="agent" content="···" />}
      </ChatMessagesWrapper>
      <Form onSubmit={formOnSubmit}>
        <input type="text" disabled={isLoading} style={{ flex: 1 }} />
        <button type="submit" disabled={isLoading}>
          Send
        </button>
      </Form>
    </MainBodyWrapper>
  );
}
