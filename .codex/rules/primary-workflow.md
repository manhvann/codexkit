# Primary Workflow

**IMPORTANT:** Analyze the skills catalog and activate the skills that are needed for the task during the process.
**IMPORTANT**: Ensure token efficiency while maintaining high quality.

#### 1. Code Implementation
- Before significant implementation, prefer `planner` agent to create an implementation plan with TODO tasks under the injected `Plan dir:` path when subagent delegation is available.
- When in planning phase, prefer multiple `researcher` agents in parallel for different relevant technical topics when subagent delegation is available.
- Write clean, readable, and maintainable code
- Follow established architectural patterns
- Implement features according to specifications
- Handle edge cases and error scenarios
- **DO NOT** create new enhanced files, update to the existing files directly.
- **[IMPORTANT]** After creating or modifying code file, run compile command/script to check for any compile errors.

#### 2. Testing
- Prefer `tester` agent to run tests on the **simplified code** when subagent delegation is available.
  - Write comprehensive unit tests
  - Ensure high code coverage
  - Test error scenarios
  - Validate performance requirements
- Tests verify the FINAL code that will be reviewed and merged
- **DO NOT** ignore failing tests just to pass the build.
- **IMPORTANT:** make sure you don't use fake data, mocks, cheats, tricks, temporary solutions, just to pass the build or github actions.
- **IMPORTANT:** Always fix failing tests follow the recommendations and rerun tests; prefer `tester` agent when available. Only finish your session when all required tests pass.

#### 3. Code Quality
- After testing passes, prefer `code_reviewer` agent to review clean, tested code when available; otherwise perform an inline review.
- Follow coding standards and conventions
- Write self-documenting code
- Add meaningful comments for complex logic
- Optimize for performance and maintainability

#### 4. Integration
- Always follow the plan given by `planner` agent
- Ensure seamless integration with existing code
- Follow API contracts precisely
- Maintain backward compatibility
- Document breaking changes
- Prefer `docs_manager` agent to update docs in the configured `Docs:` path directory if available and changes warrant docs updates.

#### 5. Debugging
- When a user reports bugs or issues on the server or a CI/CD pipeline, prefer `debugger` agent to run tests and analyze the summary report when available.
- Read the summary report from `debugger` agent and implement the fix.
- Prefer `tester` agent to run tests and analyze the summary report when available.
- If the `tester` agent reports failed tests, fix them follow the recommendations and repeat from the **Step 3**.

#### 6. Visual Explanations
When explaining complex code, protocols, or architecture:
- **When to use:** User asks "explain", "how does X work", "visualize", or topic has 3+ interacting components
- Use `$preview --explain <topic>` to generate visual explanation with ASCII + Mermaid
- Use `$preview --diagram <topic>` for architecture and data flow diagrams
- Use `$preview --slides <topic>` for step-by-step walkthroughs
- Use `$preview --ascii <topic>` for terminal-friendly output only
- **Plan context:** Visuals save to plan folder from `## Plan Context` hook injection; if none, use the injected `Plans:` path plus `visuals/`.
- Auto-opens in browser via markdown-novel-viewer with Mermaid rendering
- See `development-rules.md` → "Visual Aids" section for additional guidance
