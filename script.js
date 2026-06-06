// This file initializes features page-by-page after the DOM is ready.
document.addEventListener("DOMContentLoaded", () =>
{
  renderFooterDate();

  const page = document.body.dataset.page; // Set in HTML to identify the current page for conditional initialization.

  if (page === "profile")
  {
    initializeDelayedImage(); // Handles the delayed reveal of the profile image and associated status messages.
  }

  if (page === "mark-to-grade")
  {
    initializeMarkToGrade(); // Sets up event listeners for the mark-to-grade conversion and triggers the initial state.
  }

  if (page === "staff")
  {
    initializeStaffPage(); // Initializes the staff page features and event listeners.
  }

  if (page === "temperature")
  {
    initializeTemperatureConverter(); // Sets up the temperature converter inputs and triggers the initial conversion state.
  }
});

// Footer date and year are shared across all pages.
function renderFooterDate()
{
  const now = new Date();
  const formattedDate = now.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  document.querySelectorAll(".current-year").forEach((el) =>
  {
    el.textContent = String(now.getFullYear());
  });

  document.querySelectorAll(".current-date").forEach((el) =>
  {
    el.textContent = formattedDate;
  });
}

// The profile image remains hidden for 10 seconds, then fades in.
function initializeDelayedImage()
{
  const delayedImage = document.getElementById("delayed-profile-image");
  const status = document.getElementById("image-status");
  const countdown = document.getElementById("image-countdown");
  const announcement = document.getElementById("image-announcement");

  if (!delayedImage)
  {
    return;
  }

  let secondsRemaining = 10;

  if (countdown)
  {
    countdown.textContent = String(secondsRemaining);
  }

  if (announcement)
  {
    announcement.textContent = `Profile image will appear in ${secondsRemaining} seconds.`;
  }

  const countdownId = setInterval(() =>
  {
    secondsRemaining -= 1;

    if (secondsRemaining > 0)
    {
      if (countdown)
      {
        countdown.textContent = String(secondsRemaining);
      }
      return;
    }

    clearInterval(countdownId);
    delayedImage.classList.remove("hidden");
    if (status)
    {
      status.textContent = "Profile image is now visible.";
      status.style.color = "var(--success)";
    }
    if (announcement)
    {
      announcement.textContent = "Profile image is now visible.";
    }
  }, 1000);

  delayedImage.addEventListener("error", () =>
  {
    delayedImage.classList.add("hidden");
    if (status)
    {
      status.textContent = "Could not load jcpic.jpg. Ensure jcpic.jpg exists in this folder.";
      status.style.color = "var(--danger)";
    }
    if (announcement)
    {
      announcement.textContent = "Could not load the profile image file. Ensure jcpic.jpg exists in this folder.";
    }
  }, { once: true });
}

// Connects UI events to the required MarkToGrade function.
function initializeMarkToGrade()
{
  const input = document.getElementById("mark-input-box");
  const convertButton = document.getElementById("convert-mark-btn");

  if (!input || !convertButton)
  {
    return;
  }

  convertButton.addEventListener("click", MarkToGrade);

  input.addEventListener("keydown", (event) =>
  {
    if (event.key === "Enter")
    {
      event.preventDefault();
      MarkToGrade();
    }
  });
}

// Required function that scrapes, validates, and converts mark values.
function MarkToGrade()
{
  const input = document.getElementById("mark-input-box");
  const message = document.getElementById("validation-message");
  const output = document.getElementById("grade-output");

  if (!input || !message || !output)
  {
    return;
  }

  const rawValue = input.value;
  const trimmedValue = rawValue.trim();

  message.textContent = "";
  output.textContent = "";

  try
  {
    if (trimmedValue.length === 0)
    {
      throw new Error("Please enter a mark. The field is currently empty.");
    }

    if (trimmedValue.includes(","))
    {
      throw new Error("Use a decimal point instead of a comma (example: 82.5).");
    }

    if (/^[+-]?\d+(\.\d+)?$/.test(trimmedValue) === false)
    {
      throw new Error("Only numeric values are accepted. Example: 0 to 100.");
    }

    // Use parseFloat so decimal marks (for example, 89.5) are preserved instead of truncated.
    const mark = parseFloat(trimmedValue);

    if (!Number.isFinite(mark))
    {
      throw new Error("The value entered is not a finite number.");
    }

    if (mark < 0)
    {
      throw new Error("Mark cannot be negative. Enter a value from 0 to 100.");
    }

    if (mark > 100)
    {
      throw new Error("Mark cannot be greater than 100. Enter a realistic mark.");
    }

    const grade = getLetterGrade(mark);
    message.textContent = "Mark is valid.";
    message.style.color = "var(--success)";
    output.textContent = `Grade: ${grade}`;
  }
  catch (error)
  {
    message.textContent = error.message;
    message.style.color = "var(--danger)";
  }
}

// Converts a validated numeric mark to its letter grade.
function getLetterGrade(mark)
{
  if (mark >= 90)
  {
    return "A";
  }

  if (mark >= 80)
  {
    return "B";
  }

  if (mark >= 70)
  {
    return "C";
  }

  if (mark >= 60)
  {
    return "D";
  }

  if (mark >= 50)
  {
    return "E";
  }

  return "F";
}

