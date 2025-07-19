// Simulate receiving audio base64 from the content/background (replace this with actual data)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.audio64 && message.mimeType) {
    playAudioFromBase64(message.audio64, message.mimeType);
    sendResponse({ status: "received" });
  }
});

function playAudioFromBase64(base64, mimeType) {
  const audio = new Audio();
  audio.src = `data:${mimeType};base64,${base64}`;
  audio.autoplay = true;
  audio.controls = true;

  audio.oncanplaythrough = () => {
    document.getElementById("status").textContent = "Playing audio...";
    audio.play();
  };

  audio.onerror = (err) => {
    document.getElementById("status").textContent = "Audio failed to play";
    console.error("Audio error:", err);
  };

  document.body.appendChild(audio);
}
