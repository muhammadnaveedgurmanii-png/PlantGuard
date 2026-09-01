// PlantGuard lightweight client state.
// Only holds small, ephemeral cross-page hand-offs (e.g. "Ask AI about this
// diagnosis" needs to carry a diagnosis_id from the Diagnosis/History page
// into the Chat page). Deliberately NOT a full state-management framework.

const KEY_PENDING_CHAT_CONTEXT = 'pg_pending_chat_diagnosis_id';

export const state = {
  setPendingChatDiagnosis(id) {
    sessionStorage.setItem(KEY_PENDING_CHAT_CONTEXT, String(id));
  },
  takePendingChatDiagnosis() {
    const v = sessionStorage.getItem(KEY_PENDING_CHAT_CONTEXT);
    sessionStorage.removeItem(KEY_PENDING_CHAT_CONTEXT);
    return v ? parseInt(v, 10) : null;
  }
};
