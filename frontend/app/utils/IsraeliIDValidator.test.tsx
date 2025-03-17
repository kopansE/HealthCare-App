import React from "react";
import { screen, fireEvent, waitFor } from "@testing-library/dom";
import { render } from "@testing-library/react";

import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import IsraeliIDValidator from "./IsraeliIDValidator";

describe("IsraeliIDValidator", () => {
  // Basic rendering tests
  describe("Rendering", () => {
    it("renders the component with correct label", () => {
      render(<IsraeliIDValidator />);

      // Check that the label is rendered
      expect(screen.getByLabelText(/תעודת זהות מטופל/i)).toBeInTheDocument();

      // Check that the input is rendered with correct placeholder
      expect(
        screen.getByPlaceholderText(/הכנס תעודת זהות/i)
      ).toBeInTheDocument();
    });

    it("initially renders with no validation indicators", () => {
      render(<IsraeliIDValidator />);

      // Validation icons should not be present initially
      expect(screen.queryByText("✓")).not.toBeInTheDocument();
      expect(screen.queryByText("✗")).not.toBeInTheDocument();

      // Error message should not be present initially
      expect(
        screen.queryByText(/תעודת זהות אינה תקינה/i)
      ).not.toBeInTheDocument();
    });
  });

  // Input behavior tests
  describe("Input Handling", () => {
    it("accepts numeric input", async () => {
      render(<IsraeliIDValidator />);
      const input = screen.getByPlaceholderText(/הכנס תעודת זהות/i);

      await userEvent.type(input, "123456789");
      expect(input).toHaveValue("123456789");
    });

    it("rejects non-numeric input", async () => {
      render(<IsraeliIDValidator />);
      const input = screen.getByPlaceholderText(/הכנס תעודת זהות/i);

      await userEvent.type(input, "abc123def");
      expect(input).toHaveValue("123");
    });

    it("limits input to 9 digits", async () => {
      render(<IsraeliIDValidator />);
      const input = screen.getByPlaceholderText(/הכנס תעודת זהות/i);

      await userEvent.type(input, "1234567890");
      expect(input).toHaveValue("123456789");
    });

    it("resets validation state when input changes", async () => {
      render(<IsraeliIDValidator />);
      const input = screen.getByPlaceholderText(/הכנס תעודת זהות/i);

      // First enter invalid ID and trigger validation
      await userEvent.type(input, "123456789");
      fireEvent.blur(input);

      // Check that error message appears
      expect(screen.getByText(/תעודת זהות אינה תקינה/i)).toBeInTheDocument();

      // Change the input
      await userEvent.clear(input);
      await userEvent.type(input, "1");

      // Error message should be gone
      expect(
        screen.queryByText(/תעודת זהות אינה תקינה/i)
      ).not.toBeInTheDocument();
    });
  });

  // Validation algorithm tests
  describe("ID Validation", () => {
    it("validates a valid ID correctly - 123456782", async () => {
      render(<IsraeliIDValidator />);
      const input = screen.getByPlaceholderText(/הכנס תעודת זהות/i);

      // 123456782 is a valid ID according to the algorithm
      await userEvent.type(input, "123456782");
      fireEvent.blur(input);

      // Should show check mark (valid indicator)
      await waitFor(() => {
        const checkIcon = document.querySelector(".text-green-500");
        expect(checkIcon).toBeInTheDocument();
      });

      // Should not show error message
      expect(
        screen.queryByText(/תעודת זהות אינה תקינה/i)
      ).not.toBeInTheDocument();
    });

    it("validates a valid ID correctly - 789456123", async () => {
      render(<IsraeliIDValidator />);
      const input = screen.getByPlaceholderText(/הכנס תעודת זהות/i);

      // This is another valid ID for testing
      await userEvent.type(input, "789456123");
      fireEvent.blur(input);

      // Should show check mark (valid indicator)
      await waitFor(() => {
        const checkIcon = document.querySelector(".text-green-500");
        expect(checkIcon).toBeInTheDocument();
      });
    });

    it("validates an invalid ID correctly - 123456789", async () => {
      render(<IsraeliIDValidator />);
      const input = screen.getByPlaceholderText(/הכנס תעודת זהות/i);

      // This is an invalid ID
      await userEvent.type(input, "123456789");
      fireEvent.blur(input);

      // Should show X (invalid indicator)
      await waitFor(() => {
        const xIcon = document.querySelector(".text-red-500");
        expect(xIcon).toBeInTheDocument();
      });

      // Should show error message
      expect(screen.getByText(/תעודת זהות אינה תקינה/i)).toBeInTheDocument();
    });

    it("validates an invalid ID with too few digits", async () => {
      render(<IsraeliIDValidator />);
      const input = screen.getByPlaceholderText(/הכנס תעודת זהות/i);

      // Only 8 digits - too short
      await userEvent.type(input, "12345678");
      fireEvent.blur(input);

      // Should show error message
      expect(screen.getByText(/תעודת זהות אינה תקינה/i)).toBeInTheDocument();
    });
  });

  // Edge cases
  describe("Edge Cases", () => {
    it("does not validate on blur if input is empty", async () => {
      render(<IsraeliIDValidator />);
      const input = screen.getByPlaceholderText(/הכנס תעודת זהות/i);

      // Focus and blur without typing anything
      await userEvent.click(input);
      fireEvent.blur(input);

      // No validation indicators should appear
      expect(
        screen.queryByText(/תעודת זהות אינה תקינה/i)
      ).not.toBeInTheDocument();
      expect(document.querySelector(".text-green-500")).not.toBeInTheDocument();
      expect(document.querySelector(".text-red-500")).not.toBeInTheDocument();
    });

    it("handles input with different styling based on validation state", async () => {
      render(<IsraeliIDValidator />);
      const input = screen.getByPlaceholderText(/הכנס תעודת זהות/i);

      // Initial state (no validation)
      expect(input).toHaveClass("border-gray-300");
      expect(input).not.toHaveClass("border-red-500");

      // Enter invalid ID
      await userEvent.type(input, "123456789");
      fireEvent.blur(input);

      // Should have error styling
      await waitFor(() => {
        expect(input).toHaveClass("border-red-500");
        expect(input).not.toHaveClass("border-gray-300");
      });

      // Clear and enter valid ID
      await userEvent.clear(input);
      await userEvent.type(input, "123456782");
      fireEvent.blur(input);

      // Should have normal styling
      await waitFor(() => {
        expect(input).toHaveClass("border-gray-300");
        expect(input).not.toHaveClass("border-red-500");
      });
    });
  });

  // Accessibility tests
  describe("Accessibility", () => {
    it("has input properly associated with label", () => {
      render(<IsraeliIDValidator />);

      const label = screen.getByText(/תעודת זהות מטופל/i);
      const input = screen.getByPlaceholderText(/הכנס תעודת זהות/i);

      expect(label).toHaveAttribute("for", "patientID");
      expect(input).toHaveAttribute("id", "patientID");
    });

    it("provides visual feedback for validation errors", async () => {
      render(<IsraeliIDValidator />);
      const input = screen.getByPlaceholderText(/הכנס תעודת זהות/i);

      // Enter invalid ID
      await userEvent.type(input, "123456789");
      fireEvent.blur(input);

      // Should have error styling and message
      await waitFor(() => {
        expect(input).toHaveClass("border-red-500");
        expect(screen.getByText(/תעודת זהות אינה תקינה/i)).toBeInTheDocument();
      });
    });
  });

  // Snapshot test
  it("matches snapshot", () => {
    const { container } = render(<IsraeliIDValidator />);
    expect(container).toMatchSnapshot();
  });
});
