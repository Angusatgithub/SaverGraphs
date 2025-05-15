---
description: Project setup and initial API key input implementation
globs:
alwaysApply: false
---

# Project Updates

## May 14, 2024 - Initial Setup and Stories 1.1-1.4

### Project Structure Setup
- Initialized React Native project with Expo and TypeScript
- Set up dark theme configuration in layout
- Created basic project structure with `app` and `components` directories
- Added proper TypeScript configuration

### Story 1.1: Display API Key Input
- Created reusable `ThemedText` component for consistent text styling across the app
- Implemented `ApiKeyInput` component with:
  - Secure text input field
  - Dark theme styling
  - Proper text input properties (secureTextEntry, autoCapitalize, autoCorrect)
- Updated main app screen to display the API key input
- Configured proper layout with dark theme and status bar settings

### Story 1.2: Implement API Key Submission
- Enhanced `ApiKeyInput` component with:
  - Added submit button with proper styling
  - Implemented loading state handling
  - Added button state management (disabled, pressed)
- Updated main app screen with:
  - Added API key submission handler
  - Implemented loading state management
  - Added placeholder for API validation
- Fixed component export issues:
  - Updated `ThemedText` to use default export
  - Fixed import statements accordingly

### Story 1.3: Validate API Key via Ping Utility
- Created Up API service with:
  - Implemented ping utility endpoint integration
  - Added proper error handling with custom `UpApiError` class
  - Added type-safe response handling
- Created `ErrorMessage` component for displaying validation errors
- Enhanced main app screen with:
  - Integrated API key validation
  - Added error state management
  - Implemented proper error display
  - Added success state placeholder

### Story 1.4: Display API Key Validation Success
- Created `SuccessMessage` component with:
  - Animated fade in/out transitions
  - Consistent styling with app theme
  - Completion callback support
- Added secure storage service:
  - Implemented API key storage using expo-secure-store
  - Added utility functions for key management
- Enhanced main app screen with:
  - Added success state management
  - Integrated secure API key storage
  - Added navigation to dashboard placeholder
- Created placeholder dashboard screen for future implementation

### Repository Setup
- Created comprehensive README.md with:
  - Project description
  - Feature list
  - Tech stack details
  - Setup instructions
  - Environment requirements
- Added MIT License
- Set up GitHub repository at https://github.com/Angusatgithub/SaverGraphs
- Pushed initial codebase to GitHub

### Code Organization
- Following component structure guidelines:
  - Components in dedicated directory
  - TypeScript for type safety
  - Proper file naming conventions
- Implemented dark theme by default
- Set up proper navigation structure with Expo Router
- Added services directory for API interactions and storage

### Next Steps
- Implement Story 1.5: Display API Key Validation Failure
- Enhance error handling with specific error messages
- Add retry functionality for failed validations

## May 15, 2024 - API Key Validation & UX Fixes

### Improved API Key Validation Logic
- Updated API key validation to accept the correct Up API format (`up:yeah:yourtoken`).
- Removed overly strict format checks that rejected valid tokens with colons.
- Now only checks for the correct prefix and valid token part.

### Robust Success/Error Handling
- Updated main app logic to treat any HTTP 200 response from the Up API as a valid key (no longer relies on emoji in response).
- Improved error handling: only shows error if an exception is thrown, otherwise proceeds to success.
- Ensured that a successful API key submission triggers a success message and navigates to the dashboard.
- Improved user feedback for both error and success states.

### UI/UX Enhancements
- Updated API key input helper text and placeholder to clearly show the required format (`up:yeah:yourtoken`).
- Added real-time validation and clearer error messages for invalid formats.

### Next Steps
- Proceed to implement Story 1.5: Display API Key Validation Failure with more granular error messages and retry options.

## May 15, 2024 - Auto-Login with Stored API Key (Story 1.7)

### Retrieve and Validate API Key on Launch
- On app launch, the app now checks for a stored API key using SecureStore.
- If a key is found, it is validated with the Up API ping endpoint.
- If valid, the user is automatically navigated to the dashboard, skipping the API key input screen.
- If not found or invalid, the API key input screen is shown as usual.
- Loading state is shown while checking for a stored key to prevent UI flicker.

