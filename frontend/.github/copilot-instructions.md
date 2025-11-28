Use this file to outline the required workflow for this workspace.

- [ ] Verify that the `copilot-instructions.md` file in the `.github` directory is created.

- [ ] Clarify Project Requirements
  - Ask for project type, language, and frameworks if not specified. Skip if already provided.

- [ ] Scaffold the Project
  - Ensure that the previous step has been marked as completed.
  - Call the project setup tool with the `projectType` parameter.
  - Run the scaffolding command to create project files and folders using `.` as the working directory.
  - If no appropriate projectType is available, consult documentation or create the structure manually.

- [ ] Customize the Project
  - Confirm prior steps are complete before starting.
  - Develop a plan aligned with the user requirements and apply the modifications.
  - Skip this step only for "Hello World" projects.

- [ ] Install Required Extensions
  - Install only the extensions specified by the `get_project_setup_info` tool. Otherwise mark as skipped.

- [ ] Compile the Project
  - Make sure earlier steps are finished.
  - Install missing dependencies, run diagnostics, and resolve blocking issues.
  - Review markdown files for additional compile instructions.

- [ ] Create and Run Task
  - When needed, consult https://code.visualstudio.com/docs/debugtest/tasks.
  - Use the `create_and_run_task` helper to define a task if the project benefits from it.

- [ ] Launch the Project
  - Launch in debug mode only after confirming with the user.

- [ ] Ensure Documentation is Complete
  - Confirm `README.md` plus this file exist and describe the current project.
  - Remove stale guidance when the project changes.

## Execution Guidelines

**Progress tracking**

- Use the available todo list tool to mirror this checklist.
- Mark each item complete with a short summary.

**Communication rules**

- Avoid verbose explanations or full command outputs.
- Mention skipped steps briefly.

**Development rules**

- Treat the repo root (`.`) as the working directory unless told otherwise.
- Avoid adding media or links unless requested.
- Use placeholders only when necessary and clearly label them.

**Folder creation rules**

- Create new folders only when explicitly requested (besides `.vscode` for tasks).
- If scaffolding commands require a different folder structure, ask the user to recreate and reopen the workspace.

**Extension installation rules**

- Install only the extensions surfaced by `get_project_setup_info`.

**Project content rules**

- Default to "Hello World" when the user does not specify requirements.
- Keep generated components purposeful and scoped to the described workflow.

**Task completion definition**

- Project scaffolded and compiled without errors.
- `copilot-instructions.md` exists and is up to date.
- `README.md` documents install, run, and debug steps.
- User receives launching/debugging guidance.

Before starting a new task in the above plan, update progress in the plan.