// Prepares sorting controls and initial rendering for the staff table.
function initializeStaffPage()
{
  const tableBody = document.getElementById("staff-table-body");
  const sortNameButton = document.getElementById("sort-name-btn");
  const sortSalaryButton = document.getElementById("sort-salary-btn");

  if (!tableBody || !sortNameButton || !sortSalaryButton || !Array.isArray(staffMembers))
  {
    return;
  }

  const localStaff = [...staffMembers];
  let nameAscending = true;
  let salaryAscending = true;

  renderStaffRows(localStaff, tableBody);

  sortNameButton.addEventListener("click", () =>
  {
    // Toggle between A-Z and Z-A by flipping the comparator sign.
    localStaff.sort((a, b) =>
    {
      const result = a.name.localeCompare(b.name);
      return nameAscending ? result : -result;
    });

    renderStaffRows(localStaff, tableBody);
    sortNameButton.textContent = nameAscending
      ? "Sort by Name (Z to A)"
      : "Sort by Name (A to Z)";
    nameAscending = !nameAscending;
  });

  sortSalaryButton.addEventListener("click", () =>
  {
    // Toggle between low-high and high-low by flipping the comparator sign.
    localStaff.sort((a, b) =>
    {
      const result = a.salary - b.salary;
      return salaryAscending ? result : -result;
    });

    renderStaffRows(localStaff, tableBody);
    sortSalaryButton.textContent = salaryAscending
      ? "Sort by Salary (High to Low)"
      : "Sort by Salary (Low to High)";
    salaryAscending = !salaryAscending;
  });
}

// Renders each staff member as a table row with currency formatting.
function renderStaffRows(staffList, tableBody)
{
  tableBody.innerHTML = "";

  staffList.forEach((staff) =>
  {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${staff.name}</td>
      <td>${staff.position}</td>
      <td>$${staff.salary.toLocaleString("en-CA")}</td>
    `;

    tableBody.appendChild(row);
  });
}

// Wires temperature input events and triggers the initial conversion state.
function initializeTemperatureConverter()
{
  const inputUnit = document.getElementById("input-unit");
  const inputValue = document.getElementById("temperature-input");

  if (!inputUnit || !inputValue)
  {
    return;
  }

  inputUnit.addEventListener("change", convertTemperature);
  inputValue.addEventListener("input", convertTemperature);

  convertTemperature();
}

// Converts from the selected source unit to all outputs.
function convertTemperature()
{
  const inputUnit = document.getElementById("input-unit");
  const inputValue = document.getElementById("temperature-input");

  const fahrenheitOutput = document.getElementById("fahrenheit-output");
  const celsiusOutput = document.getElementById("celsius-output");
  const kelvinOutput = document.getElementById("kelvin-output");
  const rankineOutput = document.getElementById("rankine-output");
  const message = document.getElementById("temperature-message");

  if (
    !inputUnit ||
    !inputValue ||
    !fahrenheitOutput ||
    !celsiusOutput ||
    !kelvinOutput ||
    !rankineOutput ||
    !message
  )
  {
    return;
  }

  const raw = inputValue.value.trim();

  if (raw.length === 0)
  {
    fahrenheitOutput.value = "";
    celsiusOutput.value = "";
    kelvinOutput.value = "";
    rankineOutput.value = "";
    message.textContent = "Enter a value to convert.";
    message.style.color = "var(--warning)";
    return;
  }

  const numericInput = Number(raw);

  if (!Number.isFinite(numericInput))
  {
    message.textContent = "Temperature must be numeric.";
    message.style.color = "var(--danger)";
    return;
  }

  let celsius;
  let fahrenheit;
  let kelvin;
  let rankine;

  if (inputUnit.value === "fahrenheit")
  {
    fahrenheit = numericInput;
    celsius = (fahrenheit - 32) * (5 / 9);
    kelvin = celsius + 273.15;
  }
  else if (inputUnit.value === "celsius")
  {
    celsius = numericInput;
    fahrenheit = (celsius * 9) / 5 + 32;
    kelvin = celsius + 273.15;
  }
  else if (inputUnit.value === "kelvin")
  {
    kelvin = numericInput;
    celsius = kelvin - 273.15;
    fahrenheit = (celsius * 9) / 5 + 32;
  }
  else
  {
    // Rankine conversion path: convert to Kelvin first, then derive C and F.
    rankine = numericInput;
    kelvin = rankine * (5 / 9);
    celsius = kelvin - 273.15;
    fahrenheit = rankine - 459.67;
  }

  // Standard relation between absolute scales.
  rankine = kelvin * (9 / 5);

  if (kelvin < 0)
  {
    message.textContent = "Kelvin cannot be below 0 K. Please enter a realistic value.";
    message.style.color = "var(--danger)";
    fahrenheitOutput.value = "";
    celsiusOutput.value = "";
    kelvinOutput.value = "";
    rankineOutput.value = "";
    return;
  }

  message.textContent = "Conversion complete.";
  message.style.color = "var(--success)";

  fahrenheitOutput.value = `${fahrenheit.toFixed(2)} F`;
  celsiusOutput.value = `${celsius.toFixed(2)} C`;
  kelvinOutput.value = `${kelvin.toFixed(2)} K`;
  rankineOutput.value = `${rankine.toFixed(2)} R`;
}