### Testing
- Verified that entering a valid key and relaunching the app skips the input screen and goes straight to the dashboard.
- Verified that an invalid or missing key shows the input screen as expected.

## May 15, 2024 - Fetch and Display Accounts (Story 2.1)

### Fetch List of Accounts
- Implemented Up API integration to fetch all user accounts after login or auto-login.
- Added new service function to call the `/accounts` endpoint and parse the response.

### Display in Dashboard
- Updated dashboard to display each account's display name, type, and balance.
- Fixed bug: now uses `displayName` (not `name`) for account names, per Up API docs.
- Improved dashboard UI for account listing.

### Testing
- Verified that accounts are fetched and displayed with correct names, types, and balances after login.

## May 15, 2024 - Filter and Display Savings Accounts (Story 2.2)

### Filter for SAVER Accounts
- Updated logic to filter fetched accounts and only include those with `accountType === 'SAVER'` (savings accounts).
- Only savings accounts are now passed to and displayed in the dashboard.

### Dashboard Update
- Changed dashboard title to "Your Savings Accounts" for clarity.

### Testing
- Verified that only savings accounts are shown after login, and other account types are excluded from the dashboard list.

## May 15, 2024 - Fetch and Summarize Transactions (Story 2.3)

### Fetch Recent Transactions
- Implemented service function to fetch recent transactions (last 90 days) for each SAVER (savings) account from the Up API.
- After fetching accounts, the app now fetches transactions for each and stores a summary (count per account) in state.

### Dashboard Update
- Dashboard now displays the number of transactions (last 90 days) for each savings account.

### Testing
- Verified that transaction counts are fetched and displayed for each savings account after login.

## May 15, 2024 - Correct Transaction Processing (Story 3.0)

### Story 3.0: Process Transactions into Date/Balance Data Points
- Modified the `processBalances` helper function in `app/index.tsx`.
- The function now correctly calculates daily aggregated balances for saver accounts according to the acceptance criteria:
  - It determines each account's balance for days it had transactions using the `balanceAfter` of the last transaction of that day.
  - It collects all unique dates across all accounts that had transaction activity.
  - For each such unique date (sorted chronologically), it calculates an aggregated total balance.
  - If an account had a transaction on the current date, its `balanceAfter` is used.
  - If an account did *not* have a transaction on the current date, its most recently known `balanceAfter` (from a previous transaction day in the sorted list) is carried forward to the current date's aggregation.
  - If an account has had no transactions up to the current date in the sorted list, it contributes 0 to the aggregate until its first transaction.
- This ensures the `balanceSummary` (containing `dates` and `balances`) provided to the dashboard is accurate for future graph plotting.

## May 16, 2024 - Basic Graph Canvas (Story 3.1)

### Story 3.1: Display Basic Skia Line Graph Canvas
- Installed `@shopify/react-native-skia` library.
- Created `BalanceChart.tsx` component in `components/`.
- The component renders a React Native Skia `<Canvas>` element.
- Drew a simple line path using hardcoded data points as a placeholder.
- Integrated `BalanceChart` into the `DashboardScreen.tsx` for display.

## May 16, 2024 - Plot Aggregated Savings Balance (Story 3.2)

### Story 3.2: Plot Aggregated Savings Balance on Graph
- Updated `BalanceChart` to accept `dates` and `balances` as props.
- Scaled and mapped real savings data to chart coordinates.
- Rendered the line path using the actual aggregated balance data.
- Updated `Dashboard` to pass `balanceSummary` to the chart.
- Chart now displays the user's real savings trend over time.

## May 16, 2024 - Enhancement: Accurate Chart Range

- Updated BalanceChart to start the X-axis at the first real data point (not before).
- Y-axis now uses the true minimum balance in the data (not $0 unless $0 is present).
- This prevents misleading drops to zero and makes the graph more accurate and visually representative.

## May 16, 2024 - Enhancement: Chart Axis Labels

- Added Y-axis labels for min and max balance (always shows at least $0 and the highest balance).
- Added X-axis labels for the first and last date in the data.
- Labels styled for dark theme and positioned around the Skia canvas for clarity.

