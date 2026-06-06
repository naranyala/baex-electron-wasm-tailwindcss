export const DEBUG = true;

export const logPhase = (phase: string, data: any) => {
  if (DEBUG) {
    console.log(`[BAEX DEBUG][${phase}]:`, data);
  }
};
