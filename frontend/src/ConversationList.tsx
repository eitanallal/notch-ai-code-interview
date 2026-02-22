import styled from "styled-components";
import { useEffect, useState } from "react";
import { MainBodyWrapper, Header } from "./shared";

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  messageCount: number;
}

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

export function ConversationList({
  onEnter,
}: {
  onEnter: (id: string) => void;
}) {
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
