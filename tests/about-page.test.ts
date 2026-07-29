import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/data", () => ({
  readData: vi.fn(),
}));

import { readData } from "@/lib/data";
import AboutPage from "@/app/(public)/about/page";

const mockAboutData = {
  hero: {
    image: "https://example.com/hero.jpg",
    alt: "Team photo",
    heading: "Building the Future & Together",
    description: "We are a team of passionate developers.",
  },
  companyStory: {
    heading: "Our Story",
    content: "Founded in 2020, we started with a small team.",
  },
  sectionLabels: {
    aboutUs: "About Us",
    ourTeam: "Our Team",
    teamHeading: "Meet the Team",
    letsWorkTogether: "Let's Work Together",
    readyToStartHeading: "Ready to Start",
    readyToStartDesc: "Get in touch with us today.",
    getInTouchLabel: "Contact Us",
  },
  values: [
    { title: "Innovation", desc: "We push boundaries." },
    { title: "Quality", desc: "We deliver the best." },
  ],
  team: [
    { name: "Alice", role: "Developer", image: "https://example.com/alice.jpg" },
    { name: "Bob", role: "Designer", image: "https://example.com/bob.jpg" },
  ],
};

describe("AboutPage", () => {
  beforeEach(() => {
    vi.mocked(readData<Record<string, unknown>>).mockResolvedValue(mockAboutData as unknown as Record<string, unknown>);
  });

  it("renders the hero heading", async () => {
    const page = await AboutPage();
    render(page);

    expect(screen.getByText(/Building the Future/)).toBeDefined();
  });

  it("renders the hero description", async () => {
    const page = await AboutPage();
    render(page);

    expect(screen.getByText(/passionate developers/)).toBeDefined();
  });

  it("renders company story heading", async () => {
    const page = await AboutPage();
    render(page);

    expect(screen.getByText("Our Story")).toBeDefined();
  });

  it("renders company story content", async () => {
    const page = await AboutPage();
    render(page);

    expect(screen.getByText(/Founded in 2020/)).toBeDefined();
  });

  it("renders team members", async () => {
    const page = await AboutPage();
    render(page);

    expect(screen.getByText("Alice")).toBeDefined();
    expect(screen.getByText("Bob")).toBeDefined();
    expect(screen.getByText("Developer")).toBeDefined();
    expect(screen.getByText("Designer")).toBeDefined();
  });

  it("renders team member images with correct aspect ratio class", async () => {
    const page = await AboutPage();
    const { container } = render(page);

    const aspectDivs = container.querySelectorAll(".aspect-\\[3\\/4\\]");
    expect(aspectDivs.length).toBe(2);
  });

  it("renders team members in flex container", async () => {
    const page = await AboutPage();
    const { container } = render(page);

    const flex = container.querySelector(".flex.flex-wrap");
    expect(flex).not.toBeNull();
  });

  it("renders values section", async () => {
    const page = await AboutPage();
    render(page);

    expect(screen.getByText("Innovation")).toBeDefined();
    expect(screen.getByText("Quality")).toBeDefined();
    expect(screen.getByText("We push boundaries.")).toBeDefined();
    expect(screen.getByText("We deliver the best.")).toBeDefined();
  });

  it("renders team heading with correct text", async () => {
    const page = await AboutPage();
    const { container } = render(page);

    const teamH2 = container.querySelector("section:nth-of-type(4) h2");
    expect(teamH2).not.toBeNull();
    expect(teamH2?.textContent).toContain("Meet");
    expect(teamH2?.textContent).toContain("the");
    expect(teamH2?.textContent).toContain("Team");
  });

  it("renders CTA section", async () => {
    const page = await AboutPage();
    render(page);

    expect(screen.getByText("Get in touch with us today.")).toBeDefined();
    expect(screen.getByText("Contact Us")).toBeDefined();
    expect(screen.getByText(/Ready/)).toBeDefined();
    expect(screen.getByText(/Start/)).toBeDefined();
  });

  it("renders hero image with correct src", async () => {
    const page = await AboutPage();
    const { container } = render(page);

    const heroImg = container.querySelector('img[src="https://example.com/hero.jpg"]');
    expect(heroImg).not.toBeNull();
  });

  it("renders team member images with lazy loading", async () => {
    const page = await AboutPage();
    const { container } = render(page);

    const lazyImages = container.querySelectorAll('img[loading="lazy"]');
    expect(lazyImages.length).toBe(2);
  });

  it("renders section padding classes", async () => {
    const page = await AboutPage();
    const { container } = render(page);

    const sections = container.querySelectorAll(
      'section[class*="px-4"][class*="py-16"][class*="md:px-8"][class*="lg:px-12"][class*="xl:px-24"]'
    );
    expect(sections.length).toBeGreaterThanOrEqual(3);
  });
});
