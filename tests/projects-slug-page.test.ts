import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/data", () => ({
  readData: vi.fn(),
}));

import { readData } from "@/lib/data";
import ProjectDetailPage from "@/app/(public)/projects/[slug]/page";

const mockProjectsData = {
  projects: [
    {
      title: "Modern Villa Renovation",
      subtitle: "A complete transformation",
      description:
        "This project involved a full renovation of a modern villa including kitchen, living room, and outdoor spaces.",
      image: "https://example.com/villa.jpg",
    },
    {
      title: "Office Space Redesign",
      subtitle: "Contemporary workspace",
      description: "Redesigned a 5000 sq ft office for a tech startup.",
      image: "https://example.com/office.jpg",
    },
  ],
};

describe("ProjectDetailPage", () => {
  beforeEach(() => {
    vi.mocked(readData<Record<string, unknown>>).mockResolvedValue(mockProjectsData as unknown as Record<string, unknown>);
  });

  it("renders the project title in hero", async () => {
    const page = await ProjectDetailPage({
      params: Promise.resolve({ slug: "modern-villa-renovation" }),
    });
    render(page);

    expect(screen.getByText("Modern Villa Renovation")).toBeDefined();
  });

  it("renders the project subtitle", async () => {
    const page = await ProjectDetailPage({
      params: Promise.resolve({ slug: "modern-villa-renovation" }),
    });
    render(page);

    expect(screen.getByText("A complete transformation")).toBeDefined();
  });

  it("renders the project description section", async () => {
    const page = await ProjectDetailPage({
      params: Promise.resolve({ slug: "modern-villa-renovation" }),
    });
    render(page);

    expect(
      screen.getByText(/This project involved a full renovation/)
    ).toBeDefined();
  });

  it("renders 'About Project' heading", async () => {
    const page = await ProjectDetailPage({
      params: Promise.resolve({ slug: "modern-villa-renovation" }),
    });
    const { container } = render(page);

    const h2 = container.querySelector("h2");
    expect(h2).not.toBeNull();
    expect(h2?.textContent).toContain("About");
    expect(h2?.textContent).toContain("Project");
  });

  it("renders the All Projects back link", async () => {
    const page = await ProjectDetailPage({
      params: Promise.resolve({ slug: "modern-villa-renovation" }),
    });
    render(page);

    expect(screen.getByText("All Projects")).toBeDefined();
  });

  it("renders hero image with correct src", async () => {
    const page = await ProjectDetailPage({
      params: Promise.resolve({ slug: "modern-villa-renovation" }),
    });
    const { container } = render(page);

    const img = container.querySelector(
      'img[src="https://example.com/villa.jpg"]'
    );
    expect(img).not.toBeNull();
  });

  it("renders with overflow-hidden wrapper to prevent horizontal scroll", async () => {
    const page = await ProjectDetailPage({
      params: Promise.resolve({ slug: "modern-villa-renovation" }),
    });
    const { container } = render(page);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("overflow-hidden");
  });

  it("renders hero section with overflow-hidden", async () => {
    const page = await ProjectDetailPage({
      params: Promise.resolve({ slug: "modern-villa-renovation" }),
    });
    const { container } = render(page);

    const hero = container.querySelector("section");
    expect(hero?.className).toContain("overflow-hidden");
  });

  it("renders h1 with break-words class", async () => {
    const page = await ProjectDetailPage({
      params: Promise.resolve({ slug: "modern-villa-renovation" }),
    });
    const { container } = render(page);

    const h1 = container.querySelector("h1");
    expect(h1?.className).toContain("break-words");
  });

  it("renders description paragraph with break-words class", async () => {
    const page = await ProjectDetailPage({
      params: Promise.resolve({ slug: "modern-villa-renovation" }),
    });
    const { container } = render(page);

    const descriptionP = container.querySelector("section:last-child p");
    expect(descriptionP?.className).toContain("break-words");
  });

  it("renders text-balance on headings", async () => {
    const page = await ProjectDetailPage({
      params: Promise.resolve({ slug: "modern-villa-renovation" }),
    });
    const { container } = render(page);

    const h1 = container.querySelector("h1");
    expect(h1?.className).toContain("text-balance");

    const h2 = container.querySelector("h2");
    expect(h2?.className).toContain("text-balance");
  });

  it("renders correct padding on description section", async () => {
    const page = await ProjectDetailPage({
      params: Promise.resolve({ slug: "modern-villa-renovation" }),
    });
    const { container } = render(page);

    const descSection = container.querySelector("section:last-child");
    expect(descSection?.className).toContain("px-4");
    expect(descSection?.className).toContain("py-16");
    expect(descSection?.className).toContain("md:px-8");
    expect(descSection?.className).toContain("lg:px-12");
    expect(descSection?.className).toContain("xl:px-24");
  });

  it("renders second project correctly", async () => {
    const page = await ProjectDetailPage({
      params: Promise.resolve({ slug: "office-space-redesign" }),
    });
    render(page);

    expect(screen.getByText("Office Space Redesign")).toBeDefined();
    expect(screen.getByText("Contemporary workspace")).toBeDefined();
    expect(screen.getByText(/Redesigned a 5000 sq ft/)).toBeDefined();
  });

  it("uses correct text sizes matching other pages", async () => {
    const page = await ProjectDetailPage({
      params: Promise.resolve({ slug: "modern-villa-renovation" }),
    });
    const { container } = render(page);

    const h1 = container.querySelector("h1");
    expect(h1?.className).toContain("text-2xl");
    expect(h1?.className).toContain("sm:text-4xl");
    expect(h1?.className).toContain("md:text-5xl");
    expect(h1?.className).toContain("font-light");

    // Should NOT have lg:text-6xl (was removed to match other pages)
    expect(h1?.className).not.toContain("lg:text-6xl");
  });
});
