export type ActionResult = { success: true } | { success: false; error: string };

export const ACTION_OK: ActionResult = { success: true };

export function actionError(message: string): ActionResult {
  return { success: false, error: message };
}
