/**
 * Generates an RGB color based on the proximity of a value to a defined range.
 * Closer to the minimum yields red, closer to the maximum yields green.
 *
 * @param {number} value The current value to evaluate.
 * @param {number} min The minimum possible value.
 * @param {number} max The maximum possible value.
 * @param {boolean} flipColors If true, the red and green values will be swapped.
 * @returns {string} The CSS rgb color string.
 */
function getColorByValue(value, min, max, flipColors = false) {
  if (min >= max) {
    throw new Error("Minimum value must be less than maximum value.");
  }

  if (value < min || value > max) {
    throw new Error("Value out of range.");
  }

  // Calculate ratio based on the value's position between min and max
  const ratio = (value - min) / (max - min);

  // Determine color intensity based on the ratio
  let red = Math.round(255 * (1 - ratio));
  let green = Math.round(255 * ratio);
  const blue = 0;

  // If flipColors is true, swap the red and green values
  if (flipColors) {
    [red, green] = [green, red];
  }

  return `rgb(${red}, ${green}, ${blue})`;
}


function updateAttribute(attribute, value) {
  const element = document.getElementById(attribute);
  let newValue = parseInt(element.textContent) + value;
  if (newValue < 0) newValue = 0;
  else if (newValue > 100) newValue = 100;
  element.textContent = newValue;
  let flipColors = false;
  if (attribute === "hunger") flipColors = true;
  let bgColor = getColorByValue(newValue, 0, 100, flipColors);
  element.style.backgroundColor = bgColor;
}

// Event listener for input field to submit on enter
document.getElementById("userInput").addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    submitInput();
  }
});

// Event listener for the submit button
document.getElementById("submitButton").addEventListener("click", function (event) {
  event.preventDefault();
  submitInput();
});

const inputField = document.getElementById("userInput");
const moodElement = document.getElementById("mood");

function submitInput() {
  const eventInput = inputField.value.trim();

  if (eventInput.length > 0) {
    addLogEntry(eventInput);  // Initially add the entry with placeholders
    fetch('/simulate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ event: eventInput })  // Send the event as JSON
    })
      .then(response => response.json())
      .then(data => {
        updateLogEntry(data.event_description, data.inner_thoughts, data.mood);
        updateAttribute(data.affected_attribute, data.amount);
      })
      .catch(error => {
        console.error('Error:', error);
      });

    inputField.value = "";
  }
}

function addLogEntry(eventInput) {
  const table = document.getElementById("logTable");

  let summaryRow = document.createElement("tr");
  let summaryCell = document.createElement("td");
  summaryCell.setAttribute("colspan", "2");
  summaryCell.textContent = `John ${eventInput}`;
  summaryCell.classList.add("p-4", "text-center", "font-semibold", "bg-grey-600");
  summaryRow.appendChild(summaryCell);
  table.appendChild(summaryRow);

  let detailRow = document.createElement("tr");
  detailRow.classList.add("grid", "grid-cols-2", "divide-x", "divide-gray-400");
  let eventCell = document.createElement("td");
  let thoughtsCell = document.createElement("td");

  eventCell.textContent = "Loading...";
  thoughtsCell.textContent = "Loading...";

  eventCell.classList.add("p-4");
  thoughtsCell.classList.add("p-4");

  detailRow.appendChild(eventCell);
  detailRow.appendChild(thoughtsCell);
  table.appendChild(detailRow);

  moodElement.textContent = "Determining...";  // Placeholder mood text
}

function updateLogEntry(eventDescription, innerThoughts, mood) {
  const eventCells = document.querySelectorAll("#logTable td");
  eventCells[eventCells.length - 2].textContent = eventDescription;  // Update the last event cell
  eventCells[eventCells.length - 1].textContent = innerThoughts;     // Update the last thoughts cell
  moodElement.textContent = mood;
}

updateAttribute("hunger", 0);
updateAttribute("health", 100);
updateAttribute("sanity", 100);
updateAttribute("happiness", 100);
updateAttribute("social", 100);