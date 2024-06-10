import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
// import { useQuery } from "@tanstack/react-query";
import { IoChatbubbleEllipses } from "react-icons/io5";
import s from "./ChatRoom.module.css";
import TopHeader from "../../../components/Common/ChatRoom/CommunityChatHeader/ChatHeader";
import ChatRoomInfo from "../../../components/Modal/ChatModal/ChatRoomInfo/ChatRoomInfo";
import ChatSearchBar from "../../../components/Modal/ChatModal/ChatSearchBar/ChatSearchBar";
import MessageSender from "../../../components/Modal/ChatModal/CreateChatModal/MessageSender/MessageSender";
import ChatMessage from "../../../components/Modal/ChatModal/ChatMessage/ChatMessage";
import ChatChannelType from "../../../components/Modal/ChatModal/ChatChannelType/ChatChannelType";
import InfiniteScrollComponent from "../../../components/Common/ChatRoom/InfiniteScrollComponent";
import useWebSocketStore from "../../../actions/useWebSocketStore";
import useChatStore from "../../../actions/useChatStore";
import useForumStore from "../../../actions/useForumStore";
import API from "../../../utils/API/API";
import useUserStore from "../../../actions/useUserStore";
import useAuthStore from "../../../actions/useAuthStore";
import axios from "axios";
import { axiosInstance } from "../../../utils/axiosInstance";

