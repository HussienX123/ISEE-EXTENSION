function drawRedBordersOnImagesInViewport() {
  document.querySelectorAll("img").forEach((img) => {
    const rect = img.getBoundingClientRect();

    const inViewport = (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );

    const isBigEnough = img.offsetWidth > 100 && img.offsetHeight > 100;

    if (inViewport && isBigEnough) {
      img.style.border = "3px solid red";
      img.setAttribute("data-image-highlighted", "true");
    } else {
      img.style.border = "none";
      img.removeAttribute("data-image-highlighted");
    }
  });
}


async function getBase64FromImage(img) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      ctx.drawImage(image, 0, 0);
      try {
        const mimeType = img.src.startsWith("data:") ? img.src.split(";")[0].split(":")[1] : "image/png";
        const base64 = canvas.toDataURL(mimeType).split(",")[1];
        resolve({ base64, mimeType });
      } catch (err) {
        reject(err);
      }
    };
    image.onerror = reject;
    image.src = img.src;
  });
}

async function processImages() {
  const images = [...document.querySelectorAll("img")]
    .filter(img => {
      const rect = img.getBoundingClientRect();
      const inViewport = (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
      const isBigEnough = img.offsetWidth > 100 && img.offsetHeight > 100;
      return inViewport && isBigEnough;
    });

  for (let img of images) {
    try {
      const { base64, mimeType } = await getBase64FromImage(img);

      const res = await fetch("https://jc8skwwk04oks00s8k4gwkgs.hussienx.com/api/image-to-arabic-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Image: base64, mimeType })
      });

      const json = await res.json();

      if (json.description) {
        console.log("📜 Arabic Description:\n", json.description);
      chrome.runtime.sendMessage({
        audio64: json.audioBase64, // your encoded audio
        mimeType: "audio/mpeg" // or "audio/wav"
      });

      } else {
        console.warn("No description returned from API.");
      }

    } catch (e) {
      console.error("❌ Error processing image:", e);
    }
  }
}

function playBase64Audio(audioBase64) {
  console.log(audioBase64);
  // Convert base64 to binary
  const byteCharacters = atob(audioBase64);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  // Create a Blob and blob URL
  const blob = new Blob(byteArrays, { type: "audio/mpeg" });
  const blobUrl = URL.createObjectURL(blob);

  // Create and play the audio
  const audio = new Audio(blobUrl);
  audio.play().catch(err => {
    console.error("🔊 Audio play error:", err);
  });
}


// Draw red border when page loads
// Initial border draw
drawRedBordersOnImagesInViewport();

// Update on scroll and resize
window.addEventListener("scroll", drawRedBordersOnImagesInViewport);
window.addEventListener("resize", drawRedBordersOnImagesInViewport);

// Key press trigger: Shift + D
document.addEventListener("keydown", (e) => {
  if (e.shiftKey && e.key.toLowerCase() === "d") {
    console.log("🎯 Shift+D pressed: starting image scan...");
    processImages();
  }
});

