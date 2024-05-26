import React, { useState, useRef } from "react";
import axios from "axios";

const FileUpload = ({ onFileUpload }) => {
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const fileInputRef = useRef(null);

  const uploadFile = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        "http://localhost:7070/server/message/file",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data.url;
    } catch (error) {
      console.error("파일 업로드 실패", error);
      throw new Error("파일 업로드 실패");
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    try {
      const uploadedFileUrl = await uploadFile(file);
      setUploadedFileUrl(uploadedFileUrl);
      onFileUpload(uploadedFileUrl);
    } catch (error) {
      console.error("파일 업로드 실패", error);
    }
  };

  const handleClickUploadButton = () => {
    fileInputRef.current.click();
  };

  return (
    <div>
      <button
        onClick={handleClickUploadButton}
        style={{
          backgroundColor: "transparent",
          marginTop: "5px",
          marginBottom: "5px",
        }}
      >
        <h4 style={{ color: "black" }}>📁 파일 업로드</h4>
      </button>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileUpload}
      />
    </div>
  );
};

export default FileUpload;
