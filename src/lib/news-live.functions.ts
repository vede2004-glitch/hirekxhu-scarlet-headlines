import { createServerFn } from "@tanstack/react-start";

// Egyetlen hírforrás a helyi src/data/news.json, ezért nincs mit átvenni
// külső forrásból: a szerver mindig nullt ad, így a beégetett lista marad.
export const getLiveNews = createServerFn({ method: "GET" }).handler(async (): Promise<string | null> => null);
