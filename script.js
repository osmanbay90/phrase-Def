document.addEventListener('DOMContentLoaded', () => {
    const wordInput = document.getElementById('wordInput');
    const searchButton = document.getElementById('searchButton');
    const resultsContainer = document.getElementById('results');
    const meaningResult = document.getElementById('meaningResult');
    const exampleResult = document.getElementById('exampleResult');
    const contextResult = document.getElementById('contextResult');

    // --- Gemini API Integration ---
    const API_KEY = 'AIzaSyDsKXvOl_3z-50xOe230LjyROclNSYX7Q0'; // IMPORTANT: Insecure to keep API key here in production
    // Updated model name based on the 404 error feedback
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

    async function fetchWordData(term) {
        console.log(`Fetching data for: ${term} using Gemini API`);

        const prompt = `
            For the word, phrase, or sentence: "${term}"

            Provide the following information clearly separated:
            1.  **Meaning:** A concise definition or explanation.
            2.  **Usage Example:** A sentence demonstrating how it's used.
            3.  **Cultural Context:** Brief notes on its cultural relevance, connotations, or specific usage scenarios, if applicable.

            If the input is nonsensical or you cannot provide meaningful information, please indicate that clearly for each section.
            Format the response plainly, without using markdown formatting like bolding or lists within the content itself, just provide the text for each section. Start each section clearly like "Meaning: ...", "Usage Example: ...", "Cultural Context: ...".
        `;

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    // Optional: Add safety settings if needed
                    // safetySettings: [
                    //   { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
                    // ]
                }),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
            }

            const data = await response.json();

            // --- Response Parsing ---
            // Basic parsing assuming the API returns text in the expected format.
            // This might need refinement based on actual API output variations.
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

            let meaning = 'Could not extract meaning.';
            let example = 'Could not extract usage example.';
            let context = 'Could not extract cultural context.';

            const meaningMatch = textResponse.match(/Meaning:(.*?)(Usage Example:|Cultural Context:|$)/is);
            if (meaningMatch && meaningMatch[1]) meaning = meaningMatch[1].trim();

            const exampleMatch = textResponse.match(/Usage Example:(.*?)(Cultural Context:|$)/is);
            if (exampleMatch && exampleMatch[1]) example = exampleMatch[1].trim();

            const contextMatch = textResponse.match(/Cultural Context:(.*)/is);
            if (contextMatch && contextMatch[1]) context = contextMatch[1].trim();

            // Handle cases where the API might explicitly say it can't find info
            if (textResponse.toLowerCase().includes("cannot provide meaningful information") || textResponse.trim() === '') {
                 meaning = `Could not find a definition for "${term}".`;
                 example = `Could not find a usage example for "${term}".`;
                 context = `Could not determine cultural context for "${term}".`;
            }


            return { meaning, example, context };

        } catch (error) {
            console.error('Error calling Gemini API:', error);
            // Return specific error message to UI
             return {
                meaning: 'Error fetching data from API.',
                example: `Details: ${error.message}`,
                context: 'Please check the console for more information and ensure the API key is valid.'
            };
        }
    }
    // --- End Gemini API Integration ---

    searchButton.addEventListener('click', async () => {
        const searchTerm = wordInput.value.trim();
        if (!searchTerm) {
            alert('Please enter a word or phrase.');
            return;
        }

        // Show some loading indication (optional, can be enhanced later)
        meaningResult.textContent = 'Loading...';
        exampleResult.textContent = 'Loading...';
        contextResult.textContent = 'Loading...';
        resultsContainer.classList.remove('hidden'); // Show container while loading

        try {
            const data = await fetchWordData(searchTerm);

            // Update the results
            meaningResult.textContent = data.meaning;
            exampleResult.textContent = data.example;
            contextResult.textContent = data.context;

        } catch (error) {
            console.error('Error fetching word data:', error);
            meaningResult.textContent = 'Error loading data.';
            exampleResult.textContent = '-';
            contextResult.textContent = '-';
        }
    });

    // Optional: Allow pressing Enter in the input field to trigger search
    wordInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            searchButton.click();
        }
    });
});