## May 16, 2024 - Bugfix: Carry-Forward Balance in processBalances

- Fixed the processBalances helper to correctly carry forward the last known balance for each account on days with no transaction.
- This prevents sudden drops to zero and ensures the savings graph is smooth and accurate.

## May 16, 2024 - Chart UI Improvements: Stock App Style

- Right-aligned both min and max balance labels, positioned at the top right and bottom right of the chart area.
- Added faint horizontal guide lines at the top and bottom of the chart.
- Adjusted the Y coordinate calculation so the graph line touches both guide lines when hitting min/max values.
- Ensured min/max labels are precisely aligned with their respective guide lines, mimicking the style of modern investment/stock apps.

## May 16, 2024 - Graph Placeholders (Story 3.3)

### Story 3.3: Display Graph Placeholder for No Data/Loading
- Updated `BalanceChart.tsx` to accept an `isLoading` prop.
- If `isLoading` is true, the chart displays a "Loading savings data..." message.
- If `isLoading` is false and no data (`dates` or `balances` are empty), the chart displays "No savings data to display." and renders a flat line at $0.
- Modified `app/dashboard.tsx` to accept `isLoading` prop and pass it to `BalanceChart`.
- Updated `app/index.tsx` to pass its `isLoading` state to the `Dashboard` component.
- This ensures the user sees appropriate feedback during data fetching or when no data is available for the chart.

## May 16, 2024 - Graph Touch/Scrub Gestures (Story 3.4)

### Story 3.4: Implement Tap/Scrub Gesture on Graph
- Refactored touch handling in `components/BalanceChart.tsx` to use `react-native-gesture-handler` instead of Skia's internal touch system.
- Imported `GestureDetector` and `Gesture` from `react-native-gesture-handler`.
- Added `GestureHandlerRootView` to `app/_layout.tsx` to enable gesture handling.
- Implemented a pan gesture (`Gesture.Pan()`) to detect tap/scrub actions.
- Used `useSharedValue` from `react-native-reanimated` to store touch state (`touchX`, `touchY`, `isActive`).
- Wrapped the chart view with `<GestureDetector>`.
- Touch coordinates (absolute within the component) are logged to the console during `onBegin` and `onUpdate` phases of the gesture, fulfilling the acceptance criteria for detecting touch coordinates.
- Corrected event payload types for gesture callbacks (e.g., `PanGestureHandlerEventPayload`).

## May 16, 2024 - Graph Interaction Callout (Story 3.5)

### Story 3.5: Display Callout with Date/Balance on Graph Interaction
- Implemented callout display in `components/BalanceChart.tsx`.
- Added React state (`useState`) to manage callout data (selected date, balance, position, visibility).
- In the `onUpdate` phase of the `panGesture` (from `react-native-gesture-handler`):
  - Calculated the closest data point (date/balance) based on the touch's X-coordinate relative to the chart.
  - Used `runOnJS` to update the React state with the selected data and calculated callout position from the gesture handler.
- Rendered a React Native `<View>` as the callout, absolutely positioned near the touch interaction point (above the data point on the graph line).
- The callout displays the formatted date and balance of the selected point.
- The callout appears during scrubbing and disappears when the gesture ends (`onEnd`).
- Ensured callout positioning attempts to stay within screen bounds.

### Story 3.5 Debugging Notes:
- Encountered a persistent runtime error where a locally defined helper function (`formatDateForCalloutLabel` or `formatDateLabel`) was being treated as an object (`typeof` reported "object") specifically when called from the gesture handler context, leading to "is not a function" or ".call is not a function" errors.
- Renaming, redefining as arrow function, and explicit `.call()` did not resolve the issue initially.
- The issue was resolved by keeping the date formatting logic for the callout *inlined* within the gesture handler's `onUpdate` callback (inside the `runOnJS` block). The axis label formatting, using the same helper function but called during the main render pass, worked correctly once the function definition was restored to avoid `ReferenceError`.
- This suggests a subtle issue with function references or closures in the Reanimated/Gesture Handler to JS thread bridge for that specific call path, or a bundler/runtime anomaly.

## May 16, 2024 - Default Monthly Graph View (Story 4.9)

