import { request } from "./client.js";

export function createJobPost(payload) {
  return request("/jobs", { method: "POST", body: payload });
}

export function listMyJobPosts() {
  return request("/jobs/mine");
}

export function closeJobPost(id) {
  return request(`/jobs/${id}/close`, { method: "PATCH" });
}

export function listOpenJobs(serviceType, { page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({ serviceType, page: String(page), limit: String(limit) });
  return request(`/jobs/open?${params.toString()}`);
}

export function applyToJob(id, mensagem) {
  return request(`/jobs/${id}/applications`, { method: "POST", body: { mensagem } });
}

export function listMyApplications(serviceType) {
  return request(`/jobs/applications/mine?serviceType=${serviceType}`);
}

export function getJobPostApplications(id) {
  return request(`/jobs/${id}/applications`);
}

export function updateApplicationStatus(jobId, applicationId, status) {
  return request(`/jobs/${jobId}/applications/${applicationId}`, { method: "PATCH", body: { status } });
}
