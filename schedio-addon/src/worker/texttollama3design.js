// export default {
//   async fetch(request, env) {
//     // Handle CORS
//     if (request.method === "OPTIONS") {
//       return new Response(null, {
//         headers: {
//           "Access-Control-Allow-Origin": "*",
//           "Access-Control-Allow-Methods": "POST, OPTIONS",
//           "Access-Control-Allow-Headers": "Content-Type",
//         },
//       });
//     }

//     try {
//       // Log the request method and content type
//       console.log("Request method:", request.method);
//       console.log("Content-Type:", request.headers.get("Content-Type"));

//       // Get the raw body for debugging
//       const rawBody = await request.text();
//       console.log("Raw request body:", rawBody);

//       // Try to parse the JSON
//       let data;
//       try {
//         data = JSON.parse(rawBody);
//       } catch (e) {
//         return new Response(
//           JSON.stringify({
//             error: "Invalid JSON in request body",
//             rawBody: rawBody,
//           }),
//           {
//             status: 400,
//             headers: {
//               "Content-Type": "application/json",
//               "Access-Control-Allow-Origin": "*",
//             },
//           }
//         );
//       }

//       const prompt = data.prompt;
//       if (!prompt) {
//         return new Response(
//           JSON.stringify({
//             error: "Missing 'prompt' field in request",
//           }),
//           {
//             status: 400,
//             headers: {
//               "Content-Type": "application/json",
//               "Access-Control-Allow-Origin": "*",
//             },
//           }
//         );
//       }

//       // Call Cloudflare AI
//       const aiResponse = await fetch(
//         "https://api.cloudflare.com/client/v4/ai/run/@cf/meta/llama-2-7b-chat-int8",
//         {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${env.AI_API_KEY}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             messages: [
//               {
//                 role: "system",
//                 content:
//                   "You are a design assistant. Create text-based designs.",
//               },
//               {
//                 role: "user",
//                 content: prompt,
//               },
//             ],
//           }),
//         }
//       );

//       if (!aiResponse.ok) {
//         const errorText = await aiResponse.text();
//         console.log("AI API error response:", errorText);
//         return new Response(
//           JSON.stringify({
//             error: "AI API error",
//             details: errorText,
//           }),
//           {
//             status: aiResponse.status,
//             headers: {
//               "Content-Type": "application/json",
//               "Access-Control-Allow-Origin": "*",
//             },
//           }
//         );
//       }

//       const result = await aiResponse.json();
//       console.log("AI API response:", result);

//       return new Response(
//         JSON.stringify({
//           suggestions: [result.result.response],
//         }),
//         {
//           headers: {
//             "Content-Type": "application/json",
//             "Access-Control-Allow-Origin": "*",
//           },
//         }
//       );
//     } catch (error) {
//       console.error("Worker error:", error);
//       return new Response(
//         JSON.stringify({
//           error: "Failed to process design request",
//           details: error.message,
//           stack: error.stack,
//         }),
//         {
//           status: 500,
//           headers: {
//             "Content-Type": "application/json",
//             "Access-Control-Allow-Origin": "*",
//           },
//         }
//       );
//     }
//   },
// };

export default {
  async fetch(request, env) {
    try {
      if (request.method === "POST") {
        const requestData = await request.json();
        const userPrompt = requestData.prompt;

        // Format the prompt to get design-specific instructions from the AI
        const designPrompt = {
          prompt: `Create a design based on this request: "${userPrompt}". 
                  Provide specific design instructions in the following JSON format:
                  - For text elements: include content, fontSize, color, and position (x, y)
                  - For shapes: include shapeType (rectangle, circle, etc.), width, height, color, and position
                  - All colors should be hex codes
                  - All positions should be in pixels
                  Response should be valid JSON following this structure:
                  {
                    "designElements": [
                      {
                        "type": "text|shape",
                        ... element specific properties
                      }
                    ]
                  }`,
        };

        // Get AI response
        const aiResponse = await env.AI.run(
          "@cf/meta/llama-3-8b-instruct",
          designPrompt
        );

        let parsedResponse;
        try {
          if (aiResponse) {
            parsedResponse = JSON.parse(aiResponse);
            console.log(parsedResponse);
          } else {
            throw new Error("No valid JSON found in AI response");
          }
        } catch (error) {
          // If parsing fails, create a simple default response
          parsedResponse = {
            designElements: [
              {
                type: "text",
                content: userPrompt,
                fontSize: 24,
                color: "#000000",
                position: { x: 100, y: 100 },
              },
            ],
          };
        }

        return Response.json(parsedResponse);
      }

      // Handle GET request (optional, for testing)
      return new Response("Please use POST request with a prompt", {
        status: 400,
      });
    } catch (error) {
      return new Response(`Error processing request: ${error.message}`, {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  },
};
