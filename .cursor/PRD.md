# Product Requirements Document: Up API Savings Visualizer (Proof of Concept)

**Version:** 0.1 (Draft)
**Date:** 2025-05-14
**Status:** Draft for Review

---
## 1. Introduction / Overview
This document outlines the requirements for a Proof of Concept (PoC) mobile application. The application will be built using React Native/Expo and will utilize the Up API (https://developer.up.com.au/) to retrieve savings account data. This data will then be visualized using React Native Skia (https://shopify.github.io/react-native-skia/) to display savings account balances over time through interactive line graphs. The primary purpose of this PoC is to validate the technical feasibility of this approach and to provide users with a basic tool to track their savings trends.

---
## 2. Goals / Objectives
The primary goals for this Proof of Concept (PoC) are:

* **User Motivation & Insight:** To provide Up bank customers with a visual way to track their aggregated savings balances over time, helping them understand their savings patterns, feel motivated by their progress, or identify when adjustments to their financial behavior might be needed.
* **Technical Validation:** To validate the technical approach of using React Native/Expo, the Up API, and React Native Skia for creating a mobile financial data visualization application.
* **Foundation for Future Development:** To create a foundational codebase and understanding that could be expanded upon if the PoC is successful.

---
## 3. Target Audience / User Personas
* **Primary Target User:** Existing customers of Up bank (Australia) who have access to and are willing to use their Up API key to connect to the application.
* **Assumed Characteristics:** Users are interested in having a clearer visual representation of their savings account balances and how they change over different periods.

---
## 4. User Stories / Use Cases (Proof of Concept Scope)
* **US1: Account Setup:** "As an Up bank customer, I want to securely connect the app to my Up API so that I can import my savings account data."
* **US2: Viewing Savings Trends:** "As a user, I want to see a line graph of my aggregated savings balance over time so that I can understand my savings trends."
* **US3: Interactive Graph Exploration:** "As a user, I want to be able to tap and scrub on the graph so that I can see my specific balance on different dates."
* **US4: Account Filtering for Clarity:** "As a user, I want to select which of my savings accounts are included in the visualization so that I can focus on my true savings progress and exclude accounts used for other purposes (like bills)."
* **US5: Timeframe Flexibility:** "As a user, I want to be able to switch between weekly, monthly, and yearly views of my savings history so that I can analyze trends over different periods."

---
## 5. Functional Requirements (Proof of Concept Scope)

**FR1: API Key Management**
* The app must provide a text input field for users to enter their Up API key.
* The app must validate the API key upon input (e.g., using the Up API's ping utility endpoint).
* The app must display a clear message to the user if the entered API key is invalid.
* For the PoC, the API key can be stored locally on the device (e.g., cached within app storage) after successful validation for subsequent use.

**FR2: Data Retrieval & Refresh**
* The app must fetch savings account data from the Up API on initial app launch (after successful API key setup).
* The app must provide a manual refresh mechanism (e.g., a button) for the user to update the data on demand.

**FR3: Graph Display & Interaction - Balances**
* The app must display savings account balances over time using a line graph rendered with React Native Skia.
* Upon initial data load (or if no specific user preferences are set), the graph will default to a "monthly" view.
* By default, the graph will display an aggregation of all available savings accounts that the user has not deselected.
* If data is loading or not yet available, the graph area should display a placeholder (e.g., a flat line or an empty state message).
* When the user taps and scrubs on the line graph, a callout box must appear, displaying the specific date and the corresponding aggregated balance for that date.

**FR4: Basic Error & Empty State Handling**
* If there are issues connecting to the Up API (after initial successful setup) or if no savings data is available to display, the app must show an appropriate empty state message to the user (e.g., "Could not connect to Up API," "No savings data available").

**FR5: Account Filtering/Selection**
* The app must provide a button (or similar control) near the graph that allows users to access a list of their available savings accounts retrieved via the API.
* This interface must allow users to toggle individual accounts on or off for inclusion in the aggregated graph visualization.
* The graph must update to reflect changes in account selection as quickly as possible, displaying a loading indicator if necessary.
* The app must persist the user's account selection preferences between sessions.

**FR6: Timeframe Selection for Graph**
* The app must provide a button (or similar control) near the graph that allows users to open a menu to select the desired timeframe for the graph.
* Supported timeframes are:
    * **Weekly:** Displays data for the current calendar week (e.g., Monday to Sunday).
    * **Monthly:** Displays data for the current calendar month (e.g., May 1st to May 31st). This is the default view.
    * **Yearly:** Displays data for the current calendar year (e.g., January 1st to December 31st).
* The graph must update to display data for the selected timeframe.
* The app must persist the user's last selected timeframe view between sessions.

---
## 6. Non-Functional Requirements (Proof of Concept Scope)

**NFR1: Performance**
* The app should strive to be as fast and responsive as possible in all interactions (data loading, graph rendering, UI updates).
* Loading indicators (e.g., spinners, skeleton screens) should be used to manage user perception and provide feedback during any unavoidable delays.

**NFR2: Security**
* For this proof of concept, the Up API key can be stored locally on the device (e.g., cached within the app's local storage).
* Data transmission will rely on the security provided by the Up API (HTTPS).
* No additional app-specific privacy measures (like biometric locks beyond the device's own) are required for the PoC.

**NFR3: Usability**
* Formal onboarding tutorials or extensive in-app help text are not required for the PoC, as users (likely internal or test users) can be guided directly.
* The app should be intuitive to use for the defined target audience.
* A custom design (aligned with the provided screenshot's aesthetic) will be sufficient, without strict adherence to platform-specific (iOS/Android) design guidelines.

**NFR4: Reliability/Availability**
* The app's ability to fetch data is dependent on the Up API's availability.
* If the Up API is unreachable or there are network connectivity issues, the app should display a clear "no connection" or error message. Caching data for offline viewing is not required for the PoC.

**NFR5: Compatibility**
* No specific minimum iOS or Android OS versions are targeted; reliance will be on the general compatibility provided by React Native/Expo for current common OS versions.

---
## 7. Design Considerations / Mockups
* A visual reference for the graph display and interaction is provided by the user (filename: `Screenshot 2025-05-14 at 3.42.51 pm.jpg`).
* **General Aesthetic:** The app should aim for a clean, modern look, potentially using a dark theme similar to the screenshot. The line graph should be the central focus.
* **Graph Interaction:** The ability to tap and scrub to see specific date/balance details via a callout is key.
* **Summary Data:** The screenshot shows opening/closing balances, money in/out. If this data is readily available from the API endpoints being used for balance history, it can be considered for display below the graph. This is secondary to the graph itself for the PoC.

---
## 8. Success Metrics (Proof of Concept Scope)
The PoC will be considered successful if it meets the following criteria:
* **Functional Data Pipeline:** Demonstrably and reliably fetches savings account data (balances, dates, account list) from the Up API for authenticated test users.
* **Accurate Visualization:** Accurately displays the fetched savings balances over time on an interactive line graph, with correct aggregation, filtering by account, and timeframe selection (weekly, monthly, yearly).
* **Technical Feasibility Confirmed:** Validates that the chosen technology stack (React Native, Expo, Up API, React Native Skia) is a viable and reasonably performant approach for building this type of application.
* **Positive User Feedback (Informal):** Test users can understand and use the app to view their savings trends without significant confusion.

---
## 9. Open Questions / Future Considerations
Items to consider for versions beyond the initial Proof of Concept:

* **Goal Setting & Visualization:** Implement features for users to set specific savings goals (amount and/or target date) and visualize their progress towards these goals on the graph.
* **Enhanced API Key Security:** Implement more robust and secure storage for the Up API key (e.g., using `expo-secure-store` or native Keychain/Keystore services) if the app moves towards wider distribution.
* **Interest Paid Visualization:** Add the ability to plot interest paid on the graph or display it alongside balance information.
* **Expanded Timeframe Options:** Introduce more granular timeframe selections (e.g., 3-month, 6-month) or a custom date range picker.
* **Data Export:** Allow users to export their graph data or a summary of their savings.
* **Detailed Transaction Display:** Consider options for showing specific transactions that contributed to balance changes when a user interacts with a point on the graph.
* **Multiple Account Views:** Option to view graphs for individual savings accounts separately, in addition to the aggregated view.
* **Onboarding:** A proper onboarding flow for new users if the app is developed further.
* **Accessibility:** Ensuring the app meets accessibility standards (e.g., for visually impaired users).
