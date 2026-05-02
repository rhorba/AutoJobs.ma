import { describe, it, expect } from "vitest";
import { calcCompleteness } from "@/lib/completeness";

const empty = {
  first_name: null,
  last_name: null,
  city: null,
  years_experience: null,
  availability: null,
  cv_file_path: null,
};

describe("calcCompleteness", () => {
  it("empty profile scores 0", () => {
    expect(calcCompleteness(empty, 0, 0)).toBe(0);
  });

  it("first_name + last_name adds 20", () => {
    expect(calcCompleteness({ ...empty, first_name: "Ali", last_name: "Benali" }, 0, 0)).toBe(20);
  });

  it("only first_name (missing last_name) adds 0", () => {
    expect(calcCompleteness({ ...empty, first_name: "Ali" }, 0, 0)).toBe(0);
  });

  it("city adds 10", () => {
    expect(calcCompleteness({ ...empty, city: "Casablanca" }, 0, 0)).toBe(10);
  });

  it("years_experience=0 adds 10 (null-check, not falsy-check)", () => {
    expect(calcCompleteness({ ...empty, years_experience: 0 }, 0, 0)).toBe(10);
  });

  it("availability adds 10", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(calcCompleteness({ ...empty, availability: "immediate" as any }, 0, 0)).toBe(10);
  });

  it("experienceCount >= 1 adds 20", () => {
    expect(calcCompleteness(empty, 0, 1)).toBe(20);
  });

  it("experienceCount = 0 does not add 20", () => {
    expect(calcCompleteness(empty, 0, 0)).toBe(0);
  });

  it("skillCount >= 3 adds 15", () => {
    expect(calcCompleteness(empty, 3, 0)).toBe(15);
  });

  it("skillCount = 2 does not add 15", () => {
    expect(calcCompleteness(empty, 2, 0)).toBe(0);
  });

  it("cv_file_path adds 15", () => {
    expect(calcCompleteness({ ...empty, cv_file_path: "cv.pdf" }, 0, 0)).toBe(15);
  });

  it("fully complete profile scores 100", () => {
    const full = {
      first_name: "Ali",
      last_name: "Benali",
      city: "Kenitra",
      years_experience: 3,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      availability: "immediate" as any,
      cv_file_path: "cv.pdf",
    };
    // 20+10+10+10+20+15+15 = 100
    expect(calcCompleteness(full, 5, 2)).toBe(100);
  });

  it("score is capped at 100", () => {
    const full = {
      first_name: "A",
      last_name: "B",
      city: "C",
      years_experience: 1,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      availability: "x" as any,
      cv_file_path: "y",
    };
    expect(calcCompleteness(full, 10, 10)).toBe(100);
  });

  // 80% gate boundary tests
  it("score of 70 is below the 80% gate", () => {
    // name(20) + city(10) + years(10) + avail(10) + exp(20) = 70, no skills, no cv
    const c = {
      first_name: "Ali",
      last_name: "B",
      city: "C",
      years_experience: 2,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      availability: "x" as any,
      cv_file_path: null,
    };
    const score = calcCompleteness(c, 0, 1);
    expect(score).toBe(70);
    expect(score < 80).toBe(true);
  });

  it("score of 85 passes the 80% gate", () => {
    // name(20) + city(10) + years(10) + avail(10) + exp(20) + skills(15) = 85
    const c = {
      first_name: "Ali",
      last_name: "B",
      city: "C",
      years_experience: 2,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      availability: "x" as any,
      cv_file_path: null,
    };
    const score = calcCompleteness(c, 3, 1);
    expect(score).toBe(85);
    expect(score >= 80).toBe(true);
  });
});
