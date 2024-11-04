import addOnUISdk from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";

// Wait for the SDK to be ready
addOnUISdk.ready.then(async () => {
  console.log("addOnUISdk is ready for use.");

  // Elements
  const promptInput = document.getElementById("promptInput");
  const generateButton = document.getElementById("my-btn");
  const loadingDiv = document.getElementById("loading");
  const errorDiv = document.getElementById("error");

  // Replace with your Cloudflare Worker URL
  const CLOUDFLARE_WORKER_URL = "https://wispy-sunset-a1f7.myk3.workers.dev/";

  // Helper function to show/hide loading state
  const setLoading = (isLoading) => {
    loadingDiv.classList.toggle("hidden", !isLoading);
    generateButton.disabled = isLoading;
  };

  // Helper function to show error
  const showError = (message) => {
    errorDiv.textContent = message;
    errorDiv.classList.remove("hidden");
    setTimeout(() => errorDiv.classList.add("hidden"), 5000);
  };

  // Function to implement design elements
  async function implementDesign(designElements) {
    for (const element of designElements) {
      try {
        switch (element.type) {
          case "text":
            await addText(element);
            break;
          case "shape":
            await addShape(element);
            break;
          case "image":
            await addImage(element);
            break;
        }
      } catch (error) {
        console.error(`Failed to add ${element.type}:`, error);
      }
    }
  }

  // Helper functions for adding different design elements
  async function addText(element) {
    const textElement = await addOnUISdk.app.document.addText(element.content);
    await textElement.setStyle({
      fontSize: element.fontSize || 24,
      color: element.color || "#000000",
    });
    if (element.position) {
      await textElement.setPosition(element.position.x, element.position.y);
    }
    await textElement.completeEdit();
  }

  async function addShape(element) {
    const shapeElement = await addOnUISdk.app.document.addShape({
      type: element.shapeType || "rectangle",
      width: element.width || 100,
      height: element.height || 100,
      fill: element.color || "#000000",
    });
    if (element.position) {
      await shapeElement.setPosition(element.position.x, element.position.y);
    }
    await shapeElement.completeEdit();
  }

  async function addImage(element) {
    // Handle image elements if needed
    console.log("Image support not implemented yet");
  }

  // Handle generate button click
  generateButton.addEventListener("click", async () => {
    const prompt = promptInput.value.trim();
    if (!prompt) {
      showError("Please enter a prompt");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(CLOUDFLARE_WORKER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate design");
      }

      const data = await response.json();

      // Check if we received valid design instructions
      if (data.designElements && Array.isArray(data.designElements)) {
        await implementDesign(data.designElements);
      } else {
        throw new Error("Invalid design instructions received");
      }
    } catch (error) {
      showError(error.message);
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  });

  // Enable the generate button once everything is set up
  generateButton.disabled = false;
});
