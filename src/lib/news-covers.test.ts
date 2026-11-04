import { existsSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { CATEGORY_COVERS, heroPhoto } from "./news-covers";

describe("gallery covers", () => {
  test.each(Object.entries(CATEGORY_COVERS))("%s has at least three gallery covers", (_category, covers) => {
    expect(new Set(covers).size).toBeGreaterThanOrEqual(3);
  });

  test("every selectable cover exists at its public deployment path", () => {
    for (const covers of Object.values(CATEGORY_COVERS)) {
      for (const url of covers) {
        expect(url.startsWith("/galeria/")).toBe(true);
        expect(existsSync(`public${url}`)).toBe(true);
      }
    }
  });

  test("the same article keeps the same cover", () => {
    const first = heroPhoto("Politika", "Magyar kormány", "article-123");
    expect(heroPhoto("Politika", "Magyar kormány", "article-123")).toBe(first);
    expect(CATEGORY_COVERS["Politika"]).toContain(first);
  });

  test("an unknown category uses the general gallery", () => {
    expect(CATEGORY_COVERS["Általános"]).toContain(heroPhoto("Ismeretlen", "Hír", "article-42"));
  });
});