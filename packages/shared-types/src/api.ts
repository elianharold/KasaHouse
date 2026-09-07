/**
 * Canonical REST paths, shared so the mobile service layer and the NestJS
 * controllers cannot drift. All are relative to the API base URL
 * (e.g. http://localhost:4000/api/v1).
 */
export const API_ROUTES = {
  auth: {
    requestOtp: '/auth/otp/request',
    verifyOtp: '/auth/otp/verify',
    requestEmailOtp: '/auth/email/request',
    verifyEmailOtp: '/auth/email/verify',
    passwordLogin: '/auth/password/login',
    setPassword: '/auth/password/set',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
  },
  users: {
    me: '/users/me',
    updateMe: '/users/me',
    deleteMe: '/users/me',
    publicProfile: (userId: string) => `/users/${userId}/public`,
  },
  listings: {
    browse: '/listings',
    byId: (id: string) => `/listings/${id}`,
    create: '/listings',
    update: (id: string) => `/listings/${id}`,
    changeStatus: (id: string) => `/listings/${id}/status`,
    remove: (id: string) => `/listings/${id}`,
    mine: '/listings/mine',
  },
  media: {
    uploadSignature: '/media/upload-signature',
    register: '/media',
    reorder: (listingId: string) => `/media/listing/${listingId}/reorder`,
    remove: (mediaId: string) => `/media/${mediaId}`,
  },
  kyc: {
    status: '/kyc/status',
    submit: '/kyc/submit',
    webhook: '/kyc/webhook',
  },
  chat: {
    threads: '/chat/threads',
    start: '/chat/threads',
    thread: (id: string) => `/chat/threads/${id}`,
    messages: (id: string) => `/chat/threads/${id}/messages`,
    read: (id: string) => `/chat/threads/${id}/read`,
  },
} as const;

export const API_VERSION_PREFIX = 'api/v1';
