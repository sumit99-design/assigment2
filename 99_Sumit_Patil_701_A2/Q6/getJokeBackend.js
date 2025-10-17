// The API endpoint URL
const JOKE_API_URL = 'https://v2.jokeapi.dev/joke/Any';

/**
 * Fetches a random joke from the JokeAPI and logs it to the console.
 */
async function fetchAndDisplayJoke() {
    console.log("Fetching a joke for you...");
    try {
        // 1. Make the API request using fetch
        const response = await fetch(JOKE_API_URL);

        // 2. Check if the request was successful
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // 3. Parse the JSON response body
        const jokeData = await response.json();

        // 4. Handle the two types of jokes (single or two-part)
        if (jokeData.type === 'twopart') {
            console.log("\nSetup:    ", jokeData.setup);
            console.log("Punchline:", jokeData.punchline);
        } else {
            console.log("\nJoke:", jokeData.joke);
        }

    } catch (error) {
        // Handle any errors that occurred during the fetch
        console.error("Oops, couldn't fetch the joke:", error.message);
    }
}

// Run the function
fetchAndDisplayJoke();