import { isValidElement } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/NewsFeed", () => ({ NewsFeed: () => null }));
vi.mock("@/components/PageShell", () => ({ meta: () => ({ meta: [] }) }));

import { Route as HomeRoute } from "@/routes/index";
import { Route as TopRoute } from "@/routes/friss";

function selectedView(component: unknown) {
  if (typeof component !== "function") throw new Error("Expected a page component");
  const element: unknown = component();
  if (!isValidElement<{ view: string }>(element)) throw new Error("Expected a feed element");
  return element.props.view;
}

describe("News homepage selection", () => {
  it("uses the chronological AI feed on the homepage", () => {
    expect(selectedView(HomeRoute.options.component)).toBe("latest");
  });
  it("keeps ranked Top news on the other page", () => {
    expect(selectedView(TopRoute.options.component)).toBe("top");
  });
});