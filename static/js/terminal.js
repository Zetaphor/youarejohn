document.addEventListener('DOMContentLoaded', function () {
  const output = document.getElementById('output');
  const osLogo = document.getElementById('osLogo');
  const startButton = document.getElementById('startButton');
  const mainUI = document.getElementById('mainUI');
  const terminalUI = document.getElementById('terminalUI');

  const messages = [
    "[INFO] Booting up NarratOS...",
    "[OK] Kernel Loaded",
    "[OK] Initializing system modules...",
    "[OK] Loading quantum processing units...",
    "[OK] Quantum cores operational",
    "[OK] Qubit entanglement synchronization completed",
    "[OK] Personality models imported",
    "[OK] Emotional response algorithms calibration completed",
    "[INFO] Welcome to NarratOS. Preparing simulation environment...",
    "NarratOS> Simulation ready. Click below to begin..."
  ];




  let currentLine = 0;
  let index = 0;
  let interval = 10;

  function typeLine() {
    let line = messages[currentLine];
    if (index < line.length) {
      output.textContent += line.charAt(index);
      index++;
      setTimeout(typeLine, interval);
    } else {
      output.textContent += '\n';
      currentLine++;
      index = 0;
      if (currentLine < messages.length) {
        setTimeout(typeLine, 500);
      } else {
        startButton.classList.remove('hidden-item');
        startButton.classList.add('rotate');
        startButton.classList.add('cursor-pointer');
      }
    }
  }

  function skipIntro() {
    mainUI.classList.remove('hidden-item');
    mainUI.classList.add('fade-in');
    terminalUI.classList.add('hidden');
  }

  startButton.addEventListener('click', function () {
    mainUI.classList.remove('hidden-item');
    mainUI.classList.add('fade-in');
    terminalUI.classList.add('fade-out');
    setTimeout(function () {
      terminalUI.classList.add('hidden');
    }, 1000);
  });

  skipIntro();

  osLogo.classList.remove('hidden-item');
  osLogo.classList.add('fade-in');
  setTimeout(typeLine, 1200);
});