const fetchChatHistory = async (page, serverId, channelId, set) => {
  const token = localStorage.getItem("accessToken");
  try {
    const response = await axios.get(API.GET_HISTORY, {
      params: {
        channelId: channelId,
        page: page,
        size: 20,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    });
    const responseData = response.data.data;
    console.log("responseData", responseData);
    if (responseData) {
      set(serverId, responseData.data.reverse());
    }
  } catch (err) {
    console.error("채팅기록 불러오기 오류", err);
    throw new Error("채팅기록 불러오기 오류");
  }
};

const postUserLocation = async (userId, serverId, channelId) => {
  try {
    await axiosInstance.post(API.POST_LOCATION, {
      userId: userId,
      serverId: serverId,
      channelId: channelId,
    });
  } catch (err) {
    console.error("사용자 위치 POST 실패", err);
    throw new Error("사용자 위치 POST 실패");
  }
};

function ChatRoom() {
  const { userId, nickname } = useUserStore();
  const { serverId, channelId } = useParams();
  const [page, setPage] = useState(0);
  const chatListContainerRef = useRef(null);
  const { accessToken } = useAuthStore();
  const { client, isConnected } = useWebSocketStore();
  const {
    typingUsers,
    setTypingUsers,
    deleteMessage,
    modifyMessage,
    sendMessage,
    setChatList,
  } = useChatStore();
  const {
    setForumTypingUsers,
    addForumMessage,
    modifyForumMessage,
    deleteForumMessage,
  } = useForumStore((state) => ({
    setForumTypingUsers: state.setForumTypingUsers,
    addForumMessage: state.addForumMessage,
    modifyForumMessage: state.modifyForumMessage,
    deleteForumMessage: state.deleteForumMessage,
  }));
  const chatList = useChatStore((state) => state.chatLists[serverId]) || [];
  const TYPE = "server";

  useEffect(() => {
    postUserLocation(userId, serverId, channelId);
    // if (client && isConnected) {
    //   client.unsubscribe(serverId);
    // }
    if (client && isConnected) {
      connectWebSocket(serverId);
      fetchChatHistory(page, serverId, channelId, setChatList);
    }
  }, [serverId]);

  const connectWebSocket = (serverId) => {
    client.subscribe(API.SUBSCRIBE_CHAT(serverId), (frame) => {
      try {
        const parsedMessage = JSON.parse(frame.body);
        if (parsedMessage.chatType === "server") {
          if (
            parsedMessage.actionType === "TYPING" &&
            parsedMessage.userId !== userId
          ) {
            setTypingUsers((prevTypingUsers) => {
              if (!prevTypingUsers.includes(parsedMessage.writer)) {
                return [...prevTypingUsers, parsedMessage.writer];
              }
              return prevTypingUsers;
            });
          } else if (parsedMessage.actionType === "STOP_TYPING") {
            setTypingUsers((prevTypingUsers) =>
              prevTypingUsers.filter(
                (username) => username !== parsedMessage.writer
              )
            );
          } else if (parsedMessage.actionType === "SEND") {
            sendMessage(parsedMessage);
          } else if (parsedMessage.actionType === "MODIFY") {
            modifyMessage(
              serverId,
              parsedMessage.messageId,
              parsedMessage.content
            );
          } else if (parsedMessage.actionType === "DELETE") {
            deleteMessage(serverId, parsedMessage.messageId);
          }
        }
        //포럼
        if (parsedMessage.chatType === "forum") {
          if (
            parsedMessage.actionType === "TYPING" &&
            parsedMessage.userId !== userId
          ) {
            setForumTypingUsers((prevTypingUsers) => {
              if (!prevTypingUsers.includes(parsedMessage.writer)) {
                return [...prevTypingUsers, parsedMessage.writer];
              }
              return prevTypingUsers;
            });
          } else if (parsedMessage.actionType === "STOP_TYPING") {
            setForumTypingUsers((prevTypingUsers) =>
              prevTypingUsers.filter(
                (username) => username !== parsedMessage.writer
              )
            );
          } else if (parsedMessage.actionType === "SEND") {
            addForumMessage(parsedMessage);
          } else if (parsedMessage.actionType === "MODIFY") {
            modifyForumMessage(
              serverId,
              parsedMessage.messageId,
              parsedMessage.content
            );
          } else if (parsedMessage.actionType === "DELETE") {
            deleteForumMessage(serverId, parsedMessage.messageId);
          }
        }
      } catch (error) {
        console.error("구독 오류", error);
      }
    });
  };

  const handleSendMessage = async (messageContent, uploadedFiles) => {
    const messageBody = {
      serverId: serverId,
      channelId: channelId,
      userId: userId,
      parentId: 0,
      profileImage: "ho",
      // type: TYPE,
      writer: nickname,
      content: messageContent,
      createdAt: new Date().toISOString(),
    };

    const sendMessageWithoutFile = (messageBody) => {
      sendMessage(messageBody);
      client.publish({
        destination: API.SEND_CHAT(TYPE),
        body: JSON.stringify(messageBody),
      });
    };

    if (uploadedFiles.length >= 1) {
      await uploadFiles(messageBody, uploadedFiles);
    } else {
      sendMessageWithoutFile(messageBody);
    }
  };

  const uploadFiles = async (messageBody, uploadedFiles) => {
    const formData = new FormData();
    const jsonMsg = JSON.stringify(messageBody);
    const req = new Blob([jsonMsg], { type: "application/json" });
    formData.append("createRequest", req);
    uploadedFiles.forEach((file) => {
      formData.append("files", file);
    });
    try {
      await axios.post(API.FILE_UPLOAD, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${accessToken}`,
        },
        withCredentials: true,
      });
    } catch (error) {
      console.error("파일 업로드 오류:", error);
      throw new Error("파일 업로드 오류");
    }
  };

  const handleModifyMessage = (messageId, newContent) => {
    const messageBody = {
      serverId: serverId,
      messageId: messageId,
      content: newContent,
      actionType: "MODIFY",
    };
    const modifiedMessage = chatList.find(
      (message) => message.messageId === messageId
    );
    if (modifiedMessage) {
      modifiedMessage.content = newContent;
      modifyMessage(serverId, messageId, newContent);
      client.publish({
        destination: API.MODIFY_CHAT(TYPE),
        body: JSON.stringify(messageBody),
      });
    }
  };

  const handleDeleteMessage = (messageId) => {
    const messageBody = {
      serverId: serverId,
      messageId: messageId,
      actionType: "DELETE",
    };

    deleteMessage(serverId, messageId);
    client.publish({
      destination: API.DELETE_CHAT(TYPE),
      body: JSON.stringify(messageBody),
    });
  };

  const updatePage = () => {
    setPage((prevPage) => prevPage + 1);
  };

  useEffect(() => {
    if (chatListContainerRef.current) {
      chatListContainerRef.current.scrollTop =
        chatListContainerRef.current.scrollHeight;
    }
  }, [chatList]);

  const groupedMessages = groupMessagesByDate(chatList);

  return (
    <div className={s.chatRoomWrapper}>
      <div className={s.wrapper}>
        <div className={s.topContainer}>
          <TopHeader />
          <ChatRoomInfo />
          <ChatSearchBar />
        </div>
        <div className={s.chatContainer}>
          <ChatChannelType />
          <div
            ref={chatListContainerRef}
            id="chatListContainer"
            className={s.chatListContainer}
            style={{ overflowY: "auto", height: "530px" }}
          >
            <div className={s.topInfos}>
              <IoChatbubbleEllipses className={s.chatIcon} />
              <h1>일반 채널에 오신 것을 환영합니다</h1>
            </div>

            <InfiniteScrollComponent
              dataLength={chatList.length}
              next={updatePage}
              hasMore={true}
              scrollableTarget="chatListContainer"
            >
              {Object.keys(groupedMessages).map((date) => (
                <div key={date}>
                  <h4 className={s.dateHeader}>{date}</h4>
                  {groupedMessages[date].map((message, index) => (
                    <ChatMessage
                      key={index}
                      message={message}
                      onModifyMessage={handleModifyMessage}
                      onDeleteMessage={handleDeleteMessage}
                    />
                  ))}
                </div>
              ))}
            </InfiniteScrollComponent>
          </div>
          <div className={s.messageSender}>
            {typingUsers.length > 0 && (
              <div className="typingIndicator">
                {typingUsers.length >= 5
                  ? "여러 사용자가 입력 중입니다..."
                  : `${typingUsers.join(", ")} 입력 중입니다...`}
              </div>
            )}
            <MessageSender
              onMessageSend={handleSendMessage}
              serverId={serverId}
              channelId={channelId}
              writer={nickname}
              client={client}
              TYPE={TYPE}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const groupMessagesByDate = (messages) => {
  const groupedMessages = {};

  messages.forEach((message) => {
    const date = new Date(message.createdAt);
    const dateString = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;

    if (!groupedMessages[dateString]) {
      groupedMessages[dateString] = [];
    }
    groupedMessages[dateString].push(message);
  });

  return groupedMessages;
};

export default ChatRoom;