### Story 4.9: Update Graph to Default Monthly View
- Added `currentTimeframe` state to `app/index.tsx`, defaulting to `'Monthly'` (other options `'All'` for now).
- Modified `processBalances` function to accept the `currentTimeframe`.
- The function first calculates the full 90-day balance history as before.
- If `currentTimeframe` is `'Monthly'`, it then filters this full history:
  - Determines the start (1st of current month) and end (today) dates for the current calendar month.
  - Extracts data points falling within this range.
  - Implemented logic to find the balance just before the current month started and prepends this balance as the data point for the 1st of the current month if no actual transaction data exists on the 1st but there was a prior balance.
  - If no transactions occurred in the current month, it displays the carried-forward balance from the start of the month for both the 1st and today's date (if different).
- This ensures the graph, by default, displays aggregated savings data for the current calendar month.

## May 16, 2024 - Account Filter Button (Story 4.1)

### Story 4.1: Display Account Filter Button
- Added a "Filter Accounts" button to the `Dashboard` screen (`app/dashboard.tsx`).
- The button is implemented using `TouchableOpacity` and `ThemedText` for styling consistent with the app theme.
- Positioned the button between the summary overview box and the balance chart.
- On press, the button currently logs a message to the console. Actual filter UI and logic will follow in subsequent stories.

## May 16, 2024 - Account Filter Modal UI (Story 4.2)

### Story 4.2: Show List of Savings Accounts for Filtering
- Created `AccountFilterModal.tsx` component in `components/`.
  - The modal takes `isVisible`, `onClose`, and `accounts` (list of `UpAccount`) as props.
  - It uses React Native's `Modal` component, styled for a dark theme.
  - It displays a list of savings accounts, each with its display name and a `Switch` toggle.
  - For this story, all switches default to an "on" state; their state management will be handled in Story 4.3.
  - A "Done" button is included in the modal to close it.
- Modified `app/dashboard.tsx`:
  - Added state (`isFilterModalVisible`) to manage the visibility of the filter modal.
  - Updated the "Filter Accounts" button's `onPress` handler to set `isFilterModalVisible` to true.
  - Rendered the `AccountFilterModal`, passing the visibility state, `onClose` handler, and the list of accounts.

## May 17, 2024 - Account Filter Toggle Logic (Story 4.3)

### Story 4.3: Implement Account Toggle Functionality
- Modified `components/AccountFilterModal.tsx`:
  - Added `initiallySelectedAccountIds` (optional) and `onSelectionChange` props.
  - Implemented internal state `selectedAccountIds`, initialized with `initiallySelectedAccountIds` or defaults to all account IDs if the prop is not provided.
  - Added a `useEffect` hook to reset `selectedAccountIds` if `isVisible`, `accounts`, or `initiallySelectedAccountIds` props change, ensuring the modal reflects the correct state when opened.
  - The `Switch` component for each account now derives its `value` from whether the account ID is in `selectedAccountIds`.
  - `onValueChange` for each `Switch` updates the `selectedAccountIds` state (toggling the specific account ID).
  - The "Done" button now calls `onSelectionChange` with the current `selectedAccountIds` before calling `onClose`.
- Modified `app/dashboard.tsx`:
  - Added state `selectedAccountIdsForChart`, initialized to all account IDs.
  - Added a `useEffect` hook to reset `selectedAccountIdsForChart` to all account IDs if the main `accounts` prop changes.
  - Passed `selectedAccountIdsForChart` as `initiallySelectedAccountIds` to `AccountFilterModal`.
  - Implemented `handleAccountSelectionChange` which updates `selectedAccountIdsForChart` based on the callback from the modal.
  - Currently logs the selected IDs; actual data filtering for the chart using these IDs will be done in Story 4.4.
- This allows users to toggle account selections in the modal, and the selections are communicated back to the dashboard screen, fulfilling the requirements of Story 4.3.

## May 17, 2024 - Update Graph on Account Filter Change (Story 4.4)

