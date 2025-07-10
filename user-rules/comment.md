# Code Commenting Guide

write valuable comments, not noise. Please adhere to the following principles:

## 1. Comment the "Why," Not the "What"

- Avoid commenting on obvious logic. Assume the code reader understands basic syntax.
- **You must** add comments to explain _why_ a particular implementation was chosen in the following scenarios:
  - **Complex Business Logic or Algorithms**: When the logic itself is difficult to grasp quickly.
  - **Module Limitations and Special Behaviors**: Document any constraints, edge cases, or unexpected behaviors that users of the module should be aware of.
  - **Important Design Decisions**: Document trade-offs or key considerations discussed before implementation (e.g., why one API was used over another).

## 2. Use JSDoc for High-Level Overviews

- For complex functions, classes, or modules, provide a high-level summary in the JSDoc at the top.
- If a function involves multiple steps or conditional branches, it is **strongly recommended** to use a list in the JSDoc to clarify the logical flow.

  ```typescript
  /**
   * Processes a payment request and handles different outcomes. The logic flow is as follows:
   *
   * 1. **Validation**: The incoming payment data is first validated against the schema.
   * 2. **Fraud Check**: A risk score is calculated.
   *
   *    - If the score is **high**, the transaction is immediately rejected with a 'fraud_risk' error.
   *    - If the score is **medium**, it's flagged for manual review and its status is set to 'pending'.
   *    - If the score is **low**, proceed to the next step.
   * 3. **Payment Gateway**: The request is sent to the payment provider.
   *
   *    - On **success**, the database is updated with the transaction ID and status is set to 'completed'.
   *    - On **failure**, the specific error from the gateway is logged and the status is set to 'failed'.
   * 4. **Notification**: A confirmation or failure email is sent to the user.
   */
  ```

## 3. Keep Comments in Sync with Code

- **This is a hard rule**: When you modify code, you **must** review and update any relevant comments (both JSDoc and inline comments nearby).
- If your change makes a comment inaccurate, update it immediately. An outdated comment is worse than no comment at all.
