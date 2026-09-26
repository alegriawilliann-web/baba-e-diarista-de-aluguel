import { request } from "./client.js";

export function blockProfessional(professionalId) {
  return request("/blocks", { method: "POST", body: { professionalId } });
}

export function unblockProfessional(blockId) {
  return request(`/blocks/${blockId}`, { method: "DELETE" });
}

export function listMyBlocks() {
  return request("/blocks/mine");
}

export function reportProfessional({ targetProfessionalId, motivo, detalhes }) {
  return request("/reports", { method: "POST", body: { targetProfessionalId, motivo, detalhes: detalhes || undefined } });
}