### Story 4.4: Update Graph on Account Filter Change
- Modified `app/index.tsx`:
  - Lifted `selectedAccountIdsForChart` state and `handleAccountSelectionChange` logic from `app/dashboard.tsx` to `app/index.tsx`.
  - Created a new state `allTransactions: Record<string, UpTransaction[]>` to store all fetched transactions, separating it from the summarized `transactionSummary`.
  - Refactored data fetching into a centralized `fetchDataAndProcessBalances` async function. This function fetches accounts, then all transactions, stores them, and then calls `processBalances`.
  - `handleApiKeySubmit` and the initial `useEffect` for stored key now call `fetchDataAndProcessBalances`. This function initializes `selectedAccountIdsForChart` to all saver accounts if it's the first load or if no specific selection was passed.
  - Modified `processBalances` to accept `selectedAccountIds: string[]` as a parameter. It now filters both the accounts to process and the transactions used for calculations based on these selected IDs. If no accounts are selected, it returns empty data for the chart.
  - Added a new `useEffect` hook that listens for changes in `selectedAccountIdsForChart` or `currentTimeframe`. When these change (and essential data like `apiKey`, `accounts`, `allTransactions` are available), it sets `isLoading` to true, re-calls `processBalances` with the current full set of transactions, all saver accounts, the current timeframe, and the updated `selectedAccountIdsForChart`, then updates `balanceSummary` and sets `isLoading` to false. This ensures the graph data is re-calculated and re-rendered.
  - Passed `selectedAccountIdsForChart` and `handleAccountSelectionChange` as props to the `Dashboard` component.
- Modified `app/dashboard.tsx`:
  - Removed the local `selectedAccountIdsForChart` state and its `useEffect`.
  - Updated `DashboardProps` to receive `selectedAccountIdsForChart` and `onAccountSelectionChange` from `app/index.tsx`.
  - Passed these props to `AccountFilterModal`.
- These changes ensure that when a user changes account selections in the filter modal, the graph updates to display data only for the selected accounts, with a loading indicator during reprocessing.

## May 17, 2024 - Verify API Key Validation Failure Display (Story 1.5)

### Story 1.5: Display API Key Validation Failure
- Reviewed the existing API key validation and error handling mechanisms in `app/index.tsx` and `app/services/upApi.ts`.
- The `handleApiKeySubmit` function in `app/index.tsx` already catches errors from `validateApiKey` (including `UpApiError` for specific failures like 401 or format issues) and sets an error message using `setError()`.
- The `ErrorMessage` component displays this error to the user.
- If API key validation fails, `accounts` remains `null`, and `isLoading` becomes `false`, which results in the `ApiKeyInput` component being re-displayed, allowing the user to attempt re-entry.
- The error messages provided by `UpApiError` (e.g., for 401: "Invalid API key. Please make sure you are using a valid Up Personal Access Token...") are clear and user-friendly.
- Conclusion: The acceptance criteria for Story 1.5 are met by the current implementation. No further code changes are required for this story.

## May 17, 2024 - Implement Manual Refresh Button (Story 2.4)

### Story 2.4: Implement Manual Refresh Button
- Modified `app/dashboard.tsx` to add a "Refresh Data" button.
- The button is placed next to the "Filter Accounts" button, achieved by wrapping both in a `View` with `flexDirection: 'row'` and `justifyContent: 'space-around'`.
- Added generic styles for `button` and `buttonText` to be shared, and specific styles for `filterButton` and `refreshButton` for their backgrounds.
- The `onPress` action for the "Refresh Data" button currently logs a message to the console; its full functionality will be implemented in Story 2.5.

## May 17, 2024 - Trigger Data Re-fetch on Manual Refresh (Story 2.5)

### Story 2.5: Trigger Data Re-fetch on Manual Refresh
- Modified `app/index.tsx`:
  - Created a new async function `handleRefreshData`.
  - This function checks if `apiKey` is set. If so, it clears any existing `error` or `success` messages and calls `fetchDataAndProcessBalances` with the current `apiKey`, `selectedAccountIdsForChart`, and `currentTimeframe`. After the data is fetched and processed, it sets a "Data refreshed successfully!" message.
  - If `apiKey` is not set, it sets an error message: "Cannot refresh data: API key is not set."
  - Passed `handleRefreshData` as a new prop `onRefreshData` to the `Dashboard` component.
