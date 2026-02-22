import "./App.css";
import "./reset.css";
import { useState } from "react";
import { ConversationList } from "./ConversationList";
import { ChatView } from "./ChatView";

function App() {
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
