import "./App.css";
import "./reset.css";
import styled from "styled-components";
import { ChatMessage, IChatMessage } from "./ChatMessage";
import { FormEvent, useEffect, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  messageCount: number;
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const MainBodyWrapper = styled.main`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 60%;
  margin-inline: auto;
  padding-block: 8px;
  font-family: Roboto, sans-serif;
`;

const Header = styled.h1`
  margin: auto;
`;

// ─── Conversation List ────────────────────────────────────────────────────────

const ListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 24px;
`;

const ConversationItem = styled.button`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  font-size: 1rem;
  &:hover {
    background: #e8e8e8;
  }
`;

const NewConversationButton = styled.button`
  padding: 10px 20px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  align-self: flex-start;
  margin-top: 16px;
  &:hover {
    background: #1d4ed8;
  }
`;

function ConversationList({ onEnter }: { onEnter: (id: string) => void }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const fetchConversations = async () => {
    const res = await fetch("http://localhost:3000/conversations");
    setConversations(await res.json());
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const createNew = async () => {
    const res = await fetch("http://localhost:3000/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const convo = await res.json();
    onEnter(convo.id);
  };

  return (
    <MainBodyWrapper>
      <Header>Welcome to Notch! ✦</Header>
      <NewConversationButton onClick={createNew}>
        + New Conversation
      </NewConversationButton>
      <ListWrapper>
        {conversations.length === 0 && (
          <p style={{ color: "#888" }}>No conversations yet. Start one!</p>
        )}
        {conversations.map((c) => (
          <ConversationItem key={c.id} onClick={() => onEnter(c.id)}>
            <span>{c.title || "Untitled"}</span>
            <span style={{ color: "#888", fontSize: "0.85rem" }}>
              {c.messageCount} msg{c.messageCount !== 1 ? "s" : ""} ·{" "}
              {new Date(c.createdAt).toLocaleDateString()}
            </span>
          </ConversationItem>
        ))}
      </ListWrapper>
    </MainBodyWrapper>
  );
}

// ─── Chat View ────────────────────────────────────────────────────────────────

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

function ChatView({
  conversationId,
  onBack,
}: {
  conversationId: string;
  onBack: () => void;
}) {
  const [chatMessages, setChatMessages] = useState<IChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load existing messages
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

// ─── App (router) ─────────────────────────────────────────────────────────────

function App() {
  // Persist active conversation in sessionStorage so refresh keeps you in the same chat
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(() => sessionStorage.getItem("activeConversationId"));

  const enterConversation = (id: string) => {
    sessionStorage.setItem("activeConversationId", id);
    setActiveConversationId(id);
  };

  const goBack = () => {
    sessionStorage.removeItem("activeConversationId");
    setActiveConversationId(null);
  };

  if (activeConversationId) {
    return <ChatView conversationId={activeConversationId} onBack={goBack} />;
  }

  return <ConversationList onEnter={enterConversation} />;
}

export default App;