- Modified `app/dashboard.tsx`:
  - Updated `DashboardProps` to include `onRefreshData: () => Promise<void>`.
  - Connected the `onPress` event of the "Refresh Data" button to this `onRefreshData` prop.
  - The button text now changes to "Refreshing..." and is disabled when `isLoading` is true.
- This allows the user to manually trigger a full data re-fetch and reprocessing by tapping the "Refresh Data" button, updating the displayed information.

## May 17, 2024 - Display Timeframe Selection Button (Story 4.6)

### Story 4.6: Display Timeframe Selection Button
- Modified `app/dashboard.tsx`:
  - Added a new "Timeframe: [Current]" button to the `actionButtonsContainer` alongside the Filter and Refresh buttons.
  - Updated `DashboardProps` to accept `currentTimeframe: 'Monthly' | 'All'`.
  - The button's text dynamically displays the current timeframe (e.g., "Timeframe: Monthly").
  - Added basic styling for the `timeframeButton`.
  - The `onPress` action currently logs a message; actual timeframe selection UI and logic will be handled in Story 4.7.
- Modified `app/index.tsx`:
  - Passed the `currentTimeframe` state to the `Dashboard` component as a prop.
- This makes a button visible for users to eventually change the graph's timeframe.

## May 17, 2024 - Refactored `app/dashboard.tsx` by breaking it down into smaller, reusable components: `DashboardHeader`, `SummaryDisplay`, `AccountListItem`, and `AccountSelector`.

### Story 4.7: Implement Timeframe Selection Logic
- Modified `app/index.tsx`:
  - Added a new state `currentTimeframe`, defaulting to `'Monthly'`.
  - Modified `processBalances` to accept `currentTimeframe` as a parameter.
  - Updated `processBalances` to use the new `currentTimeframe` state.
- Modified `app/dashboard.tsx`:
  - Added a new state `currentTimeframe`, defaulting to `'Monthly'`.
  - Updated `processBalances` to use the new `currentTimeframe` state.
- Created new files for these components in the `components` directory: `DashboardHeader`, `SummaryDisplay`, `AccountListItem`, and `AccountSelector`.
- Moved relevant JSX, logic, and styles to the new component files.
- Updated `app/dashboard.tsx` to import and use these new components, reducing its complexity and improving maintainability.

## May 17, 2024 - Persistence, Timeframe Refinements, and Period Navigation

### Story 4.5: Persist Account Selection Preferences
- Added `storeSelectedAccountIds` and `getStoredSelectedAccountIds` functions to `app/services/storage.ts`.
- Modified `app/index.tsx` to load stored account ID preferences on app launch.
- Selected account IDs are now saved to secure storage whenever the selection changes.
- Ensured that if no preference is stored (e.g., first time after API key setup), the default selection (all accounts) is stored as the initial preference.

### Story 4.11: Persist Last Selected Timeframe
- Added `storeTimeframe` and `getStoredTimeframe` functions to `app/services/storage.ts`.
- Modified `app/index.tsx` to load the stored timeframe preference on app launch.
- The selected timeframe is now saved to secure storage whenever it's changed by the user.
- The timeframe is reset to 'Monthly' (and this default is saved) when a new API key is successfully submitted.

### Timeframe and Data Fetching Refinements
- **Removed 'All' Timeframe Option:**
  - Updated `Timeframe` type and `TIMEFRAME_OPTIONS` in `components/TimeframeSelectionModal.tsx` to remove 'All'.
  - Removed the specific logic block for 'All' in `processBalances` in `app/index.tsx`.
- **Enhanced Data Fetching for Yearly View:**
  - Renamed `fetchRecentTransactions` to `fetchTransactions` in `app/services/upApi.ts`.
  - Modified `fetchTransactions` to accept optional `since` and `until` date parameters and a `pageSize` (defaulting to 100).
  - Updated `app/index.tsx` in `fetchDataAndProcessBalances` to call `fetchTransactions` to retrieve data for the last 365 days, providing more data for the 'Yearly' view.
