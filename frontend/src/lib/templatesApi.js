import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Templates
export const listTemplates = () => axios.get(`${API}/milestone-templates`).then((r) => r.data);
export const getTemplate = (id) => axios.get(`${API}/milestone-templates/${id}`).then((r) => r.data);
export const createTemplate = (body) => axios.post(`${API}/milestone-templates`, body).then((r) => r.data);
export const updateTemplate = (id, body) => axios.patch(`${API}/milestone-templates/${id}`, body).then((r) => r.data);
export const cloneTemplate = (id) => axios.post(`${API}/milestone-templates/${id}/clone`).then((r) => r.data);
export const deleteTemplate = (id) => axios.delete(`${API}/milestone-templates/${id}`).then((r) => r.data);

// Custom milestones (per shipment + leg)
export const listCustomMilestones = (shipmentId) =>
  axios.get(`${API}/shipments/${shipmentId}/custom-milestones`).then((r) => r.data);
export const addCustomMilestone = (shipmentId, legId, body) =>
  axios
    .post(`${API}/shipments/${shipmentId}/legs/${legId}/custom-milestones`, body)
    .then((r) => r.data);
export const deleteCustomMilestone = (id) =>
  axios.delete(`${API}/custom-milestones/${id}`).then((r) => r.data);
