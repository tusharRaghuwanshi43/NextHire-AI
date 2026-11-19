// API Client Service for NextHire AI

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

function getToken() {
  return localStorage.getItem('nexthire_token');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.headers || {}),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If payload is not FormData, set application/json
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const url = `${BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMsg = `Request failed (${response.status})`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.detail || errorData.message || errorMsg;
      } catch (_) {}
      throw new Error(errorMsg);
    }

    // Check if response is file / blob
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/pdf')) {
      return await response.blob();
    }

    return await response.json();
  } catch (err) {
    console.error(`API Error on [${options.method || 'GET'}] ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Authentication
  auth: {
    register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    me: () => request('/auth/me'),
    users: () => request('/auth/users'),
  },

  // Resumes
  resumes: {
    upload: (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return request('/resumes/upload', { method: 'POST', body: formData });
    },
    getMyResume: () => request('/resumes/my-resume'),
    getById: (id) => request(`/resumes/${id}`),
    review: (id, updateData) => request(`/resumes/${id}/review`, { method: 'PUT', body: JSON.stringify(updateData) }),
  },

  // Interviews
  interviews: {
    start: (params) => request('/interviews/start', { method: 'POST', body: JSON.stringify(params) }),
    getNextQuestion: (interviewId) => request(`/interviews/${interviewId}/next-question`),
    submitAnswer: (interviewId, data) => request(`/interviews/${interviewId}/submit-answer`, { method: 'POST', body: JSON.stringify(data) }),
    getMyInterviews: () => request('/interviews/my-interviews'),
    getDetail: (id) => request(`/interviews/${id}`),
  },

  // Evaluations & Claims
  evaluations: {
    getResults: (interviewId) => request(`/evaluations/${interviewId}`),
    getVerifications: (interviewId) => request(`/evaluations/verifications/${interviewId}`),
    getSkillGap: (interviewId) => request(`/evaluations/skill-gap/${interviewId}`),
  },

  // Recruiter Dashboard
  recruiter: {
    getStats: () => request('/recruiter/dashboard-stats'),
    getCandidates: (search, minScore) => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (minScore !== undefined && minScore !== null) params.append('min_score', minScore);
      const query = params.toString() ? `?${params.toString()}` : '';
      return request(`/recruiter/candidates${query}`);
    },
    getCandidateDetail: (candidateId) => request(`/recruiter/candidates/${candidateId}/detail`),
    compareCandidates: (interviewIds) => request('/recruiter/comparison', { method: 'POST', body: JSON.stringify(interviewIds) }),
    getAnalytics: () => request('/recruiter/analytics'),
  },

  // Reports
  reports: {
    downloadPdf: (interviewId) => request(`/reports/download-pdf/${interviewId}`),
  },

  // Settings & AI Providers
  settings: {
    getAiProviders: () => request('/settings/ai-provider'),
    setAiProvider: (provider) => request('/settings/ai-provider', { 
      method: 'POST', 
      body: JSON.stringify({ provider }) 
    }),
  }
};
