# Up API Savings Visualizer PoC: One-Story-Point User Stories

**Current Date:** May 14, 2025

---

## 1. Epic & Feature Breakdown

The PRD outlines several key areas. We can group these into logical epics for clarity, then break them into small, manageable stories.

* **Epic 1: API Connectivity & Authentication**
    * Feature: API Key Input & Validation
    * Feature: API Key Storage (PoC Scope)
* **Epic 2: Data Retrieval & Management**
    * Feature: Initial Data Fetch (Accounts & Balances)
    * Feature: Manual Data Refresh
* **Epic 3: Core Graph Visualization**
    * Feature: Basic Line Graph Display
    * Feature: Graph Interaction (Tap & Scrub for Details)
    * Feature: Graph Data Aggregation
* **Epic 4: Visualization Controls**
    * Feature: Account Filtering
    * Feature: Timeframe Selection
* **Epic 5: UI Shell & Basic UX**
    * Feature: Loading States
    * Feature: Error & Empty States

---

## 2. User Stories, Acceptance Criteria, Prioritization & Dependencies

We'll use a simplified **Weighted Shortest Job First (WSJF)** for prioritization. Since all stories are aimed to be "1 point" (Job Size = 1), priority will be determined by (User/Business Value + Time Criticality/Risk Reduction).
* **Value (V):** 1-10 (Impact on PoC goals: User Motivation, Technical Validation, Foundation)
* **Criticality/Risk (C/R):** 1-10 (Unblocks other work, reduces unknowns)
* **Priority Score (P):** V + C/R (Higher is better)

**Definition of Done (DoD) for each story:**
* Code implemented as per the story and ACs.
* Unit tests written and passing for new logic.
* Code reviewed by at least one peer.
* Story functionality manually tested and verified against ACs on a target device/emulator.
* UI elements match the spirit of the provided screenshot and design considerations (clean, modern, dark theme if feasible for the specific element).
* No critical bugs introduced by the story.
* Loading indicators used for any operations that might take >0.5 seconds.
* Relevant NFRs (performance, basic usability for the feature in question) considered.

---

### Epic 1: API Connectivity & Authentication

**Feature: API Key Input & Validation**

* **Story 1.1: Display API Key Input**
    * **As a** user, **I want** to see a text input field specifically for my Up API key, **so that** I can enter my credentials.
    * **Acceptance Criteria:**
        * Given the app is launched for the first time or no valid API key is stored,
        * When the API key input screen is presented,
        * Then a text input field is visible and editable.
        * And placeholder text (e.g., "Enter your Up API Key") is displayed in the input field.
    * **V:** 8, **C/R:** 10, **P:** 18
    * **Dependencies:** None

* **Story 1.2: Implement API Key Submission**
    * **As a** user, **I want** a button to submit my entered API key, **so that** the app can attempt to validate it.
    * **Acceptance Criteria:**
        * Given an API key has been entered into the input field,
        * When I tap the "Connect" (or similar) button,
        * Then an action is triggered to validate the key.
    * **V:** 8, **C/R:** 10, **P:** 18
    * **Dependencies:** Story 1.1

* **Story 1.3: Validate API Key via Ping Utility**
    * **As a** developer, **I want** to use the Up API's ping utility endpoint to validate the entered API key, **so that** we can confirm it's a functioning key before proceeding.
    * **Acceptance Criteria:**
        * Given an API key has been submitted,
        * When the validation logic runs,
        * Then an API call is made to the Up API ping endpoint (e.g., `https://api.up.com.au/api/v1/util/ping`) using the provided key.
        * And the app correctly interprets a successful (200 OK) response as valid.
    * **V:** 9, **C/R:** 10, **P:** 19
    * **Dependencies:** Story 1.2

* **Story 1.4: Display API Key Validation Success**
    * **As a** user, **I want** to see a clear success message or transition when my API key is validated, **so that** I know the connection was successful.
    * **Acceptance Criteria:**
        * Given the API key validation returns a success,
        * When the validation is complete,
        * Then a success message is briefly shown OR the app navigates to the main data view.
    * **V:** 7, **C/R:** 8, **P:** 15
    * **Dependencies:** Story 1.3

