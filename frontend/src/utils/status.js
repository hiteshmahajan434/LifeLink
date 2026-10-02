// A hospital request that is still PENDING after its deadline is shown as EXPIRED
export const getEffectiveStatus = (request, now = Date.now()) =>
  request.status === "PENDING" && request.expiresAt && new Date(request.expiresAt).getTime() <= now
    ? "EXPIRED"
    : request.status;

// confirmed (edited by the paramedic) wins over the raw AI parse
export const getRequirements = (emergency) =>
  emergency?.confirmedRequirements || emergency?.aiParsedRequirements || null;
