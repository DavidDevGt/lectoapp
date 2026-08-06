/**
 * Minimum number of APPROVED questions a reading needs before it can be
 * published. Shared by the publish gate (QuestionsPage) and the progress
 * banner (ApprovalProgress) so both always agree on the same threshold.
 *
 * Mirror of `MIN_APPROVED_QUESTIONS_TO_PUBLISH` in
 * `backend/src/modules/readings/reading.service.ts`. The backend is the
 * source of truth and enforces this server-side regardless of what the UI
 * shows; this constant only exists so the admin can gate the "Publish"
 * button and render progress without a round trip. If the backend value
 * ever changes, update this one too.
 */
export const MIN_APPROVED_QUESTIONS_TO_PUBLISH = 5;
