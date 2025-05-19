import type { EntryGenerator } from "./$types";

export const entries: EntryGenerator = () => {
    return [{ profile_id: "demo" }];
};

export const prerender = true;
export const ssr = true;
