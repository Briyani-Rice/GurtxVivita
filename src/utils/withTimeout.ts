// Bounds an async operation so a hung promise can never block the caller
// forever. If `work` settles before `ms`, its result (or rejection) is used.
// If the deadline passes first, `onTimeout()` supplies a fallback value and the
// work is left to settle in the background (its late result is swallowed, so a
// late rejection never surfaces as an unhandled rejection).
export async function withTimeout<T>(
    work: Promise<T>,
    ms: number,
    onTimeout: () => T,
): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const deadline = new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(onTimeout()), ms);
    });

    // If the deadline wins, `work` may still reject later; swallow that so a
    // late rejection never surfaces as an unhandled rejection.
    void work.catch(() => {});

    try {
        return await Promise.race([work, deadline]);
    } finally {
        if (timer) {
            clearTimeout(timer);
        }
    }
}
