import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const listRemarks = (shipmentId, params = {}) =>
  axios.get(`${API}/shipments/${shipmentId}/remarks`, { params }).then((r) => r.data);

export const addRemark = (shipmentId, body) =>
  axios.post(`${API}/shipments/${shipmentId}/remarks`, body).then((r) => r.data);

export const updateRemark = (remarkId, body) =>
  axios.patch(`${API}/remarks/${remarkId}`, body).then((r) => r.data);

export const deleteRemark = (remarkId) =>
  axios.delete(`${API}/remarks/${remarkId}`).then((r) => r.data);

export const STAKEHOLDER_ROLES = [
  "Shipper",
  "Carrier",
  "Customs Agent",
  "Driver",
  "Warehouse Ops",
  "Customer Support",
  "Operations Manager",
  "Customer",
];

export const ROLE_COLORS = {
  "Shipper": "bg-blue-100 text-blue-800 border-blue-200",
  "Carrier": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Customs Agent": "bg-purple-100 text-purple-800 border-purple-200",
  "Driver": "bg-orange-100 text-orange-800 border-orange-200",
  "Warehouse Ops": "bg-amber-100 text-amber-800 border-amber-200",
  "Customer Support": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Operations Manager": "bg-slate-200 text-slate-800 border-slate-300",
  "Customer": "bg-pink-100 text-pink-800 border-pink-200",
};

export const roleColor = (role) =>
  ROLE_COLORS[role] || "bg-neutral-100 text-neutral-700 border-neutral-300";
