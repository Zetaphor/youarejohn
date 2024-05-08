const inputField = document.getElementById("userInput");
const moodElement = document.getElementById("mood");
const logTable = document.getElementById("logTable");
const turnIcon = document.getElementById("turnIcon");
const dayDisplay = document.getElementById("currentDay");
const turnDisplay = document.getElementById("currentTurn");

const turnsPerDay = 5;
const totalDays = 30;
let currentDay = 1;
let currentTurn = 1;

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

  const ratio = (value - min) / (max - min);

  let red = Math.round(255 * (1 - ratio));
  let green = Math.round(255 * ratio);
  const blue = 0;

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

document.getElementById("userInput").addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    submitInput();
  }
});

document.getElementById("submitButton").addEventListener("click", function (event) {
  event.preventDefault();
  submitInput();
});

function submitInput() {
  const eventInput = inputField.value.trim();

  if (eventInput.length > 0) {
    const unixtime = Date.now();

    const attributeData = {
      "health": Number(document.getElementById("health").textContent),
      "sanity": Number(document.getElementById("sanity").textContent),
      "happiness": Number(document.getElementById("happiness").textContent),
      "satiety": Number(document.getElementById("satiety").textContent)
    };

    addLogEntry(unixtime, eventInput);
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
  summaryCell.classList.add("flex", "p-0", "mt-3");
  let summaryContent = document.createElement("div");
  summaryContent.textContent = `John ${eventInput}`;
  summaryContent.classList.add("px-4", "py-2", "text-center", "font-semibold", "bg-gray-100", "rounded-t-md", "display-block", "mx-auto");
  summaryCell.appendChild(summaryContent);
  summaryRow.appendChild(summaryCell);

  const turnContainer = document.createElement("div");
  turnContainer.classList.add("absolute", "bottom-0", "left-0", "px-2", "py-1", "bg-gray-100", "rounded-t-md");
  turnContainer.textContent = `Day ${currentDay}, Turn ${currentTurn}`;
  summaryRow.appendChild(turnContainer);

  logTable.appendChild(summaryRow);

  let detailRow = document.createElement("tr");
  detailRow.classList.add("grid", "grid-cols-2", "divide-x", "divide-gray-400", "rounded-b-md", "bg-gray-100", "font-roboto-flex");
  let eventCell = document.createElement("td");
  let thoughtsCell = document.createElement("td");

  turnIcon.classList.add("rotate-turn");
  eventCell.textContent = "Simulating...";
  thoughtsCell.textContent = "Simulating...";

  eventCell.classList.add("p-4");
  thoughtsCell.classList.add("p-4");

  detailRow.appendChild(eventCell);
  detailRow.appendChild(thoughtsCell);
  logTable.appendChild(detailRow);

  moodElement.textContent = "Simulating...";
  currentTurn++;
  if (currentTurn > turnsPerDay) {
    currentTurn = 1;
    currentDay++;
  }
}

function updateLogEntry(unixtime, data) {
  const summaryRow = document.getElementById("summary-" + unixtime);
  const attributeChangeContainer = document.createElement("div");
  attributeChangeContainer.classList.add("absolute", "bottom-0", "right-0", "px-2", "py-1", "bg-gray-100", "rounded-t-md");
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

  turnIcon.classList.remove("rotate-turn");
  dayDisplay.textContent = `${currentDay}/${totalDays}`;
  turnDisplay.textContent = `${currentTurn}/${turnsPerDay}`;
}

function reset() {
  fetch('/reset/')
    .then(response => response.json())
    .then(data => {
      updateAttribute("health", 100);
      updateAttribute("sanity", 100);
      updateAttribute("happiness", 100);
      updateAttribute("satiety", 100);
      dayDisplay.textContent = `${currentDay}/${totalDays}`;
      turnDisplay.textContent = `${currentTurn}/${turnsPerDay}`;
      moodElement.textContent = "Waiting to be instantiated 🫥";
      logTable.innerHTML = "";
    })
}

document.addEventListener("DOMContentLoaded", reset);