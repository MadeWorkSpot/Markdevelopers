import { describe, it, expect } from "vitest";
import { slugify } from "@/lib/slugify";

describe("slugify", () => {
  it("converts lowercase strings to slugs", () => {
    expect(slugify("hello world")).toBe("hello-world");
  });

  it("lowercases uppercase letters", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(slugify("Hello! @World#")).toBe("hello-world");
  });

  it("handles multiple spaces", () => {
    expect(slugify("hello   world")).toBe("hello-world");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("-hello-")).toBe("hello");
  });

  it("removes accented characters (NFD normalization)", () => {
    expect(slugify("Café Résumé")).toBe("cafe-resume");
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });

  it("handles strings with only special characters", () => {
    expect(slugify("!@#$%^&*()")).toBe("");
  });

  it("handles numeric strings", () => {
    expect(slugify("123 456")).toBe("123-456");
  });

  it("handles mixed alphanumeric and special characters", () => {
    expect(slugify("Project #1: Final Version!")).toBe("project-1-final-version");
  });

  it("handles long titles with multiple words", () => {
    expect(slugify("Modern Kitchen Renovation in Downtown")).toBe("modern-kitchen-renovation-in-downtown");
  });

  it("handles single word", () => {
    expect(slugify("Hello")).toBe("hello");
  });

  it("handles string with only spaces", () => {
    expect(slugify("   ")).toBe("");
  });
});
