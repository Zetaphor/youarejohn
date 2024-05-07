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
const logTable = document.getElementById("logTable");

function submitInput() {
  const eventInput = inputField.value.trim();

  if (eventInput.length > 0) {
    const unixtime = Date.now();

    // Get each attribute value and put it into an object
    const attributeData = {
      "health": Number(document.getElementById("health").textContent),
      "sanity": Number(document.getElementById("sanity").textContent),
      "happiness": Number(document.getElementById("happiness").textContent),
      "satiety": Number(document.getElementById("satiety").textContent)
    };

    addLogEntry(unixtime, eventInput);  // Initially add the entry with placeholders
    fetch('/simulate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ event: eventInput, attribute_data: attributeData })  // Send the event as JSON
    })
      .then(response => response.json())
      .then(data => {
        data.impactEffect = calculateImpactEffect(data.positiveImpact, data.severity);
        updateLogEntry(unixtime, data);
        updateAttribute(data.affected_attribute, data.impactEffect);
      })
      .catch(error => {
        console.error('Error:', error);
      });

    inputField.value = "";
  }
}

function calculateImpactEffect(positiveImpact, severity) {
  let maxValue = severity * 5;
  let randomNumber = Math.floor(Math.random() * maxValue);
  if (randomNumber === 0) randomNumber = 1;
  if (!positiveImpact) randomNumber *= -1;
  return randomNumber;
}

function addLogEntry(id, eventInput) {
  let summaryRow = document.createElement("tr");
  summaryRow.id = `summary-${id}`;
  summaryRow.style.position = "relative";
  let summaryCell = document.createElement("td");
  summaryCell.setAttribute("colspan", "2");
  summaryCell.textContent = `John ${eventInput}`;
  summaryCell.classList.add("p-4", "text-center", "font-semibold", "bg-grey-600");
  summaryRow.appendChild(summaryCell);
  logTable.appendChild(summaryRow);

  let detailRow = document.createElement("tr");
  detailRow.classList.add("grid", "grid-cols-2", "divide-x", "divide-gray-400");
  let eventCell = document.createElement("td");
  let thoughtsCell = document.createElement("td");

  eventCell.textContent = "Simulating...";
  thoughtsCell.textContent = "Simulating...";

  eventCell.classList.add("p-4");
  thoughtsCell.classList.add("p-4");

  detailRow.appendChild(eventCell);
  detailRow.appendChild(thoughtsCell);
  logTable.appendChild(detailRow);

  moodElement.textContent = "Simulating...";
}

function updateLogEntry(unixtime, data) {
  const summaryRow = document.getElementById("summary-" + unixtime);
  const attributeChangeContainer = document.createElement("div");
  attributeChangeContainer.classList.add("absolute", "top-0", "right-0", "py-3");
  attributeChangeContainer.style.display = "flex";
  imgAttributeType = document.createElement("img");
  imgAttributeType.src = "/static/img/icon_" + data.affected_attribute + ".png";
  imgAttributeType.classList.add("w-8", "h-8", "mr-1");
  const amountSpan = document.createElement("span");

  if (!data.positiveImpact) {
    amountSpan.style.color = "#FFFFFF";
    amountSpan.style.backgroundColor = "#FF0000";
  } else {
    amountSpan.style.color = "#000000";
    amountSpan.style.backgroundColor = "#00FF00";
  }
  amountSpan.classList.add("px-2", "py-1", "rounded-lg", "text-md", "font-bold", "text-center");
  amountSpan.textContent = data.positiveImpact ? `+${data.impactEffect}` : data.impactEffect;
  attributeChangeContainer.appendChild(imgAttributeType);
  attributeChangeContainer.appendChild(amountSpan);
  summaryRow.appendChild(attributeChangeContainer);


  const eventCells = document.querySelectorAll("#logTable td");
  eventCells[eventCells.length - 2].textContent = data.event_description;
  eventCells[eventCells.length - 1].textContent = data.inner_thoughts;
  moodElement.textContent = data.mood;
}

function reset() {
  fetch('/reset/')
    .then(response => response.json())
    .then(data => {
      updateAttribute("health", 100);
      updateAttribute("sanity", 100);
      updateAttribute("happiness", 100);
      updateAttribute("satiety", 100);
      moodElement.textContent = "Waiting to be instantiated 🫥";
      // Empty the log table
      logTable.innerHTML = "";
    })
}

document.addEventListener("DOMContentLoaded", reset);