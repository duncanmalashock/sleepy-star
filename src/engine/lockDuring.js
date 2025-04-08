let interactionLocked = false;

export function isInteractionLocked() {
  return interactionLocked;
}

export async function lockDuring(asyncFn) {
  interactionLocked = true;
  try {
    await asyncFn();
  } finally {
    interactionLocked = false;
  }
}