* **Story 1.5: Display API Key Validation Failure**
    * **As a** user, **I want** to see a clear error message if my API key is invalid, **so that** I can correct it or try again.
    * **Acceptance Criteria:**
        * Given the API key validation returns a failure (e.g., 401 Unauthorized),
        * When the validation is complete,
        * Then an error message (e.g., "Invalid API Key. Please check and try again.") is displayed clearly to the user.
        * And the user can attempt to re-enter the API key.
    * **V:** 7, **C/R:** 8, **P:** 15
    * **Dependencies:** Story 1.3

**Feature: API Key Storage (PoC Scope)**

* **Story 1.6: Store Valid API Key Locally**
    * **As a** developer, **I want** to store the validated Up API key locally on the device (e.g., using Expo's `expo-secure-store` or basic AsyncStorage for PoC simplicity), **so that** the user doesn't have to re-enter it every time they open the app.
    * **Acceptance Criteria:**
        * Given an API key has been successfully validated,
        * When the validation is successful,
        * Then the API key is stored securely in the app's local storage.
    * **V:** 8, **C/R:** 7, **P:** 15
    * **Dependencies:** Story 1.3

* **Story 1.7: Retrieve Stored API Key on Launch**
    * **As a** user, **I want** the app to automatically use my previously validated API key on subsequent launches, **so that** I don't have to set it up again.
    * **Acceptance Criteria:**
        * Given a valid API key was previously stored,
        * When the app is launched,
        * Then the app attempts to retrieve the API key from local storage.
        * And if found, proceeds to use it for API calls (e.g., attempts a ping or fetches data).
    * **V:** 8, **C/R:** 7, **P:** 15
    * **Dependencies:** Story 1.6

---

### Epic 2: Data Retrieval & Management

**Feature: Initial Data Fetch (Accounts & Balances)**

* **Story 2.1: Fetch List of Savings Accounts**
    * **As a** developer, **I want** to fetch the list of all the user's accounts (including savings accounts) from the Up API, **so that** I can identify which ones are savings accounts for visualization and filtering.
    * **Acceptance Criteria:**
        * Given a valid API key is available,
        * When initial data fetch is triggered (e.g., after API key validation or app launch with stored key),
        * Then an API call is made to the Up API `/accounts` endpoint.
        * And the app successfully retrieves and parses the list of accounts.
    * **V:** 9, **C/R:** 9, **P:** 18
    * **Dependencies:** Story 1.3 (or 1.7)

* **Story 2.2: Identify Savings Accounts from Fetched List**
    * **As a** developer, **I want** to filter the fetched account list to identify only "SAVER" type accounts, **so that** only relevant savings accounts are processed for the graph.
    * **Acceptance Criteria:**
        * Given a list of accounts has been fetched from the API,
        * When the account list is processed,
        * Then accounts with `attributes.accountType` equal to `SAVER` are identified.
        * And non-SAVER accounts are excluded from further savings balance processing.
    * **V:** 8, **C/R:** 8, **P:** 16
    * **Dependencies:** Story 2.1

* **Story 2.3 (Revised): Fetch Recent Transactions for All Savings Accounts**
    * **As a** developer, **I want** to fetch recent transactions (e.g., last 90 days to cover various views) for *all* identified SAVER accounts, **so that** their balance changes over time can be constructed for the graph.
    * **Acceptance Criteria:**
        * Given valid API key and a list of SAVER account IDs,
        * When initial data load occurs,
        * Then for each SAVER account, an API call is made to `/accounts/{accountId}/transactions` to get transactions (e.g., for the last 90 days).
        * And all retrieved transactions are stored/managed in-app.
    * **V:** 9, **C/R:** 8, **P:** 17
    * **Dependencies:** Story 2.2

**Feature: Manual Data Refresh**

* **Story 2.4: Implement Manual Refresh Button**
    * **As a** user, **I want** a visible "Refresh" button, **so that** I can manually update my savings data on demand.
    * **Acceptance Criteria:**
        * Given the main graph view is displayed,
        * When the view is rendered,
        * Then a "Refresh" button (e.g., an icon button) is visible and tappable.
    * **V:** 6, **C/R:** 5, **P:** 11
    * **Dependencies:** Story 3.1 (or any story that shows the main view)

* **Story 2.5: Trigger Data Re-fetch on Manual Refresh**
    * **As a** user, **I want** the app to re-fetch all necessary savings data from the Up API when I tap the "Refresh" button, **so that** my visualizations are updated with the latest information.
    * **Acceptance Criteria:**
        * Given the "Refresh" button is tapped,
        * When the action is triggered,
        * Then the app re-executes the data fetching logic (similar to Story 2.1 and 2.3).
        * And the graph (once implemented) updates with the new data.
    * **V:** 7, **C/R:** 6, **P:** 13
    * **Dependencies:** Story 2.4, Story 2.1, Story 2.3

---

### Epic 3: Core Graph Visualization

* **Story 3.0: Process Transactions into Date/Balance Data Points**
    * **As a** developer, **I want** to process the fetched transactions for selected accounts to create a series of (date, aggregated balance) data points, **so that** this can be fed to the line graph.
    * **Acceptance Criteria:**
        * Given transactions for one or more savings accounts have been fetched,
        * When the data is processed for graph display,
        * Then for each day with transaction activity, an aggregated balance is calculated using the `balanceAfter` field of the last transaction of that day for each included account.
        * And if multiple accounts are aggregated, their respective balances for that day are summed.
        * And a chronological list of (date, total balance) pairs is produced.
    * **V:** 9, **C/R:** 9, **P:** 18
    * **Dependencies:** Story 2.3

**Feature: Basic Line Graph Display**

* **Story 3.1: Display Basic Skia Line Graph Canvas**
    * **As a** developer, **I want** to render a basic React Native Skia canvas with a simple line graph component, **so that** I have a placeholder to display savings trends.
    * **Acceptance Criteria:**
        * Given the main app screen is loaded,
        * When data is available (even mock data initially),
        * Then a React Native Skia `<Canvas>` element is rendered.
        * And a simple line path is drawn using some hardcoded or very basic data points.
    * **V:** 8, **C/R:** 9, **P:** 17
    * **Dependencies:** Story 3.0 (or at least a decision on data structure for graph)

* **Story 3.2: Plot Aggregated Savings Balance on Graph**
    * **As a** user, **I want** to see my aggregated savings balance plotted over time on the line graph, **so that** I can understand my overall savings trend.
    * **Acceptance Criteria:**
        * Given processed (date, aggregated balance) data points are available,
        * When the graph view is rendered,
        * Then the line graph displays these data points, with dates on the X-axis and balance on the Y-axis.
        * And by default, all fetched SAVER accounts are included in the aggregation.
    * **V:** 10, **C/R:** 8, **P:** 18
    * **Dependencies:** Story 3.0, Story 3.1

* **Story 3.3: Display Graph Placeholder for No Data/Loading**
    * **As a** user, **I want** to see a placeholder or loading indicator in the graph area if data is loading or not yet available, **so that** I understand the app's state.
    * **Acceptance Criteria:**
        * Given data is being fetched or no savings data is available,
        * When the graph area is displayed,
        * Then it shows a clear loading indicator (e.g., spinner) or an empty state message (e.g., "Loading savings data..." or "No data to display").
        * And if it's an empty state, it could be a flat line on the graph.
    * **V:** 6, **C/R:** 6, **P:** 12
    * **Dependencies:** Story 3.1

**Feature: Graph Interaction (Tap & Scrub for Details)**

* **Story 3.4: Implement Tap/Scrub Gesture on Graph**
    * **As a** developer, **I want** to enable touch gesture handling (tap and pan/scrub) on the React Native Skia line graph, **so that** user interactions can be detected.
    * **Acceptance Criteria:**
        * Given the line graph is displayed with data,
        * When the user taps or drags their finger horizontally across the graph,
        * Then the app detects the touch coordinates relative to the graph.
    * **V:** 7, **C/R:** 7, **P:** 14
    * **Dependencies:** Story 3.2

* **Story 3.5: Display Callout with Date/Balance on Graph Interaction**
    * **As a** user, **I want** to see a callout box displaying the specific date and aggregated balance when I tap or scrub on the graph, **so that** I can see my exact balance on different dates.
    * **Acceptance Criteria:**
        * Given the user is tapping or scrubbing on the graph,
        * When a point on the graph is interacted with,
        * Then a callout box appears near the interaction point.
        * And the callout displays the date corresponding to the x-position and the aggregated balance corresponding to the y-position of the closest data point.
    * **V:** 9, **C/R:** 6, **P:** 15
    * **Dependencies:** Story 3.4

---

### Epic 4: Visualization Controls

**Feature: Account Filtering**

* **Story 4.1: Display Account Filter Button**
    * **As a** user, **I want** a button or control near the graph to access account filtering options, **so that** I can choose which accounts to include in the visualization.
    * **Acceptance Criteria:**
        * Given the main graph view is displayed,
        * When the view is rendered,
        * Then a clearly labeled button (e.g., "Filter Accounts" or an icon) is visible and tappable.
    * **V:** 7, **C/R:** 4, **P:** 11
    * **Dependencies:** Story 3.2

* **Story 4.2: Show List of Savings Accounts for Filtering**
    * **As a** user, **I want** to see a list of my available savings accounts when I activate the account filter, **so that** I can select/deselect them.
    * **Acceptance Criteria:**
        * Given the account filter button is tapped,
        * When the filter interface is presented (e.g., a modal or new screen),
        * Then a list of all identified SAVER accounts (fetched in Story 2.1/2.2) is displayed, each with its name.
        * And each account in the list has a toggle (e.g., checkbox, switch).
    * **V:** 8, **C/R:** 5, **P:** 13
    * **Dependencies:** Story 4.1, Story 2.2

* **Story 4.3: Implement Account Toggle Functionality**
    * **As a** user, **I want** to be able to toggle individual accounts on or off in the filter list, **so that** I can control their inclusion in the aggregated graph.
    * **Acceptance Criteria:**
        * Given the list of savings accounts with toggles is displayed,
        * When I tap a toggle for an account,
        * Then its selection state (included/excluded) changes.
        * And by default, all accounts are selected.
    * **V:** 8, **C/R:** 5, **P:** 13
    * **Dependencies:** Story 4.2

* **Story 4.4: Update Graph on Account Filter Change**
    * **As a** user, **I want** the graph to update immediately to reflect my account selection changes, **so that** I can see the impact of my filtering.
    * **Acceptance Criteria:**
        * Given I have changed the selection of accounts in the filter list and confirmed/closed the filter UI,
        * When the filter changes are applied,
        * Then the aggregated line graph re-renders, showing data only for the currently selected accounts.
        * And a loading indicator is shown during data reprocessing if necessary.
    * **V:** 9, **C/R:** 6, **P:** 15
    * **Dependencies:** Story 4.3, Story 3.2, Story 3.0

* **Story 4.5: Persist Account Selection Preferences**
    * **As a** user, **I want** the app to remember my account filter selections between sessions, **so that** I don't have to reconfigure them every time.
    * **Acceptance Criteria:**
        * Given I have made account filter selections,
        * When I close and reopen the app,
        * Then my previous account filter selections are restored and applied to the graph.
    * **V:** 6, **C/R:** 3, **P:** 9
    * **Dependencies:** Story 4.3 (uses local storage similar to Story 1.6)

**Feature: Timeframe Selection**

* **Story 4.6: Display Timeframe Selection Button**
    * **As a** user, **I want** a button or control near the graph to change the timeframe, **so that** I can analyze trends over different periods.
    * **Acceptance Criteria:**
        * Given the main graph view is displayed,
        * When the view is rendered,
        * Then a clearly labeled button (e.g., "Timeframe: Monthly" or an icon) is visible and tappable.
    * **V:** 7, **C/R:** 4, **P:** 11
    * **Dependencies:** Story 3.2

* **Story 4.7: Show Timeframe Options (Weekly, Monthly, Yearly)**
    * **As a** user, **I want** to see options for Weekly, Monthly, and Yearly views when I activate the timeframe selection, **so that** I can choose my desired period.
    * **Acceptance Criteria:**
        * Given the timeframe selection button is tapped,
        * When the selection interface is presented (e.g., a dropdown, modal),
        * Then options for "Weekly," "Monthly," and "Yearly" are displayed.
        * And the "Monthly" option is selected by default on first use.
    * **V:** 8, **C/R:** 5, **P:** 13
    * **Dependencies:** Story 4.6

* **Story 4.8: Update Graph to Weekly View**
    * **As a** user, **I want** the graph to display data for the current calendar week when I select "Weekly", **so that** I can see short-term trends.
    * **Acceptance Criteria:**
        * Given the "Weekly" timeframe is selected,
        * When the selection is applied,
        * Then the graph updates to display aggregated balance data points for the current calendar week (e.g., Monday to Sunday).
        * And the transaction data (from Story 2.3) is filtered/reprocessed for this range.
    * **V:** 7, **C/R:** 6, **P:** 13
    * **Dependencies:** Story 4.7, Story 3.0, Story 3.2

* **Story 4.9: Update Graph to Default Monthly View**
    * **As a** user, **I want** the graph to display data for the current calendar month by default or when I select "Monthly", **so that** I can see my typical monthly progress.
    * **Acceptance Criteria:**
        * Given no timeframe preference is set OR the "Monthly" timeframe is selected,
        * When the graph is displayed or updated,
        * Then the graph displays aggregated balance data points for the current calendar month.
        * And the transaction data (from Story 2.3) is filtered/reprocessed for this range.
    * **V:** 8, **C/R:** 7, **P:** 15
    * **Dependencies:** Story 4.7 (if selected, otherwise on Story 3.0, 3.2 for default)

* **Story 4.10: Update Graph to Yearly View**
    * **As a** user, **I want** the graph to display data for the current calendar year when I select "Yearly", **so that** I can see long-term trends.
    * **Acceptance Criteria:**
        * Given the "Yearly" timeframe is selected,
        * When the selection is applied,
        * Then the graph updates to display aggregated balance data points for the current calendar year.
        * And the transaction data (from Story 2.3) is filtered/reprocessed for this range. (Note: fetching enough transactions in Story 2.3 for a full year is important).
    * **V:** 7, **C/R:** 6, **P:** 13
    * **Dependencies:** Story 4.7, Story 3.0, Story 3.2

* **Story 4.11: Persist Last Selected Timeframe**
    * **As a** user, **I want** the app to remember my last selected timeframe view between sessions, **so that** I don't have to reselect it.
    * **Acceptance Criteria:**
        * Given I have selected a timeframe (Weekly, Monthly, or Yearly),
        * When I close and reopen the app,
        * Then my previously selected timeframe is restored and applied to the graph.
    * **V:** 6, **C/R:** 3, **P:** 9
    * **Dependencies:** Story 4.8, 4.9, or 4.10 (uses local storage)

---

### Epic 5: UI Shell & Basic UX

**Feature: Error & Empty States**

* **Story 5.1: Display Error on API Connection Failure (Post-Setup)**
    * **As a** user, **I want** to see an appropriate error message if the app cannot connect to the Up API after initial successful setup (e.g., network issue, API down), **so that** I understand there's a problem.
    * **Acceptance Criteria:**
        * Given the app has a valid API key but an API call fails due to network or server issues,
        * When attempting to fetch or refresh data,
        * Then a clear message like "Could not connect to Up API. Please check your internet connection." is displayed.
    * **V:** 6, **C/R:** 5, **P:** 11
    * **Dependencies:** Any story involving an API call post-setup (e.g., Story 2.1, 2.5)

* **Story 5.2: Display Message for No Savings Data Available**
    * **As a** user, **I want** to see a message if I have no savings accounts or no savings data to display, **so that** I understand why the graph is empty.
    * **Acceptance Criteria:**
        * Given API connection is successful but the user has no "SAVER" accounts OR no transaction data for selected accounts/timeframe,
        * When the graph attempts to render,
        * Then an appropriate empty state message is shown (e.g., "No savings accounts found." or "No savings data available for this period.").
    * **V:** 5, **C/R:** 4, **P:** 9
    * **Dependencies:** Story 2.2, Story 3.2

---

## 3. Prioritized List (Highest to Lowest Priority Score)

1.  **Story 1.3:** Validate API Key via Ping Utility (P: 19)
2.  **Story 1.1:** Display API Key Input (P: 18)
3.  **Story 1.2:** Implement API Key Submission (P: 18)
4.  **Story 2.1:** Fetch List of Savings Accounts (P: 18)
5.  **Story 3.0:** Process Transactions into Date/Balance Data Points (P: 18)
6.  **Story 3.2:** Plot Aggregated Savings Balance on Graph (P: 18)
7.  **Story 2.3 (Revised):** Fetch Recent Transactions for All Savings Accounts (P: 17)
8.  **Story 3.1:** Display Basic Skia Line Graph Canvas (P: 17)
9.  **Story 2.2:** Identify Savings Accounts from Fetched List (P: 16)
10. **Story 1.4:** Display API Key Validation Success (P: 15)
11. **Story 1.5:** Display API Key Validation Failure (P: 15)
12. **Story 1.6:** Store Valid API Key Locally (P: 15)
13. **Story 1.7:** Retrieve Stored API Key on Launch (P: 15)
14. **Story 3.5:** Display Callout with Date/Balance on Graph Interaction (P: 15)
15. **Story 4.4:** Update Graph on Account Filter Change (P: 15)
16. **Story 4.9:** Update Graph to Default Monthly View (P: 15)
17. **Story 3.4:** Implement Tap/Scrub Gesture on Graph (P: 14)
18. **Story 2.5:** Trigger Data Re-fetch on Manual Refresh (P: 13)
19. **Story 4.2:** Show List of Savings Accounts for Filtering (P: 13)
20. **Story 4.3:** Implement Account Toggle Functionality (P: 13)
21. **Story 4.7:** Show Timeframe Options (Weekly, Monthly, Yearly) (P: 13)
22. **Story 4.8:** Update Graph to Weekly View (P: 13)
23. **Story 4.10:** Update Graph to Yearly View (P: 13)
24. **Story 3.3:** Display Graph Placeholder for No Data/Loading (P: 12)
25. **Story 2.4:** Implement Manual Refresh Button (P: 11)
26. **Story 4.1:** Display Account Filter Button (P: 11)
27. **Story 4.6:** Display Timeframe Selection Button (P: 11)
28. **Story 5.1:** Display Error on API Connection Failure (Post-Setup) (P: 11)
29. **Story 4.5:** Persist Account Selection Preferences (P: 9)
30. **Story 4.11:** Persist Last Selected Timeframe (P: 9)
31. **Story 5.2:** Display Message for No Savings Data Available (P: 9)

---

## 4. Roadmap Integration (Suggested Sprints/Iterations)

Assuming 1-week sprints and a developer can complete roughly 5 one-point stories per week (allowing for testing, reviews, meetings). Total stories: 31. Estimated ~6-7 Sprints for PoC.

* **Sprint 1: Core API Connection & Basic Data (Foundation)**
    * 1.3: Validate API Key via Ping Utility
    * 1.1: Display API Key Input
    * 1.2: Implement API Key Submission
    * 1.4: Display API Key Validation Success
    * 1.5: Display API Key Validation Failure
    * *(Goal: User can enter API key and app confirms if it's valid.)*

* **Sprint 2: Data Fetching & Initial Storage**
    * 1.6: Store Valid API Key Locally
    * 1.7: Retrieve Stored API Key on Launch
    * 2.1: Fetch List of Savings Accounts
    * 2.2: Identify Savings Accounts from Fetched List
    * 2.3 (Revised): Fetch Recent Transactions for All Savings Accounts
    * *(Goal: App can securely connect, get account and transaction data silently.)*

* **Sprint 3: Basic Graph Rendering**
    * 3.0: Process Transactions into Date/Balance Data Points
    * 3.1: Display Basic Skia Line Graph Canvas
    * 3.2: Plot Aggregated Savings Balance on Graph
    * 3.3: Display Graph Placeholder for No Data/Loading
    * 5.2: Display Message for No Savings Data Available
    * *(Goal: User sees their aggregated savings on a static graph.)*

* **Sprint 4: Graph Interactivity & Default Timeframe**
    * 3.4: Implement Tap/Scrub Gesture on Graph
    * 3.5: Display Callout with Date/Balance on Graph Interaction
    * 4.9: Update Graph to Default Monthly View (ensure this is primary view)
    * 5.1: Display Error on API Connection Failure (Post-Setup)
    * 2.4: Implement Manual Refresh Button
    * *(Goal: User can interact with the graph and see monthly trend.)*

* **Sprint 5: Timeframe Selection Feature**
    * 2.5: Trigger Data Re-fetch on Manual Refresh
    * 4.6: Display Timeframe Selection Button
    * 4.7: Show Timeframe Options (Weekly, Monthly, Yearly)
    * 4.8: Update Graph to Weekly View
    * 4.10: Update Graph to Yearly View
    * *(Goal: User can switch between W, M, Y views.)*

* **Sprint 6: Account Filtering Feature**
    * 4.1: Display Account Filter Button
    * 4.2: Show List of Savings Accounts for Filtering
    * 4.3: Implement Account Toggle Functionality
    * 4.4: Update Graph on Account Filter Change
    * *(Goal: User can select specific savings accounts for the graph.)*

* **Sprint 7: Persistence & Polish**
    * 4.5: Persist Account Selection Preferences
    * 4.11: Persist Last Selected Timeframe
    * *(Buffer for any spillover, bug fixing, final PoC polish based on NFRs & DoD)*
    * *(Goal: App remembers user preferences and is stable.)*
