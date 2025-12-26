import axios from 'axios';

const API_URL = '';

export const getDocs = async () => {
  const res = await axios.get(`${API_URL}/api/docs`);
  return res.data;
};

export const getDoc = async (docId) => {
  const res = await axios.get(`${API_URL}/api/docs/${docId}`);
  return res.data;
};

export const updatePage = async (docId, pageNum, status, rotation) => {
  const payload = {};
  if (status) payload.status = status;
  if (rotation !== undefined) payload.rotation = rotation;

  const res = await axios.post(
    `${API_URL}/api/docs/${docId}/pages/${pageNum}/update`,
    null,
    { params: payload }
  );
  return res.data;
};

export const updateDocMetadata = async (docId, userFilename) => {
  const res = await axios.put(`${API_URL}/api/docs/${docId}`, null, {
    params: { user_filename: userFilename }
  });
  return res.data;
};

export const exportDoc = async (docId) => {
  const res = await axios.post(`${API_URL}/api/docs/${docId}/export`);
  return res.data;
};

export const deleteDoc = async (docId) => {
  const res = await axios.delete(`${API_URL}/api/docs/${docId}`);
  return res.data;
};

export const getEventSourceUrl = () => `${API_URL}/api/events`;

export const getSplitSheetUrl = () => `${API_URL}/api/tools/split-sheet`;