- **Implemented Transaction Pagination:**
  - Further updated `fetchTransactions` in `app/services/upApi.ts` to handle paginated API responses from the Up API.
  - The function now iteratively fetches all pages of transactions using the `links.next` URL, ensuring all available transactions within the specified date range (e.g., last 365 days) are retrieved.
  - Fixed TypeScript linter errors related to type inference for `url`, `response`, and `pageData` by adding explicit types and an interface for the paginated response.

### Graph Period Navigation (Previous/Next Week, Month, Year)
- **State and Logic in `app/index.tsx`:**
  - Added `currentPeriodReferenceDate` state to track the reference point for graph period calculations.
  - Implemented `handlePreviousPeriod` and `handleNextPeriod` functions to adjust `currentPeriodReferenceDate`.
  - Modified `processBalances` to accept and use `currentPeriodReferenceDate` for calculating date ranges for 'Weekly', 'Monthly', and 'Yearly' views.
  - Updated `handleTimeframeChange` to reset `currentPeriodReferenceDate` to `new Date()` when the timeframe type is changed.
  - Ensured `currentPeriodReferenceDate` is passed to `fetchDataAndProcessBalances` and `processBalances` where needed.
- **UI in `components/SummaryDisplay.tsx`:**
  - Added "Previous" (`<`) and "Next" (`>`) navigation buttons.
  - Implemented logic to display the currently viewed period (e.g., "Mar 2023", "Week of Mar 6 - Mar 12") based on `currentPeriodReferenceDate` and `currentTimeframe`.
  - Added basic logic to disable the "Next" button if it would navigate into a future period.
- **Prop Drilling & Bug Fixes:**
  - Updated `DashboardProps` in `app/dashboard.tsx` to include new props for period navigation.
  - Ensured these new props (`currentPeriodReferenceDate`, `onPreviousPeriod`, `onNextPeriod`) are correctly passed from `app/index.tsx` through `app/dashboard.tsx` to `components/SummaryDisplay.tsx`, resolving a runtime error.
  - Corrected a variable scope issue for `const today = new Date()` within `processBalances` in `app/index.tsx` for accurate end-date capping in 'Monthly' and 'Yearly' views.

## May 17, 2024 - Refactored BalanceChart so the callout box is always fixed at the top of the chart container, centered above the selected data point, and added a faint vertical line from the callout to the chart point while scrubbing.

## May 18, 2024 - Refinements to Persistence, Callout, and Chart Logic

### Enhanced Persistence Logic (`app/index.tsx`)
- **Default Account Selection Storage:** If no account selection preference is found in storage upon app load (e.g., after initial API key setup), the system now defaults to selecting all available saver accounts. This default selection is then immediately stored, ensuring a consistent preference is always set.
- **`currentPeriodReferenceDate` Non-Persistence:** Clarified via comments and logic that the `currentPeriodReferenceDate` (used for graph period navigation) is intentionally not persisted between sessions. It defaults to the current day upon app launch or when a new API key is submitted.

### Balance Chart Enhancements (`components/BalanceChart.tsx`)
- **Callout Vertical Indicator Line:** Implemented a faint vertical line that visually connects the callout box (fixed at the top of the chart) to the corresponding data point on the graph line during touch/scrub interactions. This improves the user's ability to associate the callout information with the precise point on the chart.
- **Robust Y-Axis Range Calculation:** The logic for determining the Y-axis scale (`yRange`) has been made more robust to gracefully handle edge cases, such as when all balance data points are zero or when minimum and maximum balances are identical. This prevents potential division-by-zero errors and ensures the chart renders correctly in more scenarios.
- **Refined Layout Constants:** Introduced and utilized more specific layout constants (e.g., `CHART_BOTTOM_PADDING`, `CALLOUT_TOP_PADDING`, `CHART_TOP_OFFSET`) for finer control over the positioning of chart elements, particularly the callout and axis labels, leading to a more polished UI.
- **Improved Date Formatting Utility:** Enhanced the `formatDateForCalloutLabel` function with more comprehensive error checking (e.g., for invalid date strings or objects) to prevent runtime errors and ensure graceful failure if unexpected date formats are encountered.
- **Debugging Logs:** Maintained several `console.log` statements within the gesture handling logic (`panGesture` callbacks) to aid in diagnosing touch interaction behaviors. These are intended for ongoing development and debugging.
