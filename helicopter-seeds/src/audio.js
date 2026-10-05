// Quiet, synthesized garden audio. No downloads, microphone or frame-loop work.
export function createGardenAudio(button) {
  let context,
    master,
    breeze,
    filter,
    timer,
    chickenTimer,
    enabled = true;
  let lastCluck = 0;
  function note(frequency, end, duration, volume, type = "sine", delay = 0) {
    if (!enabled || document.hidden || context.state !== "running") return;
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(end, start + duration);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }
  function initialize() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) throw new Error("Audio unavailable");
    context = new Audio();
    master = context.createGain();
    master.gain.value = 0.35;
    master.connect(context.destination);
    const buffer = context.createBuffer(
      1,
      context.sampleRate * 3,
      context.sampleRate,
    );
    const samples = buffer.getChannelData(0);
    let smooth = 0;
    for (let i = 0; i < samples.length; i++) {
      smooth = (smooth + 0.025 * (Math.random() * 2 - 1)) / 1.025;
      samples[i] = smooth * 4;
    }
    const noise = context.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = 0.4;
    filter.frequency.value = 1200;
    // Remove the low rumble so the wind reads as leaf rustle, not a gale.
    const highpass = context.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 550;
    highpass.Q.value = 0.4;
    breeze = context.createGain();
    breeze.gain.value = 0.01;
    noise.connect(highpass).connect(filter).connect(breeze).connect(master);
    noise.start();
  }
  function scheduleBirds() {
    clearTimeout(timer);
    if (!enabled || document.hidden) return;
    timer = setTimeout(
      () => {
        note(1900, 2900, 0.13, 0.055);
        note(2700, 1800, 0.19, 0.04, "sine", 0.2);
        scheduleBirds();
      },
      5500 + Math.random() * 6000,
    );
  }
  function cluck() {
    if (
      !context ||
      !enabled ||
      document.hidden ||
      context.state !== "running" ||
      context.currentTime - lastCluck < 0.7
    )
      return;
    lastCluck = context.currentTime;
    const pitch = 0.85 + Math.random() * 0.3;
    note(650 * pitch, 190 * pitch, 0.12, 0.11, "triangle");
    note(500 * pitch, 160 * pitch, 0.16, 0.085, "triangle", 0.17);
  }
  function scheduleChickens() {
    clearTimeout(chickenTimer);
    if (!enabled || document.hidden) return;
    chickenTimer = setTimeout(
      () => {
        cluck();
        scheduleChickens();
      },
      2500 + Math.random() * 2500,
    );
  }
  async function applySound() {
    button.disabled = true;
    try {
      if (enabled && !context) initialize();
      if (context) {
        if (enabled) await context.resume();
        else await context.suspend();
      }
      button.setAttribute("aria-pressed", String(enabled));
      button.textContent = enabled ? "Sound: on" : "Sound: off";
      scheduleBirds();
      scheduleChickens();
    } catch {
      enabled = false;
      button.textContent = "Sound unavailable";
      button.setAttribute("aria-pressed", "false");
    } finally {
      button.disabled = false;
    }
  }
  button.addEventListener("click", () => {
    enabled = !enabled;
    applySound();
  });
  function unlockSound(event) {
    if (event.target.closest?.("#sound") || !enabled || context) return;
    applySound();
  }
  document.addEventListener("click", unlockSound);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") unlockSound(event);
  });
  document.addEventListener("visibilitychange", () => {
    if (!context) return;
    if (document.hidden) {
      clearTimeout(timer);
      clearTimeout(chickenTimer);
      context.suspend().catch(() => {});
    } else if (enabled) {
      context
        .resume()
        .then(() => {
          scheduleBirds();
          scheduleChickens();
        })
        .catch(() => {});
    }
  });
  return {
    wind(strength) {
      if (!context || !enabled || document.hidden) return;
      const amount = Math.min(1, strength);
      breeze.gain.setTargetAtTime(
        0.008 + amount * 0.045,
        context.currentTime,
        1.5,
      );
      filter.frequency.setTargetAtTime(
        1000 + amount * 500,
        context.currentTime,
        1.5,
      );
    },
    cluck,
  };
}
